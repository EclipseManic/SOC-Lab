import { lazy, Suspense, useEffect } from "react";
import { VisualFooter, VisualNav } from "@/components/story/visual-shell";
import { markBooted } from "@/lib/boot";

const loadHero = () => import("@/components/story/visual-hero");
const loadSetup = () => import("@/components/story/visual-setup");
const loadAttack = () => import("@/components/story/visual-attack");
const loadDetection = () => import("@/components/story/visual-detection");
const loadInvestigation = () => import("@/components/story/visual-investigation");
const loadResponse = () => import("@/components/story/visual-response");
const loadPostMortem = () => import("@/components/story/visual-postmortem");
const loadSignal = () => import("@/components/story/visual-signal");
const loadRecord = () => import("@/components/story/visual-record");

const loaders = [
  loadHero,
  loadSetup,
  loadAttack,
  loadDetection,
  loadInvestigation,
  loadResponse,
  loadPostMortem,
  loadSignal,
  loadRecord,
];

const VisualHero = lazy(() => loadHero().then((m) => ({ default: m.VisualHero })));
const VisualSetup = lazy(() => loadSetup().then((m) => ({ default: m.VisualSetup })));
const VisualAttack = lazy(() => loadAttack().then((m) => ({ default: m.VisualAttack })));
const VisualDetection = lazy(() => loadDetection().then((m) => ({ default: m.VisualDetection })));
const VisualInvestigation = lazy(() =>
  loadInvestigation().then((m) => ({ default: m.VisualInvestigation })),
);
const VisualResponse = lazy(() =>
  loadResponse().then((m) => ({ default: m.VisualResponse })),
);
const VisualPostMortem = lazy(() =>
  loadPostMortem().then((m) => ({ default: m.VisualPostMortem })),
);
const VisualSignal = lazy(() => loadSignal().then((m) => ({ default: m.VisualSignal })));
const VisualRecord = lazy(() => loadRecord().then((m) => ({ default: m.VisualRecord })));

function ActFallback() {
  return (
    <div className="container-page flex min-h-40 items-center justify-center text-sm text-faint">
      Loading...
    </div>
  );
}

/**
 * Keeps the boot overlay up until every act has loaded and the webfonts are
 * ready, then lifts it. Because the entrance animations are gated on the boot
 * state, the first thing a visitor sees is the page animating in — never a
 * half-built layout or a lazy chunk popping in on its own.
 */
function useBootSequence() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A reload must land at the top of the story, never mid-page.
    if (!window.location.hash) window.scrollTo(0, 0);

    let cancelled = false;
    const startedAt = performance.now();

    // Resolve the same chunks the lazy acts request, so nothing is still
    // pending when the overlay lifts.
    const chunks = Promise.allSettled(loaders.map((load) => load()));

    // Cap how long we wait for webfonts; a slow font CDN must not stall the page.
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const fontsCapped = Promise.race([
      fontsReady.then(
        () => undefined,
        () => undefined,
      ),
      new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
    ]);

    Promise.all([chunks, fontsCapped]).then(() => {
      if (cancelled) return;
      // Hold the overlay for a beat so the fade reads as deliberate, not a blink.
      const held = performance.now() - startedAt;
      const wait = reduce ? 0 : Math.max(0, 520 - held);
      window.setTimeout(() => {
        if (!cancelled) markBooted();
      }, wait);
    });

    return () => {
      cancelled = true;
    };
  }, []);
}

export function App() {
  useBootSequence();

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
          <VisualResponse />
          <VisualPostMortem />
          <VisualSignal />
          <VisualRecord />
        </Suspense>
      </main>
      <VisualFooter />
    </div>
  );
}
