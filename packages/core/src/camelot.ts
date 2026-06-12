import type { CamelotKey, MixQuality } from "./types.js";

const MAJOR_BY_PITCH_CLASS: Record<number, CamelotKey> = {
  0: "8B",
  1: "3B",
  2: "10B",
  3: "5B",
  4: "12B",
  5: "7B",
  6: "2B",
  7: "9B",
  8: "4B",
  9: "11B",
  10: "6B",
  11: "1B"
};

const MINOR_BY_PITCH_CLASS: Record<number, CamelotKey> = {
  0: "5A",
  1: "12A",
  2: "7A",
  3: "2A",
  4: "9A",
  5: "4A",
  6: "11A",
  7: "6A",
  8: "1A",
  9: "8A",
  10: "3A",
  11: "10A"
};

const PITCH_CLASS_BY_NAME: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11
};

export function toCamelot(key: string, mode: "major" | "minor"): CamelotKey {
  const pitchClass = PITCH_CLASS_BY_NAME[key] ?? 0;
  return (mode === "major" ? MAJOR_BY_PITCH_CLASS[pitchClass] : MINOR_BY_PITCH_CLASS[pitchClass]) ?? "8A";
}

export function parseCamelot(camelot: string): { number: number; letter: "A" | "B" } {
  const match = /^(\d{1,2})([AB])$/.exec(camelot);
  if (!match) return { number: 8, letter: "A" };
  return { number: Number(match[1]), letter: match[2] as "A" | "B" };
}

export function wheelDistance(a: string, b: string): number {
  const left = parseCamelot(a);
  const right = parseCamelot(b);
  const raw = Math.abs(left.number - right.number);
  return Math.min(raw, 12 - raw);
}

export function harmonicCompatibility(fromCamelot: string, toCamelot: string) {
  const from = parseCamelot(fromCamelot);
  const to = parseCamelot(toCamelot);
  const distance = wheelDistance(fromCamelot, toCamelot);
  const sameNumber = from.number === to.number;
  const sameLetter = from.letter === to.letter;
  const adjacent = distance === 1 && sameLetter;
  const relative = sameNumber && !sameLetter;
  const energyBoost = distance === 2 && sameLetter;
  const blendDown = distance === 1 && !sameLetter;

  let score = 0;
  let label = "harmonic clash";
  let conflict = true;

  if (fromCamelot === toCamelot) {
    score = 1;
    label = "same key";
    conflict = false;
  } else if (adjacent) {
    score = 0.92;
    label = "adjacent Camelot";
    conflict = false;
  } else if (relative) {
    score = 0.88;
    label = "relative major/minor";
    conflict = false;
  } else if (energyBoost) {
    score = 0.76;
    label = "energy lift";
    conflict = false;
  } else if (blendDown) {
    score = 0.62;
    label = "soft blend";
    conflict = false;
  } else if (distance === 3) {
    score = 0.34;
    label = "noticeable tension";
  } else {
    score = 0.18;
  }

  return { score, label, conflict, distance };
}

export function qualityFromScore(score: number, harmonicConflict: boolean): MixQuality {
  if (score >= 88 && !harmonicConflict) return "perfect";
  if (score >= 74 && !harmonicConflict) return "clean";
  if (score >= 58) return "risky";
  return "clash";
}

export const CAMELOT_KEYS: CamelotKey[] = [
  "1A",
  "2A",
  "3A",
  "4A",
  "5A",
  "6A",
  "7A",
  "8A",
  "9A",
  "10A",
  "11A",
  "12A",
  "1B",
  "2B",
  "3B",
  "4B",
  "5B",
  "6B",
  "7B",
  "8B",
  "9B",
  "10B",
  "11B",
  "12B"
];
