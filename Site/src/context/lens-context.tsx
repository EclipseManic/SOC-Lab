import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Lens } from "@/data";

const labels: Record<Lens, string> = {
  executive: "Executive",
  technical: "Technical",
  hiring: "Talent",
};

const descriptions: Record<Lens, string> = {
  executive: "Risk, control, and residual gap",
  technical: "Mechanism, telemetry, and evidence",
  hiring: "Scope, judgment, and shipped work",
};

interface LensContextValue {
  lens: Lens;
  setLens: (lens: Lens) => void;
  label: string;
  description: string;
}

const LensContext = createContext<LensContextValue | null>(null);

function readInitialLens(): Lens {
  if (typeof window === "undefined") return "technical";
  try {
    const stored = window.localStorage.getItem("soc-lab-lens");
    if (stored === "executive" || stored === "technical" || stored === "hiring") {
      return stored;
    }
  } catch {
    return "technical";
  }
  return "technical";
}

export function LensProvider({ children }: { children: ReactNode }) {
  const [lens, setLens] = useState<Lens>(readInitialLens);

  useEffect(() => {
    try {
      window.localStorage.setItem("soc-lab-lens", lens);
    } catch {}
  }, [lens]);

  const value = useMemo(
    () => ({
      lens,
      setLens,
      label: labels[lens],
      description: descriptions[lens],
    }),
    [lens],
  );

  return <LensContext.Provider value={value}>{children}</LensContext.Provider>;
}

export function useLens() {
  const value = useContext(LensContext);
  if (!value) throw new Error("useLens must be used within LensProvider");
  return value;
}

export { labels as lensLabels, descriptions as lensDescriptions };
