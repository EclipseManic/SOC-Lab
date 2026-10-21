# Incident Timeline

All times should use one timezone and one format. Record the source for every row.

## Timeline

| Time | Stage | Event | Source | Evidence |
|---|---|---|---|---|
| TBD | 01 | Reconnaissance starts | Suricata | TBD |
| TBD | 02 | Brute force attempt | Wazuh / web log | TBD |
| TBD | 03 | SQL injection | Suricata / Wazuh | TBD |
| TBD | 05 | Web shell uploaded | Wazuh / FIM | TBD |
| TBD | 06 | Reverse shell established | Wazuh / network | TBD |
| TBD | 07 | Privilege escalation | Host log | TBD |
| TBD | 08 | SSH persistence | Auth log | TBD |
| TBD | 09 | Internal discovery | Network flow | TBD |
| TBD | 10 | Responder poisoning | Network / auth | TBD |
| TBD | 11 | NTLMv2 hash cracked | Offline | TBD |
| TBD | 12 | BloodHound enumeration | Directory service | TBD |
| TBD | 13 | Kerberoasting | Kerberos | TBD |
| TBD | 14 | DCSync | Directory service | TBD |
| TBD | 15 | Pass-the-Hash | Auth / SMB | TBD |
| TBD | 16 | Golden Ticket | Kerberos | TBD |
| TBD | 17 | Backdoor account created | Windows security | TBD |
| TBD | 18 | Collection | File / process | TBD |
| TBD | 19 | Exfiltration | Network | TBD |
| TBD | 20 | Impact artifacts created | FIM / file | TBD |

## Response timeline

| Time | Action | Owner | Evidence |
|---|---|---|---|
| TBD | Alert triaged | TBD | TBD |
| TBD | Case created | TBD | TBD |
| TBD | Host isolated | TBD | TBD |
| TBD | Persistence removed | TBD | TBD |
| TBD | Host restored | TBD | TBD |

## Notes

- Use the earliest reliable timestamp for each event.
- If sources disagree, record both and explain the discrepancy.
- Keep the raw timestamps in the stage notes; this file is the consolidated view.
