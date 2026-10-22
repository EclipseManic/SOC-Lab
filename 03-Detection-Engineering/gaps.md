# Detection Gap Register

Every stage that did not produce a reliable alert gets an entry here. A gap is not a failure of the lab; it is evidence that the detection engineering process is working.

## Classification

| Type | Definition | Typical fix |
|---|---|---|
| Logging gap | The required telemetry was not collected | Enable the log source, agent module, or audit policy |
| Detection gap | Telemetry existed, but no rule covered the behavior | Write and test a Sigma, Wazuh, or Suricata rule |
| Rule failure | A rule existed but did not fire as expected | Debug the decoder, field mapping, threshold, or suppression |

## Register

| ID | Stage | Gap type | What was missed | Proposed rule / fix | Test status | Owner | Retest date |
|---|---|---|---|---|---|---|---|
| DG-01 | Reconnaissance | TBD | TBD | TBD | Open | TBD | TBD |
| DG-02 | Brute force | TBD | TBD | TBD | Open | TBD | TBD |
| DG-03 | SQL injection | TBD | TBD | TBD | Open | TBD | TBD |
| DG-04 | Hash cracking | TBD | TBD | TBD | Open | TBD | TBD |
| DG-05 | Web shell upload | TBD | TBD | TBD | Open | TBD | TBD |
| DG-06 | Reverse shell | TBD | TBD | TBD | Open | TBD | TBD |
| DG-07 | Privilege escalation | TBD | TBD | TBD | Open | TBD | TBD |
| DG-08 | SSH persistence | TBD | TBD | TBD | Open | TBD | TBD |
| DG-09 | Internal discovery | TBD | TBD | TBD | Open | TBD | TBD |
| DG-10 | Responder poisoning | TBD | TBD | TBD | Open | TBD | TBD |
| DG-11 | NTLMv2 cracking | TBD | TBD | TBD | Open | TBD | TBD |
| DG-12 | BloodHound enumeration | TBD | TBD | TBD | Open | TBD | TBD |
| DG-13 | Kerberoasting | TBD | TBD | TBD | Open | TBD | TBD |
| DG-14 | DCSync | TBD | TBD | TBD | Open | TBD | TBD |
| DG-15 | Pass-the-Hash | TBD | TBD | TBD | Open | TBD | TBD |
| DG-16 | Golden Ticket | TBD | TBD | TBD | Open | TBD | TBD |
| DG-17 | DC persistence | TBD | TBD | TBD | Open | TBD | TBD |
| DG-18 | Collection | TBD | TBD | TBD | Open | TBD | TBD |
| DG-19 | Exfiltration | TBD | TBD | TBD | Open | TBD | TBD |
| DG-20 | Impact | TBD | TBD | TBD | Open | TBD | TBD |

## How to close a gap

1. State the exact behavior that was missed.
2. Confirm whether the telemetry exists. If not, fix collection first.
3. Write the smallest rule that detects the behavior.
4. Test it against the original stage and against benign activity.
5. Record the rule ID, test evidence, and false-positive notes.
6. Update the coverage matrix and `INDEX.md`.
7. Mark the gap Closed with a retest date.

## Notes

- Do not close a gap just because a rule was written; close it when the rule has been tested.
- A rule that fires on every scan is not useful. Prefer behavior and correlation over single-event noise.
- For offline stages such as hash cracking, the honest answer may be "no host or network telemetry is expected"; classify it as a logging gap only if that behavior should be observable somewhere.
