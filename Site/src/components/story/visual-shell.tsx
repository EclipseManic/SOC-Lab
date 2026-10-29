import { ArrowUpRight, GitBranch, ShieldCheck } from "lucide-react";
import { repoUrl } from "@/data";

const links = [
  ["Lab", "#lab"],
  ["Playback", "#attack"],
  ["Signal", "#signal"],
  ["Cases", "#case"],
  ["Record", "#record"],
] as const;

export function VisualNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-canvas/82 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-5">
        <a href="#top" className="group flex items-center gap-3" aria-label="SOC Lab home">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-teal/40 bg-teal/10 text-teal transition group-hover:bg-teal/15 shadow-[0_0_12px_rgba(53,224,194,0.2)]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="hidden sm:block">
            <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-ink">SOC // LAB</span>
            <span className="block font-mono text-[7.5px] uppercase tracking-[0.16em] text-teal">ANATOMY DISSECTOR</span>
          </div>
        </a>
        <nav aria-label="Story sections" className="hidden items-center gap-5 md:flex">
          {links.map(([label, href]) => (
            <a key={href} href={href} className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint transition hover:text-teal">
              {label}
            </a>
          ))}
        </nav>
        <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition hover:border-teal/40 hover:text-ink">
          <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Repository</span>
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}

export function VisualFooter() {
  return (
    <footer className="border-t border-line/70 py-10">
      <div className="container-page flex flex-col gap-4 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
        <p>The repository is the record. This page is the trailer.</p>
        <a href={repoUrl} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-[0.15em] text-teal hover:text-ink">
          Open SOC-Lab on GitHub
        </a>
      </div>
    </footer>
  );
}
