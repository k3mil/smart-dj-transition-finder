"use client";

import { UploadCloud, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadScreenshots } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Track } from "@smart-dj/core";

interface DropzoneProps {
  onPlaylistUpdated: (tracks: Track[]) => void;
}

export function Dropzone({ onPlaylistUpdated }: DropzoneProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Wrzuć screenshoty Apple Music");
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const images = Array.from(incoming)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 17);
    setFiles((current) => [...current, ...images].slice(0, 17));
  }, []);

  async function handleUpload() {
    if (!files.length) return;
    setBusy(true);
    setStatus("OCR czyta tracklistę...");
    try {
      const result = await uploadScreenshots(files);
      onPlaylistUpdated(result.playlist);
      setStatus(`Rozpoznano ${result.tracks.length} nowych pozycji, baza ma ${result.total} utworów`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "OCR nie powiódł się");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="glass rounded-lg p-4">
      <div
        className={cn(
          "flex min-h-[180px] flex-col items-center justify-center rounded-md border border-dashed border-white/18 px-4 text-center transition",
          dragging ? "border-hot bg-hot/10" : "bg-white/[0.035]"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <UploadCloud className="mb-3 h-8 w-8 text-hot" aria-hidden />
        <div className="text-sm font-semibold text-white">{status}</div>
        <div className="mt-1 text-xs text-white/54">maksymalnie 17 screenshotów, duplikaty są usuwane</div>
        <label className="mt-4 inline-flex cursor-pointer items-center rounded-md border border-white/12 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15">
          Wybierz pliki
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => event.target.files && addFiles(event.target.files)}
          />
        </label>
      </div>

      {files.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {files.map((file) => (
              <span key={`${file.name}-${file.size}`} className="inline-flex items-center gap-2 rounded-md bg-white/10 px-2 py-1 text-xs">
                {file.name}
                <button
                  type="button"
                  aria-label={`Usuń ${file.name}`}
                  onClick={() => setFiles((current) => current.filter((item) => item !== file))}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <Button type="button" onClick={handleUpload} disabled={busy} className="w-full">
            <UploadCloud className="h-4 w-4" aria-hidden />
            {busy ? "Analizuję screenshoty" : "Zbuduj playlistę z OCR"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
