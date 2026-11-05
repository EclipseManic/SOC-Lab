# 04 — Incident Investigation & Real-World Triage Analysis

Welcome to the **Incident Investigation** section of the lab. This is the defender and SOC analyst view of the entire campaign. 

Here, we document the full blue-team response journey—from sorting through a noisy alert queue and prioritizing true breaches, to executing live host containment, digging into the root causes, and permanently hardening the environment.

[![SOC Analyst Investigation Lifecycle](../06-Resources/diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png)](../06-Resources/diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png)
*Figure 1: The SOC Analyst Investigation Lifecycle: from alert ingestion and triage to active containment, root-cause analysis, and case resolution.*

---

## 📑 How Our Investigation Is Organized

Rather than scattering a single enterprise intrusion across twenty disconnected notes, we organized our investigation into clear, logical tiers:

```
04-Investigation/
├── README.md                                           # Master navigation & overview (this file)
├── Initial-Triage-and-Investigation.md                 # Step 1: Sorting alerts, eliminating noise & critiquing the pipeline
├── Immediate-Containment-Execution.md                  # Step 2: Live containment commands & locking the attacker out
├── Deep-Dive-Attack-Chain-Investigation.md             # Step 3: Complete forensic storyline, root causes & evidence
├── Eradication-Hardening-and-Recovery.md               # Step 4: Fixing root causes, rotating credentials & closing cases
└── Cases/                                              # Step 5: TheHive Case Management Files
    ├── case-01-web-compromise.md                       # Case 01: Web exploit, SQL injection, webshell & instant root
    ├── case-02-lateral-movement.md                     # Case 02: SSH backdoor, Responder hash theft & DCSync
    └── case-03-domain-compromise.md                    # Case 03: Golden ticket, Domain Admin takeover & ransomware
```

---

## 🛡️ Core Incident Response Documents

These four master documents tell the complete investigative story:

| Document | Focus Area | What You'll Learn & Key Evidence Inside |
|:---|:---|:---|
| **[`Initial-Triage-and-Investigation.md`](Initial-Triage-and-Investigation.md)** | **Queue Triage & Noise Filtering** | • How we triaged **46 TheHive alerts** by real risk (Critical → High → Medium)<br>• Why noisy Shellshock scanner alerts were deprioritized over live reverse shells<br>• Our critique of **9 real-world pipeline flaws** (alert spam, generic titles, static regex)<br>• Full 6-window timeline backed by 26 triage screenshots |
| **[`Immediate-Containment-Execution.md`](Immediate-Containment-Execution.md)** | **Live Threat Containment** | • **7 hands-on containment actions** to kick the attacker out immediately<br>• Real Velociraptor VQL queries and PowerShell commands<br>• Visual before-and-after proof showing services cut and accounts locked<br>• 15 visual containment screenshots proving adversary lockout |
| **[`Deep-Dive-Attack-Chain-Investigation.md`](Deep-Dive-Attack-Chain-Investigation.md)** | **The Complete Forensic Story** | • **7-phase narrative** explaining exactly how the attacker breached the network<br>• Breakdown of the **7 architectural mistakes** that made this breach possible<br>• Complete IoC list (IPs, hashes, accounts, staged files)<br>• All 68 chronological SIEM alert screenshots (`wzb-01` to `wzb-68`) |
| **[`Eradication-Hardening-and-Recovery.md`](Eradication-Hardening-and-Recovery.md)** | **Hardening, Recovery & Case Closure** | • Permanent fixes for all 7 root causes (sudoers, SSH root, upload limits, GPOs)<br>• Anti-forensics audit (`history | grep rm`) and cleanup of `/tmp/`<br>• Active Directory double `krbtgt` password reset verified at **KVNO 3**<br>• Formal disposition of all 46 alerts and closure of Cases 01–03 |

---

