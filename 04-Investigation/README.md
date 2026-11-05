# 04 — Incident Investigation & Forensic Analysis

Welcome to the **Incident Investigation** section of the SOC Lab repository. This directory represents the defender and DFIR (Digital Forensics and Incident Response) analyst view of the campaign. It documents the end-to-end journey from initial alert triage and queue prioritization, through live host containment and artifact collection, to forensic root-cause analysis and enterprise hardening.

[![SOC Analyst Investigation Lifecycle](../06-Resources/diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png)](../06-Resources/diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png)
*Figure 1: SOC Analyst Investigation Lifecycle from alert ingestion to case resolution and post-incident remediation.*

---

## 📑 Core Investigation Architecture

To avoid fragmenting a single orchestrated enterprise intrusion into twenty disconnected notes, our investigation is structured into **three operational tiers**:

```
04-Investigation/
├── README.md                                           # Master navigation & investigation guide (this file)
├── Initial-Triage-and-Investigation.md                 # Tier 1: Alert triage, queue sorting & pipeline critique
├── Immediate-Containment-Execution.md                  # Tier 1: Live tactical containment & lockout execution
├── Deep-Dive-Attack-Chain-Investigation.md             # Tier 1: Definitive forensic attack chain storyline & root cause
├── Eradication-Hardening-and-Recovery.md               # Tier 1: Root-cause remediation, asset recovery & case closure
└── Cases/                                              # Tier 2: TheHive Case Management Records
    ├── case-01-web-compromise.md                       # Case 01: Perimeter breach, SQLi, webshell & sudo privesc
    ├── case-02-lateral-movement.md                     # Case 02: Pivot persistence, LLMNR poisoning & DCSync
    └── case-03-domain-compromise.md                    # Case 03: Golden ticket, domain admin takeover & impact
```

---

## 🛡️ Tier 1: Core Incident Response Records

These four master documents constitute the primary forensic and operational records of this campaign:

| Document | Operational Scope | Key Analyst Findings & Artifacts |
|:---|:---|:---|
| **[`Initial-Triage-and-Investigation.md`](Initial-Triage-and-Investigation.md)** | **Queue Triage & Alert Analysis** | • Prioritization of **46 TheHive alerts** by severity (Critical → High → Medium)<br>• Comprehensive Master Triage Register<br>• Technical critique of **8 detection pipeline flaws** (over-alerting, raw IP titles, static regex matching)<br>• 6-window chronological timeline supported by 26 triage screenshots |
| **[`Immediate-Containment-Execution.md`](Immediate-Containment-Execution.md)** | **Operational Threat Containment** | • **7 sequential containment actions** severing attacker footholds<br>• Velociraptor VQL artifact collection & enterprise PowerShell workflows<br>• Before/after forensic states across Linux DMZ and Windows DC/Workstation<br>• Photographic proof of adversary lockout supported by 15 containment screenshots |
| **[`Deep-Dive-Attack-Chain-Investigation.md`](Deep-Dive-Attack-Chain-Investigation.md)** | **Master Forensic Deep-Dive** | • **7-phase end-to-end attack chain narrative** connecting every alert and host action<br>• Deep-dive technical breakdown of **7 systemic organizational vulnerabilities**<br>• Master Indicators of Compromise (IoC) Register (network, host, accounts, hashes)<br>• Strategic Active Directory, DMZ, and SIEM hardening roadmap<br>• Complete 68-screenshot forensic telemetry index (`wzb-01` to `wzb-68`) |
| **[`Eradication-Hardening-and-Recovery.md`](Eradication-Hardening-and-Recovery.md)** | **Eradication, Hardening & Recovery** | • **Permanent eradication of all 7 root causes** (sudoers Python, SSH root, upload execution, AD backdoor, SPN, LLMNR/NetBIOS, DMZ egress)<br>• Adversary anti-forensics audit (`history | grep rm`), `/tmp/` clean verification & `/opt/Responder` purge<br>• Enterprise credential rotation, `Protected Users` enrollment & `krbtgt` KVNO 3 verification<br>• Complete disposition of all **46 TheHive alerts** and formal closure of Cases 01–03 supported by 20 eradication & case closure screenshots |

---

