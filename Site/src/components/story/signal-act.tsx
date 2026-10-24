import { useState } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  CheckCircle2,
  Layers,
  Radio,
  ShieldCheck,
  WifiOff,
  Zap,
} from "lucide-react";
import {
  repoBlob,
  stages,
  verifiedCount,
} from "@/data";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Capability = "Supported" | "Conditional" | "Not supported";

interface SignalRow {
  behavior: string;
  note: string;
  network: Capability;
  host: Capability;
  identity: Capability;
  claim: string;
}

const signalRows: SignalRow[] = [
  {
    behavior: "Attacker ↔ victim",
    note: "The path crosses the Suricata gateway.",
    network: "Supported",
    host: "Conditional",
    identity: "Not supported",
    claim: "Cross-segment flow is on the wire.",
  },
  {
    behavior: "Victim ↔ victim",
    note: "SMB, LDAP, and Kerberos can stay inside .56.0/24.",
    network: "Not supported",
    host: "Conditional",
    identity: "Conditional",
    claim: "Only host or directory logs can carry it.",
  },
  {
    behavior: "Offline cracking",
    note: "The work happens outside the victim network.",
    network: "Not supported",
    host: "Not supported",
    identity: "Not supported",
    claim: "No direct signal. Correlate adjacent events.",
  },
  {
    behavior: "Web request / upload",
    note: "HTTP may cross the gateway or terminate on the host.",
    network: "Supported",
    host: "Conditional",
    identity: "Not supported",
    claim: "A request is not proof of intent.",
  },
  {
    behavior: "Kerberos service ticket",
    note: "The domain controller records the ticket request.",
    network: "Conditional",
    host: "Not supported",
    identity: "Supported",
    claim: "4769 is the anchor, not the verdict.",
  },
  {
    behavior: "Directory replication",
    note: "DRSUAPI and directory access can expose the request.",
    network: "Conditional",
    host: "Not supported",
    identity: "Supported",
    claim: "4662 and DRSUAPI context matter.",
  },
  {
    behavior: "Account / group change",
    note: "The change lands in the Windows security log.",
    network: "Not supported",
    host: "Conditional",
    identity: "Supported",
    claim: "4720 / 4728 / 4732 / 4738.",
  },
  {
    behavior: "Staging / egress",
    note: "Volume and destination only mean something against a baseline.",
    network: "Conditional",
    host: "Conditional",
    identity: "Not supported",
    claim: "A transfer is not automatically exfiltration.",
  },
];

const capabilityTone: Record<Capability, string> = {
  Supported: "text-teal",
  Conditional: "text-amber",
  "Not supported": "text-faint",
};

const capabilityDot: Record<Capability, string> = {
  Supported: "bg-teal",
  Conditional: "bg-amber",
  "Not supported": "bg-line",
};

function CapabilityCell({ value }: { value: Capability }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("h-1.5 w-1.5 rounded-full", capabilityDot[value])}
        aria-hidden="true"
      />
      <span className={cn("font-mono text-[9px] uppercase tracking-[0.1em]", capabilityTone[value])}>
        {value}
      </span>
    </span>
  );
}

