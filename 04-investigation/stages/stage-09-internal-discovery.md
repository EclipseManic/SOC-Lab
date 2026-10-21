# Investigation — Stage 09 — Internal Discovery

> **Status:** Draft
> **Attack stage:** [Stage 09](../../02-attack-simulation/stages/stage-09-internal-discovery.md)
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

1. Identify the source host and discovery tool.
2. Review the network flow volume and destination spread.
3. Correlate with process execution on the pivot host.
4. Identify which hosts and services were discovered.
5. Record the detection assessment.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-09/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-09/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Kali attacker |
| Host | `192.168.56.0/24` | Scanned victim range |

## Detection assessment

Status: Not tested
Gap ID: DG-09
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Discovery
Technique: Remote System Discovery (T1018)
