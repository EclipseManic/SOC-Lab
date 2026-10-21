# Investigation — Stage 20 — Impact

> **Status:** Draft
> **Attack stage:** [Stage 20](../../02-attack-simulation/stages/stage-20-impact.md)
> **TheHive case:** [Case 03](../cases/case-03-domain-compromise.md)

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

1. Identify the affected host and files.
2. Record timestamps, paths, and hashes.
3. Confirm the process or account that created the artifacts.
4. Assess the operational impact.
5. Revert the host from a clean snapshot after evidence collection.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-20/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-20/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| File | `hacked.bmp` | Impact artifact (verify path) |
| File | `README_HACKED.txt` | Impact artifact (verify path) |
| Host | TBD | Affected host |

## Detection assessment

Status: Not tested
Gap ID: DG-20
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Impact
Technique: Internal Defacement (T1491.001)