> [!NOTE]
> ### ⏱️ Telemetry Ingestion Latency, Buffer Flushing & Multi-Sensor Arrival Mechanics
> When analyzing timelines across network sensors, Linux kernel hooks, Windows event logs, and SOAR case cards, minor timestamp offsets (1–3 seconds, or up to minutes for interactive shells) naturally occur:
> 1. **SOAR Fast-Path vs. OpenSearch Indexing:** `wazuh-integratord` hooks directly into the core engine in memory, dispatching Level >= 8 alerts to `custom-thehive` in < 0.2 ms. OpenSearch Dashboard indexing requires Filebeat buffer flushing and cluster indexing, meaning TheHive incident cases frequently register **1–3 seconds before** the dashboard displays them.
> 2. **Linux Shell `PROMPT_COMMAND` Flushing:** Wazuh command-line logging (`bashcmd` / Rule 100220) relies on `PROMPT_COMMAND`, which executes **only after a command terminates** and the prompt returns. Long-running or interactive tools (`Responder.py`, `wmiexec.py`) log to Suricata and Windows in real-time on wire arrival, while `bashcmd` writes to disk only when the operator exits or interrupts (`Ctrl+C`).
> 3. **Live Campaign Multi-Attempt Sequences:** Live execution involved realistic operator retries (e.g. quote handling, syntax adjustments). TheHive anchored the alert card to the first trigger in its 5-second aggregation window, while specific Wazuh Dashboard screenshots reflect subsequent iterations in that attempt cluster.

---

## 🗂️ Tier 2: TheHive Case Management Records

In modern Security Operations Centers, alerts are triaged into incident cases within a Case Management Platform (TheHive). Rather than creating twenty micro-cases, all alerts from this campaign are grouped into three operational cases matching attack scope and operational boundaries:

| Case Record | TheHive ID | Scope & Stages | Summary of Covered Tactics |
|:---|:---:|:---:|:---|
| **[`Cases/case-01-web-compromise.md`](Cases/case-01-web-compromise.md)** | `CAS-001-WEBCOMP` | **Stages 01–07** | External port scanning (Nmap), web fuzzing (Nikto/Dirbuster), automated credential brute-forcing, SQL injection extraction, arbitrary webshell upload, and **instant privilege escalation to root via sudoers Python misconfiguration**. |
| **[`Cases/case-02-lateral-movement.md`](Cases/case-02-lateral-movement.md)** | `CAS-002-LATMOVE` | **Stages 08–14** | Injected root SSH public key persistence, internal subnet network discovery, broadcast poisoning (Responder) capturing `AD.LAB\win10` NTLMv2 hash, BloodHound AD enumeration, Kerberoasting (`HANK_SHERMAN`), and **DCSync directory replication**. |
| **[`Cases/case-03-domain-compromise.md`](Cases/case-03-domain-compromise.md)** | `CAS-003-DOMIMP` | **Stages 15–20** | Pass-the-Hash arrival on Domain Controller, Kerberos Golden Ticket forgery (`krbtgt`), hidden backdoor user creation elevated to `Domain Admins`, sensitive data staging and exfiltration, and **dual-endpoint desktop defacement and simulated ransomware impact**. |

---

## 🔍 Master 20-Stage Attack-to-Investigation Traceability Matrix

Every technique executed during the offensive campaign maps directly to our defensive telemetry, TheHive case structure, and deep-dive forensic writeup:

