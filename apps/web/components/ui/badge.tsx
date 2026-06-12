import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-white/12 bg-white/10 px-2 py-1 text-xs font-semibold text-white/82",
        className
      )}
      {...props}
    />
  );
}
