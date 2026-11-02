import type { ReactNode } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageStatus } from "@/data";
import { Reveal } from "@/components/fx/reveal";

export const statusTone: Record<StageStatus, string> = {
  Detected: "border-ok/40 bg-ok-soft text-ok",
  "Logging gap": "border-accent/40 bg-accent-soft text-accent",
  "Detection gap": "border-accent/40 bg-accent-soft text-accent",
  "Rule failure": "border-hot/40 bg-hot-soft text-hot",
  "Not tested": "border-rule bg-paper-3 text-muted",
};

export const statusDot: Record<StageStatus, string> = {
  Detected: "bg-ok",
  "Logging gap": "bg-accent",
  "Detection gap": "bg-accent",
  "Rule failure": "bg-hot",
  "Not tested": "bg-muted",
};

export function StatusPill({ status, className }: { status: StageStatus; className?: string }) {
  return (
    <span className={cn("chip", statusTone[status], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {status}
    </span>
  );
}

/** Big plain-language section head. */
export function SectionHead({
  index,
  kicker,
  title,
  lede,
}: {
  index?: string;
  kicker?: string;
  title: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <div className="max-w-3xl">
      {(index || kicker) && (
        <Reveal>
          <div className="mb-5 flex items-center gap-3">
            {index && (
              <span className="chip border-accent/40 bg-accent-soft font-mono text-accent">{index}</span>
            )}
            {kicker && <span className="label">{kicker}</span>}
          </div>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-display-s text-ink sm:text-3xl">{title}</h2>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{lede}</p>
        </Reveal>
      )}
    </div>
  );
}

/** A prominent link back to the repository for depth. */
export function RepoLink({
  href,
  children,
  note,
}: {
  href: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-3 rounded-pill border border-rule-2 bg-paper-2/60 py-2 pl-4 pr-3 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <span>{children}</span>
      {note && <span className="hidden text-xs text-faint sm:inline">{note}</span>}
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rule bg-paper transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:border-accent">
        <ArrowUpRight className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}

/** A large card that points to a repo area ("go deeper"). */
export function DeepCard({
  n,
  title,
  body,
  href,
  tone = "cool",
}: {
  n: string;
  title: string;
  body: string;
  href: string;
  tone?: "accent" | "cool" | "violet" | "ok";
}) {
  const glow = {
    accent: "hover:shadow-glow-accent",
    cool: "hover:shadow-glow-cool",
    violet: "hover:shadow-glow-accent",
    ok: "hover:shadow-glow-cool",
  }[tone];
  const dot = { accent: "bg-accent", cool: "bg-cool", violet: "bg-violet", ok: "bg-ok" }[tone];
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group panel flex flex-col p-5 transition-all duration-300 hover:-translate-y-1 hover:border-rule-2",
        glow,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-faint">{n}</span>
        <span className={cn("h-2 w-2 rounded-full", dot)} />
      </div>
      <h3 className="mt-4 text-lg text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{body}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">
        Open in repository
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}

export { motion };
