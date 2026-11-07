import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NodeKey = "dvwa" | "dc" | "win" | "kali" | "gw" | "az" | "vm1" | "vm2";
type Mode = "map" | "replay";

/** Short hover caption (shown in the floating popup) + full pinned detail (panel below). */
const NODES: Record<NodeKey, { name: string; tip: string; info: string }> = {
  dvwa: {
    name: "Linux Web Server (DVWA)",
    tip: "DVWA (192.168.56.30) · Web server hosting vulnerable PHP applications.",
    info: "192.168.56.30 — An Ubuntu 24.04 server in the DMZ running Apache, MariaDB, and DVWA. Monitored by the Wazuh agent and Linux Auditd to capture command execution, file modifications, and web access logs.",
  },
  dc: {
    name: "Active Directory Domain Controller",
    tip: "PC-DC (192.168.56.10) · Windows Server 2022 forest root.",
    info: "192.168.56.10 — The central Domain Controller for the AD.LAB forest. Runs Sysmon and Windows Security Auditing to record Kerberos authentications, user management, and directory access.",
  },
  win: {
    name: "Corporate Workstation",
    tip: "Win10 (192.168.56.20) · Domain-joined Windows 10 enterprise endpoint.",
    info: "192.168.56.20 — A Windows 10 workstation joined to AD.LAB. Configured with Sysmon to track process creation, network connections, and offline credential tampering.",
  },
  kali: {
    name: "Adversary Workstation",
    tip: "Kali Linux (192.168.232.135) · Offensive security operations platform.",
    info: "192.168.232.135 — The attacker host located on an external NAT segment. Configured with static routing through the gateway to emulate a realistic external intrusion.",
  },
  gw: {
    name: "Network Security Gateway",
    tip: "Ubuntu Gateway (192.168.56.150) · Inline Suricata NIDS & router.",
    info: "An Ubuntu 24.04 router acting as the inline network choke point. Suricata 8.0.6 sniffs traffic across interfaces using ET Open and custom signatures, streaming alerts to the SIEM.",
  },
  az: {
    name: "Azure Cloud SOC",
    tip: "Azure VNets · Cloud-hosted SIEM, SOAR, and analytics infrastructure.",
    info: "Two peered Microsoft Azure virtual networks connected to the on-premise lab via an encrypted WireGuard site-to-site tunnel. Preserves original host IP addresses without NAT.",
  },
  vm1: {
    name: "Incident Response Server (VM1)",
    tip: "Cloud VM1 (10.122.0.4) · TheHive 5 case management & WireGuard hub.",
    info: "Cloud VM1 (10.122.0.4) — Hosts TheHive 5 for case management, Nginx Proxy Manager, and Velociraptor for DFIR artifact collection across victim machines.",
  },
  vm2: {
    name: "SIEM & SOAR Server (VM2)",
    tip: "Cloud VM2 (10.122.1.4) · Wazuh Manager, Indexer, and SOAR daemon.",
    info: "Cloud VM2 (10.122.1.4) — Hosts the Wazuh SIEM manager, OpenSearch indexer, and the automated Python/SQLite SOAR daemon that aggregates raw alerts into actionable incident cases.",
  },
};

const REPLAY: Array<{ nodes: NodeKey[]; title: string; body: string }> = [
  {
    nodes: ["kali"],
    title: "Adversary launches the attack",
    body: "Network traffic originates from Kali Linux (192.168.232.135) targeting the victim subnet, routed through the designated security gateway.",
  },
  {
    nodes: ["gw"],
    title: "Suricata inspects the wire",
    body: "As packets traverse the gateway, Suricata's deep packet inspection engine matches signature rules and writes structured event records to eve-alert.json.",
  },
  {
    nodes: ["dvwa", "dc", "win"],
    title: "Traffic reaches the target",
    body: "The gateway forwards permitted packets to the target machine (DVWA, Domain Controller, or Windows 10 endpoint) where the attack payload executes.",
  },
  {
    nodes: ["dvwa", "dc", "win"],
    title: "Host sensors record endpoint telemetry",
    body: "Local agents—including Linux Auditd, Apache logs, and Windows Sysmon—capture low-level process creation, file modifications, and authentication events.",
  },
  {
    nodes: ["az"],
    title: "Telemetry forwarded over WireGuard",
    body: "Both host logs and network IDS alerts are securely transmitted across the WireGuard VPN tunnel into Microsoft Azure with original IP headers intact.",
  },
  {
    nodes: ["vm2", "vm1"],
    title: "Wazuh correlates & TheHive opens cases",
    body: "Wazuh analyzes the aggregated telemetry on VM2. The custom SOAR integration batches related events and creates an organized incident case in TheHive 5.",
  },
];

