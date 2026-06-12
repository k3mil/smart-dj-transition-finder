import type { OcrTrackCandidate } from "./types.js";
import { stableHash } from "./estimator.js";

const NOISE_PATTERNS = [
  /^play$/i,
  /^add music$/i,
  /^suggested songs$/i,
  /^preview and add/i,
  /^\d{1,2}:\d{2}/,
  /^\d+\s+songs/i,
  /^just updated$/i,
  /^kamil pop$/i,
  /^5g$/i
];

function cleanLine(line: string) {
  return line
    .replace(/\bE\b/g, "")
    .replace(/[•·]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoise(line: string) {
  const cleaned = cleanLine(line);
  return cleaned.length < 2 || NOISE_PATTERNS.some((pattern) => pattern.test(cleaned));
}

export function parseAppleMusicOcrText(text: string, sourceImage?: string): OcrTrackCandidate[] {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => !isNoise(line));

  const candidates: OcrTrackCandidate[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const title = lines[index];
    const artist = lines[index + 1];
    if (!title || !artist) continue;
    const titleLooksLikeSong = /[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż0-9]/.test(title) && title.length <= 80;
    const artistLooksLikeArtist = /[A-ZĄĆĘŁŃÓŚŹŻa-ząćęłńóśźż0-9]/.test(artist) && artist.length <= 90;
    const nextLooksLikeMenu = /^\.\.\.|^download$/i.test(artist);
    if (titleLooksLikeSong && artistLooksLikeArtist && !nextLooksLikeMenu) {
      const candidate: OcrTrackCandidate = {
        id: `ocr:${stableHash(`${title}:${artist}`).toString(16)}`,
        title,
        artist,
        confidence: title === title.toUpperCase() ? 0.78 : 0.72,
        rowText: `${title} - ${artist}`
      };
      if (sourceImage) candidate.sourceImage = sourceImage;
      candidates.push(candidate);
      index += 1;
    }
  }

  const dedup = new Map<string, OcrTrackCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.title.toLowerCase()}::${candidate.artist.toLowerCase()}`;
    const previous = dedup.get(key);
    if (!previous || previous.confidence < candidate.confidence) dedup.set(key, candidate);
  }
  return [...dedup.values()];
}