> [!NOTE]
> ### ⏱️ Why Alert Timestamps Might Differ by a Few Seconds (Real-World Sensor Mechanics)
> When comparing timelines across network sensors, Linux kernel hooks, Windows event logs, and TheHive cards, you will notice minor timestamp offsets (1–3 seconds, or a few minutes for interactive terminal sessions). This is completely normal in real-world security operations:
> 1. **TheHive Gets Alerts Faster Than the Web Dashboard:** `wazuh-integratord` dispatches high-severity alerts to TheHive in memory almost instantaneously (<0.2 ms). On the other hand, the Wazuh web dashboard has to wait for Filebeat to buffer and OpenSearch to index the logs. This means TheHive incident tickets often register **1–3 seconds before** they appear on dashboard graphs.
> 2. **Linux Shell `PROMPT_COMMAND` Flushing:** Our custom bash logger (`bashcmd` / Rule 100220) relies on Linux's `PROMPT_COMMAND`. This means long-running commands (like `Responder.py` or interactive `wmiexec.py` sessions) only flush to disk **after** the command exits or the operator presses `Ctrl+C` and returns to the shell prompt.
> 3. **Realistic Attacker Retries:** In a hands-on attack, real humans make small typos and adjust quotation marks. TheHive grouped multiple rapid attempts into a single alert card anchored to the first trigger, while individual SIEM screenshots capture the exact moment a specific command landed.

---

## 🗂️ TheHive Incident Cases

In a professional SOC, analysts don't create twenty separate tickets for one break-in. We grouped all alerts from this campaign into three operational cases in TheHive based on attack phase and network zone:

| Case File | TheHive ID | Stages Covered | What Happened in This Case |
|:---|:---:|:---:|:---|
| **[`Cases/case-01-web-compromise.md`](Cases/case-01-web-compromise.md)** | `CAS-001-WEBCOMP` | **Stages 01–07** | Attacker scanned our web server, brute-forced the DVWA login, dumped user passwords via SQL injection, uploaded a PHP webshell, opened a reverse shell, and **became root in 10 seconds via a sudo Python misconfiguration**. |
| **[`Cases/case-02-lateral-movement.md`](Cases/case-02-lateral-movement.md)** | `CAS-002-LATMOVE` | **Stages 08–14** | Attacker added a root SSH key for persistence, swept the internal subnet, ran Responder to capture the Windows 10 password hash, mapped Active Directory with BloodHound, Kerberoasted `HANK_SHERMAN`, and **replicated domain hashes using DCSync**. |
| **[`Cases/case-03-domain-compromise.md`](Cases/case-03-domain-compromise.md)** | `CAS-003-DOMIMP` | **Stages 15–20** | Attacker moved laterally to the Domain Controller via Pass-the-Hash, forged an enterprise Kerberos Golden Ticket (`krbtgt`), created a hidden Domain Admin user (`backdoor`), stole sensitive files via SCP, and **defaced desktops while deploying simulated ransomware notes**. |

---

## 🔍 Master 20-Stage Attack-to-Investigation Traceability Matrix

Every single technique executed during the attack maps directly to our defensive telemetry, TheHive case structure, and deep-dive forensic writeup:

