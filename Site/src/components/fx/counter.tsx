import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";
import { EASE } from "./reveal";
import { useBooted } from "@/lib/boot";

/** Counts from 0 to `to` once it scrolls into view and the boot overlay lifts. */
export function Counter({
  to,
  decimals = 0,
  duration = 1.5,
  prefix = "",
  suffix = "",
  group = false,
  className,
}: {
  to: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  group?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const booted = useBooted();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!booted || !inView) return;
    const controls = animate(0, to, {
      duration,
      ease: EASE as unknown as [number, number, number, number],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [booted, inView, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {group ? Math.round(value).toLocaleString() : value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