| # | Stage Name | ATT&CK ID | Attack Simulation Record | Monitored Sensor & Alert Rule | Assigned TheHive Case | Deep-Dive Forensic Coverage | Detection Verdict |
|:---:|:---|:---:|:---|:---|:---:|:---|:---|
| **01** | Reconnaissance | `T1595.001` | [Stage 01 Doc](../02-Attack-Simulation/Stages/stage-01-recon.md) | Suricata NIDS (PostgreSQL 5432, Nmap -sS) | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Direct Detection** |
| **02** | Brute Force | `T1110.001` | [Stage 02 Doc](../02-Attack-Simulation/Stages/stage-02-bruteforce.md) | Suricata (python-requests) / Wazuh 100213 | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Direct Detection** |
| **03** | SQL Injection | `T1190` | [Stage 03 Doc](../02-Attack-Simulation/Stages/stage-03-sqli.md) | Suricata SID 2010963 / Custom Wazuh Rule 100600 & Rule 100200 | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Direct Detection** |
| **04** | Hash Cracking | `T1110.002` | [Stage 04 Doc](../02-Attack-Simulation/Stages/stage-04-hash-crack.md) | *None (Offline Activity on Kali — Bracketed by Stage 03 & 05)* | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Investigatively Attributed (Offline Gap DG-04)** |
| **05** | Web Shell Upload | `T1505.003` | [Stage 05 Doc](../02-Attack-Simulation/Stages/stage-05-webshell.md) | Apache Access Logs / Auditd `/usr/bin/id` | Case 01 | [Phase 2 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | **Direct Detection** |
| **06** | Reverse Shell | `T1059.004` | [Stage 06 Doc](../02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | Auditd Rule `web_process_creation` (stty sane) | Case 01 | [Phase 2 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | **Direct Detection** |
| **07** | Privilege Escalation | `T1548.003` | [Stage 07 Doc](../02-Attack-Simulation/Stages/stage-07-privesc.md) | Wazuh Rule 5402 (`sudo python3 to ROOT`) | Case 01 | [Phase 2 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | **Direct Detection** |
| **08** | SSH Persistence | `T1098.004` | [Stage 08 Doc](../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | Wazuh Rule 100220 & Rule 5715 | Case 02 | [Phase 3 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | **Direct Detection** |
| **09** | Internal Discovery | `T1018` | [Stage 09 Doc](../02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | Suricata NIDS ens37 (SIDs 3400001, 3400002, 3400020) & Wazuh Rule 100220 | Case 02 | [Phase 3 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | **Direct Detection (Wire & Host)** |
| **10** | Responder Poisoning | `T1557.001` | [Stage 10 Doc](../02-Attack-Simulation/Stages/stage-10-responder.md) | Wazuh Rule 100220 (bashcmd) / Win10 EID 4688 DavSetCookie (Rule 100278) | Case 02 | [Phase 4 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Direct Detection** |
| **11** | NTLMv2 Cracking | `T1110.002` | [Stage 11 Doc](../02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | *None (Offline Activity on Kali — Bracketed by Stage 10 & 12)* | Case 02 | [Phase 4 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Investigatively Attributed (Offline Gap DG-11)** |
| **12** | BloodHound AD Recon | `T1087.002` | [Stage 12 Doc](../02-Attack-Simulation/Stages/stage-12-bloodhound.md) | PC-DC & Win10 Custom Rule 100615 & Rule 92657 (wzb-32) + Rule 100220 + Alert #22 (wzb-1d2d7fb4b8) | Case 02 | [Phase 4 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Direct Detection (Target & SOAR)** |
| **13** | Kerberoasting | `T1558.003` | [Stage 13 Doc](../02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | Suricata SID 2019922 (ET EXPLOIT Possible GoldenPac Priv Esc in-use) / Wazuh Rule 100220 | Case 02 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Direct Detection** |
| **14** | DCSync | `T1003.006` | [Stage 14 Doc](../02-Attack-Simulation/Stages/stage-14-dcsync.md) | DomainWin10 Custom Rule 100603 (EID 4672) & Rule 92657 (wzb-34) + Rule 100220 + Queue Overflow + Alert #24 (wzb-4174e3672e) | Case 02 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Direct Detection (Target & SOAR)** |
| **15** | Pass-the-Hash | `T1550.002` | [Stage 15 Doc](../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | Wazuh Rule 100613 / DC EID 4624 & 4672 NTLM | Case 03 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Direct Detection** |
| **16** | Golden Ticket | `T1558.001` | [Stage 16 Doc](../02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | DomainWin10 Custom Rules 100615, 100603, 100613 + Rule 100220 (TheHive Alerts #27, #28) | Case 03 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Direct Detection (Target & SOAR)** |
| **17** | DC Persistence | `T1136.002` | [Stage 17 Doc](../02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | Wazuh 100613 / DC EID 4720 (User) & 4728 (Group) | Case 03 | [Phase 6 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Direct Detection** |
| **18** | Collection | `T1005` | [Stage 18 Doc](../02-Attack-Simulation/Stages/stage-18-collection.md) | Sysmon EID 1 (Temp file dumping of domain users) | Case 03 | [Phase 6 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Direct Detection** |
| **19** | Exfiltration | `T1041` | [Stage 19 Doc](../02-Attack-Simulation/Stages/stage-19-exfiltration.md) | Wazuh Rule 5715 Rate Anomaly (6 SSH in <0.57s) | Case 03 | [Phase 6 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Direct Detection** |
| **20** | Impact | `T1491.001` | [Stage 20 Doc](../02-Attack-Simulation/Stages/stage-20-impact.md) | Wazuh Rule 92041 (Wallpaper reg), .enc, reboot | Case 03 | [Phase 7 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-7-the-final-punch-simulated-ransomware-defacement--forced-reboots) | **Direct Detection** |

---

## 🏛️ Tier 3: Centralized Evidentiary Asset Hub

All telemetry datasets, evidence captures, and production configurations referenced across the investigation are consolidated in the repository asset hub:

* **Investigation Screenshots:**
  * [`06-Resources/screenshots/initial-triage/`](../06-Resources/screenshots/initial-triage/): 26 queue triage & chronological evidence captures.
  * [`06-Resources/screenshots/initial-triage-action/`](../06-Resources/screenshots/initial-triage-action/): 15 live response & containment execution captures.
  * [`06-Resources/screenshots/wazuh-deep-investigation/`](../06-Resources/screenshots/wazuh-deep-investigation/): 68 chronological SIEM alert captures (`wzb-01` to `wzb-68`).
  * [`06-Resources/screenshots/deep-investigation-action/`](../06-Resources/screenshots/deep-investigation-action/): 11 eradication, vulnerability hardening & TheHive case closure captures.
* **Telemetry Data Files:**
  * [`06-Resources/alerts/wazuh_alerts.csv`](../06-Resources/alerts/wazuh_alerts.csv): 808 curated SIEM alert records.
  * [`06-Resources/alerts/thehive_alerts.json`](../06-Resources/alerts/thehive_alerts.json): 46 correlated TheHive incident alerts.
* **Architecture Diagrams:**
  * [`06-Resources/diagrams/`](../06-Resources/diagrams/): Complete master network, dual-pathway flow, and IR lifecycle blueprints.

---

## 🚨 Critical Analytical Takeaways

Our deep-dive investigation identified **three catastrophic security failures** that permitted a simple web application exploit to escalate into total Active Directory forest compromise in **under 74 minutes**:

1. **The Sudoers Blunder (`www-data` NOPASSWD Python):** The public web server granted passwordless root execution for Python. Once the attacker achieved arbitrary webshell upload, they escalated to `root` in **10 seconds** via a one-line Python OS shell command.
2. **The Flawed DMZ Architecture:** The internet-facing web server had unrestricted Layer 2/3 connectivity to internal corporate networks, permitting LLMNR broadcast poisoning (Responder) and remote administrative RPC/WMI directly into the Active Directory Domain Controller.
3. **The Domain Admin Service Account (Kerberoasting to DCSync):** BadBlood populated service account `HANK_SHERMAN` as a member of `Domain Admins` with a weak dictionary password (`Password123`) and registered SPN. Once Kerberoasted and cracked offline, the attacker abused its built-in directory replication privileges (DCSync) to dump the entire NTDS database, compromise the master `krbtgt` password hash, and forge an enterprise Golden Ticket.

---

## 🧭 Analyst Navigation

To navigate the investigation, we recommend the following progression:

1. **Begin with Initial Triage:** Read **[`Initial-Triage-and-Investigation.md`](Initial-Triage-and-Investigation.md)** to see how a tier-1/tier-2 analyst processes an unread alert queue and identifies false positives vs. true breaches.
2. **Review Live Containment:** Read **[`Immediate-Containment-Execution.md`](Immediate-Containment-Execution.md)** to observe how the active footholds were severed across Linux and Windows hosts using Velociraptor and PowerShell.
3. **Analyze the Deep-Dive Attack Chain:** Read **[`Deep-Dive-Attack-Chain-Investigation.md`](Deep-Dive-Attack-Chain-Investigation.md)** for the complete forensic narrative, root-cause vulnerability analysis, and strategic enterprise remediation roadmap.
4. **Execute Eradication, Hardening & Recovery:** Read **[`Eradication-Hardening-and-Recovery.md`](Eradication-Hardening-and-Recovery.md)** for the permanent elimination of all 7 root causes, adversary anti-forensics audit, AD sanitization, and full recovery verification.
5. **Inspect Case Summaries:** Review the individual TheHive case records in **[`Cases/`](Cases/)** for case observables, task breakdowns, and formal closure verdicts.
