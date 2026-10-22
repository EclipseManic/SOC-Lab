# Stage 14 — DCSync

> **Status:** Draft — evidence pending
> **Case:** [Case 02](../../04-Investigation/Cases/case-02-lateral-movement.md)
> **Investigation:** [Stage 14](../../04-Investigation/Stages/stage-14-dcsync.md)
> **Evidence:** [attack](../Attack-Screenshots/stage-14/) · [alert](../alert-screenshots/stage-14/)

## Objective

Replicate directory credentials from the Domain Controller using DRSUAPI.

## Commands

```text
TBD — add the Impacket secretsdump or Mimikatz DCSync command.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../Attack-Screenshots/stage-14/`
- Alert screenshots: `../alert-screenshots/stage-14/`
- If no alert: see `DG-14` in [gaps.md](../../03-Detection-Engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Credential Access | DCSync | T1003.006 |

## Notes

Record the account used, the replication rights, and the accounts whose hashes were extracted. Redact the hashes.
