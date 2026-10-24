import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cases, repoBlob, workflow } from "@/data";
import { cn } from "@/lib/utils";

const openFields = [
  "TheHive ID",
  "severity",
  "TLP / PAP",
  "summary",
  "findings",
  "timeline",
  "verdict",
];

export function CaseAct() {
  const [active, setActive] = useState<string>(cases[0].id);
  const current = cases.find((item) => item.id === active) ?? cases[0];

  return (
    <section
      id="case"
      aria-labelledby="case-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Act V / The case
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            05 of 06
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <h2
            id="case-heading"
            className="max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl"
          >
            Three cases.
            <br />
            One incident.
          </h2>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              The campaign is separated by incident boundary, not by tool or
              by stage count. Web compromise, credential movement, and domain
              impact each get a record.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              The case files are scaffolded. Scope and questions are written;
              findings and verdicts are not.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-3">
          {cases.map((item, index) => {
            const selected = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActive(item.id)}
                className={cn(
                  "rounded-2xl border p-5 text-left transition-colors",
                  selected
                    ? "border-teal/45 bg-teal/[0.06]"
                    : "border-line/70 bg-panel/25 hover:border-teal/25 hover:bg-panel/40",
                )}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className={cn("font-mono text-[10px]", selected ? "text-teal" : "text-faint")}>
                    {item.label}
                  </span>
                  <span className="font-mono text-[9px] text-faint">0{index + 1}</span>
                </span>
                <span className="mt-4 block text-xl font-semibold leading-tight tracking-[-0.025em] text-ink">
                  {item.title}
                </span>
                <span className="mt-3 block text-sm leading-6 text-muted">{item.scope}</span>
                <span className="mt-4 flex flex-wrap gap-1.5">
                  {item.stages.map((stage) => (
                    <span
                      key={stage}
                      className="rounded-full border border-line/70 px-2 py-0.5 font-mono text-[8px] text-faint"
                    >
                      {stage}
                    </span>
                  ))}
                </span>
                <span className="mt-4 block border-t border-line/60 pt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-amber">
                  {item.status}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 rounded-2xl border border-line/70 bg-panel/30 p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Case question / {current.label}
            </p>
            <h3 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink">
              {current.question}
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
              The question stays ahead of the finding. A case is not closed
              because a timeline exists; it is closed when the evidence can
              support a verdict.
            </p>
            <a
              href={`${repoBlob}/${current.path}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              Open the case file
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
          <div className="border-t border-line/60 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
              Still open
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {openFields.map((field) => (
                <span
                  key={field}
                  className="rounded-full border border-amber/25 bg-amber/[0.06] px-2.5 py-1 font-mono text-[9px] text-amber/85"
                >
                  {field}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-faint">
              Detailed analyst tasks, containment timestamps, and final verdicts
              remain open for manual triage. The case files document scope and
              observables while leaving conclusions unforced.
            </p>
          </div>
        </div>

        <div className="mt-14 border-t border-line/70 pt-8">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
              Triage sequence
            </span>
            <span className="h-px flex-1 bg-line/60" aria-hidden="true" />
          </div>
          <ol className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            {workflow.map((step) => (
              <li key={step.n} className="border-l border-line/70 pl-3">
                <p className="font-mono text-[9px] text-teal">{step.n}</p>
                <p className="mt-1 text-sm font-medium text-ink">{step.title}</p>
                <p className="mt-1 text-xs leading-5 text-faint">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-line/60 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Next / Act VI
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              The record.
            </p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted">
              The case work becomes a report. The report has to say what it
              cannot prove.
            </p>
          </div>
          <a
            href="#record"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
          >
            Open the report ledger
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
