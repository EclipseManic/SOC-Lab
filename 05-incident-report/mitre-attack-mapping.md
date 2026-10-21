# MITRE ATT&CK Mapping

Suggested mapping for the campaign. Verify each technique against the actual command, telemetry, and alert before treating it as final.

| # | Stage | Tactic | Technique | ID | Detection status | Evidence |
|---|---|---|---|---|---|---|
| 01 | Reconnaissance | Reconnaissance | Active Scanning | T1595 | Not tested | TBD |
| 02 | Brute force | Credential Access | Brute Force | T1110 | Not tested | TBD |
| 03 | SQL injection | Initial Access | Exploit Public-Facing Application | T1190 | Not tested | TBD |
| 04 | Hash cracking | Credential Access | Password Cracking | T1110.002 | Not tested | TBD |
| 05 | Web shell upload | Persistence | Server Web Shell | T1505.003 | Not tested | TBD |
| 06 | Reverse shell | Execution | Unix Shell | T1059.004 | Not tested | TBD |
| 07 | Privilege escalation | Privilege Escalation | Exploitation for Privilege Escalation | T1068 | Not tested | TBD |
| 08 | SSH persistence | Persistence | SSH Authorized Keys | T1098.004 | Not tested | TBD |
| 09 | Internal discovery | Discovery | Remote System Discovery | T1018 | Not tested | TBD |
| 10 | Responder poisoning | Credential Access | LLMNR/NBT-NS Poisoning and SMB Relay | T1557.001 | Not tested | TBD |
| 11 | NTLMv2 cracking | Credential Access | Password Cracking | T1110.002 | Not tested | TBD |
| 12 | BloodHound enumeration | Discovery | Domain Account | T1087.002 | Not tested | TBD |
| 13 | Kerberoasting | Credential Access | Kerberoasting | T1558.003 | Not tested | TBD |
| 14 | DCSync | Credential Access | DCSync | T1003.006 | Not tested | TBD |
| 15 | Pass-the-Hash | Lateral Movement | Pass the Hash | T1550.002 | Not tested | TBD |
| 16 | Golden Ticket | Credential Access / Persistence | Golden Ticket | T1558.001 | Not tested | TBD |
| 17 | DC persistence | Persistence | Domain Account | T1136.002 | Not tested | TBD |
| 18 | Collection | Collection | Data from Local System | T1005 | Not tested | TBD |
| 19 | Exfiltration | Exfiltration | Exfiltration Over C2 Channel | T1041 | Not tested | TBD |
| 20 | Impact | Impact | Internal Defacement | T1491.001 | Not tested | TBD |

## Coverage summary

| Tactic | Techniques | Detected | Gaps |
|---|---|---|---|
| Reconnaissance | 1 | TBD | TBD |
| Initial Access | 1 | TBD | TBD |
| Execution | 1 | TBD | TBD |
| Persistence | 3 | TBD | TBD |
| Privilege Escalation | 1 | TBD | TBD |
| Credential Access | 6 | TBD | TBD |
| Discovery | 2 | TBD | TBD |
| Lateral Movement | 1 | TBD | TBD |
| Collection | 1 | TBD | TBD |
| Exfiltration | 1 | TBD | TBD |
| Impact | 1 | TBD | TBD |

## Notes

- Sub-techniques matter: T1110.002 is not the same detection problem as T1110.
- The mapping should match `INDEX.md`, the stage files, and the coverage matrix.
- Export an ATT&CK Navigator layer once the statuses are verified.
