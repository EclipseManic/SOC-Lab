import { ArrowUpRight } from "lucide-react";
import { repoBlob } from "@/data";
import { cn } from "@/lib/utils";

type Capability = "Supported" | "Conditional" | "Not supported";

interface SignalRow {
  behavior: string;
  note: string;
  network: Capability;
  host: Capability;
  identity: Capability;
  claim: string;
}

const signalRows: SignalRow[] = [
  {
    behavior: "Attacker ↔ victim",
    note: "The path crosses the Suricata gateway.",
    network: "Supported",
    host: "Conditional",
    identity: "Not supported",
    claim: "Cross-segment flow is on the wire.",
  },
  {
    behavior: "Victim ↔ victim",
    note: "SMB, LDAP, and Kerberos can stay inside .56.0/24.",
    network: "Not supported",
    host: "Conditional",
    identity: "Conditional",
    claim: "Only host or directory logs can carry it.",
  },
  {
    behavior: "Offline cracking",
    note: "The work happens outside the victim network.",
    network: "Not supported",
    host: "Not supported",
    identity: "Not supported",
    claim: "No direct signal. Correlate adjacent events.",
  },
  {
    behavior: "Web request / upload",
    note: "HTTP may cross the gateway or terminate on the host.",
    network: "Supported",
    host: "Conditional",
    identity: "Not supported",
    claim: "A request is not proof of intent.",
  },
  {
    behavior: "Kerberos service ticket",
    note: "The domain controller records the ticket request.",
    network: "Conditional",
    host: "Not supported",
    identity: "Supported",
    claim: "4769 is the anchor, not the verdict.",
  },
  {
    behavior: "Directory replication",
    note: "DRSUAPI and directory access can expose the request.",
    network: "Conditional",
    host: "Not supported",
    identity: "Supported",
    claim: "4662 and DRSUAPI context matter.",
  },
  {
    behavior: "Account / group change",
    note: "The change lands in the Windows security log.",
    network: "Not supported",
    host: "Conditional",
    identity: "Supported",
    claim: "4720 / 4728 / 4732 / 4738.",
  },
  {
    behavior: "Staging / egress",
    note: "Volume and destination only mean something against a baseline.",
    network: "Conditional",
    host: "Conditional",
    identity: "Not supported",
    claim: "A transfer is not automatically exfiltration.",
  },
];

const capabilityTone: Record<Capability, string> = {
  Supported: "text-teal",
  Conditional: "text-amber",
  "Not supported": "text-faint",
};

const capabilityDot: Record<Capability, string> = {
  Supported: "bg-teal",
  Conditional: "bg-amber",
  "Not supported": "bg-line",
};

function CapabilityCell({ value }: { value: Capability }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("h-1.5 w-1.5 rounded-full", capabilityDot[value])}
        aria-hidden="true"
      />
      <span className={cn("font-mono text-[9px] uppercase tracking-[0.1em]", capabilityTone[value])}>
        {value}
      </span>
    </span>
  );
}

export function SignalAct() {
  return (
    <section
      id="signal"
      aria-labelledby="signal-heading"
      className="relative border-b border-line/60 py-20 sm:py-28"
    >
      <div className="container-page">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal">
            Act IV / The signal
          </span>
          <span className="h-px flex-1 bg-line/80" aria-hidden="true" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-faint">
            04 of 06
          </span>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end lg:gap-16">
          <h2
            id="signal-heading"
            className="max-w-2xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.045em] text-ink sm:text-5xl lg:text-6xl"
          >
            An alert is not
            <br />
            a coverage claim.
          </h2>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-muted sm:text-lg sm:leading-8">
              Three telemetry planes can carry the campaign. None of them sees
              all of it. The matrix separates what a source can support from
              what the record can actually prove.
            </p>
            <p className="mt-4 text-sm leading-6 text-faint">
              Supported means the source can hold the event. Host telemetry from
              Sysmon 15.20 and Wazuh agents complements network NIDS to cover
              intra-subnet execution and lateral movement.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-line/70 py-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            Capability key
          </span>
          <CapabilityCell value="Supported" />
          <CapabilityCell value="Conditional" />
          <CapabilityCell value="Not supported" />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint/70">
            Not validated coverage
          </span>
        </div>

        <div className="mt-4 hidden overflow-hidden rounded-2xl border border-line/70 lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line/70 bg-panel/45">
                <th scope="col" className="px-4 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                  Behavior
                </th>
                <th scope="col" className="px-3 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                  Suricata
                </th>
                <th scope="col" className="px-3 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                  Wazuh host
                </th>
                <th scope="col" className="px-3 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                  AD security
                </th>
                <th scope="col" className="px-4 py-3 font-mono text-[9px] font-normal uppercase tracking-[0.14em] text-faint">
                  What it supports
                </th>
              </tr>
            </thead>
            <tbody>
              {signalRows.map((row) => (
                <tr key={row.behavior} className="border-b border-line/55 last:border-b-0">
                  <th scope="row" className="px-4 py-4 text-left">
                    <span className="block text-sm font-medium text-ink">{row.behavior}</span>
                    <span className="mt-1 block max-w-[15rem] text-xs leading-5 text-faint">
                      {row.note}
                    </span>
                  </th>
                  <td className="px-3 py-4 align-top">
                    <CapabilityCell value={row.network} />
                  </td>
                  <td className="px-3 py-4 align-top">
                    <CapabilityCell value={row.host} />
                  </td>
                  <td className="px-3 py-4 align-top">
                    <CapabilityCell value={row.identity} />
                  </td>
                  <td className="px-4 py-4 align-top text-xs leading-5 text-muted">
                    {row.claim}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-3 lg:hidden">
          {signalRows.map((row) => (
            <div key={row.behavior} className="rounded-2xl border border-line/70 bg-panel/30 p-4">
              <p className="text-sm font-medium text-ink">{row.behavior}</p>
              <p className="mt-1 text-xs leading-5 text-faint">{row.note}</p>
              <dl className="mt-4 grid gap-2 border-t border-line/60 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Suricata</dt>
                  <dd><CapabilityCell value={row.network} /></dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">Wazuh host</dt>
                  <dd><CapabilityCell value={row.host} /></dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">AD security</dt>
                  <dd><CapabilityCell value={row.identity} /></dd>
                </div>
              </dl>
              <p className="mt-3 border-t border-line/60 pt-3 text-xs leading-5 text-muted">
                {row.claim}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 border-t border-line/70 pt-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber">
              Read the alert, not the count
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              An alert can be adjacent and still be wrong. The loudest event in
              stage 02 is an unrelated Shellshock signature. The SSH alert
              attached to the credential phase is on the pivot, not on the
              LDAP, Kerberos, or DRSUAPI behavior it appears to explain.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-faint">
              The record keeps “a rule fired” separate from “the behavior was
              detected.”
            </p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              When the sources disagree
            </p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Some stage notes describe same-subnet traffic as network-visible.
              The topology says it never crosses Suricata. Until the notes are
              corrected, the topology is the stronger record.
            </p>
            <a
              href={`${repoBlob}/03-Detection-Engineering/coverage-matrix.md`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
            >
              Open the coverage matrix
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-line/60 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-faint">
              Next / Act V
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink">
              The case.
            </p>
            <p className="mt-1 max-w-md text-sm leading-6 text-muted">
              Detection is a hypothesis. The case record is where it is tested.
            </p>
          </div>
          <a
            href="#case"
            className="inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-faint transition hover:text-teal"
          >
            Open the case board
            <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
