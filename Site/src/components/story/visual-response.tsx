import { useState } from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck, Terminal } from "lucide-react";
import { containmentActions, hardeningActions, repoBlob } from "@/data";
import { Reveal, Stagger, StaggerItem } from "@/components/fx/reveal";
import { RepoLink, SectionHead } from "./visual-shared";
import { DiagramCard } from "./diagram-modal";

export function VisualResponse() {
  const [phase, setPhase] = useState<"containment" | "hardening">("containment");

  const activeActions = phase === "containment" ? containmentActions : hardeningActions;

  return (
    <section id="response" className="section-shell bg-paper-3/40">
      <div className="container-page">
        <SectionHead
          index="05"
          kicker="Incident Response & Strategic Hardening"
          title="Containing the intrusion and securing the enterprise."
          lede="Detecting an intrusion is only effective if followed by decisive containment. When the simulated campaign concluded at Stage 20, we initiated a structured, two-phase response playbook: immediate tactical lockout to sever active footholds and invalidate stolen credentials, followed by permanent architectural hardening to eliminate root-cause vulnerabilities."
        />

        {/* Phase Selector Tabs */}
        <Reveal delay={0.1} className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setPhase("containment")}
              className={`flex items-center gap-2 rounded-pill border px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 ${
                phase === "containment"
                  ? "border-hot/50 bg-hot-soft text-hot shadow-glow-hot"
                  : "border-rule bg-paper-2 text-muted hover:border-rule-2 hover:text-ink"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Phase 1: Tactical Containment</span>
              <span className="chip border-hot/40 bg-hot/10 font-mono text-[0.65rem] text-hot ml-1">
                7 Actions
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPhase("hardening")}
              className={`flex items-center gap-2 rounded-pill border px-4 py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 ${
                phase === "hardening"
                  ? "border-ok/50 bg-ok-soft text-ok shadow-glow-cool"
                  : "border-rule bg-paper-2 text-muted hover:border-rule-2 hover:text-ink"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Phase 2: Permanent Remediation & Hardening</span>
              <span className="chip border-ok/40 bg-ok/10 font-mono text-[0.65rem] text-ok ml-1">
                7 Steps
              </span>
            </button>
          </div>
        </Reveal>

        {/* Phase Banner Note */}
        <Reveal delay={0.12} className="mt-5">
          <div className="rounded-card border border-rule bg-paper-2 p-4 text-xs leading-relaxed text-muted">
            {phase === "containment" ? (
              <p>
                <span className="font-medium text-hot">Emergency Containment Objective:</span> Terminate all active adversary
                command-and-control channels, revoke injected SSH keys, disable unauthorized Active Directory accounts,
                and perform the essential double <code className="text-ink font-mono font-medium">krbtgt</code> password
                reset in Active Directory (incrementing <span className="text-ok font-mono font-medium">KVNO to 3</span>) to
                invalidate forged Golden Tickets.
              </p>
            ) : (
              <p>
                <span className="font-medium text-ok">Permanent Remediation Objective:</span> Eliminate the structural
                misconfigurations exploited during the campaign: remove passwordless sudoers privileges, enroll privileged
                domain accounts into the <code className="text-ink font-mono font-medium">Protected Users</code> group, disable
                legacy LLMNR and NetBIOS protocols across the forest, and enforce stateful subnet isolation.
              </p>
            )}
          </div>
        </Reveal>

        {/* Action Milestones Grid */}
        <Stagger key={phase} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeActions.map((action) => (
            <StaggerItem key={action.id}>
              <div className="panel flex h-full flex-col justify-between p-5 transition-all duration-300 hover:border-rule-2">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="chip border-rule-2 bg-paper-3 font-mono text-[0.65rem] text-accent">
                      {action.id}
                    </span>
                    <span className="chip border-ok/30 bg-ok-soft font-mono text-[0.65rem] text-ok">
                      <CheckCircle2 className="h-3 w-3 inline mr-1" />
                      {action.status}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-medium text-ink">{action.title}</h4>
                  <p className="mt-1 font-mono text-[0.68rem] text-cool">{action.target}</p>

                  <div className="mt-3 rounded-md border border-rule bg-paper-3 p-2 font-mono text-[0.65rem] text-ink-2 overflow-x-auto no-scrollbar">
                    <div className="text-faint text-[0.6rem] mb-1 flex items-center gap-1">
                      <Terminal className="h-3 w-3" /> {action.tool}
                    </div>
                    <code>{action.command}</code>
                  </div>
                </div>

                <div className="mt-3.5 border-t border-rule/50 pt-2.5 text-xs text-muted">
                  <p className="line-clamp-2">{action.verification}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* 4K Response Blueprints */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.12}>
            <DiagramCard
              title="Immediate Containment Playbook Flow"
              subtitle="7-step tactical containment sequence executed across Gateway, Web Tier, and Domain Controller"
              src="/diagrams/Immediate%20Containment%20Playbook%20Flow.png"
              caption="Authoritative tactical containment runbook isolating attacker access within minutes."
            />
          </Reveal>
          <Reveal delay={0.14}>
            <DiagramCard
              title="Enterprise Hardening Strategic Roadmap"
              subtitle="Permanent defense-in-depth: Protected Users, GPO hardening, DMZ isolation, and credential rotation"
              src="/diagrams/Enterprise%20Hardening%20Strategic%20Roadmap.png"
              caption="Multi-tier post-incident hardening framework across Linux and Active Directory."
            />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-8">
          <RepoLink href={`${repoBlob}/05-Incident-Report/response-actions.md`} note="all 14 commands, RSAT scripts & forensic sign-off">
            Read the complete incident response log
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}
