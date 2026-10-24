# Master Index

Single source of truth for the lab. Update this table whenever a stage, alert, rule, investigation note, or case changes.

## Detection Status Legend

| Status | Meaning | Count |
|---|---|---|
| **Detected** | Telemetry and rule fired directly on target or wire | 16 stages (80.0%) |
| **Logging Gap** | Target-side diagnostic logging gap; alerted via pivot or network layer | 2 stages (10.0% - Stages 09, 12) |
| **Detection Gap** | Inherent offline adversary computation generating zero telemetry | 2 stages (10.0% - Stages 04, 11) |
| **Rule Failure** | Telemetry existed on host but rules failed to detect | 0 stages (0.0%) |

---

## Traceability Matrix

| # | Stage | Suggested ATT&CK | Attack Doc | Alert Observed | Rule / Alert ID | Investigation | TheHive Case | Detection Status |
|---|---|---|---|---|---|---|---|---|
| 01 | Reconnaissance | T1595.001 | [stage-01](02-Attack-Simulation/Stages/stage-01-recon.md) | `wzb-96c21e0640` (`1.png`) | Wazuh `100410` (Level 8) / Suricata SID `2000545` | [stage-01](04-Investigation/Stages/stage-01-recon.md) | Case 01 | **Detected** |
| 02 | Brute Force | T1110.001 | [stage-02](02-Attack-Simulation/Stages/stage-02-bruteforce.md) | `wzb-51c6a2fa5f` (`2.png`) | Wazuh `100213` (Level 8) / Suricata SID `2000547` | [stage-02](04-Investigation/Stages/stage-02-bruteforce.md) | Case 01 | **Detected** |
| 03 | SQL Injection | T1190 | [stage-03](02-Attack-Simulation/Stages/stage-03-sqli.md) | `wzb-c276fcddb8` (`3.png`) | Suricata SID `2010938` / Wazuh `86601` (Level 8) | [stage-03](04-Investigation/Stages/stage-03-sqli.md) | Case 01 | **Detected** |
| 04 | Hash Cracking | T1110.002 | [stage-04](02-Attack-Simulation/Stages/stage-04-hash-crack.md) | *None (Offline Activity)* | *N/A (DG-04)* | [stage-04](04-Investigation/Stages/stage-04-hash-crack.md) | Case 01 | **Detection Gap** (Offline) |
| 05 | Web Shell Upload | T1505.003 | [stage-05](02-Attack-Simulation/Stages/stage-05-webshell.md) | `wzb-bbf93049b4` (`4.png`) | Wazuh `100214` (Level 8) / Auditd File Watch | [stage-05](04-Investigation/Stages/stage-05-webshell.md) | Case 01 | **Detected** |
| 06 | Reverse Shell | T1059.004 | [stage-06](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | `wzb-a2f073998b` (`5.png`) | Wazuh `100602` (Level 8) via `bashcmd` decoder | [stage-06](04-Investigation/Stages/stage-06-reverse-shell.md) | Case 01 | **Detected** |
| 07 | Privilege Escalation | T1548.001 | [stage-07](02-Attack-Simulation/Stages/stage-07-privesc.md) | `wzb-2c0ebdf596` (`6.png`) | Wazuh `100603` (Level 8) / Auditd SUID find | [stage-07](04-Investigation/Stages/stage-07-privesc.md) | Case 01 | **Detected** |
| 08 | SSH Persistence | T1098.004 | [stage-08](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | `wzb-846468a306` (`7.png`) | Wazuh `5715` (Level 8) / Wazuh `100215` | [stage-08](04-Investigation/Stages/stage-08-ssh-persistence.md) | Case 02 | **Detected** |
| 09 | Internal Discovery | T1018 | [stage-09](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | `wzb-33519c2c62` (`8.png`) | Suricata SID `2000545` via Wazuh `86601` (Level 8) | [stage-09](04-Investigation/Stages/stage-09-internal-discovery.md) | Case 02 | **Detected** (Network Alerted; DG-09) |
| 10 | Responder Poisoning | T1557.001 | [stage-10](02-Attack-Simulation/Stages/stage-10-responder.md) | `wzb-e362e6ca6f` (`9.png`) | Suricata SID `2013028` (`ET INFO NTLM Session Setup`) | [stage-10](04-Investigation/Stages/stage-10-responder.md) | Case 02 | **Detected** |
| 11 | NTLMv2 Cracking | T1110.002 | [stage-11](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | *None (Offline Activity)* | *N/A (DG-11)* | [stage-11](04-Investigation/Stages/stage-11-ntlmv2-crack.md) | Case 02 | **Detection Gap** (Offline) |
| 12 | BloodHound AD Recon | T1087.002 | [stage-12](02-Attack-Simulation/Stages/stage-12-bloodhound.md) | `wzb-dbf3197ceb` (`10.png`) | Wazuh `5715` (Elevated Level 8 - Pivot SSH logon) | [stage-12](04-Investigation/Stages/stage-12-bloodhound.md) | Case 02 | **Logging Gap** (Pivot Alerted; DG-12) |
| 13 | Kerberoasting | T1558.003 | [stage-13](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | `wzb-1d2d7fb4b8` (`13.png`) | Suricata SID `2019922` via Wazuh `86601` + Wazuh `5715` | [stage-13](04-Investigation/Stages/stage-13-kerberoasting.md) | Case 02 | **Detected** (Network & Pivot Alerted) |
| 14 | DCSync | T1003.006 | [stage-14](02-Attack-Simulation/Stages/stage-14-dcsync.md) | `wzb-4174e3672e` (`14.png`) | Wazuh `5715` (Elevated Level 8 - Pivot SSH logon) | [stage-14](04-Investigation/Stages/stage-14-dcsync.md) | Case 02 | **Detected** (Pivot Alerted) |
| 15 | Pass-the-Hash | T1550.002 | [stage-15](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | `wzb-c1e2642eb2` (`15.png`) & 24x in CSV | Windows EID `4624` / Wazuh `60122` (Logon Type 3 NTLM) | [stage-15](04-Investigation/Stages/stage-15-pass-the-hash.md) | Case 03 | **Detected** |
| 16 | Golden Ticket | T1558.001 | [stage-16](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | `wzb-8d45b2d236` (`16.png`, `16.5.png`) | Wazuh `5715` (Elevated Level 8 - Pivot SSH logon) | [stage-16](04-Investigation/Stages/stage-16-golden-ticket.md) | Case 03 | **Detected** (Pivot Alerted) |
| 17 | DC Persistence | T1136.002 | [stage-17](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | `wzb-26b4d06a63` (`17.png`) | Wazuh `100613` (Process Fan-out) / Wazuh `60108`, `60109` | [stage-17](04-Investigation/Stages/stage-17-dc-persistence.md) | Case 03 | **Detected** |
| 18 | Collection | T1005 | [stage-18](02-Attack-Simulation/Stages/stage-18-collection.md) | `wzb-aa66cb916a` (`18.png`) | Wazuh `100613` (Fan-out) / Wazuh `100602` (bashcmd) | [stage-18](04-Investigation/Stages/stage-18-collection.md) | Case 03 | **Detected** |
| 19 | Exfiltration | T1041 | [stage-19](02-Attack-Simulation/Stages/stage-19-exfiltration.md) | `wzb-34f34a857c` (`19.png`) | Wazuh `5715` (Elevated Level 8 - 6 rapid sessions / 1s) | [stage-19](04-Investigation/Stages/stage-19-exfiltration.md) | Case 03 | **Detected** (Pivot Alerted; DG-19) |
| 20 | Impact | T1491.001 | [stage-20](02-Attack-Simulation/Stages/stage-20-impact.md) | `wzb-71ef983ad8`, `wzb-1f43c1540f` (`20.png`) | Wazuh `100613` (Fan-out) / Sysmon EID 1 (`cmd.exe /Q /c`) | [stage-20](04-Investigation/Stages/stage-20-impact.md) | Case 03 | **Detected** |

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
| Attack Screenshots | `02-Attack-Simulation/Attack-Screenshots/` (Images 1.png – 60.png) |
| TheHive Alert Screenshots | `03-Detection-Engineering/TheHive_Alert-ScreenShot/` (Images 1.png – 20.png) |
| Raw Telemetry CSV | [`06-Resources/Alerts/wazuh_alerts.csv`](06-Resources/Alerts/wazuh_alerts.csv) (808 multi-level records) |
| Raw Correlated JSON | [`06-Resources/Alerts/thehive_alerts.json`](06-Resources/Alerts/thehive_alerts.json) (46 actionable incidents) |
| Master Attack Blueprint | [`06-Resources/attack-chain-full.pdf`](06-Resources/attack-chain-full.pdf) |
