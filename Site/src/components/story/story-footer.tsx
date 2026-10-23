import { ArrowUp, GitBranch, ShieldCheck } from "lucide-react";
import { repoUrl } from "@/data";

export function StoryFooter() {
  return (
    <footer className="border-t border-line/70 bg-canvas/60">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a href="#top" className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal/25 bg-teal/10 text-teal">
              <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-ink">
              SOC<span className="text-teal">//</span>LAB
            </span>
          </a>
          <p className="mt-4 max-w-md text-sm leading-6 text-faint">
            No live telemetry. No production data. No claim without a file.
            The repository is the authoritative record.
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-faint/70">
            Case file SOC-LAB-001 · 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition hover:text-teal"
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            Repository
          </a>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
          >
            Back to top
            <ArrowUp className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