export function SignalAct() {
  const [filter, setFilter] = useState<"all" | "verified" | "gaps">("all");

  const filteredStages = stages.filter((stage) => {
    if (filter === "verified") return stage.status === "Detected";
    if (filter === "gaps")
      return stage.status === "Logging gap" || stage.status === "Detection gap";
    return true;
  });

  const offlineCount = stages.filter((s) => s.status === "Detection gap").length;
  const loggingGapCount = stages.filter((s) => s.status === "Logging gap").length;

  return (
    <section
      id="signal"
      aria-labelledby="signal-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        {/* Act Header */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Act IV / The signal
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            04 of 06
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <h2
            id="signal-heading"
            className="max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl"
          >
            An alert is not
            <br />
            a coverage claim.
          </h2>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Three telemetry planes carry the campaign: Suricata network NIDS,
              Wazuh endpoint agents with Sysmon and auditd, and Active Directory
              security event logs. None of them sees all of it.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              Coverage is earned only when the attack executes, the rule fires
              for the authentic technique, and the alert reaches TheHive
              through the correlation pipeline.
            </p>
          </div>
        </div>

        {/* 1. Capability Boundary Table */}
        <div className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/70 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
                Part 1 / Telemetry Plane Capabilities
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink">
                What each layer can and cannot see
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                Key:
              </span>
              <CapabilityCell value="Supported" />
              <CapabilityCell value="Conditional" />
              <CapabilityCell value="Not supported" />
            </div>
          </div>

          <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line/70 lg:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line/70 bg-panel/45">
                  <th scope="col" className="px-4 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Behavior
                  </th>
                  <th scope="col" className="px-3 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Suricata NIDS
                  </th>
                  <th scope="col" className="px-3 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Wazuh Agent / Sysmon
                  </th>
                  <th scope="col" className="px-3 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    AD Security
                  </th>
                  <th scope="col" className="px-4 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                    Theoretical Visibility
                  </th>
                </tr>
              </thead>
              <tbody>
                {signalRows.map((row) => (
                  <tr key={row.behavior} className="border-b border-line/55 last:border-b-0">
                    <th scope="row" className="px-4 py-4 text-left font-normal">
                      <span className="block text-sm font-medium text-ink">{row.behavior}</span>
                      <span className="mt-1 block max-w-[15rem] text-xs leading-5 text-faint">
                        {row.note}
                      </span>
                    </th>
                    <td className="px-3 py-4 align-top">
                      <CapabilityCell value={row.network} />
                    </td>
                    <td className="px-3 py-4 align-top">
                      <CapabilityCell value={row.host} />
                    </td>
                    <td className="px-3 py-4 align-top">
                      <CapabilityCell value={row.identity} />
                    </td>
                    <td className="px-4 py-4 align-top text-xs leading-5 text-muted">
                      {row.claim}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 lg:hidden">
            {signalRows.map((row) => (
              <div key={row.behavior} className="rounded-2xl border border-line/70 bg-panel/30 p-4">
                <p className="text-sm font-medium text-ink">{row.behavior}</p>
                <p className="mt-1 text-xs leading-5 text-faint">{row.note}</p>
                <dl className="mt-4 grid gap-2 border-t border-line/60 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Suricata</dt>
                    <dd><CapabilityCell value={row.network} /></dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Wazuh Host</dt>
                    <dd><CapabilityCell value={row.host} /></dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">AD Security</dt>
                    <dd><CapabilityCell value={row.identity} /></dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-line/60 pt-3 text-xs leading-5 text-muted">
                  {row.claim}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Empirical Performance Metrics & Pipeline Architecture */}
        <div className="mt-16">
          <div className="flex items-center gap-3 border-b border-line/70 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
                Part 2 / Empirical Validation & Alert Pipeline
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink">
                Verified detections across 20 simulated stages
              </h3>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Verified Coverage Card */}
            <Card className="relative overflow-hidden p-6 sm:p-7">
              <div
                className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal/10 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-teal">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Empirical Detection Rate
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-mono text-5xl font-semibold tracking-[-0.06em] text-ink sm:text-6xl">
                      {verifiedCount}
                    </span>
                    <span className="font-mono text-2xl text-faint">/ {stages.length}</span>
                  </div>
                  <p className="mt-3 max-w-md text-sm leading-6 text-muted">
                    16 of 20 stages generated verified alerts forwarded to TheHive.
                    Zero rule failures. The remaining 4 stages represent documented
                    offline operations or intra-subnet target-side refinements.
                  </p>
                </div>
                <Badge tone="teal">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  80.0% Validated
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="relative mt-6 h-2 overflow-hidden rounded-full bg-line/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal via-blue to-teal transition-all duration-700"
                  style={{ width: `${(verifiedCount / stages.length) * 100}%` }}
                />
              </div>
              <div className="relative mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                <span>0% baseline</span>
                <span className="font-medium text-teal">80% Verified True Positives</span>
                <span>100% ideal</span>
              </div>
            </Card>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Radio className="h-4 w-4 text-teal" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-teal">
                    Active
                  </span>
                </div>
                <div className="mt-3 font-mono text-2xl font-semibold text-ink sm:text-3xl">
                  {verifiedCount}
                </div>
                <p className="mt-1 text-xs leading-5 text-faint">
                  Actionable alerts in TheHive
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <WifiOff className="h-4 w-4 text-rose" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rose">
                    Inherent
                  </span>
                </div>
                <div className="mt-3 font-mono text-2xl font-semibold text-ink sm:text-3xl">
                  {offlineCount}
                </div>
                <p className="mt-1 text-xs leading-5 text-faint">
                  Offline GPU hash cracking (04, 11)
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <BookOpenCheck className="h-4 w-4 text-amber" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-amber">
                    Refined
                  </span>
                </div>
                <div className="mt-3 font-mono text-2xl font-semibold text-ink sm:text-3xl">
                  {loggingGapCount}
                </div>
                <p className="mt-1 text-xs leading-5 text-faint">
                  Intra-subnet logging gaps (09, 12)
                </p>
              </Card>

              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <Zap className="h-4 w-4 text-teal" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-teal">
                    100%
                  </span>
                </div>
                <div className="mt-3 font-mono text-2xl font-semibold text-ink sm:text-3xl">
                  0
                </div>
                <p className="mt-1 text-xs leading-5 text-faint">
                  Rule execution failures
                </p>
              </Card>
            </div>
          </div>

          {/* 2-Tier Pipeline Architecture Highlight */}
          <div className="mt-6 rounded-2xl border border-line/70 bg-panel/30 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-teal" aria-hidden="true" />
                <h4 className="text-sm font-semibold tracking-[-0.01em] text-ink">
                  custom-thehive: 2-Tier High-Performance Correlation Architecture
                </h4>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-teal">
                Production Daemon · SQLite WAL
              </span>
            </div>

            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              <div className="border-l border-teal/40 pl-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-teal">
                  Tier 1: Zero-HTTP Atomic Ingest
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  POSIX wrapper & O(1) SQLite queue
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Wazuh executes <code className="text-teal">custom-thehive</code> per alert (Level ≥ 8).
                  A single short SQLite WAL transaction dedups and writes the stage row with zero network
                  calls, preserving Wazuh manager EPS throughput.
                </p>
              </div>

              <div className="border-l border-blue/40 pl-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-blue">
                  Tier 2: Async Correlation Daemon
                </p>
                <p className="mt-1 text-sm font-medium text-ink">
                  thehive-flush.service (5s loop)
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Independent background daemon claims batches via atomic leases, fingerprints recon tools
                  (Nmap, Hydra, sqlmap, Nikto), aggregates stages into correlation groups (tool campaigns,
                  process chains, activity bursts), and syncs to TheHive 5 REST API.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. The Interactive 20-Stage Detection Matrix */}
        <div className="mt-16">
          <div className="flex flex-col gap-4 border-b border-line/70 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
                Part 3 / 20-Stage Detection Ledger
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-ink">
                Verified rule triggers & alert proof
              </h3>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 rounded-xl border border-line/70 bg-panel/40 p-1">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-lg px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
                  filter === "all"
                    ? "bg-teal/15 text-teal"
                    : "text-faint hover:text-ink",
                )}
              >
                All (20)
              </button>
              <button
                type="button"
                onClick={() => setFilter("verified")}
                className={cn(
                  "rounded-lg px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
                  filter === "verified"
                    ? "bg-teal/15 text-teal"
                    : "text-faint hover:text-ink",
                )}
              >
                Verified (16)
              </button>
              <button
                type="button"
                onClick={() => setFilter("gaps")}
                className={cn(
                  "rounded-lg px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
                  filter === "gaps"
                    ? "bg-amber/15 text-amber"
                    : "text-faint hover:text-ink",
                )}
              >
                Gaps (4)
              </button>
            </div>
          </div>

          {/* Detection Table */}
          <div className="mt-4 divide-y divide-line/50 rounded-2xl border border-line/70 bg-panel/20">
            {filteredStages.map((stage) => {
              const isDetected = stage.status === "Detected";
              return (
                <div
                  key={stage.id}
                  className="grid gap-3 p-4 transition-colors hover:bg-panel/40 sm:grid-cols-[3rem_minmax(0,1.2fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-5"
                >
                  <span className="font-mono text-xs font-semibold text-faint">
                    {stage.id}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {stage.title}
                      </span>
                      <StatusBadge status={stage.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[9px] text-faint">
                      <span className="uppercase text-teal">{stage.phase}</span>
                      <span>·</span>
                      <span>{stage.technique}</span>
                      <span className="text-muted">({stage.techniqueId})</span>
                    </div>
                  </div>

                  <div className="min-w-0 text-xs leading-5">
                    <p className="text-muted">
                      <span className="font-mono text-[9px] uppercase text-faint">Trigger: </span>
                      <span className={cn(isDetected ? "text-ink" : "text-faint")}>
                        {stage.ruleId ?? stage.telemetry}
                      </span>
                    </p>
                    <p className="mt-0.5 text-faint">
                      <span className="font-mono text-[9px] uppercase text-faint">Alert Proof: </span>
                      <span className={cn(isDetected ? "text-teal" : "text-faint")}>
                        {stage.alertRef ?? stage.evidence}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center justify-end sm:justify-start">
                    <a
                      href={`${repoBlob}/${stage.attackPath}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View stage ${stage.id} documentation`}
                      className="inline-flex items-center gap-1 rounded-lg border border-line/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint transition hover:border-teal/40 hover:text-teal"
                    >
                      Doc
                      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Tuning Discipline and Triage Notes */}
        <div className="mt-16 grid gap-8 border-t border-line/70 pt-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
              Tuning Discipline & Noise Suppression
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              A high detection rate is worthless if alert fatigue burns out analysts.
              In <code className="text-teal">local_rules.xml</code>, machine account background logons
              (rules <code className="text-teal">100610</code> & <code className="text-teal">100611</code>),
              Windows Error Reporting summaries (<code className="text-teal">60608</code>), and Suricata
              multi-port scanner bursts (<code className="text-teal">100410</code>) are throttled and silenced,
              ensuring only high-severity human adversary actions reach TheHive.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-faint">
              Every suppression decision is cataloged in the false-positive register with root causes and verification checks.
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Adversary Realism vs Lab Telemetry
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Some actions occur outside victim sensors by definition. When an attacker cracks MD5 or NTLMv2
              hashes on their own Kali GPU (Stages 04 and 11), victim hosts register zero packets.
              An honest SOC documents these as architectural blind spots rather than fabricating synthetic detections.
            </p>
            <a
              href={`${repoBlob}/03-Detection-Engineering/README.md`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              Open full MITRE ATT&CK coverage matrix
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Next Act Navigation */}
        <div className="mt-16 flex flex-col gap-5 border-t border-line/60 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Next / Act V
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              The case.
            </p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted">
              Detection is verified. The case record is where alerts are triaged and scoped.
            </p>
          </div>
          <a
            href="#case"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
          >
            Open the case board
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}