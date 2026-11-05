# Master Index

Single source of truth for the lab. Update this table whenever a stage, alert, rule, investigation note, or case changes.

> [!NOTE]
> **Project Lifecycle & Section Status:**  
> - **Sections 01–03 (Lab Setup, Attack Simulation, Detection Engineering):** Complete reference architectures, execution playbooks, and detection rulesets.
> - **Section 04 (Investigation):** Marked as **Completed & Validated** across all 4 operational phases (Initial Triage, Immediate Containment, Forensic Deep-Dive, and Eradication/Hardening/Recovery).
> - **Section 05 (Incident Report):** Marked as **Completed & Formally Validated** post-incident deliverables (Executive Review, 74-minute timeline, master IoC register, MITRE ATT&CK mapping, response actions log, and strategic lessons learned).

## Detection Status Legend & Ground Truth Metrics

| Classification | Meaning & Scope | Stages Caught / Proportion |
|---|---|:---:|
| **Direct Target Detections** | Dedicated rules inspecting target payloads, command arguments, process trees, auth rate anomalies, or wire telemetry directly on victim hosts or network wire | **14 stages (70.0%)** |
| **Operational Alert Coverage** | Actionable incident tickets delivered live into TheHive 5 / SIEM fabric across all online attack phases | **16 stages (80.0%)** |
| **Target Logging Gaps** | Telemetry reached victim hosts or local switch, but target-side diagnostic logging was absent | **2 stages (10.0%)** |
| **Inherent Offline Gaps** | Offline password hash cracking conducted locally on attacker's GPU (zero victim or network telemetry by definition) | **2 stages (10.0%)** |
| **Rule Failure** | Zero engine syntax errors, dropped packets, or crashes inside active detection rules | **0 stages (0.0%)** |

---

## Traceability Matrix

