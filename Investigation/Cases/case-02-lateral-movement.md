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
| 08 | [SSH persistence](../../Attack-Simulation/Stages/stage-08-ssh-persistence.md) | [stage-08](../Stages/stage-08-ssh-persistence.md) |
| 09 | [Internal discovery](../../Attack-Simulation/Stages/stage-09-internal-discovery.md) | [stage-09](../Stages/stage-09-internal-discovery.md) |
| 10 | [Responder poisoning](../../Attack-Simulation/Stages/stage-10-responder.md) | [stage-10](../Stages/stage-10-responder.md) |
| 11 | [NTLMv2 cracking](../../Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | [stage-11](../Stages/stage-11-ntlmv2-crack.md) |
| 12 | [BloodHound enumeration](../../Attack-Simulation/Stages/stage-12-bloodhound.md) | [stage-12](../Stages/stage-12-bloodhound.md) |
| 13 | [Kerberoasting](../../Attack-Simulation/Stages/stage-13-kerberoasting.md) | [stage-13](../Stages/stage-13-kerberoasting.md) |
| 14 | [DCSync](../../Attack-Simulation/Stages/stage-14-dcsync.md) | [stage-14](../Stages/stage-14-dcsync.md) |

## Detection sources

| Source | What it contributed |
|---|---|
| Suricata | SSH only when it crosses the gateway; no visibility into victim-to-victim SMB, LDAP, Kerberos, or DRSUAPI |
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

- [ ] Identify Responder poisoning in host and auth telemetry (same-subnet traffic is not visible to Suricata)
- [ ] Review SMB and authentication anomalies in Windows event logs
- [ ] Review directory-service logs for LDAP query volume from BloodHound
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
