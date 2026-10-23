export const repoUrl = "https://github.com/EclipseManic/SOC-Lab";
export const repoBlob = `${repoUrl}/blob/main`;

export type Lens = "executive" | "technical" | "hiring";
export type Phase = "web" | "cred" | "domain" | "impact";
export type StageStatus =
  | "Detected"
  | "Logging gap"
  | "Detection gap"
  | "Rule failure"
  | "Not tested";

export interface Stage {
  id: string;
  slug: string;
  title: string;
  phase: Phase;
  tactic: string;
  technique: string;
  techniqueId: string;
  plain: string;
  attacker: string;
  defender: string;
  evidence: string;
  telemetry: string;
  gap: string;
  status: StageStatus;
  caseLabel: string;
  caseSlug: string;
  attackPath: string;
  investigationPath: string;
}

export const phases: Record<
  Phase,
  { label: string; short: string; range: string; tone: string }
> = {
  web: {
    label: "Web foothold",
    short: "Web",
    range: "01–07",
    tone: "text-teal border-teal/30 bg-teal/10",
  },
  cred: {
    label: "Credential access & lateral movement",
    short: "Credential",
    range: "08–14",
    tone: "text-blue border-blue/30 bg-blue/10",
  },
  domain: {
    label: "Domain compromise",
    short: "Domain",
    range: "15–17",
    tone: "text-amber border-amber/30 bg-amber/10",
  },
  impact: {
    label: "Collection, exfiltration & impact",
    short: "Impact",
    range: "18–20",
    tone: "text-rose border-rose/30 bg-rose/10",
  },
};

