# Stage 04 — Hash Cracking

> **Status:** Draft — evidence pending
> **Case:** [Case 01](../../04-investigation/cases/case-01-web-compromise.md)
> **Investigation:** [Stage 04](../../04-investigation/stages/stage-04-hash-crack.md)
> **Evidence:** [attack](../attack-screenshots/stage-04/) · [alert](../alert-screenshots/stage-04/)

## Objective

Recover plaintext credentials from captured or extracted password hashes.

## Commands

```text
TBD — add the exact hashcat or john commands and wordlist used.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../attack-screenshots/stage-04/`
- Alert screenshots: `../alert-screenshots/stage-04/`
- If no alert: see `DG-04` in [gaps.md](../../03-detection-engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Credential Access | Password Cracking | T1110.002 |

## Notes

Hash cracking happens off-host and may produce no network or endpoint alert. This is a good candidate for a detection gap entry.
