import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "teal" | "blue" | "amber" | "rose" | "neutral";

const tones: Record<Tone, string> = {
  teal: "border-ok/40 bg-ok-soft text-ok",
  blue: "border-cool/40 bg-cool-soft text-cool",
  amber: "border-accent/40 bg-accent-soft text-accent",
  rose: "border-bad/40 bg-bad-soft text-bad",
  neutral: "border-rule bg-paper-3 text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-1 font-sans text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