const CHIPS = ["Kali", "Suricata", "Victim", "Telemetry", "Tunnel", "SOC"];

/** Where the floating hover popup anchors, in the 680×430 viewBox. */
const TIP: Record<NodeKey, { x: number; y: number; above: boolean }> = {
  dvwa: { x: 95, y: 132, above: false },
  dc: { x: 191, y: 132, above: false },
  win: { x: 287, y: 132, above: false },
  kali: { x: 505, y: 132, above: false },
  gw: { x: 340, y: 184, above: true },
  az: { x: 340, y: 314, above: true },
  vm1: { x: 185, y: 352, above: true },
  vm2: { x: 495, y: 352, above: true },
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const glow = (on: boolean) => (on ? { filter: "drop-shadow(0 0 7px var(--color-accent))" } : undefined);

function MiniNode({
  x,
  y,
  w,
  h,
  title,
  sub,
  tone,
  lit,
  onEnter,
  onLeave,
  onClick,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  tone: "neutral" | "ok";
  lit: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const stroke = lit ? "var(--color-accent)" : tone === "ok" ? "var(--color-ok)" : "var(--color-rule)";
  return (
    <g
      className="cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={title}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={7}
        fill={tone === "ok" ? "var(--color-ok)" : "var(--color-paper-2)"}
        fillOpacity={tone === "ok" ? 0.12 : 1}
        stroke={stroke}
        strokeOpacity={lit ? 1 : 0.65}
        strokeWidth={lit ? 2 : 1}
        style={glow(lit)}
      />
      <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-ink)">
        {title}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 15} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
        {sub}
      </text>
    </g>
  );
}

