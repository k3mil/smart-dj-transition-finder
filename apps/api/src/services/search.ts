import { makeTrack, seedPlaylistTracks, stableHash, type Track } from "@smart-dj/core";

export function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function tokenScore(query: string, track: Track) {
  const q = normalize(query);
  const haystack = normalize(`${track.title} ${track.artist}`);
  if (!q) return 0;
  if (haystack === q) return 1;
  if (haystack.includes(q)) return 0.9;
  const queryTokens = q.split(/\s+/).filter(Boolean);
  const hits = queryTokens.filter((token) => haystack.includes(token)).length;
  const prefix = normalize(track.title).startsWith(q) ? 0.2 : 0;
  return Math.min(1, hits / Math.max(1, queryTokens.length) * 0.65 + prefix);
}

export function searchTracks(query: string, tracks: Track[], limit = 12) {
  return tracks
    .map((track) => ({ track, score: tokenScore(query, track) }))
    .filter(({ score }) => score > 0.18)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ track, score }) => ({ ...track, confidence: Math.max(track.confidence, score) }));
}

export function createSyntheticSuggestions(query: string) {
  if (!query.trim()) return [];
  const library = [
    ["Somewhere Over the Rainbow", "Israel Kamakawiwo'ole"],
    ["SOMBRERO", "LHTH, Stachu & Learnhowtohustle"],
    ["SICKO MODE", "Travis Scott"],
    ["Runaway", "Kanye West"],
    ["Break It Off", "PinkPantheress"],
    ["Victory Lap Five", "Fred again.., Skepta, PlaqueBoyMax & Denzel Curry"],
    ["No More Parties in LA", "Kanye West"],
    ["BACKROOMS", "Playboi Carti & Travis Scott"]
  ];
  return library
    .filter(([title, artist]) => tokenScore(query, makeTrack(title, artist, "estimator")) > 0.1)
    .map(([title, artist]) => ({
      ...makeTrack(title, artist, "estimator"),
      id: `suggestion:${stableHash(`${title}:${artist}`).toString(16)}`,
      sourceLabel: "Sugestia wyszukiwania"
    }));
}

export const seededTracks = seedPlaylistTracks;
