import { ArrowUpRight } from "lucide-react";
import { repoBlob } from "@/data";

const zones = [
  {
    label: "Attack plane",
    title: "Kali Linux",
    meta: "192.168.232.0/24",
    body: "Isolated VMware NAT segment. The adversary workstation and its tooling.",
  },
  {
    label: "Boundary",
    title: "Suricata gateway",
    meta: ".232.162 → .56.150",
    body: "Routes attack traffic into the victim range and writes the network record.",
  },
  {
    label: "Victim plane",
    title: "Active Directory",
    meta: "192.168.56.0/24",
    body: "Windows Server 2022, a Windows 10 workstation, and DVWA on Ubuntu.",
  },
  {
    label: "SOC plane",
    title: "Private cloud",
    meta: "10.122.0.0/16 summary",
    body: "Wazuh, TheHive, and the case pipeline, reached over WireGuard.",
  },
];

export function LabAct() {
  return (
    <section
      id="lab"
      aria-labelledby="lab-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Act I / The lab
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            01 of 06
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <h2
            id="lab-heading"
            className="max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl"
          >
            Before the attack,
            <br />
            there was a boundary.
          </h2>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Two network planes. One gateway. One private SOC. The lab was
              built so that visibility had to be proven, not assumed.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              The design is part of the evidence. It decides which questions a
              packet capture can answer — and which ones it cannot.
            </p>
          </div>
        </div>

        <ol className="mt-16 grid gap-8 border-t border-line/70 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((zone, index) => (
            <li
              key={zone.title}
              className="border-l border-line/70 pl-4 lg:pl-5"
            >
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
                0{index + 1} / {zone.label}
              </p>
              <h3 className="mt-3 text-lg font-medium tracking-[-0.02em] text-ink">
                {zone.title}
              </h3>
              <p className="mt-1 font-mono text-[10px] tracking-[0.04em] text-teal">
                {zone.meta}
              </p>
              <p className="mt-3 text-sm leading-6 text-muted">{zone.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 grid gap-8 border-t border-line/70 pt-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
              What the map leaves out
            </p>
            <h3 className="mt-3 max-w-sm text-3xl font-semibold leading-[1.02] tracking-[-0.04em] text-ink sm:text-4xl">
              The gap is the point.
            </h3>
          </div>
          <div className="max-w-2xl">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Suricata sees traffic that crosses it: attacker to victim, victim
              to cloud, and the return path. It does not see what never reaches
              the gateway.
            </p>
            <p className="mt-4 font-mono text-sm leading-6 text-amber">
              192.168.56.0/24 stays inside. Same-subnet movement belongs to host
              telemetry.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              That boundary is documented before it becomes convenient. It is
              also where the first honest question starts: what could the SOC
              actually have known?
            </p>
            <a
              href={`${repoBlob}/01-Lab-Setup/README.md`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              Read the lab record
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