export const stages: Stage[] = [
  {
    id: "01",
    slug: "recon",
    title: "Reconnaissance",
    phase: "web",
    tactic: "Reconnaissance",
    technique: "Active Scanning",
    techniqueId: "T1595",
    plain:
      "The attacker builds a map of the lab: live hosts, open ports, and services that are worth a closer look.",
    attacker:
      "Runs network and service discovery against the victim range, then narrows in on the web tier.",
    defender:
      "Suricata sees a broad port scan. Firewall and flow records show one source touching many destinations.",
    evidence:
      "Scan output, flow records, Suricata events, and the first alert screenshot.",
    telemetry: "Network flow / IDS",
    gap: "DG-01",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-01-recon.md",
    investigationPath: "04-Investigation/Stages/stage-01-recon.md",
  },
  {
    id: "02",
    slug: "bruteforce",
    title: "Brute Force",
    phase: "web",
    tactic: "Credential Access",
    technique: "Brute Force",
    techniqueId: "T1110",
    plain:
      "The attacker guesses usernames and passwords against a login page until one combination works.",
    attacker: "Sends automated login attempts against the DVWA authentication form.",
    defender:
      "A burst of failed logins from one source, followed by a success. Web and auth logs carry the pattern.",
    evidence: "Request rate, response codes, source address, and the successful login.",
    telemetry: "Web or auth logs",
    gap: "DG-02",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-02-bruteforce.md",
    investigationPath: "04-Investigation/Stages/stage-02-bruteforce.md",
  },
  {
    id: "03",
    slug: "sqli",
    title: "SQL Injection",
    phase: "web",
    tactic: "Initial Access",
    technique: "Exploit Public-Facing Application",
    techniqueId: "T1190",
    plain:
      "The attacker sends crafted input that tricks the web app into running database commands.",
    attacker: "Tests input fields, then extracts data through a SQL injection payload.",
    defender:
      "Suricata HTTP signatures and Wazuh web logs show the payload and the response.",
    evidence: "Raw request, response, extracted data, and the affected endpoint.",
    telemetry: "HTTP / WAF / IDS",
    gap: "DG-03",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-03-sqli.md",
    investigationPath: "04-Investigation/Stages/stage-03-sqli.md",
  },
  {
    id: "04",
    slug: "hash-crack",
    title: "Hash Cracking",
    phase: "web",
    tactic: "Credential Access",
    technique: "Password Cracking",
    techniqueId: "T1110.002",
    plain:
      "A stolen password hash is cracked offline, turning it back into a usable password.",
    attacker: "Runs a cracking tool against the extracted hash outside the victim network.",
    defender:
      "There is no host or network signal for offline cracking. Correlate it with the earlier extraction and later logins.",
    evidence: "Hash source, cracking method, and the recovered credential, redacted.",
    telemetry: "Offline (none)",
    gap: "DG-04",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-04-hash-crack.md",
    investigationPath: "04-Investigation/Stages/stage-04-hash-crack.md",
  },
  {
    id: "05",
    slug: "webshell",
    title: "Web Shell Upload",
    phase: "web",
    tactic: "Persistence",
    technique: "Server Web Shell",
    techniqueId: "T1505.003",
    plain:
      "The attacker uploads a small backdoor script so they can run commands through the web server.",
    attacker:
      "Uploads a PHP web shell to a writable web directory and confirms that it executes.",
    defender:
      "File integrity monitoring sees a new file in the web root. The upload request appears in the web log.",
    evidence: "File path, SHA-256, upload request, and first command output.",
    telemetry: "Web server / FIM",
    gap: "DG-05",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-05-webshell.md",
    investigationPath: "04-Investigation/Stages/stage-05-webshell.md",
  },
  {
    id: "06",
    slug: "reverse-shell",
    title: "Reverse Shell",
    phase: "web",
    tactic: "Execution",
    technique: "Unix Shell",
    techniqueId: "T1059.004",
    plain:
      "The victim server opens a connection back to the attacker, giving them a remote command line.",
    attacker: "Triggers the web shell to start an outbound shell to the Kali listener.",
    defender:
      "A web-server process makes an unusual outbound connection. Process and network telemetry show the parent-child relationship.",
    evidence: "Connection tuple, process tree, shell commands, and the listener.",
    telemetry: "Process / network",
    gap: "DG-06",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-06-reverse-shell.md",
    investigationPath: "04-Investigation/Stages/stage-06-reverse-shell.md",
  },
  {
    id: "07",
    slug: "privesc",
    title: "Privilege Escalation",
    phase: "web",
    tactic: "Privilege Escalation",
    technique: "Exploitation for Privilege Escalation",
    techniqueId: "T1068",
    plain:
      "The attacker raises their permissions from the web account to root on the same server.",
    attacker: "Finds a local privilege-escalation path and obtains root.",
    defender:
      "Sudo, process, and file telemetry show the context change and the exploit footprint.",
    evidence: "Before-and-after identity, exploit artifact, and modified files.",
    telemetry: "Auth / process / FIM",
    gap: "DG-07",
    status: "Not tested",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-07-privesc.md",
    investigationPath: "04-Investigation/Stages/stage-07-privesc.md",
  },
  {
    id: "08",
    slug: "ssh-persistence",
    title: "SSH Persistence",
    phase: "cred",
    tactic: "Persistence",
    technique: "SSH Authorized Keys",
    techniqueId: "T1098.004",
    plain:
      "The attacker adds a key to the server so they can log back in later, even after a reboot.",
    attacker:
      "Writes an SSH public key into the web server account's authorized_keys file.",
    defender:
      "FIM sees the file change. Auth logs show the new key or the session it enables.",
    evidence: "File diff, key fingerprint redacted, and the authentication event.",
    telemetry: "Auth / FIM",
    gap: "DG-08",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-08-ssh-persistence.md",
    investigationPath: "04-Investigation/Stages/stage-08-ssh-persistence.md",
  },
  {
    id: "09",
    slug: "internal-discovery",
    title: "Internal Discovery",
    phase: "cred",
    tactic: "Discovery",
    technique: "Remote System Discovery",
    techniqueId: "T1018",
    plain:
      "The attacker looks around the internal network for the next machine to attack.",
    attacker:
      "From the DVWA pivot, scans the internal range and enumerates reachable hosts and services.",
    defender:
      "Same-subnet discovery does not cross the Suricata gateway. Process and host telemetry on the pivot may show the discovery tool.",
    evidence: "Pivot host, destination spread, and discovered services.",
    telemetry: "Host / process",
    gap: "DG-09",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-09-internal-discovery.md",
    investigationPath: "04-Investigation/Stages/stage-09-internal-discovery.md",
  },
  {
    id: "10",
    slug: "responder",
    title: "Responder Poisoning",
    phase: "cred",
    tactic: "Credential Access",
    technique: "LLMNR/NBT-NS Poisoning and SMB Relay",
    techniqueId: "T1557.001",
    plain:
      "The attacker pretends to be a trusted network service so a victim sends over authentication material.",
    attacker:
      "From the DVWA pivot, runs Responder to answer broadcast name-resolution requests and capture authentication.",
    defender:
      "Poisoning stays inside the victim subnet, so Suricata is blind. Wazuh and auth logs show the victim's NTLM exchange.",
    evidence: "Pivot host, victim host, captured username, and hash type.",
    telemetry: "Host / auth",
    gap: "DG-10",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-10-responder.md",
    investigationPath: "04-Investigation/Stages/stage-10-responder.md",
  },
  {
    id: "11",
    slug: "ntlmv2-crack",
    title: "NTLMv2 Cracking",
    phase: "cred",
    tactic: "Credential Access",
    technique: "Password Cracking",
    techniqueId: "T1110.002",
    plain:
      "The captured NTLMv2 challenge is cracked offline into a reusable credential.",
    attacker: "Cracks the captured challenge-response outside the victim network.",
    defender:
      "Offline again: no direct signal. Correlate the earlier poisoning with later authentication.",
    evidence: "Captured hash type, cracking result redacted, and the affected account.",
    telemetry: "Offline (none)",
    gap: "DG-11",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md",
    investigationPath: "04-Investigation/Stages/stage-11-ntlmv2-crack.md",
  },
  {
    id: "12",
    slug: "bloodhound",
    title: "BloodHound Enumeration",
    phase: "cred",
    tactic: "Discovery",
    technique: "Domain Account",
    techniqueId: "T1087.002",
    plain:
      "The attacker maps Active Directory to find the shortest path to domain control.",
    attacker:
      "Collects directory data and reviews relationships, sessions, and delegation paths.",
    defender:
      "Directory-service logs show unusual LDAP query volume or collection behavior from one host.",
    evidence: "Collection source, account, query volume, and identified attack path.",
    telemetry: "LDAP / directory service",
    gap: "DG-12",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-12-bloodhound.md",
    investigationPath: "04-Investigation/Stages/stage-12-bloodhound.md",
  },
  {
    id: "13",
    slug: "kerberoasting",
    title: "Kerberoasting",
    phase: "cred",
    tactic: "Credential Access",
    technique: "Kerberoasting",
    techniqueId: "T1558.003",
    plain:
      "The attacker requests service tickets and cracks their encrypted material offline to recover a service account password.",
    attacker:
      "Requests Kerberos service tickets for accounts with SPNs, then cracks them offline.",
    defender:
      "Event 4769 shows a burst of service-ticket requests, often with RC4 encryption, for one account.",
    evidence: "Target account, SPN, ticket encryption type, and request volume.",
    telemetry: "Kerberos / directory service",
    gap: "DG-13",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-13-kerberoasting.md",
    investigationPath: "04-Investigation/Stages/stage-13-kerberoasting.md",
  },
  {
    id: "14",
    slug: "dcsync",
    title: "DCSync",
    phase: "cred",
    tactic: "Credential Access",
    technique: "DCSync",
    techniqueId: "T1003.006",
    plain:
      "The attacker impersonates a domain controller to copy password hashes from Active Directory.",
    attacker: "Uses replication rights to pull directory credentials with DCSync.",
    defender:
      "DRSUAPI traffic and directory-service access events show replication from an unexpected account or host.",
    evidence: "Replication account, source host, and affected identities. Hashes are redacted.",
    telemetry: "Directory service / DRSUAPI",
    gap: "DG-14",
    status: "Not tested",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-14-dcsync.md",
    investigationPath: "04-Investigation/Stages/stage-14-dcsync.md",
  },
  {
    id: "15",
    slug: "pass-the-hash",
    title: "Pass-the-Hash",
    phase: "domain",
    tactic: "Lateral Movement",
    technique: "Pass the Hash",
    techniqueId: "T1550.002",
    plain:
      "The attacker reuses a stolen hash to log in without knowing the plaintext password.",
    attacker: "Authenticates to a Windows host with a captured NT hash over SMB.",
    defender:
      "Logon type 3 with NTLM from an unusual source. SMB and auth logs show the session.",
    evidence: "Source and target hosts, account, logon type, and accessed service.",
    telemetry: "Auth / SMB",
    gap: "DG-15",
    status: "Not tested",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-15-pass-the-hash.md",
    investigationPath: "04-Investigation/Stages/stage-15-pass-the-hash.md",
  },
  {
    id: "16",
    slug: "golden-ticket",
    title: "Golden Ticket",
    phase: "domain",
    tactic: "Credential Access / Persistence",
    technique: "Golden Ticket",
    techniqueId: "T1558.001",
    plain:
      "The attacker forges a Kerberos ticket with the domain's most sensitive key, creating long-lived domain access.",
    attacker:
      "Builds a Golden Ticket with the KRBTGT hash and uses it to access domain resources.",
    defender:
      "Anomalous ticket lifetimes, encryption types, or account-and-host combinations in Kerberos telemetry.",
    evidence:
      "Ticket metadata, source host, and the KRBTGT exposure path. The key is never published.",
    telemetry: "Kerberos",
    gap: "DG-16",
    status: "Not tested",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-16-golden-ticket.md",
    investigationPath: "04-Investigation/Stages/stage-16-golden-ticket.md",
  },
  {
    id: "17",
    slug: "dc-persistence",
    title: "DC Persistence",
    phase: "domain",
    tactic: "Persistence",
    technique: "Domain Account",
    techniqueId: "T1136.002",
    plain:
      "The attacker creates a hidden domain account so they can return later.",
    attacker:
      "Creates a new account and adds it to a privileged group on the Domain Controller.",
    defender:
      "Windows security events 4720 and 4728 or 4732 show the account creation and group change.",
    evidence: "Account name, creator, group membership, and timestamps.",
    telemetry: "Directory service / Windows security",
    gap: "DG-17",
    status: "Not tested",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-17-dc-persistence.md",
    investigationPath: "04-Investigation/Stages/stage-17-dc-persistence.md",
  },
  {
    id: "18",
    slug: "collection",
    title: "Collection",
    phase: "impact",
    tactic: "Collection",
    technique: "Data from Local System",
    techniqueId: "T1005",
    plain: "The attacker gathers and stages the data they want to take.",
    attacker: "Identifies useful files and stages them in a temporary location.",
    defender:
      "File-access and process telemetry show staging, archive creation, or unusual reads.",
    evidence: "File list, staging path, hashes, and the process that created the archive.",
    telemetry: "File / process",
    gap: "DG-18",
    status: "Not tested",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-18-collection.md",
    investigationPath: "04-Investigation/Stages/stage-18-collection.md",
  },
  {
    id: "19",
    slug: "exfiltration",
    title: "Exfiltration",
    phase: "impact",
    tactic: "Exfiltration",
    technique: "Exfiltration Over C2 Channel",
    techniqueId: "T1041",
    plain: "The attacker sends the staged data out of the network.",
    attacker:
      "Transfers the staged data to an external destination over an allowed channel.",
    defender:
      "Egress volume and destination reputation stand out against the host baseline. Gateway flow records carry the evidence.",
    evidence: "Source, destination redacted, protocol, volume, and file hashes.",
    telemetry: "Network / gateway flow",
    gap: "DG-19",
    status: "Not tested",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-19-exfiltration.md",
    investigationPath: "04-Investigation/Stages/stage-19-exfiltration.md",
  },
  {
    id: "20",
    slug: "impact",
    title: "Impact",
    phase: "impact",
    tactic: "Impact",
    technique: "Internal Defacement",
    techniqueId: "T1491.001",
    plain:
      "The attacker leaves visible damage to prove access and complicate recovery.",
    attacker: "Creates defacement artifacts on the victim host.",
    defender:
      "FIM and process telemetry capture new files and the process that wrote them.",
    evidence: "Artifact paths, hashes, timestamps, and the affected host.",
    telemetry: "FIM / process / file",
    gap: "DG-20",
    status: "Not tested",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-20-impact.md",
    investigationPath: "04-Investigation/Stages/stage-20-impact.md",
  },
];

