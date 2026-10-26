import { lazy, Suspense } from "react";
import { VisualFooter, VisualNav } from "@/components/story/visual-shell";

const VisualHero = lazy(() => import("@/components/story/visual-hero").then((module) => ({ default: module.VisualHero })));
const VisualLab = lazy(() => import("@/components/story/visual-lab").then((module) => ({ default: module.VisualLab })));
const VisualAttack = lazy(() => import("@/components/story/visual-attack").then((module) => ({ default: module.VisualAttack })));
const VisualSignal = lazy(() => import("@/components/story/visual-signal").then((module) => ({ default: module.VisualSignal })));
const VisualCase = lazy(() => import("@/components/story/visual-case").then((module) => ({ default: module.VisualCase })));
const VisualRecord = lazy(() => import("@/components/story/visual-record").then((module) => ({ default: module.VisualRecord })));

function ActFallback() {
  return <div className="container-page flex min-h-40 items-center justify-center border-b border-line/70 font-mono text-[9px] uppercase tracking-[0.16em] text-faint">Loading scene…</div>;
}

export function App() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <a href="#main" className="skip-link">Skip to content</a>
      <VisualNav />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<ActFallback />}><VisualHero /></Suspense>
        <Suspense fallback={<ActFallback />}><VisualLab /></Suspense>
        <Suspense fallback={<ActFallback />}><VisualAttack /></Suspense>
        <Suspense fallback={<ActFallback />}><VisualSignal /></Suspense>
        <Suspense fallback={<ActFallback />}><VisualCase /></Suspense>
        <Suspense fallback={<ActFallback />}><VisualRecord /></Suspense>
      </main>
      <VisualFooter />
    </div>
  );
}
