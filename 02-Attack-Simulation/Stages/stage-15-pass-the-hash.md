# Stage 15 — Pass-the-Hash

> **Status:** Draft — evidence pending
> **Case:** [Case 03](../../04-Investigation/Cases/case-03-domain-compromise.md)
> **Investigation:** [Stage 15](../../04-Investigation/Stages/stage-15-pass-the-hash.md)
> **Evidence:** [attack](../Attack-Screenshots/stage-15/) · [alert](../alert-screenshots/stage-15/)

## Objective

Authenticate to remote hosts using an extracted NTLM hash without the plaintext password.

## Commands

```text
TBD — add the NetExec/CrackMapExec or Impacket command.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../Attack-Screenshots/stage-15/`
- Alert screenshots: `../alert-screenshots/stage-15/`
- If no alert: see `DG-15` in [gaps.md](../../03-Detection-Engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Lateral Movement | Pass the Hash | T1550.002 |

## Notes

Record source host, target host, account, service, and the successful command.