| # | Stage | Suggested ATT&CK | Attack Doc | Alert Observed | Rule / Alert ID | Investigation | TheHive Case | Detection Status |
|---|---|---|---|---|---|---|---|---|
| 01 | Reconnaissance | T1595.001 | [stage-01](02-Attack-Simulation/Stages/stage-01-recon.md) | `wzb-3a8045a03c`, `wzb-6a39ab2a3d`, `wzb-4de933ca95` (`1.png`–`1.3.png` & `2.png`–`2.7.png`) | Wazuh `100410` (Level 10) / Suricata SID `2018489` (`ET SCAN NMAP OS Detection Probe`), `3400001`, `3400002` (via `86601`) | [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | Case 01 | **Direct Detection** |
| 02 | Brute Force | T1110.001 | [stage-02](02-Attack-Simulation/Stages/stage-02-bruteforce.md) | `wzb-6a22425401` (`3.png`, `4.png`, `4.1.png`) | Suricata SID `2017515` / Wazuh Rule `100213` (Hydra/Brute Force) & Rule `100200` | [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | Case 01 | **Direct Detection** |
| 03 | SQL Injection | T1190 | [stage-03](02-Attack-Simulation/Stages/stage-03-sqli.md) | `wzb-6a22425401` (Alert #11 sub-event 17, `5.png`) | Suricata SID `2010963` (`ET WEB_SERVER SELECT USER`) / Wazuh Rule `31106` | [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | Case 01 | **Direct Detection** |
| 04 | Hash Cracking | T1110.002 | [stage-04](02-Attack-Simulation/Stages/stage-04-hash-crack.md) | *None (Offline Activity on GPU)* | *N/A (DG-04)* | [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) | Case 01 | **Investigatively Attributed (Offline Gap DG-04)** |
| 05 | Web Shell Upload | T1505.003 | [stage-05](02-Attack-Simulation/Stages/stage-05-webshell.md) | `wzb-61ed72e937`, `wzb-e9a1797ac4` (`6.png`–`6.3.png`) | Suricata SID `2019284` (via `86601`) / Wazuh Rule `100600` / Auditd Rule `100199` (`/usr/bin/id`) | [Phase 2 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | Case 01 | **Direct Detection** |
| 06 | Reverse Shell | T1059.004 | [stage-06](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | `wzb-ccae331b77`, `wzb-81bb1f83f7` (`7.png`–`7.2.png`) | Suricata SID `3400020` on TCP 4444 (via `86601`) / Auditd Rule `100199` (`nc.openbsd`) | [Phase 2 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | Case 01 | **Direct Detection** |
| 07 | Privilege Escalation | T1548.003 | [stage-07](02-Attack-Simulation/Stages/stage-07-privesc.md) | `wzb-17-privesc-pam-sudo-python-root.jpg`, `wzb-18` | Wazuh `5402` (PAM - Successful sudo to ROOT) / Rule `100220` (`sudo -l`) | [Phase 2 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) | Case 01 | **Direct Detection (Host Alerted)** |
| 08 | SSH Persistence | T1098.004 | [stage-08](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | `wzb-1208f0ea54` (`8.png`, `8.1.png`), `wzb-19` | Wazuh `5715` (Elevated Level 8) / Rule `100220` (`echo ... >> authorized_keys`) | [Phase 3 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | Case 02 | **Direct Detection** |
| 09 | Internal Discovery | T1018 | [stage-09](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | `wzb-3152e3ed59`, `wzb-f87fab3eda`, `wzb-de91bad685` (`9.png`–`9.3.png`) | Suricata SIDs `3400001`, `3400002`, `3400020` on `ens37` + Wazuh `100220` (`nmap -sV -O`) | [Phase 3 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | Case 02 | **Target Logging Gap (DG-09)** |
| 10 | Responder Poisoning | T1557.001 | [stage-10](02-Attack-Simulation/Stages/stage-10-responder.md) | `wzb-28` (SIEM), `wzb-dbf3197ceb` (Alert #20, `10.png`, `10.1.png`) | Win10User Sysmon EID 1 / EID 4688 `DavSetCookie` (Custom Rule `100278`) + DVWA Rule `100220` | [Phase 4 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | Case 02 | **Direct Detection** |
| 11 | NTLMv2 Cracking | T1110.002 | [stage-11](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | `wzb-1c8dc0ab5d` (`11.png`) + offline hash cracking | Offline GPU Hashcat Execution (DG-11) + Wazuh Rule `5715` (Alert #21) | [Phase 4 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | Case 02 | **Investigatively Attributed (Offline Gap DG-11)** |
| 12 | BloodHound AD Recon | T1087.002 | [stage-12](02-Attack-Simulation/Stages/stage-12-bloodhound.md) | `wzb-32` (SIEM), `wzb-1d2d7fb4b8` (Alert #22, `12.png`), `wzb-31` | Linux Pivot Wazuh Rule `100220` (`bloodhound-python`) + Alert #22 (`wzb-1d2d7fb4b8`) | [Phase 4 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | Case 02 | **Target Logging Gap (DG-12)** |
| 13 | Kerberoasting | T1558.003 | [stage-13](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | `wzb-c1e2642eb2` (`13.png`), `wzb-33` | Suricata SID `2019922` (ET EXPLOIT GoldenPac TGS-REQ wire frame via `86601`) + Wazuh Rule `100220` (`GetUserSPNs.py`) | [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | Case 02 | **Direct Detection (Wire Heuristic & Host Telemetry)** |
| 14 | DCSync | T1003.006 | [stage-14](02-Attack-Simulation/Stages/stage-14-dcsync.md) | `wzb-34` (SIEM), `wzb-4174e3672e` (Alert #24, `14.png`) | Linux Pivot Wazuh Rule `100220` (`secretsdump.py`) + Alert #24 (`wzb-4174e3672e`) | [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | Case 02 | **Pivot-Only Coverage (DG-14)** |
| 15 | Pass-the-Hash | T1550.002 | [stage-15](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | `wzb-b7f91cd3ab`, `wzb-eb083a8537` (`15.png`, `15.5.png`), `wzb-35` | Windows EID `4624` (Logon Type 3 NTLM Rule `92657`) / Wazuh Custom Rule `100613` (WMI Fan-out) | [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | Case 03 | **Direct Detection (Host & Pivot Alerted)** |
| 16 | Golden Ticket | T1558.001 | [stage-16](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | `wzb-ccff195e0c`, `wzb-c200f52606` (`16.png`, `16.5.png`), `wzb-38`, `wzb-41` | Linux Pivot Wazuh Rule `100220` (`ticketer.py`) + Alerts #27, #28 (`wmiexec -k`) | [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | Case 03 | **Pivot-Only Coverage (DG-16)** |
| 17 | DC Persistence | T1136.002 | [stage-17](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | `wzb-26b4d06a63`, `wzb-299a007168`, `wzb-aa66cb916a`, `wzb-1834f3248e` (`17.png`–`17.6.png`) | Wazuh `100613` (WMI Fan-out: `net user /add`, `net localgroup`) | [Phase 6 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | Case 03 | **Direct Detection** |
| 18 | Collection | T1005 | [stage-18](02-Attack-Simulation/Stages/stage-18-collection.md) | `wzb-96e8d5856b`, `wzb-ed666653f7` (`18.png`–`18.2.png`) | Wazuh `100613` (Process Fan-out: `cmd.exe /Q /c whoami`, `net user`) | [Phase 6 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | Case 03 | **Direct Detection** |
| 19 | Exfiltration | T1041 | [stage-19](02-Attack-Simulation/Stages/stage-19-exfiltration.md) | `wzb-34f34a857c` (`19.png`) | Wazuh `5715` (Elevated Level 8 - 6 rapid SSH sessions in 0.57s) | [Phase 6 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | Case 03 | **Direct Detection (Auth Rate Anomaly Alerted; DG-19)** |
| 20 | Impact | T1491.001 | [stage-20](02-Attack-Simulation/Stages/stage-20-impact.md) | `wzb-71ef983ad8`, `wzb-1f43c1540f`, `wzb-7a4a134d1b` (`20.png`–`22.4.png`) | Wazuh `100613` (Fan-out) / Sysmon EID 1 / Suricata SIDs `2067085`–`2067087` | [Phase 7 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-7-the-final-punch-simulated-ransomware-defacement--forced-reboots) | Case 03 | **Direct Detection** |

---

## TheHive Case Map

| Case | Scope | Stages | Repo Summary |
|---|---|---|---|
| **Case 01** | Web Application Compromise | 01–07 | [case-01-web-compromise.md](04-Investigation/Cases/case-01-web-compromise.md) |
| **Case 02** | Lateral Movement and Credential Access | 08–14 | [case-02-lateral-movement.md](04-Investigation/Cases/case-02-lateral-movement.md) |
| **Case 03** | Domain Compromise and Impact | 15–20 | [case-03-domain-compromise.md](04-Investigation/Cases/case-03-domain-compromise.md) |

---

## Evidence Index

| Evidence Set | Location |
|---|---|
| Attack Screenshots | `06-Resources/screenshots/attack-simulation/` (62 images: 1.png – 60.png, plus 58.5.png, 59.5.png) |
| TheHive Alert Screenshots | `06-Resources/screenshots/thehive-alert/` (60 images: 1.png – 22.4.png) |
| Initial Triage Evidence | `06-Resources/screenshots/initial-triage/` (26 queue triage & chronological evidence captures) |
| Immediate Containment Evidence | `06-Resources/screenshots/initial-triage-action/` (15 tactical lockout captures) |
| Forensic Telemetry Index | `06-Resources/screenshots/wazuh-deep-investigation/` (68 chronological SIEM captures: wzb-01 to wzb-68) |
| Eradication & Case Closure Evidence | `06-Resources/screenshots/deep-investigation-action/` (11 host eradication & fleet health captures) |
| TheHive Cases Evidence | `06-Resources/screenshots/thehive-cases/` (9 case closure, task verification, and FP disposition captures) |
| Raw Telemetry CSV (Complete) | [`06-Resources/alerts/Wazuh-Raw-Alerts.csv`](06-Resources/alerts/Wazuh-Raw-Alerts.csv) (9,567 raw baseline alerts across all 4 agents in OpenSearch) |
| Curated Incident Analysis Set | [`06-Resources/alerts/wazuh_alerts.csv`](06-Resources/alerts/wazuh_alerts.csv) (808 curated forensic alerts filtered via 11 OpenSearch exclusion clauses) |
| Correlated Incident Alerts | [`06-Resources/alerts/thehive_alerts.json`](06-Resources/alerts/thehive_alerts.json) (46 actionable incident cases created live in TheHive via Level >= 8 gate) |
| Master Attack Blueprint | [`06-Resources/docs/attack-chain-full.pdf`](06-Resources/docs/attack-chain-full.pdf) |
