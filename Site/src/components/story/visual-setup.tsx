import { RepoLink, SectionHead } from "./visual-shared";
import { Reveal } from "@/components/fx/reveal";
import { NetworkMap } from "./network-map";
import { DiagramCard } from "./diagram-modal";

export function VisualSetup() {
  return (
    <section id="setup" className="section-shell">
      <div className="container-page">
        <SectionHead
          index="01"
          kicker="What I built — and why"
          title="A tiny company, wired around one choke point."
          lede="You cannot trust a security tool you have never tested with a real attack. So I built one small company network from scratch — and I wired it so that every single packet has to pass through the gateway. Even the victims cannot reach each other, or the SOC, on their own."
        />

        <Reveal delay={0.1} y={34} className="mt-12">
          <div className="panel relative overflow-hidden p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.16]" />

            <div className="relative">
              <NetworkMap />
            </div>

            <p className="relative mt-5 rounded-card border border-rule bg-paper-3/60 px-4 py-3 text-xs leading-5 text-muted">
              <span className="font-medium text-ink-2">One choke point:</span> the three victims are not allowed to
              talk to each other or to the SOC directly — every packet has to cross the Suricata gateway first. That
              is what makes the network watchable at all.
            </p>
          </div>
        </Reveal>

        {/* 4K Master Architecture Blueprints */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Reveal delay={0.12}>
            <DiagramCard
              title="The Four Pillars of the SOC Lab"
              subtitle="Full lifecycle engineering: Infrastructure, Attack, Detection & Incident Response"
              src="/diagrams/The%20Four%20Pillars%20of%20the%20SOC%20Lab.png"
              caption="Authoritative 4-pillar methodology diagram spanning all phases of the project."
            />
          </Reveal>
          <Reveal delay={0.14}>
            <DiagramCard
              title="Laboratory-to-Detection Matrix"
              subtitle="Host-by-host mapping across attack techniques and defensive telemetry sensors"
              src="/diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png"
              caption="Multi-sensor matrix correlating Kali, Gateway, DVWA, DC, and Win10 against blue-team rules."
            />
          </Reveal>
        </div>

        <Reveal delay={0.15} className="mt-8">
          <RepoLink href="https://github.com/EclipseManic/SOC-Lab/blob/main/01-Lab-Setup/README.md" note="addresses, routing, VPN">
            See how the whole lab is wired
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}
