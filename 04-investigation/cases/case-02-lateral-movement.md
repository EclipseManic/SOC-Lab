# Case 02 — Lateral Movement and Credential Access

> **Status:** Draft
> **TheHive case ID:** TBD
> **Severity:** TBD
> **TLP / PAP:** TBD

## Summary

TBD — describe how the attacker moved from the web host into the domain, which credentials were captured, and which hosts were reached.

## Scope

| Stage | Attack | Investigation |
|---|---|---|
| 08 | [SSH persistence](../../02-attack-simulation/stages/stage-08-ssh-persistence.md) | [stage-08](../stages/stage-08-ssh-persistence.md) |
| 09 | [Internal discovery](../../02-attack-simulation/stages/stage-09-internal-discovery.md) | [stage-09](../stages/stage-09-internal-discovery.md) |
| 10 | [Responder poisoning](../../02-attack-simulation/stages/stage-10-responder.md) | [stage-10](../stages/stage-10-responder.md) |
| 11 | [NTLMv2 cracking](../../02-attack-simulation/stages/stage-11-ntlmv2-crack.md) | [stage-11](../stages/stage-11-ntlmv2-crack.md) |
| 12 | [BloodHound enumeration](../../02-attack-simulation/stages/stage-12-bloodhound.md) | [stage-12](../stages/stage-12-bloodhound.md) |
| 13 | [Kerberoasting](../../02-attack-simulation/stages/stage-13-kerberoasting.md) | [stage-13](../stages/stage-13-kerberoasting.md) |
| 14 | [DCSync](../../02-attack-simulation/stages/stage-14-dcsync.md) | [stage-14](../stages/stage-14-dcsync.md) |

## Detection sources

| Source | What it contributed |
|---|---|
| Suricata | SMB, LDAP, Kerberos, DRSUAPI visibility |
| Wazuh | Windows security events and Linux auth |
| TheHive | Case/task tracking |
| Velociraptor | Process, network, and persistence artifacts |

## Timeline

| Time | Event | Source | Evidence |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Observables

| Type | Value | Context |
|---|---|---|
| User | `HANK_SHERMAN` | Kerberoasting target (verify) |
| User | TBD | Account captured via Responder |
| Host | `PC-DC.ad.lab` | Domain Controller |
| Domain | `ad.lab` | Lab domain |
| Hash | TBD | NTLMv2 or service ticket (redact value) |

## Tasks

- [ ] Identify Responder poisoning in network logs
- [ ] Review SMB and authentication anomalies
- [ ] Review LDAP query volume from BloodHound
- [ ] Confirm Kerberoasting from TGS requests
- [ ] Verify DCSync via DRSUAPI traffic
- [ ] Identify the accounts and hosts involved
- [ ] Collect Velociraptor artifacts from the pivot host
- [ ] Write the case summary

## Findings

TBD

## Detection performance

| Metric | Value |
|---|---|
| Stages with a verified alert | TBD / 7 |
| First alert | TBD |
| Mean time to detect | TBD |
| Gaps | TBD |

## Verdict

TBD

## Lessons

TBD
