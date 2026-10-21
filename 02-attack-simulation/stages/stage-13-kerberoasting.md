# Stage 13 — Kerberoasting

> **Status:** Draft — evidence pending
> **Case:** [Case 02](../../04-investigation/cases/case-02-lateral-movement.md)
> **Investigation:** [Stage 13](../../04-investigation/stages/stage-13-kerberoasting.md)
> **Evidence:** [attack](../attack-screenshots/stage-13/) · [alert](../alert-screenshots/stage-13/)

## Objective

Request service tickets for accounts with SPNs and extract them for offline cracking.

## Commands

```text
TBD — add the Impacket or Rubeus command and the target SPN.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../attack-screenshots/stage-13/`
- Alert screenshots: `../alert-screenshots/stage-13/`
- If no alert: see `DG-13` in [gaps.md](../../03-detection-engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Credential Access | Kerberoasting | T1558.003 |

## Notes

Record the service account, SPN, ticket encryption type, and cracking result.
