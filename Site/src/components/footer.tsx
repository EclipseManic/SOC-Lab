import { ArrowUp, GitBranch, ShieldCheck } from "lucide-react";
import { chapters, repoUrl } from "@/data";

export function Footer() {
  return (
    <footer className="border-t border-line/70 bg-canvas/60">
      <div className="container-page py-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <a href="#top" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal/25 bg-teal/10 text-teal">
                <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="font-mono text-xs font-semibold tracking-[0.2em] text-ink">
                SOC<span className="text-teal">//</span>LAB
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-6 text-faint">
              An authorized, isolated lab record. No live telemetry, no production
              data, and no claim that outruns its evidence.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-faint/70">
              Case file SOC-LAB-001 · 2026
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Chapters
            </p>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {chapters.map((chapter) => (
                <a
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  className="text-xs text-muted transition hover:text-teal"
                >
                  <span className="mr-1.5 font-mono text-[9px] text-faint">
                    {chapter.n}
                  </span>
                  {chapter.title}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Source
            </p>
            <div className="mt-3 grid gap-2">
              <a
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs text-muted transition hover:text-teal"
              >
                <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                GitHub repository
              </a>
              <a
                href={`${repoUrl}/blob/main/INDEX.md`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted transition hover:text-teal"
              >
                INDEX.md
              </a>
              <a
                href={`${repoUrl}/blob/main/05-Incident-Report/README.md`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted transition hover:text-teal"
              >
                Incident report
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-5">
          <p className="text-[11px] text-faint">
            The repository is the authoritative record.
          </p>
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
