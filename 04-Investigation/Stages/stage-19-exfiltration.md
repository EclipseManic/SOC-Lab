# Investigation — Stage 19 — Exfiltration

> **Status:** Draft
> **Attack stage:** [Stage 19](../../02-Attack-Simulation/Stages/stage-19-exfiltration.md)
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

1. Identify the source host, destination, protocol, and volume.
2. Review network flow and proxy logs.
3. Confirm the transferred files and hashes.
4. Check for data staging before transfer.
5. Redact any external destination in the published case.

## Evidence

- Attack: `../../02-Attack-Simulation/Attack-Screenshots/stage-19/`
- Alert: `../../02-Attack-Simulation/alert-screenshots/stage-19/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| IP | TBD | Destination (redact if public) |
| Protocol | TBD | Transfer method |
| File | TBD | Exfiltrated data |

## Detection assessment

Status: Not tested
Gap ID: DG-19
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Exfiltration
Technique: Exfiltration Over C2 Channel (T1041)
