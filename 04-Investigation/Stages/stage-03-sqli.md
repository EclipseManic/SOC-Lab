# Investigation — Stage 03 — SQL Injection

> **Status:** Draft
> **Attack stage:** [Stage 03](../../02-Attack-Simulation/Stages/stage-03-sqli.md)
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

1. Review the Suricata HTTP alert and request metadata.
2. Check the Apache access log for the injection payload.
3. Correlate the request with the Wazuh alert and TheHive case.
4. Identify the extracted data and any credentials.
5. Record the evidence and update the detection assessment.

## Evidence

- Attack: `../../02-Attack-Simulation/Attack-Screenshots/stage-03/`
- Alert: `../../02-Attack-Simulation/alert-screenshots/stage-03/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Kali attacker (verify) |
| URL | TBD | Vulnerable DVWA endpoint |

## Detection assessment

Status: Not tested
Gap ID: DG-03
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Initial Access
Technique: Exploit Public-Facing Application (T1190)
