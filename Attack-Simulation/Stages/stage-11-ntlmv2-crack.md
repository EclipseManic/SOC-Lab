# Stage 11 — NTLMv2 Cracking

> **Status:** Draft — evidence pending
> **Case:** [Case 02](../../Investigation/Cases/case-02-lateral-movement.md)
> **Investigation:** [Stage 11](../../Investigation/Stages/stage-11-ntlmv2-crack.md)
> **Evidence:** [attack](../Attack-Screenshots/stage-11/) · [alert](../alert-screenshots/stage-11/)

## Objective

Recover plaintext credentials from the NTLMv2 hashes captured in Stage 10.

## Commands

```text
TBD — add the hashcat mode, wordlist, and rules used.
```

## What happened

TBD

## Evidence

- Attack screenshots: `../Attack-Screenshots/stage-11/`
- Alert screenshots: `../alert-screenshots/stage-11/`
- If no alert: see `DG-11` in [gaps.md](../../Detection-Engineering/gaps.md).

## Alert observed

| Source | Rule | Rule ID | TheHive alert | Severity |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Credential Access | Password Cracking | T1110.002 |

## Notes

Cracking is offline and may produce no alert. Document it as a detection gap candidate.
