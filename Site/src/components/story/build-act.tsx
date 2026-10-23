import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

type BuildTone = "teal" | "amber";
type NodeState = "idle" | "visited" | "active";

interface BuildStep {
  n: string;
  label: string;
  title: string;
  body: string;
  meta: string;
  tone: BuildTone;
}

const buildSteps: BuildStep[] = [
  {
    n: "01",
    label: "Attack plane",
    title: "Start outside.",
    body: "Kali sits on an isolated NAT segment with the tools and the intent. It can reach the lab; it cannot see the SOC.",
    meta: "Kali · 192.168.232.135",
    tone: "teal",
  },
  {
    n: "02",
    label: "Boundary",
    title: "Cross the gateway.",
    body: "Suricata routes the path from attack to victim and writes the flow record. One public port opens the tunnel; everything else stays private.",
    meta: "Suricata · .232.162 → .56.150",
    tone: "teal",
  },
  {
    n: "03",
    label: "Victim plane",
    title: "Enter the range.",
    body: "The domain controller, the Windows workstation, and DVWA share one subnet. The attacker only needs one way in.",
    meta: "192.168.56.0/24",
    tone: "teal",
  },
  {
    n: "04",
    label: "SOC plane",
    title: "Follow the signal inward.",
    body: "Wazuh collects host telemetry; TheHive turns an alert into a case. The path is private, reached over WireGuard.",
    meta: "Wazuh → TheHive · 10.122.0.0/16",
    tone: "teal",
  },
  {
    n: "05",
    label: "Blind spot",
    title: "Name what the wire cannot see.",
    body: "Traffic between victims never crosses Suricata. If the story stays inside 192.168.56.0/24, host telemetry has to carry it.",
    meta: "Visibility boundary · documented",
    tone: "amber",
  },
];

