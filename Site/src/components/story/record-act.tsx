import { ArrowUpRight } from "lucide-react";
import { repoBlob, repoUrl, reportDocs } from "@/data";
import { cn } from "@/lib/utils";

type RecordStatus = "Draft" | "Scaffolded";

const recordMeta: Record<
  string,
  { status: RecordStatus; note: string; tone: string }
> = {
  "Incident report": {
    status: "Draft",
    tone: "text-amber",
    note: "Summary and scope exist. Impact and recommendations remain open.",
  },
  Timeline: {
    status: "Scaffolded",
    tone: "text-blue",
    note: "Rows are in place. Timestamps and the missing stage-04 entry remain open.",
  },
  IOCs: {
    status: "Draft",
    tone: "text-amber",
    note: "Indicators are listed. Hash values still need verification.",
  },
  "ATT&CK mapping": {
    status: "Scaffolded",
    tone: "text-blue",
    note: "The stage mapping exists. No check is marked validated.",
  },
  "Response actions": {
    status: "Scaffolded",
    tone: "text-blue",
    note: "Actions are planned. Execution is not asserted.",
  },
  "Lessons learned": {
    status: "Draft",
    tone: "text-amber",
    note: "Only DG-01 through DG-03 are recorded so far.",
  },
};

export function RecordAct() {
  return (
    <section
      id="record"
      aria-labelledby="record-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Act VI / The record
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            06 of 06
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <h2
            id="record-heading"
            className="max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl"
          >
            The report is a draft.
            <br />
            It says so.
          </h2>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Six documents form the incident package. None claims a detection
              success that the evidence cannot support.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              A record is not finished because it has headings. Draft,
              scaffolded, and open fields are part of the finding.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line/70 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            Record key
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-amber">
              Draft
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-blue">
              Scaffolded
            </span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint/70">
            Not a closed incident
          </span>
        </div>

        <div className="mt-2 border-t border-line/70">
          {reportDocs.map((doc, index) => {
            const meta = recordMeta[doc.title] ?? {
              status: "Draft" as const,
              tone: "text-faint",
              note: "This document remains open.",
            };
            return (
              <a
                key={doc.path}
                href={`${repoBlob}/${doc.path}`}
                target="_blank"
                rel="noreferrer"
                className="group grid gap-3 border-b border-line/60 py-5 transition-colors hover:bg-panel/30 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-5 sm:px-2"
              >
                <span className="font-mono text-[10px] text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-base font-medium tracking-[-0.015em] text-ink transition-colors group-hover:text-teal">
                      {doc.title}
                    </span>
                    <span className={cn("font-mono text-[9px] uppercase tracking-[0.1em]", meta.tone)}>
                      {meta.status}
                    </span>
                  </span>
                  <span className="mt-1 block max-w-2xl text-sm leading-6 text-muted">
                    {doc.purpose}
                  </span>
                  <span className="mt-1 block max-w-2xl text-xs leading-5 text-faint">
                    {meta.note}
                  </span>
                </span>
                <span className="flex items-center gap-2 sm:pt-0.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                    Open
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 text-faint transition-colors group-hover:text-teal"
                    aria-hidden="true"
                  />
                </span>
              </a>
            );
          })}
        </div>

        <div className="mt-12 grid gap-8 border-t border-line/70 pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
              End of story / start of the record
            </p>
            <h3 className="mt-3 max-w-lg text-3xl font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-4xl">
              The repository is the authoritative record.
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
              This site is the reading layer. Every claim should resolve to a
              file, a stage note, a log, or a documented gap. Where the evidence
              is missing, the record says so.
            </p>
          </div>
          <div className="flex flex-wrap content-start gap-3 lg:justify-end">
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-teal transition hover:border-teal/60"
            >
              Repository
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href={`${repoBlob}/INDEX.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line/80 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition hover:border-teal/35 hover:text-ink"
            >
              Index
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
            <a
              href={`${repoBlob}/05-Incident-Report/incident-report.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line/80 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted transition hover:border-teal/35 hover:text-ink"
            >
              Draft report
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
