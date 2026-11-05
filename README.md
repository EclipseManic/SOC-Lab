# Hybrid-Cloud SOC & Threat Engineering Lab
### End-to-End Infrastructure Design, 20-Stage Attack Simulation, Custom Detection Engineering & Full DFIR Case Investigation

I designed and deployed a hybrid-cloud corporate security operations center (SOC) and enterprise network across **7 dedicated virtual machines**, executed a realistic **20-stage adversary attack campaign** against it (spanning perimeter reconnaissance, web application exploitation, Linux privilege escalation, network credential theft, and Active Directory domain takeover), authored custom multi-sensor detection rules, triaged **46 incoming incident alerts in TheHive 5**, and executed live containment and permanent root-cause eradication.

[![SOC Lab Complete Architecture](06-Resources/diagrams/SOC_Lab_Architecture.png)](06-Resources/diagrams/SOC_Lab_Architecture.png)

**Live Interactive Report & Dashboard:** <https://soc-lab.eclipsemanic.me/>

---

## 🏛️ The Four Operational Pillars

This project documents the complete lifecycle of enterprise security operations across four interdependent disciplines:

```
[ 1. Infrastructure ] ──► [ 2. Attack Simulation ] ──► [ 3. Detection Engineering ] ──► [ 4. Incident Response ]
  • Hybrid Cloud (Azure)    • 20 MITRE ATT&CK Stages     • Custom Wazuh XML Rules         • 46 TheHive Alerts
  • 4 Network Segments      • Realistic Red-Team TTPs    • Suricata NIDS Signatures       • 3 Operational Cases
  • WireGuard S2S Tunnel    • Linux Host Compromise      • Sysmon & Auditd Baselines      • Active Containment
  • Active Directory Domain • Full AD Forest Takeover    • SQLite WAL SOAR Daemon         • Eradication & Post-Mortem
```

### 1. Hybrid Infrastructure Engineering
- **Cloud Management Stack (Microsoft Azure):** Two Ubuntu cloud instances in a peered private cloud network (`10.122.0.0/16`) with zero direct public IP exposure:
  - `Cloud VM1` (`10.122.0.4`): TheHive 5 case management, Apache Cassandra, Elasticsearch, Velociraptor DFIR server, and WireGuard VPN hub (`10.8.0.1/24`).
  - `Cloud VM2` (`10.122.1.4`): Wazuh SIEM Manager, Indexer, OpenSearch Dashboard, and custom SOAR integration daemon.
- **On-Premise Victim & Attack Network (VMware Workstation Pro):**
  - `Security Gateway` (`192.168.232.160` / `192.168.56.1`): Dual-homed Linux router running Suricata NIDS sniffing ingress perimeter traffic (`ens33`) and internal LAN traffic (`ens37`).
  - `Web Application Server` (`192.168.232.161` / `192.168.56.30`): Ubuntu Linux hosting DVWA on Apache 2.4.
  - `Domain Controller` (`192.168.56.10`): Windows Server 2022 Active Directory (`PC-DC.ad.lab`).
  - `Corporate Workstation` (`192.168.56.20`): Windows 10 Enterprise (`Win10.ad.lab`).
  - `Attacker Machine` (`192.168.232.135`): Kali Linux placed on an isolated external subnet.
- **Zero-NAT Site-to-Cloud WireGuard Tunnel:** An encrypted VPN tunnel connects the physical security gateway (`10.8.0.2`) directly to the Azure cloud hub (`10.8.0.1`). Kernel NAT is disabled for victim traffic, preserving authentic source IP addresses (`.10`, `.20`, `.30`) across all SIEM alerts.

### 2. Adversary Attack Simulation (20 Stages)
- **Act 1: Web Compromise to Root (Stages 01–07):** Perimeter port scanning (Nmap), web fuzzing (Nikto), login brute-force, SQL injection credential dump, PHP web shell deployment, Netcat reverse shell stabilization, and instant root privilege escalation via passwordless sudo Python misconfiguration (`sudo /usr/bin/python3` GTFOBins).
- **Act 2: Pivot & Credential Theft (Stages 08–14):** Injected root SSH backdoor persistence, internal subnet discovery sweep, LLMNR/NBT-NS broadcast poisoning (Responder) capturing domain user `win10` NetNTLMv2 hash, BloodHound AD mapping, Kerberoasting service account `HANK_SHERMAN`, and DCSync directory replication via DRSUAPI.
- **Act 3: Domain Dominance & Disruption (Stages 15–20):** Pass-the-Hash remote WMI access (`wmiexec.py`), Kerberos Golden Ticket forgery (`ticketer.py`), persistent backdoor account creation (`AD\backdoor`) elevated to `Domain Admins`, automated data staging, rapid SCP exfiltration, desktop wallpaper defacement, ransomware note deployment, and forced dual-endpoint reboots.

