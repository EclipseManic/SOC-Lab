# Master Index

Single source of truth for the lab. Update this table whenever a stage, alert, rule, investigation note, or case changes.

## Detection status legend

| Status | Meaning |
|---|---|
| Detected | Telemetry and a rule existed, and the rule fired |
| Logging gap | Required telemetry was not collected |
| Detection gap | Telemetry existed, but no rule covered the behavior |
| Rule failure | A rule existed, but did not fire as expected |
| Not tested | Stage not yet validated |

## Traceability matrix

| # | Stage | Suggested ATT&CK | Attack doc | Alert observed | Rule / alert ID | Investigation | TheHive case | Detection status |
|---|---|---|---|---|---|---|---|---|
| 01 | Reconnaissance | T1595 | [stage-01](02-Attack-Simulation/Stages/stage-01-recon.md) | TBD | TBD | [stage-01](04-Investigation/Stages/stage-01-recon.md) | Case 01 | Not tested |
| 02 | Brute force | T1110 | [stage-02](02-Attack-Simulation/Stages/stage-02-bruteforce.md) | TBD | TBD | [stage-02](04-Investigation/Stages/stage-02-bruteforce.md) | Case 01 | Not tested |
| 03 | SQL injection | T1190 | [stage-03](02-Attack-Simulation/Stages/stage-03-sqli.md) | TBD | TBD | [stage-03](04-Investigation/Stages/stage-03-sqli.md) | Case 01 | Not tested |
| 04 | Hash cracking | T1110.002 | [stage-04](02-Attack-Simulation/Stages/stage-04-hash-crack.md) | TBD | TBD | [stage-04](04-Investigation/Stages/stage-04-hash-crack.md) | Case 01 | Not tested |
| 05 | Web shell upload | T1505.003 | [stage-05](02-Attack-Simulation/Stages/stage-05-webshell.md) | TBD | TBD | [stage-05](04-Investigation/Stages/stage-05-webshell.md) | Case 01 | Not tested |
| 06 | Reverse shell | T1059.004 | [stage-06](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | TBD | TBD | [stage-06](04-Investigation/Stages/stage-06-reverse-shell.md) | Case 01 | Not tested |
| 07 | Privilege escalation | T1068 | [stage-07](02-Attack-Simulation/Stages/stage-07-privesc.md) | TBD | TBD | [stage-07](04-Investigation/Stages/stage-07-privesc.md) | Case 01 | Not tested |
| 08 | SSH persistence | T1098.004 | [stage-08](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | TBD | TBD | [stage-08](04-Investigation/Stages/stage-08-ssh-persistence.md) | Case 02 | Not tested |
| 09 | Internal discovery | T1018 | [stage-09](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | TBD | TBD | [stage-09](04-Investigation/Stages/stage-09-internal-discovery.md) | Case 02 | Not tested |
| 10 | Responder poisoning | T1557.001 | [stage-10](02-Attack-Simulation/Stages/stage-10-responder.md) | TBD | TBD | [stage-10](04-Investigation/Stages/stage-10-responder.md) | Case 02 | Not tested |
| 11 | NTLMv2 cracking | T1110.002 | [stage-11](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | TBD | TBD | [stage-11](04-Investigation/Stages/stage-11-ntlmv2-crack.md) | Case 02 | Not tested |
| 12 | BloodHound enumeration | T1087.002 | [stage-12](02-Attack-Simulation/Stages/stage-12-bloodhound.md) | TBD | TBD | [stage-12](04-Investigation/Stages/stage-12-bloodhound.md) | Case 02 | Not tested |
| 13 | Kerberoasting | T1558.003 | [stage-13](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | TBD | TBD | [stage-13](04-Investigation/Stages/stage-13-kerberoasting.md) | Case 02 | Not tested |
| 14 | DCSync | T1003.006 | [stage-14](02-Attack-Simulation/Stages/stage-14-dcsync.md) | TBD | TBD | [stage-14](04-Investigation/Stages/stage-14-dcsync.md) | Case 02 | Not tested |
| 15 | Pass-the-Hash | T1550.002 | [stage-15](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | TBD | TBD | [stage-15](04-Investigation/Stages/stage-15-pass-the-hash.md) | Case 03 | Not tested |
| 16 | Golden Ticket | T1558.001 | [stage-16](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | TBD | TBD | [stage-16](04-Investigation/Stages/stage-16-golden-ticket.md) | Case 03 | Not tested |
| 17 | DC persistence | T1136.002 | [stage-17](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | TBD | TBD | [stage-17](04-Investigation/Stages/stage-17-dc-persistence.md) | Case 03 | Not tested |
| 18 | Collection | T1005 | [stage-18](02-Attack-Simulation/Stages/stage-18-collection.md) | TBD | TBD | [stage-18](04-Investigation/Stages/stage-18-collection.md) | Case 03 | Not tested |
| 19 | Exfiltration | T1041 | [stage-19](02-Attack-Simulation/Stages/stage-19-exfiltration.md) | TBD | TBD | [stage-19](04-Investigation/Stages/stage-19-exfiltration.md) | Case 03 | Not tested |
| 20 | Impact | T1491.001 | [stage-20](02-Attack-Simulation/Stages/stage-20-impact.md) | TBD | TBD | [stage-20](04-Investigation/Stages/stage-20-impact.md) | Case 03 | Not tested |

## TheHive case map

| Case | Scope | Stages | TheHive case ID | Repo summary |
|---|---|---|---|---|
| Case 01 | Web application compromise | 01–07 | TBD | [case-01](04-Investigation/Cases/case-01-web-compromise.md) |
| Case 02 | Lateral movement and credential access | 08–14 | TBD | [case-02](04-Investigation/Cases/case-02-lateral-movement.md) |
| Case 03 | Domain compromise and impact | 15–20 | TBD | [case-03](04-Investigation/Cases/case-03-domain-compromise.md) |

## Evidence index

| Evidence set | Location |
|---|---|
| Attack screenshots | `02-Attack-Simulation/Attack-Screenshots/stage-01/` … `stage-20/` |
| Alert screenshots | `02-Attack-Simulation/alert-screenshots/stage-01/` … `stage-20/` |

## Naming conventions

- Stage files: `stage-XX-short-name.md`
- Screenshots: `stage-XX-NN-description.png`
- Detection gaps: `DG-XX`
- TheHive cases: `CASE-01`, `CASE-02`, `CASE-03`
- Alerts: use the real TheHive alert ID once known; until then use `ALERT-TBD`
