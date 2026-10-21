# Stage 16 — Golden Ticket

> **Status:** Draft — evidence pending
> **Case:** [Case 03](../../04-investigation/cases/case-03-domain-compromise.md)
> **Investigation:** [Stage 16](../../04-investigation/stages/stage-16-golden-ticket.md)
> **Evidence:** [attack](../attack-screenshots/stage-16/) · [alert](../alert-screenshots/stage-16/)

## Objective

Forge a Kerberos ticket-granting ticket using the KRBTGT hash to obtain persistent domain-wide access.

## Commands

```text
TBD — add the ticketer or Mimikatz command, with the hash redacted.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../attack-screenshots/stage-16/`
- Alert screenshots: `../alert-screenshots/stage-16/`
- If no alert: see `DG-16` in [gaps.md](../../03-detection-engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Credential Access / Persistence | Golden Ticket | T1558.001 |

## Notes

Record the domain SID, KRBTGT hash source, ticket lifetime, and the account used. Never publish the hash.
