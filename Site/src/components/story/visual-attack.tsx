import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Clock3, Maximize2, Pause, Play, Terminal } from "lucide-react";
import { metrics, stageById, stages, timeline, repoBlob, type Stage } from "@/data";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnatomyPlate, SectionKicker, SectionTitle, StatusPill, formatClock, tone } from "./visual-shared";

const attackAssetByStage: Record<string, string> = {
  "01": "/evidence/attack-01.webp", "02": "/evidence/attack-02.webp", "03": "/evidence/attack-03.webp", "04": "/evidence/attack-04.webp", "05": "/evidence/attack-05.webp", "06": "/evidence/attack-06.webp", "07": "/evidence/attack-07.webp", "08": "/evidence/attack-08.webp", "09": "/evidence/attack-09.webp", "10": "/evidence/attack-10.webp", "11": "/evidence/attack-11.webp", "12": "/evidence/attack-12.webp", "13": "/evidence/attack-13.webp", "14": "/evidence/attack-14.webp", "15": "/evidence/attack-15.webp", "16": "/evidence/attack-16.webp", "17": "/evidence/attack-17.webp", "18": "/evidence/attack-18.webp", "19": "/evidence/attack-19.webp", "20": "/evidence/attack-20.webp",
};

const timelineEvents = timeline.events as Array<{ stageId: string; offsetSeconds: number; endOffsetSeconds: number; phase: string; telemetryEvent: string; sourceSensor: string; elapsedLabel: string }>;

function toolForStage(stage: Stage) {
  const text = `${stage.attacker} ${stage.plain}`.toLowerCase();
  const tools = ["Nmap", "Nikto", "Hashcat", "Responder", "BloodHound", "SharpHound", "Impacket", "GetUserSPNs.py", "secretsdump.py", "wmiexec.py", "SCP", "Python", "Netcat", "SQL payload"];
  return tools.find((tool) => text.includes(tool.toLowerCase())) ?? "Documented action";
}