function BuildLedger() {
  return (
    <div className="container-page py-20 sm:py-24">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
          Act II / The build
        </span>
        <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
          02 of 06
        </span>
      </div>

      <h2 className="mt-8 max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl">
        Follow the signal.
      </h2>
      <p className="mt-4 max-w-xl text-base leading-7 text-muted">
        The lab is assembled as a path, not a diagram. Each segment adds a place
        to look — and a limit on what can be seen.
      </p>

      <ol className="mt-12">
        {buildSteps.map((step) => {
          const amber = step.tone === "amber";
          return (
            <li
              key={step.n}
              className="relative border-l border-line/80 pb-10 pl-6 last:pb-0"
            >
              <span
                className={cn(
                  "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border bg-canvas",
                  amber ? "border-amber/70" : "border-teal/70",
                )}
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-baseline gap-3">
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    amber ? "text-amber" : "text-teal",
                  )}
                >
                  {step.n}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  {step.label}
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                {step.body}
              </p>
              <p
                className={cn(
                  "mt-3 font-mono text-[10px] tracking-[0.04em]",
                  amber ? "text-amber" : "text-teal",
                )}
              >
                {step.meta}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function nodeState(step: number, nodeStep: number): NodeState {
  if (step === nodeStep) return "active";
  if (step > nodeStep) return "visited";
  return "idle";
}

function MapNode({
  x,
  y,
  label,
  meta,
  state,
  placement = "bottom",
  tone = "teal",
}: {
  x: number;
  y: number;
  label: string;
  meta: string;
  state: NodeState;
  placement?: "bottom" | "right";
  tone?: BuildTone;
}) {
  const amber = tone === "amber";
  const lit = state !== "idle";
  const current = state === "active";
  const rightAligned = placement === "right";

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={cn(
          "block h-2.5 w-2.5 rounded-full border transition-all duration-500",
          lit
            ? amber
              ? "border-amber/80 bg-amber/75"
              : "border-teal/80 bg-teal/75"
            : "border-line bg-canvas",
          current &&
            (amber
              ? "shadow-[0_0_18px_rgba(242,184,75,0.75)]"
              : "shadow-[0_0_18px_rgba(53,224,194,0.75)]"),
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute transition-opacity duration-500",
          rightAligned
            ? "left-3 top-1/2 w-[104px] -translate-y-1/2 bg-gradient-to-r from-canvas via-canvas/85 to-transparent py-0.5 pl-1 pr-2 text-left"
            : "left-1/2 top-4 w-32 -translate-x-1/2 px-1 text-center",
          current ? "opacity-100" : lit ? "opacity-80" : "opacity-50",
        )}
      >
        <p
          className={cn(
            "font-mono uppercase tracking-[0.13em] text-ink",
            rightAligned ? "text-[9px]" : "text-[10px]",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 font-mono leading-4 text-faint",
            rightAligned ? "text-[8px]" : "text-[9px]",
          )}
        >
          {meta}
        </p>
      </div>
    </div>
  );
}

function SignalMap({
  progress,
  activeStep,
}: {
  progress: MotionValue<number>;
  activeStep: number;
}) {
  const lineProgress = useTransform(
    progress,
    [0.02, 0.2, 0.4, 0.6, 0.8],
    [0.02, 0.3, 0.57, 0.9, 1],
  );
  const pulseX = useTransform(
    progress,
    [0, 0.18, 0.38, 0.58, 0.74, 0.9],
    [115, 290, 430, 540, 540, 540],
  );
  const pulseY = useTransform(
    progress,
    [0, 0.18, 0.38, 0.58, 0.74, 0.9],
    [240, 240, 240, 240, 240, 240],
  );
  const pulseOpacity = useTransform(progress, [0.52, 0.62], [1, 0]);
  const blindOpacity = useTransform(progress, [0.78, 0.88], [0, 1]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-line/70 bg-panel/35">
      <div
        className="hero-grid pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
      />
      <div className="relative p-3 sm:p-4">
        <div
          className="relative aspect-[1000/480] w-full"
          role="img"
          aria-label="Full lab topology: Kali on the attack network, the Suricata gateway, the victim subnet with the domain controller, Windows 10 and DVWA, a WireGuard tunnel to the TheHive automation VM, VNet peering to the Wazuh VM, and a single public WireGuard ingress."
        >
          <div
            className="pointer-events-none absolute inset-y-[12%] left-[20%] w-px bg-line/35"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-[12%] left-[41.5%] w-px bg-line/35"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-y-[12%] left-[67%] w-px bg-line/35"
            aria-hidden="true"
          />

          <div className="absolute left-[11.5%] top-[5%] -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.15em] text-faint">
            Attack
          </div>
          <div className="absolute left-[29%] top-[5%] -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.15em] text-faint">
            Boundary
          </div>
          <div className="absolute left-[54%] top-[5%] -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.15em] text-faint">
            Victim · .56.0/24
          </div>
          <div className="absolute left-[80%] top-[5%] -translate-x-1/2 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.15em] text-faint">
            Cloud SOC · 10.122/16
          </div>

          <svg
            viewBox="0 0 1000 480"
            className="absolute inset-0 h-full w-full"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="signal-line"
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#35e0c2" />
                <stop offset="100%" stopColor="#6aa8ff" />
              </linearGradient>
            </defs>

            <path
              d="M 115 240 L 290 240 L 430 240"
              stroke="rgba(159,176,196,0.38)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 430 140 L 430 340 M 430 140 L 540 140 M 430 240 L 540 240 M 430 340 L 540 340"
              stroke="rgba(159,176,196,0.34)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M 800 180 L 800 340"
              stroke="rgba(106,168,255,0.42)"
              strokeWidth="1.5"
              strokeDasharray="5 6"
            />
            <path
              d="M 290 240 C 360 30 640 30 800 180"
              stroke="rgba(106,168,255,0.42)"
              strokeWidth="1.5"
              strokeDasharray="5 6"
            />
            <path
              d="M 915 100 L 800 180"
              stroke="rgba(106,168,255,0.42)"
              strokeWidth="1.5"
              strokeDasharray="2 5"
            />

            <motion.path
              d="M 115 240 L 290 240 L 430 240 L 540 240"
              stroke="url(#signal-line)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength: lineProgress }}
            />
            <motion.path
              d="M 430 240 L 430 140 L 540 140"
              stroke="url(#signal-line)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength: lineProgress }}
            />
            <motion.path
              d="M 430 240 L 430 340 L 540 340"
              stroke="url(#signal-line)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pathLength: lineProgress }}
            />

            <motion.path
              d="M 430 372 L 430 390 L 540 390 L 540 372"
              stroke="#f2b84b"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              style={{ opacity: blindOpacity }}
            />

            <circle
              cx="915"
              cy="100"
              r="3.5"
              fill="#070b10"
              stroke="#6aa8ff"
              strokeWidth="1.5"
            />

            <motion.circle
              r="5"
              fill="#35e0c2"
              cx={pulseX}
              cy={pulseY}
              style={{ opacity: pulseOpacity }}
            />
          </svg>

          <div className="absolute left-[55%] top-[13%] w-40 -translate-x-1/2 rounded-full border border-blue/20 bg-canvas/90 px-2 py-1 text-center">
            <p className="font-mono text-[7px] uppercase tracking-[0.13em] text-blue">
              WireGuard · 10.8.0.0/24
            </p>
          </div>
          <div className="absolute left-[80%] top-[54%] -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap bg-canvas/90 px-1 font-mono text-[6px] uppercase tracking-[0.14em] text-blue/70">
            VNet peering
          </div>
          <div className="absolute left-[90.5%] top-[8.5%] w-24 -translate-x-1/2 text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-blue">
              Internet
            </p>
            <p className="mt-0.5 font-mono text-[6px] uppercase tracking-[0.1em] text-faint">
              51820/UDP only
            </p>
          </div>
          <motion.div
            style={{ opacity: blindOpacity }}
            className="absolute left-[48.5%] top-[82.5%] -translate-x-1/2 font-mono text-[7px] uppercase tracking-[0.13em] text-amber"
          >
            host ↔ host
          </motion.div>

          <MapNode
            x={11.5}
            y={50}
            label="Kali"
            meta="192.168.232.135 / VMnet8 NAT"
            state={nodeState(activeStep, 0)}
          />
          <MapNode
            x={29}
            y={50}
            label="Suricata gateway"
            meta="eth0 .232.162 · eth1 .56.150 · wg0 10.8.0.2"
            state={nodeState(activeStep, 1)}
          />
          <MapNode
            x={54}
            y={29}
            label="Domain controller"
            meta="192.168.56.10 · ad.lab"
            placement="right"
            state={nodeState(activeStep, 2)}
          />
          <MapNode
            x={54}
            y={50}
            label="Windows 10"
            meta="192.168.56.20"
            placement="right"
            state={nodeState(activeStep, 2)}
          />
          <MapNode
            x={54}
            y={71}
            label="DVWA"
            meta="192.168.56.30"
            placement="right"
            state={nodeState(activeStep, 2)}
          />
          <MapNode
            x={80}
            y={37.5}
            label="TheHive / automation"
            meta="10.8.0.1 hub · TheHive · NPM · Velociraptor · thecustomhive · analyst VPN"
            placement="right"
            state={nodeState(activeStep, 3)}
          />
          <MapNode
            x={80}
            y={71}
            label="Wazuh"
            meta="manager · indexer · dashboard · private VNet only"
            placement="right"
            state={nodeState(activeStep, 3)}
          />
        </div>

        <div className="mt-1 flex justify-center">
          <motion.span
            style={{ opacity: blindOpacity }}
            className="rounded-full border border-amber/25 bg-amber/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-amber"
          >
            Same-subnet / not on the wire
          </motion.span>
        </div>

        <div className="mt-2 flex items-center justify-between border-t border-line/60 pt-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-faint">
            Full lab topology
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-faint">
            Case file / SOC-LAB-001
          </span>
        </div>
      </div>
    </div>
  );
}

function ScrollBuild() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const [activeStep, setActiveStep] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const next = Math.min(
      buildSteps.length - 1,
      Math.max(0, Math.floor(latest * buildSteps.length)),
    );
    setActiveStep((previous) => (previous === next ? previous : next));
  });

  const step = buildSteps[activeStep];
  const amber = step.tone === "amber";

  return (
    <section
      ref={sectionRef}
      id="build"
      aria-label="Act II: The build"
      className="relative border-b border-line/60"
    >
      <div className="hidden lg:block lg:h-[460vh]">
        <div className="sticky top-[72px] flex h-[calc(100svh-72px)] flex-col overflow-hidden">
          <div className="container-page flex h-full flex-col py-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
                    Act II / The build
                  </span>
                  <span className="h-px w-10 bg-line" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">
                  Follow the signal.
                </h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  Scroll to trace
                </p>
                <p className="mt-1 font-mono text-[9px] tracking-[0.01em] text-teal">
                  {step.n} / 05
                </p>
              </div>
            </div>

            <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] lg:items-center xl:grid-cols-[minmax(0,0.56fr)_minmax(0,1.44fr)] xl:gap-10">
              <div className="order-2 lg:order-1">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      amber ? "text-amber" : "text-teal",
                    )}
                  >
                    {step.n}
                  </span>
                  <span className="h-px w-8 bg-line" aria-hidden="true" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                    {step.label}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="mt-4"
                  >
                    <h3 className="max-w-md text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink xl:text-5xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-md text-sm leading-6 text-muted xl:text-base xl:leading-7">
                      {step.body}
                    </p>
                    <p
                      className={cn(
                        "mt-5 font-mono text-[10px] tracking-[0.04em]",
                        amber ? "text-amber" : "text-teal",
                      )}
                    >
                      {step.meta}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-8 flex gap-1.5" aria-hidden="true">
                  {buildSteps.map((item, index) => (
                    <span
                      key={item.n}
                      className={cn(
                        "h-1 rounded-full transition-all duration-300",
                        index === activeStep
                          ? "w-10 bg-teal"
                          : index < activeStep
                            ? "w-5 bg-teal/40"
                            : "w-5 bg-line",
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <SignalMap progress={scrollYProgress} activeStep={activeStep} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line/60 pt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                The wire is not the whole record
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
                Act II of VI
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <BuildLedger />
      </div>
    </section>
  );
}

export function BuildAct() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <section
        id="build"
        aria-label="Act II: The build"
        className="relative border-b border-line/60"
      >
        <BuildLedger />
      </section>
    );
  }

  return <ScrollBuild />;
}
