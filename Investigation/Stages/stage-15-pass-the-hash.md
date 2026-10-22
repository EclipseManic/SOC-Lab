# Investigation — Stage 15 — Pass-the-Hash

> **Status:** Draft
> **Attack stage:** [Stage 15](../../Attack-Simulation/Stages/stage-15-pass-the-hash.md)
> **TheHive case:** [Case 03](../Cases/case-03-domain-compromise.md)

## Alert details

| Alert ID | Rule ID | Source | Severity | TLP / PAP |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## What was detected

TBD

## Triage

Verdict: TBD
Confidence: TBD
Reason: TBD

## Investigation steps

1. Identify the source host, target host, and account.
2. Review authentication events and logon type.
3. Check SMB and service access on the target.
4. Confirm which credential was used.
5. Correlate with DCSync and the Golden Ticket stage.

## Evidence

- Attack: `../../Attack-Simulation/Attack-Screenshots/stage-15/`
- Alert: `../../Attack-Simulation/alert-screenshots/stage-15/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| Host | TBD | Source and target |
| User | TBD | Account used |
| Service | SMB | Lateral movement channel |

## Detection assessment

Status: Not tested
Gap ID: DG-15
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Lateral Movement
Technique: Pass the Hash (T1550.002)
