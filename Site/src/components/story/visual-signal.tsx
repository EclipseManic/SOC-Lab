import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, CircleAlert, FileJson, GitBranch, Radio, ServerCog, ShieldCheck } from "lucide-react";
import { alerts, metrics, repoBlob, stages, traceability } from "@/data";
import { AnatomyPlate, SectionKicker, SectionTitle, tone } from "./visual-shared";

type Mode = "direct" | "operational";
const sensors = ["Suricata", "Wazuh / host", "AD security"] as const;

function hasSensorSignal(stage: (typeof stages)[number], sensor: string, mode: Mode) {
  const generated = traceability.find((item) => item.id === stage.id) as { hasDirectDetection?: boolean; hasOperationalAlert?: boolean } | undefined;
  if (stage.status === "Detection gap") return false;
  if (mode === "direct" && !generated?.hasDirectDetection) return false;
  if (mode === "operational" && !generated?.hasOperationalAlert) return false;
  const text = `${stage.telemetry} ${stage.defender}`.toLowerCase();
  if (sensor === "Suricata") return /network|http|kerberos|smb|wire|suricata/.test(text);
  if (sensor === "Wazuh / host") return /wazuh|auditd|sysmon|process|linux|pam|fim|auth/.test(text);
  return /windows|directory|ad |ldap|kerberos|security eid/.test(text);
}

