# Case 03 — Domain Compromise and Impact

> **Status:** Draft
> **TheHive case ID:** TBD
> **Severity:** TBD
> **TLP / PAP:** TBD

## Summary

TBD — describe the domain-wide compromise, persistence, collection, exfiltration, and impact.

## Scope

| Stage | Attack | Investigation |
|---|---|---|
| 15 | [Pass-the-Hash](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | [stage-15](../Stages/stage-15-pass-the-hash.md) |
| 16 | [Golden Ticket](../../02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | [stage-16](../Stages/stage-16-golden-ticket.md) |
| 17 | [DC persistence](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | [stage-17](../Stages/stage-17-dc-persistence.md) |
| 18 | [Collection](../../02-Attack-Simulation/Stages/stage-18-collection.md) | [stage-18](../Stages/stage-18-collection.md) |
| 19 | [Exfiltration](../../02-Attack-Simulation/Stages/stage-19-exfiltration.md) | [stage-19](../Stages/stage-19-exfiltration.md) |
| 20 | [Impact](../../02-Attack-Simulation/Stages/stage-20-impact.md) | [stage-20](../Stages/stage-20-impact.md) |

## Detection sources

| Source | What it contributed |
|---|---|
| Suricata | Outbound transfer only; victim-to-victim SMB and Kerberos stay on the local subnet |
| Wazuh | Account creation, logon, and file integrity events |
| TheHive | Case/task tracking |
| Velociraptor | Artifact collection and timeline |

## Timeline

| Time | Event | Source | Evidence |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Observables

| Type | Value | Context |
|---|---|---|
| User | `backdoor` | Persistence account (verify) |
| File | `hacked.bmp` | Impact artifact (verify path) |
| File | `README_HACKED.txt` | Impact artifact (verify path) |
| Hash | TBD | Administrator NT hash (redact value) |
| Host | `PC-DC.ad.lab` | Domain Controller |

## Tasks

- [ ] Trace the lateral movement path
- [ ] Identify the backdoor account creation
- [ ] Confirm Golden Ticket use
- [ ] Confirm collection activity and file paths
- [ ] Document exfiltrated data and volume
- [ ] Assess impact and affected systems
- [ ] Collect Velociraptor artifacts before remediation
- [ ] Write the case summary

## Findings

TBD

## Detection performance

| Metric | Value |
|---|---|
| Stages with a verified alert | TBD / 6 |
| First alert | TBD |
| Mean time to detect | TBD |
| Gaps | TBD |

## Verdict

TBD

## Lessons

TBD
