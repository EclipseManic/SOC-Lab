import { ArrowDown, Play, Search } from "lucide-react";
import { motion } from "motion/react";
import { metrics } from "@/data";
import { HeroBackdrop } from "@/components/fx/backdrop";
import { HeroConsole } from "@/components/fx/console";
import { Counter } from "@/components/fx/counter";
import { Reveal, EASE } from "@/components/fx/reveal";
import { useBooted } from "@/lib/boot";

const strip = [
  { value: metrics.stageCount, label: "attack stages executed", tone: "text-ink" },
  { value: metrics.operationalAlertCount, label: "operational alerts raised", tone: "text-ok" },
  { value: metrics.directDetectionCount, label: "endpoint detections confirmed", tone: "text-cool" },
  { value: metrics.totalGapCount, label: "documented visibility gaps", tone: "text-accent" },
];

export function VisualHero() {
  const booted = useBooted();

  // The entrance plays only once the boot overlay lifts, so the first thing a
  // visitor sees is the hero animating in rather than a half-built page.
  const enter = (y: number, delay: number, duration: number) => ({
    initial: { opacity: 0, y },
    animate: booted ? { opacity: 1, y: 0 } : { opacity: 0, y },
    transition: { duration, delay, ease: EASE as unknown as [number, number, number, number] },
  });

  return (
    <section id="top" className="relative isolate overflow-hidden pb-10 pt-8 sm:pb-16 sm:pt-12">
      <HeroBackdrop />

      <div className="container-page relative">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          {/* Left — the story */}
          <div className="min-w-0">
            <motion.span
              {...enter(12, 0, 0.5)}
              className="chip border-rule-2 bg-paper-2/60 text-ink-2"
            >
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
              A self-hosted hybrid SOC lab · built to test detection engineering under real attack conditions
            </motion.span>

            <motion.h1
              {...enter(22, 0.06, 0.7)}
              className="mt-5 max-w-[15ch] text-[2.2rem] leading-[1.05] text-ink sm:text-display-m"
            >
              I built a company, broke in,{" "}
              <span className="text-glow-accent text-accent">then hunted every move.</span>
            </motion.h1>

            <motion.p
              {...enter(18, 0.16, 0.7)}
              className="mt-5 max-w-xl text-md leading-relaxed text-ink-2 sm:text-lg"
            >
              To evaluate how detection rules perform against realistic adversary behavior, I built
              an enterprise environment spanning an on-premises Active Directory network, a Linux DMZ
              web server, an inline security gateway, and an Azure cloud SOC.
              I executed a continuous {metrics.durationMinutes}-minute, {metrics.stageCount}-stage attack
              campaign—advancing from initial web exploitation to domain takeover—then sat down as the SOC
              analyst to rigorously verify every alert and document what was caught versus what slipped past.
            </motion.p>

            <motion.div {...enter(16, 0.26, 0.6)} className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#investigation" className="btn btn-primary">
                <Search className="h-4 w-4" />
                See how I investigate
              </a>
              <a href="#attack" className="btn btn-secondary">
                <Play className="h-4 w-4" />
                Watch the break-in
              </a>
            </motion.div>
          </div>

          {/* Right — the live console */}
          <Reveal delay={0.15} y={30} className="min-w-0">
            <HeroConsole />
          </Reveal>
        </div>

        {/* Score peek */}
        <Reveal delay={0.2} y={30} className="mt-12">
          <div className="glass grid grid-cols-2 divide-rule/70 sm:grid-cols-4">
            {strip.map((item) => (
              <div key={item.label} className="border-b border-rule/60 px-5 py-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <div className={`font-mono text-3xl ${item.tone}`}>
                  <Counter to={item.value} />
                </div>
                <div className="mt-1 text-sm text-muted">{item.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.3}>
          <a href="#setup" className="mt-8 inline-flex items-center gap-2 text-sm text-faint hover:text-ink">
            <ArrowDown className="h-4 w-4 animate-float" />
            Start at the beginning
          </a>
        </Reveal>
      </div>
    </section>
  );
}
