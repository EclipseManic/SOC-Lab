import { ArrowUpRight, FileSearch, GitBranch, ListChecks } from "lucide-react";
import { cases, chapters, repoBlob, stageById, workflow } from "@/data";
import { ChapterHandoff } from "@/components/chapter-handoff";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Investigation() {
  return (
    <section id="investigation" className="section-shell">
      <div className="container-page">
        <SectionHeader chapter={chapters[3]} />

        <Card className="mt-10 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 p-4 sm:px-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-teal" aria-hidden="true" />
              <h3 className="text-sm font-medium text-ink">How a case moves</h3>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Receive → conclude
            </span>
          </div>
          <div className="relative grid gap-px bg-line/50 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {workflow.map((step) => (
              <div key={step.n} className="bg-panel/80 p-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-teal">{step.n}</span>
                  <span className="h-px flex-1 bg-line/60" aria-hidden="true" />
                </div>
                <h4 className="mt-3 text-sm font-medium text-ink">{step.title}</h4>
                <p className="mt-1.5 text-xs leading-5 text-faint">{step.text}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {cases.map((item) => (
            <Card key={item.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-teal">
                    {item.label}
                  </p>
                  <h3 className="mt-2 text-lg font-medium leading-snug tracking-[-0.02em] text-ink">
                    {item.title}
                  </h3>
                </div>
                <Badge tone="amber">Verdict open</Badge>
              </div>

              <p className="mt-3 text-sm leading-6 text-muted">{item.scope}</p>

              <div className="mt-4 rounded-xl border border-line/70 bg-canvas/40 p-3.5">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  <FileSearch className="h-3 w-3" aria-hidden="true" />
                  Case question
                </div>
                <p className="mt-1.5 text-xs leading-5 text-ink/90">{item.question}</p>
              </div>

              <div className="mt-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                  Stages in scope
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.stages.map((stageId) => {
                    const stage = stageById(stageId);
                    return (
                      <span
                        key={stageId}
                        title={stage?.title}
                        className="rounded-md border border-line/70 bg-panel-2/60 px-1.5 py-1 font-mono text-[9px] text-faint"
                      >
                        {stageId}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-line/70 pt-4">
                <span className="text-[10px] text-faint">{item.status}</span>
                <a
                  href={`${repoBlob}/${item.path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-faint transition hover:text-teal"
                >
                  Case record
                  <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-blue/20 bg-blue/[0.04] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue/25 bg-blue/10 text-blue">
                <GitBranch className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-medium text-ink">
                  One incident, three boundaries
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  The cases group by incident boundary, not by tool or stage
                  count. That keeps the investigation from becoming twenty
                  disconnected tickets.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-ink">What is still open</h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted">
              <li className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" aria-hidden="true" />
                Verdicts are not written. The cases are scaffolds with questions,
                scope, and stage assignments.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" aria-hidden="true" />
                Observables and host artifacts still need to be attached to each
                stage before the timeline can be treated as final.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" aria-hidden="true" />
                The record says “open” on purpose. A closed case without evidence
                would be the weaker claim.
              </li>
            </ul>
          </Card>
        </div>

        <ChapterHandoff text={chapters[3].handoff} />
      </div>
    </section>
  );
}
