# Investigation — Stage 13 — Kerberoasting

> **Status:** Draft
> **Attack stage:** [Stage 13](../../02-attack-simulation/stages/stage-13-kerberoasting.md)
> **TheHive case:** [Case 02](../cases/case-02-lateral-movement.md)

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

1. Identify the service account and SPN.
2. Review Kerberos service ticket requests (event 4769).
3. Check the ticket encryption type and volume.
4. Confirm whether the ticket was cracked or used.
5. Correlate with DCSync and lateral movement.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-13/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-13/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| User | `HANK_SHERMAN` | Kerberoasting target (verify) |
| SPN | TBD | Service principal name |
| Ticket encryption | TBD | RC4 or AES |

## Detection assessment

Status: Not tested
Gap ID: DG-13
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Credential Access
Technique: Kerberoasting (T1558.003)