### 3. Detection Engineering & Telemetry Pipeline
- **Multi-Sensor Mesh:** Interlocking telemetry layers combining Suricata wire inspection, Linux Auditd syscall tracking (`execve`), Windows Sysmon process execution trees (`WmiPrvSE.exe` $\to$ `cmd.exe`), and Active Directory Security logs.
- **Custom Detection Engine:** 148 rule definitions and 87 false-positive noise suppressions in `local_rules.xml`.
- **Custom SOAR Ingestion Gateway (`custom-thehive.py`):** An asynchronous Python daemon utilizing a local SQLite Write-Ahead Log (WAL) buffer and a 5-second sliding flush window to cluster raw alert floods into 46 actionable incident tickets, preventing alert fatigue from 9,567 baseline events.

### 4. SOC Alert Triage, Investigation & Incident Response
- **Alert Queue Triage:** Systematic evaluation of 46 alerts in TheHive 5. Identified that the single "Critical" alert (Shellshock) was an unexploitable scanner probe, while real P1 threats were buried as "Medium" alerts (reverse shells, unauthorized root SSH, DCSync).
- **Case Management:** Grouped all 46 alerts into three operational incident cases:
  - `CAS-001-WEBCOMP` (Stages 01–07): External Web Application Compromise & Linux Root Takeover
  - `CAS-002-LATMOVE` (Stages 08–14): Internal Pivoting, LLMNR Poisoning & Active Directory Recon
  - `CAS-003-DOMIMP` (Stages 15–20): Domain Controller Compromise, Backdoors & Ransomware Impact
- **Tactical Containment Execution:** Dropped attacker IP at perimeter firewall, killed reverse shell listeners, quarantined web shells (`chmod 000`), disabled rogue AD account `AD\backdoor` to preserve SID integrity, and completed an Active Directory `krbtgt` double password reset to increment KVNO to 3 and purge Golden Tickets.
- **Root-Cause Eradication:** Revoked sudoers `NOPASSWD` directives, disabled root SSH logins, deployed `.htaccess` execution blocks, disabled LLMNR/NetBIOS across the domain via GPO, enrolled Domain Admins in `Protected Users`, demoted compromised service accounts, and restored registry wallpapers.

---

## 🗂️ TheHive Incident Cases Summary

| Case ID | Incident Name | Covered Stages | Real Priority | Tactical Actions Taken | Resolution Status |
|:---:|---|:---:|:---:|---|:---:|
| **`CAS-001-WEBCOMP`** | External Web Compromise to Root | Stages 01–07 | **P1 (Critical)** | Terminated reverse shell on 4444; quarantined `shell.php`; removed sudoers NOPASSWD Python directive; enforced `PermitRootLogin no`; rotated DB credentials. | **Resolved / Closed** |
| **`CAS-002-LATMOVE`** | Lateral Movement & AD Escalation | Stages 08–14 | **P1 (Critical)** | Purged injected SSH public keys; disabled LLMNR and NetBIOS via GPO; demoted `HANK_SHERMAN` and stripped SPN; cryptographically shredded staged hash files (`shred -u -z -n 3`). | **Resolved / Closed** |
| **`CAS-003-DOMIMP`** | Domain Controller Compromise & Impact | Stages 15–20 | **P1 (Critical)** | Blocked adversary IP on Gateway; disabled and removed rogue account `AD\backdoor`; completed double `krbtgt` password reset (KVNO 3); repaired desktop wallpaper registry; isolated DMZ egress. | **Resolved / Closed** |

---

## 🔍 20-Stage Attack & Telemetry Summary

