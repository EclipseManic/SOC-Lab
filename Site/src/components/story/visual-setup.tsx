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
          kicker="Architecture & Network Segmentation"
          title="An enterprise-style network designed for layered security visibility."
          lede="To evaluate security controls with real confidence, you need an environment where malicious activity can be systematically tracked at multiple defensive layers. I designed this hybrid infrastructure around strict network segmentation: on-premises victim systems are isolated on an internal subnet, routed inter-segment traffic passes through an inline Suricata gateway, and host endpoint sensors (Sysmon, Auditd, Wazuh) capture internal activity that bypasses network inspection."
        />

        <Reveal delay={0.1} y={34} className="mt-12">
          <div className="panel relative overflow-hidden p-4 sm:p-6">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.16]" />

            <div className="relative">
              <NetworkMap />
            </div>

            <p className="relative mt-5 rounded-card border border-rule bg-paper-3/60 px-4 py-3 text-xs leading-5 text-muted">
              <span className="font-medium text-ink-2">Segmentation & sensor boundaries:</span> All routed inter-segment traffic (external attacker to DMZ, and outbound WAN connections) crosses the Suricata gateway. While hosts on the same Layer-2 subnet (192.168.56.0/24) communicate directly, broadcast queries (LLMNR/NetBIOS) are captured by gateway promiscuous sniffing, and endpoint sensors (Sysmon, Auditd) monitor all direct host-to-host execution and network connections.
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
