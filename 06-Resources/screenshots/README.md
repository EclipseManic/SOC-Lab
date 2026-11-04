# 📸 Master Empirical Screenshot Evidence Repository (`06-Resources/screenshots/`)

This directory serves as the centralized, definitive repository for all **251 photographic evidence assets** captured during the end-to-end execution of the enterprise SOC Lab. Every image represents an empirical capture taken directly from live analyst terminals, offensive consoles, network sensors, SIEM dashboards, and SOAR case management platforms.

---

## 🏗️ Repository Architecture & Design Principles

To ensure forensic integrity, clean navigation, and deterministic file linking, this repository strictly adheres to the following principles:

1. **Flat Category Hierarchy (Zero Subdirectories)**: All screenshots reside directly within their respective top-level category folder. There are no nested subdirectories.
2. **Standardized Formats**: All images are curated in universal web formats (`.png` / `.jpg`). Raw, uncompressed, and proprietary container formats (such as `.jxl`) have been permanently removed.
3. **Forensic Traceability**: Every file maps directly to an analytical step, attack stage, detection rule, or remediation action documented in the master incident narrative (`02-Attack-Simulation/`, `03-Detection-Engineering/`, `04-Investigation/`, and `05-Incident-Report/`).

```
06-Resources/screenshots/
├── attack-simulation/              # 62 offensive terminal & tool execution captures (Stages 01–20)
├── thehive-alert/                  # 60 TheHive 5 detection alert cards, rule matches & NIDS events
├── thehive-cases/                  # 9 TheHive 5 case closure records, task verifications & FP dismissals
├── initial-triage/                 # 26 queue triage, severity rankings & chronological bundle captures
├── initial-triage-action/          # 15 live tactical containment & attacker lockout verification captures
├── wazuh-deep-investigation/       # 68 chronological SIEM & endpoint telemetry alerts (wzb-01 to wzb-68)
└── deep-investigation-action/      # 11 host eradication, vulnerability hardening & fleet health captures
```

---

## 📊 Summary of Evidence Categories

