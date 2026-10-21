# TheHive — Case Management

## Role

TheHive is the analyst workspace. Alerts arrive from thecustomhive, are triaged, and become cases with tasks, observables, TTPs, and a timeline.

## Configuration

| Item | Value |
|---|---|
| Version | `TBD` (verify TheHive 5.x) |
| URL | `TBD` (private/VPN address only) |
| Organisation | `TBD` |
| Analyst account | `TBD` |
| API key | `<REDACTED>` |
| Case templates | `TBD` |
| Observable types | IP, domain, file, hash, user, URL |

## Case model used in this lab

| Case | Scope | Stages |
|---|---|---|
| Case 01 | Web application compromise | 01–07 |
| Case 02 | Lateral movement and credential access | 08–14 |
| Case 03 | Domain compromise and impact | 15–20 |

An incident is a case, not a stage. Each stage becomes a task or a set of tasks inside the relevant case. The detailed stage notes live in `04-investigation/stages/`; the case summaries live in `04-investigation/cases/`.

## Triage workflow

1. Review the incoming alert and confirm the rule and source.
2. Decide true positive, false positive, or benign.
3. Set severity, TLP, and PAP.
4. Create a case or add the alert to an existing case.
5. Add observables (IP, user, file, hash, URL).
6. Add tasks for each investigation step.
7. Record findings and evidence links.
8. Write the case summary and close the case.

## Fields to capture

| Field | Why |
|---|---|
| Alert ID | Traceability back to Wazuh |
| Rule ID | Detection content reference |
| Source IP | Attacker or affected host |
| Destination IP | Target |
| User | Account involved |
| File / hash | Malware or tooling evidence |
| ATT&CK technique | Coverage and reporting |
| Timeline | Reconstruction |

## Evidence

- [ ] Redacted alert queue
- [ ] Case 01 overview
- [ ] Observable list
- [ ] Task list and completed findings
- [ ] Case report export

## Related documents

- [Investigation methodology](../../04-investigation/README.md)
- [Case 01](../../04-investigation/cases/case-01-web-compromise.md)