export function VisualSignal() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<Mode>("direct");
  const candidate = alerts.alerts.find((alert) => alert.title.toLowerCase().includes("backdoor")) ?? alerts.alerts[0];
  const stage = stages.find((item) => item.id === "17") ?? stages[0];
  const journey = [
    { label: "Victim event", detail: "DomainWin10 records the account change and logon context.", icon: <ServerCog className="h-4 w-4" />, color: tone.infrastructure },
    { label: "Wazuh agent", detail: "The endpoint event becomes a normalized Wazuh alert with the real rule ID.", icon: <Radio className="h-4 w-4" />, color: tone.defender },
    { label: "Manager", detail: "The Wazuh manager applies correlation and raises the event above the forwarding gate.", icon: <ShieldCheck className="h-4 w-4" />, color: tone.defender },
    { label: "custom-thehive", detail: "The queue groups the alert with campaign context before the API call.", icon: <GitBranch className="h-4 w-4" />, color: tone.gap },
    { label: "TheHive", detail: "The alert arrives as a case-management record with severity, tags, and sourceRef.", icon: <FileJson className="h-4 w-4" />, color: tone.defender },
  ];

  return (
    <section id="signal" className="border-b border-line/70 py-20 sm:py-28">
      <div className="container-page">
        <SectionKicker index="03 / SIGNAL" label="Coverage without flattening" />
        <div className="mt-10">
          <SectionTitle eyebrow="The signal" title="What did the SOC actually see?" body="One real alert shows the path from endpoint event to TheHive. The heatmap keeps the more difficult truth visible: direct-target detection and operational coverage are not the same claim." />
        </div>

        <AnatomyPlate
          fig="FIG 05 // SIGNAL PIPELINE"
          title="END-TO-END TELEMETRY LIFECYCLE (LIFE OF AN ALERT)"
          hint="[CLICK STAGE STEP] TRACE HOST SYSCALL -> FORWARDING -> CORRELATION -> QUEUE -> THEHIVE"
          readout={`sourceRef ${candidate.sourceRef} · LATENCY: ${candidate.timeToDetectMs}ms`}
          className="mt-10"
        >
          <div className="border-b border-line/70 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">Life of an alert / stage {stage.id}</p>
                <p className="mt-1 text-sm text-muted">{candidate.title}</p>
              </div>
              <span className="font-mono text-[9px] text-faint">sourceRef {candidate.sourceRef}</span>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid gap-3 md:grid-cols-5">
              {journey.map((item, index) => {
                const active = index <= step;
                return (
                  <button key={item.label} type="button" onClick={() => setStep(index)} className={`relative rounded-2xl border p-4 text-left transition ${active ? "border-teal/45 bg-teal/[0.06]" : "border-line/70 bg-canvas/45 hover:border-line"}`}>
                    <span className="flex items-center justify-between gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl border" style={{ color: item.color, borderColor: `${item.color}55`, backgroundColor: `${item.color}10` }}>{item.icon}</span><span className="font-mono text-[9px] text-faint">0{index + 1}</span></span>
                    <span className="mt-4 block text-sm font-medium text-ink">{item.label}</span>
                    <span className="mt-2 block text-xs leading-5 text-faint">{item.detail}</span>
                    {index < journey.length - 1 ? <ArrowRight className="absolute -right-3 top-10 z-10 hidden h-5 w-5 text-line md:block" aria-hidden="true" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 rounded-2xl border border-line/70 bg-canvas/60 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Observed rule / Wazuh step</p><p className="mt-1 font-mono text-sm text-ink">{stage.ruleId}</p></div>
                <div className="text-right"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Verified detection latency</p><p className="mt-1 font-mono text-sm text-teal">{candidate.timeToDetectMs} ms <span className="text-faint">(timestamp-verified)</span></p></div>
              </div>
            </div>
          </div>
        </AnatomyPlate>

        <AnatomyPlate
          fig="FIG 06 // HEATMAP"
          title="20-STAGE DETECTION MATRIX (DIRECT TARGET VS OPERATIONAL COVERAGE)"
          hint="[MATRIX SELECTOR] TOGGLE DIRECT TARGET (14/20 = 70%) VS OPERATIONAL TICKETS (16/20 = 80%)"
          readout={`MATRIX // ${metrics.directDetectionCount} DIRECT · ${metrics.operationalAlertCount} OPERATIONAL · ${metrics.totalGapCount} GAPS`}
          className="mt-8"
        >
          <div className="flex flex-col gap-4 border-b border-line/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">Coverage heatmap / {metrics.stageCount} × {sensors.length}</p>
              <p className="mt-1 text-sm text-muted">Toggle the claim: direct target signal or operational alert.</p>
            </div>
            <div className="flex rounded-full border border-line/80 bg-canvas/50 p-1">
              <button
                type="button"
                onClick={() => setMode("direct")}
                className={`rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] transition ${
                  mode === "direct" ? "bg-teal/20 text-teal font-semibold" : "text-faint hover:text-ink"
                }`}
              >
                Direct ({metrics.directDetectionCount})
              </button>
              <button
                type="button"
                onClick={() => setMode("operational")}
                className={`rounded-full px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.13em] transition ${
                  mode === "operational" ? "bg-blue/20 text-blue font-semibold" : "text-faint hover:text-ink"
                }`}
              >
                Operational ({metrics.operationalAlertCount})
              </button>
            </div>
          </div>
          <div className="overflow-x-auto p-4 sm:p-6">
            <div className="min-w-[660px]">
              <div className="grid grid-cols-[6rem_repeat(3,minmax(0,1fr))] gap-1 px-1 pb-2 font-mono text-[9px] uppercase tracking-[0.12em] text-faint"><span>Stage</span>{sensors.map((sensor) => <span key={sensor}>{sensor}</span>)}</div>
              {stages.map((currentStage) => <div key={currentStage.id} className="grid grid-cols-[6rem_repeat(3,minmax(0,1fr))] gap-1 border-t border-line/45 py-1"><div className="flex items-center gap-2 px-1"><span className="font-mono text-[9px] text-faint">{currentStage.id}</span><span className="truncate text-xs text-muted">{currentStage.title}</span></div>{sensors.map((sensor) => { const filled = hasSensorSignal(currentStage, sensor, mode); const gap = currentStage.status === "Logging gap" || currentStage.status === "Detection gap"; return <motion.div key={sensor} initial={reduceMotion ? false : { opacity: 0.4 }} animate={{ opacity: filled ? 1 : 0.42 }} className={`flex min-h-8 items-center justify-center rounded-md border ${filled ? "border-teal/35 bg-teal/15" : gap ? "border-dashed border-amber/30 bg-amber/[0.04]" : "border-line/50 bg-canvas/45"}`} title={`${currentStage.title}: ${filled ? `${sensor} signal present` : gap ? "named gap" : "no direct cell"}`}><span className={`h-2 w-2 rounded-full ${filled ? "bg-teal" : gap ? "bg-amber/60" : "bg-line"}`} aria-hidden="true" /></motion.div>; })}</div>)}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-line/70 px-4 py-4 font-mono text-[9px] uppercase tracking-[0.13em] text-faint sm:px-6"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal" /> signal present</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber" /> named logging/offline gap</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-line" /> not the claim</span></div>
        </AnatomyPlate>

        <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-teal/25 bg-teal/[0.04] p-5"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-teal"><Check className="h-4 w-4" aria-hidden="true" /> direct target signal</div><p className="mt-3 font-mono text-3xl text-ink">{metrics.directDetectionCount} / {metrics.stageCount}</p><p className="mt-2 text-sm leading-6 text-muted">Dedicated rules inspected target payloads, command arguments, process trees, or auth anomalies directly.</p></div><div className="rounded-2xl border border-amber/25 bg-amber/[0.04] p-5"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-amber"><CircleAlert className="h-4 w-4" aria-hidden="true" /> named gaps</div><p className="mt-3 font-mono text-3xl text-ink">{metrics.totalGapCount} / {metrics.stageCount}</p><p className="mt-2 text-sm leading-6 text-muted">Stages 04 and 11 are offline. Stages 09 and 12 are logging gaps. None are hidden under a success rate.</p></div></div>
        <div className="mt-8 flex justify-end"><a href={`${repoBlob}/INDEX.md`} target="_blank" rel="noreferrer" className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:text-teal">Open the traceability matrix ↗</a></div>
      </div>
    </section>
  );
}
