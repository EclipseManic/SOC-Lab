import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight, Eye, Network, Router, Server, Shield, Wifi } from "lucide-react";
import { network, repoBlob } from "@/data";
import { AnatomyPlate, SectionKicker, SectionTitle, tone } from "./visual-shared";

type Focus = "attacker" | "gateway" | "victims" | "soc" | "blind";

const steps: Array<{ label: string; title: string; body: string; meta: string; focus: Focus; color: string }> = [
  { label: "01 / attacker", title: "The attack begins outside the victim subnet.", body: "Kali uses one adapter on VMware VMnet8 NAT and a static route that forces victim-bound traffic through the gateway.", meta: "Kali 192.168.232.135 · route via 192.168.232.162", focus: "attacker", color: tone.attacker },
  { label: "02 / boundary", title: "One VM is both router and network sensor.", body: "The gateway routes between ens33 and ens37. Suricata passively captures both interfaces; it does not sit inline as an IPS.", meta: "ens33 192.168.232.162 · ens37 192.168.56.150", focus: "gateway", color: tone.infrastructure },
  { label: "03 / victims", title: "Three hosts share the enterprise segment.", body: "PC-DC, Win10, and DVWA live on 192.168.56.0/24. Their default gateway is the Suricata gateway at .150.", meta: "PC-DC .10 · Win10 .20 · DVWA .30", focus: "victims", color: tone.infrastructure },
  { label: "04 / telemetry", title: "Evidence leaves the lab without losing source IPs.", body: "Wazuh agents send telemetry through the gateway and WireGuard to the private cloud. The Wazuh VM correlates; TheHive receives the incident alert.", meta: "1514/1515 → wg0 10.8.0.2 → VM1 → VM2", focus: "soc", color: tone.defender },
  { label: "05 / blind spot", title: "The L2 path is the honest boundary.", body: "Victim-to-victim traffic can stay inside VMnet2 and never cross the Layer 3 router. Host telemetry is authoritative; Suricata visibility is partial.", meta: "amber dashed path = same-subnet visibility limit", focus: "blind", color: tone.gap },
];

function emphasis(active: Focus, target: Focus) {
  return active === target ? 1 : 0.3;
}

