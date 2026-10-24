import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Radio,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import {
  chapters,
  gapCount,
  repoBlob,
  stages,
  statusLegend,
  verifiedCount,
} from "@/data";
import { ChapterHandoff } from "@/components/chapter-handoff";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const offlineStages = stages.filter((stage) =>
  stage.telemetry.toLowerCase().includes("offline"),
);

export function Detection() {
  return (
    <section id="detection" className="section-shell">
      <div className="container-page">
        <SectionHeader chapter={chapters[2]} />

        <div className="mt-10 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="relative overflow-hidden p-5 sm:p-6">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-teal">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Verified coverage
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-5xl font-semibold tracking-[-0.06em] text-ink">
                    {verifiedCount}
                  </span>
                  <span className="font-mono text-xl text-faint">/ {stages.length}</span>
                </div>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                  A written rule is a hypothesis. Coverage becomes verified only
                  when the stage runs, the rule fires for the right reason, and
                  the alert is actionable in TheHive.
                </p>
              </div>
              <Badge tone="teal">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                {verifiedCount} of {stages.length} verified
              </Badge>
            </div>
            <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-line/60">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal to-blue transition-all duration-500"
                style={{ width: `${(verifiedCount / stages.length) * 100}%` }}
              />
            </div>
            <div className="relative mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
              <span>0%</span>
              <span className="font-medium text-teal">80% Validated</span>
              <span>100%</span>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Card className="p-3 sm:p-4">
              <Radio className="h-4 w-4 text-teal" aria-hidden="true" />
              <div className="mt-3 font-mono text-2xl font-semibold text-ink">
                {stages.length}
              </div>
              <p className="mt-1 text-[11px] leading-4 text-faint">
                detection checks mapped to stages
              </p>
            </Card>
            <Card className="p-3 sm:p-4">
              <WifiOff className="h-4 w-4 text-amber" aria-hidden="true" />
              <div className="mt-3 font-mono text-2xl font-semibold text-ink">
                {offlineStages.length}
              </div>
              <p className="mt-1 text-[11px] leading-4 text-faint">
                offline-only stages with no direct sensor signal
              </p>
            </Card>
            <Card className="p-3 sm:p-4">
              <BookOpenCheck className="h-4 w-4 text-blue" aria-hidden="true" />
              <div className="mt-3 font-mono text-2xl font-semibold text-ink">
                {gapCount}
              </div>
              <p className="mt-1 text-[11px] leading-4 text-faint">
                documented visibility & offline gaps
              </p>
            </Card>
            <Card className="p-3 sm:p-4">
              <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
              <div className="mt-3 font-mono text-2xl font-semibold text-ink">{verifiedCount}</div>
              <p className="mt-1 text-[11px] leading-4 text-faint">
                verified alerts in the case record
              </p>
            </Card>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-amber/20 bg-amber/[0.04] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber/25 bg-amber/10 text-amber">
                <WifiOff className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-medium text-ink">
                  Offline stages need adjacent evidence
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Stages {offlineStages.map((stage) => stage.id).join(" and ")} happen
                  outside the monitored network. The record has to infer them from
                  the artifact that preceded them and the authentication that
                  followed, not from a packet capture.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-ink">Status vocabulary</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {statusLegend.map((item) => (
                <span
                  key={item.status}
                  title={item.meaning}
                  className="rounded-full border border-line/70 bg-canvas/40 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint"
                >
                  {item.status}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-faint">
              Hover a label for its definition. The matrix below is the current
              truth, not a target state.
            </p>
          </Card>
        </div>

        <Card className="mt-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 p-4 sm:px-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                Coverage matrix
              </p>
              <h3 className="mt-1 text-base font-medium text-ink">
                Stage by stage, what should have been visible
              </h3>
            </div>
            <a
              href={`${repoBlob}/03-Detection-Engineering/README.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              Full matrix
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>

          <p className="border-b border-line/60 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-faint sm:hidden">
            Scroll sideways for telemetry, gap, and status
          </p>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <caption className="sr-only">
                Detection status for all twenty attack stages
              </caption>
              <thead>
                <tr className="border-b border-line/60 bg-canvas/30">
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint sm:px-5">
                    Stage
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Expected signal
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Telemetry
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Gap
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint sm:px-5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {stages.map((stage) => (
                  <tr
                    key={stage.id}
                    className="border-b border-line/50 last:border-b-0 hover:bg-panel-2/40"
                  >
                    <td className="px-4 py-3 align-top sm:px-5">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] text-teal">{stage.id}</span>
                        <span className="text-xs font-medium text-ink">{stage.title}</span>
                      </div>
                    </td>
                    <td className="max-w-[22rem] px-4 py-3 align-top text-xs leading-5 text-muted">
                      <span className="line-clamp-2">{stage.defender}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-[10px] text-faint">
                      {stage.telemetry}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top font-mono text-[10px] text-amber">
                      {stage.gap}
                    </td>
                    <td className="px-4 py-3 align-top sm:px-5">
                      <StatusBadge status={stage.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <ChapterHandoff text={chapters[2].handoff} />
      </div>
    </section>
  );
}
