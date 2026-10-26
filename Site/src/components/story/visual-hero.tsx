import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, Pause, Play, RotateCcw } from "lucide-react";
import { metrics, repoBlob, stages } from "@/data";
import { SceneFrame, SectionKicker, StatusPill, statusColor, tone } from "./visual-shared";

const path = "M 80 190 C 170 92, 238 268, 330 170 S 500 92, 584 166 S 700 216, 800 124";
const nodePositions = [
  [80, 190], [118, 156], [152, 128], [186, 116], [220, 138], [252, 184], [286, 214], [320, 196], [354, 168], [390, 138],
  [426, 120], [462, 132], [496, 158], [530, 180], [566, 168], [604, 152], [642, 160], [680, 182], [724, 170], [800, 124],
] as const;

export function VisualHero() {
  const reduceMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState("17");
  const [playKey, setPlayKey] = useState(0);
  const [playing, setPlaying] = useState(!reduceMotion);
  const active = stages.find((stage) => stage.id === activeStage) ?? stages[0];

  return (
    <section id="top" className="relative overflow-hidden border-b border-line/70 pb-16 pt-12 sm:pb-24 sm:pt-20">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-48 top-10 h-[34rem] w-[34rem] rounded-full bg-teal/10 blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 top-32 h-[28rem] w-[28rem] rounded-full bg-rose/10 blur-[150px]" aria-hidden="true" />
      <div className="container-page relative">
        <SectionKicker index="00 / OPENING" label="Evidence-first SOC lab" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-end lg:gap-12">
          <div>
            <motion.p initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              The intrusion is only half the story.
            </motion.p>
            <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.05 }} className="mt-5 max-w-[12ch] text-balance text-5xl font-semibold leading-[0.9] tracking-[-0.07em] text-ink sm:text-6xl lg:text-[5.9rem]">
              I built a SOC lab, then measured what it could actually see.
            </motion.h1>
            <motion.p initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.14 }} className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
              An Active Directory environment. A 20-stage intrusion. The honest result is not one score — it is a trail of alerts, blind spots, and evidence labels.
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#attack" className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas transition hover:bg-ink">
                Watch the playback <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a href={`${repoBlob}/INDEX.md`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-line/80 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:border-teal/40 hover:text-ink">
                Open the truth layer
              </a>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                [String(metrics.stageCount), "stages"],
                [String(metrics.durationMinutes), "minutes"],
                [String(metrics.operationalAlertCount), "alerted"],
                [String(metrics.totalGapCount), "gaps named"],
              ].map(([value, label]) => (
                <div key={label} className="border-l border-line/80 pl-3">
                  <dt className="font-mono text-2xl font-semibold tracking-[-0.05em] text-ink">{value}</dt>
                  <dd className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <SceneFrame className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">The path / auto pass</p>
                <p className="mt-1 text-sm text-muted">Hover a node. Watch the sensor rings wake up.</p>
              </div>
              <button type="button" onClick={() => { setPlayKey((key) => key + 1); setPlaying(true); }} className="inline-flex items-center gap-2 rounded-full border border-line/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition hover:border-teal/40 hover:text-teal">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Replay
              </button>
            </div>
            <div className="relative mt-4">
              <svg viewBox="0 0 880 300" role="img" aria-labelledby="hero-path-title hero-path-desc" className="h-auto w-full">
                <title id="hero-path-title">The attack path through four SOC Lab zones</title>
                <desc id="hero-path-desc">A glowing line moves from the attacker zone through the gateway and victim network into the SOC cloud. Twenty stage nodes sit along the path.</desc>
                <defs>
                  <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                  <linearGradient id="hero-path-gradient" x1="0" x2="1"><stop offset="0" stopColor={tone.attacker} /><stop offset="0.48" stopColor={tone.gap} /><stop offset="1" stopColor={tone.defender} /></linearGradient>
                </defs>
                <path d={path} fill="none" stroke={tone.line} strokeWidth="10" strokeLinecap="round" opacity="0.55" />
                <motion.path key={playKey} d={path} fill="none" stroke="url(#hero-path-gradient)" strokeWidth="3" strokeLinecap="round" filter="url(#hero-glow)" initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }} animate={playing && !reduceMotion ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 5.6, ease: "easeInOut" }} onAnimationComplete={() => setPlaying(false)} />
                {[{ x: 330, label: "Suricata", color: tone.defender }, { x: 584, label: "Wazuh", color: tone.defender }].map((sensor) => (
                  <g key={sensor.label}>
                    <circle cx={sensor.x} cy="170" r="26" fill="none" stroke={sensor.color} strokeDasharray="3 5" opacity="0.36" />
                    <motion.circle cx={sensor.x} cy="170" r="12" fill="none" stroke={sensor.color} strokeWidth="1.5" initial={{ opacity: 0.25, scale: 0.7 }} animate={reduceMotion ? { opacity: 0.7, scale: 1 } : { opacity: [0.25, 0.8, 0.25], scale: [0.7, 1.25, 0.7] }} transition={{ duration: 2.4, repeat: Infinity, delay: sensor.x === 584 ? 0.8 : 0 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} />
                    <SvgSmallLabel x={sensor.x} y={238}>{sensor.label}</SvgSmallLabel>
                  </g>
                ))}
                <ZoneLabel x={80} y={72} label="ATTACKER" sub="Kali / .232.135" color={tone.attacker} />
                <ZoneLabel x={330} y={72} label="GATEWAY" sub="Suricata / .56.150" color={tone.infrastructure} />
                <ZoneLabel x={584} y={72} label="VICTIM" sub="AD / DVWA / Win10" color={tone.infrastructure} />
                <ZoneLabel x={800} y={72} label="SOC CLOUD" sub="Wazuh + TheHive" color={tone.defender} anchor="end" />
                {nodePositions.map(([x, y], index) => {
                  const stage = stages[index];
                  if (!stage) return null;
                  const color = statusColor(stage.status);
                  const selected = activeStage === stage.id;
                  return (
                    <g key={stage.id} role="button" tabIndex={0} aria-label={`Stage ${stage.id}: ${stage.title}, ${stage.status}`} onMouseEnter={() => setActiveStage(stage.id)} onFocus={() => setActiveStage(stage.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setActiveStage(stage.id); }}>
                      <circle cx={x} cy={y} r={selected ? 8 : 5.5} fill={color} stroke={tone.ink} strokeWidth={selected ? 2 : 1} opacity={selected ? 1 : 0.86} />
                      {selected ? <circle cx={x} cy={y} r="13" fill="none" stroke={color} strokeDasharray="2 4" opacity="0.65" /> : null}
                      <text x={x} y={y - 13} textAnchor="middle" fill={selected ? tone.ink : tone.faint} fontFamily="var(--font-mono)" fontSize="9">{stage.id}</text>
                    </g>
                  );
                })}
              </svg>
              <AnimatePresence mode="wait">
                <motion.div key={active.id} initial={reduceMotion ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -4 }} className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Stage {active.id} / {active.techniqueId}</p>
                    <p className="mt-1 text-base font-medium text-ink">{active.title}</p>
                  </div>
                  <StatusPill status={active.status} compact />
                </motion.div>
              </AnimatePresence>
            </div>
            <button type="button" onClick={() => setPlaying((value) => !value)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-line/80 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:border-teal/40 hover:text-teal">
              {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
              {playing ? "Pause path" : "Play path"}
            </button>
          </SceneFrame>
        </div>
      </div>
    </section>
  );
}

function ZoneLabel({ x, y, label, sub, color, anchor = "start" }: { x: number; y: number; label: string; sub: string; color: string; anchor?: "start" | "end" }) {
  return <g><text x={x} y={y} textAnchor={anchor} fill={color} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.8">{label}</text><text x={x} y={y + 16} textAnchor={anchor} fill={tone.faint} fontFamily="var(--font-mono)" fontSize="9">{sub}</text></g>;
}

function SvgSmallLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return <text x={x} y={y} textAnchor="middle" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">{children}</text>;
}