| Directory | Evidence Focus | File Count | Primary Platform / Scope | Master Documentation Reference |
|:---|:---|:---:|:---|:---|
| [`attack-simulation/`](attack-simulation/) | Adversary Execution | 62 | Kali Linux (`192.168.232.135`) targeting DVWA, Windows 10, & Domain Controller | [02 — Attack Simulation](../../02-Attack-Simulation/README.md) |
| [`thehive-alert/`](thehive-alert/) | Detection Engineering | 60 | TheHive 5 Alert Console (`http://10.122.0.4:9000`) | [03 — Detection Engineering](../../03-Detection-Engineering/README.md) |
| [`thehive-cases/`](thehive-cases/) | SOAR Incident Management | 9 | TheHive 5 Case Management (`CAS-001`, `CAS-002`, `CAS-003`) | [04 — Investigation: Eradication & Recovery](../../04-Investigation/Eradication-Hardening-and-Recovery.md#9-step-7-thehive-46-alert-queue-disposition--3-case-resolution-management) |
| [`initial-triage/`](initial-triage/) | Queue & Alert Triage | 26 | TheHive 5 Alert Ingestion Queue & Incident Triage Bundles | [04 — Investigation: Initial Triage](../../04-Investigation/Initial-Triage-and-Investigation.md) |
| [`initial-triage-action/`](initial-triage-action/) | Tactical Containment | 15 | Live host terminals (Suricata Gateway, DVWA, DC, Workstation) | [04 — Investigation: Containment](../../04-Investigation/Immediate-Containment-Execution.md) |
| [`wazuh-deep-investigation/`](wazuh-deep-investigation/) | Forensic Telemetry | 68 | Wazuh Manager (`https://10.122.1.4`) & Elastic/OpenSearch Indices | [04 — Investigation: Deep Dive](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md) |
| [`deep-investigation-action/`](deep-investigation-action/) | Eradication & Hardening | 11 | Hardened VM consoles (DVWA, DC, Workstation, Gateway) | [04 — Investigation: Eradication & Recovery](../../04-Investigation/Eradication-Hardening-and-Recovery.md) |

---

## 🗂️ Detailed Directory Breakdown & Evidence Inventories

### 1. Adversary Attack Simulation (`attack-simulation/`)
* **Path**: `06-Resources/screenshots/attack-simulation/`
* **File Count**: 62 images (`1.png` to `60.png`, including sub-stage captures `58.5.png`, `59.5.png`)
* **Scope**: Captured from the adversary's offensive terminal (Kali Linux `192.168.232.135`) documenting the execution of the full 20-stage attack chain across external DMZ and internal Active Directory targets:
  - **Reconnaissance & Initial Access** (Stages 01–03): Nmap scans, Nikto web vulnerability probing, Hydra credential brute-forcing, and SQL injection exploitation.
  - **Foothold & Privilege Escalation** (Stages 04–08): MD5 hash cracking, Weevely webshell deployment, Netcat reverse shell connection, sudoers Python exploitation to `root`, and SSH persistence via `authorized_keys`.
  - **Internal Discovery & Credential Theft** (Stages 09–13): Internal ARP/ping sweeps, Responder LLMNR/NBT-NS hash harvesting (`DavSetCookie`), NTLMv2 Hashcat cracking, BloodHound LDAP collection, and Kerberoasting service account `HANK_SHERMAN`.
  - **Domain Takeover & Lateral Movement** (Stages 14–17): Impacket `secretsdump.py` DCSync dumping of `NTDS.dit`, Pass-the-Hash execution via `wmiexec.py`, Golden Ticket ticket forgery (`ticketer.py`), and creation of persistent backdoor domain account `backdoor`.
  - **Collection, Exfiltration & Impact** (Stages 18–20): Sensitive file aggregation, staging archives, rapid SSH/SCP exfiltration burst, ransomware execution, desktop wallpaper modification via registry, and forced workstation reboot.

### 2. Detection Engineering & Sensor Alerts (`thehive-alert/`)
* **Path**: `06-Resources/screenshots/thehive-alert/`
* **File Count**: 60 images (`1.png` to `22.4.png`)
* **Scope**: Captures from TheHive 5 alert feed displaying the automated alerts ingested via the Wazuh-to-TheHive integration pipeline (`custom-thehive.py`). Displays alert titles, severity levels (Medium, High, Critical), MITRE ATT&CK tactic/technique mappings, observables (IP addresses, process paths, SHA-256 hashes), and raw log payloads from Suricata NIDS, Linux Auditd, Apache, and Windows Sysmon.

### 3. SOAR Case Management & Operational Closures (`thehive-cases/`)
* **Path**: `06-Resources/screenshots/thehive-cases/`
* **File Count**: 9 images
* **Scope**: Official record of incident case resolution, completed forensic tasks, false positive dismissals, and queue clearing in TheHive 5 platform:
  | Filename | Description | Operational Significance |
  |:---|:---|:---|
  | `thehive_cases_overview_resolved.png` | Cases Master Table | Confirms all 3 incident cases (`CAS-001`, `CAS-002`, `CAS-003`) are in `Resolved / Closed` status. |
  | `thehive_case01_closed.png` | Case 01 Detail View | Resolution overview of Web Server Compromise case (`CAS-001-WEBCOMP`). |
  | `thehive_case01_tasks.png` | Case 01 Task Ledger | Proof of 10/10 completed containment, eradication, and hardening tasks for DVWA. |
  | `thehive_case02_closed.png` | Case 02 Detail View | Resolution overview of Internal Pivot & Lateral Movement case (`CAS-002-LATMOVE`). |
  | `thehive_case02_tasks.png` | Case 02 Task Ledger | Proof of 8/8 completed tasks for Responder mitigation, credential rotation, and Kerberos invalidation. |
  | `thehive_case03_closed.png` | Case 03 Detail View | Resolution overview of Active Directory Domain Compromise case (`CAS-003-DOMIMP`). |
  | `thehive_case03_tasks.png` | Case 03 Task Ledger | Proof of 8/8 completed tasks for backdoor account deletion, ransomware remediation, and krbtgt rollover. |
  | `thehive_false_positives_dismissed.png` | False Positive Disposition | Shows benign scanner alerts (#01 Nmap SYN sweep, #06 Nikto canary, #18 internal sweep) formally closed as `FalsePositive`. |
  | `thehive_alert_queue_cleared.png` | Cleared Alert Queue | Displays *"No alert has been found"*, proving zero unhandled or unacknowledged alerts remain across the enterprise SOAR pipeline. |

### 4. Initial Incident Triage (`initial-triage/`)
* **Path**: `06-Resources/screenshots/initial-triage/`
* **File Count**: 26 images (`slot_01` to `slot_10.5`)
* **Scope**: Photographic record of the Tier-1 / Tier-2 triage phase, capturing the prioritization of the 46 alerts ingested into TheHive:
  - Severity-based queue triage (`slot_01_thehive_severity_queue.png`).
  - Chronological alert timeline sorting (`slot_01.5_thehive_chronological_queue_part1.png`, `part2.png`).
  - Deep-dive card inspections across key operational milestones: Nmap OS fingerprinting (#03), Nikto Shellshock canary (#05), 22-event web compromise bundle (#11), Auditd execution tracking (#12), Suricata HTTP payloads (#13), Netcat reverse shell alerts (#14, #15), SSH key injection (#16), GoldenPac Kerberos traffic (#23), WMIexec takeover (#25, #29), EID 4720 backdoor creation (#30), Domain Admin escalation (#33), data staging (#35, #36), and ransomware deployment (#42).

### 5. Tactical Containment Actions (`initial-triage-action/`)
* **Path**: `06-Resources/screenshots/initial-triage-action/`
* **File Count**: 15 images (`slot_01` to `slot_07`)
* **Scope**: Empirical proof of live tactical containment executed within minutes of alert confirmation:
  - **Perimeter Firewall Drop** (`slot_01`): Suricata gateway iptables rule blocking all ingress and egress from attacker IP `192.168.232.135`.
  - **Web Server Isolation & Cleanup** (`slot_02`–`slot_03`): Process termination, moving webshells (`c99.php`, `shell.php`) to secure quarantine, purging upload folders, and deleting unauthorized SSH keys from `/root/.ssh/authorized_keys`.
  - **Identity Containment** (`slot_04`–`slot_05`): Disabling the rogue Active Directory account `backdoor` via `Disable-ADAccount`, verified with `Get-ADUser`, followed by the first of two `krbtgt` password resets to invalidate active Kerberos tickets.
  - **Workstation Quarantine** (`slot_06a`–`slot_06e`): Velociraptor VQL and host PowerShell commands quarantining ransomware binaries, reverting wallpaper registry modifications, and terminating malicious processes.
  - **Credential Rotation** (`slot_07`): Database root credential rotation on the DMZ web server.

### 6. Wazuh Forensic Telemetry Deep Dive (`wazuh-deep-investigation/`)
* **Path**: `06-Resources/screenshots/wazuh-deep-investigation/`
* **File Count**: 68 images (`wzb-01-recon-postgres-5432-scan.jpg` to `wzb-68-persist-dc-eid4738-backdoor-modified-json.jpg`)
* **Scope**: Chronological SIEM telemetry captures covering every alert generated during the 74-minute attack window across all endpoints and sensors:
  - `wzb-01` to `wzb-08`: External reconnaissance, TCP SYN scans, web vulnerability scans, and directory enumeration.
  - `wzb-09` to `wzb-14`: Brute-force requests, SQL injection signatures, and webshell execution via Auditd.
  - `wzb-15` to `wzb-20`: Reverse shell tty allocation, sudoers privilege escalation to root, and SSH backdoor persistence.
  - `wzb-21` to `wzb-30`: Internal network discovery, Responder LLMNR poisoning, and NTLMv2 hash theft.
  - `wzb-31` to `wzb-37`: BloodHound AD collection, Kerberoasting SPN requests, DCSync NTDS dumping, and Pass-the-Hash logons.
  - `wzb-38` to `wzb-42`: Golden Ticket forged Kerberos authentication, WMIexec process execution, and alert surge histogram.
  - `wzb-43` to `wzb-48`: Backdoor account creation (EID 4720), local/domain admin group additions (EID 4728), and user queries.
  - `wzb-49` to `wzb-53`: File staging on domain controller, sensitive file gathering, and rapid SSH exfiltration burst.
  - `wzb-54` to `wzb-68`: Ransomware payload dropping, registry wallpaper hijacking, document encryption, forced reboots, and post-reboot backdoor modifications (EID 4738).

### 7. Eradication, Hardening & Recovery Proof (`deep-investigation-action/`)
* **Path**: `06-Resources/screenshots/deep-investigation-action/`
* **File Count**: 11 images (`slot_01` to `slot_09`)
* **Scope**: Terminal captures verifying root-cause elimination, system hardening, and fleet health verification:
  | Filename | Host | Remediation Action Executed | Verification Output |
  |:---|:---|:---|:---|
  | `slot_01_eradication_dvwa_loot_wiped.png` | DVWA | Cryptographic wiping (`shred -u`) of `/tmp/` staging loot and removal of `/opt/Responder`. | Verification of clean `/tmp/` and running `systemd-resolved`. |
  | `slot_02_eradication_dvwa_sudoers_patched.png` | DVWA | Sudoers hardening removing `www-data` NOPASSWD Python permissions and disabling root SSH. | `sudo -l` confirming `www-data may not run sudo`. |
  | `slot_02b_eradication_dvwa_impossible_security.png` | DVWA | Permanent modification of `config.inc.php` setting `default_security_level = 'impossible'`. | File inspection showing impossible mode enforced. |
  | `slot_03_eradication_dvwa_upload_blocked.png` | DVWA | Apache configuration update (`AllowOverride All`) and `.htaccess` deployment in uploads directory. | `curl -i` canary returning `HTTP/1.1 403 Forbidden`. |
  | `slot_04_eradication_ad_backdoor_deleted.png` | PC-DC | Permanent Active Directory user deletion via `Remove-ADUser -Identity "backdoor"`. | `Get-ADUser` returning null / non-existent object. |
  | `slot_05_eradication_ad_hank_demoted.png` | PC-DC | Stripping `HANK_SHERMAN` from Domain Admins, clearing SPN, and enforcing AES Kerberos encryption. | Confirmed membership and encryption attribute `24`. |
  | `slot_06_eradication_ad_protected_users.png` | PC-DC | Enrolling privileged accounts (`Administrator`, `HANK_SHERMAN`) in `Protected Users` security group. | Confirmed group membership and `krbtgt` `msDS-KeyVersionNumber: 3`. |
  | `slot_06b_eradication_desktop_wallpaper_restored.png` | Win10User | Win32 C# `SystemParametersInfo` API execution repainting default corporate desktop wallpaper. | Clean Windows desktop with zero extortion artifacts. |
  | `slot_07_eradication_llmnr_netbios_disabled.png` | Win10User | Disabling LLMNR (`EnableMulticast = 0`) and NetBIOS over TCP/IP (`TcpipNetbiosOptions = 2`). | Registry queries confirming multicast and NetBIOS disabled. |
  | `slot_08_eradication_dmz_firewall_hardened.png` | DVWA | DMZ egress firewall rules rejecting outbound TCP traffic to domain controller (`.10`) and workstation (`.20`). | `iptables -L -v -n` showing active drop rules. |
  | `slot_09_eradication_health_verification.png` | Wazuh Mgr | Endpoint telemetry health check confirming all 5 agents (Gateway, DVWA, Win10, DC) active and reporting. | `/var/ossec/bin/agent_control -l` showing 5 Active agents. |

---

## 🔗 Traceability & Cross-References

- **Master Incident Timeline**: [`05-Incident-Report/timeline.md`](../../05-Incident-Report/timeline.md)
- **Full Attack Chain Manual**: [`02-Attack-Simulation/README.md`](../../02-Attack-Simulation/README.md)
- **SOAR Queue Triage Analysis**: [`04-Investigation/Initial-Triage-and-Investigation.md`](../../04-Investigation/Initial-Triage-and-Investigation.md)
- **Host Hardening & Eradication Guide**: [`04-Investigation/Eradication-Hardening-and-Recovery.md`](../../04-Investigation/Eradication-Hardening-and-Recovery.md)
- **MITRE ATT&CK Mapping Matrix**: [`05-Incident-Report/mitre-attack-mapping.md`](../../05-Incident-Report/mitre-attack-mapping.md)
