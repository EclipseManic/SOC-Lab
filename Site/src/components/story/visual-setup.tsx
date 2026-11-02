import { RepoLink, SectionHead } from "./visual-shared";
import { Reveal } from "@/components/fx/reveal";
import { NetworkMap } from "./network-map";

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

        <Reveal delay={0.15} className="mt-8">
          <RepoLink href="https://github.com/EclipseManic/SOC-Lab/blob/main/01-Lab-Setup/README.md" note="addresses, routing, VPN">
            See how the whole lab is wired
          </RepoLink>
        </Reveal>
      </div>
    </section>
  );
}
