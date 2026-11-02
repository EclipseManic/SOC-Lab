import { lazy, Suspense } from "react";
import { VisualFooter, VisualNav } from "@/components/story/visual-shell";

const VisualHero = lazy(() =>
  import("@/components/story/visual-hero").then((m) => ({ default: m.VisualHero })),
);
const VisualSetup = lazy(() =>
  import("@/components/story/visual-setup").then((m) => ({ default: m.VisualSetup })),
);
const VisualAttack = lazy(() =>
  import("@/components/story/visual-attack").then((m) => ({ default: m.VisualAttack })),
);
const VisualDetection = lazy(() =>
  import("@/components/story/visual-detection").then((m) => ({ default: m.VisualDetection })),
);
const VisualInvestigation = lazy(() =>
  import("@/components/story/visual-investigation").then((m) => ({ default: m.VisualInvestigation })),
);
const VisualSignal = lazy(() =>
  import("@/components/story/visual-signal").then((m) => ({ default: m.VisualSignal })),
);
const VisualRecord = lazy(() =>
  import("@/components/story/visual-record").then((m) => ({ default: m.VisualRecord })),
);

function ActFallback() {
  return (
    <div className="container-page flex min-h-40 items-center justify-center text-sm text-faint">
      Loading...
    </div>
  );
}

export function App() {
  return (
    <div className="min-h-screen">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <VisualNav />
      <main id="main">
        <Suspense fallback={<ActFallback />}>
          <VisualHero />
          <VisualSetup />
          <VisualAttack />
          <VisualDetection />
          <VisualInvestigation />
          <VisualSignal />
          <VisualRecord />
        </Suspense>
      </main>
      <VisualFooter />
    </div>
  );
}
