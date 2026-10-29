import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Activity,
  ArrowDown,
  Compass,
  ExternalLink,
  Layers,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
} from "lucide-react";
import { AnatomyPlate, SectionKicker, StatusPill, statusColor, tone } from "./visual-shared";
import { metrics, repoBlob, stages } from "@/data";

// The 6 architectural tiers in the hybrid SOC lab
export interface AnatomyTier {
  id: string;
  name: string;
  level: string;
  ip: string;
  role: string;
  telemetry: string;
  color: string;
  components: string[];
}

export const ANATOMY_TIERS: AnatomyTier[] = [
  {
    id: "attacker",
    name: "Tier 01 // Attacker Infrastructure",
    level: "EXTERNAL / UNTRUSTED",
    ip: "192.168.232.135/24",
    role: "Offensive tooling origin (Kali Linux 2024.1). Weaponization, scanning, exploit staging, and C2 listener endpoints.",
    telemetry: "No internal defender agent. Observed entirely via ingress network flow and edge boundary sensors.",
    color: tone.attacker,
    components: ["Kali Linux 2024.1", "Nmap 7.94", "Metasploit Framework", "CrackMapExec", "Custom Python Brute-Force"],
  },
  {
    id: "gateway",
    name: "Tier 02 // Security Gateway & Wire NIDS",
    level: "BOUNDARY / DUAL-HOMED",
    ip: "192.168.232.160 · 192.168.56.150",
    role: "Single-door security boundary. Ubuntu 22.04 LTS dual-homed router enforcing zero-NAT transit between attacker and victim subnets.",
    telemetry: "Suricata 7.0.2 NIDS running AF-PACKET inspection on ens33 and ens37 with Emerging Threats Open ruleset.",
    color: tone.infrastructure,
    components: ["Ubuntu 22.04 LTS Gateway", "Suricata 7.0.2 NIDS", "AF-PACKET Dual-Sniff", "ET Open Ruleset (148 Rules)"],
  },
  {
    id: "dmz",
    name: "Tier 03 // DMZ Web Perimeter",
    level: "INTERNAL / DMZ",
    ip: "192.168.56.30/24",
    role: "Perimeter pivot host (DVWA on Debian Linux). Vulnerable HTTP application exposing SQLi, command injection, and file upload.",
    telemetry: "Apache2 access/error logs, PHP execution traces, and gateway wire captures for ingress HTTP payloads.",
    color: tone.gap,
    components: ["Debian Linux", "Apache 2.4.56", "PHP 8.2 Runtime", "DVWA Vulnerable Web App"],
  },
  {
    id: "internal",
    name: "Tier 04 // Victim Core & Domain Controller",
    level: "INTERNAL / AD DOMAIN",
    ip: "192.168.56.10 (DC) · 192.168.56.20 (Win10)",
    role: "Primary victim network. Windows Server 2019 Domain Controller (LAB.LOCAL) and Windows 10 enterprise workstation target.",
    telemetry: "Wazuh Agent 4.7.2, Sysmon v15 (SwiftOnSecurity schema), Windows Security Event Logs (4624, 4625, 4688, 4768, 4769).",
    color: tone.defender,
    components: ["Windows Server 2019 DC", "LAB.LOCAL Domain", "Windows 10 Workstation", "Active Directory Kerberos"],
  },
  {
    id: "pipeline",
    name: "Tier 05 // Syscall & Telemetry Pipeline",
    level: "SENSOR / AGENT LAYER",
    ip: "Kernel-level Driver / Loopback",
    role: "Real-time sensor layer. Kernel-mode driver hooks (Sysmon), security event provider callbacks, and auditd streaming engines.",
    telemetry: "Encrypted agent daemon streaming on TCP/1514 to the cloud manager with local disk backpressure spooling.",
    color: tone.cyan,
    components: ["Sysmon 15.0 Driver", "Wazuh Agent Daemon v4.7.2", "Windows Event Forwarding", "TLS Encrypted Pipeline"],
  },
  {
    id: "soc-cloud",
    name: "Tier 06 // SOC Cloud & SIEM Platform",
    level: "MANAGEMENT / ANALYTICS",
    ip: "10.0.0.4 (Cloud Private IP)",
    role: "Centralized SOC analytics tier. Wazuh All-in-One Manager + Indexer and TheHive 5 incident response ticketing orchestrator.",
    telemetry: "148 custom detection rules, real-time alert indexer, automated webhook alert ingestion into TheHive.",
    color: tone.cyan,
    components: ["Wazuh Manager 4.7.2", "OpenSearch Indexer", "Wazuh Dashboard", "TheHive 5 Incident Case System"],
  },
];

