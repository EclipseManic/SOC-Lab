import { motion, useScroll, useSpring } from "motion/react";
import { ArrowUpRight, GitBranch, ShieldCheck } from "lucide-react";
import { repoUrl } from "@/data";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

const storyIds = ["lab", "build", "attack", "signal", "case", "record"];

const storyNav = [
  { id: "lab", n: "01", label: "The lab" },
  { id: "build", n: "02", label: "The build" },
  { id: "attack", n: "03", label: "The attack" },
  { id: "signal", n: "04", label: "The signal" },
  { id: "case", n: "05", label: "The case" },
  { id: "record", n: "06", label: "The record" },
];

export function StoryHeader() {
  const active = useActiveSection(storyIds);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <header className="sticky top-0 z-50 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
      <div className="container-page flex h-[72px] items-center justify-between gap-4">
        <a
          href="#top"
          className="group flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          aria-label="SOC Lab home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal/25 bg-teal/10 text-teal">
            <ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="font-mono text-xs font-semibold tracking-[0.2em] text-ink">
            SOC<span className="text-teal">//</span>LAB
          </span>
        </a>

        <nav aria-label="Story chapters" className="hidden items-center gap-3 md:flex lg:gap-5">
          {storyNav.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={cn(
                "group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                active === item.id ? "text-ink" : "text-faint hover:text-ink",
              )}
            >
              <span className="text-teal">{item.n}</span>
              <span className="hidden lg:inline">{item.label}</span>
              <span className="sr-only lg:hidden">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-faint xl:inline">
            Case file / SOC-LAB-001
          </span>
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open the SOC Lab repository"
            className="flex h-9 items-center gap-2 rounded-full border border-line/80 px-3 text-[11px] text-muted transition hover:border-teal/40 hover:text-ink"
          >
            <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Repository</span>
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
      <motion.div
        className="h-px origin-left bg-gradient-to-r from-teal via-blue to-amber"
        style={{ scaleX: progress }}
        aria-hidden="true"
      />
    </header>
  );
}
