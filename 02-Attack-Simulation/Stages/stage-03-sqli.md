# Stage 03 — SQL Injection

> **Status:** Draft — evidence pending
> **Case:** [Case 01](../../04-Investigation/Cases/case-01-web-compromise.md)
> **Investigation:** [Stage 03](../../04-Investigation/Stages/stage-03-sqli.md)
> **Evidence:** [attack](../Attack-Screenshots/stage-03/) · [alert](../alert-screenshots/stage-03/)

## Objective

Exploit a SQL injection vulnerability in DVWA to extract data and credentials.

## Commands

```text
TBD — add the exact sqlmap commands and request details.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../Attack-Screenshots/stage-03/`
- Alert screenshots: `../alert-screenshots/stage-03/`
- If no alert: see `DG-03` in [gaps.md](../../03-Detection-Engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Initial Access | Exploit Public-Facing Application | T1190 |

## Notes

This stage is the recommended first vertical slice: it exercises the attack doc, the Suricata/Wazuh alert path, the TheHive case, and the investigation template end to end.
