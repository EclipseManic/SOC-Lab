import { motion, useReducedMotion } from "motion/react";
import {
  Archive,
  ArrowRight,
  FileText,
  FolderSearch,
  Map,
  Radar,
  Swords,
} from "lucide-react";
import { chapters, stages, verifiedCount } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const chapterIcons = [Map, Swords, Radar, FolderSearch, FileText, Archive];

const metrics: Record<string, string> = {
  "01": "documented",
  "02": `${stages.length} stages`,
  "03": `${verifiedCount} / ${stages.length} verified`,
  "04": "3 cases",
  "05": "6 docs · draft",
  "06": "ledger",
};

function ChapterSpine() {
  return (
    <Card className="relative overflow-hidden p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-teal/10 to-transparent"
        aria-hidden="true"
      />
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
            Case file / SOC-LAB-001
          </p>
          <p className="mt-1 text-sm font-medium text-ink">Reading order</p>
        </div>
        <Badge tone="amber" className="shrink-0 whitespace-nowrap">
          <span className="sm:hidden">In progress</span>
          <span className="hidden sm:inline">Record in progress</span>
        </Badge>
      </div>

      <ol className="relative mt-2" aria-label="Six chapters in reading order">
        <div
          className="absolute bottom-5 left-[17px] top-5 w-px bg-gradient-to-b from-teal/50 via-blue/30 to-line/20"
          aria-hidden="true"
        />
        {chapters.map((chapter, index) => {
          const Icon = chapterIcons[index] ?? Map;
          return (
            <motion.li
              key={chapter.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + index * 0.06, duration: 0.35 }}
              className="relative"
            >
              <a
                href={`#${chapter.id}`}
                className="group flex items-center gap-3 rounded-xl px-1.5 py-2.5 transition hover:bg-panel-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-canvas text-faint transition group-hover:border-teal/40 group-hover:text-teal">
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] text-teal">
                      {chapter.n}
                    </span>
                    <span className="truncate text-sm text-ink">
                      {chapter.title}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                    {metrics[chapter.n]}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint/50 transition group-hover:translate-x-0.5 group-hover:text-teal" aria-hidden="true" />
              </a>
            </motion.li>
          );
        })}
      </ol>

      <div className="relative mt-3 flex items-center gap-2 border-t border-line/70 pt-3 text-[11px] text-faint">
        <span className="h-1.5 w-1.5 rounded-full bg-amber" aria-hidden="true" />
        No live telemetry. This is a reading layer over the repository.
      </div>
    </Card>
  );
}

function StatusStrip() {
  const items = [
    { value: String(stages.length), label: "stages documented", tone: "text-ink" },
    { value: String(verifiedCount), label: "detections verified", tone: "text-amber" },
    { value: "3", label: "cases scaffolded", tone: "text-blue" },
    { value: "6", label: "report documents · draft", tone: "text-rose" },
  ];

  return (
    <div className="container-page mt-12 sm:mt-16">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line/80 bg-line/60 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="bg-panel/80 px-4 py-4 sm:px-5">
            <div className={`font-mono text-2xl font-semibold tracking-[-0.04em] ${item.tone}`}>
              {item.value}
            </div>
            <div className="mt-1 text-[11px] leading-4 text-faint">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-12 sm:pb-24 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-60" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-teal/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 top-24 h-[360px] w-[360px] rounded-full bg-blue/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-page relative grid items-center gap-12 xl:grid-cols-[1.2fr_0.8fr] xl:gap-12 2xl:gap-16">
        <div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap items-center gap-3"
          >
            <Badge tone="teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
              Authorized lab
            </Badge>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              Active Directory · Suricata · Wazuh · TheHive
            </span>
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06 }}
            className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.03] tracking-[-0.045em] text-ink sm:text-5xl xl:text-[3.5rem]"
          >
            One intrusion.
            <br />
            Told in the order a
            <br />
            <span className="relative whitespace-nowrap text-teal">
              defender
              <span className="absolute -bottom-1 left-0 h-px w-full bg-teal/40" aria-hidden="true" />
            </span>{" "}
            has to{" "}
            <br className="sm:hidden" />
            prove it.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8"
          >
            A 20-stage Active Directory campaign, the telemetry it should have
            left, and the case record built from both. Nothing is marked
            detected until a rule fires and the alert is actionable.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Button asChild size="lg">
              <a href="#attack">
                Follow the campaign
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="#evidence">Read the evidence status</a>
            </Button>
          </motion.div>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.26 }}
            className="mt-5 max-w-lg text-xs leading-5 text-faint"
          >
            Same record, three lenses: executive risk, technical mechanism, or
            hiring evidence. Switch the lens in the header; the facts do not
            change.
          </motion.p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.18 }}
        >
          <ChapterSpine />
        </motion.div>
      </div>

      <StatusStrip />
    </section>
  );
}
