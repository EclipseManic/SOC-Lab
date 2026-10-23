import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line/80 bg-panel/65 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
