# Hybrid-Cloud SOC & Threat Engineering Lab
### 7-Node Hybrid Network, 74-Minute Attack Campaign, Multi-Sensor Telemetry & SOC Incident Investigation

**Author:** Manichand Gupta ([@EclipseManic](https://github.com/EclipseManic))  
**Core Competencies:** Hybrid Infrastructure · Adversary Emulation (Red Team) · Multi-Sensor Detection Engineering · SOC Alert Triage & Incident Response  
**Live Interactive Report & Dashboard:** <https://soc-lab.eclipsemanic.me/>

---

I built an isolated hybrid-cloud security operations lab across **7 dedicated virtual machines**, executed an end-to-end **74-minute, 20-stage adversarial attack campaign** against it (spanning perimeter reconnaissance, web exploitation, Linux privilege escalation, network credential theft, and Active Directory domain takeover), authored custom multi-sensor detection rules, triaged **46 incoming incident alerts in TheHive 5.7.5**, and executed active containment and post-incident hardening.

[![SOC Lab Complete Architecture](06-Resources/diagrams/SOC_Lab_Architecture.png)](06-Resources/diagrams/SOC_Lab_Architecture.png)
*Figure 1: Hybrid-cloud topology connecting on-premise victim and attack subnets to Azure cloud SIEM and SOAR fabric over an encrypted Zero-NAT WireGuard tunnel.*

---

## 🛠️ Technology Stack & Defensive Arsenal

| Discipline | Technologies, Platforms & Frameworks |
|---|---|
| **Infrastructure & Cloud** | Microsoft Azure (Peered VNet `10.122.0.0/16`), VMware Workstation Pro, Ubuntu 24.04/22.04 LTS, Windows Server 2022 AD DS, Windows 10 Enterprise, WireGuard Site-to-Cloud VPN (`10.8.0.0/24`) |
| **SIEM & NIDS Telemetry** | Wazuh SIEM 4.14.8 (Manager, Indexer, OpenSearch Dashboard), Suricata 8.0.6 NIDS (Dual-interface promiscuous AF-PACKET capture on WAN `ens33` & LAN `ens37`) |
| **Host Telemetry & Auditing** | Microsoft Sysmon 15.20 (Process & Registry Logging), Linux Auditd (`execve` netlink monitoring), Custom Wazuh `bashcmd` Interactive Host Command Auditing (Rule `100220`) |
| **Incident Management & SOAR** | TheHive 5.7.5-1 (Case Management), Apache Cassandra 4.x, Elasticsearch 8.x, Custom Asynchronous Python SOAR Gateway (`custom-thehive.py`) with SQLite WAL buffer |
| **Adversary Emulation & TTPs** | MITRE ATT&CK Framework, Impacket (`wmiexec.py`, `secretsdump.py`, `GetUserSPNs.py`, `ticketer.py`), BloodHound (`bloodhound-python`), Responder, Hashcat, Hydra, Nmap, Nikto |

---

## 🏛️ The Four Operational Pillars

This project documents the complete lifecycle of defensive and offensive security operations:

```
[ 1. Infrastructure ] ──► [ 2. Attack Simulation ] ──► [ 3. Detection Engineering ] ──► [ 4. Incident Response ]
  • Hybrid Cloud (Azure)    • 20 MITRE ATT&CK Stages     • Custom Wazuh XML Rules         • 46 TheHive Alerts
  • 4 Network Segments      • 74-Minute Attack Campaign  • Suricata NIDS Signatures       • 3 Operational Cases
  • WireGuard S2S Tunnel    • Linux Host Compromise      • Sysmon & Auditd Baselines      • Active Containment
  • Active Directory Domain • Full AD Forest Takeover    • SQLite WAL SOAR Daemon         • Eradication & Post-Mortem
```

1. **Hybrid Infrastructure Engineering:** Deployed 7 VMs across Microsoft Azure and VMware Workstation Pro. Configured an encrypted Site-to-Cloud WireGuard tunnel with kernel IP forwarding and Zero-NAT routing, preserving authentic victim source IP addresses across all SIEM alerts. Ingress perimeter has exactly one open inbound port: UDP 51820 (WireGuard VPN) on VM1, with zero management ports exposed to the public internet.  
   *(Full host specifications, routing rules, and configurations: [`01-Lab-Setup/README.md`](01-Lab-Setup/README.md))*

2. **Adversary Attack Simulation (20 Stages / 74 Minutes):** Executed a continuous 3-act attack chain against the victim domain:
   - *Act 1: Web Compromise to Root (Stages 01–07):* Reconnaissance, login brute-forcing, SQL injection credential extraction, web shell upload, Netcat reverse shell, and passwordless sudo Python GTFOBins privilege escalation.
   - *Act 2: Pivot & Credential Access (Stages 08–14):* Root SSH key persistence, internal subnet discovery sweep, Responder LLMNR poisoning (`win10` hash capture), BloodHound AD enumeration, Kerberoasting (`HANK_SHERMAN`), and DCSync replication.
   - *Act 3: Domain Dominance & Disruption (Stages 15–20):* Pass-the-Hash remote WMI access (`wmiexec.py`), Kerberos Golden Ticket forgery (`ticketer.py`), backdoor Domain Admin persistence (`AD\backdoor`), automated data harvesting, rapid SCP exfiltration, wallpaper defacement, ransomware deployment, and forced reboots.  
   *(Execution commands, payloads, and red-team playbooks: [`02-Attack-Simulation/README.md`](02-Attack-Simulation/README.md))*

3. **Multi-Sensor Detection Engineering:** Authored and tuned 148 detection rules and 87 false-positive noise suppressions across Suricata wire inspection, Linux Auditd syscall hooks, Windows Sysmon process trees, and Active Directory security event logs. Implemented a two-tier SQLite WAL SOAR gateway (`custom-thehive.py`) with a 5-second sliding flush window to cluster 9,567 raw telemetry logs into 46 actionable incident cards without alert fatigue.  
   *(Ruleset files, decoders, and SOAR pipeline architecture: [`03-Detection-Engineering/README.md`](03-Detection-Engineering/README.md))*

4. **SOC Alert Triage, Investigation & Response:** Investigated all 46 incoming alerts in TheHive 5.7.5 across 3 formal cases. Executed tactical containment (quarantining web shells, severing reverse shells, locking rogue accounts, and executing an Active Directory double `krbtgt` password reset to **KVNO 3**). Produced executive post-mortem reports, technical IoC registers, and hardening backlog roadmaps.  
   *(Investigation walkthroughs, containment proof, and case exports: [`04-Investigation/README.md`](04-Investigation/README.md))*

[![74-Minute Attack & Investigation Timeline](06-Resources/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)](06-Resources/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)
*Figure 2: Chronological 74-minute attack campaign and incident investigation timeline mapping telemetry spikes from initial probe to final case resolution.*

---

## 🗂️ TheHive 5.7.5 Incident Cases & Operational Triage

Incoming alerts were triaged and grouped into three operational incident cases in TheHive:

[![TheHive Severity Queue](06-Resources/screenshots/initial-triage/slot_01_thehive_severity_queue.png)](06-Resources/screenshots/initial-triage/slot_01_thehive_severity_queue.png)
*Figure 3: Live TheHive 5.7.5 alert queue sorted by severity. Operational triage insight: automated web fuzzing triggered noisy "Critical" alerts (Shellshock probes), while active reverse shells and DCSync replication arrived as "Medium" alerts requiring analyst escalation.*

[![TheHive Resolved Cases Overview](06-Resources/screenshots/thehive-cases/thehive_cases_overview_resolved.png)](06-Resources/screenshots/thehive-cases/thehive_cases_overview_resolved.png)
*Figure 4: All three formal incident cases closed and resolved following active host containment and enterprise eradication.*

| Case ID | Incident Scope | Stages | Real Priority | Tactical Containment Actions | Resolution Status |
|:---:|---|:---:|:---:|---|:---:|
| **`CAS-001-WEBCOMP`** | Web Compromise to Root | 01–07 | **P1 (Critical)** | Terminated reverse shell on TCP 4444; quarantined `shell.php` (`chmod 000`); revoked sudoers NOPASSWD directive; enforced `PermitRootLogin no`. | **Resolved / Closed** |
| **`CAS-002-LATMOVE`** | Lateral Movement & AD Access | 08–14 | **P1 (Critical)** | Purged injected SSH keys; disabled LLMNR and NetBIOS via GPO; demoted `HANK_SHERMAN` and stripped SPN; cryptographically shredded staged hash dumps (`shred -u -z -n 3`). | **Resolved / Closed** |
| **`CAS-003-DOMIMP`** | Domain Takeover & Impact | 15–20 | **P1 (Critical)** | Blocked adversary IP on perimeter; disabled rogue account `AD\backdoor`; completed double `krbtgt` password reset (**KVNO 3**); repaired desktop wallpaper registry. | **Resolved / Closed** |

---

## 📊 Scorecard & Ground-Truth Telemetry Accounting

Empirical results from the 20-stage attack simulation across all monitored sensors:

| Telemetry Classification | Count | % | Ground-Truth Technical Verification |
|---|:---:|:---:|---|
| **Direct Target & Network Detections** | **14** | **70.0%** | Dedicated host/network rules inspecting payload, process lineage, or network wire traffic on victim systems. |
| **Operational Pivot-Only Alerts** | **2** | **10.0%** | Attacking session/pivot caught (`bashcmd` / SSH burst / Kali IP), but target DC missed technique logging (Stages 14, 16). |
| **Target-Side Logging Gaps** | **2** | **10.0%** | Host-level event logging unconfigured in pre-attack baseline (Stage 09 L2 drops, Stage 12 EID 1644 LDAP). |
| **Inherent Offline Computation Gaps** | **2** | **10.0%** | Stages 04 & 11 executed on external adversary GPU hardware; fully attributed via credential lifecycle analysis. |
| **Operational SOAR Case Delivery** | **16** | **80.0%** | Delivered 46 prioritized incident tickets to TheHive 5.7.5 via Level $\ge 8$ threshold across 16 attack stages. |
| **SIEM / Pipeline Engine Parser Errors** | **0** | **0.0%** | Zero syntax errors, decoder crashes, or pipeline rule execution failures across Wazuh and Suricata. |

> **Master Traceability Matrix:** For the complete, row-by-row mapping of all 20 adversary stages against ATT&CK technique IDs, SIEM alert IDs, active rule numbers, and visual proof links, see [`INDEX.md`](INDEX.md).

### Documented Defensive Limits & Engineering Backlog
To preserve professional integrity, this laboratory transparently catalogs engineering boundaries and production limitations:
1. **Inherent Offline Gaps (`DG-04`, `DG-11`):** Offline dictionary attacks generate zero network packets or host processes on victim infrastructure. Defense relies upstream on credential theft prevention and downstream on anomalous initial authentication alerts.
2. **Target-Side Diagnostic Logging Gaps (`DG-09`, `DG-12`):** Intra-subnet Layer 2 sweeps lacked host firewall drop logging (`DG-09`), and Active Directory LDAP reconnaissance lacked Event ID 1644 query diagnostics in the pre-attack baseline (`DG-12`). Both are documented as **formal post-incident recommendations** in [`05-Incident-Report/lessons-learned.md`](05-Incident-Report/lessons-learned.md) (e.g. EID 1644 assigned as a P1 backlog item with a 14-day SLA).
3. **Operational Pivot-Only Telemetry (`DG-14`, `DG-16`):** Telemetry was logged locally in `Security.evtx` on the Domain Controller (EID 4662 for DCSync replication; EID 4769 for Kerberos service tickets) but was not forwarded or alerted to the SIEM/SOAR. Detection relied on pivot host command auditing (`bashcmd`) and session anomalies, leading directly to the SIEM rule expansion recommendations in `lessons-learned.md`.
4. **Encrypted Transport Payload Boundary (`DG-19`):** SSH transport encryption prevented Suricata NIDS from inspecting plaintext filenames during SCP transfers; detection relied on host-level authentication rate anomaly correlation (Wazuh Rule 5715).

---

## 📑 Post-Incident Reports & Security Deliverables

Key post-mortem engineering assets produced from this investigation:
- **Master MITRE ATT&CK Mapping:** [`05-Incident-Report/mitre-attack-mapping.md`](05-Incident-Report/mitre-attack-mapping.md) — Comprehensive technique mapping across Enterprise ATT&CK matrix.
- **Comprehensive IoC Register:** [`05-Incident-Report/iocs.md`](05-Incident-Report/iocs.md) — Atomic network, host, and behavioral indicators of compromise.
- **Strategic Lessons Learned & Hardening Roadmap:** [`05-Incident-Report/lessons-learned.md`](05-Incident-Report/lessons-learned.md) — Architectural analysis of detection gaps and enterprise defense recommendations.
- **Chronological 74-Minute Attack & Alert Timeline:** [`05-Incident-Report/timeline.md`](05-Incident-Report/timeline.md) — Microsecond-level correlation of all 20 adversary stages against SIEM alert timestamps.
- **Master Traceability Matrix:** [`INDEX.md`](INDEX.md) — Single source of truth linking every attack stage, alert ID, rule definition, and investigation case.

---

## 🔬 Technical Reproducibility

Every component of this laboratory can be reproduced in any virtualized or bare-metal environment:
- Configuration templates for Wazuh Manager, Agent, Suricata NIDS, Sysmon, and Auditd are located in [`06-Resources/configs/`](06-Resources/configs/).
- Custom Wazuh rules and Suricata signatures are version-controlled in [`06-Resources/rules/`](06-Resources/rules/).
- Automated integration scripts—including the SQLite WAL SOAR daemon—are provided in [`06-Resources/scripts/`](06-Resources/scripts/).

---

## 🔒 Lab-Only Credentials & Redaction Boundary

All sensitive secrets, cloud tenant IDs, and private keys are redacted in accordance with [`SECURITY.md`](SECURITY.md). Passwords, NTLM challenge responses, Kerberos tickets, and user hashes documented across write-ups (e.g. `P@ssw0rd123!`, `HANK_SHERMAN` hashes) are **ephemeral, lab-only fixtures** generated exclusively within this private, isolated testbed.

---

## 📖 Recommended Role-Based Reading Paths

Navigate the repository through these curated paths:

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

## ⚖️ Disclaimer & License

> **Authorized Educational Research Only:** All attack simulations and defensive telemetry in this project were executed against dedicated, isolated virtual machines in a private lab environment owned and controlled by the author. No production systems or unauthorized networks were targeted. See [DISCLAIMER.md](DISCLAIMER.md) and [SECURITY.md](SECURITY.md).

This project is licensed under the [MIT License](LICENSE).  
Copyright © 2026 Manichand Gupta.
