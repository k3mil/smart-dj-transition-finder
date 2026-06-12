"use client";

import { Badge } from "@/components/ui/badge";
import { formatDuration, qualityLabel } from "@/lib/utils";
import type { TransitionScore } from "@smart-dj/core";
import { AlertTriangle, Gauge, Music2 } from "lucide-react";

interface MatchTableProps {
  title: string;
  color: "hot" | "aqua";
  matches: TransitionScore[];
}

export function MatchTable({ title, color, matches }: MatchTableProps) {
  const accent = color === "hot" ? "text-hot border-hot/35 bg-hot/10" : "text-aqua border-aqua/35 bg-aqua/10";

  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <Badge className={accent}>{matches.length ? `Top ${matches.length}` : "brak wyników"}</Badge>
      </div>
      <div className="thin-scrollbar max-h-[620px] overflow-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#151116]/95 text-xs uppercase text-white/44 backdrop-blur">
            <tr>
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Utwór</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">BPM</th>
              <th className="px-3 py-2">Key</th>
              <th className="px-3 py-2">Mix</th>
              <th className="px-3 py-2">Cechy</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match, index) => (
              <tr key={`${match.to.id}-${index}`} className="rounded-md bg-white/[0.055] align-middle">
                <td className="rounded-l-md px-3 py-3 text-white/42">{index + 1}</td>
                <td className="px-3 py-3">
                  <div className="max-w-[260px] truncate font-semibold text-white">{match.to.title}</div>
                  <div className="max-w-[260px] truncate text-xs text-white/48">{match.to.artist}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={color === "hot" ? "h-full bg-hot" : "h-full bg-aqua"}
                        style={{ width: `${match.score}%` }}
                      />
                    </div>
                    <span className="font-bold text-white">{match.score}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-white/74">
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5" aria-hidden />
                    {Math.round(match.to.features.bpm)}
                  </span>
                  <div className="text-xs text-white/40">Δ {match.effectiveBpmDelta}</div>
                </td>
                <td className="px-3 py-3">
                  <Badge>{match.to.features.camelot}</Badge>
                  <div className="mt-1 text-xs text-white/42">{match.keyCompatibility}</div>
                </td>
                <td className="px-3 py-3">
                  <span className="font-semibold text-white">{qualityLabel(match.mixQuality)}</span>
                  <div className="text-xs text-white/42">{match.crossfadeSeconds}s crossfade</div>
                  {match.harmonicConflict ? (
                    <div className="mt-1 inline-flex items-center gap-1 text-xs text-amber">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      konflikt
                    </div>
                  ) : null}
                </td>
                <td className="rounded-r-md px-3 py-3 text-xs text-white/48">
                  <div className="inline-flex items-center gap-1">
                    <Music2 className="h-3.5 w-3.5" aria-hidden />
                    {match.to.features.genre}
                  </div>
                  <div>{formatDuration(match.to.features.durationMs)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