| # | What the Attacker Did | Caught? | Detection Sensor & Rule | TheHive Case | Primary Evidence |
|:---:|---|:---:|---|:---:|---|
| **01** | Perimeter TCP SYN port scan & Nikto fuzzing | **Yes** | Suricata SIDs 3400001, 3400002 / Wazuh 100410 | Case 01 | [Alerts #01–#03](06-Resources/screenshots/thehive-alert/1.png) · [wzb-04](06-Resources/screenshots/wazuh-deep-investigation/wzb-04-recon-suricata-nmap-syn-scan.jpg) |
| **02** | Automated Python HTTP login brute-force | **Yes** | Suricata SID 2017515 + Custom Wazuh Rule 100600 | Case 01 | [Alert #11](06-Resources/screenshots/thehive-alert/4.png) · [wzb-09](06-Resources/screenshots/wazuh-deep-investigation/wzb-09-bruteforce-dvwa-login-endpoint.jpg) |
| **03** | SQL injection extracting credentials table | **Yes** | Suricata SID 2010963 + Custom Wazuh Rule 100600 | Case 01 | [Alert #11 (sub-17)](06-Resources/screenshots/thehive-alert/5.png) · [wzb-11](06-Resources/screenshots/wazuh-deep-investigation/wzb-11-sqli-suricata-select-user.jpg) |
| **04** | Offline GPU password cracking (MD5 hashes) | **Attributed** | *Offline Gap (DG-04)*: Triangulated via Stage 03 dump & Stage 05 login | Case 01 | [Lifecycle Bracketed](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) · [DG-04](03-Detection-Engineering/README.md#detection-gap-register) |
| **05** | PHP web shell upload and `id` execution | **Yes** | Auditd Rule 100199 (`/usr/bin/id`) + Suricata SID 2019284 | Case 01 | [Alerts #12 & #13](06-Resources/screenshots/thehive-alert/6.png) · [wzb-12](06-Resources/screenshots/wazuh-deep-investigation/wzb-12-webshell-dvwa-post-upload.jpg) |
| **06** | Interactive Netcat FIFO reverse shell on 4444 | **Yes** | Suricata SID 3400020 + Auditd `nc.openbsd` Rule 100199 | Case 01 | [Alerts #14 & #15](06-Resources/screenshots/thehive-alert/7.png) · [wzb-15](06-Resources/screenshots/wazuh-deep-investigation/wzb-15-revshell-auditd-stty-sane.jpg) |
| **07** | Passwordless sudo Python privesc to root | **Yes** | Linux PAM Rule 5402 (12x sudo alerts) + Rule 100220 | Case 01 | [PAM Telemetry](06-Resources/screenshots/wazuh-deep-investigation/wzb-17-privesc-pam-sudo-python-root.jpg) · [wzb-18](06-Resources/screenshots/wazuh-deep-investigation/wzb-18-privesc-auditd-sudo-l.jpg) |
| **08** | Root SSH key injection & interactive login | **Yes** | Wazuh SSH Rule 5715 + Rule 100220 (`authorized_keys`) | Case 02 | [Alert #16](06-Resources/screenshots/thehive-alert/8.png) · [wzb-19](06-Resources/screenshots/wazuh-deep-investigation/wzb-19-ssh-persist-auditd-authorized-keys.jpg) |
| **09** | Internal subnet discovery sweep from pivot | **Yes** | Suricata promiscuous sniffing (`ens37` SIDs 3400001/2) | Case 02 | [Alerts #17–#19](06-Resources/screenshots/thehive-alert/9.png) · [wzb-22](06-Resources/screenshots/wazuh-deep-investigation/wzb-22-discovery-suricata-internal-nmap.jpg) |
| **10** | Responder LLMNR poisoning & hash capture | **Yes** | Win10 EID 4688 `DavSetCookie` (Rule 100278) + SSH Staging | Case 02 | [Alert #20](06-Resources/screenshots/thehive-alert/10.png) · [wzb-28](06-Resources/screenshots/wazuh-deep-investigation/wzb-28-responder-win10-rundll32-davsetcookie.jpg) |
| **11** | Offline GPU cracking of NetNTLMv2 hash | **Attributed** | *Offline Gap (DG-11)*: Triangulated via Stage 10 capture & Stage 12 login | Case 02 | [Alert #21 (SCP)](06-Resources/screenshots/thehive-alert/11.png) · [DG-11](03-Detection-Engineering/README.md#detection-gap-register) |
| **12** | BloodHound Active Directory enumeration | **Yes** | Domain Controller EID 4624 (Custom Rule 100615 & 92657) | Case 02 | [Alert #22](06-Resources/screenshots/thehive-alert/12.png) · [wzb-32](06-Resources/screenshots/wazuh-deep-investigation/wzb-32-bloodhound-dc-eid4624-win10-ldap.jpg) |
| **13** | Kerberoasting request for `HANK_SHERMAN` | **Yes** | Suricata SID 2019922 (TGS-REQ wire frame) + Rule 100220 | Case 02 | [Alert #23](06-Resources/screenshots/thehive-alert/13.png) · [wzb-33](06-Resources/screenshots/wazuh-deep-investigation/wzb-33-kerberoast-auditd-getuserspns.jpg) |
| **14** | DCSync NTDS password hash extraction | **Yes** | Domain Controller EID 4672 `SeDebugPrivilege` (Rule 100603) | Case 02 | [Alert #24](06-Resources/screenshots/thehive-alert/14.png) · [wzb-34](06-Resources/screenshots/wazuh-deep-investigation/wzb-34-dcsync-auditd-secretsdump-ntds.jpg) |
| **15** | Pass-the-Hash remote WMI execution (`.10`) | **Yes** | Windows EID 4624 Logon Type 3 NTLM + Sysmon Rule 100613 | Case 03 | [Alerts #25 & #26](06-Resources/screenshots/thehive-alert/15.png) · [wzb-35](06-Resources/screenshots/wazuh-deep-investigation/wzb-35-pth-wazuh-eid4624-detection.jpg) |
| **16** | Forged Kerberos Golden Ticket via `ticketer` | **Yes** | Domain Controller EID 4624 + Sysmon EID 1 (`wmiexec -k`) | Case 03 | [Alerts #27 & #28](06-Resources/screenshots/thehive-alert/16.png) · [wzb-38](06-Resources/screenshots/wazuh-deep-investigation/wzb-38-goldenticket-auditd-ticketer-forgery.jpg) |
| **17** | Backdoor domain account added to Domain Admins | **Yes** | Windows Security EID 4720 (Rule 60109) & EID 4728 (Rule 60159) | Case 03 | [Alerts #29–#34](06-Resources/screenshots/thehive-alert/17.png) · [wzb-44](06-Resources/screenshots/wazuh-deep-investigation/wzb-44-persist-dc-eid4720-backdoor-created.jpg) |
| **18** | Automated sensitive data staging on DC & Win10 | **Yes** | Sysmon EID 1 process fan-out (Rules 100271, 100272, 100275) | Case 03 | [Alerts #35 & #36](06-Resources/screenshots/thehive-alert/18.png) · [wzb-49](06-Resources/screenshots/wazuh-deep-investigation/wzb-49-staging-sysmon-dc-domain-users-txt.jpg) |
| **19** | Rapid SCP exfiltration burst to Kali | **Yes** | Wazuh Rule 5715 Auth Rate Anomaly (6 sessions / 570 ms) | Case 03 | [Alert #37](06-Resources/screenshots/thehive-alert/19.png) · [wzb-53](06-Resources/screenshots/wazuh-deep-investigation/wzb-53-exfil-wazuh-sshd-rapid-sessions-burst.jpg) |
| **20** | Desktop defacement, ransom notes & reboots | **Yes** | Sysmon EID 1 (`reg.exe add`, Rule 92041) + System EID 1074 | Case 03 | [Alerts #38–#45](06-Resources/screenshots/thehive-alert/21.png) · [wzb-57](06-Resources/screenshots/wazuh-deep-investigation/wzb-57-impact-sysmon-dc-ransom-note-and-payload.jpg) |

---

## 📊 Scorecard & Ground-Truth Telemetry Accounting

| Telemetry Classification | Count | % | Ground-Truth Technical Verification |
|---|:---:|:---:|---|
| **Direct Target & Wire Detections** | **18** | **90.0%** | Dedicated host/network rules inspecting payload, process lineage, or network wire traffic on victim systems. |
| **Operational SOAR Alert Delivery** | **18** | **90.0%** | Delivered 46 prioritized incident tickets to TheHive 5 via Level $\ge 8$ threshold. |
| **Inherent Offline Computation Gaps** | **2** | **10.0%** | Stages 04 & 11 executed on external adversary GPU hardware; fully attributed via credential lifecycle analysis. |
| **Target-Side Logging Gaps** | **0** | **0.0%** | Zero unmonitored online stages; all network and endpoint actions produced telemetry. |
| **Rule Execution Failures** | **0** | **0.0%** | Zero engine crashes, syntax errors, or dropped packets across Wazuh, Suricata, and Sysmon. |

### Documented Defensive Limits & Engineering Backlog
To preserve professional rigor, this laboratory openly documents engineering boundaries and production limitations:
1. **Inherent Offline Gaps (`DG-04`, `DG-11`):** Offline dictionary attacks generate zero telemetry on victim infrastructure. SOC defenses must focus upstream on credential theft prevention and downstream on anomalous initial logons.
2. **Encrypted Transport Payload Boundary (`DG-19`):** SSH transport encryption prevented Suricata NIDS from inspecting plaintext filenames during SCP transfers; detection relied on host-level authentication rate anomaly correlation (Wazuh Rule 5715).
3. **Pre-Attack Active Directory Baseline Gaps:** Windows EID 4662 (DCSync replication rights SACL) and EID 1644 (Active Directory LDAP field engineering diagnostics) were unconfigured in default Windows baselines and were implemented during Phase 4 hardening.

---

## 📖 Recommended Role-Based Reading Paths

Depending on your engineering focus, navigate the repository through these curated paths:

- **For SOC Analysts & Incident Responders (30 mins):**
  1. [`04-Investigation/Initial-Triage-and-Investigation.md`](04-Investigation/Initial-Triage-and-Investigation.md) — How 46 incoming alerts were triaged, and why Critical Shellshock was deprioritized over Medium reverse shells.
  2. [`04-Investigation/Immediate-Containment-Execution.md`](04-Investigation/Immediate-Containment-Execution.md) — Active host lockout commands with photographic before-and-after verification.
  3. [`04-Investigation/Deep-Dive-Attack-Chain-Investigation.md`](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md) — 7-phase chronological narrative supported by 68 SIEM alert cards.
  4. [`05-Incident-Report/incident-report.md`](05-Incident-Report/incident-report.md) — Formal executive post-mortem incident report.

- **For Detection Engineers & Threat Hunters (25 mins):**
  1. [`03-Detection-Engineering/README.md`](03-Detection-Engineering/README.md) — Architecture, MITRE mapping, and empirical detection matrices.
  2. [`06-Resources/rules/wazuh/local_rules.xml`](06-Resources/rules/wazuh/local_rules.xml) — Custom Wazuh XML rules and noise suppressions.
  3. [`03-Detection-Engineering/Wazuh/README.md`](03-Detection-Engineering/Wazuh/README.md) — Deep technical rationale for Level 5 host command auditing (`bashcmd`).

- **For Cloud & Infrastructure Security Engineers (20 mins):**
  1. [`01-Lab-Setup/README.md`](01-Lab-Setup/README.md) — 7-node hybrid cloud architecture, network zones, and build profiles.
  2. [`01-Lab-Setup/Local/suricata-gateway.md`](01-Lab-Setup/Local/suricata-gateway.md) — Dual-interface NIDS configuration and Zero-NAT WireGuard tunnel design.
  3. [`01-Lab-Setup/Cloud/thehive.md`](01-Lab-Setup/Cloud/thehive.md) — Azure cloud ingress, Cassandra/Elasticsearch cluster, and reverse proxy setup.

- **For Red Teamers & Offensive Researchers (25 mins):**
  1. [`02-Attack-Simulation/README.md`](02-Attack-Simulation/README.md) — 20-stage adversary playbook overview.
  2. Standout attack stages: [Stage 03 SQLi](02-Attack-Simulation/Stages/stage-03-sqli.md), [Stage 10 Responder](02-Attack-Simulation/Stages/stage-10-responder.md), [Stage 14 DCSync](02-Attack-Simulation/Stages/stage-14-dcsync.md), [Stage 16 Golden Ticket](02-Attack-Simulation/Stages/stage-16-golden-ticket.md).

---

## 📜 Repository Navigation

- **01 — Laboratory Setup & Infrastructure**: [`01-Lab-Setup/`](01-Lab-Setup/)
- **02 — Adversary Attack Simulation**: [`02-Attack-Simulation/`](02-Attack-Simulation/)
- **03 — Detection Engineering**: [`03-Detection-Engineering/`](03-Detection-Engineering/)
- **04 — Incident Investigation & Triage**: [`04-Investigation/`](04-Investigation/)
- **05 — Post-Mortem Incident Report**: [`05-Incident-Report/`](05-Incident-Report/)
- **06 — Assets, Rules & Telemetry**: [`06-Resources/`](06-Resources/)
- **Master Traceability Matrix**: [`INDEX.md`](INDEX.md)
