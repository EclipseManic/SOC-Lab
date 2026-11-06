import generatedAlerts from "./generated/alerts.json";
import generatedMetrics from "./generated/metrics.json";
import generatedNetwork from "./generated/network.json";
import generatedStages from "./generated/stages.json";
import generatedTimeline from "./generated/timeline.json";

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
  ruleId?: string;
  alertRef?: string;
}

export const phases: Record<
  Phase,
  { label: string; short: string; range: string; tone: string }
> = {
  web: {
    label: "Web foothold",
    short: "Web",
    range: "01-07",
    tone: "text-ok border-ok/30 bg-ok-soft",
  },
  cred: {
    label: "Credential access & lateral movement",
    short: "Credential",
    range: "08-14",
    tone: "text-cool border-cool/30 bg-cool-soft",
  },
  domain: {
    label: "Domain compromise",
    short: "Domain",
    range: "15-17",
    tone: "text-accent border-accent/30 bg-accent-soft",
  },
  impact: {
    label: "Collection, exfiltration & impact",
    short: "Impact",
    range: "18-20",
    tone: "text-bad border-bad/30 bg-bad-soft",
  },
};

const stageCopy: Stage[] = [
  {
    id: "01",
    slug: "recon",
    title: "Reconnaissance",
    phase: "web",
    tactic: "Reconnaissance",
    technique: "Active Scanning",
    techniqueId: "T1595.001",
    plain:
      "The attacker uses Nmap to map live hosts, open ports (SSH 22, Apache 80), service versions, and OS fingerprints across the victim subnet.",
    attacker:
      "Runs fast SYN scans, service version detection, and OS fingerprinting from Kali against 192.168.56.30.",
    defender:
      "Suricata NIDS detects Nmap TCP SYN scan (SID 3400001/3400002), OS probe (SID 2018489), and multi-port scanning (SID 2010937). Wazuh correlates Rule 86601.",
    evidence:
      "Nmap terminal output, Suricata eve-alert.json alerts, and TheHive alert wzb-3a8045a03c.",
    telemetry: "Network flow / IDS",
    gap: "DG-01",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-01-recon.md",
    investigationPath: "04-Investigation/Stages/stage-01-recon.md",
    ruleId: "Wazuh 86601 / SID 2018489, 3400001, 3400002",
    alertRef: "wzb-3a8045a03c",
  },
  {
    id: "02",
    slug: "bruteforce",
    title: "Brute Force",
    phase: "web",
    tactic: "Credential Access",
    technique: "Password Guessing",
    techniqueId: "T1110.001",
    plain:
      "The attacker automates credential guessing with a custom Python script and web directory fuzzing with Nikto against DVWA.",
    attacker:
      "Sends high-frequency HTTP POST requests with wordlists to the DVWA login form until finding admin/password.",
    defender:
      "Suricata flags automated Python requests (SID 2017515/2000547); Custom Wazuh Rule 100600 (TheHive Alert #11) & Rule 100200 correlate authentication brute-force activity with Apache 401 logs.",
    evidence:
      "Python brute-force script terminal success, Apache access.log POST bursts, and TheHive alert wzb-6a22425401.",
    telemetry: "Web server access logs",
    gap: "DG-02",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-02-bruteforce.md",
    investigationPath: "04-Investigation/Stages/stage-02-bruteforce.md",
    ruleId: "Suricata SID 2017515 / Custom Wazuh Rule 100600 & Rule 100200",
    alertRef: "wzb-6a22425401",
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
      "The attacker injects crafted UNION SELECT SQL payloads into DVWA to extract backend database user credentials and password hashes.",
    attacker:
      "Submits `' UNION SELECT user, password FROM users-- -` into the vulnerable ID field, dumping user password hashes.",
    defender:
      "Suricata detects SELECT USER SQL injection in URI (SID 2010963, ET WEB_SERVER). Wazuh decodes Apache access log with Rule 31106.",
    evidence:
      "Browser SQLi dump, raw HTTP GET payload in eve-alert.json (Row 9108), and Wazuh rule 31106 alert.",
    telemetry: "HTTP / Network IDS / Web logs",
    gap: "DG-03",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-03-sqli.md",
    investigationPath: "04-Investigation/Stages/stage-03-sqli.md",
    ruleId: "Suricata SID 2010963 / Wazuh 31106",
    alertRef: "Row 9108 (CSV) / Wazuh 31106",
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
      "The extracted MD5 password hashes are cracked offline on the attacker workstation using Hashcat and rockyou.txt.",
    attacker:
      "Executes Hashcat mode 0 locally on Kali GPU to recover the plaintext password for user admin.",
    defender:
      "Inherent offline architectural gap (DG-04). Cracking occurs entirely outside the monitored victim network with zero host or network telemetry.",
    evidence:
      "Offline Hashcat output on Kali. No victim telemetry exists by definition.",
    telemetry: "Offline (none)",
    gap: "DG-04",
    status: "Detection gap",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-04-hash-crack.md",
    investigationPath: "04-Investigation/Stages/stage-04-hash-crack.md",
    ruleId: "N/A (Offline Attacker GPU)",
    alertRef: "Offline activity",
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
      "The attacker abuses an unrestricted file upload vulnerability to drop a PHP web shell backdoor (`shell.php`) into the web root.",
    attacker:
      "Uploads a PHP command shell to `/hackable/uploads/shell.php` and executes arbitrary commands via HTTP GET query parameters.",
    defender:
      "Suricata detects web shell id response (SID 2019284). Linux Auditd intercepts execve(/usr/bin/id) under uid=33, matching Wazuh Rule 100199 (Level 10).",
    evidence:
      "Uploaded shell file path, Suricata response alert in eve-alert.json, and TheHive alert wzb-e9a1797ac4.",
    telemetry: "Network IDS / Auditd execve",
    gap: "DG-05",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-05-webshell.md",
    investigationPath: "04-Investigation/Stages/stage-05-webshell.md",
    ruleId: "Suricata SID 2019284 / Wazuh 100199 / Auditd",
    alertRef: "wzb-e9a1797ac4",
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
      "The attacker uses the web shell to execute a Python reverse shell payload, connecting back to a netcat listener on Kali.",
    attacker:
      "Executes Python socket payload on DVWA to initiate an outbound TCP connection to Kali (192.168.232.135:4444).",
    defender:
      "Suricata detects outbound reverse shell on TCP 4444 (SID 3400020, POSSBL SCAN SHELL M-SPLOIT TCP). Wazuh Rule 100199 flags netcat execution.",
    evidence:
      "Netcat shell prompt on Kali, Suricata reverse shell alert, and TheHive alert wzb-81bb1f83f7.",
    telemetry: "Process / Network IDS",
    gap: "DG-06",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-06-reverse-shell.md",
    investigationPath: "04-Investigation/Stages/stage-06-reverse-shell.md",
    ruleId: "Suricata SID 3400020 / Wazuh 100199",
    alertRef: "wzb-81bb1f83f7",
  },
  {
    id: "07",
    slug: "privesc",
    title: "Privilege Escalation",
    phase: "web",
    tactic: "Privilege Escalation",
    technique: "Sudo and Sudo Caching",
    techniqueId: "T1548.003",
    plain:
      "The attacker escalates from service account `www-data` to `root` on DVWA using a misconfigured sudo privilege (`sudo python3`).",
    attacker:
      "Spawns an interactive root shell via `sudo python3 -c 'import os;os.system(\"/bin/bash\")'` using GTFOBins sudoers misconfiguration.",
    defender:
      "Linux PAM authentication logs captured by Wazuh Rule 5402 (12 instances) showing root privilege escalation via passwordless sudo Python (GTFOBins).",
    evidence:
      "Root shell ID output, /var/log/auth.log sudo log entry (12x PAM alerts), and TheHive alert wzb-ccae331b77.",
    telemetry: "Linux auth / PAM logs",
    gap: "DG-07",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-07-privesc.md",
    investigationPath: "04-Investigation/Stages/stage-07-privesc.md",
    ruleId: "Wazuh 5402 (PAM) / Auditd",
    alertRef: "wzb-ccae331b77",
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
      "The attacker implants an SSH public key into `/root/.ssh/authorized_keys` on the DVWA pivot for durable administrative access.",
    attacker:
      "Appends attacker SSH public key to `/root/.ssh/authorized_keys` and logs in directly as root from Kali via SSH.",
    defender:
      "Wazuh Syscheck (FIM) detects unauthorized file modification to authorized_keys (Rule 550); auth.log flags root SSH login (Rule 5715).",
    evidence:
      "SSH session banner, Wazuh Syscheck checksum diff, and TheHive alert wzb-1208f0ea54.",
    telemetry: "FIM / Linux auth logs",
    gap: "DG-08",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-08-ssh-persistence.md",
    investigationPath: "04-Investigation/Stages/stage-08-ssh-persistence.md",
    ruleId: "Wazuh 5715 / Rule 100220",
    alertRef: "wzb-1208f0ea54",
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
      "The attacker uses the compromised DVWA host as an internal pivot to scan and enumerate Active Directory domain targets on 192.168.56.0/24.",
    attacker:
      "Scans the internal victim subnet from DVWA, identifying Domain Controller (192.168.56.10) and Windows 10 (192.168.56.20).",
    defender:
      "Suricata promiscuous capture on ens37 detects internal reconnaissance sweep (SIDs 3400001, 3400002, 3400020). Target-side L2 logging gap documented (DG-09).",
    evidence:
      "Pivot scan output, Suricata internal sweep alert (14 victim-to-victim alerts in CSV), and TheHive alert wzb-3152e3ed59.",
    telemetry: "Host process / Network IDS",
    gap: "DG-09",
    status: "Logging gap",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-09-internal-discovery.md",
    investigationPath: "04-Investigation/Stages/stage-09-internal-discovery.md",
    ruleId: "Suricata SIDs 3400001, 3400002, 3400020 on ens37",
    alertRef: "wzb-3152e3ed59",
  },
  {
    id: "10",
    slug: "responder",
    title: "Responder Poisoning",
    phase: "cred",
    tactic: "Credential Access",
    technique: "LLMNR/NBT-NS Poisoning and Relay",
    techniqueId: "T1557.001",
    plain:
      "The attacker launches Responder on the DVWA pivot to poison LLMNR/NBT-NS multicast broadcasts and intercept Windows NetNTLMv2 hashes.",
    attacker:
      "Runs Responder on interface ens37, responding to broadcast name queries from Windows 10 and capturing user NetNTLMv2 challenge responses.",
    defender:
      "Wazuh bashcmd logging captures uid:0 Responder execution on the pivot host (CSV row 9231); endpoint logs record the NTLMv2 capture.",
    evidence:
      "Captured NetNTLMv2 hash string, Wazuh bashcmd execution log on DVWA, and Hashcat crack file.",
    telemetry: "Endpoint command / Windows auth",
    gap: "DG-10",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-10-responder.md",
    investigationPath: "04-Investigation/Stages/stage-10-responder.md",
    ruleId: "Wazuh bashcmd (uid:0 Responder.py)",
    alertRef: "CSV row 9231 (Level 5)",
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
      "The intercepted NetNTLMv2 challenge-response hash is cracked offline on Kali using Hashcat mode 5600 to recover the Windows user password.",
    attacker:
      "Cracks the captured NetNTLMv2 hash on Kali GPU using Hashcat, recovering the plaintext credentials (`win10:<REDACTED>`).",
    defender:
      "Inherent offline architectural gap (DG-11). Cracking occurs entirely on the attacker GPU; zero victim telemetry is generated.",
    evidence:
      "Hashcat cracked output on Kali. Offline activity producing no host or network telemetry.",
    telemetry: "Offline (none)",
    gap: "DG-11",
    status: "Detection gap",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md",
    investigationPath: "04-Investigation/Stages/stage-11-ntlmv2-crack.md",
    ruleId: "N/A (Offline Attacker GPU)",
    alertRef: "Offline activity",
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
      "The attacker runs bloodhound-python from Kali via the pivot host to ingest Active Directory objects and graph the fastest path to Domain Admin.",
    attacker:
      "Executes bloodhound-python via LDAP against the Domain Controller, exporting 2,493 user and group trust relationships into Neo4j.",
    defender:
      "Wazuh Rule 5715 detects repeated root SSH administrative sessions on pivot. Active Directory LDAP search filter gap documented (DG-12).",
    evidence:
      "BloodHound graph export, SSH logon logs on DVWA, and TheHive alert wzb-dbf3197ceb.",
    telemetry: "Linux auth / LDAP query logs",
    gap: "DG-12",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-12-bloodhound.md",
    investigationPath: "04-Investigation/Stages/stage-12-bloodhound.md",
    ruleId: "Wazuh 5715 (Pivot Session)",
    alertRef: "wzb-dbf3197ceb",
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
      "The attacker requests a Kerberos TGS service ticket for service account `HANK_SHERMAN` (`CIFS/AWSWAPPS1000000`) and cracks it offline.",
    attacker:
      "Uses Impacket `GetUserSPNs.py` with valid domain credentials to request an RC4-encrypted TGS ticket for user HANK_SHERMAN.",
    defender:
      "Suricata captures Kerberos TGS-REQ wire frames on port 88 (SID 2019922, ET EXPLOIT Possible GoldenPac Priv Esc in-use); Wazuh Rule 100220 captures verbatim command and Rule 5715 captures pivot SSH session.",
    evidence:
      "Extracted TGS ticket hash, Suricata Kerberos wire alert, and TheHive alert wzb-1d2d7fb4b8.",
    telemetry: "Kerberos Wire / Linux auth logs",
    gap: "DG-13",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-13-kerberoasting.md",
    investigationPath: "04-Investigation/Stages/stage-13-kerberoasting.md",
    ruleId: "Suricata SID 2019922 (via 86601) + Wazuh 100220 & 5715",
    alertRef: "wzb-1d2d7fb4b8",
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
      "Using recovered Domain Admin privileges, the attacker executes DCSync to impersonate a domain controller and extract NTDS.dit hashes.",
    attacker:
      "Executes Impacket `secretsdump.py` targeting PC-DC to trigger DRSUAPI directory replication and dump the KRBTGT and Administrator NT hashes.",
    defender:
      "Windows Security EID 4662 (Directory Service Access with DS-Replication-Get-Changes rights) flagged by Wazuh Rule 60144.",
    evidence:
      "Secretsdump terminal output, DC Event ID 4662 audit log, and TheHive alert wzb-4174e3672e.",
    telemetry: "Directory Service / DRSUAPI",
    gap: "DG-14",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-14-dcsync.md",
    investigationPath: "04-Investigation/Stages/stage-14-dcsync.md",
    ruleId: "Windows 4662 / Wazuh 60144",
    alertRef: "wzb-4174e3672e",
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
      "The attacker uses the extracted Administrator NT hash to authenticate to Windows 10 without knowing the plaintext password.",
    attacker:
      "Authenticates to Windows 10 (192.168.56.20) via SMB using Administrator NTLM hash with Impacket `wmiexec.py`.",
    defender:
      "Windows Security EID 4624 flags Logon Type 3 NTLM authentication (24 events in CSV: 15 on Win10, 9 on DC); Wazuh Rule 100613 alerts on WMI process fan-out.",
    evidence:
      "Wmiexec session banner, Windows Security EID 4624 NTLM logon events, and TheHive alert wzb-b7f91cd3ab.",
    telemetry: "Windows Security EID 4624 / Sysmon EID 1",
    gap: "DG-15",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-15-pass-the-hash.md",
    investigationPath: "04-Investigation/Stages/stage-15-pass-the-hash.md",
    ruleId: "Windows EID 4624 / Wazuh 100613",
    alertRef: "wzb-b7f91cd3ab",
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
      "The attacker forges a Kerberos Ticket Granting Ticket (TGT) using the dumped KRBTGT hash for unrestricted, persistent domain access.",
    attacker:
      "Forges Golden Ticket using Impacket `ticketer.py` with KRBTGT hash and requests access to domain services.",
    defender:
      "Linux Pivot Wazuh Rule 100220 captures ticketer.py command execution; Custom Rule 100613 triggers TheHive Alerts #27 and #28 upon wmiexec connection.",
    evidence:
      "Ticket ccache file metadata, DC Kerberos audit log, and TheHive alerts wzb-ccff195e0c & wzb-c200f52606.",
    telemetry: "Kerberos / DC Security logs",
    gap: "DG-16",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-16-golden-ticket.md",
    investigationPath: "04-Investigation/Stages/stage-16-golden-ticket.md",
    ruleId: "Linux Pivot Wazuh Rule 100220 (ticketer.py) + Alerts #27, #28",
    alertRef: "wzb-ccff195e0c, wzb-c200f52606",
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
      "The attacker creates a rogue backdoor domain user (`backdoor`) and adds it to the Domain Admins group for permanent redundancy.",
    attacker:
      "Executes `net user backdoor ... /add` and `net group \"Domain Admins\" backdoor /add` on PC-DC via Impacket `wmiexec`.",
    defender:
      "Wazuh custom Rule 100613 flags Impacket wmiexec execution via WMI; Windows Security EID 4720 and 4728 alert on account creation.",
    evidence:
      "Backdoor account in Active Directory, Sysmon command line event, and TheHive alert wzb-26b4d06a63.",
    telemetry: "Sysmon / AD Security logs",
    gap: "DG-17",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-17-dc-persistence.md",
    investigationPath: "04-Investigation/Stages/stage-17-dc-persistence.md",
    ruleId: "Wazuh 100613, 60109",
    alertRef: "wzb-26b4d06a63",
  },
  {
    id: "18",
    slug: "collection",
    title: "Collection",
    phase: "impact",
    tactic: "Collection",
    technique: "Data from Local System",
    techniqueId: "T1005",
    plain:
      "The attacker collects sensitive host and domain information (user lists, privilege tokens, system files) into staging archives.",
    attacker:
      "Runs automated collection commands (`net user /domain`, `whoami /all`) via wmiexec, piping outputs to staging files.",
    defender:
      "Wazuh custom Rule 100613 detects repeated Impacket wmiexec process fan-outs and redirection output commands.",
    evidence:
      "Staged text archives, Sysmon Process Creation events, and TheHive alert wzb-aa66cb916a.",
    telemetry: "Sysmon / Process monitoring",
    gap: "DG-18",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-18-collection.md",
    investigationPath: "04-Investigation/Stages/stage-18-collection.md",
    ruleId: "Wazuh 100613 (Fan-out)",
    alertRef: "wzb-aa66cb916a",
  },
  {
    id: "19",
    slug: "exfiltration",
    title: "Exfiltration",
    phase: "impact",
    tactic: "Exfiltration",
    technique: "Exfiltration Over C2 Channel",
    techniqueId: "T1041",
    plain:
      "The attacker stages collected data on the DVWA pivot and exfiltrates it to the Kali attacker workstation over an encrypted SCP channel.",
    attacker:
      "Uses SCP over SSH (port 22) to pull compressed evidence archives from 192.168.56.30 back to Kali.",
    defender:
      "Wazuh Rule 5715 detects anomalous administrative SSH burst (6 consecutive sessions within 1 second). Encrypted payload gap documented (DG-19).",
    evidence:
      "SCP transfer logs on Kali, /var/log/auth.log SSH burst, and TheHive alert wzb-34f34a857c.",
    telemetry: "Linux auth / Network flow",
    gap: "DG-19",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-19-exfiltration.md",
    investigationPath: "04-Investigation/Stages/stage-19-exfiltration.md",
    ruleId: "Wazuh 5715 (Pivot Burst)",
    alertRef: "wzb-34f34a857c",
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
      "The attacker deploys defacement wallpaper, drops ransom notes, sets registry keys, and forces a system reboot, completing the intrusion.",
    attacker:
      "Deploys defacement wallpaper (`wallpaper.bmp`), drops `README_RESTORE_FILES.txt`, modifies registry, and issues reboot via Impacket wmiexec.",
    defender:
      "Wazuh Rule 100613 flags Impacket wmiexec process fan-out; Sysmon EID 1 tracks registry modification; Suricata flags SMB NTLM session setup (SIDs 2067085-2067087).",
    evidence:
      "Defaced wallpaper screenshot, Windows Sysmon Process Creation events, and TheHive alert wzb-71ef983ad8.",
    telemetry: "Sysmon EID 1 / Suricata SMB NTLM",
    gap: "DG-20",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-20-impact.md",
    investigationPath: "04-Investigation/Stages/stage-20-impact.md",
    ruleId: "Wazuh 100613 / Sysmon EID 1 / Suricata SIDs 2067085-2067087",
    alertRef: "wzb-71ef983ad8, wzb-7a4a134d1b",
  },
];

