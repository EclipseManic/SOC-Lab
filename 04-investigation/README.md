# 04 — Investigation

This section is the analyst view of the campaign. Each attack stage has a matching investigation note, and every note is linked to one of three TheHive cases.

## Why stage-wise notes and case summaries

TheHive is case-centric: alerts become cases, and cases contain tasks, observables, TTPs, and a timeline. An incident is the case, not the stage. The repository therefore has two layers:

| Layer | Location | Purpose |
|---|---|---|
| Case summary | `cases/` | The TheHive case record: scope, severity, observables, tasks, verdict |
| Stage note | `stages/` | The detailed investigation of one technique, with queries and evidence |

This gives stage-level traceability without fragmenting one incident into twenty tiny cases.

## Case map

| Case | Scope | Stages | Summary |
|---|---|---|---|
| Case 01 | Web application compromise | 01–07 | [case-01-web-compromise.md](cases/case-01-web-compromise.md) |
| Case 02 | Lateral movement and credential access | 08–14 | [case-02-lateral-movement.md](cases/case-02-lateral-movement.md) |
| Case 03 | Domain compromise and impact | 15–20 | [case-03-domain-compromise.md](cases/case-03-domain-compromise.md) |

## Investigation workflow

1. **Receive the alert.** Record the alert ID, rule ID, source, and timestamp.
2. **Triage.** Decide true positive, false positive, or benign. Set severity, TLP, and PAP.
3. **Create or update the case.** Use the three-case map above.
4. **Add observables.** IPs, users, files, hashes, URLs, and domains.
5. **Create tasks.** One task per investigation step, not one task per tool.
6. **Investigate.** Use Wazuh, Suricata, TheHive, Velociraptor, and host logs.
7. **Correlate.** Build a timeline and link the stage to the attack evidence.
8. **Assess detection.** Mark Detected, Logging gap, Detection gap, Rule failure, or Not tested.
9. **Conclude.** Write the verdict and update `INDEX.md`.
10. **Close the case.** Write the summary and export the case report.

## Stage notes

| # | Stage | Investigation |
|---|---|---|
| 01 | Reconnaissance | [stage-01](stages/stage-01-recon.md) |
| 02 | Brute force | [stage-02](stages/stage-02-bruteforce.md) |
| 03 | SQL injection | [stage-03](stages/stage-03-sqli.md) |
| 04 | Hash cracking | [stage-04](stages/stage-04-hash-crack.md) |
| 05 | Web shell upload | [stage-05](stages/stage-05-webshell.md) |
| 06 | Reverse shell | [stage-06](stages/stage-06-reverse-shell.md) |
| 07 | Privilege escalation | [stage-07](stages/stage-07-privesc.md) |
| 08 | SSH persistence | [stage-08](stages/stage-08-ssh-persistence.md) |
| 09 | Internal discovery | [stage-09](stages/stage-09-internal-discovery.md) |
| 10 | Responder poisoning | [stage-10](stages/stage-10-responder.md) |
| 11 | NTLMv2 cracking | [stage-11](stages/stage-11-ntlmv2-crack.md) |
| 12 | BloodHound enumeration | [stage-12](stages/stage-12-bloodhound.md) |
| 13 | Kerberoasting | [stage-13](stages/stage-13-kerberoasting.md) |
| 14 | DCSync | [stage-14](stages/stage-14-dcsync.md) |
| 15 | Pass-the-Hash | [stage-15](stages/stage-15-pass-the-hash.md) |
| 16 | Golden Ticket | [stage-16](stages/stage-16-golden-ticket.md) |
| 17 | DC persistence | [stage-17](stages/stage-17-dc-persistence.md) |
| 18 | Collection | [stage-18](stages/stage-18-collection.md) |
| 19 | Exfiltration | [stage-19](stages/stage-19-exfiltration.md) |
| 20 | Impact | [stage-20](stages/stage-20-impact.md) |

## Status

All investigation notes and case summaries are scaffolded. Analyst findings, alert IDs, and evidence are marked `TBD` until the real investigation is documented.
