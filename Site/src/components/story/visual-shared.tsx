import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StageStatus } from "@/data";

export const tone = {
  attacker: "#f2779a",
  defender: "#35e0c2",
  teal: "#35e0c2",
  cyan: "#00f0ff",
  gap: "#f2b84b",
  infrastructure: "#6aa8ff",
  emerald: "#30e080",
  slate: "#7f8fa6",
  faint: "#7f8fa6",
  ink: "#e7eef7",
  muted: "#9fb0c4",
  line: "#233044",
  panel: "#0b1220",
  canvas: "#060a11",
};

export function statusColor(status: StageStatus) {
  if (status === "Detected") return tone.defender;
  if (status === "Logging gap" || status === "Detection gap") return tone.gap;
  if (status === "Rule failure") return tone.attacker;
  return tone.slate;
}

export function StatusPill({ status, compact = false }: { status: StageStatus; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono uppercase tracking-[0.12em]",
        compact ? "text-[8px]" : "text-[9px]",
      )}
      style={{ borderColor: `${statusColor(status)}55`, color: statusColor(status), backgroundColor: `${statusColor(status)}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColor(status) }} aria-hidden="true" />
      {status}
    </span>
  );
}

export function AnatomyPlate({
  fig,
  title,
  hint,
  readout,
  children,
  className,
}: {
  fig: string;
  title: string;
  hint?: string;
  readout?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative rounded-2xl border border-line/90 bg-panel/75 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:p-6", className)}>
      <span className="plate-corner plate-corner-tl" aria-hidden="true" />
      <span className="plate-corner plate-corner-tr" aria-hidden="true" />
      <span className="plate-corner plate-corner-bl" aria-hidden="true" />
      <span className="plate-corner plate-corner-br" aria-hidden="true" />

      {/* Plate Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3 font-mono text-[9px] uppercase tracking-[0.18em]">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-sm bg-teal" aria-hidden="true" />
          <span className="font-semibold text-teal">{fig}</span>
          <span className="text-line">/</span>
          <span className="text-ink">{title}</span>
        </div>
        {readout && <span className="text-faint">{readout}</span>}
      </div>

      {/* Main Content Area */}
      <div className="relative mt-4">{children}</div>

      {/* Plate Footer Readout */}
      {hint && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3 font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
          <span>{hint}</span>
          <span className="text-[7.5px] tracking-[0.2em] text-teal/70">ANATOMY // REVEAL ENGINE</span>
        </div>
      )}
    </div>
  );
}

export function SectionKicker({ index, label, children }: { index: string; label: string; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-faint">
      <span className="text-teal">{index}</span>
      <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
      <span>{label}</span>
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, body, id }: { eyebrow: string; title: string; body: string; id?: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-end lg:gap-16">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">{eyebrow}</p>
        <h2 id={id} className="mt-4 max-w-[13ch] text-balance text-4xl font-semibold leading-[0.95] tracking-[-0.06em] text-ink sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{body}</p>
    </div>
  );
}

export function RepoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint transition hover:text-teal">
      {children}
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    </a>
  );
}

export function SceneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("relative overflow-hidden rounded-[1.75rem] border border-line/80 bg-panel/55 shadow-[0_24px_80px_rgba(0,0,0,0.24)]", className)}>{children}</div>;
}

export function SvgLabel({ x, y, children, anchor = "start" }: { x: number; y: number; children: ReactNode; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={tone.muted} fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.6">
      {children}
    </text>
  );
}

export function formatClock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `T0+${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
