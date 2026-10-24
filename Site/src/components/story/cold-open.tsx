import { motion, useReducedMotion } from "motion/react";
import { ArrowDown, ArrowUpRight, GitBranch, Radio } from "lucide-react";
import { repoUrl } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fileMetrics = [
  { value: "20", label: "attack stages" },
  { value: "16", label: "verified detections" },
  { value: "1", label: "named blind spot" },
  { value: "0", label: "unearned claims" },
];

export function ColdOpen() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-line/60"
    >
      <div
        className="hero-grid pointer-events-none absolute inset-0 opacity-55"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-48 top-0 h-[520px] w-[520px] rounded-full bg-teal/10 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-28 h-[440px] w-[440px] rounded-full bg-blue/10 blur-[140px]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -right-6 top-24 select-none font-mono text-[24vw] font-semibold leading-none tracking-[-0.08em] text-ink/[0.028]"
        aria-hidden="true"
      >
        001
      </span>

      <div className="container-page relative flex min-h-[calc(100svh-72px)] flex-col justify-between py-10 sm:py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <Badge tone="teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
            Case file / SOC-LAB-001
          </Badge>
          <p className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
            <Radio className="h-3 w-3 text-teal/70" aria-hidden="true" />
            Authorized lab · no live telemetry
          </p>
        </motion.div>

        <div className="grid gap-12 py-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:items-end lg:gap-16 lg:py-16">
          <div>
            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="max-w-xl font-mono text-[10px] uppercase tracking-[0.18em] text-faint"
            >
              A home SOC lab, reconstructed from the wire.
            </motion.p>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-ink sm:text-6xl lg:text-7xl xl:text-[6.4rem]"
            >
              The intrusion
              <br />
              is only half
              <br />
              <span className="text-teal">the story.</span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
            >
              A 20-stage Active Directory campaign, the telemetry it should have
              left, and the case record that has to earn every claim.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg">
                <a href="#build">
                  Trace the build
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <a href={repoUrl} target="_blank" rel="noreferrer">
                  <GitBranch className="h-4 w-4" aria-hidden="true" />
                  Open the record
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="border-t border-line/70 pt-6 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              The file so far
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-1">
              {fileMetrics.map((metric) => (
                <div key={metric.label}>
                  <dt className="font-mono text-2xl font-semibold tracking-[-0.04em] text-ink">
                    {metric.value}
                  </dt>
                  <dd className="mt-1 text-xs leading-5 text-faint">
                    {metric.label}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 border-t border-line/60 pt-4 text-xs leading-5 text-faint">
              Six acts, one record. The open states stay open.
            </p>
          </motion.div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line/60 pt-4">
          <a
            href="#lab"
            className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-faint transition hover:text-teal"
          >
            Begin at the boundary
            <ArrowDown
              className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5"
              aria-hidden="true"
            />
          </a>
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.18em] text-faint/70 sm:block">
            Scroll to trace
          </span>
        </div>
      </div>
    </section>
  );
}
