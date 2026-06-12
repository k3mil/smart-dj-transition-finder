"use client";

import type { Track, TransitionScore } from "@smart-dj/core";
import { CAMELOT_KEYS } from "@smart-dj/core";

interface ChartsProps {
  selected?: Track;
  matches: TransitionScore[];
}

export function BpmEnergyCharts({ selected, matches }: ChartsProps) {
  const rows = [selected, ...matches.slice(0, 9).map((match) => match.to)].filter(Boolean) as Track[];
  const maxBpm = Math.max(160, ...rows.map((track) => track.features.bpm));

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="glass rounded-lg p-4">
        <h2 className="mb-3 text-lg font-bold">BPM flow</h2>
        <div className="space-y-3">
          {rows.map((track, index) => (
            <div key={`${track.id}-${index}`} className="grid grid-cols-[130px_1fr_44px] items-center gap-3 text-xs">
              <span className="truncate text-white/58">{index === 0 ? "START" : track.title}</span>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-hot" style={{ width: `${(track.features.bpm / maxBpm) * 100}%` }} />
              </div>
              <span className="font-semibold text-white">{Math.round(track.features.bpm)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass rounded-lg p-4">
        <h2 className="mb-3 text-lg font-bold">Energia przejścia</h2>
        <div className="space-y-3">
          {rows.map((track, index) => (
            <div key={`${track.id}-energy-${index}`} className="grid grid-cols-[130px_1fr_44px] items-center gap-3 text-xs">
              <span className="truncate text-white/58">{index === 0 ? "START" : track.title}</span>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-aqua" style={{ width: `${track.features.energy * 100}%` }} />
              </div>
              <span className="font-semibold text-white">{Math.round(track.features.energy * 100)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CamelotWheel({ selected, matches }: ChartsProps) {
  const activeKeys = new Map<string, number>();
  if (selected) activeKeys.set(selected.features.camelot, 100);
  matches.slice(0, 20).forEach((match) => {
    activeKeys.set(match.to.features.camelot, Math.max(activeKeys.get(match.to.features.camelot) ?? 0, match.score));
  });

  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Camelot Wheel</h2>
        <span className="text-xs text-white/48">aktywny klucz startu i najlepszych przejść</span>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
        {CAMELOT_KEYS.map((key) => {
          const score = activeKeys.get(key);
          const isSelected = selected?.features.camelot === key;
          return (
            <div
              key={key}
              className="relative flex aspect-square items-center justify-center rounded-md border border-white/12 bg-white/[0.055] text-sm font-bold"
            >
              <span className={isSelected ? "text-hot" : score ? "text-aqua" : "text-white/36"}>{key}</span>
              {score ? (
                <span
                  className="absolute inset-1 rounded-md border"
                  style={{
                    borderColor: isSelected ? "rgba(255,45,85,0.72)" : "rgba(0,209,255,0.5)",
                    opacity: Math.max(0.28, score / 100)
                  }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
