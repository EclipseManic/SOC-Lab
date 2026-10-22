# Investigation — Stage 06 — Reverse Shell

> **Status:** Draft
> **Attack stage:** [Stage 06](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md)
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

1. Identify the outbound connection and destination port.
2. Find the parent and child processes on DVWA.
3. Confirm the shell user and working directory.
4. Check for command execution and file changes.
5. Collect process, network, and file artifacts with Velociraptor.

## Evidence

- Attack: `../../02-Attack-Simulation/Attack-Screenshots/stage-06/`
- Alert: `../../02-Attack-Simulation/alert-screenshots/stage-06/`
- Queries and logs: TBD
- Velociraptor: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Kali listener |
| Port | TBD | Reverse shell port |
| Process | TBD | Shell process and parent |

## Detection assessment

Status: Not tested
Gap ID: DG-06
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Execution
Technique: Unix Shell (T1059.004)
