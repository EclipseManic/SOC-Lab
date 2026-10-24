import { useEffect, useRef, useState } from "react";
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

const palette = {
  teal: "#35e0c2",
  blue: "#6aa8ff",
  amber: "#f2b84b",
  ink: "#e7eef7",
  muted: "#9fb0c4",
  faint: "#7f8fa6",
  line: "#233044",
  panel: "#0b1220",
};

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
    body: "Kali sits on an isolated NAT segment with the tools and the intent. It can route toward the lab; it cannot reach the SOC directly.",
    meta: "Kali · 192.168.232.135/24 · gw .232.2",
    tone: "teal",
  },
  {
    n: "02",
    label: "Boundary",
    title: "Cross the gateway.",
    body: "A dual-NIC Suricata VM routes attack traffic from ens33 to ens37 and writes the flow record. One public port opens the tunnel; everything else stays private.",
    meta: "Suricata 8.0.6 · ens33 .232.162 → ens37 .56.150",
    tone: "teal",
  },
  {
    n: "03",
    label: "Victim plane",
    title: "Enter the range.",
    body: "The domain controller, Windows workstation, and DVWA share one L2 segment behind gateway .150. One way in; three places to move.",
    meta: ".56.0/24 · DC .10 · Win10 .20 · DVWA .30",
    tone: "teal",
  },
  {
    n: "04",
    label: "SOC plane",
    title: "Follow the signal inward.",
    body: "Agents ship host telemetry through the gateway and WireGuard to Wazuh. thecustomhive correlates the queue on the Wazuh VM, then pushes alerts to TheHive over VNet peering.",
    meta: "Wazuh + thecustomhive → TheHive · 10.122.0.0/16",
    tone: "teal",
  },
  {
    n: "05",
    label: "Visibility",
    title: "Name the edge of the record.",
    body: "The raw exports show Suricata alerting on routed attack traffic and on same-subnet moves observed on ens37. What the wire still cannot explain — process context, encrypted payload, offline action — has to come from host telemetry.",
    meta: "Observed visibility · raw alert exports",
    tone: "amber",
  },
];

const STEP_STARTS = [0, 0.18, 0.32, 0.54, 0.88] as const;

function stepIndexForProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  let active = 0;
  for (let index = 1; index < STEP_STARTS.length; index += 1) {
    if (progress >= STEP_STARTS[index]) active = index;
  }
  return active;
}

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

