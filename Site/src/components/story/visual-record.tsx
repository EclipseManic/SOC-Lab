import { useState } from "react";
import { ArrowUpRight, FileText, GitBranch, Wrench } from "lucide-react";
import { evidenceReel, metrics, reportDocumentStatuses, repoBlob, repoUrl, reportDocs } from "@/data";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnatomyPlate, RepoLink, SectionKicker, SectionTitle } from "./visual-shared";

const remediation = [
  ["04 + 11", "Offline cracking", "Prevent credential dumps and detect the post-crack authentication anomalies that follow."],
  ["09", "Intra-subnet visibility", "Keep promiscuous NIDS sniffing and strengthen endpoint process monitoring for Layer 2 movement."],
  ["12", "AD diagnostics", "Set the Active Directory `15 Field Engineering` registry value to `5` to enable Event ID 1644 LDAP logging."],
] as const;

export function VisualRecord() {
  const [selected, setSelected] = useState<(typeof evidenceReel)[number] | null>(null);
  return (
    <section id="record" className="border-b border-line/70 py-20 sm:py-28">
      <div className="container-page">
        <SectionKicker index="05 / RECORD" label="The file" />
        <div className="mt-10"><SectionTitle eyebrow="The record" title="What I would fix next." body="The report metadata says Final / Resolved. The evidence labels stay visible: the case files are drafts, the gaps are named, and the remediation work is specific enough to start." /></div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reportDocs.map((doc, index) => <a key={doc.path} href={`${repoBlob}/${doc.path}`} target="_blank" rel="noreferrer" className="group rounded-2xl border border-line/70 bg-panel/35 p-5 transition hover:-translate-y-0.5 hover:border-teal/35 hover:bg-panel/65"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] text-faint">0{index + 1}</span><FileText className="h-4 w-4 text-teal/70" aria-hidden="true" /></div><div className="mt-6 flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-medium tracking-[-0.03em] text-ink group-hover:text-teal">{doc.title}</h3><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-amber">{reportDocumentStatuses[doc.path]}</span></div><p className="mt-2 text-sm leading-6 text-muted">{doc.purpose}</p><span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Open source <ArrowUpRight className="h-3 w-3" aria-hidden="true" /></span></a>)}</div>
        <AnatomyPlate
          fig="FIG 08 // REMEDIATION"
          title="ENGINEERING GAP REGISTER & REMEDIATION BACKLOG"
          hint="[ENGINEERING BACKLOG] 4 NAMED GAPS -> 3 RECTIFICATION TASKS"
          readout="STATUS: FINAL / RESOLVED"
          className="mt-10"
        >
          <div className="border-b border-line/70 pb-4">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.18em] text-amber">
              <Wrench className="h-4 w-4" aria-hidden="true" /> Remediation backlog
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Four gaps, three engineering moves. The report says what to change instead of hiding the boundary behind a percentage.</p>
          </div>
          <div className="divide-y divide-line/60">
            {remediation.map(([id, title, body]) => (
              <div key={id} className="grid gap-3 p-4 sm:grid-cols-[7rem_minmax(0,0.7fr)_minmax(0,1.3fr)] sm:items-start sm:p-5">
                <span className="font-mono text-[10px] text-amber">DG-{id}</span>
                <span className="text-sm font-medium text-ink">{title}</span>
                <span className="text-sm leading-6 text-muted">{body}</span>
              </div>
            ))}
          </div>
        </AnatomyPlate>
        <div className="mt-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-teal">Evidence reel / {evidenceReel.length * 2} frames</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">The credibility signal.</h3></div><p className="max-w-sm text-sm leading-6 text-faint">Attack-side evidence paired with the matching TheHive capture. Tap any frame to enlarge it.</p></div><div className="evidence-reel mt-5 flex snap-x gap-4 overflow-x-auto pb-4">{evidenceReel.map((item) => <button key={item.stageId} type="button" onClick={() => setSelected(item)} className="group w-[18rem] shrink-0 snap-start text-left sm:w-[22rem]"><div className="grid grid-cols-2 gap-2 overflow-hidden rounded-2xl border border-line/70 bg-panel/35 p-2 transition group-hover:border-teal/35"><img src={item.attack} alt={`Attack evidence for stage ${item.stageId}`} width="960" height="540" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" /><img src={item.alert} alt={`TheHive evidence for stage ${item.stageId}`} width="960" height="540" loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" /></div><p className="mt-3 font-mono text-[9px] uppercase tracking-[0.13em] text-teal">Stage {item.stageId}</p><p className="mt-1 text-sm leading-5 text-muted">{item.caption}</p></button>)}</div></div>
        <div className="mt-12 flex flex-col gap-5 border-t border-line/70 pt-8 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">Status / incident report</p><p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-ink">{metrics.reportStatus}</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted">The repository remains the source of truth. The site is a fast, visual route into the files.</p></div><div className="flex flex-wrap gap-3"><a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-teal px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-canvas hover:bg-ink"><GitBranch className="h-3.5 w-3.5" aria-hidden="true" /> Open repository</a><RepoLink href={`${repoBlob}/INDEX.md`}>Read INDEX.md</RepoLink></div></div>
        <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}><DialogContent className="max-w-5xl bg-canvas p-3 sm:p-5"><DialogHeader><DialogTitle>Stage {selected?.stageId} evidence pair</DialogTitle><DialogDescription>{selected?.caption}</DialogDescription></DialogHeader>{selected ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><img src={selected.attack} alt={`Expanded attack evidence for stage ${selected.stageId}`} width="960" height="540" className="w-full rounded-xl border border-line/70" /><img src={selected.alert} alt={`Expanded TheHive evidence for stage ${selected.stageId}`} width="960" height="540" className="w-full rounded-xl border border-line/70" /></div> : null}</DialogContent></Dialog>
      </div>
    </section>
  );
}
