import {
  ArrowRight,
  Cloud,
  Crosshair,
  EyeOff,
  LockKeyhole,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";
import { chapters } from "@/data";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";

const zones = [
  {
    icon: Crosshair,
    label: "Attack plane",
    title: "Kali Linux",
    meta: "192.168.232.0/24",
    body: "Isolated VMware NAT segment. Adversary workstation and tooling.",
    tone: "text-teal",
  },
  {
    icon: Network,
    label: "Boundary",
    title: "Suricata gateway",
    meta: "192.168.232.162 · 192.168.56.150",
    body: "Routes attack to victim and writes eve.json into the SOC pipeline.",
    tone: "text-blue",
  },
  {
    icon: Server,
    label: "Victim plane",
    title: "Active Directory",
    meta: "192.168.56.0/24",
    body: "Windows Server 2022 DC, Windows 10, and DVWA on Ubuntu.",
    tone: "text-amber",
  },
  {
    icon: Cloud,
    label: "SOC plane",
    title: "Private cloud",
    meta: "10.122.0.0/16 summary",
    body: "Wazuh, TheHive, Velociraptor, and NPM across peered VNets.",
    tone: "text-rose",
  },
];

export function LabSetup() {
  return (
    <section id="lab-setup" className="section-shell">
      <div className="container-page">
        <SectionHeader chapter={chapters[0]} />

        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {zones.map((zone) => {
            const Icon = zone.icon;
            return (
              <div key={zone.title}>
                <Card className="h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl border border-line/80 bg-canvas/60 ${zone.tone}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                      {zone.label}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-medium tracking-[-0.02em] text-ink">
                    {zone.title}
                  </h3>
                  <p className="mt-1 font-mono text-[10px] tracking-[0.04em] text-teal">
                    {zone.meta}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted">{zone.body}</p>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="flex flex-wrap items-center gap-3 p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              Flow
            </span>
            <span className="flex items-center gap-2 text-xs text-muted">
              Kali <ArrowRight className="h-3 w-3 text-faint" aria-hidden="true" /> Suricata
              <ArrowRight className="h-3 w-3 text-faint" aria-hidden="true" /> victims
            </span>
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden="true" />
            <span className="flex items-center gap-2 text-xs text-muted">
              <ShieldCheck className="h-3.5 w-3.5 text-teal" aria-hidden="true" />
              Wazuh
              <ArrowRight className="h-3 w-3 text-faint" aria-hidden="true" />
              TheHive
            </span>
            <span className="ml-auto flex items-center gap-2">
              <Badge tone="teal">
                <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                51820/UDP only
              </Badge>
            </span>
          </Card>

          <Card className="flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal/25 bg-teal/10 text-teal">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                VPN policy
              </p>
              <p className="mt-0.5 text-xs text-muted">
                10.8.0.0/24 reaches both lab segments; public IPs stay out of the record.
              </p>
            </div>
          </Card>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-amber/20 bg-amber/[0.045] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber/25 bg-amber/10 text-amber">
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-medium text-ink">
                  What Suricata cannot see
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Traffic that stays inside <span className="font-mono text-xs text-amber">192.168.56.0/24</span>{" "}
                  never crosses the gateway. Victim-to-victim lateral movement
                  depends on Wazuh and host telemetry, not on the network sensor.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-medium text-ink">What the design proves</h3>
            <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted">
              <li className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                One public port; everything else is VPN, peering, or closed.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                TheHive VM terminates the tunnel and routes telemetry.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal" aria-hidden="true" />
                The visibility gap is documented before it becomes an excuse.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}
