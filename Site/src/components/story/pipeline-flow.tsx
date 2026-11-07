import { useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "steps" | "queue";
type Tone = "neutral" | "violet" | "ok";

const STEPS: Array<{ name: string; sub: string; tone: Tone; x: number; glance: string; does: string; why: string; ex: string }> = [
  {
    name: "Telemetry Ingestion",
    sub: "Logs + EVE JSON",
    tone: "neutral",
    x: 40,
    glance: "Continuous collection from all endpoints and network sensors.",
    does: "Endpoints (Windows Server, Windows 10, Ubuntu DVWA) and the Suricata gateway stream real-time events to the Wazuh Manager.",
    why: "Effective detection requires multi-layered visibility across both network flows and low-level host telemetry.",
    ex: "Suricata flags an inbound TCP port scan while Sysmon logs an abnormal process execution.",
  },
  {
    name: "Wazuh Rules Engine",
    sub: "Level 8+ Gate",
    tone: "violet",
    x: 163,
    glance: "Custom decoders and correlation rules score event severity.",
    does: "Wazuh normalizes unstructured logs, evaluates behavioral rules, and filters out benign baseline background noise.",
    why: "Prevents analyst fatigue by ensuring only high-severity, security-relevant anomalies (Level 8 and above) progress to incident response.",
    ex: "A web shell upload triggers custom Wazuh Rule 100199 at Severity Level 10.",
  },
  {
    name: "SQLite Queue",
    sub: "Local WAL Buffer",
    tone: "violet",
    x: 286,
    glance: "Sub-millisecond local buffering ensures zero alert loss.",
    does: "When Wazuh triggers an alert, the custom integration writes it immediately to a local SQLite database using Write-Ahead Logging (WAL).",
    why: "Local disk commits execute in under a millisecond, preventing Wazuh from blocking or dropping alerts during high-volume attack bursts.",
    ex: "Hundreds of rapid brute-force or port scan alerts are queued instantly without network latency.",
  },
  {
    name: "Flush Daemon",
    sub: "5-Sec Aggregation",
    tone: "violet",
    x: 409,
    glance: "Batch processing and deduplication daemon.",
    does: "A background systemd service wakes every 5 seconds, reads the SQLite queue, and consolidates repeated alerts by tool, target, and IP.",
    why: "Folds repetitive noisy bursts into a single cohesive alert summary, keeping incident tracking manageable.",
    ex: "300 individual web fuzzing hits are aggregated into one structured 'Directory Brute Force' event.",
  },
  {
    name: "TheHive 5 Case Platform",
    sub: "Alerts & Cases",
    tone: "ok",
    x: 532,
    glance: "Actionable alert delivery with MITRE ATT&CK context.",
    does: "Receives the deduplicated alert via REST API with pre-populated severity, tags, observables, and forensic artifacts.",
    why: "Enables SOC analysts to immediately validate evidence, track chain of custody, and open a full investigation case in one click.",
    ex: "The analyst reviews the consolidated alert and clicks 'Promote to Incident Case'.",
  },
];

const CAPTIONS = [
  ["Something odd", "happens"],
  ["Is it serious", "enough?"],
  ["Saved to disk", "instantly"],
  ["Groups repeats", "together"],
  ["Analyst sees", "1 clean alert"],
];

const TOOLS = {
  nmap: { label: "nmap: port scan", color: "var(--color-accent)", title: "Port scan detected" },
  sqlmap: { label: "sqlmap: SQL injection", color: "var(--color-hot)", title: "SQL injection attempt" },
  ffuf: { label: "ffuf: hidden page hunt", color: "var(--color-ember)", title: "Directory brute force" },
} as const;
type ToolKey = keyof typeof TOOLS;

type CaseItem = { id: number; key: ToolKey; n: number };
type Model = { queue: ToolKey[]; cases: CaseItem[]; t: number; seq: number };

const FLUSH_MS = 5000;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const glow = (on: boolean) => (on ? { filter: "drop-shadow(0 0 7px var(--color-accent))" } : undefined);

export function PipelineFlow() {
  const [mode, setMode] = useState<Mode>("steps");
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [touched, setTouched] = useState(false);
  const [model, setModel] = useState<Model>({ queue: [], cases: [], t: 0, seq: 0 });
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!playing || mode !== "steps") return;
    const id = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 500);
    return () => clearInterval(id);
  }, [playing, mode]);

  // While the tour is playing, hovering must not hijack the detail panel.
  useEffect(() => {
    if (playing) setHover(null);
  }, [playing]);

  useEffect(() => {
    if (mode !== "queue") return;
    const id = setInterval(() => {
      setModel((m) => {
        const t = m.t + 100;
        if (t < FLUSH_MS) return { ...m, t };
        if (!m.queue.length) return { ...m, t: 0 };
        const groups: Partial<Record<ToolKey, number>> = {};
        m.queue.forEach((k) => (groups[k] = (groups[k] ?? 0) + 1));
        const fresh: CaseItem[] = Object.entries(groups).map(([k, n], i) => ({
          id: m.seq + i,
          key: k as ToolKey,
          n: n as number,
        }));
        return { queue: [], cases: [...fresh, ...m.cases].slice(0, 4), t: 0, seq: m.seq + fresh.length };
      });
    }, 100);
    return () => clearInterval(id);
  }, [mode]);

  const burst = (key: ToolKey) => {
    setTouched(true);
    setModel((m) => {
      const n = 6 + Math.floor(Math.random() * 9);
      return { ...m, queue: [...m.queue, ...Array<ToolKey>(n).fill(key)] };
    });
  };

  const active = mode === "steps" ? step : -1;
  const hoverable = !playing;
  const hoverNow = hoverable ? hover : null;
  const shown = hoverNow ?? step;

  return (
    <div>
      <div className="mb-4 inline-flex gap-2">
        {(
          [
            ["steps", "Step-by-step flow"],
            ["queue", "Live queue demo"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              setPlaying(false);
            }}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-xs font-medium transition-colors",
              mode === id
                ? "border-accent/60 bg-accent-soft text-accent"
                : "border-rule text-muted hover:border-rule-2 hover:text-ink-2",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "steps" ? (
        <div>
          <p className="mb-2 text-xs text-muted">Follow one alert — from a suspicious event to a clean case in TheHive.</p>
          <div className="relative">
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <svg
                viewBox="0 0 680 215"
                className="mx-auto block h-auto w-full min-w-[600px] max-w-[680px] font-sans"
                role="img"
                aria-label="Pipeline: telemetry, Wazuh rules, SQLite queue, flush daemon, TheHive."
              >
                <rect x={150} y={40} width={373} height={150} rx={12} fill="none" stroke="var(--color-rule-2)" strokeWidth={0.5} strokeDasharray="4 4" />
                <text x={160} y={58} fontSize={11} fill="var(--color-muted)">
                  VM2 · Wazuh 10.122.1.4
                </text>
                <rect x={520} y={40} width={126} height={150} rx={12} fill="none" stroke="var(--color-rule-2)" strokeWidth={0.5} strokeDasharray="4 4" />
                <text x={530} y={58} fontSize={11} fill="var(--color-muted)">
                  VM1
                </text>

                <path d="M40 110 L640 110" fill="none" stroke="var(--color-rule-2)" strokeWidth={1} />
                {!reduced && (
                  <>
                    {[0, 1, 2, 3].map((i) => (
                      <circle key={i} r={4} fill="var(--color-accent)">
                        <animateMotion dur="4s" begin={`${i}s`} repeatCount="indefinite" path="M40 110 L640 110" />
                      </circle>
                    ))}
                  </>
                )}

                {STEPS.map((s, i) => {
                  const on = hoverNow === i || active === i;
                  const toneStroke =
                    s.tone === "ok" ? "var(--color-ok)" : s.tone === "violet" ? "var(--color-violet)" : "var(--color-rule)";
                  return (
                    <g
                      key={s.name}
                      className="cursor-pointer"
                      role="button"
                      tabIndex={0}
                      aria-label={s.name}
                      onMouseEnter={() => hoverable && setHover(i)}
                      onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                      onFocus={() => hoverable && setHover(i)}
                      onBlur={() => setHover((h) => (h === i ? null : h))}
                      onClick={() => {
                        setStep(i);
                        setPlaying(false);
                      }}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setStep(i)}
                    >
                      <rect
                        x={s.x}
                        y={80}
                        width={108}
                        height={60}
                        rx={8}
                        fill={s.tone === "neutral" ? "var(--color-paper-2)" : toneStroke}
                        fillOpacity={s.tone === "neutral" ? 1 : 0.12}
                        stroke={on ? "var(--color-accent)" : toneStroke}
                        strokeOpacity={on ? 1 : 0.6}
                        strokeWidth={on ? 2 : 1}
                        style={glow(on)}
                      />
                      <text x={s.x + 54} y={102} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-ink)">
                        {s.name}
                      </text>
                      <text x={s.x + 54} y={122} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                        {s.sub}
                      </text>
                      <circle cx={s.x} cy={80} r={11} fill="var(--color-paper-3)" stroke="var(--color-accent)" strokeWidth={1} />
                      <text x={s.x} y={84} textAnchor="middle" fontSize={11} fontWeight={500} fill="var(--color-accent)">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}

                {CAPTIONS.map((c, i) => (
                  <g key={i}>
                    <text x={STEPS[i].x + 54} y={162} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                      {c[0]}
                    </text>
                    <text x={STEPS[i].x + 54} y={178} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                      {c[1]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {hoverNow !== null && (
              <div
                className="pointer-events-none absolute z-20 w-max max-w-[220px] rounded-lg border border-accent/40 bg-paper px-3 py-2 text-[0.7rem] leading-snug text-ink-2 shadow-glow-cool"
                style={{
                  left: `${clamp(((STEPS[hoverNow].x + 54) / 680) * 100, 17, 83)}%`,
                  top: `${(74 / 215) * 100}%`,
                  transform: "translate(-50%, calc(-100% - 6px))",
                }}
              >
                <span className="font-medium text-ink">{STEPS[hoverNow].name}.</span> {STEPS[hoverNow].glance}
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="rounded-pill border border-accent/60 bg-accent-soft px-3.5 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent"
            >
              {playing ? "Pause tour" : "Play tour"}
            </button>
            <span className="text-xs text-muted">or hover / click any step</span>
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-card border border-rule bg-paper-3/60 px-4 py-3">
            <span
              className={cn(
                "mt-0.5 shrink-0 rounded-full border px-2 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider",
                hoverNow !== null ? "border-accent/50 text-accent" : "border-rule-2 text-faint",
              )}
            >
              {hoverNow !== null ? "hovering" : "pinned"}
            </span>
            <p className="text-xs leading-5 text-muted">
              <span className="font-medium text-ink-2">
                {shown + 1}. {STEPS[shown].name}
              </span>
              <br />
              <span className="font-medium text-ink-2">What it does:</span> {STEPS[shown].does}
              <br />
              <span className="font-medium text-ink-2">Why:</span> {STEPS[shown].why}
              <br />
              <span className="font-medium text-ink-2">Example:</span> {STEPS[shown].ex}
            </p>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={cn(
              "mb-4 rounded-card border px-4 py-3.5 transition-colors",
              touched ? "border-rule bg-paper-3/40" : "border-accent/45 bg-accent-soft/25",
            )}
          >
            <p className="mb-3 flex items-center gap-2 text-xs font-medium text-accent">
              <MousePointerClick className={cn("h-4 w-4", !touched && !reduced && "animate-bounce")} />
              Step 1 — press an attack to fill the queue
            </p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TOOLS) as ToolKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => burst(k)}
                  className={cn(
                    "rounded-pill border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    !touched && !reduced
                      ? "animate-cue border-accent/60 bg-accent-soft text-accent hover:border-accent"
                      : "border-rule text-ink-2 hover:border-rule-2 hover:text-ink",
                  )}
                >
                  {TOOLS[k].label}
                </button>
              ))}
            </div>
            {!touched && (
              <p className="mt-2 text-[0.7rem] text-muted">
                Nothing here yet — the queue, the flush bar and TheHive below all react to your click.
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div
              className={cn(
                "rounded-card border p-4 transition-colors",
                model.queue.length ? "border-accent/50 bg-accent-soft/20" : "border-rule bg-paper-3/60",
              )}
            >
              <h3 className="text-sm font-medium text-ink">2. Local SQLite Queue</h3>
              <p className="mt-1 text-xs text-muted">When Wazuh generates an alert, the integration first stores it in a local SQLite queue in sub-millisecond time.</p>
              <div className="mt-3 flex min-h-[30px] flex-wrap items-center gap-1">
                {model.queue.length === 0 ? (
                  <span className="text-[0.7rem] text-faint">empty — press an attack above</span>
                ) : (
                  model.queue.map((k, i) => (
                    <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: TOOLS[k].color }} />
                  ))
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-faint">
                {model.queue.length > 0 && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
                {model.queue.length} waiting in buffer
              </div>
            </div>

            <div className="rounded-card border border-rule bg-paper-3/60 p-4">
              <h3 className="text-sm font-medium text-ink">3. Background Flush Daemon</h3>
              <p className="mt-1 text-xs text-muted">A background process collects alerts in batches every 5 seconds, grouping duplicates to prevent alert fatigue.</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-rule/60">
                <div className="h-2 rounded-full bg-accent transition-[width] duration-100" style={{ width: `${(model.t / FLUSH_MS) * 100}%` }} />
              </div>
              <div className="mt-2 text-xs text-faint">Next batch dispatch in {Math.ceil((FLUSH_MS - model.t) / 1000)}s</div>
            </div>

            <div
              className={cn(
                "rounded-card border p-4 transition-colors",
                model.cases.length ? "border-ok/50 bg-ok-soft/20" : "border-rule bg-paper-3/60",
              )}
            >
              <h3 className="text-sm font-medium text-ink">4. TheHive 5 Cases</h3>
              <p className="mt-1 text-xs text-muted">The analyst receives clean, deduplicated incident cases enriched with MITRE ATT&CK tags and forensic artifacts.</p>
              <div className="mt-3 space-y-2">
                {model.cases.length === 0 ? (
                  <div className="text-xs text-faint">Nothing yet. Press a button above.</div>
                ) : (
                  model.cases.map((c) => (
                    <div key={c.id} className="border-b border-rule/60 pb-2 last:border-0 last:pb-0">
                      <div className="text-xs font-medium text-ink">{TOOLS[c.key].title}</div>
                      <div className="text-xs text-muted">consolidated from {c.n} raw alerts</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
            {(Object.keys(TOOLS) as ToolKey[]).map((k) => (
              <span key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: TOOLS[k].color }} />
                {k} alert
              </span>
            ))}
            <span>Each square represents one raw telemetry event.</span>
          </div>

          <p className="mt-3 rounded-card border border-rule bg-paper-3/60 px-4 py-3 text-xs leading-5 text-muted">
            <span className="font-medium text-ink-2">Why a decoupled queue architecture?</span> Directly pushing every
            alert over the network to TheHive's API would cause high latency and risk dropped alerts during massive attack
            bursts (like an Nmap scan or directory fuzzing). By committing alerts to local SQLite storage first, Wazuh
            acknowledges events in sub-millisecond time. The background flush daemon then batches and forwards them reliably,
            ensuring zero alert loss while keeping cases clean and actionable for the SOC analyst.
          </p>
        </div>
      )}
    </div>
  );
}
