import { ArrowUpRight, Code } from "lucide-react";
import { metrics, repoUrl } from "@/data";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { DeepCard, RepoLink, SectionHead } from "./visual-shared";

const docs = [
  {
    n: "01",
    title: "Lab setup",
    body: "Every machine, subnet, and the encrypted tunnel that ties it together — with the exact routing.",
    href: `${repoUrl}/blob/main/01-Lab-Setup/README.md`,
    tone: "cool" as const,
  },
  {
    n: "02",
    title: "Attack simulation",
    body: "All 20 stages in their own files, each with the real terminal commands and proof screenshots.",
    href: `${repoUrl}/blob/main/02-Attack-Simulation/README.md`,
    tone: "accent" as const,
  },
  {
    n: "03",
    title: "Detection engineering",
    body: "The custom rules, signatures, and the two-tier engine that turned alerts into case files.",
    href: `${repoUrl}/blob/main/03-Detection-Engineering/README.md`,
    tone: "violet" as const,
  },
  {
    n: "04",
    title: "Investigation",
    body: "Analyst-style notes for all 20 stages and the three TheHive incident cases.",
    href: `${repoUrl}/blob/main/04-Investigation/README.md`,
    tone: "cool" as const,
  },
  {
    n: "05",
    title: "Incident report",
    body: "The executive write-up: scope, timeline, indicators of compromise, and lessons learned.",
    href: `${repoUrl}/blob/main/05-Incident-Report/README.md`,
    tone: "accent" as const,
  },
  {
    n: "06",
    title: "Evidence & data",
    body: "The raw telemetry — thousands of alerts, the curated set, and the campaign blueprint.",
    href: `${repoUrl}/blob/main/06-Resources/README.md`,
    tone: "ok" as const,
  },
];

export function VisualRecord() {
  return (
    <section id="repo" className="section-shell">
      <div className="container-page">
        <SectionHead
          index="06"
          kicker="Where to go next"
          title="This site is the tour. The repository is the proof."
          lede="Everything you just read is a plain-language summary of work you can open, read, and rerun yourself. Pick a direction — the depth is all one click away."
        />

        <Stagger className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <StaggerItem key={doc.n}>
              <DeepCard n={doc.n} title={doc.title} body={doc.body} href={doc.href} tone={doc.tone} />
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.12} className="mt-10">
          <div className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-2xl">
              <h3 className="text-xl text-ink">Honest to the end.</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                The incident report is marked{" "}
                <span className="font-medium text-ok">{metrics.reportStatus}</span>. The case files and five
                supporting documents are still labelled{" "}
                <span className="font-medium text-accent">Draft, not yet validated</span> — because a record
                that hides what is unfinished is not worth trusting.
              </p>
            </div>
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary shrink-0"
            >
              <Code className="h-4 w-4" />
              Open the repository
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.16} className="mt-8">
          <RepoLink href={`${repoUrl}/blob/main/INDEX.md`} note="every stage, rule, alert and case in one table">
            Open the master traceability index
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}
