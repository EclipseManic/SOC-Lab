import {
  ArrowUpRight,
  Database,
  FileWarning,
  FolderGit2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { chapters, evidenceItems, repoBlob, repoUrl } from "@/data";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const toneMap: Record<string, "teal" | "blue" | "amber" | "rose" | "neutral"> = {
  teal: "teal",
  blue: "blue",
  amber: "amber",
  rose: "rose",
};

export function Evidence() {
  return (
    <section id="evidence" className="section-shell">
      <div className="container-page">
        <SectionHeader chapter={chapters[5]} />

        <div className="mt-10 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-teal">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              Evidence ledger
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Captured artifacts and pending artifacts are listed together. The
              distinction is the point: a missing screenshot is a documented gap,
              not a reason to imply the evidence exists.
            </p>
            <div className="mt-6 divide-y divide-line/60 border-y border-line/60">
              {evidenceItems.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 py-3.5 sm:grid-cols-[9.5rem_1fr_auto] sm:items-start sm:gap-3"
                >
                  <span className="text-xs font-medium text-ink">{item.label}</span>
                  <span className="text-xs leading-5 text-faint">{item.note}</span>
                  <Badge tone={toneMap[item.tone] ?? "neutral"}>{item.value}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-3">
            <Card className="border-teal/20 bg-teal/[0.04] p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-teal/25 bg-teal/10 text-teal">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-ink">
                    Visual Evidence Chain Published
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Attack executions and TheHive alert captures across all 20 stages are
                    published in dedicated folders with strict IP and credential redaction,
                    providing concrete visual proof for every verified detection.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-amber/20 bg-amber/[0.04] p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber/25 bg-amber/10 text-amber">
                  <FileWarning className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-ink">
                    Architecture diagram caveat
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    The PNG shows the gateway as{" "}
                    <span className="font-mono text-xs text-amber">192.168.56.1/24</span>.
                    The authoritative value is{" "}
                    <span className="font-mono text-xs text-amber">192.168.56.150/24</span>{" "}
                    in the architecture record. The image is not silently
                    rewritten.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="flex items-center gap-2 text-sm font-medium text-ink">
                <LockKeyhole className="h-4 w-4 text-teal" aria-hidden="true" />
                Publication rule
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                No credentials, hashes, public IPs, or unredacted screenshots in
                the reading layer. The repository holds the deeper record.
              </p>
            </Card>
          </div>
        </div>

        <Card className="mt-3 overflow-hidden">
          <div className="grid gap-px bg-line/50 sm:grid-cols-3">
            <a
              href={`${repoBlob}/INDEX.md`}
              target="_blank"
              rel="noreferrer"
              className="group bg-panel/80 p-5 transition hover:bg-panel-2/70"
            >
              <ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-medium text-ink">Start with INDEX</h3>
              <p className="mt-1 text-xs leading-5 text-faint">
                The canonical reading order and repository map.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition group-hover:text-teal">
                Open
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </a>
            <a
              href={`${repoBlob}/06-Resources/README.md`}
              target="_blank"
              rel="noreferrer"
              className="group bg-panel/80 p-5 transition hover:bg-panel-2/70"
            >
              <FolderGit2 className="h-4 w-4 text-blue" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-medium text-ink">Resources</h3>
              <p className="mt-1 text-xs leading-5 text-faint">
                Diagrams, lab reference material, and supporting files.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition group-hover:text-teal">
                Open
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </a>
            <a
              href={repoUrl}
              target="_blank"
              rel="noreferrer"
              className="group bg-panel/80 p-5 transition hover:bg-panel-2/70"
            >
              <FolderGit2 className="h-4 w-4 text-rose" aria-hidden="true" />
              <h3 className="mt-3 text-sm font-medium text-ink">Repository</h3>
              <p className="mt-1 text-xs leading-5 text-faint">
                The full record: stages, rules, cases, and report drafts.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em] text-faint transition group-hover:text-teal">
                Open
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </a>
          </div>
        </Card>

        <div className="relative mt-10 overflow-hidden rounded-3xl border border-teal/20 bg-panel/60 p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/10 blur-[90px]"
            aria-hidden="true"
          />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-teal">
                End of reading layer
              </p>
              <h3 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-3xl">
                The repository is the record. This site is the reading layer.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                {chapters[5].handoff} Use the source links when a claim matters;
                the site is designed to send you there.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <a href={repoUrl} target="_blank" rel="noreferrer">
                  Open the repository
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a href={`${repoBlob}/INDEX.md`} target="_blank" rel="noreferrer">
                  Read INDEX.md
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
