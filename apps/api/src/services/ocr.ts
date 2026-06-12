import { makeTrack, mergeTracks, parseAppleMusicOcrText, type OcrTrackCandidate, type Track } from "@smart-dj/core";
import { createWorker } from "tesseract.js";

export async function runOcrOnScreenshots(files: Express.Multer.File[]) {
  const worker = await createWorker("eng+pol");
  const candidates: OcrTrackCandidate[] = [];
  const rawTexts: string[] = [];

  try {
    for (const file of files) {
      const result = await worker.recognize(file.buffer);
      rawTexts.push(result.data.text);
      candidates.push(...parseAppleMusicOcrText(result.data.text, file.originalname));
    }
  } finally {
    await worker.terminate();
  }

  const tracks = mergeTracks(
    [],
    candidates.map((candidate) => ({
      ...makeTrack(candidate.title, candidate.artist, "ocr"),
      id: candidate.id,
      sourceLabel: `OCR: ${candidate.sourceImage ?? "screenshot"}`,
      confidence: candidate.confidence
    }))
  );

  return {
    tracks,
    candidates,
    rawText: rawTexts.join("\n\n--- screenshot ---\n\n")
  };
}

export function tracksFromEditedCandidates(candidates: Array<{ title: string; artist: string; confidence?: number }>): Track[] {
  return mergeTracks(
    [],
    candidates.map((candidate) => ({
      ...makeTrack(candidate.title, candidate.artist, "ocr"),
      confidence: candidate.confidence ?? 0.92,
      sourceLabel: "Edited OCR"
    }))
  );
}