export function VisualAttack() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const currentEvent = timelineEvents[index] ?? timelineEvents[0];
  const currentStage = stageById(currentEvent.stageId) ?? stages[0];
  const phaseCounts = useMemo(() => timelineEvents.reduce<Record<string, number>>((counts, event) => { counts[event.phase] = (counts[event.phase] ?? 0) + 1; return counts; }, {}), []);

  function setStage(next: number) {
    setIndex(Math.max(0, Math.min(timelineEvents.length - 1, next)));
  }

  return (
    <section id="attack" className="border-b border-line/70 py-20 sm:py-28">
      <div className="container-page">
        <SectionKicker index="02 / PLAYBACK" label="Execution order, not stage order"><span className="hidden sm:inline">T0 = 11:40:09 UTC</span></SectionKicker>
        <div className="mt-10"><SectionTitle eyebrow="The attack" title={`${metrics.stageCount} moves in ${metrics.durationMinutes} minutes.`} body="The stage numbers are labels, not a clock. This playback follows the actual execution sequence from timeline.md — including 12 before 10, and 19 before 16." /></div>
        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-4">{Object.entries(phaseCounts).map(([phase, count]) => <div key={phase} className="rounded-2xl border border-line/70 bg-panel/35 p-4"><p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">{phase}</p><p className="mt-2 font-mono text-xl text-ink">{count}</p><p className="mt-1 text-xs text-faint">timeline beats</p></div>)}</div>
        <AnatomyPlate
          fig="FIG 04 // TIMELINE"
          title="20-STAGE INTRUSION CHRONOLOGY & EVIDENCE PLAYBACK"
          hint="[SCRUB TIMELINE] TRACE EXECUTION SEQUENCE · [AUTO-PLAY] 74-MINUTE INTRUSION · [OPEN FRAME] MAGNIFY PROOF SCREENSHOT"
          readout={`BEAT ${index + 1} / ${timelineEvents.length} · T0 ${formatClock(currentEvent.offsetSeconds)} · STAGE ${currentStage.id}`}
          className="mt-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-teal" aria-hidden="true" />
              <span className="font-mono text-sm font-semibold text-ink">{formatClock(currentEvent.offsetSeconds)}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">/ {currentEvent.elapsedLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlaying((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-line/80 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition hover:border-teal/40 hover:text-teal"
              >
                {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
                {playing ? "Pause" : "Auto-play"}
              </button>
              <span className="font-mono text-[9px] text-faint">{index + 1} / {timelineEvents.length}</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="hidden md:block"><div className="relative h-24"><div className="absolute left-0 right-0 top-9 h-px bg-line" /><motion.div className="absolute left-0 top-9 h-px bg-gradient-to-r from-rose via-amber to-teal" animate={{ width: `${(index / (timelineEvents.length - 1)) * 100}%` }} transition={{ duration: reduceMotion ? 0 : 0.3 }} />{timelineEvents.map((event, itemIndex) => { const stage = stageById(event.stageId) ?? stages[0]; const offline = stage.status === "Detection gap"; return <button key={`${event.stageId}-${itemIndex}`} type="button" onClick={() => setStage(itemIndex)} aria-label={`Jump to stage ${event.stageId}, ${stage.title}`} className="group absolute top-0 -translate-x-1/2" style={{ left: `${(itemIndex / (timelineEvents.length - 1)) * 100}%` }}><span className={`mx-auto block h-4 w-4 rounded-full border-2 ${offline ? "border-dashed" : ""}`} style={{ backgroundColor: itemIndex <= index ? tone.defender : tone.panel, borderColor: offline ? tone.slate : itemIndex <= index ? tone.defender : tone.line }} /><span className="mt-2 block font-mono text-[9px] text-faint group-hover:text-ink">{event.stageId}</span></button>; })}</div></div>
            <div className="md:hidden"><input aria-label="Stage timeline" type="range" min={0} max={timelineEvents.length - 1} value={index} onChange={(event) => setStage(Number(event.target.value))} className="w-full accent-teal" /><div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-faint"><span>T0</span><span>+{metrics.durationMinutes}m</span></div></div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-start lg:gap-8">
              <div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.17em] text-rose">Stage {currentStage.id}</span><StatusPill status={currentStage.status} compact /></div><h3 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-[-0.05em] text-ink sm:text-4xl">{currentStage.title}</h3><p className="mt-4 text-base leading-7 text-muted">{currentStage.plain}</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Meta label="Tool" value={toolForStage(currentStage)} icon={<Terminal className="h-3.5 w-3.5" />} /><Meta label="ATT&CK" value={currentStage.techniqueId} /><Meta label="Sensor" value={currentEvent.sourceSensor} /><Meta label="Signal" value={currentEvent.telemetryEvent} /></div><div className="mt-6 flex flex-wrap items-center gap-4"><a href={`${repoBlob}/${currentStage.attackPath}`} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:text-teal">Open stage evidence ↗</a><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{currentStage.status === "Detection gap" ? "No victim telemetry" : "Evidence path recorded"}</span></div></div>
              <div><button type="button" onClick={() => setLightbox(true)} className="group relative block w-full overflow-hidden rounded-2xl border border-line/70 bg-canvas text-left"><img src={attackAssetByStage[currentStage.id]} alt={`Attack screenshot for stage ${currentStage.id}: ${currentStage.title}`} width="960" height="540" className="aspect-video w-full object-cover opacity-85 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100" /><span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-canvas/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.13em] text-ink"><Maximize2 className="h-3.5 w-3.5" aria-hidden="true" /> Open frame</span></button><p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Attack screenshot / stage {currentStage.id} · {currentStage.attackPath.split("/").at(-1)}</p></div>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-line/70 pt-4"><button type="button" onClick={() => setStage(index - 1)} disabled={index === 0} className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint disabled:opacity-30 hover:text-teal"><ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> previous</button><button type="button" onClick={() => setStage(index + 1)} disabled={index === timelineEvents.length - 1} className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint disabled:opacity-30 hover:text-teal">next <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button></div>
          </div>
        </AnatomyPlate>
        <Dialog open={lightbox} onOpenChange={setLightbox}><DialogContent className="max-w-4xl bg-canvas p-3 sm:p-5"><DialogHeader><DialogTitle>Stage {currentStage.id} / {currentStage.title}</DialogTitle><DialogDescription>{currentStage.plain}</DialogDescription></DialogHeader><img src={attackAssetByStage[currentStage.id]} alt={`Expanded attack screenshot for stage ${currentStage.id}`} width="960" height="540" className="mt-5 w-full rounded-xl border border-line/70" /></DialogContent></Dialog>
      </div>
    </section>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return <div className="rounded-xl border border-line/70 bg-canvas/50 p-3"><p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{icon}{label}</p><p className="mt-2 line-clamp-3 text-xs leading-5 text-ink">{value}</p></div>;
}
