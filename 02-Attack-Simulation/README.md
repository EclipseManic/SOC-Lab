# 02 — Attack Simulation

This section documents the 20-stage adversary campaign against the lab, in execution order. Each stage file holds the objective, commands, evidence links, the alert that fired (or the detection gap if none did), and the suggested ATT&CK mapping.

## Stage index

| # | Stage | Case | Suggested ATT&CK |
|---|---|---|---|
| 01 | [Reconnaissance](Stages/stage-01-recon.md) | Case 01 | T1595 |
| 02 | [Brute force](Stages/stage-02-bruteforce.md) | Case 01 | T1110 |
| 03 | [SQL injection](Stages/stage-03-sqli.md) | Case 01 | T1190 |
| 04 | [Hash cracking](Stages/stage-04-hash-crack.md) | Case 01 | T1110.002 |
| 05 | [Web shell upload](Stages/stage-05-webshell.md) | Case 01 | T1505.003 |
| 06 | [Reverse shell](Stages/stage-06-reverse-shell.md) | Case 01 | T1059.004 |
| 07 | [Privilege escalation](Stages/stage-07-privesc.md) | Case 01 | T1068 |
| 08 | [SSH persistence](Stages/stage-08-ssh-persistence.md) | Case 02 | T1098.004 |
| 09 | [Internal discovery](Stages/stage-09-internal-discovery.md) | Case 02 | T1018 |
| 10 | [Responder poisoning](Stages/stage-10-responder.md) | Case 02 | T1557.001 |
| 11 | [NTLMv2 cracking](Stages/stage-11-ntlmv2-crack.md) | Case 02 | T1110.002 |
| 12 | [BloodHound enumeration](Stages/stage-12-bloodhound.md) | Case 02 | T1087.002 |
| 13 | [Kerberoasting](Stages/stage-13-kerberoasting.md) | Case 02 | T1558.003 |
| 14 | [DCSync](Stages/stage-14-dcsync.md) | Case 02 | T1003.006 |
| 15 | [Pass-the-Hash](Stages/stage-15-pass-the-hash.md) | Case 03 | T1550.002 |
| 16 | [Golden Ticket](Stages/stage-16-golden-ticket.md) | Case 03 | T1558.001 |
| 17 | [DC persistence](Stages/stage-17-dc-persistence.md) | Case 03 | T1136.002 |
| 18 | [Collection](Stages/stage-18-collection.md) | Case 03 | T1005 |
| 19 | [Exfiltration](Stages/stage-19-exfiltration.md) | Case 03 | T1041 |
| 20 | [Impact](Stages/stage-20-impact.md) | Case 03 | T1491.001 |

## How to read a stage

1. **Objective** — what the attacker is trying to achieve.
2. **Commands** — the exact tooling and syntax used.
3. **What happened** — the observed result, including failures.
4. **Evidence** — redacted attack screenshots and alert screenshots.
5. **Alert observed** — the Suricata, Wazuh, or TheHive rule that fired.
6. **MITRE ATT&CK** — the technique mapping used in the investigation and report.
7. **Notes** — caveats, versions, and links to the detection gap.

## Evidence

| Evidence | Location |
|---|---|
| Attacker-side screenshots | `Attack-Screenshots/stage-XX/` |
| Alert-side screenshots | `alert-screenshots/stage-XX/` |

Embed images with relative links; do not copy the same file into both folders. Compress images before committing and redact public IPs, keys, tokens, hashes, and passwords.

## Suggested ATT&CK mappings

The mappings in this section are starting points. Verify each one against the actual command behavior and the alert that fired. If a stage has no alert, record it as a logging gap, detection gap, or rule failure in [03-Detection-Engineering/gaps.md](../03-Detection-Engineering/gaps.md) instead of leaving the stage undocumented.

## Status

All 20 stage files are scaffolded. Evidence, commands, and alert IDs are marked `TBD` until the real content is added. The recommended first vertical slice is Stage 03 (SQL injection), followed by Stage 06 (reverse shell).
