import { harmonicCompatibility, qualityFromScore } from "./camelot.js";
import type { Track, TransitionScore } from "./types.js";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function similarity(delta: number, tolerance: number) {
  return clamp(1 - Math.abs(delta) / tolerance);
}

export function effectiveBpmDelta(fromBpm: number, toBpm: number) {
  const candidates = [toBpm, toBpm / 2, toBpm * 2].map((candidate) => ({
    adjusted: candidate,
    delta: Math.abs(fromBpm - candidate)
  }));
  candidates.sort((a, b) => a.delta - b.delta);
  return candidates[0]?.delta ?? Math.abs(fromBpm - toBpm);
}

export function genreSimilarity(left: string, right: string) {
  const leftTokens = new Set(left.toLowerCase().split(/[^a-z0-9ąćęłńóśźż]+/).filter(Boolean));
  const rightTokens = new Set(right.toLowerCase().split(/[^a-z0-9ąćęłńóśźż]+/).filter(Boolean));
  if (!leftTokens.size || !rightTokens.size) return 0.4;
  const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0.4 : intersection / union;
}

export function vectorSimilarity(left: number[] = [], right: number[] = []) {
  if (!left.length || left.length !== right.length) return 0;
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const l = left[index] ?? 0;
    const r = right[index] ?? 0;
    dot += l * r;
    leftNorm += l * l;
    rightNorm += r * r;
  }
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

export function scoreTransition(from: Track, to: Track): TransitionScore {
  const harmonic = harmonicCompatibility(from.features.camelot, to.features.camelot);
  const bpmDelta = Math.abs(from.features.bpm - to.features.bpm);
  const effectiveDelta = effectiveBpmDelta(from.features.bpm, to.features.bpm);
  const bpm = similarity(effectiveDelta, 18);
  const energy = similarity(from.features.outroEnergy - to.features.introEnergy, 0.46);
  const loudness = similarity(from.features.outroLoudness - to.features.introLoudness, 8);
  const genre = genreSimilarity(from.features.genre, to.features.genre);
  const valence = similarity(from.features.valence - to.features.valence, 0.55);
  const phrase = clamp((energy * 0.45 + loudness * 0.25 + valence * 0.2 + to.features.danceability * 0.1));
  const conflictPenalty = harmonic.conflict ? 0.12 + Math.min(0.16, harmonic.distance * 0.025) : 0;

  const weighted =
    harmonic.score * 0.35 +
    bpm * 0.25 +
    energy * 0.2 +
    genre * 0.1 +
    loudness * 0.1 +
    phrase * 0.05 -
    conflictPenalty;

  const score = Math.round(clamp(weighted, 0, 1) * 100);
  const crossfadeSeconds = Math.round(clamp(6 + (1 - effectiveDelta / 18) * 6 + energy * 3, 4, 14));
  const mixQuality = qualityFromScore(score, harmonic.conflict);
  const notes = [
    harmonic.label,
    effectiveDelta <= 3 ? "tempo lock" : effectiveDelta <= 8 ? "small tempo ride" : "needs tempo work",
    energy >= 0.78 ? "similar intro/outro energy" : "energy contrast",
    loudness >= 0.75 ? "loudness sits well" : "watch gain"
  ];

  return {
    from,
    to,
    score,
    bpmDelta,
    effectiveBpmDelta: Number(effectiveDelta.toFixed(1)),
    keyCompatibility: harmonic.label,
    harmonicConflict: harmonic.conflict,
    mixQuality,
    crossfadeSeconds,
    notes,
    breakdown: {
      harmonic: Math.round(harmonic.score * 100),
      bpm: Math.round(bpm * 100),
      energy: Math.round(energy * 100),
      loudness: Math.round(loudness * 100),
      genre: Math.round(genre * 100),
      phrase: Math.round(phrase * 100),
      conflictPenalty: Math.round(conflictPenalty * 100)
    }
  };
}

export function rankTransitions(from: Track, candidates: Track[], limit = 20) {
  return candidates
    .filter((candidate) => candidate.id !== from.id)
    .map((candidate) => scoreTransition(from, candidate))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
