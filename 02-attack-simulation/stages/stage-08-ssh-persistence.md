# Stage 08 — SSH Persistence

> **Status:** Draft — evidence pending
> **Case:** [Case 02](../../04-investigation/cases/case-02-lateral-movement.md)
> **Investigation:** [Stage 08](../../04-investigation/stages/stage-08-ssh-persistence.md)
> **Evidence:** [attack](../attack-screenshots/stage-08/) · [alert](../alert-screenshots/stage-08/)

## Objective

Maintain access to the compromised Linux host through SSH keys or an added account.

## Commands

```text
TBD — add the key generation, authorized_keys, or user creation commands.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../attack-screenshots/stage-08/`
- Alert screenshots: `../alert-screenshots/stage-08/`
- If no alert: see `DG-08` in [gaps.md](../../03-detection-engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Persistence | SSH Authorized Keys | T1098.004 |

## Notes

Record the key fingerprint, account, file path, and modification time.
