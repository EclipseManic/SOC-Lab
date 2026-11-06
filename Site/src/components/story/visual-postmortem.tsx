import { useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Fingerprint, Search } from "lucide-react";
import { masterIoCs, repoBlob, rootCauses } from "@/data";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { RepoLink, SectionHead } from "./visual-shared";
import { DiagramCard } from "./diagram-modal";

const CATEGORIES = [
  { id: "all", label: "All Observables", count: 18 },
  { id: "network", label: "Network", count: 5 },
  { id: "identity", label: "Identity", count: 4 },
  { id: "file", label: "Files", count: 5 },
  { id: "registry", label: "Registry", count: 1 },
  { id: "hash", label: "Hashes & Keys", count: 3 },
] as const;

export function VisualPostMortem() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredIoCs = useMemo(() => {
    return masterIoCs.filter((ioc) => {
      const matchesCategory =
        selectedCategory === "all" || ioc.category === selectedCategory;
      const matchesSearch =
        searchQuery === "" ||
        ioc.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ioc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ioc.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ioc.context.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section id="post-mortem" className="section-shell bg-paper-1">
      <div className="container-page">
        <SectionHead
          index="06"
          kicker="The forensic autopsy"
          title="The 7 fatal flaws — and the observables left behind."
          lede="A breach is never a single event; it is a cascade of compounding exposures. Here is the forensic post-mortem isolating the 7 architectural failures that allowed perimeter exploitation to escalate into Active Directory forest compromise, accompanied by the authoritative Indicators of Compromise (IoC) register."
        />

        {/* 1. Seven Fatal Architectural Flaws Grid */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="chip border-hot/40 bg-hot-soft font-mono text-[0.65rem] text-hot">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Root Cause Analysis
              </span>
              <span className="text-xs text-muted">7 compounding misconfigurations</span>
            </div>
            <span className="font-mono text-[0.68rem] text-faint hidden sm:inline">
              Authoritative: 05-Incident-Report/incident-report.md
            </span>
          </div>

          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rootCauses.map((rc) => (
              <StaggerItem key={rc.id}>
                <div className="panel flex h-full flex-col justify-between p-5 transition-all duration-300 hover:border-rule-2 group">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="chip border-rule-2 bg-paper-3 font-mono text-[0.65rem] text-accent">
                        {rc.id}
                      </span>
                      <span
                        className={`chip font-mono text-[0.65rem] ${
                          rc.severity === "Critical"
                            ? "border-hot/40 bg-hot-soft text-hot"
                            : "border-accent/40 bg-accent-soft text-accent"
                        }`}
                      >
                        {rc.severity}
                      </span>
                    </div>

                    <h4 className="mt-3 text-sm font-medium text-ink group-hover:text-accent transition-colors">
                      {rc.title}
                    </h4>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="rounded-md border border-rule bg-paper-3/60 p-2.5">
                        <span className="block font-medium text-hot text-[0.68rem] mb-0.5">
                          Architectural Flaw:
                        </span>
                        <p className="text-muted text-[0.72rem] leading-relaxed">{rc.flaw}</p>
                      </div>

                      <div className="rounded-md border border-rule bg-paper-3/60 p-2.5">
                        <span className="block font-medium text-cool text-[0.68rem] mb-0.5">
                          Offensive Exploitation:
                        </span>
                        <p className="text-muted text-[0.72rem] leading-relaxed">{rc.exploit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-rule/50 pt-3">
                    <span className="block font-medium text-ok text-[0.68rem] mb-0.5">
                      Defensive Resolution:
                    </span>
                    <p className="text-muted text-[0.72rem] leading-relaxed">{rc.fix}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {/* 2. 4K Blueprint: Seven Fatal Architectural Flaws */}
        <Reveal delay={0.12} className="mt-12">
          <DiagramCard
            title="Seven Fatal Architectural Flaws Blueprint"
            subtitle="Architectural failure analysis depicting the exact escalation path from web perimeter to forest root"
            src="/diagrams/Seven%20Fatal%20Architectural%20Flaws.png"
            caption="Complete post-mortem flow correlating misconfigurations, exploit payloads, and defense-in-depth mitigations."
          />
        </Reveal>

        {/* 3. Indicators of Compromise (IoC) Register */}
        <div className="mt-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="chip border-accent/40 bg-accent-soft font-mono text-[0.65rem] text-accent">
                  <Fingerprint className="h-3 w-3 inline mr-1" />
                  Threat Observables
                </span>
                <h3 className="text-lg font-medium text-ink">Master IoC Register</h3>
              </div>
              <p className="mt-1 text-xs text-muted">
                18 forensic indicators extracted from memory dumps, packet captures, and event logs.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search IoC, host, hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-pill border border-rule bg-paper-2 pl-9 pr-3 py-1.5 text-xs text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    active
                      ? "border-accent bg-accent text-accent-ink"
                      : "border-rule bg-paper-2 text-muted hover:border-rule-2 hover:text-ink"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`font-mono text-[0.65rem] rounded-full px-1.5 py-0.2 ${
                      active ? "bg-black/20 text-white" : "bg-paper-3 text-muted"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* IoC Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredIoCs.map((ioc) => {
              const isCopied = copiedId === ioc.id;
              return (
                <div
                  key={ioc.id}
                  className="rounded-card border border-rule bg-paper-2 p-4 transition-all duration-300 hover:border-rule-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="chip border-rule-2 bg-paper-3 font-mono text-[0.65rem] text-ink">
                          {ioc.id}
                        </span>
                        <span className="chip border-rule bg-paper-3/80 font-mono text-[0.65rem] text-cool">
                          {ioc.type}
                        </span>
                      </div>
                      <span className="chip border-ok/30 bg-ok-soft font-mono text-[0.62rem] text-ok">
                        {ioc.confidence}
                      </span>
                    </div>

                    <div className="relative mt-2 rounded-md border border-rule bg-paper-3 p-2 font-mono text-xs text-ink group">
                      <div className="pr-7 break-all font-semibold select-all">{ioc.value}</div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(ioc.value, ioc.id)}
                        title="Copy IoC value"
                        className="absolute right-2 top-2 rounded p-1 text-muted hover:text-ink hover:bg-paper-2 transition-colors"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-ok" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[0.7rem] text-muted">
                      <span>Host / Scope:</span>
                      <span className="font-mono text-cool">{ioc.host}</span>
                    </div>

                    <p className="mt-2 text-xs text-muted leading-relaxed line-clamp-2">
                      {ioc.context}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredIoCs.length === 0 && (
            <div className="rounded-card border border-dashed border-rule p-8 text-center text-xs text-muted">
              No Indicators of Compromise match your filter criteria.
            </div>
          )}
        </div>

        {/* 4. Executive Post-Mortem Deliverable Links */}
        <Reveal delay={0.15} className="mt-10 flex flex-wrap gap-4">
          <RepoLink
            href={`${repoBlob}/05-Incident-Report/incident-report.md`}
            note="Executive summary, timeline breakdown & corrective action plan"
          >
            Read the 5-page Executive Incident Report
          </RepoLink>
          <RepoLink
            href={`${repoBlob}/05-Incident-Report/iocs.md`}
            note="Full threat intelligence register with MISP & STIX 2.1 taxonomy"
          >
            Inspect the STIX 2.1 Threat Intel Catalog
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}
