# Investigation — Stage 17 — DC Persistence

> **Status:** Draft
> **Attack stage:** [Stage 17](../../02-attack-simulation/stages/stage-17-dc-persistence.md)
> **TheHive case:** [Case 03](../cases/case-03-domain-compromise.md)

## Alert details

| Alert ID | Rule ID | Source | Severity | TLP / PAP |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## What was detected

TBD

## Triage

Verdict: TBD
Confidence: TBD
Reason: TBD

## Investigation steps

1. Identify the created account and its group membership.
2. Review Windows account-management events.
3. Confirm who created the account and from where.
4. Check for other persistence mechanisms.
5. Record the account details and disable it after evidence collection.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-17/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-17/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| User | `backdoor` | Persistence account (verify) |
| Group | TBD | Privileged group |
| Host | `PC-DC.ad.lab` | Domain Controller |

## Detection assessment

Status: Not tested
Gap ID: DG-17
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Persistence
Technique: Domain Account (T1136.002)
