import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowDown, Layers, Play, RotateCcw, Sparkles, Activity } from "lucide-react";
import { metrics, repoBlob, stages } from "@/data";
import { AnatomyPlate, SectionKicker, StatusPill, statusColor, tone } from "./visual-shared";

// 2D Attack Path
const path = "M 80 190 C 170 92, 238 268, 330 170 S 500 92, 584 166 S 700 216, 800 124";
const nodePositions = [
  [80, 190], [118, 156], [152, 128], [186, 116], [220, 138], [252, 184], [286, 214], [320, 196], [354, 168], [390, 138],
  [426, 120], [462, 132], [496, 158], [530, 180], [566, 168], [604, 152], [642, 160], [680, 182], [724, 170], [800, 124],
] as const;

// 3D Exploded Anatomy Layers Specification
interface AnatomyTier {
  id: string;
  name: string;
  level: string;
  color: string;
  ip: string;
  role: string;
  telemetry: string;
  components: string[];
}

const ANATOMY_TIERS: AnatomyTier[] = [
  {
    id: "tier-1",
    name: "01 / Adversary Origin Plane",
    level: "EXTERNAL / RED-TEAM",
    color: tone.attacker,
    ip: "192.168.232.135/24",
    role: "Isolated red-team platform launching multi-phase attack vectors",
    telemetry: "Kali Linux · Impacket · Responder · BloodHound · Python CSRF bypass",
    components: ["Kali Linux Platform", "Offensive Toolchains", "Direct DMZ Ingress"],
  },
  {
    id: "tier-2",
    name: "02 / Perimeter Routing & NIDS Plane",
    level: "LAYER 3 GATEWAY / WIRE",
    color: tone.infrastructure,
    ip: "ens33: .232.162 · ens37: .56.150 · wg0: 10.8.0.2",
    role: "Dual-NIC routing gateway with zero NAT & WireGuard encrypted encapsulation",
    telemetry: "Suricata 8.0 AF-PACKET promiscuous NIDS · SIDs 2018489, 2010963, 3400020",
    components: ["Dual-NIC Sniffing (ens33/37)", "Suricata 8.0 NIDS", "NAT-less VPN Tunnel"],
  },
  {
    id: "tier-3",
    name: "03 / Victim Enterprise Subnet Plane",
    level: "HOST & OS ENDPOINTS",
    color: tone.cyan,
    ip: "192.168.56.0/24 (VMware VMnet2)",
    role: "Isolated corporate network containing vulnerable web DMZ and Active Directory domain",
    telemetry: "Linux Auditd (execve netlink hook) · Windows Sysmon (modular) · Windows Security EID 4624/4720",
    components: ["DVWA Dual-Homed DMZ (.30)", "DC Active Directory (.10)", "Windows 10 Workstation (.20)"],
  },
  {
    id: "tier-4",
    name: "04 / Central SIEM Correlation Plane",
    level: "CLOUD VM2 / DETECTION",
    color: tone.defender,
    ip: "10.122.1.4/16 (Private Cloud VNet)",
    role: "Rule decoding, correlation engine, and noise suppression evaluating 9,567 raw events",
    telemetry: "Wazuh Manager 4.x · OpenSearch Indexer · 148 rules (local_rules.xml) · 87 suppressions",
    components: ["Wazuh Manager Core", "OpenSearch Indexer", "148 Detection Rules"],
  },
  {
    id: "tier-5",
    name: "05 / Two-Tier Asynchronous SOAR Plane",
    level: "SOAR INGESTION & PIPELINE",
    color: tone.emerald,
    ip: "Private IPC & Daemon Bridge",
    role: "Sub-millisecond alert ingestion decoupling SIEM rule engine from remote HTTP latency",
    telemetry: "custom-thehive (Tier 1: SQLite WAL 0.2ms) · thehive-flush.service (Tier 2: 5s async flush)",
    components: ["Fast SQLite WAL Ingest", "5s Flush Daemon", "Alert Deduplication"],
  },
  {
    id: "tier-6",
    name: "06 / Incident Command & Forensics Plane",
    level: "CLOUD VM1 / INCIDENT OPS",
    color: tone.infrastructure,
    ip: "10.122.0.4/16 (Private Cloud VNet)",
    role: "Centralized case management and forensic live artifact interrogation platform",
    telemetry: "TheHive 5 (46 clustered incident cases) · Cassandra · Elasticsearch · Velociraptor 0.77",
    components: ["TheHive 5 Case Manager", "Velociraptor 0.77 DFIR", "WireGuard Hub (.1)"],
  },
];