export const chapters = [
  {
    n: "01",
    id: "lab-setup",
    title: "Lab setup",
    promise: "Where this happened, what the attacker could reach, and where visibility stops.",
    handoff: "A boundary that narrow tells you where to look. Now the intrusion.",
    lens: {
      executive:
        "The design reduces exposure to one public port and keeps the SOC private. It also names the blind spot: traffic that never crosses the gateway is not Suricata's evidence.",
      technical:
        "Kali sits on an isolated NAT segment. Victims sit behind a Suricata gateway on a routed subnet. Wazuh and TheHive run in private cloud VNets reached over WireGuard. Suricata sees cross-segment flows; same-subnet movement needs host telemetry.",
      hiring:
        "This chapter shows network segmentation, VPN ingress, private cloud peering, and a visibility boundary documented before it became a convenient excuse.",
    },
    proof: "01-Lab-Setup/architecture.md · 01-Lab-Setup/network-topology.md",
  },
  {
    n: "02",
    id: "attack",
    title: "Attack simulation",
    promise: "What the attacker did, in 20 documented stages.",
    handoff: "Twenty things happened. Twenty checks decide whether anyone could have known.",
    lens: {
      executive:
        "The campaign moves from a web foothold to domain impact. The defensive value is the evidence plan attached to each stage, not the attacker's success.",
      technical:
        "Four phases, twenty stages. Each stage carries an ATT&CK technique, a required data source, a gap ID, and a case assignment. The stage status is Not tested until the alert path is verified.",
      hiring:
        "A structured campaign rather than a tool dump: every stage has an expected signal and a place in the investigation record.",
    },
    proof: "02-Attack-Simulation/README.md · 02-Attack-Simulation/Stages/",
  },
  {
    n: "03",
    id: "detection",
    title: "Detection engineering",
    promise: "Could the SOC have seen it? The answer is not yes yet.",
    handoff: "A written rule is a hypothesis. The case record is where it becomes evidence.",
    lens: {
      executive:
        "Twenty detection checks are defined. None has been validated. A written rule is a hypothesis, not coverage; the site keeps that distinction visible.",
      technical:
        "Each stage maps to telemetry and a gap ID. Offline stages 04 and 11 have no direct network signal and must be inferred from adjacent events. Detection requires the rule to fire for the right reason and produce an actionable alert.",
      hiring:
        "Detection engineering is treated as a testable discipline: define the signal, execute the stage, verify the alert, record the gap.",
    },
    proof: "03-Detection-Engineering/coverage-matrix.md · 03-Detection-Engineering/README.md",
  },
  {
    n: "04",
    id: "investigation",
    title: "Investigation",
    promise: "How the campaign was scoped into three cases — and what is still open.",
    handoff: "The case work becomes a record. The record must say what it cannot prove.",
    lens: {
      executive:
        "Three cases separate web compromise, credential and lateral movement, and domain impact. The structure keeps one incident from becoming twenty disconnected tickets.",
      technical:
        "Case 01 covers 01–07, Case 02 covers 08–14, Case 03 covers 15–20. Each case is a TheHive record with scope, observables, tasks, and a verdict; the stage notes hold the technique-level detail.",
      hiring:
        "The case map shows triage judgment: group by incident boundary, not by tool or by stage count.",
    },
    proof: "04-Investigation/README.md · 04-Investigation/Cases/",
  },
  {
    n: "05",
    id: "report",
    title: "Incident report",
    promise: "What the record can say — and what it cannot.",
    handoff: "Every claim needs a file behind it. The evidence ledger is the last chapter.",
    lens: {
      executive:
        "The report is a draft. It will state exposure, control, and residual gap. It will not claim detection success that has not been tested.",
      technical:
        "The package follows NIST SP 800-61r3 and PICERL. Confirmed facts, hypotheses, and recommended actions are kept separate; response actions are marked executed only when they were.",
      hiring:
        "The writing rules are explicit: every claim links to a stage, a log, or a screenshot, and missing evidence is named rather than hidden.",
    },
    proof: "05-Incident-Report/README.md · 05-Incident-Report/incident-report.md",
  },
  {
    n: "06",
    id: "evidence",
    title: "Evidence & resources",
    promise: "Where the proof lives — and what is still missing.",
    handoff: "The repository is the record. This site is the reading layer.",
    lens: {
      executive:
        "The architecture and network documentation are captured. Attack and alert evidence is still being reviewed, so the ledger does not overstate the record.",
      technical:
        "The ledger separates captured artifacts from pending ones. The missing alert-screenshot path is treated as a documented gap, not a broken link.",
      hiring:
        "Evidence maturity is part of the work: documented, scaffolded, draft, pending. The labels are the proof of rigor.",
    },
    proof: "INDEX.md · 06-Resources/README.md · 06-Resources/Diagrams/soc-lab.png",
  },
] as const;

