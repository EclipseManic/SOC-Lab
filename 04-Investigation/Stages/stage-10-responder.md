# Investigation — Stage 10 — Responder Poisoning

> **Status:** Draft
> **Attack stage:** [Stage 10](../../02-Attack-Simulation/Stages/stage-10-responder.md)
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

1. Identify the poisoned protocol (LLMNR, NBT-NS, or mDNS).
2. Find the victim host and captured username.
3. Confirm the pivot host and interface (DVWA, `192.168.56.30`); same-subnet poisoning is not visible to Suricata.
4. Check for SMB relay or authentication attempts.
5. Correlate with the NTLMv2 cracking stage.

## Evidence

- Attack: `../../02-Attack-Simulation/Attack-Screenshots/stage-10/`
- Alert: `../../02-Attack-Simulation/alert-screenshots/stage-10/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| IP | `192.168.56.30` | DVWA pivot / Responder host |
| User | TBD | Victim account |
| Hash type | NTLMv2 | Captured challenge-response |

## Detection assessment

Status: Not tested
Gap ID: DG-10
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Credential Access
Technique: LLMNR/NBT-NS Poisoning and SMB Relay (T1557.001)
