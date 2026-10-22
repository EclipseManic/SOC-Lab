# Investigation — Stage 11 — NTLMv2 Cracking

> **Status:** Draft
> **Attack stage:** [Stage 11](../../Attack-Simulation/Stages/stage-11-ntlmv2-crack.md)
> **TheHive case:** [Case 02](../Cases/case-02-lateral-movement.md)

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

1. Confirm the captured hash type and source host.
2. Check whether the recovered credential was used.
3. Identify the account and its privileges.
4. Record whether cracking is observable in the lab telemetry.

## Evidence

- Attack: `../../Attack-Simulation/Attack-Screenshots/stage-11/`
- Alert: `../../Attack-Simulation/alert-screenshots/stage-11/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| User | TBD | Cracked account |
| Hash | TBD | NTLMv2 hash (redact value) |

## Detection assessment

Status: Not tested
Gap ID: DG-11
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Credential Access
Technique: Password Cracking (T1110.002)
