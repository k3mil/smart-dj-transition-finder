import type { MiniSet, Track, TransitionScore } from "@smart-dj/core";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface TransitionResponse {
  selectedTrack: Track;
  bestNext: TransitionScore | null;
  bestFive: TransitionScore[];
  playlistMatches: TransitionScore[];
  wholeMatches: TransitionScore[];
  miniSets: MiniSet[];
  sources: Array<{ source: string; warning?: string }>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`);
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
}

export async function uploadScreenshots(files: File[]) {
  const form = new FormData();
  files.slice(0, 17).forEach((file) => form.append("screenshots", file));
  const response = await fetch(`${API_URL}/api/playlist/ocr`, {
    method: "POST",
    body: form
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as {
    tracks: Track[];
    playlist: Track[];
    candidates: Array<{ id: string; title: string; artist: string; confidence: number }>;
    total: number;
  };
}
