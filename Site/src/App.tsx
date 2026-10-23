import { StoryHeader } from "@/components/story/story-header";
import { ColdOpen } from "@/components/story/cold-open";
import { LabAct } from "@/components/story/lab-act";
import { BuildAct } from "@/components/story/build-act";
import { AttackAct } from "@/components/story/attack-act";
import { SignalReveal } from "@/components/story/signal-reveal";
import { SignalAct } from "@/components/story/signal-act";
import { CaseAct } from "@/components/story/case-act";
import { RecordAct } from "@/components/story/record-act";
import { StoryFooter } from "@/components/story/story-footer";

export function App() {
  return (
    <div className="min-h-screen overflow-x-clip">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <StoryHeader />
      <main id="main" tabIndex={-1}>
        <ColdOpen />
        <LabAct />
        <BuildAct />
        <AttackAct />
        <SignalReveal />
        <SignalAct />
        <CaseAct />
        <RecordAct />
      </main>
      <StoryFooter />
    </div>
  );
}
