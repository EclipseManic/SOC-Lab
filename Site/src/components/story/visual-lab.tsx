import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Eye, Radio, Router, Server, Shield } from "lucide-react";
import { network, repoBlob } from "@/data";
import { SceneFrame, SectionKicker, SectionTitle, tone } from "./visual-shared";

const steps = [
  { label: "Outside", title: "Start with one attacker.", body: "Kali lives on an isolated NAT segment. The tools can reach the lab, not the SOC.", meta: "192.168.232.135 → gateway", color: tone.attacker },
  { label: "Boundary", title: "Route through the sensor.", body: "The dual-homed gateway moves packets from ens33 to ens37 while Suricata watches both interfaces.", meta: "ens33 .232.162 → ens37 .56.150", color: tone.infrastructure },
  { label: "Victim", title: "Give the attack somewhere to land.", body: "The domain controller, workstation, and DVWA share the isolated .56.0/24 victim network.", meta: "PC-DC .10 · Win10 .20 · DVWA .30", color: tone.infrastructure },
  { label: "SOC", title: "Carry host evidence inward.", body: "Wazuh agents ship telemetry through WireGuard. thecustomhive correlates alerts into TheHive.", meta: "10.8.0.0/24 → 10.122.0.0/16", color: tone.defender },
  { label: "Blind spot", title: "Name what the map cannot prove.", body: "Victim-to-victim traffic can stay inside the L2 segment. The gap is visible before it becomes an excuse.", meta: "Same-subnet traffic / amber boundary", color: tone.gap },
] as const;