export const cases = [
  {
    id: "case-01",
    label: "Case 01",
    title: "Web application compromise",
    scope: "DVWA initial access through root on the web host.",
    stages: ["01", "02", "03", "04", "05", "06", "07"],
    question:
      "How did the web tier fall, and what did the attacker gain before leaving it?",
    status: "Scaffolded · verdict open",
    path: "04-Investigation/Cases/case-01-web-compromise.md",
  },
  {
    id: "case-02",
    label: "Case 02",
    title: "Lateral movement and credential access",
    scope: "Persistence on the web host through domain credential exposure.",
    stages: ["08", "09", "10", "11", "12", "13", "14"],
    question:
      "How did the attacker move from the web host into the domain, and which hops were invisible to Suricata?",
    status: "Scaffolded · verdict open",
    path: "04-Investigation/Cases/case-02-lateral-movement.md",
  },
  {
    id: "case-03",
    label: "Case 03",
    title: "Domain compromise and impact",
    scope: "Pass-the-Hash through collection, exfiltration, and impact.",
    stages: ["15", "16", "17", "18", "19", "20"],
    question:
      "What domain control was obtained, what data left, and what recovery evidence is missing?",
    status: "Scaffolded · verdict open",
    path: "04-Investigation/Cases/case-03-domain-compromise.md",
  },
] as const;

