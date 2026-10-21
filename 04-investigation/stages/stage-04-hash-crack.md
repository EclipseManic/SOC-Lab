# Investigation — Stage 04 — Hash Cracking

> **Status:** Draft
> **Attack stage:** [Stage 04](../../02-attack-simulation/stages/stage-04-hash-crack.md)
> **TheHive case:** [Case 01](../cases/case-01-web-compromise.md)

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

1. Identify the hash source and algorithm.
2. Confirm when and where the hash was extracted.
3. Check whether the recovered credential was used.
4. Record the detection assessment, including whether offline cracking is observable at all.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-04/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-04/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| Hash | TBD | Extracted hash (redact value) |
| User | TBD | Account whose hash was cracked |

## Detection assessment

Status: Not tested
Gap ID: DG-04
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Credential Access
Technique: Password Cracking (T1110.002)
