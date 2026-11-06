import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { repoUrl } from "@/data";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

const links = [
  ["Lab", "#setup"],
  ["Break-in", "#attack"],
  ["Detection", "#detection"],
  ["Investigation", "#investigation"],
  ["Response", "#response"],
  ["Post-mortem", "#post-mortem"],
  ["Score", "#score"],
  ["Go deeper", "#repo"],
] as const;

const sectionIds = [
  "top",
  "setup",
  "attack",
  "detection",
  "investigation",
  "response",
  "post-mortem",
  "score",
  "repo",
];

export function VisualNav() {
  const active = useActiveSection(sectionIds);

  // Reading progress, measured straight off the document rather than through
  // motion's scroll tracker. The tracker only recomputed on scroll or resize,
  // so when the lazy acts grew the page it went stale and the bar was left
  // stuck at 100%. Measuring directly, and observing height changes, keeps it
  // honest — and the bar stays hidden until the reader actually starts moving.
  const raw = useMotionValue(0);
  const progress = useSpring(raw, { stiffness: 140, damping: 26, restDelta: 0.001 });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      raw.set(max > 8 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setScrolled(window.scrollY > 8);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [raw]);

  return (
    <header className="glass sticky top-0 z-50 rounded-none border-0 border-b border-rule/70">
      <div className="container-page flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2 md:flex-nowrap md:py-0">
        <a href="#top" className="flex items-baseline gap-3" aria-label="SOC Lab home">
          <span className="text-lg font-medium tracking-[-0.03em] text-ink">SOC Lab</span>
          <span className="hidden text-xs font-medium text-muted sm:inline">
            one lab · one break-in · 20 steps
          </span>
        </a>

        <nav
          aria-label="Sections"
          className="no-scrollbar order-3 -mx-1 w-full overflow-x-auto px-1 md:order-none md:mx-0 md:w-auto"
        >
          <ul className="flex items-center gap-0.5">
            {links.map(([label, href]) => {
              const isActive = active === href.slice(1);
              return (
                <li key={href} className="shrink-0">
                  <a
                    href={href}
                    className={`relative flex items-center whitespace-nowrap px-1 py-2 text-[0.72rem] font-medium transition-colors sm:px-3 sm:text-sm ${
                      isActive ? "text-ink" : "text-muted hover:text-ink-2"
                    }`}
                  >
                    {label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent"
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <a
          href={repoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-pill border border-rule-2 bg-paper-2/70 px-3.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Repository
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <motion.div
        style={{ scaleX: progress }}
        className={cn(
          "h-0.5 origin-left bg-gradient-to-r from-accent via-ember to-cool transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />
    </header>
  );
}

export function VisualFooter() {
  return (
    <footer className="border-t border-rule bg-paper-3/60">
      <div className="container-page flex flex-col gap-6 py-12 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-medium text-ink">SOC Lab</span>
            <span className="text-xs text-muted">detection record / AD intrusion</span>
          </div>
          <p className="mt-2 max-w-md text-sm text-muted">
            A self-built lab, attacked on purpose, and measured honestly. All simulations ran against
            isolated machines I own.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a href={repoUrl} target="_blank" rel="noreferrer" className="font-medium text-ink-2 hover:text-accent">
            Repository ↗
          </a>
          <a
            href={`${repoUrl}/blob/main/INDEX.md`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-ink-2 hover:text-accent"
          >
            Master index ↗
          </a>
          <a
            href={`${repoUrl}/blob/main/DISCLAIMER.md`}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-ink-2 hover:text-accent"
          >
            Disclaimer ↗
          </a>
        </div>
      </div>
      <div className="container-page pb-10 text-xs text-faint">
        Built by Manichand Gupta · every figure links back to a file in the repository.
      </div>
    </footer>
  );
}