| # | Stage Name | ATT&CK ID | Attack Doc | Detection Sensor & Rule | TheHive Case | Deep-Dive Story Link | Detection Verdict |
|:---:|---|:---:|---|---|:---:|---|---|
| **01** | Reconnaissance | `T1595.001` | [Stage 01](../02-Attack-Simulation/Stages/stage-01-recon.md) | Suricata NIDS (PostgreSQL 5432, Nmap -sS) | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Direct Detection** |
| **02** | Brute Force | `T1110.001` | [Stage 02](../02-Attack-Simulation/Stages/stage-02-bruteforce.md) | Suricata (python-requests) / Wazuh 100213 | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Direct Detection** |
| **03** | SQL Injection | `T1190` | [Stage 03](../02-Attack-Simulation/Stages/stage-03-sqli.md) | Suricata SID 2010963 / Custom Wazuh Rule 100600 & Rule 100200 | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Direct Detection** |
| **04** | Hash Cracking | `T1110.002` | [Stage 04](../02-Attack-Simulation/Stages/stage-04-hash-crack.md) | *None (Ran offline on Kali GPU — Bracketed by Stages 03 & 05)* | Case 01 | [Phase 1 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | **Investigatively Attributed (Offline Gap DG-04)** |
| **05** | Web Shell Upload | `T1505.003` | [Stage 05](../02-Attack-Simulation/Stages/stage-05-webshell.md) | Apache Access Logs / Auditd `/usr/bin/id` | Case 01 | [Phase 2 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | **Direct Detection** |
| **06** | Reverse Shell | `T1059.004` | [Stage 06](../02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | Auditd Rule `web_process_creation` (stty sane) | Case 01 | [Phase 2 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | **Direct Detection** |
| **07** | Privilege Escalation | `T1548.003` | [Stage 07](../02-Attack-Simulation/Stages/stage-07-privesc.md) | Wazuh Rule 5402 (`sudo python3 to ROOT`) | Case 01 | [Phase 2 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | **Direct Detection** |
| **08** | SSH Persistence | `T1098.004` | [Stage 08](../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | Wazuh Rule 100220 & Rule 5715 | Case 02 | [Phase 3 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | **Direct Detection** |
| **09** | Internal Discovery | `T1018` | [Stage 09](../02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | Suricata NIDS ens37 (SIDs 3400001, 3400002, 3400020) & Wazuh Rule 100220 | Case 02 | [Phase 3 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | **Target Logging Gap (DG-09)** |
| **10** | Responder Poisoning | `T1557.001` | [Stage 10](../02-Attack-Simulation/Stages/stage-10-responder.md) | Wazuh Rule 100220 (bashcmd) / Win10 EID 4688 DavSetCookie (Rule 100278) | Case 02 | [Phase 4 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Direct Detection** |
| **11** | NTLMv2 Cracking | `T1110.002` | [Stage 11](../02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | *None (Ran offline on Kali GPU — Bracketed by Stages 10 & 12)* | Case 02 | [Phase 4 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Investigatively Attributed (Offline Gap DG-11)** |
| **12** | BloodHound AD Recon | `T1087.002` | [Stage 12](../02-Attack-Simulation/Stages/stage-12-bloodhound.md) | Linux Pivot Wazuh Rule 100220 + Alert #22 (wzb-1d2d7fb4b8) / DC EID 1644 unconfigured | Case 02 | [Phase 4 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Target Logging Gap (DG-12)** |
| **13** | Kerberoasting | `T1558.003` | [Stage 13](../02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | Suricata SID 2019922 (ET EXPLOIT GoldenPac on Kerberos 88) / Wazuh Rule 100220 | Case 02 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Direct Detection** |
| **14** | DCSync | `T1003.006` | [Stage 14](../02-Attack-Simulation/Stages/stage-14-dcsync.md) | Linux Pivot Wazuh Rule 100220 + Alert #24 (wzb-4174e3672e) / DC EID 4662 unconfigured | Case 02 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Pivot-Only Coverage (DG-14)** |
| **15** | Pass-the-Hash | `T1550.002` | [Stage 15](../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | Wazuh Rule 100613 / DC EID 4624 & 4672 NTLM | Case 03 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Direct Detection** |
| **16** | Golden Ticket | `T1558.001` | [Stage 16](../02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | Linux Pivot Rule 100220 + Alerts #27, #28 on wmiexec -k (Sysmon EID 1 / Custom Rule 100613) | Case 03 | [Phase 5 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Pivot-Only Coverage (DG-16)** |
| **17** | DC Persistence | `T1136.002` | [Stage 17](../02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | Wazuh 100613 / DC EID 4720 (User Created) & 4728 (Group Changed) | Case 03 | [Phase 6 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Direct Detection** |
| **18** | Collection | `T1005` | [Stage 18](../02-Attack-Simulation/Stages/stage-18-collection.md) | Sysmon EID 1 (Temp file dumping of domain users) | Case 03 | [Phase 6 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Direct Detection** |
| **19** | Exfiltration | `T1041` | [Stage 19](../02-Attack-Simulation/Stages/stage-19-exfiltration.md) | Wazuh Rule 5715 Rate Anomaly (6 rapid SSH sessions in <0.57s) | Case 03 | [Phase 6 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Direct Detection** |
| **20** | Impact | `T1491.001` | [Stage 20](../02-Attack-Simulation/Stages/stage-20-impact.md) | Wazuh Rule 92041 (Wallpaper reg add), ransom files, forced reboot | Case 03 | [Phase 7 Narrative](Deep-Dive-Attack-Chain-Investigation.md#phase-7-the-final-punch-simulated-ransomware-defacement--forced-reboots) | **Direct Detection** |

---

## 🏛️ Evidence & Artifacts Reference Hub

All screenshots, log files, and architectural diagrams referenced across the investigation are neatly organized in the resources directory:

* **Investigation Screenshots:**
  * [`06-Resources/screenshots/initial-triage/`](../06-Resources/screenshots/initial-triage/): 26 queue triage & chronological evidence captures.
  * [`06-Resources/screenshots/initial-triage-action/`](../06-Resources/screenshots/initial-triage-action/): 15 live response & containment execution captures.
  * [`06-Resources/screenshots/wazuh-deep-investigation/`](../06-Resources/screenshots/wazuh-deep-investigation/): 68 chronological SIEM alert captures (`wzb-01` to `wzb-68`).
  * [`06-Resources/screenshots/deep-investigation-action/`](../06-Resources/screenshots/deep-investigation-action/): 11 eradication, vulnerability hardening & system recovery captures.
  * [`06-Resources/screenshots/thehive-cases/`](../06-Resources/screenshots/thehive-cases/): 9 case closure, task verification, and FP disposition captures.
* **Telemetry Data Files:**
  * [`06-Resources/alerts/wazuh_alerts.csv`](../06-Resources/alerts/wazuh_alerts.csv): 808 curated SIEM alert records.
  * [`06-Resources/alerts/thehive_alerts.json`](../06-Resources/alerts/thehive_alerts.json): 46 correlated TheHive incident alerts.
* **Architecture Diagrams:**
  * [`06-Resources/diagrams/`](../06-Resources/diagrams/): Complete master network, dual-pathway flow, and IR lifecycle blueprints.

---

## 🚨 The 3 Fatal Flaws That Led to Domain Takeover

Our investigation uncovered **three fatal mistakes** that allowed an ordinary web exploit to spiral into total Active Directory domain compromise in **under 74 minutes**:

1. **The Sudoers Blunder (`www-data` NOPASSWD Python):** The public web server allowed the web user to run Python as root with no password required. As soon as the attacker uploaded a basic webshell, they ran one line of Python and escalated to `root` in **10 seconds**.
2. **The Missing DMZ Firewall:** The web server was sitting on the same network segment as the internal corporate environment, with zero firewall rules blocking it from reaching internal Windows machines. This let the attacker run Responder to poison local traffic and connect directly to the Domain Controller over WMI.
3. **The Dangerous Service Account (Kerberoasting to DCSync):** An Active Directory service account named `HANK_SHERMAN` had been placed inside the `Domain Admins` group with a weak password (`Password123`). The attacker requested its Kerberos ticket, cracked it offline, and abused its built-in replication rights (DCSync) to dump every password hash in the domain—including `krbtgt`.

---

## 🧭 Suggested Reading Order

To get the most out of this investigation, we suggest following this flow:

1. **Start with Alert Triage:** Check out **[`Initial-Triage-and-Investigation.md`](Initial-Triage-and-Investigation.md)** to see how a tier-1/tier-2 analyst handles a flood of incoming alerts and sorts real attacks from harmless scanner noise.
2. **See the Live Containment:** Read **[`Immediate-Containment-Execution.md`](Immediate-Containment-Execution.md)** to see the exact commands used to cut off the attacker's access on Linux and Windows.
3. **Walk Through the Full Story:** Dive into **[`Deep-Dive-Attack-Chain-Investigation.md`](Deep-Dive-Attack-Chain-Investigation.md)** for the complete step-by-step story, root-cause explanations, and technical evidence.
4. **Learn How We Hardened the Systems:** Read **[`Eradication-Hardening-and-Recovery.md`](Eradication-Hardening-and-Recovery.md)** to see how we fixed all 7 root causes, cleaned up the systems, and safely closed the cases.
5. **Review the Incident Tickets:** Look through the individual TheHive case files in **[`Cases/`](Cases/)** to see task breakdowns, case notes, and closure summaries.
