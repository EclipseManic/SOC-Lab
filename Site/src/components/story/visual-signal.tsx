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
    title: "Cracking the passwords (at home)",
    why: "The attacker took the stolen password hashes away and cracked them on his own graphics card. Nothing crossed my network — so there was nothing for my tools to see.",
  },
  {
    id: "11",
    icon: Cpu,
    title: "Cracking a Windows password (at home)",
    why: "Same story. The captured Windows password was cracked offline. No traffic, no logs, no alarm — a gap that is physically impossible to watch.",
  },
  {
    id: "09",
    icon: Radar,
    title: "A quiet sweep, once inside",
    why: "Inside the network the attacker scanned for other machines. That traffic never crossed my gateway camera, and the victims' own logs were not watching for it.",
  },
  {
    id: "12",
    icon: SearchX,
    title: "Mapping the way to the top",
    why: "The attacker probed the directory for a path to the crown jewels. I caught the moment he logged in from the pivot, but the directory server was not recording the queries themselves.",
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
          kicker="Did anyone notice?"
          title="Sixteen alarms. Four blind spots."
          lede="This is the honest part. I replayed every step against my logs and counted what my defenses really caught — and I named the four moments they could not, instead of hiding them behind a percentage."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
          <Reveal>
            <div className="panel flex items-center justify-center p-8">
              <ScoreRing />
            </div>
          </Reveal>

          <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StaggerItem>
              <Stat value={metrics.directDetectionCount} of={metrics.stageCount} tone="text-cool" label="caught directly on the victim" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.operationalAlertCount} of={metrics.stageCount} tone="text-ok" label="raised a live alert" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.totalGapCount} tone="text-accent" label="named blind spots" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.theHiveAlertCount} tone="text-ink" label="case files opened" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.ruleFailureCount} tone="text-ink" label="rules that failed" />
            </StaggerItem>
            <StaggerItem>
              <Stat value={metrics.durationMinutes} suffix=" min" tone="text-ink" label="from first scan to impact" />
            </StaggerItem>
          </Stagger>
        </div>

        <Reveal delay={0.1} className="mt-14">
          <div className="flex items-center gap-3">
            <EyeOff className="h-5 w-5 text-accent" />
            <h3 className="text-lg text-ink">The four blind spots</h3>
            <span className="text-sm text-muted">— {missed}, told plainly</span>
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
