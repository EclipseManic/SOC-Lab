import { useEffect, useRef, useState } from "react";
import { Crown, LogIn, Network, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { metrics, repoBlob, stages } from "@/data";
import { RepoLink, SectionHead } from "./visual-shared";
import { Reveal } from "@/components/fx/reveal";
import { DiagramCard } from "./diagram-modal";

const acts = [
  { n: "01", name: "Perimeter Web Exploitation", range: "01–07", blurb: "Initial access, SQLi credential dump & Linux root privilege escalation", icon: LogIn, tone: "text-hot", bar: "bg-hot" },
  { n: "02", name: "Internal Lateral Movement", range: "08–14", blurb: "Subnet pivoting, LLMNR poisoning, Kerberoasting & DCSync domain theft", icon: Network, tone: "text-violet", bar: "bg-violet" },
  { n: "03", name: "Domain Takeover & Impact", range: "15–20", blurb: "Pass-the-Hash, Golden Ticket forge, rogue persistence & ransomware defacement", icon: Crown, tone: "text-accent", bar: "bg-accent" },
];

function actOf(i: number) {
  if (i < 7) return 0;
  if (i < 14) return 1;
  return 2;
}

function outcome(status: string, coverageClass?: string) {
  if (coverageClass === "direct-detection" || (status === "Detected" && coverageClass !== "operational-coverage")) {
    return {
      label: "Direct Detection",
      subLabel: "Direct Target/Wire Alert",
      tone: "text-ok",
      dot: "bg-ok",
      ring: "border-ok/50",
      chip: "border-ok/40 bg-ok-soft text-ok",
      glow: "shadow-glow-cool",
    };
  }
  if (coverageClass === "operational-coverage") {
    return {
      label: "Pivot-Only Detection",
      subLabel: "Pivot-Only Detection (DG Gap)",
      tone: "text-cool",
      dot: "bg-cool",
      ring: "border-cool/50",
      chip: "border-cool/40 bg-cool-soft text-cool",
      glow: "shadow-glow-cool",
    };
  }
  if (coverageClass === "target-logging-gap" || status === "Logging gap") {
    return {
      label: "Partial Visibility",
      subLabel: "Target Logging Gap (Partial)",
      tone: "text-accent",
      dot: "bg-accent",
      ring: "border-accent/50",
      chip: "border-accent/40 bg-accent-soft text-accent",
      glow: "shadow-glow-accent",
    };
  }
  if (coverageClass === "offline-gap" || status === "Detection gap") {
    return {
      label: "Offline Activity",
      subLabel: "Offline Activity (No Wire Telemetry)",
      tone: "text-faint",
      dot: "bg-faint",
      ring: "border-rule",
      chip: "border-rule bg-paper-3 text-muted",
      glow: "",
    };
  }
  if (status === "Rule failure") {
    return {
      label: "Rule Failure",
      subLabel: "Rule Failure",
      tone: "text-hot",
      dot: "bg-hot",
      ring: "border-hot/50",
      chip: "border-hot/40 bg-hot-soft text-hot",
      glow: "shadow-glow-hot",
    };
  }
  return {
    label: "Not tested",
    subLabel: "Not tested",
    tone: "text-muted",
    dot: "bg-muted",
    ring: "border-rule",
    chip: "border-rule bg-paper-3 text-muted",
    glow: "",
  };
}

export function VisualAttack() {
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });

  useEffect(() => {
    if (!reduced) setPlaying(true);
  }, [reduced]);

  useEffect(() => {
    if (!playing || !inView || reduced) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % stages.length), 1700);
    return () => clearInterval(t);
  }, [playing, inView, reduced]);

  const current = stages[index];
  const act = acts[actOf(index)];
  const result = outcome(current.status, current.coverageClass);

  return (
    <section id="attack" className="section-shell">
      <div className="container-page" ref={ref}>
        <SectionHead
          index="02"
          kicker="Adversary Attack Simulation"
          title="A 20-stage kill chain, mapped across the MITRE ATT&CK framework."
          lede="Real-world cyber intrusions do not happen in isolation—they follow an intentional progression from external reconnaissance to lateral movement and domain impact. In this 74-minute campaign, each offensive technique was executed with specific telemetry expectations in mind, testing whether network and host detection rules would trigger."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          {/* Rail */}
          <Reveal>
            <div className="panel p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-accent bg-accent text-accent-ink shadow-glow-accent transition-transform hover:scale-105"
                    aria-label={playing ? "Pause the chain" : "Play the chain"}
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <div>
                    <div className="text-sm font-medium text-ink">
                      Step {index + 1} of {stages.length}
                    </div>
                    <div className="text-xs text-muted">
                      {metrics.directDetectionCount} direct · {metrics.operationalAlertCount - metrics.directDetectionCount} pivot-only · {metrics.totalGapCount} gaps
                    </div>
                  </div>
                </div>
                <div className={`chip ${result.chip}`}>
                  {result.label}
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {acts.map((a, ai) => {
                  const ActIcon = a.icon;
                  return (
                    <div key={a.n}>
                      <div className="mb-2 flex items-center gap-2 text-xs">
                        <ActIcon className={`h-3.5 w-3.5 ${a.tone}`} />
                        <span className={`font-medium ${a.tone}`}>{a.name}</span>
                        <span className="text-faint">· {a.blurb}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {stages.map((s, si) => {
                          if (actOf(si) !== ai) return null;
                          const isActive = si === index;
                          const isPast = si < index;
                          const r = outcome(s.status);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setIndex(si);
                                setPlaying(false);
                              }}
                              aria-label={`Step ${s.id} — ${s.title}`}
                              className={`relative flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-xs transition-all duration-300 ${
                                isActive
                                  ? `${r.ring} bg-paper-3 text-ink ${r.glow} scale-110`
                                  : isPast
                                    ? "border-rule-2 bg-paper-2 text-ink-2"
                                    : "border-rule bg-paper-3/60 text-faint hover:border-rule-2 hover:text-ink-2"
                              }`}
                            >
                              {s.id}
                              <span className={`absolute -bottom-0.5 h-1 w-1 rounded-full ${isPast || isActive ? r.dot : "bg-rule"}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Spotlight */}
          <Reveal delay={0.08}>
            <div className="panel relative overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" />
              <div className={`pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-[80px] ${act.bar} opacity-20`} />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="chip border-rule-2 bg-paper-3 font-mono text-ink-2">
                    Stage {current.id}
                  </span>
                  <span className={`text-xs font-medium ${act.tone}`}>
                    Act {act.n} · {act.name}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="mt-5 text-2xl text-ink sm:text-3xl">{current.title}</h3>
                    <p className="mt-4 max-w-xl text-md leading-relaxed text-ink-2">{current.plain}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <span className={`chip ${result.chip}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${result.dot}`} />
                        {result.subLabel}
                      </span>
                      <span className="font-mono text-xs text-faint">{current.techniqueId}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-7 border-t border-rule pt-5">
                  <a
                    href={`${repoBlob}/${current.attackPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-ink"
                  >
                    Read the exact commands for stage {current.id}
                    <span aria-hidden>↗</span>
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* 4K Offensive Blueprints */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.12}>
            <DiagramCard
              title="Consolidated 5-Act Attack Progression"
              subtitle="End-to-end adversary progression from perimeter break-in to Active Directory ransomware"
              src="/diagrams/Consolidated%205-Act%20Attack%20Progression.png"
              caption="5-Act architectural storyline linking commands, hosts, credentials, and impact."
            />
          </Reveal>
          <Reveal delay={0.14}>
            <DiagramCard
              title="20-Stage MITRE ATT&CK Kill Chain Roadmap"
              subtitle="Full attack campaign mapped across 11 tactics and 20 techniques"
              src="/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png"
              caption="Complete 74-minute offensive execution matrix across Linux and Windows hosts."
            />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-8">
          <RepoLink href={`${repoBlob}/02-Attack-Simulation/README.md`} note="all 20 stages, with terminal proof">
            See the full attack playbook
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}
