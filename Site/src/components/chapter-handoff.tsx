import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChapterHandoff({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={cn("mt-10 flex items-center gap-4", className)}>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line/80 bg-panel/60 text-teal"
        aria-hidden="true"
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </span>
      <p className="max-w-2xl text-sm leading-6 text-faint">{text}</p>
      <span className="hidden h-px flex-1 bg-line/70 sm:block" aria-hidden="true" />
    </div>
  );
}
