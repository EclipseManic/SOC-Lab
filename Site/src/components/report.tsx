import {
  ArrowUpRight,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  ScrollText,
} from "lucide-react";
import { chapters, repoBlob, reportDocs } from "@/data";
import { ChapterHandoff } from "@/components/chapter-handoff";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function Report() {
  return (
    <section id="report" className="section-shell">
      <div className="container-page">
        <SectionHeader chapter={chapters[4]} />

        <div className="mt-10 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="relative overflow-hidden p-5 sm:p-6">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-rose/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-rose">
                  <ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
                  Incident report package
                </div>
                <h3 className="mt-3 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink">
                  A draft that says what the record can support — and what it
                  cannot.
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  The package follows NIST SP 800-61r3 and the PICERL lifecycle.
                  Confirmed facts, hypotheses, and recommended actions stay
                  separate. Response actions are marked executed only when they
                  actually were.
                </p>
              </div>
              <Badge tone="rose">Draft</Badge>
            </div>
            <div className="relative mt-6 flex flex-wrap gap-2">
              <Badge tone="neutral">
                <ClipboardCheck className="h-3 w-3" aria-hidden="true" />
                6 documents
              </Badge>
              <Badge tone="amber">
                <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                0 verified detections
              </Badge>
              <Badge tone="blue">3 cases referenced</Badge>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-ink">Writing rule</h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Every claim links to a stage, a log, a screenshot, or a case record.
              Missing evidence is named, not hidden. The report does not inherit
              confidence from the attack simulation.
            </p>
            <div className="mt-4 border-t border-line/70 pt-4">
              <a
                href={`${repoBlob}/05-Incident-Report/README.md`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
              >
                Open report package
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </Card>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {reportDocs.map((doc, index) => (
            <Card key={doc.path} className="group flex flex-col p-4 transition-colors hover:border-teal/25">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line/80 bg-canvas/50 text-rose">
                  <FileText className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-[10px] text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h4 className="mt-4 text-sm font-medium text-ink">{doc.title}</h4>
              <p className="mt-1.5 flex-1 text-xs leading-5 text-faint">{doc.purpose}</p>
              <a
                href={`${repoBlob}/${doc.path}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition group-hover:text-teal"
              >
                Read draft
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </a>
            </Card>
          ))}
        </div>

        <Card className="mt-3 border-amber/20 bg-amber/[0.04] p-5">
          <h3 className="text-sm font-medium text-ink">What this report will not claim</h3>
          <div className="mt-3 grid gap-2 text-sm leading-6 text-muted sm:grid-cols-3">
            <p className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" aria-hidden="true" />
              That a stage was detected when the rule has not been validated.
            </p>
            <p className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" aria-hidden="true" />
              That a containment action ran when it was only recommended.
            </p>
            <p className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber" aria-hidden="true" />
              That the timeline is complete when artifacts are still missing.
            </p>
          </div>
        </Card>

        <ChapterHandoff text={chapters[4].handoff} />
      </div>
    </section>
  );
}
