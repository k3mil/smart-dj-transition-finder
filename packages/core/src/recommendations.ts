import { rankTransitions, scoreTransition } from "./scoring.js";
import type { MiniSet, Track, TransitionScore } from "./types.js";

export function bestNextTrack(from: Track, candidates: Track[]) {
  return rankTransitions(from, candidates, 1)[0] ?? null;
}

export function buildMiniSet(from: Track, candidates: Track[], size: 5 | 10): MiniSet {
  const selected: Track[] = [from];
  const remaining = new Map(candidates.filter((track) => track.id !== from.id).map((track) => [track.id, track]));
  const transitions: TransitionScore[] = [];

  while (selected.length < size && remaining.size > 0) {
    const current = selected[selected.length - 1] ?? from;
    const ranked = rankTransitions(current, [...remaining.values()], 8);
    const noveltyAdjusted = ranked
      .map((transition) => {
        const repeatedArtist = selected.some((track) => track.artist === transition.to.artist);
        return {
          transition,
          value: transition.score - (repeatedArtist ? 6 : 0) + transition.to.features.danceability * 3
        };
      })
      .sort((a, b) => b.value - a.value);
    const next = noveltyAdjusted[0]?.transition;
    if (!next) break;
    selected.push(next.to);
    transitions.push(scoreTransition(current, next.to));
    remaining.delete(next.to.id);
  }

  const averageScore =
    transitions.length === 0 ? 0 : Math.round(transitions.reduce((sum, item) => sum + item.score, 0) / transitions.length);

  return { size, tracks: selected, transitions, averageScore };
}

export function combinedWholeCandidates(playlist: Track[], external: Track[], from: Track) {
  const playlistArtists = new Set(playlist.map((track) => track.artist.toLowerCase()));
  const rankedPlaylist = rankTransitions(from, playlist, 10).map((transition) => transition.to);
  const boostedExternal = external.map((track) => ({
    ...track,
    confidence: Math.min(1, track.confidence + (playlistArtists.has(track.artist.toLowerCase()) ? 0.08 : 0))
  }));
  return [...rankedPlaylist, ...boostedExternal];
}