export function NetworkMap() {
  const [mode, setMode] = useState<Mode>("map");
  const [active, setActive] = useState<NodeKey>("gw");
  const [hover, setHover] = useState<NodeKey | null>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!playing || mode !== "replay") return;
    const id = setInterval(() => setStep((s) => (s + 1) % REPLAY.length), 1500);
    return () => clearInterval(id);
  }, [playing, mode]);

  // While the replay is playing, hovering must not hijack the detail panel.
  useEffect(() => {
    if (playing) setHover(null);
  }, [playing]);

  const stepNodes = new Set<NodeKey>(REPLAY[step].nodes);
  const hoverable = !playing;
  const hoverNow = hoverable ? hover : null;
  const isOn = (k: NodeKey) => hoverNow === k || active === k || (mode === "replay" && stepNodes.has(k));
  const shown = hoverNow ?? active;

  const bind = (k: NodeKey) => ({
    onEnter: () => {
      if (hoverable) setHover(k);
    },
    onLeave: () => setHover((h) => (h === k ? null : h)),
  });

  return (
    <div>
      <div className="mb-4 inline-flex gap-2">
        {(
          [
            ["map", "Network map"],
            ["replay", "Attack replay"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setPlaying(false);
            }}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-xs font-medium transition-colors",
              mode === id
                ? "border-accent/60 bg-accent-soft text-accent"
                : "border-rule text-muted hover:border-rule-2 hover:text-ink-2",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <svg
            viewBox="0 0 680 430"
            className="mx-auto block h-auto w-full min-w-[600px] max-w-[680px] font-sans"
            role="img"
            aria-label="Network map: Kali and the victim subnet connect through a Suricata gateway; WireGuard links the gateway to Azure, running Wazuh and TheHive."
          >
            {/* victim subnet */}
            <rect x={40} y={30} width={300} height={110} rx={12} fill="var(--color-accent)" fillOpacity={0.09} stroke="var(--color-accent)" strokeOpacity={0.35} />
            <text x={190} y={52} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-accent)">
              Victim subnet
            </text>
            <text x={190} y={68} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
              192.168.56.0/24
            </text>

            {/* attack segment */}
            <rect x={370} y={30} width={270} height={110} rx={12} fill="var(--color-hot)" fillOpacity={0.09} stroke="var(--color-hot)" strokeOpacity={0.35} />
            <text x={505} y={52} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-hot)">
              Attack segment
            </text>
            <text x={505} y={68} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
              192.168.232.0/24
            </text>

            {/* azure cloud (zone is itself a node) */}
            <g
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Azure private cloud"
              onMouseEnter={bind("az").onEnter}
              onMouseLeave={bind("az").onLeave}
              onFocus={bind("az").onEnter}
              onBlur={bind("az").onLeave}
              onClick={() => setActive("az")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActive("az")}
            >
              <rect
                x={40}
                y={320}
                width={600}
                height={96}
                rx={12}
                fill="var(--color-violet)"
                fillOpacity={0.09}
                stroke={isOn("az") ? "var(--color-accent)" : "var(--color-violet)"}
                strokeOpacity={isOn("az") ? 1 : 0.35}
                strokeWidth={isOn("az") ? 2 : 1}
                style={glow(isOn("az"))}
              />
              <text x={340} y={342} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-violet)">
                Azure private cloud · 10.122.0.0/16
              </text>
            </g>

            <MiniNode x={52} y={82} w={86} h={46} title="DVWA" sub=".30" tone="neutral" lit={isOn("dvwa")} {...bind("dvwa")} onClick={() => setActive("dvwa")} />
            <MiniNode x={148} y={82} w={86} h={46} title="PC-DC" sub=".10" tone="neutral" lit={isOn("dc")} {...bind("dc")} onClick={() => setActive("dc")} />
            <MiniNode x={244} y={82} w={86} h={46} title="Win10" sub=".20" tone="neutral" lit={isOn("win")} {...bind("win")} onClick={() => setActive("win")} />
            <MiniNode x={390} y={82} w={230} h={46} title="Kali Linux" sub="192.168.232.135" tone="neutral" lit={isOn("kali")} {...bind("kali")} onClick={() => setActive("kali")} />

            {/* gateway (zone is itself a node) */}
            <g
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label="Security gateway"
              onMouseEnter={bind("gw").onEnter}
              onMouseLeave={bind("gw").onLeave}
              onFocus={bind("gw").onEnter}
              onBlur={bind("gw").onLeave}
              onClick={() => setActive("gw")}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActive("gw")}
            >
              <rect
                x={190}
                y={190}
                width={300}
                height={84}
                rx={12}
                fill="var(--color-cool)"
                fillOpacity={0.1}
                stroke={isOn("gw") ? "var(--color-accent)" : "var(--color-cool)"}
                strokeOpacity={isOn("gw") ? 1 : 0.4}
                strokeWidth={isOn("gw") ? 2 : 1}
                style={glow(isOn("gw"))}
              />
              <text x={340} y={214} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-ink)">
                Security gateway
              </text>
              <text x={340} y={233} textAnchor="middle" fontSize={11} fill="var(--color-cool)">
                192.168.56.150 ↔ 192.168.232.162
              </text>
              <text x={340} y={251} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                IP forwarding + Suricata IDS
              </text>
            </g>

            <MiniNode x={60} y={358} w={250} h={44} title="VM1 hub · 10.122.0.4" sub="TheHive 5" tone="ok" lit={isOn("vm1")} {...bind("vm1")} onClick={() => setActive("vm1")} />
            <MiniNode x={370} y={358} w={250} h={44} title="VM2 SIEM · 10.122.1.4" sub="Wazuh + custom-thehive" tone="ok" lit={isOn("vm2")} {...bind("vm2")} onClick={() => setActive("vm2")} />

            {/* flows */}
            <g>
              <path d="M265 140 L265 190" fill="none" stroke="var(--color-accent)" strokeWidth={2} className={reduced ? "" : "flow-line"} />
              <path d="M505 140 L505 232 L492 232" fill="none" stroke="var(--color-hot)" strokeWidth={2} className={reduced ? "" : "flow-line"} />
              <path d="M340 274 L340 320" fill="none" stroke="var(--color-ok)" strokeWidth={2.5} className={reduced ? "" : "flow-line"} />
              <line x1={312} y1={380} x2={368} y2={380} stroke="var(--color-violet)" strokeWidth={2} className={reduced ? "" : "flow-line"} />
              {!reduced && (
                <>
                  <circle r={4} fill="var(--color-accent)">
                    <animateMotion dur="1.4s" repeatCount="indefinite" path="M265 140 L265 190" />
                  </circle>
                  <circle r={4} fill="var(--color-hot)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M505 140 L505 232 L492 232" />
                  </circle>
                  <circle r={4} fill="var(--color-ok)">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path="M340 274 L340 320" />
                  </circle>
                </>
              )}
            </g>

            <text x={352} y={302} fontSize={11} fill="var(--color-ok)">
              WireGuard · UDP 51820
            </text>
          </svg>
        </div>

        {hoverNow && (
          <div
            className="pointer-events-none absolute z-20 w-max max-w-[240px] rounded-lg border border-accent/40 bg-paper px-3 py-2 text-[0.7rem] leading-snug text-ink-2 shadow-glow-cool"
            style={{
              left: `${clamp((TIP[hoverNow].x / 680) * 100, 17, 83)}%`,
              top: `${(TIP[hoverNow].y / 430) * 100}%`,
              transform: `translate(-50%, ${TIP[hoverNow].above ? "calc(-100% - 6px)" : "6px"})`,
            }}
          >
            {NODES[hoverNow].tip}
          </div>
        )}
      </div>

      {mode === "map" ? (
        <div className="mt-2 flex items-start gap-3 rounded-card border border-rule bg-paper-3/60 px-4 py-3">
          <span
            className={cn(
              "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider",
              hoverNow ? "border-accent/50 text-accent" : "border-rule-2 text-faint",
            )}
          >
            {hoverNow ? "hovering" : "pinned"}
          </span>
          <p className="text-xs leading-5 text-muted">
            <span className="font-medium text-ink-2">{NODES[shown].name}.</span> {NODES[shown].info}{" "}
            <span className="text-faint">Click a node to pin it.</span>
          </p>
        </div>
      ) : (
        <div className="mt-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {CHIPS.map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                {i > 0 && <span className="text-faint">→</span>}
                <button
                  type="button"
                  onClick={() => {
                    setStep(i);
                    setPlaying(false);
                  }}
                  className={cn(
                    "rounded-pill border px-3 py-1 text-xs transition-colors",
                    i === step
                      ? "border-accent/60 bg-accent-soft font-medium text-accent"
                      : "border-rule text-muted hover:border-rule-2 hover:text-ink-2",
                  )}
                >
                  {label}
                </button>
              </span>
            ))}
          </div>

          <div className="mt-4 rounded-card border border-rule bg-paper-3/60 px-4 py-3">
            <div className="text-xs font-medium text-ink">
              {step + 1}/{REPLAY.length} · {REPLAY[step].title}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted">{REPLAY[step].body}</p>
          </div>

          <div className="mt-3 flex gap-2">
            {(
              [
                ["Back", () => setStep((s) => (s - 1 + REPLAY.length) % REPLAY.length)],
                ["Next", () => setStep((s) => (s + 1) % REPLAY.length)],
              ] as const
            ).map(([label, fn]) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  fn();
                  setPlaying(false);
                }}
                className="rounded-pill border border-rule px-3.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-rule-2 hover:text-ink"
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="rounded-pill border border-accent/60 bg-accent-soft px-3.5 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent"
            >
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
