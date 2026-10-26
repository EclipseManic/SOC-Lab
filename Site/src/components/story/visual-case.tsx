import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cases, metrics, repoBlob, stages, timeline } from "@/data";
import { RepoLink, SceneFrame, SectionKicker, SectionTitle, StatusPill, tone } from "./visual-shared";

const findings = [
  "The web tier is the entry point; the evidence chain starts before root.",
  "The pivot is visible, but the directory query itself is not fully logged.",
  "Domain compromise is supported by host and directory events, not a single alert.",
] as const;

export function VisualCase() {
  const [open, setOpen] = useState<string>(cases[0].id);
  const timelineLastIndex = metrics.stageCount - 1;

  return (
    <section id="case" className="border-b border-line/70 py-20 sm:py-28">
      <div className="container-page">
        <SectionKicker index="04 / CASE" label="Three incidents, one story" />
        <div className="mt-10"><SectionTitle eyebrow="The case" title="Three incidents, one story." body="The cases share the same T0 axis. Each lane narrows the question: how did the campaign cross a boundary, what evidence carried it, and where does the record stop proving?" /></div>
        <SceneFrame className="mt-10">
          <div className="border-b border-line/70 px-4 py-4 sm:px-6"><div className="flex items-center justify-between gap-3"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">Shared incident axis</p><p className="font-mono text-[9px] text-faint">T0 → T0 + {metrics.durationMinutes}m</p></div></div>
          <div className="space-y-3 p-4 sm:p-6">
            {cases.map((item, index) => {
              const selected = item.id === open;
              const laneStages = item.stages.map((id) => stages.find((stage) => stage.id === id)).filter(Boolean);
              const positions = item.stages.map((id) => timeline.executionOrder.indexOf(id)).filter((position) => position >= 0);
              const start = Math.min(...positions);
              const end = Math.max(...positions);
              const color = index === 0 ? tone.attacker : index === 1 ? tone.gap : tone.defender;
              return (
                <div key={item.id} className={`overflow-hidden rounded-2xl border transition ${selected ? "border-teal/40 bg-teal/[0.04]" : "border-line/70 bg-canvas/40"}`}>
                  <button type="button" onClick={() => setOpen(selected ? "" : item.id)} className="grid w-full gap-4 p-4 text-left sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto] sm:items-center sm:p-5">
                    <span><span className="font-mono text-[9px] uppercase tracking-[0.15em] text-teal">{item.label}</span><span className="mt-2 block text-lg font-medium leading-tight tracking-[-0.03em] text-ink">{item.title}</span><span className="mt-1 block text-xs text-faint">Stages {item.stages[0]}–{item.stages.at(-1)}</span></span>
                    <span className="relative block h-10"><span className="absolute left-0 right-0 top-5 h-px bg-line" /><span className="absolute top-5 h-0.5 rounded-full" style={{ left: `${(start / timelineLastIndex) * 100}%`, width: `${Math.max(8, ((end - start) / timelineLastIndex) * 100)}%`, backgroundColor: color }} />{item.stages.map((stageId) => { const position = timeline.executionOrder.indexOf(stageId); return <span key={stageId} className="absolute top-[0.85rem] h-3 w-3 -translate-x-1/2 rounded-full border-2 border-canvas" style={{ left: `${(position / timelineLastIndex) * 100}%`, backgroundColor: color }} title={`Stage ${stageId}`} />; })}</span>
                    <span className="flex justify-end text-faint">{selected ? <ChevronUp className="h-5 w-5" aria-hidden="true" /> : <ChevronDown className="h-5 w-5" aria-hidden="true" />}</span>
                  </button>
                  {selected ? <div className="grid gap-6 border-t border-line/70 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] sm:p-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Finding</p><p className="mt-2 max-w-xl text-base leading-7 text-muted">{findings[index]}</p><div className="mt-4 flex flex-wrap gap-2">{laneStages.map((stage) => stage ? <StatusPill key={stage.id} status={stage.status} compact /> : null)}</div></div><div><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Scope</p><p className="mt-2 text-sm leading-6 text-muted">{item.scope}</p><p className="mt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-amber">{item.status}</p><div className="mt-4"><RepoLink href={`${repoBlob}/${item.path}`}>Go deeper in the case file</RepoLink></div></div></div> : null}
                </div>
              );
            })}
          </div>
        </SceneFrame>
        <p className="mt-6 max-w-2xl text-sm leading-6 text-faint">The lane is the summary. The case file is where observables, tasks, and verdict language can be inspected without turning the trailer into the manual.</p>
      </div>
    </section>
  );
}
