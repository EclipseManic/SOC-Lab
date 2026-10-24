import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { phases, repoBlob, stages, type Phase, type Stage } from "@/data";
import { cn } from "@/lib/utils";

const phaseOrder: Phase[] = ["web", "cred", "domain", "impact"];

function StageDetail({ stage }: { stage: Stage }) {
  return (
    <div className="border-b border-line/60 bg-panel/25 px-4 py-6">
      <div className="grid gap-5 sm:grid-cols-3 sm:gap-8">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            What happened
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{stage.plain}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            Attacker action
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{stage.attacker}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            Evidence to collect
          </p>
          <p className="mt-2 text-sm leading-6 text-muted">{stage.evidence}</p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-teal">
            {stage.telemetry}
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line/50 pt-4 text-xs">
        <a
          href={`${repoBlob}/${stage.attackPath}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
        >
          View attack doc
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
        <a
          href={`${repoBlob}/${stage.investigationPath}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
        >
          View investigation doc
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function AttackAct() {
  const [active, setActive] = useState<string | null>("01");
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="attack"
      aria-labelledby="attack-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Act III / The attack
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            03 of 06
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <h2
            id="attack-heading"
            className="max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl"
          >
            Twenty moves.
            <br />
            One intrusion.
          </h2>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              The campaign runs from public web input to domain control and
              simulated impact. This is the attack as it was executed and
              recorded, stage by stage.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              The ledger is not an alert queue. Every stage carries the action,
              the technique, and the evidence someone would need to reconstruct
              it.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line/70 bg-line/60 sm:grid-cols-2 lg:grid-cols-4">
          {phaseOrder.map((phase) => {
            const meta = phases[phase];
            const count = stages.filter((stage) => stage.phase === phase).length;
            return (
              <div key={phase} className="bg-canvas/95 px-4 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    {meta.range}
                  </p>
                  <span className="font-mono text-[9px] text-faint">
                    {count} stages
                  </span>
                </div>
                <p className={cn("mt-2 text-sm font-medium", meta.tone.split(" ")[0])}>
                  {meta.label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-b border-line/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-teal">
            Adversary Timeline / 20 Executed Stages
          </p>
          <p className="max-w-xl text-xs leading-5 text-faint">
            Every stage documents the offensive action, MITRE ATT&CK mapping, and required telemetry. Detection verification and rule correlation follow in Act IV.
          </p>
        </div>

        <div className="mt-2">
          {phaseOrder.map((phase) => {
            const meta = phases[phase];
            const phaseStages = stages.filter((stage) => stage.phase === phase);
            return (
              <div key={phase} className="border-b border-line/70 py-6 last:border-b-0">
                <div className="mb-2 flex items-center gap-3">
                  <span className={cn("font-mono text-[9px] uppercase tracking-[0.16em]", meta.tone.split(" ")[0])}>
                    {meta.short}
                  </span>
                  <span className="h-px flex-1 bg-line/60" aria-hidden="true" />
                  <span className="font-mono text-[9px] text-faint">{meta.range}</span>
                </div>

                {phaseStages.map((stage) => {
                  const open = active === stage.id;
                  return (
                    <div key={stage.id} className="border-t border-line/50 first:border-t-0">
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`stage-${stage.id}-detail`}
                        onClick={() => setActive(open ? null : stage.id)}
                        className={cn(
                          "group grid w-full grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 px-1 py-3 text-left transition-colors",
                          open ? "bg-teal/[0.05]" : "hover:bg-panel/35",
                        )}
                      >
                        <span className={cn("font-mono text-[10px]", open ? "text-teal" : "text-faint")}>
                          {stage.id}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-sm font-medium tracking-[-0.01em]", open ? "text-ink" : "text-muted group-hover:text-ink")}>
                            {stage.title}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                            {stage.technique}
                          </span>
                        </span>
                        <span className="font-mono text-[9px] text-faint">
                          {stage.techniqueId}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {open ? (
                          <motion.div
                            id={`stage-${stage.id}-detail`}
                            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                            transition={{ duration: reduceMotion ? 0 : 0.18 }}
                          >
                            <StageDetail stage={stage} />
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-line/60 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Next / Act IV
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              The signal.
            </p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted">
              The attack is known. What could the telemetry have carried?
            </p>
          </div>
          <a
            href="#signal"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
          >
            Follow the record
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
