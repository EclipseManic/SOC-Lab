import { useReducedMotion } from "motion/react";
import { Activity } from "lucide-react";
import { metrics } from "@/data";

type Sev = "critical" | "high" | "medium";

type Row = {
  sev: Sev;
  rule: string;
  text: string;
  stage: string;
};

/* Real rule IDs and alerts pulled from the campaign record. */
const feed: Row[] = [
  { sev: "critical", rule: "Wazuh 100613", text: "Domain admin logon from the pivot host", stage: "15" },
  { sev: "high", rule: "Suricata 2010963", text: "SQL injection pattern in an HTTP request", stage: "03" },
  { sev: "high", rule: "Wazuh 5402 · PAM", text: "Privilege escalation to root on the web host", stage: "07" },
  { sev: "medium", rule: "Wazuh 86601", text: "Multi-port SYN scan from the attacker subnet", stage: "01" },
  { sev: "high", rule: "Wazuh 5715", text: "Pivot session opened to the domain controller", stage: "12" },
  { sev: "medium", rule: "Auditd 100199", text: "Shell spawned by the web service account", stage: "05" },
  { sev: "high", rule: "Windows 4769", text: "Kerberoasting service ticket requested", stage: "13" },
  { sev: "critical", rule: "Wazuh 100613", text: "Backdoor domain admin account created", stage: "17" },
  { sev: "medium", rule: "Suricata 3400020", text: "Reverse shell connection to the attacker", stage: "06" },
  { sev: "high", rule: "Wazuh 100213", text: "Web brute-force burst against the login form", stage: "02" },
];

const sevTone: Record<Sev, string> = {
  critical: "border-hot/35 bg-hot/10 text-hot",
  high: "border-ember/35 bg-ember/10 text-ember",
  medium: "border-cool/30 bg-cool/10 text-cool",
};

function RowItem({ row }: { row: Row }) {
  return (
    <li className="flex h-14 items-center gap-3 border-b border-rule/50 px-4">
      <span className={`chip shrink-0 px-2 py-0.5 font-mono text-[0.6rem] uppercase ${sevTone[row.sev]}`}>
        {row.sev}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8rem] text-ink-2">{row.text}</span>
        <span className="block truncate font-mono text-[0.65rem] text-faint">{row.rule}</span>
      </span>
      <span className="shrink-0 font-mono text-[0.65rem] text-faint">S{row.stage}</span>
    </li>
  );
}

/** The hero's "empty right space" — a live-looking SOC console. */
export function HeroConsole() {
  const reduced = useReducedMotion();
  const visible = reduced ? feed.slice(0, 5) : [...feed, ...feed];

  return (
    <div className="glass relative min-w-0 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-rule/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
          </span>
          <span className="font-mono text-[0.7rem] uppercase tracking-wider text-ink-2">SOC console</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[0.65rem] text-faint">
          <Activity className="h-3 w-3 text-ok" />
          live feed
        </span>
      </div>

      {/* feed */}
      <div className="relative h-[17.5rem] overflow-hidden mask-fade-y">
        <ul className={reduced ? "" : "animate-feed"} style={reduced ? undefined : { animationDuration: `${feed.length * 3}s` }}>
          {visible.map((row, i) => (
            <RowItem key={`${row.rule}-${row.stage}-${i}`} row={row} />
          ))}
        </ul>
        {/* scanning line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 animate-scan bg-gradient-to-b from-cool/12 to-transparent" />
      </div>

      {/* footer */}
      <div className="border-t border-rule/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[0.7rem] text-ink-2">
            <span className="text-ok">{metrics.operationalAlertCount}</span> / {metrics.stageCount} stages alarmed
          </span>
          <span className="flex items-center gap-2.5 font-mono text-[0.6rem] text-faint">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-hot" />1
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-ember" />4
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cool" />
              {metrics.alertSeverityCounts.MEDIUM}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