export function VisualLab() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <section id="lab" className="border-b border-line/70 py-20 sm:py-28">
      <div className="container-page">
        <SectionKicker index="01 / LAB" label="Build the boundary" />
        <div className="mt-10"><SectionTitle eyebrow="The lab" title="A path with a known edge." body="The lab is designed as a visibility experiment: attacker, gateway, victims, and a private SOC. The same map explains both the route and the blind spot." /></div>
        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start lg:gap-10">
          <div className="space-y-2 lg:sticky lg:top-24">
            {steps.map((item, index) => {
              const selected = index === active;
              return (
                <button key={item.label} type="button" onClick={() => setActive(index)} className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${selected ? "border-teal/45 bg-teal/[0.06]" : "border-line/70 bg-panel/30 hover:border-line hover:bg-panel/60"}`} aria-current={selected ? "step" : undefined}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]" style={{ borderColor: `${item.color}70`, color: item.color }}>{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0"><span className="block font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: item.color }}>{item.label}</span><span className="mt-1 block text-base font-medium text-ink">{item.title}</span><span className="mt-1 block text-sm leading-5 text-faint">{item.body}</span></span>
                </button>
              );
            })}
            <a href={`${repoBlob}/01-Lab-Setup/README.md`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:text-teal">Read the setup record <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a>
          </div>

          <SceneFrame className="lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-line/70 px-4 py-4 sm:px-6"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">Topology / live step {String(active + 1).padStart(2, "0")}</p><p className="mt-1 text-sm text-muted">{step.meta}</p></div><span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint"><Eye className="h-3.5 w-3.5 text-teal" aria-hidden="true" /> visibility map</span></div>
            <div className="p-3 sm:p-6">
              <svg viewBox="0 0 760 470" role="img" aria-labelledby="lab-map-title lab-map-desc" className="w-full">
                <title id="lab-map-title">SOC Lab four-zone topology</title>
                <desc id="lab-map-desc">Kali reaches the victim network through a Suricata gateway. Wazuh and TheHive sit in a private cloud reached over WireGuard. The final step reveals an amber same-subnet blind spot.</desc>
                <defs><filter id="lab-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                <rect x="18" y="34" width="164" height="138" rx="18" fill="rgba(242,119,154,0.06)" stroke={tone.attacker} strokeOpacity="0.34" />
                <rect x="218" y="34" width="164" height="138" rx="18" fill="rgba(106,168,255,0.06)" stroke={tone.infrastructure} strokeOpacity="0.34" />
                <rect x="418" y="34" width="320" height="230" rx="18" fill="rgba(106,168,255,0.04)" stroke={tone.infrastructure} strokeOpacity="0.34" />
                <rect x="218" y="320" width="520" height="116" rx="18" fill="rgba(53,224,194,0.04)" stroke={tone.defender} strokeOpacity="0.34" />
                <MapZone x={34} y={58} label="ATTACKER" meta="Kali · .232.135" color={tone.attacker} icon={<Radio className="h-4 w-4" />} />
                <MapZone x={234} y={58} label="GATEWAY" meta={`Suricata · ${network.internalAddress}`} color={tone.infrastructure} icon={<Router className="h-4 w-4" />} />
                <MapZone x={434} y={58} label="VICTIM NETWORK" meta="192.168.56.0/24" color={tone.infrastructure} icon={<Server className="h-4 w-4" />} />
                <MapZone x={234} y={344} label="SOC CLOUD" meta="Wazuh · TheHive · WireGuard" color={tone.defender} icon={<Shield className="h-4 w-4" />} />
                <motion.path d="M 182 104 C 200 104, 200 104, 218 104" fill="none" stroke={tone.attacker} strokeWidth="3" strokeDasharray="5 7" animate={reduceMotion ? undefined : { strokeDashoffset: [0, -24] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
                <motion.path d="M 382 104 C 396 104, 402 104, 418 104" fill="none" stroke={tone.infrastructure} strokeWidth="3" strokeDasharray="5 7" animate={reduceMotion ? undefined : { strokeDashoffset: [0, -24] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.2 }} />
                <motion.path d="M 300 172 C 300 230, 300 260, 350 320" fill="none" stroke={tone.defender} strokeWidth="3" strokeDasharray="5 7" animate={reduceMotion ? undefined : { strokeDashoffset: [0, -24] }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.4 }} />
                <motion.path d="M 540 264 C 500 302, 450 308, 420 320" fill="none" stroke={active === 4 ? tone.gap : tone.line} strokeWidth={active === 4 ? 3 : 2} strokeDasharray={active === 4 ? "6 8" : "2 10"} animate={active === 4 && !reduceMotion ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.25 }} transition={{ duration: 1.5, repeat: Infinity }} />
                <VictimNode x={446} y={140} label="PC-DC" ip=".10" />
                <VictimNode x={560} y={140} label="WIN10" ip=".20" />
                <VictimNode x={674} y={140} label="DVWA" ip=".30" />
                <text x="584" y="206" textAnchor="middle" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="10">L2 / same-subnet</text>
                <text x="584" y="288" textAnchor="middle" fill={active === 4 ? tone.gap : tone.faint} fontFamily="var(--font-mono)" fontSize="11" letterSpacing="1.2">{active === 4 ? "BLIND SPOT: VICTIM ↔ VICTIM" : ""}</text>
                <text x="478" y="386" fill={tone.muted} fontFamily="var(--font-mono)" fontSize="10">agents → WireGuard → Wazuh</text>
                <text x="478" y="406" fill={tone.muted} fontFamily="var(--font-mono)" fontSize="10">correlation → TheHive</text>
              </svg>
              <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-line/70 pt-4 font-mono text-[9px] uppercase tracking-[0.13em] text-faint"><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose" /> attacker action</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-teal" /> defender path</span><span className="inline-flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber" /> gap / blind spot</span></div>
            </div>
          </SceneFrame>
        </div>
      </div>
    </section>
  );
}

function MapZone({ x, y, label, meta, color, icon }: { x: number; y: number; label: string; meta: string; color: string; icon: React.ReactNode }) {
  return <g><foreignObject x={x} y={y} width="140" height="54"><div className="flex items-center gap-2" style={{ color }}><span className="flex h-7 w-7 items-center justify-center rounded-lg border" style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}>{icon}</span><span><span className="block font-mono text-[10px] tracking-[0.15em]">{label}</span><span className="mt-1 block font-mono text-[9px] text-slate">{meta}</span></span></div></foreignObject></g>;
}

function VictimNode({ x, y, label, ip }: { x: number; y: number; label: string; ip: string }) {
  return <g><rect x={x} y={y} width="86" height="52" rx="12" fill="rgba(6,10,17,0.72)" stroke={tone.infrastructure} strokeOpacity="0.44" /><text x={x + 43} y={y + 22} textAnchor="middle" fill={tone.ink} fontFamily="var(--font-mono)" fontSize="11">{label}</text><text x={x + 43} y={y + 38} textAnchor="middle" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="10">192.168.56{ip}</text></g>;
}
