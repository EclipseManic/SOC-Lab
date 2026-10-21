# Detection Coverage Matrix

One row per attack stage. Update the status only after the stage has been executed and the alert path has been verified.

## Status legend

| Status | Meaning |
|---|---|
| Detected | Telemetry and a rule existed, and the rule fired |
| Logging gap | Required telemetry was not collected |
| Detection gap | Telemetry existed, but no rule covered the behavior |
| Rule failure | A rule existed, but did not fire as expected |
| Not tested | Stage not yet validated |

## Matrix

| # | Stage | Suggested ATT&CK | Required data source | Rule / analytic | Rule ID | Status | Gap ID | Evidence |
|---|---|---|---|---|---|---|---|---|
| 01 | Reconnaissance | T1595 | Network flow / IDS | TBD | TBD | Not tested | DG-01 | TBD |
| 02 | Brute force | T1110 | Web or auth logs | TBD | TBD | Not tested | DG-02 | TBD |
| 03 | SQL injection | T1190 | HTTP / WAF / IDS | TBD | TBD | Not tested | DG-03 | TBD |
| 04 | Hash cracking | T1110.002 | Offline (none) | TBD | TBD | Not tested | DG-04 | TBD |
| 05 | Web shell upload | T1505.003 | Web server / FIM | TBD | TBD | Not tested | DG-05 | TBD |
| 06 | Reverse shell | T1059.004 | Process / network | TBD | TBD | Not tested | DG-06 | TBD |
| 07 | Privilege escalation | T1068 | Auth / process / FIM | TBD | TBD | Not tested | DG-07 | TBD |
| 08 | SSH persistence | T1098.004 | Auth / FIM | TBD | TBD | Not tested | DG-08 | TBD |
| 09 | Internal discovery | T1018 | Network / process | TBD | TBD | Not tested | DG-09 | TBD |
| 10 | Responder poisoning | T1557.001 | Network / auth | TBD | TBD | Not tested | DG-10 | TBD |
| 11 | NTLMv2 cracking | T1110.002 | Offline (none) | TBD | TBD | Not tested | DG-11 | TBD |
| 12 | BloodHound enumeration | T1087.002 | LDAP / directory service | TBD | TBD | Not tested | DG-12 | TBD |
| 13 | Kerberoasting | T1558.003 | Kerberos / directory service | TBD | TBD | Not tested | DG-13 | TBD |
| 14 | DCSync | T1003.006 | Directory service / DRSUAPI | TBD | TBD | Not tested | DG-14 | TBD |
| 15 | Pass-the-Hash | T1550.002 | Auth / SMB | TBD | TBD | Not tested | DG-15 | TBD |
| 16 | Golden Ticket | T1558.001 | Kerberos | TBD | TBD | Not tested | DG-16 | TBD |
| 17 | DC persistence | T1136.002 | Directory service / Windows security | TBD | TBD | Not tested | DG-17 | TBD |
| 18 | Collection | T1005 | File / process | TBD | TBD | Not tested | DG-18 | TBD |
| 19 | Exfiltration | T1041 | Network / proxy | TBD | TBD | Not tested | DG-19 | TBD |
| 20 | Impact | T1491.001 | FIM / process / file | TBD | TBD | Not tested | DG-20 | TBD |

## Summary

| Metric | Value |
|---|---|
| Stages with a verified detection | TBD / 20 |
| Logging gaps | TBD |
| Detection gaps | TBD |
| Rule failures | TBD |
| Untested | 20 |
| ATT&CK techniques covered | TBD |
| ATT&CK Navigator layer | TBD |

## Notes

- A technique marked Detected still needs a quality check: did the rule fire for the right reason, and was the alert actionable?
- Do not count a rule as coverage if it only exists in a repository and has never been executed.
- Link each row to the matching investigation file and, where available, the rule file and evidence screenshot.
