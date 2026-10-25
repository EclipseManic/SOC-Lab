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
    techniqueId: "T1595.001",
    plain:
      "The attacker uses Nmap to map live hosts, open ports (SSH 22, Apache 80), service versions, and OS fingerprints across the victim subnet.",
    attacker:
      "Runs fast SYN scans, service version detection, and OS fingerprinting from Kali against 192.168.56.30.",
    defender:
      "Suricata NIDS detects Nmap OS detection probe (SID 3400002) and multi-port scanning (SID 2010937). Wazuh correlates Rule 86601.",
    evidence:
      "Nmap terminal output, Suricata eve-alert.json alerts, and TheHive alert wzb-3a8045a03c.",
    telemetry: "Network flow / IDS",
    gap: "DG-01",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-01-recon.md",
    investigationPath: "04-Investigation/Stages/stage-01-recon.md",
    ruleId: "Wazuh 86601 / SID 3400002",
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
      "The attacker automates credential guessing with Hydra and web directory fuzzing with Nikto against DVWA.",
    attacker:
      "Sends high-frequency HTTP POST requests with wordlists to the DVWA login form until finding admin/password.",
    defender:
      "Wazuh Apache access log decoder flags repeated 400 errors (Rule 31151), multi-vector web attacks (Rule 31153), and Shellshock scanner signatures (Rule 31168).",
    evidence:
      "Hydra terminal success, Apache access.log POST bursts, and TheHive alert wzb-81becfcc8d.",
    telemetry: "Web server access logs",
    gap: "DG-02",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-02-bruteforce.md",
    investigationPath: "04-Investigation/Stages/stage-02-bruteforce.md",
    ruleId: "Wazuh 31153, 31151, 31168",
    alertRef: "wzb-81becfcc8d",
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
      "Suricata matches SELECT USER SQLi in URI (SID 2010937). Wazuh custom Rule 100201 matches SQL injection keywords in URI.",
    evidence:
      "Browser SQLi dump, raw HTTP GET payload in eve-alert.json, and TheHive alert wzb-10160d36c2.",
    telemetry: "HTTP / Network IDS / Web logs",
    gap: "DG-03",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-03-sqli.md",
    investigationPath: "04-Investigation/Stages/stage-03-sqli.md",
    ruleId: "Wazuh 100201 / SID 2010937",
    alertRef: "wzb-10160d36c2",
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
      "Suricata triggers on PHP System Command in HTTP POST (SID 2014726) and PHP Command Injection in GET (SID 2014727). Wazuh correlates Rule 100600.",
    evidence:
      "Uploaded shell file path, Suricata POST alert in eve-alert.json, and TheHive alert wzb-e9a1797ac4.",
    telemetry: "Network IDS / Web server logs",
    gap: "DG-05",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-05-webshell.md",
    investigationPath: "04-Investigation/Stages/stage-05-webshell.md",
    ruleId: "Wazuh 100600 / SID 2014726",
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
      "Suricata detects outbound reverse shell connection (SID 2002752). Wazuh correlates web user interactive shell execution.",
    evidence:
      "Netcat shell prompt on Kali, Suricata reverse shell alert, and TheHive alert wzb-f87fab3eda.",
    telemetry: "Process / Network IDS",
    gap: "DG-06",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-06-reverse-shell.md",
    investigationPath: "04-Investigation/Stages/stage-06-reverse-shell.md",
    ruleId: "Wazuh 86601 / SID 2002752",
    alertRef: "wzb-f87fab3eda",
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
      "Spawns an interactive root shell via `sudo python3 -c 'import pty;pty.spawn(\"/bin/bash\")'` and establishes SUID bash.",
    defender:
      "Linux PAM authentication logs captured by Wazuh Rule 5402 showing sudo execution by service user www-data.",
    evidence:
      "Root shell ID output, /var/log/auth.log sudo log entry, and TheHive alert wzb-ccae331b77.",
    telemetry: "Linux auth / PAM logs",
    gap: "DG-07",
    status: "Detected",
    caseLabel: "Case 01",
    caseSlug: "case-01-web-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-07-privesc.md",
    investigationPath: "04-Investigation/Stages/stage-07-privesc.md",
    ruleId: "Wazuh 5402 (PAM)",
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
      "SSH session banner, Wazuh Syscheck checksum diff, and TheHive alert wzb-1c8dc0ab5d.",
    telemetry: "FIM / Linux auth logs",
    gap: "DG-08",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-08-ssh-persistence.md",
    investigationPath: "04-Investigation/Stages/stage-08-ssh-persistence.md",
    ruleId: "Wazuh 550, 5715",
    alertRef: "wzb-1c8dc0ab5d",
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
      "Suricata detects internal reconnaissance sweep probes (SID 2000545). Intra-subnet layer 2 sweep limitation documented as logging gap (DG-09).",
    evidence:
      "Pivot scan output, Suricata internal sweep alert, and TheHive alert wzb-3152e3ed59.",
    telemetry: "Host process / Network IDS",
    gap: "DG-09",
    status: "Logging gap",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-09-internal-discovery.md",
    investigationPath: "04-Investigation/Stages/stage-09-internal-discovery.md",
    ruleId: "Wazuh 86601 / SID 2000545",
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
      "Runs Responder on interface ens33, responding to broadcast name queries from Windows 10 and capturing user NetNTLMv2 challenge responses.",
    defender:
      "Suricata detects anomalous LLMNR/NBT-NS multicast poisoning response on UDP ports 5355/137 (SID 2013028). Wazuh Rule 86601.",
    evidence:
      "Captured NetNTLMv2 hash string, Suricata multicast alert, and TheHive alert wzb-7a4a134d1b.",
    telemetry: "Network IDS / Windows auth",
    gap: "DG-10",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-10-responder.md",
    investigationPath: "04-Investigation/Stages/stage-10-responder.md",
    ruleId: "Wazuh 86601 / SID 2013028",
    alertRef: "wzb-7a4a134d1b",
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
      "The attacker runs BloodHound/SharpHound from the pivot host to ingest Active Directory objects and graph the fastest path to Domain Admin.",
    attacker:
      "Executes SharpHound collector via LDAP against the Domain Controller, exporting 2,493 user and group trust relationships into Neo4j.",
    defender:
      "Wazuh Rule 5715 detects repeated root SSH administrative sessions on pivot. Active Directory LDAP search filter gap documented (DG-12).",
    evidence:
      "BloodHound graph export, SSH logon logs on DVWA, and TheHive alert wzb-dbf3197ceb.",
    telemetry: "Linux auth / LDAP query logs",
    gap: "DG-12",
    status: "Logging gap",
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
      "Domain Controller Windows Security EID 4769 flagged by Wazuh Rule 60107 showing Kerberos TGS request with RC4 encryption (0x17).",
    evidence:
      "Extracted TGS ticket hash, DC Event ID 4769 audit log, and TheHive alert wzb-1d2d7fb4b8.",
    telemetry: "Kerberos / Windows Security logs",
    gap: "DG-13",
    status: "Detected",
    caseLabel: "Case 02",
    caseSlug: "case-02-lateral-movement",
    attackPath: "02-Attack-Simulation/Stages/stage-13-kerberoasting.md",
    investigationPath: "04-Investigation/Stages/stage-13-kerberoasting.md",
    ruleId: "Windows 4769 / Wazuh 60107",
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
      "Suricata detects ET EXPLOIT GoldenPac Privilege Escalation signature (SID 2015862). Wazuh logs Windows LogonType 3 session.",
    evidence:
      "Wmiexec session banner, Suricata GoldenPac alert in eve-alert.json, and TheHive alert wzb-c1e2642eb2.",
    telemetry: "Network IDS / Windows auth logs",
    gap: "DG-15",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-15-pass-the-hash.md",
    investigationPath: "04-Investigation/Stages/stage-15-pass-the-hash.md",
    ruleId: "Wazuh 86601 / SID 2015862",
    alertRef: "wzb-c1e2642eb2",
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
      "Domain Controller EID 4769 flags anomalous Kerberos TGS request lacking preceding AS-REQ; pivot SSH flagged via Rule 5715.",
    evidence:
      "Ticket ccache file metadata, DC Kerberos audit log, and TheHive alert wzb-8d45b2d236.",
    telemetry: "Kerberos / DC Security logs",
    gap: "DG-16",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-16-golden-ticket.md",
    investigationPath: "04-Investigation/Stages/stage-16-golden-ticket.md",
    ruleId: "Windows 4769 / Wazuh 5715",
    alertRef: "wzb-8d45b2d236",
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
      "The attacker modifies victim desktop wallpapers and sets persistent registry run keys, completing the simulated attack campaign.",
    attacker:
      "Deploys defacement wallpaper (`hacked.bmp`) to Windows 10 and updates registry autostart keys via Impacket wmiexec.",
    defender:
      "Wazuh Rule 100613 (wmiexec command execution), Rule 100100 (Registry persistence), and Suricata network alerts all fire.",
    evidence:
      "Modified desktop screenshot, Sysmon Registry Event 13, and TheHive alert wzb-71ef983ad8.",
    telemetry: "Sysmon / Registry / Network IDS",
    gap: "DG-20",
    status: "Detected",
    caseLabel: "Case 03",
    caseSlug: "case-03-domain-compromise",
    attackPath: "02-Attack-Simulation/Stages/stage-20-impact.md",
    investigationPath: "04-Investigation/Stages/stage-20-impact.md",
    ruleId: "Wazuh 100613, 100100",
    alertRef: "wzb-71ef983ad8",
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
    proof: "01-Lab-Setup/architecture.md · 01-Lab-Setup/README.md",
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
        "The architecture and network documentation are captured. Attack and alert evidence are published in dedicated directories.",
      technical:
        "The ledger separates captured artifacts from pending ones. Visual proof spans 60 attack screenshots and 23 alert captures in TheHive.",
      hiring:
        "Evidence maturity is part of the work: documented, scaffolded, draft, pending. The labels are the proof of rigor.",
    },
    proof: "INDEX.md · 06-Resources/README.md · 06-Resources/Diagrams/SOC_Lab_Architecture.png",
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
    label: "Raw Alert Exports",
    value: "Captured",
    tone: "teal",
    note: "Authentic TheHive 5 alert JSON and Wazuh alert CSV exports preserved in 06-Resources/Alerts/.",
    path: "06-Resources/Alerts/",
  },
  {
    label: "Architecture diagram",
    value: "Captured",
    tone: "teal",
    note: "High-level overview. The architecture & network tables are authoritative for addresses and flows.",
    path: "06-Resources/Diagrams/SOC_Lab_Architecture.png",
  },
  {
    label: "Architecture & Network",
    value: "Captured",
    tone: "teal",
    note: "Unified 3-tier model, segments, flows, ports, and the Suricata visibility boundary.",
    path: "01-Lab-Setup/architecture.md",
  },
  {
    label: "Attack screenshots",
    value: "Captured",
    tone: "teal",
    note: "Comprehensive visual chain across all 20 stages in 02-Attack-Simulation/Attack-Screenshots/.",
    path: "02-Attack-Simulation/Attack-Screenshots/",
  },
  {
    label: "Alert screenshots",
    value: "Captured",
    tone: "teal",
    note: "TheHive alert dashboard and detail captures across all detected stages.",
    path: "03-Detection-Engineering/TheHive_Alert-ScreenShot/",
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
    value: "Scaffolded",
    tone: "blue",
    note: "Three case records with scope and questions; verdicts remain open for manual analyst triage.",
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
export const gapCount = stages.filter((stage) => stage.status === "Detection gap" || stage.status === "Logging gap").length;