export function VisualLab() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const step = steps[active] ?? steps[0];

  return (
    <section id="lab" className="border-b border-line/70 py-20 sm:py-28">
      <div className="container-page">
        <SectionKicker index="01 / LAB" label="Architecture and visibility" />
        <div className="mt-10"><SectionTitle eyebrow="The lab" title="How the lab is actually wired." body="This is not a conceptual four-box map. It is the route, the sensor placement, the telemetry transit, the cloud split, and the exact place where a packet can disappear from Suricata's view." /></div>

        <div className="mt-10 flex flex-wrap gap-2">
          {steps.map((item, index) => {
            const selected = index === active;
            return <button key={item.label} type="button" onClick={() => setActive(index)} aria-current={selected ? "step" : undefined} className={`rounded-full border px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.13em] transition ${selected ? "border-teal/45 bg-teal/10 text-teal" : "border-line/80 bg-panel/30 text-faint hover:border-line hover:text-ink"}`}><span style={{ color: selected ? undefined : item.color }}>{item.label}</span></button>;
          })}
        </div>

        <AnatomyPlate
          fig="FIG 03 // WIRING"
          title="HYBRID CLOUD TOPOLOGY & VISIBILITY BOUNDARIES"
          hint="[STEP SELECTOR] FOLLOW PACKET INGRESS · GATEWAY PROMISCUOUS SNIFFING · WIREGUARD TELEMETRY TRANSIT"
          readout={`STEP ${String(active + 1).padStart(2, "0")} / 05 · GATEWAY: ${network.internalAddress}`}
          className="mt-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/70 pb-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">Detailed topology / live step {String(active + 1).padStart(2, "0")}</p>
              <p className="mt-1 max-w-3xl text-sm text-muted">{step.meta}</p>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              <Eye className="h-3.5 w-3.5 text-teal" aria-hidden="true" /> route + sensor map
            </span>
          </div>

          <div className="hidden p-3 lg:block xl:p-6">
            <svg viewBox="0 0 1180 720" role="img" aria-labelledby="lab-map-title lab-map-desc" className="w-full">
              <title id="lab-map-title">SOC Lab network, sensor, telemetry, and cloud architecture</title>
              <desc id="lab-map-desc">Kali on the external NAT segment reaches a dual-homed Suricata gateway. The gateway routes to an isolated victim network containing the Domain Controller, Win10, and DVWA. Endpoint telemetry travels over WireGuard to a private cloud split between TheHive and Wazuh. An amber dashed same-subnet path shows the visibility boundary.</desc>
              <defs>
                <marker id="arrow-rose" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={tone.attacker} /></marker>
                <marker id="arrow-teal" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={tone.defender} /></marker>
                <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={tone.infrastructure} /></marker>
                <marker id="arrow-amber" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill={tone.gap} /></marker>
                <filter id="topology-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>

              <text x="30" y="24" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="2">LOCAL LAB / ROUTING + TELEMETRY + VISIBILITY</text>
              <text x="1150" y="24" textAnchor="end" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="10">authoritative gateway: {network.internalAddress}</text>

              <Zone x={28} y={58} width={236} height={286} label="01 / EXTERNAL ATTACK SEGMENT" sub="VMware VMnet8 NAT · 192.168.232.0/24" color={tone.attacker} opacity={emphasis(step.focus, "attacker")} />
              <Zone x={292} y={58} width={270} height={286} label="02 / SECURITY GATEWAY" sub="Ubuntu router + Suricata + WireGuard" color={tone.infrastructure} opacity={emphasis(step.focus, "gateway")} />
              <Zone x={590} y={58} width={562} height={286} label="03 / ISOLATED VICTIM NETWORK" sub="VMware VMnet2 · 192.168.56.0/24 · default gateway .150" color={tone.infrastructure} opacity={emphasis(step.focus, "victims")} />
              <Zone x={28} y={388} width={1124} height={294} label="04 / PRIVATE CLOUD SOC" sub="10.122.0.0/16 · no public service listeners" color={tone.defender} opacity={emphasis(step.focus, "soc")} />

              <FlowPath d="M 264 194 C 275 194, 280 194, 292 194" color={tone.attacker} marker="url(#arrow-rose)" opacity={emphasis(step.focus, "attacker")} animated={!reduceMotion && step.focus === "attacker"} label="attack traffic / static route" labelX={270} labelY={176} />
              <FlowPath d="M 562 194 C 574 194, 580 194, 590 194" color={tone.attacker} marker="url(#arrow-rose)" opacity={emphasis(step.focus, "gateway")} animated={!reduceMotion && step.focus === "gateway"} label="routed across ens33 → ens37" labelX={575} labelY={176} />
              <FlowPath d="M 862 344 C 820 382, 600 382, 438 344" color={tone.defender} marker="url(#arrow-teal)" opacity={emphasis(step.focus, "soc")} animated={!reduceMotion && step.focus === "soc"} label="agent telemetry / TCP 1514, 1515" labelX={640} labelY={374} />
              <FlowPath d="M 438 344 C 438 385, 438 430, 438 468" color={tone.defender} marker="url(#arrow-teal)" opacity={emphasis(step.focus, "soc")} animated={!reduceMotion && step.focus === "soc"} label="wg0 10.8.0.2 → 10.8.0.1" labelX={456} labelY={420} vertical />
              <FlowPath d="M 400 530 C 420 530, 434 530, 454 530" color={tone.gap} marker="url(#arrow-amber)" opacity={emphasis(step.focus, "soc")} animated={!reduceMotion && step.focus === "soc"} label="private VNet peering" labelX={426} labelY={514} />
              <FlowPath d="M 785 530 C 800 530, 810 530, 830 530" color={tone.gap} marker="url(#arrow-amber)" opacity={emphasis(step.focus, "soc")} animated={!reduceMotion && step.focus === "soc"} label="custom-thehive → TheHive API" labelX={807} labelY={514} />
              <FlowPath d="M 706 222 C 760 238, 806 238, 864 222" color={tone.gap} marker="url(#arrow-amber)" opacity={emphasis(step.focus, "blind")} dashed animated={!reduceMotion && step.focus === "blind"} label="L2 / same-subnet traffic" labelX={785} labelY={254} />

              <Node x={54} y={112} width={184} height={88} title="KALI LINUX" subtitle="192.168.232.135/24" lines={["eth0 · VMnet8 NAT", "default gw .232.2", "static route → .56.0/24"]} color={tone.attacker} icon="ATTACK" opacity={emphasis(step.focus, "attacker")} />
              <InfoStrip x={54} y={228} width={184} label="TOOL PLANE" value="Nmap · Python · Impacket · Hashcat" color={tone.attacker} opacity={emphasis(step.focus, "attacker")} />

              <Node x={314} y={104} width={226} height={92} title="SECURITY GATEWAY" subtitle="Ubuntu 24.04 · 2 vCPU" lines={[`ens33  ${network.externalAddress}`, `ens37  ${network.internalAddress}`, "ip_forward=1 · no NAT on wg0"]} color={tone.infrastructure} opacity={emphasis(step.focus, "gateway")} icon="ROUTER" />
              <InfoStrip x={314} y={218} width={226} label="SURICATA 8.0.6" value="AF-PACKET / ens33 + ens37 / passive IDS" color={tone.defender} opacity={emphasis(step.focus, "gateway")} />
              <InfoStrip x={314} y={270} width={226} label="WIREGUARD CLIENT" value="wg0 10.8.0.2/32 → hub 10.8.0.1" color={tone.defender} opacity={emphasis(step.focus, "gateway")} />

              <Node x={618} y={112} width={150} height={92} title="PC-DC" subtitle="192.168.56.10" lines={["Windows Server 2022", "AD DS · DNS · Kerberos", "Sysmon + Wazuh"]} color={tone.infrastructure} opacity={emphasis(step.focus, "victims")} icon="DC" />
              <Node x={790} y={112} width={150} height={92} title="WIN10" subtitle="192.168.56.20" lines={["domain workstation", "Sysmon + Wazuh", "ad\\victim"]} color={tone.infrastructure} opacity={emphasis(step.focus, "victims")} icon="HOST" />
              <Node x={962} y={112} width={150} height={92} title="DVWA" subtitle="192.168.56.30" lines={["Apache · PHP · MariaDB", "Auditd + bashcmd", "Wazuh · pivot host"]} color={tone.infrastructure} opacity={emphasis(step.focus, "victims")} icon="WEB" />
              <InfoStrip x={618} y={232} width={494} label="HOST TELEMETRY" value="Sysmon · Auditd · PAM · auth.log · Wazuh agents" color={tone.defender} opacity={emphasis(step.focus, "victims")} />
              <rect x="610" y="276" width="510" height="44" rx="12" fill="rgba(242,184,75,0.08)" stroke={tone.gap} strokeDasharray="6 6" opacity={emphasis(step.focus, "blind")} />
              <text x="630" y="296" fill={tone.gap} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.2" opacity={emphasis(step.focus, "blind")}>VISIBILITY BOUNDARY</text>
              <text x="630" y="313" fill={tone.muted} fontFamily="var(--font-mono)" fontSize="10" opacity={emphasis(step.focus, "blind")}>victim ↔ victim may stay on VMnet2; host logs remain authoritative</text>

              <Node x={54} y={456} width={346} height={142} title="VM1 / CASE HUB" subtitle="10.122.0.4 · eth0 · wg0 10.8.0.1/24" lines={["WireGuard server · UDP 51820", "TheHive 5 · API 9000 / HTTPS 443", "NPM · Velociraptor · Cassandra · Elasticsearch"]} color={tone.defender} opacity={emphasis(step.focus, "soc")} icon="HUB" />
              <Node x={454} y={456} width={330} height={142} title="VM2 / WAZUH SIEM" subtitle="10.122.1.4 · private VNet" lines={["Wazuh Manager · TCP 1514 / 1515", "Indexer · Dashboard · REST API 55000", "custom-thehive + thehive-flush.service"]} color={tone.defender} opacity={emphasis(step.focus, "soc")} icon="SIEM" />
              <Node x={830} y={456} width={284} height={142} title="ANALYST ACCESS" subtitle="Host laptop · 10.8.0.3" lines={["WireGuard VPN client", "NPM routes wazuh.lab / thehive.lab", "no public dashboard or case UI"]} color={tone.infrastructure} opacity={emphasis(step.focus, "soc")} icon="USER" />
              <text x="54" y="635" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.2">ALERT PATH: Wazuh analysis → SQLite queue → custom-thehive → TheHive alert / case</text>
            </svg>
          </div>

          <div className="p-4 lg:hidden">
            <MobileTopology active={step.focus} reduceMotion={Boolean(reduceMotion)} />
          </div>

          <div className="grid gap-3 border-t border-line/70 bg-canvas/40 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4"><Legend color={tone.attacker} title="Attack wire" body="Kali → gateway → victims" /><Legend color={tone.defender} title="Telemetry" body="agents → WireGuard → Wazuh" /><Legend color={tone.gap} title="Alert handoff / gap" body="private VNet or L2 boundary" /><Legend color={tone.infrastructure} title="Infrastructure" body="hosts, interfaces, and services" /></div>
        </AnatomyPlate>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-line/70 bg-panel/35 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: step.color }}>{step.label}</p><p className="mt-1 text-lg font-medium tracking-[-0.02em] text-ink">{step.title}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-muted">{step.body}</p></div><a href={`${repoBlob}/01-Lab-Setup/README.md`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-faint hover:text-teal">Read the setup record <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}

