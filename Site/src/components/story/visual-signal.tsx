import { Cpu, EyeOff, Radar, SearchX } from "lucide-react";
import { motion } from "motion/react";
import { metrics, repoBlob, stages } from "@/data";
import { Counter } from "@/components/fx/counter";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { RepoLink, SectionHead } from "./visual-shared";

const RADIUS = 68;
const CIRC = 2 * Math.PI * RADIUS;

const gaps = [
  {
    id: "04",
    icon: Cpu,
    title: "Offline MD5 Hash Cracking",
    why: "The attacker exported MD5 password hashes from the compromised database and cracked them offline on an isolated GPU rig. Because computational brute forcing produces zero network traffic or endpoint system calls on victim infrastructure, it cannot be observed by SIEM or NIDS sensors.",
  },
  {
    id: "11",
    icon: Cpu,
    title: "Offline NetNTLMv2 Password Cracking",
    why: "Following LLMNR broadcast poisoning, the captured Windows NetNTLMv2 authentication token was cracked offline with Hashcat. Like Stage 04, offline mathematical recovery leaves no forensic trace on monitored corporate assets.",
  },
  {
    id: "09",
    icon: Radar,
    title: "Target Endpoint Logging Gap (Internal Nmap Sweep)",
    why: "While Suricata's internal interface (ens37) caught the wire sweep (Alerts #17–#19) and Wazuh caught the Nmap command on DVWA (Rule 100220), the target Windows endpoints (DC and Win10) produced zero host logs. Because Windows Filtering Platform (WFP) dropped-packet auditing was disabled by default, the targets silently dropped the probes without generating an alert.",
  },
  {
    id: "12",
    icon: SearchX,
    title: "BloodHound LDAP Active Directory Reconnaissance",
    why: "The attacker executed BloodHound to enumerate domain trusts and privilege escalation paths. While the remote session itself was authenticated, the Windows Domain Controller lacked Directory Service Access Auditing (EID 1644) and SACLs, leaving the reconnaissance queries unlogged.",
  },
];

function ScoreRing() {
  const pct = metrics.operationalAlertPercent / 100;
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="var(--color-rule)" strokeWidth="8" />
        <motion.circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="var(--color-ok)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          whileInView={{ strokeDashoffset: CIRC * (1 - pct) }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 10px var(--color-ok))" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-4xl text-ink">
          <Counter to={metrics.operationalAlertCount} />
        </div>
        <div className="text-xs text-muted">of {metrics.stageCount} alarmed</div>
      </div>
    </div>
  );
}

export function VisualSignal() {
  const missed = stages.length - metrics.operationalAlertCount;

  return (
    <section id="score" className="section-shell">
      <div className="container-page">
        <SectionHead
          index="07"
          kicker="Empirical Telemetry Accounting"
          title="Sixteen alerts confirmed. Four visibility gaps documented."
          lede="Mature detection engineering requires honest, evidence-backed evaluation. Rather than claiming 100% artificial detection coverage, I cross-examined every attack stage against raw event logs. We verified 16 actionable alerts in TheHive and thoroughly documented the 4 visibility gaps where telemetry could not be gathered."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <Reveal>
            <div className="panel flex items-center justify-center p-8">
              <ScoreRing />
            </div>
          </Reveal>

          <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StaggerItem>
              <Stat value={metrics.directDetectionCount} of={metrics.stageCount} tone="text-cool" label="direct endpoint detections" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.operationalAlertCount} of={metrics.stageCount} tone="text-ok" label="operational live alerts raised" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.totalGapCount} tone="text-accent" label="documented visibility gaps" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.theHiveAlertCount} tone="text-ink" label="cases tracked in TheHive" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.ruleFailureCount} tone="text-ink" label="rule syntax edge cases" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.durationMinutes} suffix=" min" tone="text-ink" label="total intrusion duration" />
            </StaggerItem>
          </Stagger>
        </div>

        <Reveal delay={0.1} className="mt-14">
          <div className="flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-accent" />
            <h3 className="text-lg text-ink">The four architectural blind spots</h3>
            <span className="text-sm text-muted">— {missed} documented detection gaps analyzed</span>
          </div>
        </Reveal>

        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {gaps.map((gap) => {
            const stage = stages.find((s) => s.id === gap.id);
            const Icon = gap.icon;
            return (
              <StaggerItem key={gap.id}>
                <a
                  href={`${repoBlob}/${stage?.investigationPath ?? "INDEX.md"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group panel flex h-full flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-glow-accent"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent-soft text-accent">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="chip border-rule bg-paper-3 font-mono text-faint">DG-{gap.id}</span>
                  </div>
                  <h4 className="mt-4 text-md font-medium text-ink">{gap.title}</h4>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted">{gap.why}</p>
                  <span className="mt-4 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                    Read the analysis ↗
                  </span>
                </a>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal delay={0.12} className="mt-8">
          <RepoLink href={`${repoBlob}/03-Detection-Engineering/README.md`} note="rules, signatures, the SOAR pipeline">
            See how every detection was engineered
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}

function Stat({
  value,
  of,
  suffix = "",
  tone,
  label,
}: {
  value: number;
  of?: number;
  suffix?: string;
  tone: string;
  label: string;
}) {
  return (
    <div className="panel h-full p-5">
      <div className={`font-mono text-3xl ${tone}`}>
        <Counter to={value} suffix={suffix} />
        {of != null && <span className="text-lg text-faint"> / {of}</span>}
      </div>
      <div className="mt-2 text-sm text-muted">{label}</div>
    </div>
  );
}
