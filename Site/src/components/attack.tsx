import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  ChevronRight,
  CircleDashed,
  ExternalLink,
  Terminal,
} from "lucide-react";
import {
  chapters,
  phases,
  repoBlob,
  stages,
  verifiedCount,
  type Phase,
  type Stage,
} from "@/data";
import { ChapterHandoff } from "@/components/chapter-handoff";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const filterOrder: Array<Phase | "all"> = ["all", "web", "cred", "domain", "impact"];

function StageDialog({
  stage,
  onClose,
}: {
  stage: Stage | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(stage)} onOpenChange={(open) => !open && onClose()}>
      {stage ? (
        <DialogContent className="max-h-[90vh] max-w-3xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]", phases[stage.phase].tone)}>
                {phases[stage.phase].label}
              </span>
              <StatusBadge status={stage.status} />
              <Badge tone="neutral">{stage.caseLabel}</Badge>
            </div>
            <DialogTitle>
              Stage {stage.id} · {stage.title}
            </DialogTitle>
            <DialogDescription>{stage.plain}</DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-line/70 bg-canvas/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Attacker action
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.attacker}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-canvas/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Defender view
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.defender}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-canvas/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Evidence required
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.evidence}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-canvas/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                Telemetry / gap
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">{stage.telemetry}</p>
              <p className="mt-2 font-mono text-[10px] text-amber">{stage.gap}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line/70 pt-5">
            <a
              href={`${repoBlob}/${stage.attackPath}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              Stage note
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href={`${repoBlob}/${stage.investigationPath}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              Investigation
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href={`${repoBlob}/04-Investigation/Cases/${stage.caseSlug}.md`}
              target="_blank"
              rel="noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              {stage.caseLabel}
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function StageRow({ stage, onOpen }: { stage: Stage; onOpen: () => void }) {
  const phase = phases[stage.phase];

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      type="button"
      onClick={onOpen}
      className="group grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-3 border-b border-line/60 px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-panel-2/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal sm:grid-cols-[3rem_1fr_7.5rem_7rem_auto] sm:px-5"
      aria-label={`Open stage ${stage.id}: ${stage.title}`}
    >
      <span className="font-mono text-xs text-teal">{stage.id}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{stage.title}</span>
        <span className="mt-0.5 block truncate text-xs text-faint">
          {stage.techniqueId} · {stage.technique}
        </span>
      </span>
      <span className="hidden font-mono text-[10px] text-faint sm:block">
        {stage.telemetry}
      </span>
      <span className="hidden sm:block">
        <StatusBadge status={stage.status} />
      </span>
      <span className="flex items-center gap-2">
        <span className={cn("hidden rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] md:inline-flex", phase.tone)}>
          {phase.short}
        </span>
        <ChevronRight className="h-4 w-4 text-faint/60 transition group-hover:translate-x-0.5 group-hover:text-teal" aria-hidden="true" />
      </span>
    </motion.button>
  );
}

export function Attack() {
  const [filter, setFilter] = useState<Phase | "all">("all");
  const [selected, setSelected] = useState<Stage | null>(null);
  const reduceMotion = useReducedMotion();

  const filtered = useMemo(
    () =>
      filter === "all"
        ? stages
        : stages.filter((stage) => stage.phase === filter),
    [filter],
  );

  const filters = filterOrder.map((value) => ({
    value,
    label: value === "all" ? "All stages" : phases[value].short,
    count:
      value === "all"
        ? stages.length
        : stages.filter((stage) => stage.phase === value).length,
  }));

  return (
    <section id="attack" className="section-shell">
      <div className="container-page">
        <SectionHeader chapter={chapters[1]} />

        <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { value: String(stages.length), label: "documented stages" },
            { value: `${verifiedCount} / ${stages.length}`, label: "detections verified" },
            { value: "2", label: "offline-only stages" },
          ].map((item) => (
            <Card key={item.label} className="p-3 sm:p-4">
              <div className="whitespace-nowrap font-mono text-[17px] font-semibold tracking-[-0.04em] text-ink sm:text-2xl">
                {item.value}
              </div>
              <div className="mt-1 text-[10px] leading-4 text-faint sm:text-[11px]">{item.label}</div>
            </Card>
          ))}
        </div>

        <Card className="mt-3 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-line/70 p-3 sm:p-4">
            <span className="mr-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
              Filter
            </span>
            {filters.map((item) => {
              const active = filter === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition",
                    active
                      ? "border-teal/35 bg-teal/10 text-teal"
                      : "border-line/70 text-faint hover:border-line hover:text-ink",
                  )}
                >
                  {item.label}
                  <span className="ml-1.5 text-[9px] opacity-60">{item.count}</span>
                </button>
              );
            })}
            <span className="ml-auto hidden font-mono text-[10px] text-faint md:block">
              Select a stage for the evidence view
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-line/60 bg-canvas/30 px-4 py-2.5 sm:px-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              Stage / technique
            </span>
            <span className="flex items-center gap-5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              <span className="hidden sm:inline">Telemetry</span>
              <span className="hidden sm:inline">Status</span>
            </span>
          </div>

          {reduceMotion ? (
            <div>
              {filtered.map((stage) => (
                <StageRow key={stage.id} stage={stage} onOpen={() => setSelected(stage)} />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div layout>
                {filtered.map((stage) => (
                  <StageRow key={stage.id} stage={stage} onOpen={() => setSelected(stage)} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </Card>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <p className="text-xs leading-5 text-faint">
            Every row is a hypothesis until the stage runs and the alert is
            validated. “Not tested” is the current, honest status.
          </p>
          <span className="font-mono text-[10px] text-faint">
            {filtered.length} of {stages.length} shown
          </span>
        </div>

        <StageDialog stage={selected} onClose={() => setSelected(null)} />
        <ChapterHandoff text={chapters[1].handoff} />
      </div>
    </section>
  );
}
