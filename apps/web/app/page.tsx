"use client";

import { Activity, RadioTower } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Track, TransitionScore } from "@smart-dj/core";
import { BpmEnergyCharts, CamelotWheel } from "@/components/charts";
import { Dropzone } from "@/components/dropzone";
import { MatchTable } from "@/components/match-table";
import { MiniSet } from "@/components/mini-set";
import { SearchComposer } from "@/components/search-composer";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiPost, type TransitionResponse } from "@/lib/api";

export default function HomePage() {
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [result, setResult] = useState<TransitionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void apiGet<{ tracks: Track[]; total: number }>("/playlist")
      .then((data) => setPlaylist(data.tracks))
      .catch(() => setPlaylist([]));
  }, []);

  async function handleSearch(query: string, playlistOnly: boolean, selected?: Track) {
    setLoading(true);
    setError(null);
    try {
      const response = await apiPost<TransitionResponse>("/transitions", {
        query,
        track: selected,
        playlistOnly
      });
      setResult(response);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Nie udało się policzyć przejść");
    } finally {
      setLoading(false);
    }
  }

  const visibleMatches: TransitionScore[] = useMemo(() => {
    if (!result) return [];
    return result.wholeMatches.length ? result.wholeMatches : result.playlistMatches;
  }, [result]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1540px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <SearchComposer onSearch={handleSearch} loading={loading} />

      <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
        <aside className="space-y-4">
          <Dropzone onPlaylistUpdated={setPlaylist} />
          <section className="glass rounded-lg p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Baza playlisty</h2>
              <Badge className="border-hot/35 bg-hot/10 text-hot">{playlist.length} utworów</Badge>
            </div>
            <div className="thin-scrollbar max-h-80 space-y-2 overflow-auto">
              {playlist.slice(0, 80).map((track) => (
                <div key={track.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-md bg-white/[0.055] px-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">{track.title}</span>
                    <span className="block truncate text-xs text-white/46">{track.artist}</span>
                  </span>
                  <span className="text-right text-xs text-white/42">
                    {Math.round(track.features.bpm)}
                    <br />
                    {track.features.camelot}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {result?.bestNext ? (
            <section className="glass rounded-lg p-4 shadow-cyan">
              <div className="mb-3 flex items-center gap-2 text-aqua">
                <RadioTower className="h-4 w-4" aria-hidden />
                <h2 className="text-lg font-bold text-white">Najlepszy następny</h2>
              </div>
              <div className="text-2xl font-bold text-white">{result.bestNext.to.title}</div>
              <div className="text-sm text-white/52">{result.bestNext.to.artist}</div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-white/10 p-2">
                  <div className="text-lg font-bold text-aqua">{result.bestNext.score}%</div>
                  <div className="text-white/44">match</div>
                </div>
                <div className="rounded-md bg-white/10 p-2">
                  <div className="text-lg font-bold text-white">{result.bestNext.to.features.camelot}</div>
                  <div className="text-white/44">key</div>
                </div>
                <div className="rounded-md bg-white/10 p-2">
                  <div className="text-lg font-bold text-white">{Math.round(result.bestNext.to.features.bpm)}</div>
                  <div className="text-white/44">BPM</div>
                </div>
              </div>
            </section>
          ) : null}
        </aside>

        <section className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-amber/35 bg-amber/10 p-4 text-sm text-amber">{error}</div>
          ) : null}

          {result ? (
            <>
              <section className="glass rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase text-white/42">utwór startowy</div>
                    <h2 className="text-2xl font-bold text-white">{result.selectedTrack.title}</h2>
                    <p className="text-sm text-white/54">{result.selectedTrack.artist}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{Math.round(result.selectedTrack.features.bpm)} BPM</Badge>
                    <Badge>{result.selectedTrack.features.camelot}</Badge>
                    <Badge>{result.selectedTrack.features.genre}</Badge>
                    <Badge>{Math.round(result.selectedTrack.features.energy * 100)} energy</Badge>
                  </div>
                </div>
                {result.sources.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/44">
                    {result.sources.map((source) => (
                      <span key={`${source.source}-${source.warning ?? "ok"}`}>
                        {source.source}
                        {source.warning ? `: ${source.warning}` : ""}
                      </span>
                    ))}
                  </div>
                ) : null}
              </section>

              <div className="grid gap-4 2xl:grid-cols-2">
                <MatchTable title="Dopasowania z playlisty" color="hot" matches={result.playlistMatches} />
                <MatchTable title="Whole / internet + podobny klimat" color="aqua" matches={result.wholeMatches} />
              </div>

              <section className="glass rounded-lg p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-lime" aria-hidden />
                  <h2 className="text-lg font-bold">Najlepsze 5 przejść</h2>
                </div>
                <div className="grid gap-2 md:grid-cols-5">
                  {result.bestFive.map((match) => (
                    <div key={match.to.id} className="rounded-md bg-white/[0.055] p-3">
                      <div className="text-xl font-bold text-lime">{match.score}%</div>
                      <div className="truncate text-sm font-semibold text-white">{match.to.title}</div>
                      <div className="truncate text-xs text-white/46">{match.to.artist}</div>
                    </div>
                  ))}
                </div>
              </section>

              <BpmEnergyCharts selected={result.selectedTrack} matches={visibleMatches} />
              <CamelotWheel selected={result.selectedTrack} matches={visibleMatches} />

              <div className="grid gap-4 lg:grid-cols-2">
                {result.miniSets.map((set) => (
                  <MiniSet key={set.size} set={set} />
                ))}
              </div>
            </>
          ) : (
            <section className="glass flex min-h-[520px] items-center justify-center rounded-lg p-6 text-center">
              <div className="max-w-xl">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-hot/30 bg-hot/10 shadow-glow animate-pulseRing">
                  <Activity className="h-9 w-9 text-hot" aria-hidden />
                </div>
                <h2 className="text-2xl font-bold text-white">Wybierz startowy track</h2>
                <p className="mt-2 text-sm text-white/54">
                  Po wyszukaniu zobaczysz ranking z playlisty na różowo i rekomendacje z trybu Whole na niebiesko.
                </p>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
