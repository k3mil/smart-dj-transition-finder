import { z } from "zod";

export type SearchMode = "playlist" | "whole";

export type MixQuality = "perfect" | "clean" | "risky" | "clash";

export type SourceKind =
  | "playlist-seed"
  | "ocr"
  | "musicbrainz"
  | "listenbrainz"
  | "lastfm"
  | "spotify"
  | "estimator";

export type CamelotKey =
  | "1A"
  | "2A"
  | "3A"
  | "4A"
  | "5A"
  | "6A"
  | "7A"
  | "8A"
  | "9A"
  | "10A"
  | "11A"
  | "12A"
  | "1B"
  | "2B"
  | "3B"
  | "4B"
  | "5B"
  | "6B"
  | "7B"
  | "8B"
  | "9B"
  | "10B"
  | "11B"
  | "12B";

export const audioFeaturesSchema = z.object({
  bpm: z.number().min(40).max(220),
  key: z.string(),
  mode: z.enum(["major", "minor"]),
  camelot: z.string(),
  energy: z.number().min(0).max(1),
  danceability: z.number().min(0).max(1),
  valence: z.number().min(0).max(1),
  acousticness: z.number().min(0).max(1),
  instrumentalness: z.number().min(0).max(1),
  loudness: z.number().min(-60).max(0),
  durationMs: z.number().int().min(30_000).max(900_000),
  genre: z.string(),
  introEnergy: z.number().min(0).max(1),
  outroEnergy: z.number().min(0).max(1),
  introLoudness: z.number().min(-60).max(0),
  outroLoudness: z.number().min(-60).max(0),
  vocalDensity: z.number().min(0).max(1)
});

export type AudioFeatures = z.infer<typeof audioFeaturesSchema>;

export const trackSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().optional(),
  artworkUrl: z.string().optional(),
  appleMusicUrl: z.string().optional(),
  externalUrl: z.string().optional(),
  source: z.custom<SourceKind>(),
  sourceLabel: z.string(),
  confidence: z.number().min(0).max(1),
  features: audioFeaturesSchema,
  embedding: z.array(z.number()).optional()
});

export type Track = z.infer<typeof trackSchema>;

export interface TransitionBreakdown {
  harmonic: number;
  bpm: number;
  energy: number;
  loudness: number;
  genre: number;
  phrase: number;
  conflictPenalty: number;
}

export interface TransitionScore {
  from: Track;
  to: Track;
  score: number;
  bpmDelta: number;
  effectiveBpmDelta: number;
  keyCompatibility: string;
  harmonicConflict: boolean;
  mixQuality: MixQuality;
  crossfadeSeconds: number;
  notes: string[];
  breakdown: TransitionBreakdown;
}

export interface OcrTrackCandidate {
  id: string;
  title: string;
  artist: string;
  confidence: number;
  sourceImage?: string;
  rowText?: string;
}

export interface MiniSet {
  size: 5 | 10;
  tracks: Track[];
  averageScore: number;
  transitions: TransitionScore[];
}