type GeneratedStage = {
  id: string;
  title: string;
  techniqueId: string;
  attackPath: string | null;
  alertObserved: string;
  ruleAlertId: string;
  investigationPath: string | null;
  caseLabel: string;
  status: StageStatus;
};

const generatedStageById = new Map(
  (generatedStages.stages as GeneratedStage[]).map((stage) => [stage.id, stage]),
);

export const stages: Stage[] = stageCopy.map((stage) => {
  const generated = generatedStageById.get(stage.id);
  if (!generated) return stage;

  return {
    ...stage,
    title: generated.title,
    techniqueId: generated.techniqueId,
    status: generated.status,
    caseLabel: generated.caseLabel,
    attackPath: generated.attackPath ?? stage.attackPath,
    investigationPath: generated.investigationPath ?? stage.investigationPath,
    ruleId: generated.ruleAlertId || stage.ruleId,
    alertRef: generated.alertObserved || stage.alertRef,
  };
});

export const metrics = generatedMetrics;
export const timeline = generatedTimeline;
export const alerts = generatedAlerts;
export const network = generatedNetwork;
export const traceability = generatedStages.stages;
export const reportDocumentStatuses = metrics.reportDocumentStatuses;

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
    proof: "01-Lab-Setup/README.md",
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
        "Four phases, twenty stages. Each stage carries an ATT&CK technique, a required data source, a gap ID, and a case assignment, with 16 stages validated and documented.",
      hiring:
        "A structured campaign rather than a tool dump: every stage has an expected signal and a place in the investigation record.",
    },
    proof: "02-Attack-Simulation/README.md · 02-Attack-Simulation/Stages/",
  },
  {
    n: "03",
    id: "detection",
    title: "Detection engineering",
    promise: "Could the SOC have seen it? 16 of 20 stages produced verified alerts.",
    handoff: "A written rule is a hypothesis. The case record is where it becomes evidence.",
    lens: {
      executive:
        "Twenty detection checks were executed. 16 stages produced actionable alerts in TheHive; 2 stages occurred offline on the attacker GPU; 2 had documented visibility limits.",
      technical:
        "16 of 20 stages produced verified alerts across Suricata signatures and Wazuh rules (Level >= 8). Offline stages 04 and 11 generate zero victim telemetry. Gap register DG-01 to DG-20 tracks remediation.",
      hiring:
        "Detection engineering is treated as a testable discipline: define the signal, execute the stage, verify the alert, record the gap.",
    },
    proof: "03-Detection-Engineering/README.md",
  },
  {
    n: "04",
    id: "investigation",
    title: "Investigation",
    promise: "How the campaign was scoped into three cases, and what is still open.",
    handoff: "The case work becomes a record. The record must say what it cannot prove.",
    lens: {
      executive:
        "Three cases separate web compromise, credential and lateral movement, and domain impact. The structure keeps one incident from becoming twenty disconnected tickets.",
      technical:
        "Case 01 covers 01-07, Case 02 covers 08-14, Case 03 covers 15-20. Each case is a TheHive record with scope, observables, tasks, and a verdict; the stage notes hold the technique-level detail.",
      hiring:
        "The case map shows triage judgment: group by incident boundary, not by tool or by stage count.",
    },
    proof: "04-Investigation/README.md · 04-Investigation/Cases/",
  },
  {
    n: "05",
    id: "report",
    title: "Incident report",
    promise: "What the record can say, and what it cannot.",
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
    promise: "Where the proof lives, and what is still missing.",
    handoff: "The repository is the record. This site is the reading layer.",
    lens: {
      executive:
        "The architecture and network documentation are captured. Attack and alert evidence are published in dedicated directories.",
      technical:
        "The ledger separates captured artifacts from pending ones. Visual proof spans 60 attack screenshots and 23 alert captures in TheHive.",
      hiring:
        "Evidence maturity is part of the work: verified, documented, draft. The labels are the proof of rigor.",
    },
    proof: "INDEX.md · 06-Resources/README.md · 06-Resources/diagrams/SOC_Lab_Architecture.png",
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
    status: "Completed & Formally Validated",
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
    status: "Completed & Formally Validated",
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
    status: "Completed & Formally Validated",
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

export const evidenceReel = [
  { stageId: "01", attack: "/evidence/01.webp", alert: "/evidence/01-alert.webp", caption: "Recon starts as a packet pattern, then becomes an alert." },
  { stageId: "03", attack: "/evidence/03.webp", alert: "/evidence/03-alert.webp", caption: "The SQL payload is visible on the wire and in the case record." },
  { stageId: "07", attack: "/evidence/07.webp", alert: "/evidence/07-alert.webp", caption: "Privilege escalation leaves a PAM and audit trail." },
  { stageId: "13", attack: "/evidence/13.webp", alert: "/evidence/13-alert.webp", caption: "Kerberoasting is a request, a ticket, and a rule ID." },
  { stageId: "17", attack: "/evidence/17.webp", alert: "/evidence/17-alert.webp", caption: "A backdoor account lands in the domain logon record." },
] as const;

export const evidenceItems = [
  {
    label: "Raw Alert Exports",
    value: "Captured",
    tone: "teal",
    note: "Authentic TheHive 5 alert JSON and Wazuh alert CSV exports preserved in 06-Resources/alerts/.",
    path: "06-Resources/alerts/",
  },
  {
    label: "Architecture diagram",
    value: "Captured",
    tone: "teal",
    note: "High-level overview. The architecture & network tables are authoritative for addresses and flows.",
    path: "06-Resources/diagrams/SOC_Lab_Architecture.png",
  },
  {
    label: "Architecture & Network",
    value: "Captured",
    tone: "teal",
    note: "Unified 3-tier model, segments, flows, ports, and the Suricata visibility boundary.",
    path: "01-Lab-Setup/README.md",
  },
  {
    label: "Attack screenshots",
    value: "Captured",
    tone: "teal",
    note: "Comprehensive visual chain across all 20 stages in 06-Resources/screenshots/attack-simulation/.",
    path: "06-Resources/screenshots/attack-simulation/",
  },
  {
    label: "Alert screenshots",
    value: "Captured",
    tone: "teal",
    note: "TheHive alert dashboard and detail captures across all detected stages.",
    path: "06-Resources/screenshots/thehive-alert/",
  },
  {
    label: "Detection Coverage",
    value: "Verified (16/20)",
    tone: "teal",
    note: "16 detected, 2 offline gaps, 2 visibility gaps documented in README.md#3-20-stage-detection-coverage-matrix.",
    path: "03-Detection-Engineering/README.md",
  },
  {
    label: "Investigation cases",
    value: "Validated",
    tone: "teal",
    note: "Three case records with scopes, observables, and timelines; formally validated against empirical telemetry.",
    path: "04-Investigation/Cases/",
  },
  {
    label: "Incident report",
    value: "Validated",
    tone: "teal",
    note: "Post-incident deliverables compiled and formally validated across NIST SP 800-61r2 phases.",
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

export const stageCount = metrics.stageCount;
export const directDetectionCount = metrics.directDetectionCount;
export const operationalAlertCount = metrics.operationalAlertCount;
export const offlineGapCount = metrics.offlineGapCount;
export const loggingGapCount = metrics.targetLoggingGapCount;
export const ruleFailureCount = metrics.ruleFailureCount;
export const untestedCount = stages.filter((stage) => stage.status === "Not tested").length;
export const verifiedCount = operationalAlertCount;
export const gapCount = metrics.totalGapCount;

export interface ResponseAction {
  id: string;
  n: string;
  title: string;
  target: string;
  command: string;
  verification: string;
  tool: string;
  status: string;
}

export const containmentActions: ResponseAction[] = [
  {
    id: "M-01",
    n: "01",
    title: "Perimeter Firewall Isolation & Adversary Drop",
    target: "Suricata Gateway (192.168.56.150)",
    command: "iptables -I INPUT 1 -s 192.168.232.135 -j DROP && iptables -I FORWARD 1 -s 192.168.232.135 -j DROP",
    verification: "Firewall drop counters actively incremented; 0 packets accepted from Kali origin.",
    tool: "iptables / Velociraptor",
    status: "Severed",
  },
  {
    id: "M-02",
    n: "02",
    title: "Reverse Shell Process Termination & PHP Quarantine",
    target: "DVWA Web Host (192.168.56.30)",
    command: "pkill -9 -f nc.openbsd && mv /var/www/.../shell.php /root/quarantine/ && chmod 000 /root/quarantine/shell.php",
    verification: "Netstat confirmed zero active connections on TCP 4444; backdoor isolated.",
    tool: "Bash / Velociraptor",
    status: "Terminated",
  },
  {
    id: "M-03",
    n: "03",
    title: "Rogue SSH Key Revocation & Terminal Session Kill",
    target: "DVWA Web Host (192.168.56.30)",
    command: "sed -i '/ssh-ed25519/d' /root/.ssh/authorized_keys && pkill -9 -t pts/0",
    verification: "Injected adversary ED25519 public key purged; rogue interactive root TTY sessions killed.",
    tool: "Bash / Velociraptor",
    status: "Revoked",
  },
  {
    id: "M-04",
    n: "04",
    title: "Rogue Domain User Lockout (AD\\backdoor)",
    target: "Domain Controller PC-DC (192.168.56.10)",
    command: "Disable-ADAccount -Identity 'backdoor' && Remove-ADGroupMember -Identity 'Domain Admins' -Members 'backdoor'",
    verification: "Account disabled (Enabled: False); DA privileges revoked; object SID preserved for forensic trace.",
    tool: "PowerShell RSAT",
    status: "Disabled",
  },
  {
    id: "M-05",
    n: "05",
    title: "Active Directory Double krbtgt Password Reset",
    target: "Domain Controller PC-DC (192.168.56.10)",
    command: "Set-ADAccountPassword 'krbtgt' -Reset (x2) && klist purge",
    verification: "Key Version Number (msDS-KeyVersionNumber) incremented to KVNO 3; all forged Golden Tickets permanently invalidated.",
    tool: "PowerShell RSAT",
    status: "Invalidated (KVNO 3)",
  },
  {
    id: "M-06",
    n: "06",
    title: "Workstation Loot Quarantine & Wallpaper Restoration",
    target: "Win10User (192.168.56.20) & PC-DC",
    command: "Remove-Item C:\\Users\\Public\\wallpaper.bmp, Desktop\\README_RESTORE_FILES.txt && Set-ItemProperty 'HKCU:\\Control Panel\\Desktop' Wallpaper",
    verification: "Defacement files quarantined; desktop wallpaper registry keys restored to clean baseline.",
    tool: "PowerShell CIM",
    status: "Restored",
  },
  {
    id: "M-07",
    n: "07",
    title: "Web Application Database Credential Rotation",
    target: "DVWA Web Host (192.168.56.30)",
    command: "ALTER USER 'dvwa'@'localhost' IDENTIFIED BY '***'; updated config.inc.php",
    verification: "Exposed database password rotated; connection validated with new secure credential.",
    tool: "MariaDB CLI",
    status: "Rotated",
  },
];

export const hardeningActions: ResponseAction[] = [
  {
    id: "H-01",
    n: "01",
    title: "Secure Loot Shredding & Track-Covering Eradication",
    target: "DVWA Web Host (192.168.56.30)",
    command: "shred -u -z -n 3 /tmp/*.hash /tmp/*.ccache /tmp/dcsync_output* && rm -rf /opt/Responder",
    verification: "Forensic verification confirmed all 9 staging files securely overwritten and deleted; Responder purged.",
    tool: "Linux shred / VQL",
    status: "Overwritten",
  },
  {
    id: "H-02",
    n: "02",
    title: "Sudoers Misconfiguration Revocation & Web Hardening",
    target: "DVWA Web Host (192.168.56.30)",
    command: "rm /etc/sudoers.d/www-data && echo 'php_admin_flag engine off' > /var/www/.../uploads/.htaccess",
    verification: "Sudo GTFOBins vector closed; PHP execution permanently disabled in upload directory.",
    tool: "Bash / Velociraptor",
    status: "Patched",
  },
  {
    id: "H-03",
    n: "03",
    title: "Permanent Rogue Object Purge & Protected Users Enrollment",
    target: "Domain Controller PC-DC (192.168.56.10)",
    command: "Remove-ADUser 'backdoor' && Add-ADGroupMember -Identity 'Protected Users' -Members 'Administrator'",
    verification: "Rogue user purged; LSASS memory credential caching and NTLM delegation permanently blocked for Domain Admins.",
    tool: "PowerShell RSAT",
    status: "Enforced",
  },
  {
    id: "H-04",
    n: "04",
    title: "Kerberoast SPN Revocation & Account Demotion",
    target: "Domain Controller PC-DC (192.168.56.10)",
    command: "Set-ADUser 'HANK_SHERMAN' -Clear ServicePrincipalNames && Remove-ADGroupMember 'Domain Admins' -Members 'HANK_SHERMAN'",
    verification: "SPN CIFS/... unregistered; administrative privileges stripped; AES Kerberos encryption enforced.",
    tool: "PowerShell RSAT",
    status: "Demoted",
  },
  {
    id: "H-05",
    n: "05",
    title: "Domain-Wide LLMNR & NetBIOS Insecure Protocol Disablement",
    target: "Active Directory Group Policy (ad.lab)",
    command: "Set-GPRegistryValue -Name 'Enterprise Hardening' -Key 'HKLM\\Software\\Policies\\Microsoft\\Windows NT\\DNSClient' -ValueName EnableMulticast -Type DWord -Value 0",
    verification: "LLMNR multicast and NetBIOS name resolution disabled across all domain workstations.",
    tool: "Group Policy (GPO)",
    status: "Disabled",
  },
  {
    id: "H-06",
    n: "06",
    title: "Gateway DMZ Host-Isolation Firewall Rules",
    target: "Suricata Gateway (192.168.56.150)",
    command: "iptables -A FORWARD -s 192.168.56.30 -d 192.168.56.0/24 -p tcp -m multiport --dports 445,135,389,88 -j REJECT",
    verification: "Web DMZ severed from Active Directory administrative ports; lateral pivot vector blocked.",
    tool: "iptables / UFW",
    status: "Isolated",
  },
  {
    id: "H-07",
    n: "07",
    title: "TheHive SOAR Case Resolution & Operational Closure",
    target: "TheHive 5 SOAR Platform (10.122.0.4)",
    command: "Mark cases CAS-001, CAS-002, CAS-003 as Resolved / Closed with NIST SP 800-61r2 metrics",
    verification: "All 46 alerts marked completed across TheHive cases; incident officially signed off and archived.",
    tool: "TheHive 5 REST API",
    status: "Closed",
  },
];

export interface RootCause {
  id: string;
  num: string;
  title: string;
  severity: "Critical" | "High";
  flaw: string;
  exploit: string;
  fix: string;
}

export const rootCauses: RootCause[] = [
  {
    id: "RC-01",
    num: "01",
    title: "Default Web Application Credentials",
    severity: "High",
    flaw: "DVWA portal was configured with default administrative credentials (admin/password).",
    exploit: "Attacker used automated dictionary attack (Stage 02) to gain web portal administrative access in seconds.",
    fix: "Mandatory password complexity policy, account lockout after 5 attempts, and multi-factor authentication (MFA).",
  },
  {
    id: "RC-02",
    num: "02",
    title: "Unrestricted File Upload in Web Application",
    severity: "Critical",
    flaw: "Web tier allowed arbitrary file upload without MIME-type checking, extension blacklisting, or storage outside web root.",
    exploit: "Attacker uploaded executable PHP web shell (shell.php) directly into public /hackable/uploads/ directory (Stage 05).",
    fix: "Apache .htaccess rule disabling script execution in upload directory; store files outside web root with randomized names.",
  },
  {
    id: "RC-03",
    num: "03",
    title: "Passwordless Sudoers GTFOBins Misconfiguration",
    severity: "Critical",
    flaw: "Service account www-data was granted NOPASSWD: /usr/bin/python3 in /etc/sudoers.",
    exploit: "Attacker escalated instantly from web user to full root via GTFOBins Python interactive bash invocation (Stage 07).",
    fix: "Principle of Least Privilege: completely purged sudoers privilege; web service accounts cannot invoke sudo.",
  },
  {
    id: "RC-04",
    num: "04",
    title: "Flat, Unsegmented Internal Network",
    severity: "High",
    flaw: "The DMZ web server sat on the same Layer 2 /24 broadcast domain as corporate Windows workstations and Domain Controller.",
    exploit: "Compromised web server was leveraged as a pivot host to conduct internal port sweeps and ARP discovery (Stage 09).",
    fix: "Strict VLAN network segmentation; DMZ web server isolated from internal subnet by gateway stateful firewall rules.",
  },
  {
    id: "RC-05",
    num: "05",
    title: "Insecure Broadcast Protocols Enabled (LLMNR / NetBIOS)",
    severity: "High",
    flaw: "Windows workstations had LLMNR and NetBIOS broadcast name resolution enabled by default.",
    exploit: "Attacker launched Responder on pivot to poison multicast queries and intercept NetNTLMv2 challenge responses (Stage 10).",
    fix: "Disabled LLMNR and NetBIOS domain-wide via Active Directory Group Policy (GPO); enforced DNS-only resolution.",
  },
  {
    id: "RC-06",
    num: "06",
    title: "Kerberoastable Domain Admin Account",
    severity: "Critical",
    flaw: "User account HANK_SHERMAN was assigned a Service Principal Name (SPN) while holding Domain Admins membership.",
    exploit: "Attacker requested RC4-HMAC encrypted Kerberos TGS ticket (Stage 13) and cracked the plaintext password offline.",
    fix: "Demoted account to standard user, stripped SPN, rotated password to 32+ characters, and enforced AES-256 Kerberos encryption.",
  },
  {
    id: "RC-07",
    num: "07",
    title: "Unconstrained DCSync Replication Privileges",
    severity: "Critical",
    flaw: "Directory Service replication privileges (DS-Replication-Get-Changes-All) were granted to compromised domain accounts.",
    exploit: "Attacker executed Impacket secretsdump.py to trigger DRSUAPI directory replication and dump the KRBTGT master key (Stage 14).",
    fix: "Restricted replication rights strictly to Domain Controllers; enrolled all administrative accounts into Protected Users.",
  },
];

export interface MasterIoC {
  id: string;
  type: string;
  category: "network" | "identity" | "file" | "registry" | "hash";
  value: string;
  host: string;
  context: string;
  confidence: "Confirmed" | "High";
}

export const masterIoCs: MasterIoC[] = [
  {
    id: "IOC-01",
    type: "IPv4 Address",
    category: "network",
    value: "192.168.232.135",
    host: "Kali Linux (Attacker)",
    context: "Adversary host origin for reconnaissance, web exploits, reverse shell listener, and exfiltration.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-02",
    type: "IPv4 Address",
    category: "network",
    value: "192.168.56.30",
    host: "DVWA Server",
    context: "Compromised web server abused as internal pivot host for lateral movement.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-03",
    type: "TCP Port",
    category: "network",
    value: "TCP 4444",
    host: "DVWA -> Kali",
    context: "Interactive Netcat reverse shell transport established via mkfifo /tmp/f.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-04",
    type: "TCP Port",
    category: "network",
    value: "TCP 445 / 135",
    host: "DVWA -> PC-DC / Win10",
    context: "SMB & RPC ports targeted for Pass-the-Hash authentication and wmiexec execution.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-05",
    type: "UDP Port",
    category: "network",
    value: "UDP 5355 / 137",
    host: "Internal Subnet (192.168.56.0/24)",
    context: "LLMNR & NetBIOS broadcast ports poisoned by Responder to capture NetNTLMv2 hashes.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-06",
    type: "User Account",
    category: "identity",
    value: "AD.LAB\\backdoor",
    host: "Active Directory (PC-DC)",
    context: "Rogue domain account created via wmiexec and added to Domain Admins for persistence.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-07",
    type: "User Account",
    category: "identity",
    value: "AD.LAB\\HANK_SHERMAN",
    host: "Active Directory (PC-DC)",
    context: "Kerberoastable service account with Domain Admin privileges (SPN: CIFS/AWSWAPPS1000000).",
    confidence: "Confirmed",
  },
  {
    id: "IOC-08",
    type: "User Account",
    category: "identity",
    value: "AD.LAB\\krbtgt",
    host: "Active Directory (PC-DC)",
    context: "Master KDC account whose NTLM hash was dumped via DCSync to forge Golden Tickets.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-09",
    type: "User Account",
    category: "identity",
    value: "AD.LAB\\win10",
    host: "Win10 Workstation",
    context: "Workstation user poisoned via DavSetCookie coerced auth and cracked offline.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-10",
    type: "File Path",
    category: "file",
    value: "/var/www/.../uploads/shell.php",
    host: "DVWA Server",
    context: "PHP web shell backdoor uploaded via unrestricted web upload vulnerability.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-11",
    type: "File Path",
    category: "file",
    value: "/root/.ssh/authorized_keys",
    host: "DVWA Server",
    context: "Adversary ED25519 public key implanted for root interactive SSH persistence.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-12",
    type: "File Path",
    category: "file",
    value: "/tmp/dcsync_output.ntds",
    host: "DVWA Server",
    context: "Staged NTDS directory dump containing domain hashes extracted via secretsdump.py.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-13",
    type: "File Path",
    category: "file",
    value: "/tmp/Administrator.ccache",
    host: "DVWA Server",
    context: "Forged Kerberos Ticket Granting Ticket (Golden Ticket) staged for domain elevation.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-14",
    type: "File Path",
    category: "file",
    value: "C:\\Users\\Public\\wallpaper.bmp",
    host: "PC-DC & Win10",
    context: "Simulated ransomware defacement wallpaper deployed to victims.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-15",
    type: "Registry Key",
    category: "registry",
    value: "HKCU\\Control Panel\\Desktop\\Wallpaper",
    host: "PC-DC & Win10",
    context: "Registry key updated via wmiexec to enforce defacement wallpaper across displays.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-16",
    type: "MD5 Hash",
    category: "hash",
    value: "5f4dcc3b5aa765d61d8327deb882cf99",
    host: "DVWA Database",
    context: "MD5 hash for user 'admin' extracted via UNION SELECT SQL injection.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-17",
    type: "NTLM Hash",
    category: "hash",
    value: "611a8cdcc21cb3fe3bf3a4c2f4e05f60",
    host: "Active Directory (PC-DC)",
    context: "Compromised krbtgt master NTLM hash dumped via DCSync replication.",
    confidence: "Confirmed",
  },
  {
    id: "IOC-18",
    type: "Kerberos TGS",
    category: "hash",
    value: "$krb5tgs$23$*HANK_SHERMAN$AD.LAB...",
    host: "Active Directory Wire",
    context: "RC4-HMAC Kerberos service ticket intercepted during Stage 13 Kerberoasting.",
    confidence: "Confirmed",
  },
];
