import { toCamelot } from "./camelot.js";
import type { AudioFeatures, SourceKind, Track } from "./types.js";

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

const RAP_HINTS = [
  "kanye",
  "playboi",
  "travis",
  "rusina",
  "mlody",
  "młody",
  "okekel",
  "javier",
  "lil",
  "yeat",
  "wayne",
  "malik",
  "spazma",
  "kamil",
  "drabusheyka",
  "37",
  "kidzlori",
  "yung",
  "carti"
];

const CLUB_HINTS = ["disclosure", "fred again", "pinkpantheress", "dance", "mode", "party", "tańce", "break it off"];
const MELANCHOLIC_HINTS = ["runaway", "wolves", "lata", "cry", "bez", "ocean", "last breath", "losing"];

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function pickGenre(text: string) {
  const lower = text.toLowerCase();
  if (CLUB_HINTS.some((hint) => lower.includes(hint))) return "club rap / electronic";
  if (RAP_HINTS.some((hint) => lower.includes(hint))) return "polish trap / rage rap";
  if (lower.includes("kanye") || lower.includes("ye")) return "hip-hop";
  return "alt rap";
}

export function estimateAudioFeatures(title: string, artist: string): AudioFeatures {
  const text = `${title} ${artist}`;
  const hash = stableHash(text.toLowerCase());
  const jitter = (shift: number) => ((hash >> shift) & 255) / 255;
  const genre = pickGenre(text);
  const club = genre.includes("electronic");
  const rap = genre.includes("rap") || genre.includes("trap") || genre.includes("hip-hop");
  const sad = MELANCHOLIC_HINTS.some((hint) => text.toLowerCase().includes(hint));

  const baseBpm = club ? 126 : rap ? 142 : 116;
  const bpm = Math.round(baseBpm + (jitter(0) - 0.5) * (club ? 18 : 28));
  const key = KEYS[hash % KEYS.length] ?? "C";
  const mode = sad || jitter(8) < 0.62 ? "minor" : "major";
  const energy = clamp((club ? 0.76 : 0.66) + (jitter(16) - 0.5) * 0.34 - (sad ? 0.1 : 0));
  const danceability = clamp((club ? 0.82 : 0.7) + (jitter(20) - 0.5) * 0.24);
  const valence = clamp((sad ? 0.32 : 0.52) + (jitter(4) - 0.5) * 0.42);
  const acousticness = clamp((sad ? 0.18 : 0.08) + jitter(12) * 0.18);
  const instrumentalness = clamp((club ? 0.08 : 0.02) + jitter(24) * 0.1);
  const loudness = -1 * (5 + Math.round(jitter(6) * 8 * 10) / 10);
  const durationMs = Math.round((130 + jitter(10) * 170) * 1000);
  const introEnergy = clamp(energy - 0.14 + jitter(14) * 0.22);
  const outroEnergy = clamp(energy - 0.1 + jitter(18) * 0.26);

  return {
    bpm,
    key,
    mode,
    camelot: toCamelot(key, mode),
    energy,
    danceability,
    valence,
    acousticness,
    instrumentalness,
    loudness,
    durationMs,
    genre,
    introEnergy,
    outroEnergy,
    introLoudness: Math.max(-60, loudness - 1.5 + jitter(2) * 3),
    outroLoudness: Math.max(-60, loudness - 1.8 + jitter(22) * 3.2),
    vocalDensity: clamp(rap ? 0.68 + jitter(26) * 0.22 : 0.38 + jitter(26) * 0.22)
  };
}

export function makeTrack(
  title: string,
  artist: string,
  source: SourceKind = "playlist-seed",
  overrides: Partial<AudioFeatures> = {}
): Track {
  const features = { ...estimateAudioFeatures(title, artist), ...overrides } as AudioFeatures;
  return {
    id: `${source}:${stableHash(`${title}:${artist}`).toString(16)}`,
    title,
    artist,
    source,
    sourceLabel: source === "playlist-seed" ? "Twoja playlista" : "Estymator audio",
    confidence: source === "playlist-seed" ? 0.86 : 0.72,
    features,
    embedding: buildEmbedding(features, `${title} ${artist}`)
  };
}

export function buildEmbedding(features: AudioFeatures, text = ""): number[] {
  const hash = stableHash(text);
  return [
    features.bpm / 220,
    features.energy,
    features.danceability,
    features.valence,
    (features.loudness + 60) / 60,
    features.acousticness,
    features.instrumentalness,
    features.vocalDensity,
    ((hash >> 1) & 127) / 127,
    ((hash >> 9) & 127) / 127
  ];
}
