# Investigation — Stage 14 — DCSync

> **Status:** Draft
> **Attack stage:** [Stage 14](../../02-attack-simulation/stages/stage-14-dcsync.md)
> **TheHive case:** [Case 02](../cases/case-02-lateral-movement.md)

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

1. Identify the account that requested replication.
2. Review directory service access and DRSUAPI traffic.
3. Confirm the accounts whose credentials were replicated.
4. Check for follow-on Pass-the-Hash or Golden Ticket activity.
5. Redact all extracted hashes in the case record.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-14/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-14/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| User | TBD | Account with replication rights |
| Host | `PC-DC.ad.lab` | Domain Controller |
| Hash | TBD | Replicated credential (redact value) |

## Detection assessment

Status: Not tested
Gap ID: DG-14
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Credential Access
Technique: DCSync (T1003.006)