export const workflow = [
  { n: "01", title: "Receive", text: "Record the alert ID, rule ID, source, and timestamp." },
  { n: "02", title: "Triage", text: "Decide true positive, false positive, or benign; set severity and handling." },
  { n: "03", title: "Scope", text: "Assign the event to one of the three cases by incident boundary." },
  { n: "04", title: "Collect", text: "Add observables and preserve the logs, flows, and host artifacts." },
  { n: "05", title: "Correlate", text: "Build the timeline and test the stage against the expected signal." },
  { n: "06", title: "Conclude", text: "Write the verdict, update the detection status, and close the record." },
] as const;

export const reportDocs = [
  {
    title: "Incident report",
    purpose: "Summary, scope, analysis, impact, and recommendations.",
    path: "05-Incident-Report/incident-report.md",
  },
  {
    title: "Timeline",
    purpose: "Consolidated attack and response timeline.",
    path: "05-Incident-Report/timeline.md",
  },
  {
    title: "IOCs",
    purpose: "Indicators with confidence and source stage.",
    path: "05-Incident-Report/iocs.md",
  },
  {
    title: "ATT&CK mapping",
    purpose: "Stage-by-stage technique mapping and detection status.",
    path: "05-Incident-Report/mitre-attack-mapping.md",
  },
  {
    title: "Response actions",
    purpose: "Containment, eradication, and recovery actions.",
    path: "05-Incident-Report/response-actions.md",
  },
  {
    title: "Lessons learned",
    purpose: "What worked, what failed, and what changes next.",
    path: "05-Incident-Report/lessons-learned.md",
  },
] as const;

