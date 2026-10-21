# Stage 05 — Web Shell Upload

> **Status:** Draft — evidence pending
> **Case:** [Case 01](../../04-investigation/cases/case-01-web-compromise.md)
> **Investigation:** [Stage 05](../../04-investigation/stages/stage-05-webshell.md)
> **Evidence:** [attack](../attack-screenshots/stage-05/) · [alert](../alert-screenshots/stage-05/)

## Objective

Upload a web shell to DVWA and obtain command execution on the web server.

## Commands

```text
TBD — add the upload request and the first web shell command.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../attack-screenshots/stage-05/`
- Alert screenshots: `../alert-screenshots/stage-05/`
- If no alert: see `DG-05` in [gaps.md](../../03-detection-engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Persistence | Server Web Shell | T1505.003 |

## Notes

Record the uploaded filename, path, hash, and the user context of the web server.
