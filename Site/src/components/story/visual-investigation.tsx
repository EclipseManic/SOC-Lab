import { useState } from "react";
import {
  ArrowRight,
  Cpu,
  FolderOpen,
  Laptop,
  Radar,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Waypoints,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cases, metrics, repoBlob, workflow } from "@/data";
import { Counter } from "@/components/fx/counter";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { RepoLink, SectionHead } from "./visual-shared";
import { DiagramCard } from "./diagram-modal";

type Sensor = {
  icon: typeof Radar;
  name: string;
  where: string;
  catches: string;
  ref: string;
  tone: string;
  ring: string;
};

const sensors: Sensor[] = [
  {
    icon: Radar,
    name: "Network Traffic Inspection",
    where: "Suricata NIDS on the Security Gateway",
    catches:
      "Performs deep packet inspection across all inter-subnet flows, detecting port scans, web application injection payloads, and suspicious Kerberos requests.",
    ref: "SID 2010963",
    tone: "text-cool",
    ring: "border-cool/40",
  },
  {
    icon: Cpu,
    name: "Linux Kernel Telemetry",
    where: "Auditd on the DMZ Web & Pivot Host",
    catches:
      "Hooks low-level system calls (execve) to record every binary execution spawned by the web service account, even within encrypted sessions.",
    ref: "Rule 100199",
    tone: "text-accent",
    ring: "border-accent/40",
  },
  {
    icon: Laptop,
    name: "Windows Endpoint Auditing",
    where: "Sysmon & Windows Security on DC & Workstation",
    catches:
      "Captures parent-child process relationships, interactive and network logons, and persistence registry modifications on domain endpoints.",
    ref: "Event ID 4624",
    tone: "text-accent",
    ring: "border-accent/40",
  },
  {
    icon: Server,
    name: "SIEM & Case Management",
    where: "Wazuh Manager & TheHive 5 in Azure Cloud",
    catches:
      "Correlates cross-platform telemetry against MITRE ATT&CK rules, filters background noise, and automatically generates organized incident cases.",
    ref: "Level ≥ 8 gate",
    tone: "text-ember",
    ring: "border-ember/40",
  },
];

const funnel = [
  { icon: Radar, value: 9567, group: true, label: "raw alerts ingested", note: "everything the sensors recorded, across 4 agents" },
  { icon: SlidersHorizontal, value: 808, group: true, label: "kept for the deep read", note: "after 11 dashboard filters cut the noise" },
  { icon: FolderOpen, value: 46, group: false, label: "live cases opened", note: "each serious alert became a ticket automatically" },
  { icon: FolderOpen, value: 3, group: false, label: "investigations written", note: "grouped by incident boundary, not by tool" },
];

const engine = [
  {
    icon: Waypoints,
    title: "Two-Tier SOAR Pipeline",
    body: "When Wazuh generates an alert, the integration first stores it in a local SQLite queue. A background process then collects incoming alerts in batches and forwards them to TheHive, grouping repeated alerts to prevent analyst fatigue.",
  },
  {
    icon: SlidersHorizontal,
    title: "11 Targeted Dashboard Filters",
    body: "Narrowed down 9,567 total raw telemetry events to 808 high-signal security records, isolating adversary indicators from routine operating system background activity.",
  },
  {
    icon: FolderOpen,
    title: "Three Scoped Incident Cases",
    body: "Alerts are grouped by logical incident phases (Perimeter, Lateral Movement, Domain Dominance) rather than creating 46 disconnected tickets, preserving investigative context.",
  },
  {
    icon: ShieldCheck,
    title: "Median 4.6s Time-to-Alert",
    body: "Measured end-to-end latency from adversary command execution on an endpoint, through WireGuard transport, to automated case generation in TheHive.",
  },
];