function Zone({ x, y, width, height, label, sub, color, opacity }: { x: number; y: number; width: number; height: number; label: string; sub: string; color: string; opacity: number }) {
  return <g opacity={opacity}><rect x={x} y={y} width={width} height={height} rx="20" fill={`${color}08`} stroke={color} strokeOpacity="0.42" /><text x={x + 18} y={y + 24} fill={color} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.7">{label}</text><text x={x + 18} y={y + 42} fill={tone.faint} fontFamily="var(--font-mono)" fontSize="10">{sub}</text></g>;
}

function Node({ x, y, width, height, title, subtitle, lines, color, opacity, icon }: { x: number; y: number; width: number; height: number; title: string; subtitle: string; lines: string[]; color: string; opacity: number; icon: string }) {
  return <g opacity={opacity}><rect x={x} y={y} width={width} height={height} rx="14" fill="rgba(6,10,17,0.9)" stroke={color} strokeOpacity="0.58" /><rect x={x + 14} y={y + 14} width="42" height="22" rx="7" fill={`${color}16`} stroke={color} strokeOpacity="0.4" /><text x={x + 35} y={y + 29} textAnchor="middle" fill={color} fontFamily="var(--font-mono)" fontSize="8" letterSpacing="1">{icon}</text><text x={x + 68} y={y + 29} fill={tone.ink} fontFamily="var(--font-mono)" fontSize="12" fontWeight="600" letterSpacing="0.6">{title}</text><text x={x + 16} y={y + 56} fill={tone.muted} fontFamily="var(--font-mono)" fontSize="10">{subtitle}</text>{lines.map((line, index) => <text key={line} x={x + 16} y={y + 74 + index * 14} fill={tone.faint} fontFamily="var(--font-mono)" fontSize="9">{line}</text>)}</g>;
}

