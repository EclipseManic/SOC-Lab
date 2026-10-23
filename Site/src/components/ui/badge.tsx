import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "teal" | "blue" | "amber" | "rose" | "neutral";

const tones: Record<Tone, string> = {
  teal: "border-teal/30 bg-teal/10 text-teal",
  blue: "border-blue/30 bg-blue/10 text-blue",
  amber: "border-amber/30 bg-amber/10 text-amber",
  rose: "border-rose/30 bg-rose/10 text-rose",
  neutral: "border-line/80 bg-panel-2/70 text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
