# Investigation — Stage 16 — Golden Ticket

> **Status:** Draft
> **Attack stage:** [Stage 16](../../02-attack-simulation/stages/stage-16-golden-ticket.md)
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

1. Identify anomalous Kerberos ticket lifetimes or encryption types.
2. Review domain controller security events for forged ticket use.
3. Confirm the KRBTGT hash exposure path.
4. Check for access from unexpected hosts or accounts.
5. Correlate with DC persistence and collection.

## Evidence

- Attack: `../../02-attack-simulation/attack-screenshots/stage-16/`
- Alert: `../../02-attack-simulation/alert-screenshots/stage-16/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| Domain SID | TBD | Forged ticket domain |
| User | TBD | Account in the ticket |
| Hash | TBD | KRBTGT (never publish) |

## Detection assessment

Status: Not tested
Gap ID: DG-16
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Credential Access / Persistence
Technique: Golden Ticket (T1558.001)
