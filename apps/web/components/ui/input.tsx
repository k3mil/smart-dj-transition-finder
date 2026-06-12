import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-md border border-white/12 bg-white/[0.08] px-4 text-base text-white outline-none transition placeholder:text-white/42 focus:border-hot/70 focus:ring-4 focus:ring-hot/15",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
