"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Track } from "@smart-dj/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SearchComposerProps {
  onSearch: (query: string, playlistOnly: boolean, selected?: Track) => void;
  loading: boolean;
}

export function SearchComposer({ onSearch, loading }: SearchComposerProps) {
  const [query, setQuery] = useState("");
  const [playlistOnly, setPlaylistOnly] = useState(true);
  const [suggestions, setSuggestions] = useState<Track[]>([]);
  const [selected, setSelected] = useState<Track | undefined>();

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const result = await apiGet<{ tracks: Track[] }>(
          `/search?q=${encodeURIComponent(trimmed)}&mode=${playlistOnly ? "playlist" : "whole"}`
        );
        setSuggestions(result.tracks.slice(0, 8));
      } catch {
        setSuggestions([]);
      }
    }, 180);
    return () => window.clearTimeout(handle);
  }, [query, playlistOnly]);

  const modeLabel = useMemo(() => (playlistOnly ? "Playlist Match" : "Whole"), [playlistOnly]);

  return (
    <section className="glass rounded-lg p-4 shadow-glow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-white sm:text-3xl">Smart DJ Transition Finder</h1>
          <p className="mt-1 text-sm text-white/56">Wpisz tytuł, wybierz zakres i znajdź następny numer do płynnego przejścia.</p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-white/12 bg-white/10 px-3 py-2">
          <SlidersHorizontal className="h-4 w-4 text-white/70" aria-hidden />
          <span className={cn("text-sm font-semibold", playlistOnly ? "text-hot" : "text-aqua")}>{modeLabel}</span>
          <Switch checked={playlistOnly} onCheckedChange={setPlaylistOnly} aria-label="Przełącz Playlist Match" />
        </div>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(query, playlistOnly, selected);
        }}
      >
        <div className="relative">
          <Input
            value={query}
            placeholder="np. somwhe, Runaway, SICKO MODE, PYSK"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(undefined);
            }}
          />
          {suggestions.length ? (
            <div className="thin-scrollbar absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-white/12 bg-[#141116]/95 p-2 shadow-2xl backdrop-blur-glass">
              {suggestions.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-white/10"
                  onClick={() => {
                    setSelected(track);
                    setQuery(`${track.title} - ${track.artist}`);
                    setSuggestions([]);
                  }}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{track.title}</span>
                    <span className="block truncate text-xs text-white/50">{track.artist}</span>
                  </span>
                  <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/58">{track.sourceLabel}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <Button type="submit" disabled={loading || query.trim().length < 2}>
          <Search className="h-4 w-4" aria-hidden />
          {loading ? "Szukam" : "Wyszukaj"}
        </Button>
      </form>
    </section>
  );
}
