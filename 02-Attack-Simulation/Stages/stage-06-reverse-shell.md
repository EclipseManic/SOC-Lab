# Stage 06 — Reverse Shell

> **Status:** Draft — evidence pending
> **Case:** [Case 01](../../04-Investigation/Cases/case-01-web-compromise.md)
> **Investigation:** [Stage 06](../../04-Investigation/Stages/stage-06-reverse-shell.md)
> **Evidence:** [attack](../Attack-Screenshots/stage-06/) · [alert](../alert-screenshots/stage-06/)

## Objective

Establish an interactive reverse shell from the DVWA host to Kali.

## Commands

```text
TBD — add the listener, payload, and shell upgrade commands.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../Attack-Screenshots/stage-06/`
- Alert screenshots: `../alert-screenshots/stage-06/`
- If no alert: see `DG-06` in [gaps.md](../../03-Detection-Engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Execution | Unix Shell | T1059.004 |

## Notes

This is the flagship technical stage for the portfolio. Capture the listener, the shell, the process context, and the network connection.
