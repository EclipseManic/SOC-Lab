# Investigation — Stage 08 — SSH Persistence

> **Status:** Draft
> **Attack stage:** [Stage 08](../../Attack-Simulation/Stages/stage-08-ssh-persistence.md)
> **TheHive case:** [Case 02](../Cases/case-02-lateral-movement.md)

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

1. Check `~/.ssh/authorized_keys` and file modification times.
2. Review authentication logs for the new key or account.
3. Identify the key fingerprint and owner.
4. Check for additional persistence mechanisms.
5. Remove or document the persistence only after evidence collection.

## Evidence

- Attack: `../../Attack-Simulation/Attack-Screenshots/stage-08/`
- Alert: `../../Attack-Simulation/alert-screenshots/stage-08/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| File | `~/.ssh/authorized_keys` | Persistence file |
| Key fingerprint | TBD | Added key (redact if sensitive) |
| User | TBD | Account used |

## Detection assessment

Status: Not tested
Gap ID: DG-08
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Persistence
Technique: SSH Authorized Keys (T1098.004)
