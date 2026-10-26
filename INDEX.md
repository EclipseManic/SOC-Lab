# Master Index

Single source of truth for the lab. Update this table whenever a stage, alert, rule, investigation note, or case changes.

## Detection Status Legend & Ground Truth Metrics

| Classification | Meaning & Scope | Stages Caught / Proportion |
|---|---|:---:|
| **Direct Target Detections** | Dedicated rules inspecting target payloads, command arguments, process trees, or auth rate anomalies directly on victim hosts or network wire | **14 stages (70.0%)** |
| **Operational Alert Coverage** | Actionable incident tickets delivered live into TheHive 5 (including correlated root pivot session alerts during Active Directory pivot phases) | **16 stages (80.0%)** |
| **Target Logging Gaps** | Telemetry reached victim hosts or local switch, but target-side diagnostic logging was absent (Stage 09 L2 switch bypass; Stage 12 unlogged LDAP search queries) | **2 stages (10.0%)** |
| **Inherent Offline Gaps** | Offline password hash cracking conducted locally on attacker's GPU (zero victim or network telemetry by definition) | **2 stages (10.0%)** |
| **Rule Failure** | Telemetry existed in host logs but detection engine failed to detect | **0 stages (0.0%)** |

---

## Traceability Matrix

| # | Stage | Suggested ATT&CK | Attack Doc | Alert Observed | Rule / Alert ID | Investigation | TheHive Case | Detection Status |
|---|---|---|---|---|---|---|---|---|
| 01 | Reconnaissance | T1595.001 | [stage-01](02-Attack-Simulation/Stages/stage-01-recon.md) | `wzb-3a8045a03c`, `wzb-6a39ab2a3d`, `wzb-4de933ca95` (`1.png`–`1.3.png`) | Wazuh `100410` (Level 10) / Suricata SID `3400001`, `3400002` (via `86601`) | [stage-01](04-Investigation/Stages/stage-01-recon.md) | Case 01 | **Direct Detection** |
| 02 | Brute Force | T1110.001 | [stage-02](02-Attack-Simulation/Stages/stage-02-bruteforce.md) | `wzb-81becfcc8d`, `wzb-6a22425401`, `wzb-8b2c36ea17` (`2.png`–`2.7.png`) | Wazuh `100213` (Level 10), Wazuh `31153` / Suricata SID `2000547` | [stage-02](04-Investigation/Stages/stage-02-bruteforce.md) | Case 01 | **Direct Detection** |
| 03 | SQL Injection | T1190 | [stage-03](02-Attack-Simulation/Stages/stage-03-sqli.md) | Suricata wire alert (Sheet Row 9110 / CSV Row 9108) | Suricata SID `2010963` (`ET WEB_SERVER SELECT USER`) / Wazuh `31106` | [stage-03](04-Investigation/Stages/stage-03-sqli.md) | Case 01 | **Direct Detection** |
| 04 | Hash Cracking | T1110.002 | [stage-04](02-Attack-Simulation/Stages/stage-04-hash-crack.md) | *None (Offline Activity)* | *N/A (DG-04)* | [stage-04](04-Investigation/Stages/stage-04-hash-crack.md) | Case 01 | **Offline Gap (DG-04)** |
| 05 | Web Shell Upload | T1505.003 | [stage-05](02-Attack-Simulation/Stages/stage-05-webshell.md) | `wzb-61ed72e937`, `wzb-e9a1797ac4` (`4.png`, `4.1.png`) | Suricata SID `2019284` (via `86601`) / Wazuh `100214` (Level 12) / Auditd `web_process_creation` | [stage-05](04-Investigation/Stages/stage-05-webshell.md) | Case 01 | **Direct Detection** |
| 06 | Reverse Shell | T1059.004 | [stage-06](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | `wzb-ccae331b77`, `wzb-81bb1f83f7` (`5.png`) | Suricata SID `3400020` (via `86601`) / Wazuh `100199` | [stage-06](04-Investigation/Stages/stage-06-reverse-shell.md) | Case 01 | **Direct Detection** |
| 07 | Privilege Escalation | T1548.003 | [stage-07](02-Attack-Simulation/Stages/stage-07-privesc.md) | Logged locally (12x Rule `5402`) (`6.png`–`6.3.png`) | Wazuh `5402` (PAM - Successful sudo to ROOT) / Auditd `web_process_creation` | [stage-07](04-Investigation/Stages/stage-07-privesc.md) | Case 01 | **Direct Detection (Host Alerted)** |
| 08 | SSH Persistence | T1098.004 | [stage-08](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | `wzb-1208f0ea54` (`7.png`, `7.1.png`) | Wazuh `5715` (Elevated Level 8) / Wazuh `550` (Syscheck) | [stage-08](04-Investigation/Stages/stage-08-ssh-persistence.md) | Case 02 | **Direct Detection** |
| 09 | Internal Discovery | T1018 | [stage-09](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | `wzb-3152e3ed59`, `wzb-f87fab3eda`, `wzb-de91bad685` (`8.png`, `8.1.png`) | Suricata SIDs `3400001`, `3400002`, `3400020` on `ens37` via Wazuh `86601` | [stage-09](04-Investigation/Stages/stage-09-internal-discovery.md) | Case 02 | **Target Logging Gap (Network Alerted; DG-09)** |
| 10 | Responder Poisoning | T1557.001 | [stage-10](02-Attack-Simulation/Stages/stage-10-responder.md) | Pivot log (Sheet Row 9233 / CSV Row 9231) | Wazuh `bashcmd` (uid:0 Responder.py execution on pivot) | [stage-10](04-Investigation/Stages/stage-10-responder.md) | Case 02 | **Direct Detection (Pivot Logged)** |
| 11 | NTLMv2 Cracking | T1110.002 | [stage-11](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | *None (Offline Activity)* | *N/A (DG-11)* | [stage-11](04-Investigation/Stages/stage-11-ntlmv2-crack.md) | Case 02 | **Offline Gap (DG-11)** |
| 12 | BloodHound AD Recon | T1087.002 | [stage-12](02-Attack-Simulation/Stages/stage-12-bloodhound.md) | `wzb-dbf3197ceb`, `wzb-1c8dc0ab5d` (`10.png`, `10.1.png`) | Wazuh `5715` (Elevated Level 8 - Pivot SSH root logon) | [stage-12](04-Investigation/Stages/stage-12-bloodhound.md) | Case 02 | **Target Logging Gap (Pivot Alerted; DG-12)** |
| 13 | Kerberoasting | T1558.003 | [stage-13](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | `wzb-1d2d7fb4b8`, `wzb-c1e2642eb2` (`11.png`, `13.png`) | Suricata SID `2019922` (ET Open Kerberos TGS-REQ) via `86601` + Wazuh `5715` | [stage-13](04-Investigation/Stages/stage-13-kerberoasting.md) | Case 02 | **Direct Detection (Network Wire Alerted)** |
| 14 | DCSync | T1003.006 | [stage-14](02-Attack-Simulation/Stages/stage-14-dcsync.md) | `wzb-4174e3672e` (`12.png`) | Wazuh `5715` (Elevated Level 8 - Pivot SSH root logon) | [stage-14](04-Investigation/Stages/stage-14-dcsync.md) | Case 02 | **Operational Coverage (Pivot Alerted; DC EID 4662)** |
| 15 | Pass-the-Hash | T1550.002 | [stage-15](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | `wzb-b7f91cd3ab`–`ccff195e0c` & 24x in CSV (`13.png`) | Windows EID `4624` (Logon Type 3 NTLM: 15 Win10, 9 DC) / Wazuh `100613` (WMI Fan-out) | [stage-15](04-Investigation/Stages/stage-15-pass-the-hash.md) | Case 03 | **Direct Detection (Host & Pivot Alerted)** |
| 16 | Golden Ticket | T1558.001 | [stage-16](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | `wzb-8d45b2d236` (`14.png`, `16.png`) | Wazuh `5715` (Elevated Level 8 - Pivot SSH root logon) | [stage-16](04-Investigation/Stages/stage-16-golden-ticket.md) | Case 03 | **Operational Coverage (Pivot Alerted; DC EID 4769)** |
| 17 | DC Persistence | T1136.002 | [stage-17](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | `wzb-26b4d06a63`, `wzb-299a007168`, `wzb-1834f3248e` (`15.png`, `17.png`–`17.6.png`) | Wazuh `100613` (WMI Fan-out: `net user /add`, `net localgroup`) | [stage-17](04-Investigation/Stages/stage-17-dc-persistence.md) | Case 03 | **Direct Detection** |
| 18 | Collection | T1005 | [stage-18](02-Attack-Simulation/Stages/stage-18-collection.md) | `wzb-aa66cb916a`, `wzb-96e8d5856b`, `wzb-ed666653f7` (`16.png`, `18.png`–`18.2.png`) | Wazuh `100613` (Process Fan-out: `cmd.exe /Q /c whoami`, `net user`) | [stage-18](04-Investigation/Stages/stage-18-collection.md) | Case 03 | **Direct Detection** |
| 19 | Exfiltration | T1041 | [stage-19](02-Attack-Simulation/Stages/stage-19-exfiltration.md) | `wzb-34f34a857c` (`17.png`, `19.png`) | Wazuh `5715` (Elevated Level 8 - 6 rapid SSH sessions in 0.57s) | [stage-19](04-Investigation/Stages/stage-19-exfiltration.md) | Case 03 | **Direct Detection (Auth Rate Anomaly Alerted; DG-19)** |
| 20 | Impact | T1491.001 | [stage-20](02-Attack-Simulation/Stages/stage-20-impact.md) | `wzb-71ef983ad8`, `wzb-1f43c1540f`, `wzb-7a4a134d1b` (`18.png`, `20.png`–`22.4.png`) | Wazuh `100613` (Fan-out) / Sysmon EID 1 / Suricata SIDs `2067085`–`2067087` | [stage-20](04-Investigation/Stages/stage-20-impact.md) | Case 03 | **Direct Detection** |

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
| Attack Screenshots | `02-Attack-Simulation/Attack-Screenshots/` (62 images: 1.png – 60.png, plus 58.5.png, 59.5.png) |
| TheHive Alert Screenshots | `03-Detection-Engineering/TheHive_Alert-ScreenShot/` (60 images: 1.png – 22.4.png) |
| Raw Telemetry CSV (Complete) | [`06-Resources/Alerts/Wazuh-Raw-Alerts.csv`](06-Resources/Alerts/Wazuh-Raw-Alerts.csv) (9,567 raw baseline alerts across all 4 agents in OpenSearch) |
| Curated Incident Analysis Set | [`06-Resources/Alerts/wazuh_alerts.csv`](06-Resources/Alerts/wazuh_alerts.csv) (808 curated forensic alerts filtered via 11 OpenSearch exclusion clauses) |
| Correlated Incident Alerts | [`06-Resources/Alerts/thehive_alerts.json`](06-Resources/Alerts/thehive_alerts.json) (46 actionable incident cases created live in TheHive via Level >= 8 gate) |
| Master Attack Blueprint | [`06-Resources/attack-chain-full.pdf`](06-Resources/attack-chain-full.pdf) |
