import { ArrowDown, Play, Search } from "lucide-react";
import { motion } from "motion/react";
import { metrics } from "@/data";
import { HeroBackdrop } from "@/components/fx/backdrop";
import { HeroConsole } from "@/components/fx/console";
import { Counter } from "@/components/fx/counter";
import { Reveal, EASE } from "@/components/fx/reveal";

const strip = [
  { value: metrics.stageCount, label: "steps in the break-in", tone: "text-ink" },
  { value: metrics.operationalAlertCount, label: "raised a live alarm", tone: "text-ok" },
  { value: metrics.directDetectionCount, label: "caught on the victim", tone: "text-cool" },
  { value: metrics.totalGapCount, label: "named blind spots", tone: "text-accent" },
];

export function VisualHero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-14 pt-10 sm:pb-20 sm:pt-14">
      <HeroBackdrop />

      <div className="container-page relative">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          {/* Left — the story */}
          <div className="min-w-0">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="chip border-rule-2 bg-paper-2/60 text-ink-2"
            >
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent" />
              A self-hosted security lab · built to be tested, not trusted
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
              className="mt-6 max-w-[15ch] text-[2.7rem] leading-[1.0] text-ink sm:text-display-m"
            >
              I built a company, broke in,{" "}
              <span className="text-glow-accent text-accent">then hunted every move.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
              className="mt-6 max-w-xl text-md leading-relaxed text-ink-2 sm:text-lg"
            >
              A hacker box, three victims, and a full security stack watching. I played the
              attacker through a real {metrics.durationMinutes}-minute, {metrics.stageCount}-step
              intrusion — then sat down as the analyst and worked out, alert by alert, what my
              defenses actually caught and what slipped past.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.26, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
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
