# Investigation — Stage 05 — Web Shell Upload

> **Status:** Draft
> **Attack stage:** [Stage 05](../../02-Attack-Simulation/Stages/stage-05-webshell.md)
> **TheHive case:** [Case 01](../Cases/case-01-web-compromise.md)

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

1. Locate the uploaded file and record its path and hash.
2. Check the web server user and file permissions.
3. Review the upload request in the Apache log and Suricata HTTP event.
4. Check for follow-on requests to the web shell.
5. Collect the file with Velociraptor if available.

## Evidence

- Attack: `../../02-Attack-Simulation/Attack-Screenshots/stage-05/`
- Alert: `../../02-Attack-Simulation/alert-screenshots/stage-05/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| File | `shell.php` | Web shell (verify path) |
| Hash | TBD | Web shell SHA-256 |
| IP | `192.168.232.135` | Kali attacker |

## Detection assessment

Status: Not tested
Gap ID: DG-05
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Persistence
Technique: Server Web Shell (T1505.003)
