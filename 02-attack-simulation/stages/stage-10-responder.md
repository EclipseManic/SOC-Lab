# Stage 10 — Responder Poisoning

> **Status:** Draft — evidence pending
> **Case:** [Case 02](../../04-investigation/cases/case-02-lateral-movement.md)
> **Investigation:** [Stage 10](../../04-investigation/stages/stage-10-responder.md)
> **Evidence:** [attack](../attack-screenshots/stage-10/) · [alert](../alert-screenshots/stage-10/)

## Objective

Capture NTLMv2 challenge-response hashes by poisoning LLMNR, NBT-NS, or mDNS traffic.

## Commands

```text
TBD — add the Responder interface and options.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../attack-screenshots/stage-10/`
- Alert screenshots: `../alert-screenshots/stage-10/`
- If no alert: see `DG-10` in [gaps.md](../../03-detection-engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Credential Access | LLMNR/NBT-NS Poisoning and SMB Relay | T1557.001 |

## Notes

Record the poisoned protocol, victim host, captured username, and hash type.
