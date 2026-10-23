import { useMemo } from "react";
import {
  motion,
  useScroll,
  useSpring,
} from "motion/react";
import { ArrowUpRight, GitBranch, Menu, ShieldCheck } from "lucide-react";
import { chapters, type Lens } from "@/data";
import { useLens } from "@/context/lens-context";
import { useActiveSection } from "@/hooks/use-active-section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const lensOptions: { value: Lens; label: string }[] = [
  { value: "executive", label: "Executive" },
  { value: "technical", label: "Technical" },
  { value: "hiring", label: "Talent" },
];

export function LensSwitch({ compact = false }: { compact?: boolean }) {
  const { lens, setLens, description } = useLens();

  return (
    <div className={cn("flex flex-col gap-1.5", compact && "w-full")}>
      <div
        role="radiogroup"
        aria-label="Reading lens"
        className={cn(
          "flex items-center gap-0.5 rounded-full border border-line/80 bg-panel/80 p-0.5",
          compact && "w-full justify-between",
        )}
      >
        {lensOptions.map((option) => {
          const active = option.value === lens;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLens(option.value)}
              className={cn(
                "rounded-full px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                compact ? "flex-1" : "",
                active
                  ? "bg-teal/10 text-teal"
                  : "text-faint hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span className="px-1 font-mono text-[10px] text-faint" aria-live="polite">
        {description}
      </span>
    </div>
  );
}

export function Header() {
  const { label } = useLens();
  const ids = useMemo(() => chapters.map((chapter) => chapter.id), []);
  const active = useActiveSection(ids);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/80 backdrop-blur-xl">
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

        <nav
          aria-label="Chapters"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {chapters.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              aria-current={active === chapter.id ? "location" : undefined}
              className={cn(
                "group flex items-center gap-1.5 rounded-full px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                active === chapter.id
                  ? "bg-panel-2/80 text-ink"
                  : "text-faint hover:bg-panel-2/50 hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  active === chapter.id ? "text-teal" : "text-faint",
                )}
              >
                {chapter.n}
              </span>
              {chapter.title.split(" ")[0]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden xl:block">
            <LensSwitch />
          </div>
          <a
            href="https://github.com/EclipseManic/SOC-Lab"
            target="_blank"
            rel="noreferrer"
            className="hidden h-10 items-center gap-2 rounded-full border border-line/80 px-3.5 text-xs text-muted transition hover:border-teal/40 hover:text-ink sm:flex"
          >
            <GitBranch className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">Repository</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="xl:hidden"
                aria-label="Open chapter menu"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Read the lab</DialogTitle>
                <DialogDescription>
                  Six chapters, one record. Current lens: {label}.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 grid gap-1">
                {chapters.map((chapter) => (
                  <DialogClose asChild key={chapter.id}>
                    <a
                      href={`#${chapter.id}`}
                      className="flex items-center justify-between rounded-xl border border-transparent px-3 py-3 transition hover:border-line/80 hover:bg-panel-2/60"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] text-teal">
                          {chapter.n}
                        </span>
                        <span className="text-sm text-ink">{chapter.title}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-faint" aria-hidden="true" />
                    </a>
                  </DialogClose>
                ))}
              </div>
              <div className="mt-5 border-t border-line/70 pt-5">
                <LensSwitch compact />
              </div>
            </DialogContent>
          </Dialog>
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
