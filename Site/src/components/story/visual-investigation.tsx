import { useState } from "react";
import {
  ArrowRight,
  Cpu,
  FolderOpen,
  Globe,
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
    where: "Suricata NIDS on Security Gateway (ens33 & ens37)",
    catches:
      "Performs deep packet inspection across all routed and perimeter traffic, detecting port scans, web injection payloads (SQLi), and Kerberos ticket-granting traffic.",
    ref: "SID 2010963 / 2019922",
    tone: "text-cool",
    ring: "border-cool/40",
  },
  {
    icon: Cpu,
    name: "Linux Host & Kernel Auditing",
    where: "Auditd & bashcmd on DMZ Web Host (.30)",
    catches:
      "Hooks execve system calls to capture webshell process execution (/usr/bin/id, nc.openbsd) and logs interactive root commands (sudo -l, secretsdump.py).",
    ref: "Rule 100199 / 100220",
    tone: "text-accent",
    ring: "border-accent/40",
  },
  {
    icon: Laptop,
    name: "Windows Endpoint Instrumentation",
    where: "Sysmon & Windows Security on DC (.10) & Win10 (.20)",
    catches:
      "Logs parent-child process trees (EID 1), NTLM Type 3 logons (EID 4624), administrative privilege use (EID 4672), and persistence registry keys.",
    ref: "Sysmon EID 1 / EID 4624",
    tone: "text-accent",
    ring: "border-accent/40",
  },
  {
    icon: Globe,
    name: "Web Server Application Logs",
    where: "Apache Access & Error Logs on DVWA",
    catches:
      "Captures HTTP request methods, targeted URI paths, automated scanner user-agents (Nikto, sqlmap, custom scripts), and HTTP response status codes.",
    ref: "access.log / Rule 31106",
    tone: "text-ok",
    ring: "border-ok/40",
  },
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
    body: "The 46 ingested TheHive alerts were consolidated into three formal incident cases (Perimeter Web Compromise, Lateral Movement, and Domain Takeover), ensuring analysts work within structured case boundaries rather than chasing fragmented tickets.",
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

        {/* Where alerts come from: 4 Telemetry Sources */}
        <Reveal delay={0.08} className="mt-12">
          <div className="flex items-center gap-2">
            <span className="chip border-accent/40 bg-accent-soft font-mono text-[0.68rem] text-accent">
              Telemetry Collection Layer
            </span>
          </div>
          <h3 className="mt-2 text-xl text-ink sm:text-2xl">
            Four telemetry sources feeding central security analytics
          </h3>
          <p className="mt-1 text-sm text-muted">
            Raw security data is gathered across four dedicated observation layers before reaching the correlation engine.
          </p>
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

        {/* Central SIEM & SOAR Platform Banner */}
        <Reveal delay={0.1} className="mt-5">
          <div className="panel relative overflow-hidden border-ember/40 bg-paper-2/90 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-ember/50 bg-paper-3 text-ember">
                  <Server className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-md font-medium text-ink">Central Security Analytics: Wazuh SIEM 4.14.8 & TheHive 5 SOAR</h4>
                    <span className="chip border-ember/40 bg-paper-3 font-mono text-[0.65rem] text-ember">Azure Cloud</span>
                  </div>
                  <p className="mt-1 text-xs text-muted max-w-2xl leading-relaxed">
                    Ingests all 4 telemetry streams over the site-to-cloud WireGuard VPN tunnel (`10.8.0.0/24`), evaluates events against 148 detection rules and 87 suppressions, and routes high-fidelity alerts into automated case management.
                  </p>
                </div>
              </div>
              <span className="chip border-rule bg-paper-3 font-mono text-xs text-faint shrink-0">
                Level ≥ 8 Integration Gate
              </span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-6">
          <div className="panel flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 font-mono text-[0.72rem] text-ink-2">
            {["adversary command", "telemetry sensor capture", "encrypted WireGuard tunnel", "Wazuh correlation rule", "TheHive SOAR case"].map((node, i, arr) => (
              <span key={node} className="flex items-center gap-3">
                <span className="text-faint">{node}</span>
                {i < arr.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-accent" />}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Noise to signal: The Dual-Pathway Architecture */}
        <Reveal delay={0.1} className="mt-16">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="chip border-accent/40 bg-accent-soft font-mono text-[0.68rem] text-accent">
                Dual-Pathway Architecture
              </span>
            </div>
            <h3 className="text-xl text-ink sm:text-2xl">
              Two distinct operational pathways from 9,567 baseline alerts
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">
              In production detection engineering, raw telemetry does not flow through a single linear waterfall. Instead, the common telemetry stream of 9,567 events splits into two independent operational pathways: an automated, real-time SOAR pipeline for immediate incident ticketing, and a post-simulation analyst triage filter for deep-dive forensic reconstruction.
            </p>
          </div>
        </Reveal>

        {/* Common Baseline Stream Card */}
        <Reveal delay={0.12} className="mt-6">
          <div className="panel border-rule-2 bg-paper-2/80 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rule bg-paper-3 text-accent">
                  <Radar className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-2xl font-bold text-ink">
                      <Counter to={9567} group />
                    </span>
                    <span className="text-sm font-medium text-ink-2">Raw Baseline SIEM Alerts</span>
                  </div>
                  <p className="text-xs text-muted">
                    Common event baseline indexed in OpenSearch across all 4 reporting agents (DVWA: 8,114 · Suricata: 1,168 · DC: 168 · Win10: 117)
                  </p>
                </div>
              </div>
              <span className="chip border-accent/30 bg-accent-soft/50 font-mono text-xs text-accent shrink-0">
                Common Telemetry Stream
              </span>
            </div>
          </div>
        </Reveal>

        {/* Side-by-Side Dual Pathways */}
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          {/* PATH A: SOAR Automated Pipeline */}
          <Reveal delay={0.14}>
            <div className="panel h-full border-ok/30 bg-paper-2/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-rule/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-ok animate-pulse" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ok">Path A · Automated SOAR</span>
                  </div>
                  <span className="chip border-ok/40 bg-ok-soft font-mono text-[0.65rem] text-ok">
                    Real-Time Pipeline
                  </span>
                </div>
                <h4 className="mt-3 text-base font-medium text-ink">Immediate Incident Ticketing & Grouping</h4>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Wazuh evaluates logs against the Level ≥ 8 gate. High-priority hits buffer into a local SQLite queue and are flushed every 5 seconds to TheHive 5.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-rule bg-paper-3/90 p-3.5">
                    <div className="font-mono text-2xl font-bold text-ok">
                      <Counter to={46} />
                    </div>
                    <div className="mt-1 text-xs font-medium text-ink-2">TheHive Alerts Ingested</div>
                    <p className="mt-1 text-[0.7rem] text-muted">
                      De-duplicated and grouped by tool fingerprint & source IP
                    </p>
                  </div>
                  <div className="rounded-lg border border-rule bg-paper-3/90 p-3.5">
                    <div className="font-mono text-2xl font-bold text-ink">
                      <Counter to={3} />
                    </div>
                    <div className="mt-1 text-xs font-medium text-ink-2">Incident Cases Consolidated</div>
                    <p className="mt-1 text-[0.7rem] text-muted">
                      Scoped by kill-chain phases (Web, Lateral, Domain)
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-rule/50 bg-paper-3/50 px-3 py-2 text-[0.72rem] text-faint">
                <span className="font-medium text-ink-2">Operational Goal:</span> Prevent alert fatigue while ensuring zero high-priority incidents are dropped.
              </div>
            </div>
          </Reveal>

          {/* PATH B: SOC Analyst Triage */}
          <Reveal delay={0.16}>
            <div className="panel h-full border-cool/30 bg-paper-2/90 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-rule/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cool" />
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cool">Path B · Analyst Triage</span>
                  </div>
                  <span className="chip border-cool/40 bg-cool-soft font-mono text-[0.65rem] text-cool">
                    Human Root-Cause Analysis
                  </span>
                </div>
                <h4 className="mt-3 text-base font-medium text-ink">Dashboard Noise Elimination</h4>
                <p className="mt-1 text-xs leading-5 text-muted">
                  During deep-dive investigation, the analyst applies precision exclusion clauses in OpenSearch to filter benign operating system background noise.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-rule bg-paper-3/90 p-3.5">
                    <div className="font-mono text-2xl font-bold text-cool">
                      <Counter to={11} />
                    </div>
                    <div className="mt-1 text-xs font-medium text-ink-2">Dashboard Exclusion Filters</div>
                    <p className="mt-1 text-[0.7rem] text-muted">
                      Must-not clauses strip 404 floods, SCA scans & VMware polling
                    </p>
                  </div>
                  <div className="rounded-lg border border-rule bg-paper-3/90 p-3.5">
                    <div className="font-mono text-2xl font-bold text-ink">
                      <Counter to={808} group />
                    </div>
                    <div className="mt-1 text-xs font-medium text-ink-2">Curated Forensic Records</div>
                    <p className="mt-1 text-[0.7rem] text-muted">
                      Clean event dataset analyzed for root-cause timeline reconstruction
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-md border border-rule/50 bg-paper-3/50 px-3 py-2 text-[0.72rem] text-faint">
                <span className="font-medium text-ink-2">Analyst Goal:</span> Reconstruct complete attacker timeline without drowning in background noise.
              </div>
            </div>
          </Reveal>
        </div>

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
