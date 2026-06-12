import { Pool } from "pg";
import type { Track, TransitionScore } from "@smart-dj/core";
import { config } from "./config.js";

const pool = config.databaseUrl ? new Pool({ connectionString: config.databaseUrl }) : null;

export async function checkDatabase() {
  if (!pool) return { connected: false, reason: "DATABASE_URL is not configured" };
  try {
    await pool.query("select 1");
    return { connected: true };
  } catch (error) {
    return { connected: false, reason: error instanceof Error ? error.message : "Unknown database error" };
  }
}

export async function upsertTrack(track: Track) {
  if (!pool) return;
  await pool.query(
    `
      insert into tracks (
        id, title, artist, album, artwork_url, apple_music_url, external_url, source, source_label, confidence,
        bpm, key_name, mode, camelot, energy, danceability, valence, acousticness, instrumentalness, loudness,
        duration_ms, genre, intro_energy, outro_energy, intro_loudness, outro_loudness, vocal_density, embedding
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28
      )
      on conflict (id) do update set
        title = excluded.title,
        artist = excluded.artist,
        album = excluded.album,
        artwork_url = excluded.artwork_url,
        external_url = excluded.external_url,
        source_label = excluded.source_label,
        confidence = excluded.confidence,
        bpm = excluded.bpm,
        key_name = excluded.key_name,
        mode = excluded.mode,
        camelot = excluded.camelot,
        energy = excluded.energy,
        danceability = excluded.danceability,
        valence = excluded.valence,
        acousticness = excluded.acousticness,
        instrumentalness = excluded.instrumentalness,
        loudness = excluded.loudness,
        duration_ms = excluded.duration_ms,
        genre = excluded.genre,
        intro_energy = excluded.intro_energy,
        outro_energy = excluded.outro_energy,
        intro_loudness = excluded.intro_loudness,
        outro_loudness = excluded.outro_loudness,
        vocal_density = excluded.vocal_density,
        embedding = excluded.embedding,
        updated_at = now()
    `,
    [
      track.id,
      track.title,
      track.artist,
      track.album ?? null,
      track.artworkUrl ?? null,
      track.appleMusicUrl ?? null,
      track.externalUrl ?? null,
      track.source,
      track.sourceLabel,
      track.confidence,
      track.features.bpm,
      track.features.key,
      track.features.mode,
      track.features.camelot,
      track.features.energy,
      track.features.danceability,
      track.features.valence,
      track.features.acousticness,
      track.features.instrumentalness,
      track.features.loudness,
      track.features.durationMs,
      track.features.genre,
      track.features.introEnergy,
      track.features.outroEnergy,
      track.features.introLoudness,
      track.features.outroLoudness,
      track.features.vocalDensity,
      track.embedding ? `[${track.embedding.join(",")}]` : null
    ]
  );
}

export async function saveTransition(score: TransitionScore, mode: "playlist" | "whole") {
  if (!pool) return;
  await pool.query(
    `
      insert into transition_events (
        from_track_id, to_track_id, score, bpm_delta, key_compatibility, mix_quality, mode
      )
      values ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      score.from.id,
      score.to.id,
      score.score,
      score.bpmDelta,
      score.keyCompatibility,
      score.mixQuality,
      mode
    ]
  );
}

export async function saveOcrImport(sourceName: string, rawText: string, candidateCount: number) {
  if (!pool) return;
  await pool.query(
    "insert into playlist_imports (source_name, raw_text, candidate_count) values ($1, $2, $3)",
    [sourceName, rawText, candidateCount]
  );
}
