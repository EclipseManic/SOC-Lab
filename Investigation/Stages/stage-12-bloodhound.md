# Investigation — Stage 12 — BloodHound Enumeration

> **Status:** Draft
> **Attack stage:** [Stage 12](../../Attack-Simulation/Stages/stage-12-bloodhound.md)
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

1. Identify the collection host and LDAP query volume.
2. Review directory service events for unusual enumeration.
3. Check the account used for collection.
4. Review the BloodHound output for identified paths.
5. Correlate with Kerberoasting and DCSync.

## Evidence

- Attack: `../../Attack-Simulation/Attack-Screenshots/stage-12/`
- Alert: `../../Attack-Simulation/alert-screenshots/stage-12/`
- Queries and logs: TBD

## IOCs

| Type | Value | Context |
|---|---|---|
| IP | TBD | Collection source |
| User | TBD | Account used for LDAP queries |
| Domain | `ad.lab` | Enumerated domain |

## Detection assessment

Status: Not tested
Gap ID: DG-12
Recommended rule: TBD

## Verdict

TBD

## MITRE ATT&CK

Tactic: Discovery
Technique: Domain Account (T1087.002)
