import { FileCode2, Radar, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { metrics, repoBlob } from "@/data";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { RepoLink, SectionHead } from "./visual-shared";
import { PipelineFlow } from "./pipeline-flow";

const rules = [
  { id: "Suricata 3400001", title: "Nmap SYN port scan", snippet: "flags:S; threshold 25, seconds 5", tone: "text-cool" },
  { id: "Suricata 2010963", title: "SQL injection in a URL", snippet: 'http.uri; content:"UNION"; content:"SELECT"', tone: "text-cool" },
  {
    id: "Auditd · web_process_creation",
    title: "Any command run by the web account",
    snippet: "-S execve -F uid=33 -k web_process_creation",
    tone: "text-accent",
  },
  { id: "Wazuh 100199 · L10", title: "Suspicious host command", snippet: 'comm="(whoami|id|nc|ncat|netcat)"', tone: "text-accent" },
  {
    id: "Wazuh 100613 · L10",
    title: "Impacket wmiexec on the domain controller",
    snippet: "cmd.exe /Q /c ... ADMIN$\\__",
    tone: "text-ember",
  },
  { id: "Wazuh 100280 · L0", title: "Suppress our own scanner noise", snippet: 'list="wazuh-internal-bins" level="0"', tone: "text-muted" },
];

const stats = [
  { icon: Radar, value: "4", label: "detection layers" },
  { icon: FileCode2, value: "1,300+", label: "lines of custom rules" },
  { icon: SlidersHorizontal, value: "87", label: "noise suppressions" },
  { icon: ShieldCheck, value: "0", label: "rules that failed" },
];

export function VisualDetection() {
  return (
    <section id="detection" className="section-shell bg-paper-3/50">
      <div className="container-page">
        <SectionHead
          index="03"
          kicker="The part that made it visible"
          title="Without the rules, there is nothing to investigate."
          lede="A break-in is only useful if something notices it. Detection engineering is where the lab actually earns its keep: four sensors feeding a hand-written rules engine that can turn a single suspicious command into a clean, actionable case file."
        />

        <Reveal delay={0.1} y={34} className="mt-12">
          <div className="panel relative overflow-hidden p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.14]" />

            <div className="relative">
              <PipelineFlow />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-16">
          <h3 className="text-lg text-ink">
            The rules I wrote <span className="text-sm text-muted">— real signatures from the lab</span>
          </h3>
        </Reveal>

        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rules.map((rule) => (
            <StaggerItem key={rule.id}>
              <div className="panel flex h-full flex-col p-5">
                <span className={cn("font-mono text-[0.7rem]", rule.tone)}>{rule.id}</span>
                <h4 className="mt-2 text-sm font-medium text-ink">{rule.title}</h4>
                <code className="mt-3 block overflow-hidden truncate rounded-md border border-rule bg-paper-3 px-2.5 py-1.5 font-mono text-[0.68rem] text-ink-2">
                  {rule.snippet}
                </code>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <StaggerItem key={stat.label}>
                <div className="panel flex items-center gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-rule bg-paper-3 text-cool">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-mono text-2xl text-ink">{stat.value}</div>
                    <div className="text-xs text-muted">{stat.label}</div>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>

        <Reveal delay={0.12} className="mt-8 flex flex-wrap items-center gap-4">
          <RepoLink href={`${repoBlob}/03-Detection-Engineering/README.md`} note="rules, signatures, the SOAR pipeline">
            See the detection engineering
          </RepoLink>
          <p className="text-sm text-muted">{metrics.ruleFailureCount} rules failed during the whole campaign.</p>
        </Reveal>
      </div>
    </section>
  );
}
