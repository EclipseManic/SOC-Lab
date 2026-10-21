# Investigation — Stage 07 — Privilege Escalation

> **Status:** Draft
> **Attack stage:** [Stage 07](../../02-attack-simulation/stages/stage-07-privesc.md)
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

1. Identify the vulnerable component and exploit path.
2. Confirm the before and after user context.
3. Check sudo, SUID, cron, and service changes.
4. Review authentication and process logs.
5. Collect the exploit artifacts and file hashes.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-07/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-07/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| User | `www-data` | Initial web user (verify) |
| User | `root` | Escalated context (verify) |
| File | TBD | Exploit or modified file |

## Detection assessment

Status: Not tested
Gap ID: DG-07
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Privilege Escalation
Technique: Exploitation for Privilege Escalation (T1068)
