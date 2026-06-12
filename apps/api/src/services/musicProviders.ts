import { buildEmbedding, estimateAudioFeatures, makeTrack, stableHash, type Track } from "@smart-dj/core";
import { config } from "../config.js";
import { searchTracks } from "./search.js";

interface ProviderResult {
  tracks: Track[];
  source: string;
  warning?: string;
}

let spotifyTokenCache: { token: string; expiresAt: number } | null = null;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export async function searchMusicBrainz(query: string): Promise<ProviderResult> {
  if (!query.trim()) return { tracks: [], source: "MusicBrainz" };
  try {
    const url = new URL("https://musicbrainz.org/ws/2/recording/");
    url.searchParams.set("query", query);
    url.searchParams.set("fmt", "json");
    url.searchParams.set("limit", "12");
    const data = await fetchJson<{
      recordings?: Array<{
        id: string;
        title: string;
        length?: number;
        "artist-credit"?: Array<{ name?: string; artist?: { name?: string } }>;
        releases?: Array<{ title?: string }>;
        tags?: Array<{ name: string; count?: number }>;
      }>;
    }>(url.toString(), {
      headers: {
        "User-Agent": config.musicBrainzUserAgent,
        Accept: "application/json"
      }
    });

    const tracks =
      data.recordings?.map((recording) => {
        const artist =
          recording["artist-credit"]?.map((item) => item.artist?.name ?? item.name).filter(Boolean).join(", ") ??
          "Unknown artist";
        const features = estimateAudioFeatures(recording.title, artist);
        const genre = recording.tags?.[0]?.name ?? features.genre;
        const album = recording.releases?.[0]?.title;
        return {
          ...makeTrack(recording.title, artist, "musicbrainz", {
            ...features,
            durationMs: recording.length ?? features.durationMs,
            genre
          }),
          id: `musicbrainz:${recording.id}`,
          externalUrl: `https://musicbrainz.org/recording/${recording.id}`,
          sourceLabel: "MusicBrainz metadata + lokalna estymacja audio",
          confidence: 0.76,
          embedding: buildEmbedding({ ...features, genre }, `${recording.title} ${artist}`),
          ...(album ? { album } : {})
        };
      }) ?? [];
    return { tracks, source: "MusicBrainz" };
  } catch (error) {
    return {
      tracks: [],
      source: "MusicBrainz",
      warning: error instanceof Error ? error.message : "MusicBrainz request failed"
    };
  }
}

async function getSpotifyToken() {
  if (!config.spotifyClientId || !config.spotifyClientSecret) return null;
  if (spotifyTokenCache && spotifyTokenCache.expiresAt > Date.now() + 60_000) return spotifyTokenCache.token;
  const body = new URLSearchParams({ grant_type: "client_credentials" });
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.spotifyClientId}:${config.spotifyClientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token: string; expires_in: number };
  spotifyTokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function searchSpotify(query: string): Promise<ProviderResult> {
  const token = await getSpotifyToken();
  if (!token) return { tracks: [], source: "Spotify", warning: "Spotify credentials are not configured" };
  try {
    const url = new URL("https://api.spotify.com/v1/search");
    url.searchParams.set("q", query);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", "10");
    const data = await fetchJson<{
      tracks?: {
        items?: Array<{
          id: string;
          name: string;
          duration_ms: number;
          external_urls?: { spotify?: string };
          album?: { name?: string; images?: Array<{ url: string }> };
          artists?: Array<{ name: string }>;
        }>;
      };
    }>(url.toString(), { headers: { Authorization: `Bearer ${token}` } });

    const tracks =
      data.tracks?.items?.map((item) => {
        const artist = item.artists?.map((entry) => entry.name).join(", ") || "Unknown artist";
        const artworkUrl = item.album?.images?.[0]?.url;
        const externalUrl = item.external_urls?.spotify;
        const album = item.album?.name;
        return {
          ...makeTrack(item.name, artist, "spotify", { durationMs: item.duration_ms }),
          id: `spotify:${item.id}`,
          sourceLabel: "Spotify search + lokalna estymacja audio",
          confidence: 0.8,
          ...(album ? { album } : {}),
          ...(artworkUrl ? { artworkUrl } : {}),
          ...(externalUrl ? { externalUrl } : {})
        };
      }) ?? [];
    return { tracks, source: "Spotify" };
  } catch (error) {
    return { tracks: [], source: "Spotify", warning: error instanceof Error ? error.message : "Spotify request failed" };
  }
}

export async function searchLastFm(query: string): Promise<ProviderResult> {
  if (!config.lastFmApiKey) return { tracks: [], source: "Last.fm", warning: "LASTFM_API_KEY is not configured" };
  try {
    const url = new URL("https://ws.audioscrobbler.com/2.0/");
    url.searchParams.set("method", "track.search");
    url.searchParams.set("track", query);
    url.searchParams.set("api_key", config.lastFmApiKey);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "10");
    const data = await fetchJson<{
      results?: {
        trackmatches?: {
          track?: Array<{
            name: string;
            artist: string;
            url?: string;
            image?: Array<{ "#text": string }>;
          }>;
        };
      };
    }>(url.toString());
    const tracks =
      data.results?.trackmatches?.track?.map((item) => {
        const artworkUrl = item.image?.find((image) => image["#text"])?.["#text"];
        return {
          ...makeTrack(item.name, item.artist, "lastfm"),
          id: `lastfm:${stableHash(`${item.name}:${item.artist}`).toString(16)}`,
          sourceLabel: "Last.fm search + lokalna estymacja audio",
          confidence: 0.73,
          ...(artworkUrl ? { artworkUrl } : {}),
          ...(item.url ? { externalUrl: item.url } : {})
        };
      }) ?? [];
    return { tracks, source: "Last.fm" };
  } catch (error) {
    return { tracks: [], source: "Last.fm", warning: error instanceof Error ? error.message : "Last.fm request failed" };
  }
}

export async function getWholeInternetCandidates(query: string, playlistTracks: Track[]) {
  const providerResults = await Promise.all([searchMusicBrainz(query), searchSpotify(query), searchLastFm(query)]);
  const external = providerResults.flatMap((result) => result.tracks);
  const localFallback = searchTracks(query, playlistTracks, 6).map((track) => ({
    ...track,
    id: `whole-inspired:${track.id}`,
    source: "estimator" as const,
    sourceLabel: "Podobne do Twojej playlisty"
  }));
  const seen = new Map<string, Track>();
  for (const track of [...external, ...localFallback]) {
    const key = `${track.title.toLowerCase()}::${track.artist.toLowerCase()}`;
    if (!seen.has(key)) seen.set(key, track);
  }
  return {
    tracks: [...seen.values()],
    sources: providerResults.map(({ source, warning }) => ({ source, warning })).filter((item) => item.warning || item.source)
  };
}
