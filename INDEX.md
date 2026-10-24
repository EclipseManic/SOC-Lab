# Master Index

Single source of truth for the lab. Update this table whenever a stage, alert, rule, investigation note, or case changes.

## Detection status legend

| Status | Meaning |
|---|---|
| **Detected** | Telemetry and a rule existed, and the rule fired |
| **Not Detected** | Inherent offline stage or logging gap; behavior did not generate an alert |
| **Partial Detection** | Pivot or secondary telemetry was captured; direct target activity was not alerted |

## Traceability matrix

| # | Stage | Suggested ATT&CK | Attack doc | Alert observed | Rule / alert ID | Investigation | TheHive case | Detection status |
|---|---|---|---|---|---|---|---|---|
| 01 | Reconnaissance | T1595.001 | [stage-01](02-Attack-Simulation/Stages/stage-01-recon.md) | `wzb-3a8045a03c`, `wzb-e076a639a7` | Wazuh `86601` / SID `3400002`, `2010937` | [stage-01](04-Investigation/Stages/stage-01-recon.md) | Case 01 | **Detected** |
| 02 | Brute force | T1110.001 | [stage-02](02-Attack-Simulation/Stages/stage-02-bruteforce.md) | `wzb-81becfcc8d`, `wzb-4de933ca95` | Wazuh `31153`, `31151`, `31168` | [stage-02](04-Investigation/Stages/stage-02-bruteforce.md) | Case 01 | **Detected** |
| 03 | SQL injection | T1190 | [stage-03](02-Attack-Simulation/Stages/stage-03-sqli.md) | Alert 17 (`4.png`, `4.1.png`) | Wazuh `100201`, `100600` / SID `2010937` | [stage-03](04-Investigation/Stages/stage-03-sqli.md) | Case 01 | **Detected** |
| 04 | Hash cracking | T1110.002 | [stage-04](02-Attack-Simulation/Stages/stage-04-hash-crack.md) | *None (Offline Activity)* | *N/A (DG-04)* | [stage-04](04-Investigation/Stages/stage-04-hash-crack.md) | Case 01 | **Not Detected** (Offline) |
| 05 | Web shell upload | T1505.003 | [stage-05](02-Attack-Simulation/Stages/stage-05-webshell.md) | Alert 21, 22 (`6.1.png`, `6.2.png`) | Wazuh `100600` / SID `2014726`, `2014727` | [stage-05](04-Investigation/Stages/stage-05-webshell.md) | Case 01 | **Detected** |
| 06 | Reverse shell | T1059.004 | [stage-06](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | Alert 5 (`5.png`) | Wazuh `86601` / SID `2002752` | [stage-06](04-Investigation/Stages/stage-06-reverse-shell.md) | Case 01 | **Detected** |
| 07 | Privilege escalation | T1548.003 | [stage-07](02-Attack-Simulation/Stages/stage-07-privesc.md) | Alert 6 (`6.png`, `6.3.png`) | Wazuh `5402` (Sudo) | [stage-07](04-Investigation/Stages/stage-07-privesc.md) | Case 01 | **Detected** |
| 08 | SSH persistence | T1098.004 | [stage-08](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | Alert 7 (`7.png`, `7.1.png`) | Wazuh `550` (Syscheck FIM), `5715` | [stage-08](04-Investigation/Stages/stage-08-ssh-persistence.md) | Case 02 | **Detected** |
| 09 | Internal discovery | T1018 | [stage-09](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | Alert 8 (`8.png`, `8.1.png`) | Wazuh `86601` / SID `2000545` | [stage-09](04-Investigation/Stages/stage-09-internal-discovery.md) | Case 02 | **Detected** |
| 10 | Responder poisoning | T1557.001 | [stage-10](02-Attack-Simulation/Stages/stage-10-responder.md) | Alert 9 (`9.png`–`9.3.png`) | Wazuh `86601` / SID `2013028` | [stage-10](04-Investigation/Stages/stage-10-responder.md) | Case 02 | **Detected** |
| 11 | NTLMv2 cracking | T1110.002 | [stage-11](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | *None (Offline Activity)* | *N/A (DG-11)* | [stage-11](04-Investigation/Stages/stage-11-ntlmv2-crack.md) | Case 02 | **Not Detected** (Offline) |
| 12 | BloodHound enumeration | T1087.002 | [stage-12](02-Attack-Simulation/Stages/stage-12-bloodhound.md) | `[4x] [DVWA] Logon activity: ROOT` | Wazuh `5715` | [stage-12](04-Investigation/Stages/stage-12-bloodhound.md) | Case 02 | **Detected** (Pivot) |
| 13 | Kerberoasting | T1558.003 | [stage-13](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | Alert 13 (`13.png`) | Wazuh `60107` / Windows EID `4769` | [stage-13](04-Investigation/Stages/stage-13-kerberoasting.md) | Case 02 | **Detected** |
| 14 | DCSync | T1003.006 | [stage-14](02-Attack-Simulation/Stages/stage-14-dcsync.md) | Alert 14 (`14.png`) | Wazuh `60144` / Windows EID `4662` | [stage-14](04-Investigation/Stages/stage-14-dcsync.md) | Case 02 | **Detected** |
| 15 | Pass-the-Hash | T1550.002 | [stage-15](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | Alert 15 (`15.png`, `15.5.png`) | Wazuh `86601` / SID `2015862` | [stage-15](04-Investigation/Stages/stage-15-pass-the-hash.md) | Case 03 | **Detected** |
| 16 | Golden Ticket | T1558.001 | [stage-16](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | Alert 16 (`16.png`, `16.5.png`) | Wazuh `5715` / Windows EID `4769` | [stage-16](04-Investigation/Stages/stage-16-golden-ticket.md) | Case 03 | **Detected** |
| 17 | DC persistence | T1136.002 | [stage-17](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | Alert 17 (`17.png`–`17.6.png`) | Wazuh `100613`, `60109` | [stage-17](04-Investigation/Stages/stage-17-dc-persistence.md) | Case 03 | **Detected** |
| 18 | Collection | T1005 | [stage-18](02-Attack-Simulation/Stages/stage-18-collection.md) | Alert 18 (`18.png`–`18.2.png`) | Wazuh `100613` (Fan-out) | [stage-18](04-Investigation/Stages/stage-18-collection.md) | Case 03 | **Detected** |
| 19 | Exfiltration | T1041 | [stage-19](02-Attack-Simulation/Stages/stage-19-exfiltration.md) | Alert 19 (`19.png`) | Wazuh `5715` (Rapid logon burst) | [stage-19](04-Investigation/Stages/stage-19-exfiltration.md) | Case 03 | **Detected** (Pivot) |
| 20 | Impact | T1491.001 | [stage-20](02-Attack-Simulation/Stages/stage-20-impact.md) | Alert 20 (`20.png`–`22.4.png`) | Wazuh `100613`, `100100`, `86601` | [stage-20](04-Investigation/Stages/stage-20-impact.md) | Case 03 | **Detected** |

## TheHive case map

| Case | Scope | Stages | Repo summary |
|---|---|---|---|
| Case 01 | Web application compromise | 01–07 | [case-01](04-Investigation/Cases/case-01-web-compromise.md) |
| Case 02 | Lateral movement and credential access | 08–14 | [case-02](04-Investigation/Cases/case-02-lateral-movement.md) |
| Case 03 | Domain compromise and impact | 15–20 | [case-03](04-Investigation/Cases/case-03-domain-compromise.md) |

## Evidence index

| Evidence set | Location |
|---|---|
| Attack screenshots | `02-Attack-Simulation/Attack-Screenshots/` (Images 1.png – 60.png) |
| TheHive alert screenshots | `03-Detection-Engineering/TheHive_Alert-ScreenShot/` (Images 1.png – 22.4.png) |
| Master attack blueprint | [attack-chain-full.pdf](06-Resources/attack-chain-full.pdf) |

## Naming conventions

- Stage files: `stage-XX-short-name.md`
- Screenshots: `N.png` or `N.M.png`
- Detection gaps: `DG-XX`
- TheHive cases: `Case 01`, `Case 02`, `Case 03`
- Alerts: Wazuh rule ID + TheHive alert ID / screenshot reference
