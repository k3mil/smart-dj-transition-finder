import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import {
  buildMiniSet,
  makeTrack,
  mergeTracks,
  rankTransitions,
  seedPlaylistTracks,
  trackSchema,
  type Track
} from "@smart-dj/core";
import { checkDatabase, saveOcrImport, saveTransition, upsertTrack } from "./db.js";
import { getWholeInternetCandidates } from "./services/musicProviders.js";
import { runOcrOnScreenshots, tracksFromEditedCandidates } from "./services/ocr.js";
import { createSyntheticSuggestions, searchTracks } from "./services/search.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 17,
    fileSize: 8 * 1024 * 1024
  }
});

let playlistTracks: Track[] = seedPlaylistTracks;

export const routes = Router();

routes.get("/health", async (_request, response) => {
  response.json({
    ok: true,
    database: await checkDatabase(),
    playlistTracks: playlistTracks.length
  });
});

routes.get("/playlist", (_request, response) => {
  response.json({ tracks: playlistTracks, total: playlistTracks.length });
});

routes.post("/playlist/ocr", upload.array("screenshots", 17), async (request, response, next) => {
  try {
    const files = (request.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) {
      response.status(400).json({ error: "Upload at least one screenshot" });
      return;
    }
    const result = await runOcrOnScreenshots(files);
    playlistTracks = mergeTracks(playlistTracks, result.tracks);
    await Promise.all(result.tracks.map(upsertTrack));
    await saveOcrImport(
      files.map((file) => file.originalname).join(", "),
      result.rawText,
      result.candidates.length
    );
    response.json({
      tracks: result.tracks,
      candidates: result.candidates,
      playlist: playlistTracks,
      total: playlistTracks.length
    });
  } catch (error) {
    next(error);
  }
});

routes.post("/playlist/candidates", async (request, response, next) => {
  try {
    const body = z
      .object({
        candidates: z.array(z.object({ title: z.string().min(1), artist: z.string().min(1), confidence: z.number().optional() }))
      })
      .parse(request.body);
    const tracks = tracksFromEditedCandidates(body.candidates);
    playlistTracks = mergeTracks(playlistTracks, tracks);
    await Promise.all(tracks.map(upsertTrack));
    response.json({ tracks, playlist: playlistTracks, total: playlistTracks.length });
  } catch (error) {
    next(error);
  }
});

routes.patch("/playlist/tracks/:id", async (request, response, next) => {
  try {
    const body = z.object({ title: z.string().min(1), artist: z.string().min(1) }).parse(request.body);
    const index = playlistTracks.findIndex((track) => track.id === request.params.id);
    if (index === -1) {
      response.status(404).json({ error: "Track not found" });
      return;
    }
    const previous = playlistTracks[index];
    if (!previous) {
      response.status(404).json({ error: "Track not found" });
      return;
    }
    const updated = {
      ...makeTrack(body.title, body.artist, previous.source),
      id: previous.id,
      sourceLabel: previous.sourceLabel,
      confidence: 0.96
    };
    playlistTracks[index] = updated;
    await upsertTrack(updated);
    response.json({ track: updated });
  } catch (error) {
    next(error);
  }
});

routes.get("/search", async (request, response, next) => {
  try {
    const query = String(request.query.q ?? "");
    const mode = request.query.mode === "whole" ? "whole" : "playlist";
    const playlist = searchTracks(query, playlistTracks, 12);
    const synthetic = createSyntheticSuggestions(query);
    if (mode === "playlist") {
      response.json({ query, mode, tracks: [...playlist, ...synthetic].slice(0, 12), sources: ["playlist"] });
      return;
    }
    const whole = await getWholeInternetCandidates(query, playlistTracks);
    response.json({
      query,
      mode,
      tracks: mergeTracks([...playlist, ...synthetic], whole.tracks).slice(0, 20),
      sources: whole.sources
    });
  } catch (error) {
    next(error);
  }
});

routes.post("/tracks/analyze", async (request, response, next) => {
  try {
    const body = z.object({ title: z.string().min(1), artist: z.string().default("Unknown artist") }).parse(request.body);
    const track = makeTrack(body.title, body.artist, "estimator");
    await upsertTrack(track);
    response.json({ track });
  } catch (error) {
    next(error);
  }
});

routes.post("/transitions", async (request, response, next) => {
  try {
    const body = z
      .object({
        query: z.string().optional(),
        track: trackSchema.optional(),
        playlistOnly: z.boolean().default(true)
      })
      .parse(request.body);

    const selected =
      body.track ??
      (body.query ? searchTracks(body.query, playlistTracks, 1)[0] ?? createSyntheticSuggestions(body.query)[0] : undefined);

    if (!selected) {
      response.status(404).json({ error: "No selected track could be resolved" });
      return;
    }

    const whole = body.playlistOnly ? { tracks: [], sources: [] } : await getWholeInternetCandidates(body.query ?? selected.title, playlistTracks);
    const playlistMatches = rankTransitions(selected, playlistTracks, 20);
    const wholeMatches = body.playlistOnly ? [] : rankTransitions(selected, mergeTracks(playlistTracks, whole.tracks), 20);
    const bestFive = rankTransitions(selected, body.playlistOnly ? playlistTracks : mergeTracks(playlistTracks, whole.tracks), 5);
    const setCandidates = body.playlistOnly ? playlistTracks : mergeTracks(playlistTracks, whole.tracks);
    const miniSet5 = buildMiniSet(selected, setCandidates, 5);
    const miniSet10 = buildMiniSet(selected, setCandidates, 10);

    await Promise.all(playlistMatches.slice(0, 3).map((score) => saveTransition(score, "playlist")));
    await Promise.all(wholeMatches.slice(0, 3).map((score) => saveTransition(score, "whole")));

    response.json({
      selectedTrack: selected,
      bestNext: bestFive[0] ?? null,
      bestFive,
      playlistMatches,
      wholeMatches,
      miniSets: [miniSet5, miniSet10],
      sources: whole.sources
    });
  } catch (error) {
    next(error);
  }
});