function InfoStrip({ x, y, width, label, value, color, opacity }: { x: number; y: number; width: number; label: string; value: string; color: string; opacity: number }) {
  return <g opacity={opacity}><rect x={x} y={y} width={width} height="38" rx="10" fill={`${color}0d`} stroke={color} strokeOpacity="0.3" /><text x={x + 12} y={y + 15} fill={color} fontFamily="var(--font-mono)" fontSize="8" letterSpacing="1.3">{label}</text><text x={x + 12} y={y + 29} fill={tone.muted} fontFamily="var(--font-mono)" fontSize="9">{value}</text></g>;
}

function FlowPath({ d, color, marker, opacity, animated, dashed = false, label, labelX, labelY, vertical = false }: { d: string; color: string; marker: string; opacity: number; animated: boolean; dashed?: boolean; label: string; labelX: number; labelY: number; vertical?: boolean }) {
  return <g opacity={opacity}><motion.path d={d} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? "7 8" : "5 8"} markerEnd={marker} animate={animated ? { strokeDashoffset: [0, -26] } : undefined} transition={animated ? { duration: 1.15, repeat: Infinity, ease: "linear" } : undefined} /><rect x={vertical ? labelX - 8 : labelX - label.length * 2.7} y={labelY - 12} width={vertical ? 16 : label.length * 5.4 + 16} height="18" rx="5" fill="#060a11" stroke={color} strokeOpacity="0.22" /><text x={labelX} y={labelY} textAnchor={vertical ? "start" : "middle"} fill={color} fontFamily="var(--font-mono)" fontSize="9">{label}</text></g>;
}