export const evidenceItems = [
  {
    label: "Architecture diagram",
    value: "Captured",
    tone: "teal",
    note: "High-level overview. The network-topology tables are authoritative for addresses and flows.",
    path: "06-Resources/Diagrams/soc-lab.png",
  },
  {
    label: "Network topology",
    value: "Captured",
    tone: "teal",
    note: "Segments, flows, ports, and the Suricata visibility boundary.",
    path: "01-Lab-Setup/network-topology.md",
  },
  {
    label: "Attack screenshots",
    value: "Pending review",
    tone: "amber",
    note: "Capture exists, but images are not published until redaction review is complete.",
    path: "02-Attack-Simulation/Attack-Screenshots/",
  },
  {
    label: "Alert screenshots",
    value: "Pending review",
    tone: "amber",
    note: "The alert evidence path is still a documented gap, not a published gallery.",
    path: "03-Detection-Engineering/TheHive_Alert-ScreenShot/",
  },
  {
    label: "Investigation cases",
    value: "Scaffolded",
    tone: "blue",
    note: "Three case records with scope and questions; verdicts remain open.",
    path: "04-Investigation/Cases/",
  },
  {
    label: "Incident report",
    value: "Draft",
    tone: "rose",
    note: "The report package is scaffolded; no detection success is claimed.",
    path: "05-Incident-Report/incident-report.md",
  },
] as const;

export const statusLegend = [
  { status: "Detected", meaning: "Telemetry and a rule existed, and the rule fired." },
  { status: "Logging gap", meaning: "Required telemetry was not collected." },
  { status: "Detection gap", meaning: "Telemetry existed, but no rule covered the behavior." },
  { status: "Rule failure", meaning: "A rule existed, but did not fire as expected." },
  { status: "Not tested", meaning: "Stage not yet validated." },
] as const;

export const stageById = (id: string) => stages.find((stage) => stage.id === id);

export const stageCount = stages.length;
export const untestedCount = stages.filter((stage) => stage.status === "Not tested").length;
export const verifiedCount = stages.filter((stage) => stage.status === "Detected").length;