function SvgNode({
  x,
  y,
  w,
  h,
  label,
  lines,
  state,
  tone = "teal",
  compact = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  lines: string[];
  state: NodeState;
  tone?: BuildTone;
  compact?: boolean;
}) {
  const accent = tone === "amber" ? palette.amber : palette.teal;
  const lit = state !== "idle";
  const active = state === "active";
  const titleSize = compact ? 15 : 18;
  const lineSize = compact ? 12 : 13;

  return (
    <g>
      {active && (
        <rect
          x={x - 2}
          y={y - 2}
          width={w + 4}
          height={h + 4}
          rx={16}
          fill="none"
          stroke={accent}
          strokeOpacity="0.5"
          filter="url(#node-glow)"
        />
      )}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill={active ? "rgba(53,224,194,0.07)" : "rgba(11,18,32,0.9)"}
        stroke={lit ? accent : palette.line}
        strokeOpacity={active ? 0.9 : lit ? 0.45 : 0.8}
        strokeWidth={active ? 1.7 : 1}
      />
      <circle
        cx={x + 18}
        cy={y + (compact ? 18 : 22)}
        r={3.4}
        fill={lit ? accent : palette.line}
        opacity={lit ? 1 : 0.9}
      />
      <text
        x={x + 30}
        y={y + (compact ? 23 : 28)}
        fill={lit ? palette.ink : palette.muted}
        fontFamily="var(--font-sans)"
        fontSize={titleSize}
        fontWeight="600"
        letterSpacing="-0.2"
      >
        {label}
      </text>
      {lines.map((line, index) => (
        <text
          key={index}
          x={x + 16}
          y={y + (compact ? 43 : 52) + index * 18}
          fill={active ? palette.muted : palette.faint}
          fontFamily="var(--font-mono)"
          fontSize={lineSize}
          letterSpacing="0.1"
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function Trace({
  d,
  progress,
  input,
  color,
  width = 2.6,
  dashed = false,
}: {
  d: string;
  progress: MotionValue<number>;
  input: [number, number];
  color: string;
  width?: number;
  dashed?: boolean;
}) {
  const reveal = useTransform(progress, input, [0, 1]);

  return (
    <motion.path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? "6 8" : undefined}
      style={dashed ? { opacity: reveal } : { pathLength: reveal }}
    />
  );
}

function TravelPulse({
  progress,
  input,
  x,
  y,
  color,
  radius = 4.5,
}: {
  progress: MotionValue<number>;
  input: number[];
  x: number[];
  y: number[];
  color: string;
  radius?: number;
}) {
  const cx = useTransform(progress, input, x);
  const cy = useTransform(progress, input, y);
  const last = input[input.length - 1];
  const opacityInput =
    input.length >= 3
      ? [input[0], input[0] + 0.01, input[input.length - 2], last]
      : [input[0], input[0] + 0.01, last - 0.01, last];
  const opacity = useTransform(progress, opacityInput, [0, 1, 1, 0]);

  return (
    <g>
      <motion.circle
        r={radius + 6}
        fill="none"
        stroke={color}
        strokeOpacity="0.3"
        cx={cx}
        cy={cy}
        style={{ opacity }}
      />
      <motion.circle
        r={radius}
        fill={color}
        cx={cx}
        cy={cy}
        style={{ opacity }}
      />
    </g>
  );
}

function BuildStepStrip({
  step,
  activeStep,
}: {
  step: BuildStep;
  activeStep: number;
}) {
  const amber = step.tone === "amber";

  return (
    <div className="border-t border-line/60 bg-canvas/25 px-4 py-2.5 sm:px-5">
      <div className="grid gap-3 xl:grid-cols-[92px_minmax(0,1fr)_auto] xl:items-start xl:gap-6">
        <div className="flex items-baseline gap-2 xl:block">
          <span
            className={cn(
              "font-mono text-[10px]",
              amber ? "text-amber" : "text-teal",
            )}
          >
            {step.n}
          </span>
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.16em] text-faint xl:ml-0 xl:mt-1 xl:block">
            {step.label}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.n}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xl font-semibold leading-tight tracking-[-0.035em] text-ink">
              {step.title}
            </h3>
            <p className="mt-1 max-w-3xl text-sm leading-5 text-muted">
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col items-start gap-2 xl:items-end">
          <p
            className={cn(
              "font-mono text-[9px] tracking-[0.04em]",
              amber ? "text-amber" : "text-teal",
            )}
          >
            {step.meta}
          </p>
          <div className="flex gap-1.5" aria-hidden="true">
            {buildSteps.map((item, index) => (
              <span
                key={item.n}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  index === activeStep
                    ? amber
                      ? "w-10 bg-amber"
                      : "w-10 bg-teal"
                    : index < activeStep
                      ? amber
                        ? "w-5 bg-amber/40"
                        : "w-5 bg-teal/40"
                      : "w-5 bg-line",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalMap({
  progress,
  activeStep,
  step,
}: {
  progress: MotionValue<number>;
  activeStep: number;
  step: BuildStep;
}) {
  const observedOpacity = useTransform(progress, [0.88, 0.92], [0, 1]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-line/70 bg-panel/35">
      <div
        className="hero-grid pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
      />
      <div className="relative min-h-0 flex-1 p-2">
        <svg
          viewBox="0 0 1600 720"
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          role="img"
          aria-labelledby="build-map-title build-map-desc"
        >
          <title id="build-map-title">SOC lab topology</title>
          <desc id="build-map-desc">
            Kali on 192.168.232.135 routes through the Suricata gateway at
            192.168.232.162 and 192.168.56.150 into the victim L2 segment
            192.168.56.0/24, containing the domain controller at .10, Windows
            10 at .20, and DVWA at .30. Wazuh agents and the Suricata gateway
            reach the cloud SOC over WireGuard at 10.8.0.0/24. On the Wazuh VM,
            thecustomhive sends alerts to TheHive at 10.122.0.4:9000 over VNet
            peering. Only 51820/UDP is public.
          </desc>
          <defs>
            <filter
              id="node-glow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <text
            x="1568"
            y="36"
            textAnchor="end"
            fill={palette.faint}
            fontFamily="var(--font-mono)"
            fontSize="10.5"
            letterSpacing="1.8"
          >
            FULL LAB TOPOLOGY · SOC-LAB-001
          </text>

          <g>
            <rect
              x="32"
              y="64"
              width="260"
              height="590"
              rx="24"
              fill="rgba(11,18,32,0.28)"
              stroke="rgba(35,48,68,0.55)"
            />
            <rect
              x="312"
              y="64"
              width="310"
              height="590"
              rx="24"
              fill="rgba(11,18,32,0.28)"
              stroke="rgba(35,48,68,0.55)"
            />
            <rect
              x="642"
              y="64"
              width="570"
              height="590"
              rx="24"
              fill="rgba(11,18,32,0.28)"
              stroke="rgba(35,48,68,0.55)"
            />
            <rect
              x="1232"
              y="64"
              width="336"
              height="590"
              rx="24"
              fill="rgba(11,18,32,0.28)"
              stroke="rgba(35,48,68,0.55)"
            />
          </g>

          <g
            fill={palette.faint}
            fontFamily="var(--font-mono)"
            fontSize="12"
            letterSpacing="1.8"
          >
            <text x="50" y="94">
              ATTACK PLANE
            </text>
            <text x="330" y="94">
              BOUNDARY
            </text>
            <text x="660" y="94">
              VICTIM PLANE · .56.0/24
            </text>
            <text x="1250" y="94">
              CLOUD SOC · 10.122/16
            </text>
          </g>

          <g
            stroke="rgba(159,176,196,0.22)"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M 242 354 H 360" />
            <path d="M 580 354 H 700" />
            <path d="M 844 354 H 878 M 878 202 V 518 M 878 202 H 912 M 878 360 H 912 M 878 518 H 912" />
            <path
              d="M 580 320 C 800 140 1048 140 1264 295"
              strokeDasharray="6 8"
            />
            <path d="M 1400 168 V 230" strokeDasharray="5 7" />
            <path d="M 1470 360 V 450" strokeDasharray="4 6" />
            <path
              d="M 1536 634 H 1556 V 295 H 1536"
              strokeDasharray="5 7"
            />
            <path
              d="M 1112 518 C 1160 470 1160 250 1112 202"
              stroke={palette.amber}
              strokeOpacity="0.26"
              strokeDasharray="5 7"
            />
          </g>

          <Trace
            d="M 242 354 H 878 V 518 H 912"
            progress={progress}
            input={[0.02, 0.3]}
            color={palette.teal}
            width={3}
          />
          <Trace
            d="M 1112 518 C 1160 470 1160 250 1112 202"
            progress={progress}
            input={[0.32, 0.52]}
            color={palette.amber}
            width={2.2}
            dashed
          />
          <Trace
            d="M 844 362 H 580 C 800 150 1048 150 1264 300 M 1400 360 V 450"
            progress={progress}
            input={[0.54, 0.88]}
            color={palette.blue}
            width={2.4}
          />
          <Trace
            d="M 1320 450 V 360"
            progress={progress}
            input={[0.88, 0.94]}
            color={palette.teal}
            width={2.4}
          />
          <Trace
            d="M 1400 168 V 230"
            progress={progress}
            input={[0.94, 1]}
            color={palette.blue}
            width={2.2}
            dashed
          />
          <Trace
            d="M 1536 634 H 1556 V 295 H 1536"
            progress={progress}
            input={[0.9, 1]}
            color={palette.blue}
            width={1.8}
            dashed
          />

          <SvgNode
            x={82}
            y={308}
            w={160}
            h={92}
            label="Kali"
            lines={[".232.135 /24", "VMnet8 NAT"]}
            state={nodeState(activeStep, 0)}
          />
          <SvgNode
            x={360}
            y={246}
            w={220}
            h={210}
            label="Suricata gateway"
            lines={[
              "ens33 · .232.162",
              "ens37 · .56.150",
              "wg0 · 10.8.0.2",
              "inline IDS · 8.0.6",
            ]}
            state={nodeState(activeStep, 1)}
          />
          <SvgNode
            x={700}
            y={312}
            w={144}
            h={88}
            label="L2 segment"
            lines={[".56.0/24", "gw .150"]}
            state={nodeState(activeStep, 2)}
          />
          <SvgNode
            x={912}
            y={160}
            w={200}
            h={84}
            label="Domain controller"
            lines={[".10 · ad.lab", "Wazuh agent"]}
            state={nodeState(activeStep, 2)}
          />
          <SvgNode
            x={912}
            y={318}
            w={200}
            h={84}
            label="Windows 10"
            lines={[".20 · workstation", "Wazuh agent"]}
            state={nodeState(activeStep, 2)}
          />
          <SvgNode
            x={912}
            y={476}
            w={200}
            h={84}
            label="DVWA"
            lines={[".30 · pivot", "Wazuh agent"]}
            state={nodeState(activeStep, 2)}
          />
          <SvgNode
            x={1264}
            y={230}
            w={272}
            h={130}
            label="TheHive hub"
            lines={[
              "TheHive · NPM · Velociraptor",
              "WireGuard hub · 10.8.0.1",
              "analyst · 10.8.0.3",
            ]}
            state={nodeState(activeStep, 3)}
          />
          <SvgNode
            x={1264}
            y={450}
            w={272}
            h={130}
            label="Wazuh"
            lines={[
              "manager · indexer · dashboard",
              "1514 → TheHive 9000",
              "private VNet only",
            ]}
            state={nodeState(activeStep, 3)}
          />
          <SvgNode
            x={1264}
            y={110}
            w={272}
            h={58}
            label="Internet"
            lines={["one public port · 51820/UDP"]}
            state={nodeState(activeStep, 1)}
            compact
          />
          <SvgNode
            x={1264}
            y={598}
            w={272}
            h={48}
            label="Analyst VPN"
            lines={["10.8.0.3 · management only"]}
            state={nodeState(activeStep, 3)}
            compact
          />

          <g
            fill={palette.faint}
            fontFamily="var(--font-mono)"
            fontSize="11"
            letterSpacing="1"
          >
            <text x="286" y="342">
              ens33
            </text>
            <text x="626" y="342">
              ens37
            </text>
            <text x="900" y="128" fill={palette.blue}>
              wg0 · WireGuard · 10.8.0.0/24
            </text>
            <text x="1416" y="200" fill={palette.blue}>
              51820/UDP
            </text>
            <text x="1292" y="404" fill={palette.teal}>
              9000 / alerts
            </text>
            <text x="1416" y="404" fill={palette.blue}>
              VNet peering
            </text>
            <text x="1120" y="354" fill={palette.amber}>
              L2 pivot
            </text>
            <text x="1120" y="368" fill={palette.amber}>
              observed
            </text>
          </g>

          <g
            fill={palette.faint}
            fontFamily="var(--font-mono)"
            fontSize="10.5"
            letterSpacing="1.4"
          >
            <text x="48" y="620">
              NO DIRECT SOC PATH
            </text>
            <text x="328" y="620">
              INLINE IDS · AF_PACKET
            </text>
          </g>

          <motion.g style={{ opacity: observedOpacity }}>
            <rect
              x="662"
              y="596"
              width="356"
              height="34"
              rx="17"
              fill="rgba(242,184,75,0.08)"
              stroke="rgba(242,184,75,0.28)"
            />
            <circle cx="682" cy="613" r="3" fill={palette.amber} />
            <text
              x="694"
              y="617"
              fill={palette.amber}
              fontFamily="var(--font-mono)"
              fontSize="10.5"
              letterSpacing="0.9"
            >
              SAME-SUBNET ALERTS OBSERVED ON ENS37
            </text>
          </motion.g>

          <TravelPulse
            progress={progress}
            input={[0.02, 0.08, 0.16, 0.24, 0.3]}
            x={[200, 410, 700, 878, 912]}
            y={[354, 354, 354, 518, 518]}
            color={palette.teal}
          />
          <TravelPulse
            progress={progress}
            input={[0.32, 0.36, 0.42, 0.52]}
            x={[1112, 1160, 1160, 1112]}
            y={[518, 470, 250, 202]}
            color={palette.amber}
            radius={3.8}
          />
          <TravelPulse
            progress={progress}
            input={[0.54, 0.6, 0.68, 0.76, 0.84, 0.88]}
            x={[912, 878, 580, 900, 1264, 1400]}
            y={[360, 362, 362, 160, 300, 450]}
            color={palette.blue}
          />
          <TravelPulse
            progress={progress}
            input={[0.88, 0.94]}
            x={[1320, 1320]}
            y={[450, 360]}
            color={palette.teal}
            radius={3.8}
          />
          <TravelPulse
            progress={progress}
            input={[0.94, 1]}
            x={[1400, 1400]}
            y={[168, 230]}
            color={palette.blue}
            radius={3.8}
          />
        </svg>
      </div>

      <BuildStepStrip step={step} activeStep={activeStep} />
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
    const next = stepIndexForProgress(latest);
    setActiveStep((previous) => (previous === next ? previous : next));
  });

  const step = buildSteps[activeStep];

  return (
    <section
      ref={sectionRef}
      id="build"
      aria-label="Act II: The build"
      className="relative border-b border-line/60"
    >
      <div className="hidden xl:block xl:h-[460vh]">
        <div className="sr-only">
          <ol>
            {buildSteps.map((item) => (
              <li key={item.n}>
                {item.n} {item.label}: {item.title} {item.body} {item.meta}
              </li>
            ))}
          </ol>
        </div>
        <div className="sticky top-[72px] flex h-[calc(100svh-72px)] flex-col overflow-x-hidden overflow-y-auto">
          <div className="mx-auto flex h-full w-full max-w-[112rem] flex-col gap-2 px-4 py-3 sm:px-6 xl:py-4 2xl:max-w-[120rem] 2xl:px-8">
            <div className="flex shrink-0 items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
                    Act II / The build
                  </span>
                  <span className="h-px w-10 bg-line" aria-hidden="true" />
                </div>
                <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink">
                  Follow the signal.
                </h2>
              </div>
              <div className="text-right">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                  Scroll to trace
                </p>
                <p className="mt-1 font-mono text-[9px] tracking-[0.01em] text-teal">
                  {step.n} / {String(buildSteps.length).padStart(2, "0")}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1">
              <SignalMap
                progress={scrollYProgress}
                activeStep={activeStep}
                step={step}
              />
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-line/60 pt-2">
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

      <div className="xl:hidden">
        <BuildLedger />
      </div>
    </section>
  );
}

export function BuildAct() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (window.location.hash !== "#build") return;

    let frame = 0;
    const scrollToBuild = () => {
      document.getElementById("build")?.scrollIntoView({ block: "start" });
    };

    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(scrollToBuild);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

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
