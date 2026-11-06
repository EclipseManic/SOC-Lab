# Hybrid-Cloud SOC & Threat Engineering Lab
### 7-Node Hybrid Network, 74-Minute Attack Campaign, Multi-Sensor Detection & Incident Investigation

**Author:** Manichand Gupta ([@EclipseManic](https://github.com/EclipseManic))  
**Core Focus:** Hybrid Cloud Architecture · Red Team Attack Simulation · Detection Engineering · Hands-On SOC Triage & Incident Response  
**Live Interactive Dashboard:** <https://soc-lab.eclipsemanic.me/>

---

I built a complete, hands-on Security Operations Center (SOC) lab across **7 virtual machines**, connecting local VMware networks to Microsoft Azure over an encrypted WireGuard VPN tunnel. 

To test how well modern defenses actually hold up against a determined attacker, I executed an end-to-end **74-minute, 20-stage attack campaign** against it. The attack moved through the entire cyber kill chain—starting with perimeter web scanning, turning into root access on Linux in 10 seconds, pivoting into the internal Windows network, pulling off a DCSync attack, forging a Kerberos Golden Ticket, and dropping simulated ransomware on both the Domain Controller and workstation.

On the defensive side, I wrote custom multi-sensor detection rules across Suricata (network wire), Linux Auditd & bash command auditing (kernel and shell), and Windows Sysmon (endpoints). Our custom SOAR gateway triaged and grouped **46 incoming alerts into 3 formal incident cases in TheHive 5.7.5**, where I led active containment (including a double `krbtgt` password reset to **KVNO 3**) and post-incident hardening.

[![SOC Lab Complete Architecture](06-Resources/diagrams/SOC_Lab_Architecture.png)](06-Resources/diagrams/SOC_Lab_Architecture.png)
*Figure 1: Full hybrid-cloud architecture connecting on-premise victim and attacker subnets to Azure cloud SIEM and SOAR servers over an encrypted WireGuard tunnel.*

---

## 🛠️ Technology Stack & Defensive Arsenal

| Category | Platforms, Tools & Frameworks |
|---|---|
| **Cloud & Infrastructure** | Microsoft Azure (Private VNet `10.122.0.0/16`), VMware Workstation Pro, Ubuntu 24.04 LTS, Windows Server 2022 (Active Directory), Windows 10 Pro N for Workstations (22H2), WireGuard VPN (`10.8.0.0/24`) |
| **Network & SIEM** | Wazuh SIEM 4.14.8 (Manager, Indexer, OpenSearch Dashboard), Suricata 8.0.6 NIDS (Sniffing WAN `ens33` and LAN `ens37` interfaces) |
| **Endpoint Telemetry** | Microsoft Sysmon 15.20 (Process and Registry monitoring), Linux Auditd (`execve` syscall tracking), Custom Wazuh `bashcmd` Interactive Command Auditing (Rule `100220`) |
| **Incident Management & SOAR** | TheHive 5.7.5-1 (Case Management), Apache Cassandra 4.x, Elasticsearch 8.x, Custom Python SOAR Gateway (`custom-thehive.py`) with SQLite WAL buffering |
| **Attack Simulation & Tools** | MITRE ATT&CK Framework, Impacket suite (`wmiexec.py`, `secretsdump.py`, `GetUserSPNs.py`, `ticketer.py`), BloodHound (`bloodhound-python`), Responder, Hashcat, Hydra, Nmap, Nikto |

---

## 🏛️ The Four Pillars of the Lab

This project covers the complete lifecycle of both offensive and defensive cybersecurity:

| 1. Infrastructure | 2. Attack Simulation | 3. Detection Engineering | 4. Incident Response |
|---|---|---|---|
| • Hybrid Cloud (Azure)<br>• 4 Network Segments<br>• WireGuard S2S Tunnel<br>• Active Directory Domain | • 20 MITRE ATT&CK Stages<br>• 74-Minute Attack Campaign<br>• Linux Host Compromise<br>• Full AD Forest Takeover | • Custom Wazuh XML Rules<br>• Suricata NIDS Signatures<br>• Sysmon & Auditd Baselines<br>• SQLite WAL SOAR Daemon | • 46 TheHive Alerts<br>• 3 Operational Cases<br>• Active Containment<br>• Eradication & Hardening |

1. **Hybrid Infrastructure Engineering:** Built 7 VMs across Microsoft Azure and VMware Workstation Pro. Set up an encrypted Site-to-Cloud WireGuard tunnel with kernel IP forwarding and Zero-NAT routing, so alerts retain the real victim and attacker IP addresses. The cloud perimeter has exactly one open inbound door: UDP port 51820 for WireGuard VPN, with zero management ports exposed to the public internet.  
   *(Full host setups, network configs, and scripts: [`01-Lab-Setup/README.md`](01-Lab-Setup/README.md))*

2. **Adversary Attack Simulation (20 Stages / 74 Minutes):** Ran a realistic 3-act attack chain against the lab:
   - *Act 1: Breaking in and getting Root (Stages 01–07):* Network scanning, web brute-force, SQL injection to steal passwords, PHP webshell upload, Netcat reverse shell, and instant passwordless sudo privilege escalation to root.
   - *Act 2: Pivoting and Stealing Active Directory Credentials (Stages 08–14):* Dropping an SSH backdoor key, sweeping the internal subnet, running Responder to poison LLMNR and steal the Windows 10 password hash, mapping the domain with BloodHound, Kerberoasting `HANK_SHERMAN`, and running DCSync to replicate domain hashes.
   - *Act 3: Complete Domain Takeover & Impact (Stages 15–20):* Passing the Administrator hash via WMI (`wmiexec.py`), forging a Kerberos Golden Ticket (`ticketer.py`), creating a backdoor Domain Admin user (`AD\backdoor`), harvesting sensitive files and exfiltrating them over SSH, defacing desktops, dropping simulated ransomware notes, and rebooting the systems.  
   *(Full commands, payloads, and red-team notes: [`02-Attack-Simulation/README.md`](02-Attack-Simulation/README.md))*

3. **Multi-Sensor Detection Engineering:** Authored and tuned 148 detection rules and 87 false-positive suppression rules across Suricata wire inspection, Linux Auditd syscalls, Windows Sysmon process trees, and Active Directory security event logs. Built an asynchronous Python SOAR gateway (`custom-thehive.py`) with SQLite WAL buffering and a 5-second sliding window to group 9,567 raw logs into 46 clean incident tickets without flooding the analyst desk.  
   *(Rule files, decoders, and SOAR setup: [`03-Detection-Engineering/README.md`](03-Detection-Engineering/README.md))*

4. **SOC Alert Triage, Investigation & Incident Response:** Handled all 46 incoming alerts in TheHive 5.7.5 across 3 formal incident cases. Carried out hands-on containment (quarantining web shells, killing reverse shells, disabling rogue accounts, and performing a double `krbtgt` password reset to **KVNO 3**). Authored post-mortem incident reports, technical IoC lists, and remediation roadmaps.  
   *(Case investigations, containment commands, and proof: [`04-Investigation/README.md`](04-Investigation/README.md))*

[![74-Minute Attack & Investigation Timeline](06-Resources/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)](06-Resources/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)
*Figure 2: Complete 74-minute chronological timeline mapping attacker actions (top) against blue-team detection alerts across Suricata, Auditd, Wazuh, Sysmon, and TheHive (bottom).*

---

## 🗂️ TheHive 5.7.5 Incident Cases & Real-World Triage

All incoming alerts were triaged and grouped into three operational cases in TheHive:

[![TheHive Severity Queue](06-Resources/screenshots/initial-triage/slot_01_thehive_severity_queue.png)](06-Resources/screenshots/initial-triage/slot_01_thehive_severity_queue.png)
*Figure 3: Live TheHive 5.7.5 alert queue sorted by severity. Real-world triage takeaway: automated web fuzzing triggered noisy "Critical" alerts (Shellshock probes), while live reverse shells and DCSync replication arrived as "Medium" alerts that required quick analyst attention.*

[![TheHive Resolved Cases Overview](06-Resources/screenshots/thehive-cases/thehive_cases_overview_resolved.png)](06-Resources/screenshots/thehive-cases/thehive_cases_overview_resolved.png)
*Figure 4: All three formal incident cases resolved and closed after active containment and enterprise cleanup.*

| Case ID | Incident Scope | Stages | Priority | Real Containment Actions Taken | Status |
|:---:|---|:---:|:---:|---|:---:|
| **`CAS-001-WEBCOMP`** | Web Compromise to Root | 01–07 | **P1 (Critical)** | Killed reverse shell on port 4444; locked down `shell.php` (`chmod 000`); revoked the sudoers NOPASSWD misconfiguration; disabled root SSH logins. | **Resolved / Closed** |
| **`CAS-002-LATMOVE`** | Lateral Movement & AD Access | 08–14 | **P1 (Critical)** | Removed injected attacker SSH keys; disabled LLMNR and NetBIOS across the domain via GPO; demoted `HANK_SHERMAN` and removed its SPN; securely shredded staged hash files (`shred -u -z -n 3`). | **Resolved / Closed** |
| **`CAS-003-DOMIMP`** | Domain Takeover & Impact | 15–20 | **P1 (Critical)** | Blocked attacker IP on the firewall; disabled rogue account `AD\backdoor`; completed an Active Directory double `krbtgt` password reset (**KVNO 3**); restored workstation desktop settings. | **Resolved / Closed** |

---

## 📊 Honest Detection Scorecard: What We Caught & What Slipped Through

In cybersecurity, anyone who claims 100% automated detection is either running a scripted demo or hiding their blind spots. In this lab, we ran authentic offensive tools against standard corporate baselines. Here are the honest, ground-truth results across all 20 attack stages:

| Telemetry Category | Stages | % | How It Actually Performed in the Lab |
|---|:---:|:---:|---|
| **Direct Host & Network Detections** | **14** | **70.0%** | Caught red-handed on the victim machine or wire by custom rules inspecting payloads, process trees, authentication, or network traffic. |
| **Operational Pivot-Only Alerts** | **2** | **10.0%** | The target Domain Controller missed specific technique logging (Stages 14 and 16), but we caught the attacker typing the commands on the Linux pivot host (`bashcmd` / SSH anomalies). |
| **Target-Side Logging Gaps** | **2** | **10.0%** | Default Windows logging didn't capture internal subnet port sweeps (`DG-09`) or LDAP queries (`DG-12`) without extra diagnostic policies turned on. |
| **Inherent Offline Activity** | **2** | **10.0%** | Password cracking ran offline on the attacker's own GPU (Stages 04 and 11), generating zero victim packets. We caught them upstream when they stole the hashes, and downstream when they used them to log in! |
| **Alerts Delivered to TheHive** | **16** | **80.0%** | Delivered 46 high-priority incident tickets to TheHive 5.7.5 via our Level $\ge 8$ threshold across 16 different attack stages. |
| **Rule & Pipeline Crashes** | **0** | **0.0%** | Zero syntax errors, decoder crashes, or failed rules across both Wazuh and Suricata throughout the entire 74-minute run. |

> **Master Traceability Matrix:** To see every stage mapped row-by-row against MITRE ATT&CK technique IDs, SIEM alert IDs, active rule numbers, and visual proof links, check out [`INDEX.md`](INDEX.md).

### Transparent Defensive Limits & Hardening Backlog
We believe in full transparency about what standard baselines miss and what needs extra configuration:
1. **Offline Password Cracking (`DG-04`, `DG-11`):** You can't put a sensor on an attacker's laptop. When an adversary cracks hashes offline with Hashcat, detection depends entirely on stopping credential theft beforehand and spotting the unusual logon when they return.
2. **Missing Diagnostic Logging (`DG-09`, `DG-12`):** Default Windows baselines don't log dropped Layer 2 network sweeps (`DG-09`) or Active Directory LDAP lookups (`DG-12`). In a production network, you need Windows Filtering Platform logging for dropped packets and Event ID 1644 registry logging for expensive LDAP searches. Both are documented as **formal remediation tasks** in [`05-Incident-Report/lessons-learned.md`](05-Incident-Report/lessons-learned.md).
3. **Pivot-Only Visibility (`DG-14`, `DG-16`):** For DCSync (`DG-14`) and Kerberos Golden Tickets (`DG-16`), the Domain Controller didn't have Directory Service Replication SACLs (EID 4662) or Ticket Granting Service auditing (EID 4769) enabled out of the box, although it did log generic logon (EID 4624) and privileged session (EID 4672) events. Fortunately, our Linux command audit pipeline caught Impacket's `secretsdump.py` and `ticketer.py` commands on the pivot host, showing why defense-in-depth is essential.
4. **Encrypted Network Traffic (`DG-19`):** When the attacker stole files over SSH (SCP), the network traffic was encrypted, so Suricata couldn't see the file names inside the packets. Instead, Wazuh caught the rapid burst of 6 SSH authentication sessions in 0.57 seconds.

---

## 📑 Post-Incident Reports & Security Deliverables

Everything produced from this investigation is organized into dedicated deliverables:
- **Master MITRE ATT&CK Mapping:** [`05-Incident-Report/mitre-attack-mapping.md`](05-Incident-Report/mitre-attack-mapping.md) — Technique-by-technique breakdown across the ATT&CK matrix.
- **Incident IoC Register:** [`05-Incident-Report/iocs.md`](05-Incident-Report/iocs.md) — Exact file hashes, IP addresses, rogue usernames, and command indicators.
- **Lessons Learned & Hardening Roadmap:** [`05-Incident-Report/lessons-learned.md`](05-Incident-Report/lessons-learned.md) — Detailed technical root-cause analysis and prioritized defensive upgrades.
- **Chronological 74-Minute Timeline:** [`05-Incident-Report/timeline.md`](05-Incident-Report/timeline.md) — Correlating attack milestones and detection alerts minute-by-minute.
- **Master Traceability Matrix:** [`INDEX.md`](INDEX.md) — The single source of truth linking every attack stage, rule ID, alert, and case.

---

## 🔬 Reproducing This Lab Yourself

You can replicate this entire setup in your own environment:
- Configuration templates for Wazuh Manager, Agent, Suricata, Sysmon, and Auditd are in [`06-Resources/configs/`](06-Resources/configs/).
- Custom Wazuh XML rules and Suricata rules are version-controlled in [`06-Resources/rules/`](06-Resources/rules/).
- The Python SOAR gateway script and database setup are provided in [`06-Resources/scripts/`](06-Resources/scripts/).

---

## 🔒 Redaction & Safe Credentials

All private cloud subscription IDs, management SSH keys, and public IP addresses have been redacted according to [`SECURITY.md`](SECURITY.md). All passwords, NTLM hashes, and Kerberos tickets shown in the documentation (such as `P@ssw0rd123!` or `HANK_SHERMAN` hashes) are **lab-only test fixtures** created exclusively inside this isolated network.

---

## 📖 Recommended Reading Paths

Choose the path that fits what you're looking for:

- **For SOC Analysts & Incident Responders (30 mins):**
  1. [`04-Investigation/Initial-Triage-and-Investigation.md`](04-Investigation/Initial-Triage-and-Investigation.md) — How we triaged 46 alerts and why Shellshock noise was deprioritized over real reverse shells.
  2. [`04-Investigation/Immediate-Containment-Execution.md`](04-Investigation/Immediate-Containment-Execution.md) — Real response commands with visual before-and-after proof.
  3. [`04-Investigation/Deep-Dive-Attack-Chain-Investigation.md`](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md) — The complete 7-phase story backed by 68 SIEM alert cards.
  4. [`05-Incident-Report/incident-report.md`](05-Incident-Report/incident-report.md) — Executive post-mortem incident report.

- **For Detection Engineers & Threat Hunters (25 mins):**
  1. [`03-Detection-Engineering/README.md`](03-Detection-Engineering/README.md) — Detection architecture, custom rules, and tuning decisions.
  2. [`06-Resources/rules/wazuh/local_rules.xml`](06-Resources/rules/wazuh/local_rules.xml) — Our custom Wazuh XML rules and noise suppressions.
  3. [`03-Detection-Engineering/Wazuh/README.md`](03-Detection-Engineering/Wazuh/README.md) — Why and how we built host command auditing (`bashcmd`).

- **For Cloud & Infrastructure Engineers (20 mins):**
  1. [`01-Lab-Setup/README.md`](01-Lab-Setup/README.md) — 7-node hybrid cloud network design and VM build specs.
  2. [`01-Lab-Setup/Local/suricata-gateway.md`](01-Lab-Setup/Local/suricata-gateway.md) — Dual-homed network sensor and Zero-NAT WireGuard tunnel design.
  3. [`01-Lab-Setup/Cloud/thehive.md`](01-Lab-Setup/Cloud/thehive.md) — Azure cloud ingress, Cassandra/Elasticsearch cluster, and reverse proxy setup.

- **For Red Teamers & Penetration Testers (25 mins):**
  1. [`02-Attack-Simulation/README.md`](02-Attack-Simulation/README.md) — 20-stage adversary playbook overview.
  2. Top attack stages: [Stage 03 SQLi](02-Attack-Simulation/Stages/stage-03-sqli.md), [Stage 10 Responder](02-Attack-Simulation/Stages/stage-10-responder.md), [Stage 14 DCSync](02-Attack-Simulation/Stages/stage-14-dcsync.md), [Stage 16 Golden Ticket](02-Attack-Simulation/Stages/stage-16-golden-ticket.md).

---

## ⚖️ Disclaimer & License

> **Authorized Educational Research Only:** All attacks and defenses documented here were conducted entirely inside an isolated, private virtual laboratory owned and managed by the author. No real-world production networks or external targets were touched. See [DISCLAIMER.md](DISCLAIMER.md) and [SECURITY.md](SECURITY.md).

This project is licensed under the [MIT License](LICENSE).  
Copyright © 2026 Manichand Gupta.
