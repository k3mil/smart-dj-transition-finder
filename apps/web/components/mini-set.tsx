"use client";

import type { MiniSet as MiniSetType } from "@smart-dj/core";
import { Badge } from "@/components/ui/badge";

interface MiniSetProps {
  set: MiniSetType;
}

export function MiniSet({ set }: MiniSetProps) {
  return (
    <section className="glass rounded-lg p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Mini-set {set.size}</h2>
        <Badge className="border-lime/35 bg-lime/10 text-lime">{set.averageScore}% avg</Badge>
      </div>
      <ol className="space-y-2">
        {set.tracks.map((track, index) => (
          <li key={`${track.id}-${index}`} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-md bg-white/[0.055] px-3 py-2">
            <span className="text-xs font-bold text-white/42">{index + 1}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">{track.title}</span>
              <span className="block truncate text-xs text-white/46">{track.artist}</span>
            </span>
            <Badge>{track.features.camelot}</Badge>
          </li>
        ))}
      </ol>
    </section>
  );
}