export function VisualHero() {
  const reduceMotion = useReducedMotion();
  const [activeStage, setActiveStage] = useState("17");
  const [playKey, setPlayKey] = useState(0);
  const [playing, setPlaying] = useState(!reduceMotion);
  
  // Anatomy Exploded View State
  const [viewMode, setViewMode] = useState<"anatomy" | "vector">("anatomy");
  const [apart, setApart] = useState(0.85); // 0 (assembled) to 1 (fully exploded)
  const [yaw, setYaw] = useState(-18); // rotation around vertical axis in degrees
  const [pitch, setPitch] = useState(30); // camera elevation tilt in degrees
  const [selectedTier, setSelectedTier] = useState<AnatomyTier>(ANATOMY_TIERS[2]);
  const [isCinematic, setIsCinematic] = useState(false);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });

  const active = stages.find((stage) => stage.id === activeStage) ?? stages[0];

  // Mouse drag handler for 3D orbit
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, yaw, pitch };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setYaw(Math.max(-50, Math.min(50, dragStart.current.yaw + dx * 0.35)));
    setPitch(Math.max(15, Math.min(55, dragStart.current.pitch - dy * 0.25)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Cinematic 5-Beat Tour Trigger
  const triggerCinematicTour = () => {
    if (isCinematic) return;
    setIsCinematic(true);
    // Beat 1: Assemble and center
    setApart(0);
    setYaw(0);
    setPitch(25);

    // Beat 2 (1.2s): Tumble and rotate
    setTimeout(() => {
      setYaw(25);
      setPitch(35);
    }, 1200);

    // Beat 3 (2.5s): Explode outwards
    setTimeout(() => {
      setApart(1);
      setYaw(-22);
      setPitch(32);
    }, 2600);

    // Beat 4 (4.5s): Macro sweep through tiers
    setTimeout(() => {
      setSelectedTier(ANATOMY_TIERS[1]); // Gateway
    }, 4500);

    setTimeout(() => {
      setSelectedTier(ANATOMY_TIERS[2]); // Victim
    }, 5800);

    // Beat 5 (7.0s): Implode to hero resting stance
    setTimeout(() => {
      setApart(0.85);
      setYaw(-18);
      setPitch(30);
      setIsCinematic(false);
    }, 7200);
  };

  // 3D Isometric projection math
  const renderIsometricPlanes = () => {
    const cx = 440;
    const cy = 250;
    const planeW = 320;
    const planeD = 180;
    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;
    const cosY = Math.cos(radYaw);
    const sinY = Math.sin(radYaw);
    const sinP = Math.sin(radPitch);
    const cosP = Math.cos(radPitch);

    const projectPoint = (x: number, y: number, z: number) => {
      const rx = x * cosY - y * sinY;
      const ry = x * sinY + y * cosY;
      return {
        x: cx + rx,
        y: cy + ry * sinP - z * cosP,
      };
    };

    return ANATOMY_TIERS.map((tier, index) => {
      // Calculate exploded z-position (levels 0 to 5)
      const baseSpacing = 22;
      const explodedSpacing = 58;
      const currentSpacing = baseSpacing + (explodedSpacing - baseSpacing) * apart;
      const z = (index - 2.5) * currentSpacing;

      // 4 corners of rectangular plane
      const p1 = projectPoint(-planeW / 2, -planeD / 2, z);
      const p2 = projectPoint(planeW / 2, -planeD / 2, z);
      const p3 = projectPoint(planeW / 2, planeD / 2, z);
      const p4 = projectPoint(-planeW / 2, planeD / 2, z);

      const pathData = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
      const isSelected = selectedTier.id === tier.id;

      return (
        <g
          key={tier.id}
          className="cursor-pointer transition-all duration-300"
          onClick={() => setSelectedTier(tier)}
        >
          {/* Subtle plane fill with depth shadow */}
          <path
            d={pathData}
            fill={isSelected ? `${tier.color}18` : "rgba(11, 18, 32, 0.7)"}
            stroke={isSelected ? tier.color : `${tier.color}66`}
            strokeWidth={isSelected ? 2 : 1}
            style={{ filter: isSelected ? `drop-shadow(0 0 10px ${tier.color}44)` : "none" }}
          />

          {/* Gridlines on plane surface */}
          <path
            d={`M ${(p1.x + p4.x) / 2} ${(p1.y + p4.y) / 2} L ${(p2.x + p3.x) / 2} ${(p2.y + p3.y) / 2}`}
            stroke={tier.color}
            strokeWidth="0.5"
            strokeDasharray="4 6"
            opacity={isSelected ? 0.45 : 0.2}
          />
          <path
            d={`M ${(p1.x + p2.x) / 2} ${(p1.y + p2.y) / 2} L ${(p4.x + p3.x) / 2} ${(p4.y + p3.y) / 2}`}
            stroke={tier.color}
            strokeWidth="0.5"
            strokeDasharray="4 6"
            opacity={isSelected ? 0.45 : 0.2}
          />

          {/* Corner tick crosses on plane */}
          {[p1, p2, p3, p4].map((corner, i) => (
            <circle
              key={i}
              cx={corner.x}
              cy={corner.y}
              r={isSelected ? 3 : 2}
              fill={isSelected ? tier.color : tone.line}
              stroke={tone.canvas}
              strokeWidth="1"
            />
          ))}

          {/* Isometric Tier Tag Callout */}
          <g transform={`translate(${p2.x + 14}, ${p2.y - 2})`}>
            <line x1="-12" y1="2" x2="0" y2="2" stroke={tier.color} strokeWidth="1" strokeDasharray="2 3" />
            <rect
              x="0"
              y="-10"
              width="180"
              height="20"
              rx="4"
              fill={isSelected ? "rgba(11, 18, 32, 0.95)" : "rgba(6, 10, 17, 0.85)"}
              stroke={isSelected ? tier.color : "rgba(35, 48, 68, 0.8)"}
              strokeWidth={isSelected ? 1.5 : 0.8}
            />
            <circle cx="8" cy="0" r="3" fill={tier.color} />
            <text
              x="18"
              y="3"
              fill={isSelected ? tone.ink : tone.muted}
              fontFamily="var(--font-mono)"
              fontSize="8.5"
              letterSpacing="0.8"
              fontWeight={isSelected ? "600" : "400"}
            >
              {tier.name.split("/")[1]?.trim() ?? tier.name}
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

      <div className="container-page relative">
        <SectionKicker index="00 / OPENING" label="Anatomy-first SOC lab & telemetry dissection" />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:items-end lg:gap-12">
          {/* Left Column: Narrative Headline & Ground-Truth Stats */}
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-teal"
            >
              <Sparkles className="h-3 w-3" />
              <span>Full-Stack Cybersecurity Dissection</span>
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-5 max-w-[13ch] text-balance text-5xl font-semibold leading-[0.9] tracking-[-0.07em] text-ink sm:text-6xl lg:text-[5.5rem]"
            >
              The Anatomy of an Active Directory Intrusion.
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
            >
              Take apart a 7-VM hybrid enterprise network layer by layer. Rotate in 3D, explode the defensive tiers, and witness how 148 rules, kernel syscall hooks, and wire NIDS catch an attack in motion.
            </motion.p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#attack"
                className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-canvas font-medium transition hover:bg-ink hover:text-canvas"
              >
                Inspect Intrusion Playback <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <a
                href={`${repoBlob}/INDEX.md`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line/80 bg-panel/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted transition hover:border-teal/40 hover:text-ink"
              >
                Master Traceability Index
              </a>
            </div>

            {/* Authoritative Metrics Invariant Bar (REQUIRED BY check-data.mjs) */}
            <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                [String(metrics.stageCount), "stages"],
                [String(metrics.durationMinutes), "minutes"],
                [String(metrics.operationalAlertCount), "alerted"],
                [String(metrics.totalGapCount), "gaps named"],
              ].map(([value, label]) => (
                <div key={label} className="border-l-2 border-line/80 pl-3">
                  <dt className="font-mono text-2xl font-semibold tracking-[-0.05em] text-ink">{value}</dt>
                  <dd className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right Column: Interactive Anatomy Plate / 3D Exploded View */}
          <AnatomyPlate
            fig={viewMode === "anatomy" ? "FIG 01 // DISSECTION" : "FIG 02 // VECTOR"}
            title={viewMode === "anatomy" ? "HYBRID SOC ARCHITECTURE EXPLODED VIEW" : "20-STAGE INTRUSION TIMELINE PATH"}
            hint={
              viewMode === "anatomy"
                ? "[DRAG] ROTATE 3D ORBIT · [SLIDER] ADJUST EXPLOSION · [CLICK TIER] INSPECT"
                : "HOVER ANY STAGE NODE TO EXAMINE MITRE ATT&CK AND SENSOR COVERAGE"
            }
            readout={
              viewMode === "anatomy"
                ? `6 TIERS · YAW ${Math.round(yaw)}° · PITCH ${Math.round(pitch)}°`
                : `STAGE ${active.id} ACTIVE`
            }
          >
            {/* View Mode Switcher & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
              <div className="flex items-center rounded-lg border border-line/80 bg-canvas/80 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("anatomy")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] transition ${
                    viewMode === "anatomy" ? "bg-teal text-canvas font-semibold shadow-sm" : "text-faint hover:text-ink"
                  }`}
                >
                  <Layers className="h-3 w-3" /> 3D Exploded View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("vector")}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[8.5px] uppercase tracking-[0.12em] transition ${
                    viewMode === "vector" ? "bg-teal text-canvas font-semibold shadow-sm" : "text-faint hover:text-ink"
                  }`}
                >
                  <Activity className="h-3 w-3" /> 2D Vector Path
                </button>
              </div>

              {viewMode === "anatomy" ? (
                <div className="flex items-center gap-3">
                  {/* Explode Slider */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-faint">Explode:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={apart}
                      onChange={(e) => setApart(parseFloat(e.target.value))}
                      className="h-1.5 w-20 cursor-pointer appearance-none rounded-lg bg-line accent-teal"
                    />
                  </div>

                  {/* Cinematic Film Button */}
                  <button
                    type="button"
                    onClick={triggerCinematicTour}
                    disabled={isCinematic}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal/40 bg-teal/10 px-3 py-1 font-mono text-[8.5px] uppercase tracking-[0.14em] text-teal transition hover:bg-teal hover:text-canvas disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    <span>{isCinematic ? "Cinematic Tour..." : "Play Reveal Film"}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPlayKey((key) => key + 1);
                    setPlaying(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-line/80 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition hover:border-teal/40 hover:text-teal"
                >
                  <RotateCcw className="h-3 w-3" /> Replay Beam
                </button>
              )}
            </div>

            {/* Viewport: 3D Exploded Canvas or 2D Vector Path */}
            <div className="relative mt-3">
              {viewMode === "anatomy" ? (
                <div>
                  <div
                    className="relative h-[340px] w-full touch-none select-none overflow-hidden rounded-xl bg-canvas/60 border border-line/40"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                  >
                    {/* Background Blueprint Compass */}
                    <div className="pointer-events-none absolute left-3 top-3 font-mono text-[8px] uppercase tracking-[0.16em] text-faint/60">
                      <div>CAMERA // ELEVATION {Math.round(pitch)}° · AZIMUTH {Math.round(yaw)}°</div>
                      <div>DISSECTION RATIO // {(apart * 100).toFixed(0)}% SEPARATION</div>
                    </div>

                    <svg
                      viewBox="0 0 880 500"
                      className="h-full w-full pointer-events-auto"
                      style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))" }}
                    >
                      <defs>
                        <radialGradient id="hologram-glow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#35e0c2" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#35e0c2" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Floor Hologram Grid */}
                      <ellipse cx="440" cy="380" rx="280" ry="80" fill="url(#hologram-glow)" />

                      {/* Central Vertical Data Conduits (Laser Connectors) */}
                      <line x1="440" y1="120" x2="440" y2="390" stroke={tone.cyan} strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4" />
                      <line x1="360" y1="140" x2="360" y2="400" stroke={tone.infrastructure} strokeWidth="1" strokeDasharray="2 5" opacity="0.3" />
                      <line x1="520" y1="140" x2="520" y2="400" stroke={tone.teal} strokeWidth="1" strokeDasharray="2 5" opacity="0.3" />

                      {/* Render All 6 3D Isometric Planes */}
                      {renderIsometricPlanes()}
                    </svg>
                  </div>

                  {/* Selected Tier Inspector Drawer */}
                  <div className="mt-3 rounded-xl border border-line/80 bg-panel/90 p-3.5 backdrop-blur-md">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selectedTier.color }} />
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
                          {selectedTier.name}
                        </span>
                        <span className="rounded bg-canvas/80 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-faint border border-line/60">
                          {selectedTier.level}
                        </span>
                      </div>
                      <span className="font-mono text-[9px] text-teal">{selectedTier.ip}</span>
                    </div>

                    <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-faint">Architecture & Role</p>
                        <p className="mt-0.5 text-xs text-muted leading-relaxed">{selectedTier.role}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-faint">Telemetry Sensors</p>
                        <p className="mt-0.5 font-mono text-[10px] text-ink/90 leading-relaxed">{selectedTier.telemetry}</p>
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
                        <stop offset="0" stopColor={tone.attacker} />
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