export function VisualInvestigation() {
  const [activeCase, setActiveCase] = useState(0);
  const current = cases[activeCase];

  return (
    <section id="investigation" className="section-shell">
      <div className="container-page">
        <SectionHead
          index="04"
          kicker="Incident Investigation & Triage"
          title="From raw SIEM telemetry to structured incident response."
          lede="Offensive emulation is only half of the exercise. The core responsibility of the SOC analyst is making sense of the telemetry: cutting through thousands of background events, validating true positives against false positives, grouping related alerts into cohesive cases, and documenting the precise blast radius."
        />

        {/* Where alerts come from */}
        <Reveal delay={0.08} className="mt-12">
          <h3 className="text-lg text-ink">
            Where every alert comes from <span className="text-sm text-muted">— four sensors, four layers</span>
          </h3>
        </Reveal>

        <Stagger className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sensors.map((sensor) => {
            const Icon = sensor.icon;
            return (
              <StaggerItem key={sensor.name}>
                <div className={`panel flex h-full flex-col p-5 ${sensor.ring}`}>
                  <div className="flex items-center justify-between">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border border-rule bg-paper-3 ${sensor.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`font-mono text-[0.65rem] ${sensor.tone}`}>{sensor.ref}</span>
                  </div>
                  <h4 className="mt-4 text-md font-medium text-ink">{sensor.name}</h4>
                  <p className={`mt-1 text-xs font-medium ${sensor.tone}`}>{sensor.where}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted">{sensor.catches}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal delay={0.1} className="mt-6">
          <div className="panel flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 font-mono text-[0.72rem] text-ink-2">
            {["adversary command", "sensor detection", "encrypted tunnel", "correlation rule", "case created in TheHive"].map((node, i, arr) => (
              <span key={node} className="flex items-center gap-3">
                <span className="text-faint">{node}</span>
                {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-accent" />}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Noise to signal */}
        <Reveal delay={0.1} className="mt-16">
          <h3 className="text-lg text-ink">
            From 9,567 raw alerts to three investigations <span className="text-sm text-muted">— isolating actionable signal</span>
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Raw telemetry alone does not equal an investigation. In an enterprise environment, raw event streams
            must be handled through two synchronized paths: an automated SOAR pipeline that immediately opens tickets for
            high-severity threats, and targeted analyst filters that eliminate routine noise during deep-dive root-cause analysis.
          </p>
        </Reveal>

        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {funnel.map((step, i) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.label}>
                <div className="panel relative h-full p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-rule bg-paper-3 text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-mono text-[0.65rem] text-faint">step {i + 1}</span>
                  </div>
                  <div className="mt-4 font-mono text-3xl text-ink">
                    <Counter to={step.value} group={step.group} />
                  </div>
                  <div className="mt-1 text-sm font-medium text-ink-2">{step.label}</div>
                  <p className="mt-2 text-xs leading-5 text-muted">{step.note}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal delay={0.12} className="mt-6">
          <div className="panel bg-paper-3/60 p-6 sm:p-8">
            <h4 className="text-md font-medium text-ink">And the engineering that makes 9,567 alerts usable:</h4>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {engine.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rule bg-paper-2 text-cool">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-ink">{item.title}</div>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Workflow */}
        <Reveal delay={0.1} className="mt-16">
          <h3 className="text-lg text-ink">
            How I triage, step by step <span className="text-sm text-muted">— the six moves behind every case</span>
          </h3>
        </Reveal>

        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflow.map((step) => (
            <StaggerItem key={step.n}>
              <div className="panel flex h-full gap-4 p-5">
                <span className="font-mono text-sm text-accent">{step.n}</span>
                <div>
                  <div className="text-sm font-medium text-ink">{step.title}</div>
                  <p className="mt-1.5 text-sm leading-6 text-muted">{step.text}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Cases */}
        <Reveal delay={0.1} className="mt-16">
          <h3 className="text-lg text-ink">
            Three incidents, told start to finish <span className="text-sm text-muted">— the written case files</span>
          </h3>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <Reveal>
            <div className="flex flex-col gap-3">
              {cases.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCase(i)}
                  onMouseEnter={() => setActiveCase(i)}
                  className={`panel flex items-center justify-between gap-4 p-4 text-left transition-all duration-300 ${
                    i === activeCase ? "border-accent/50 shadow-glow-accent" : "hover:border-rule-2"
                  }`}
                  aria-pressed={i === activeCase}
                >
                  <span className="min-w-0">
                    <span className="font-mono text-xs text-faint">{c.label} · stages {c.stages[0]}–{c.stages[c.stages.length - 1]}</span>
                    <span className="mt-1 block text-sm font-medium text-ink">{c.title}</span>
                  </span>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${i === activeCase ? "bg-accent" : "bg-rule-2"}`} />
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="panel relative h-full overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-accent/15 blur-[80px]" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="chip border-accent/40 bg-accent-soft font-mono text-accent">{current.label}</span>
                    <span className="chip border-rule bg-paper-3 text-xs text-muted">
                      {current.stages.length} stages · {current.status}
                    </span>
                  </div>
                  <h4 className="mt-5 text-xl text-ink">{current.title}</h4>
                  <p className="mt-3 text-md leading-relaxed text-ink-2">{current.scope}</p>
                  <div className="mt-6 rounded-card border border-rule bg-paper-3/70 p-4">
                    <div className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">The question I had to answer</div>
                    <p className="mt-2 text-sm leading-6 text-ink-2">“{current.question}”</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {current.stages.map((s) => (
                      <span key={s} className="rounded-md border border-rule bg-paper-2 px-2 py-1 font-mono text-[0.65rem] text-muted">
                        {s}
                      </span>
                    ))}
                  </div>
                  <a
                    href={`${repoBlob}/${current.path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-ink"
                  >
                    Read the {current.label} case file
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

        {/* 4K Investigation & Correlation Blueprints */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.12}>
            <DiagramCard
              title="74-Minute Incident Correlation Timeline"
              subtitle="Minute-by-minute timeline correlating attacker milestones against blue-team detection alerts"
              src="/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png"
              caption="Ground-truth forensic timeline cross-referencing elapsed time T0, UTC, and IST."
            />
          </Reveal>
          <Reveal delay={0.14}>
            <DiagramCard
              title="SOC Analyst Investigation Lifecycle"
              subtitle="Structured IR methodology: triage, containment, forensic deep-dive, and permanent hardening"
              src="/diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png"
              caption="End-to-end incident handling framework executed across Cases 01, 02, and 03."
            />
          </Reveal>
        </div>

        <Reveal delay={0.12} className="mt-8 flex flex-wrap items-center gap-4">
          <RepoLink href={`${repoBlob}/04-Investigation/README.md`} note="analyst notes for all 20 stages">
            See the full investigation
          </RepoLink>
          <RepoLink href={`${repoBlob}/03-Detection-Engineering/README.md`} note="rules and the SOAR pipeline">
            See the detection engineering
          </RepoLink>
        </Reveal>

        <Reveal delay={0.14} className="mt-6">
          <p className="text-sm text-muted">
            Time to detect, measured across the campaign: median{" "}
            <span className="font-mono text-ink">{(metrics.timeToDetect.median / 1000).toFixed(1)}s</span>, fastest{" "}
            <span className="font-mono text-ink">{(metrics.timeToDetect.min / 1000).toFixed(1)}s</span>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