function Legend({ color, title, body }: { color: string; title: string; body: string }) {
  return <div className="flex items-start gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} /><span><span className="block font-mono text-[9px] uppercase tracking-[0.13em]" style={{ color }}>{title}</span><span className="mt-1 block text-xs leading-5 text-faint">{body}</span></span></div>;
}

function MobileTopology({ active, reduceMotion }: { active: Focus; reduceMotion: boolean }) {
  const cards = [
    { title: "Kali / external NAT", meta: "192.168.232.135 · eth0 · VMnet8", body: "Static route to 192.168.56.0/24 via 192.168.232.162", color: tone.attacker, icon: <Network className="h-4 w-4" /> },
    { title: "Security gateway", meta: "ens33 .232.162 · ens37 .56.150 · wg0 10.8.0.2", body: "Linux router, Suricata AF-PACKET on both interfaces, Wazuh agent, WireGuard client.", color: tone.infrastructure, icon: <Router className="h-4 w-4" /> },
    { title: "Victim network", meta: "192.168.56.0/24 · default gateway .150", body: "PC-DC .10 · Win10 .20 · DVWA .30/.232.161. Sysmon, Auditd, PAM, auth.log, Wazuh.", color: tone.infrastructure, icon: <Server className="h-4 w-4" /> },
    { title: "Private cloud SOC", meta: "VM1 .0.4 / wg0 .1 · VM2 .1.4", body: "WireGuard → VM1 hub/TheHive → private VNet → VM2 Wazuh/custom-thehive.", color: tone.defender, icon: <Shield className="h-4 w-4" /> },
  ];
  return <div className="space-y-2">{cards.map((card, index) => <div key={card.title}><div className="rounded-2xl border p-4" style={{ borderColor: `${card.color}${active === (index === 0 ? "attacker" : index === 1 ? "gateway" : index === 2 ? "victims" : "soc") ? "88" : "38"}`, backgroundColor: `${card.color}08` }}><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl border" style={{ color: card.color, borderColor: `${card.color}55` }}>{card.icon}</span><div><p className="text-sm font-medium text-ink">{card.title}</p><p className="mt-1 font-mono text-[9px] text-faint">{card.meta}</p></div></div><p className="mt-3 text-xs leading-5 text-muted">{card.body}</p></div>{index < cards.length - 1 ? <div className="flex justify-center py-1"><motion.div animate={reduceMotion ? undefined : { y: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }}><ArrowDown className="h-4 w-4 text-teal" aria-hidden="true" /></motion.div></div> : null}</div>)}<div className="rounded-2xl border border-dashed border-amber/50 bg-amber/[0.05] p-4"><div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] text-amber"><Wifi className="h-4 w-4" aria-hidden="true" /> Same-subnet blind spot</div><p className="mt-2 text-sm leading-6 text-muted">Victim-to-victim traffic can remain inside VMnet2. Suricata's promiscuous capture may see selected broadcast/multicast traffic, but host telemetry is authoritative for direct unicast movement.</p></div></div>;
}