export function VisualHero() {
  const reduceMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState<string>("01");
  const [playing, setPlaying] = useState(false);
  const [playKey, setPlayKey] = useState(0);

  // 3D Isometric Exploded View State
  const [apart, setApart] = useState<number>(0.85); // 0 = compact, 1 = fully exploded
  const [yaw, setYaw] = useState<number>(36); // degrees horizontal rotation
  const [pitch, setPitch] = useState<number>(26); // degrees vertical tilt
  const [selectedTier, setSelectedTier] = useState<AnatomyTier>(ANATOMY_TIERS[3]);
  const [isCinematic, setIsCinematic] = useState(false);
  const [viewMode, setViewMode] = useState<"anatomy" | "vector">("anatomy");

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, yaw: 36, pitch: 26 });

  // 2D Vector Path Definition
  const path = "M 80 180 C 200 130 260 210 330 170 C 410 120 480 230 584 165 C 670 110 740 210 800 160";
  const nodePositions: [number, number][] = [
    [80, 180], [115, 168], [150, 158], [190, 150], [225, 152],
    [260, 164], [295, 178], [330, 170], [370, 152], [410, 138],
    [448, 142], [485, 165], [520, 185], [555, 182], [584, 165],
    [625, 142], [665, 128], [710, 135], [755, 162], [800, 160],
  ];

  const active = stages.find((s) => s.id === activeStage) ?? stages[0];

  // Mouse / Touch drag handlers for 3D orbital rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    // Update yaw and pitch smoothly
    setYaw(dragStart.current.yaw + dx * 0.45);
    setPitch(Math.max(10, Math.min(55, dragStart.current.pitch - dy * 0.35)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if already released
    }
  };

  // 5-beat Cinematic Reveal Tour (tumble in -> zoom -> explode -> hold -> snap back)
  const triggerCinematicTour = () => {
    if (isCinematic) return;
    setIsCinematic(true);

    // Beat 1: Compact hero
    setApart(0.1);
    setYaw(15);
    setPitch(20);

    // Beat 2: Tumble rotation
    setTimeout(() => {
      setYaw(55);
      setPitch(35);
      setApart(0.4);
    }, 1200);

    // Beat 3: Explosive separation
    setTimeout(() => {
      setYaw(38);
      setPitch(28);
      setApart(1.0);
    }, 2800);

    // Beat 4: Focus on victim core
    setTimeout(() => {
      setSelectedTier(ANATOMY_TIERS[3]);
      setYaw(42);
      setPitch(24);
    }, 4800);

    // Beat 5: Settle to comfortable inspection state
    setTimeout(() => {
      setApart(0.85);
      setYaw(36);
      setPitch(26);
      setIsCinematic(false);
    }, 7200);
  };

  // 3D Isometric projection math for Full-Width Centerstage Dissector
  const renderIsometricPlanes = () => {
    const cx = 460;
    const cy = 300;
    const planeW = 480;
    const planeD = 230;
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;
    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const cosP = Math.cos(radPitch);
    const sinP = Math.sin(radPitch);

    const projectPoint = (x: number, y: number, z: number) => {
      const rx = x * cosY - z * sinY;
      const rz = x * sinY + z * cosY;
      const ry = y * cosP - rz * sinP;
      return {
        x: cx + rx,
        y: cy - ry,
      };
    };

    return ANATOMY_TIERS.map((tier, index) => {
      // Calculate exploded z-position (levels 0 to 5)
      const baseSpacing = 24;
      const explodedSpacing = 84;
      const currentSpacing = baseSpacing + (explodedSpacing - baseSpacing) * apart;
      const z = (index - 2.5) * currentSpacing;

      const p1 = projectPoint(-planeW / 2, -planeD / 2, z);
      const p2 = projectPoint(planeW / 2, -planeD / 2, z);
      const p3 = projectPoint(planeW / 2, planeD / 2, z);
      const p4 = projectPoint(-planeW / 2, planeD / 2, z);

      // Midpoints for crosshair gridlines
      const midTop = projectPoint(0, -planeD / 2, z);
      const midBottom = projectPoint(0, planeD / 2, z);
      const midLeft = projectPoint(-planeW / 2, 0, z);
      const midRight = projectPoint(planeW / 2, 0, z);
      const center = projectPoint(0, 0, z);

      const pathData = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
      const isSelected = selectedTier.id === tier.id;

      return (
        <g
          key={tier.id}
          className="cursor-pointer transition-all duration-300 group"
          onClick={() => setSelectedTier(tier)}
        >
          {/* Holographic plane background fill with depth shadow */}
          <path
            d={pathData}
            fill={isSelected ? `${tier.color}22` : "rgba(11, 18, 32, 0.78)"}
            stroke={isSelected ? tier.color : `${tier.color}77`}
            strokeWidth={isSelected ? 2.5 : 1.2}
            style={{
              filter: isSelected
                ? `drop-shadow(0 0 16px ${tier.color}66)`
                : `drop-shadow(0 4px 12px rgba(0,0,0,0.6))`,
            }}
          />

          {/* Blueprint internal gridlines */}
          <path
            d={`M ${midLeft.x} ${midLeft.y} L ${midRight.x} ${midRight.y}`}
            stroke={tier.color}
            strokeWidth="0.8"
            strokeDasharray="4 6"
            opacity={isSelected ? 0.6 : 0.25}
          />
          <path
            d={`M ${midTop.x} ${midTop.y} L ${midBottom.x} ${midBottom.y}`}
            stroke={tier.color}
            strokeWidth="0.8"
            strokeDasharray="4 6"
            opacity={isSelected ? 0.6 : 0.25}
          />

          {/* Subdivisions on plane */}
          {[-planeW / 4, planeW / 4].map((subX, i) => {
            const startP = projectPoint(subX, -planeD / 2, z);
            const endP = projectPoint(subX, planeD / 2, z);
            return (
              <path
                key={i}
                d={`M ${startP.x} ${startP.y} L ${endP.x} ${endP.y}`}
                stroke={tier.color}
                strokeWidth="0.5"
                strokeDasharray="2 4"
                opacity={isSelected ? 0.4 : 0.15}
              />
            );
          })}

          {/* Corner tick marks on 3D plane */}
          {[p1, p2, p3, p4].map((corner, i) => (
            <circle
              key={i}
              cx={corner.x}
              cy={corner.y}
              r={isSelected ? 4 : 2.5}
              fill={isSelected ? tier.color : tone.line}
              stroke={tone.canvas}
              strokeWidth="1.5"
            />
          ))}

          {/* Center node badge on plane */}
          <circle
            cx={center.x}
            cy={center.y}
            r={isSelected ? 7 : 4}
            fill={tier.color}
            opacity={isSelected ? 0.9 : 0.6}
            style={{ filter: `drop-shadow(0 0 6px ${tier.color})` }}
          />

          {/* Component Micro-Tags across the plane surface */}
          <text
            x={center.x}
            y={center.y - 12}
            textAnchor="middle"
            fill={isSelected ? tone.ink : tone.muted}
            fontFamily="var(--font-mono)"
            fontSize="9"
            letterSpacing="1"
            fontWeight={isSelected ? "600" : "500"}
          >
            {tier.components[0]}
          </text>

          {/* Right-Hand Labeled Anatomy Callout Bracket */}
          <g transform={`translate(${p2.x + 20}, ${p2.y - 4})`}>
            {/* Horizontal pointer lead line with diamond terminal */}
            <line x1="-18" y1="2" x2="0" y2="2" stroke={tier.color} strokeWidth="1.2" strokeDasharray="3 3" />
            <polygon
              points="-18,2 -21,-1 -24,2 -21,5"
              fill={tier.color}
            />

            {/* Callout Card */}
            <rect
              x="0"
              y="-12"
              width="230"
              height="26"
              rx="5"
              fill={isSelected ? "rgba(11, 18, 32, 0.96)" : "rgba(6, 10, 17, 0.88)"}
              stroke={isSelected ? tier.color : "rgba(35, 48, 68, 0.9)"}
              strokeWidth={isSelected ? 1.8 : 1}
              style={{ filter: isSelected ? `drop-shadow(0 0 10px ${tier.color}33)` : "none" }}
            />
            {/* Status dot */}
            <circle cx="10" cy="1" r="3.5" fill={tier.color} />

            {/* Tier label text */}
            <text
              x="22"
              y="5"
              fill={isSelected ? tone.ink : tone.muted}
              fontFamily="var(--font-mono)"
              fontSize="9"
              letterSpacing="0.8"
              fontWeight={isSelected ? "700" : "500"}
            >
              {tier.name}
            </text>

            {/* Level indicator chip */}
            <text
              x="220"
              y="5"
              textAnchor="end"
              fill={tier.color}
              fontFamily="var(--font-mono)"
              fontSize="7.5"
              letterSpacing="0.6"
              opacity="0.85"
            >
              {tier.level.split("/")[0]}
            </text>
          </g>
        </g>
      );
    });
  };

  return (
    <section id="top" className="relative overflow-hidden border-b border-line/70 pb-16 pt-12 sm:pb-24 sm:pt-20">
      <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-48 top-10 h-[34rem] w-[34rem] rounded-full bg-teal/10 blur-[140px]" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 top-32 h-[28rem] w-[28rem] rounded-full bg-rose/10 blur-[150px]" aria-hidden="true" />

      <div className="container-page relative space-y-12">
        {/* Section Kicker */}
        <SectionKicker index="00 / OPENING" label="Anatomy-first SOC lab & telemetry dissection" />

        {/* 1. Full-Width Narrative Header Block */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-3.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.2em] text-teal"
          >
            <Sparkles className="h-3 w-3" />
            <span>ANATOMY // REVEAL EDITION · FULL-STACK DISSECTION</span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-balance text-4xl font-semibold leading-[0.95] tracking-[-0.07em] text-ink sm:text-6xl lg:text-7xl"
          >
            The Anatomy of an Active Directory Intrusion.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
          >
            Take apart a 7-VM hybrid enterprise network layer by layer. Rotate in 3D orbit, explode defensive tiers, and witness how 148 rules, kernel syscall hooks, and wire NIDS catch an intrusion in motion.
          </motion.p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#attack"
              className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-canvas font-medium transition hover:bg-ink hover:text-canvas"
            >
              Inspect Intrusion Playback <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <a
              href={`${repoBlob}/INDEX.md`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-panel/60 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted transition hover:border-teal/40 hover:text-ink"
            >
              Master Traceability Index <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Authoritative Metrics Invariant Bar (REQUIRED BY check-data.mjs) */}
          <dl className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 border-y border-line/60 py-6 sm:grid-cols-4">
            {[
              [String(metrics.stageCount), "stages"],
              [String(metrics.durationMinutes), "minutes"],
              [String(metrics.operationalAlertCount), "alerted"],
              [String(metrics.totalGapCount), "gaps named"],
            ].map(([value, label]) => (
              <div key={label} className="border-l border-line/60 pl-4 text-left first:border-l-0">
                <dt className="font-mono text-3xl font-semibold tracking-[-0.05em] text-ink">{value}</dt>
                <dd className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 2. Full-Width Massive Interactive Anatomy Plate */}
        <AnatomyPlate
          fig={viewMode === "anatomy" ? "FIG 01 // DISSECTION" : "FIG 02 // VECTOR"}
          title={viewMode === "anatomy" ? "HYBRID SOC ARCHITECTURE 3D EXPLODED ANATOMY" : "20-STAGE INTRUSION VECTOR PATH"}
          hint={
            viewMode === "anatomy"
              ? "[DRAG] ORBIT ROTATION · [SLIDER] EXPLODE TIERS · [CLICK TIER] TELEMETRY DRILLDOWN"
              : "HOVER ANY ATTACK NODE TO CROSS-REFERENCE MITRE ATT&CK AND SENSOR COVERAGE"
          }
          readout={
            viewMode === "anatomy"
              ? `6 TIERS · YAW ${Math.round(yaw)}° · PITCH ${Math.round(pitch)}° · ${(apart * 100).toFixed(0)}% SEPARATION`
              : `STAGE ${active.id} ACTIVE`
          }
        >
          {/* Dissector Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/60 pb-3">
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-line/80 bg-canvas/80 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("anatomy")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition ${
                  viewMode === "anatomy" ? "bg-teal text-canvas font-semibold shadow-sm" : "text-faint hover:text-ink"
                }`}
              >
                <Layers className="h-3 w-3" /> 3D Exploded Anatomy
              </button>
              <button
                type="button"
                onClick={() => setViewMode("vector")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.12em] transition ${
                  viewMode === "vector" ? "bg-teal text-canvas font-semibold shadow-sm" : "text-faint hover:text-ink"
                }`}
              >
                <Activity className="h-3 w-3" /> 2D Vector Path
              </button>
            </div>

            {viewMode === "anatomy" ? (
              <div className="flex flex-wrap items-center gap-4">
                {/* Explode Slider Control */}
                <div className="flex items-center gap-2.5 rounded-lg border border-line/60 bg-panel/50 px-3 py-1">
                  <Sliders className="h-3 w-3 text-teal" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Explode:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={apart}
                    onChange={(e) => setApart(parseFloat(e.target.value))}
                    className="h-1.5 w-28 cursor-pointer appearance-none rounded-lg bg-line accent-teal"
                    aria-label="Explode separation"
                  />
                  <span className="font-mono text-[9px] text-teal">{(apart * 100).toFixed(0)}%</span>
                </div>

                {/* Preset Camera Angles */}
                <div className="hidden sm:flex items-center gap-1 border-l border-line/60 pl-3">
                  <button
                    type="button"
                    onClick={() => { setYaw(36); setPitch(26); }}
                    className="rounded border border-line/60 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-faint hover:border-teal/50 hover:text-ink"
                  >
                    Iso
                  </button>
                  <button
                    type="button"
                    onClick={() => { setYaw(0); setPitch(50); }}
                    className="rounded border border-line/60 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-faint hover:border-teal/50 hover:text-ink"
                  >
                    Top
                  </button>
                  <button
                    type="button"
                    onClick={() => { setYaw(80); setPitch(14); }}
                    className="rounded border border-line/60 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-faint hover:border-teal/50 hover:text-ink"
                  >
                    Side
                  </button>
                </div>

                {/* Cinematic Film Button */}
                <button
                  type="button"
                  onClick={triggerCinematicTour}
                  disabled={isCinematic}
                  className="inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-4 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-teal transition hover:bg-teal hover:text-canvas disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  <span>{isCinematic ? "Cinematic Reveal Active..." : "Play Reveal Film"}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setPlayKey((key) => key + 1);
                  setPlaying(true);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-line/80 px-3.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition hover:border-teal/40 hover:text-teal"
              >
                <RotateCcw className="h-3 w-3" /> Replay Beam
              </button>
            )}
          </div>

          {/* Viewport Area */}
          <div className="relative mt-4">
            {viewMode === "anatomy" ? (
              <div className="space-y-4">
                {/* 3D Canvas Box */}
                <div
                  className="relative h-[440px] sm:h-[520px] lg:h-[580px] w-full touch-none select-none overflow-hidden rounded-xl bg-canvas/60 border border-line/40"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                >
                  {/* Background Blueprint Compass readout */}
                  <div className="pointer-events-none absolute left-4 top-4 font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint/70 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-teal">
                      <Compass className="h-3 w-3" />
                      <span>ORBIT: AZIMUTH {Math.round(yaw)}° · ELEVATION {Math.round(pitch)}°</span>
                    </div>
                    <div>SEPARATION RATIO: {(apart * 100).toFixed(0)}%</div>
                    <div>SELECTIVE DRILLDOWN: {selectedTier.name}</div>
                  </div>

                  {/* SVG 3D Model */}
                  <svg
                    viewBox="0 0 1100 620"
                    className="h-full w-full pointer-events-auto"
                    style={{ filter: "drop-shadow(0 12px 28px rgba(0,0,0,0.6))" }}
                  >
                    <defs>
                      <radialGradient id="hologram-glow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#35e0c2" stopOpacity="0.16" />
                        <stop offset="100%" stopColor="#35e0c2" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    {/* Floor Hologram Grid */}
                    <ellipse cx="460" cy="500" rx="360" ry="90" fill="url(#hologram-glow)" />

                    {/* Central Vertical Data Conduits (Laser Connectors) */}
                    <line x1="460" y1="80" x2="460" y2="520" stroke={tone.cyan} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4" />
                    <line x1="320" y1="110" x2="320" y2="520" stroke={tone.infrastructure} strokeWidth="1" strokeDasharray="2 5" opacity="0.25" />
                    <line x1="600" y1="110" x2="600" y2="520" stroke={tone.teal} strokeWidth="1" strokeDasharray="2 5" opacity="0.25" />

                    {/* Render All 6 3D Isometric Planes */}
                    {renderIsometricPlanes()}
                  </svg>
                </div>

                {/* Tier Quick Switcher Pills */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {ANATOMY_TIERS.map((tier) => {
                    const active = selectedTier.id === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier)}
                        className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition ${
                          active
                            ? "border-teal/80 bg-teal/10 shadow-sm"
                            : "border-line/60 bg-panel/40 hover:border-line hover:bg-panel/70"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: tier.color }} />
                        <div className="min-w-0">
                          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-faint truncate">
                            {tier.level.split("/")[0]}
                          </p>
                          <p className="font-mono text-[9px] font-semibold text-ink truncate">
                            {tier.name.split("//")[1]?.trim() ?? tier.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Tier Technical Inspector Drawer */}
                <div className="rounded-xl border border-line/80 bg-panel/90 p-5 backdrop-blur-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedTier.color }} />
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-ink">
                        {selectedTier.name}
                      </span>
                      <span className="rounded bg-canvas/80 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-teal border border-teal/40">
                        {selectedTier.level}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-faint">SUBNET / ADDRESS: <strong className="text-teal font-medium">{selectedTier.ip}</strong></span>
                  </div>

                  <div className="mt-4 grid gap-5 md:grid-cols-3">
                    <div>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint">Architecture & Operational Role</p>
                      <p className="mt-1 text-xs text-muted leading-relaxed">{selectedTier.role}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint">Sensors & Telemetry Pipeline</p>
                      <p className="mt-1 font-mono text-[10.5px] text-ink/90 leading-relaxed">{selectedTier.telemetry}</p>
                    </div>
                    <div>
                      <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-faint">Component Manifest</p>
                      <ul className="mt-1 space-y-1 font-mono text-[10px] text-muted">
                        {selectedTier.components.map((comp, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="h-1 w-1 rounded-full bg-teal" />
                            <span>{comp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode B: 2D Vector Path View */
              <div>
                <svg viewBox="0 0 880 300" role="img" aria-labelledby="hero-path-title hero-path-desc" className="h-auto w-full">
                  <title id="hero-path-title">The attack path through four SOC Lab zones</title>
                  <desc id="hero-path-desc">A glowing line moves from the attacker zone through the gateway and victim network into the SOC cloud. Twenty stage nodes sit along the path.</desc>
                  <defs>
                    <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <linearGradient id="hero-path-gradient" x1="0" x2="1">
                      <stop offset="0%" stopColor={tone.attacker} />
                      <stop offset="0.48" stopColor={tone.gap} />
                      <stop offset="1" stopColor={tone.defender} />
                    </linearGradient>
                  </defs>

                  <path d={path} fill="none" stroke={tone.line} strokeWidth="10" strokeLinecap="round" opacity="0.55" />
                  <motion.path
                    key={playKey}
                    d={path}
                    fill="none"
                    stroke="url(#hero-path-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    filter="url(#hero-glow)"
                    initial={reduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                    animate={playing && !reduceMotion ? { pathLength: 1 } : { pathLength: 1 }}
                    transition={{ duration: 5.6, ease: "easeInOut" }}
                    onAnimationComplete={() => setPlaying(false)}
                  />

                  {[{ x: 330, label: "Suricata NIDS", color: tone.defender }, { x: 584, label: "Wazuh SIEM", color: tone.defender }].map((sensor) => (
                    <g key={sensor.label}>
                      <circle cx={sensor.x} cy="170" r="26" fill="none" stroke={sensor.color} strokeDasharray="3 5" opacity="0.36" />
                      <motion.circle
                        cx={sensor.x}
                        cy="170"
                        r="12"
                        fill="none"
                        stroke={sensor.color}
                        strokeWidth="1.5"
                        initial={{ opacity: 0.25, scale: 0.7 }}
                        animate={reduceMotion ? { opacity: 0.7, scale: 1 } : { opacity: [0.25, 0.8, 0.25], scale: [0.7, 1.25, 0.7] }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: sensor.x === 584 ? 0.8 : 0 }}
                        style={{ transformBox: "fill-box", transformOrigin: "center" }}
                      />
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
                      <g
                        key={stage.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Stage ${stage.id}: ${stage.title}, ${stage.status}`}
                        onMouseEnter={() => setActiveStage(stage.id)}
                        onFocus={() => setActiveStage(stage.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") setActiveStage(stage.id);
                        }}
                      >
                        <circle cx={x} cy={y} r={selected ? 8 : 5.5} fill={color} stroke={tone.ink} strokeWidth={selected ? 2 : 1} opacity={selected ? 1 : 0.86} />
                        {selected ? <circle cx={x} cy={y} r="13" fill="none" stroke={color} strokeDasharray="2 4" opacity="0.65" /> : null}
                        <text x={x} y={y - 13} textAnchor="middle" fill={selected ? tone.ink : tone.faint} fontFamily="var(--font-mono)" fontSize="9">{stage.id}</text>
                      </g>
                    );
                  })}
                </svg>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                    className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4"
                  >
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-faint">Stage {active.id} / {active.techniqueId}</p>
                      <p className="mt-1 text-base font-medium text-ink">{active.title}</p>
                    </div>
                    <StatusPill status={active.status} compact />
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>
        </AnatomyPlate>
      </div>
    </section>
  );
}

function ZoneLabel({ x, y, label, sub, color, anchor = "start" }: { x: number; y: number; label: string; sub: string; color: string; anchor?: "start" | "end" }) {
  return (
    <g>
      <text x={x} y={y} textAnchor={anchor} fill={color} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.8">{label}</text>
      <text x={x} y={y + 16} textAnchor={anchor} fill={tone.faint} fontFamily="var(--font-mono)" fontSize="9">{sub}</text>
    </g>
  );
}

function SvgSmallLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return <text x={x} y={y} textAnchor="middle" fill={tone.faint} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">{children}</text>;
}
