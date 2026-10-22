# Case 01 — Web Application Compromise

> **Status:** Draft
> **TheHive case ID:** TBD
> **Severity:** TBD
> **TLP / PAP:** TBD

## Summary

TBD — describe the initial access, the web exploitation chain, and the pivot to the internal network in three to five sentences.

## Scope

| Stage | Attack | Investigation |
|---|---|---|
| 01 | [Reconnaissance](../../Attack-Simulation/Stages/stage-01-recon.md) | [stage-01](../Stages/stage-01-recon.md) |
| 02 | [Brute force](../../Attack-Simulation/Stages/stage-02-bruteforce.md) | [stage-02](../Stages/stage-02-bruteforce.md) |
| 03 | [SQL injection](../../Attack-Simulation/Stages/stage-03-sqli.md) | [stage-03](../Stages/stage-03-sqli.md) |
| 04 | [Hash cracking](../../Attack-Simulation/Stages/stage-04-hash-crack.md) | [stage-04](../Stages/stage-04-hash-crack.md) |
| 05 | [Web shell upload](../../Attack-Simulation/Stages/stage-05-webshell.md) | [stage-05](../Stages/stage-05-webshell.md) |
| 06 | [Reverse shell](../../Attack-Simulation/Stages/stage-06-reverse-shell.md) | [stage-06](../Stages/stage-06-reverse-shell.md) |
| 07 | [Privilege escalation](../../Attack-Simulation/Stages/stage-07-privesc.md) | [stage-07](../Stages/stage-07-privesc.md) |

## Detection sources

| Source | What it contributed |
|---|---|
| Suricata | TBD |
| Wazuh | TBD |
| TheHive | TBD |
| Velociraptor | TBD |

## Timeline

| Time | Event | Source | Evidence |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Observables

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Kali attacker |
| File | `shell.php` | Web shell (verify path and hash) |
| User | TBD | Web server user |
| Hash | TBD | Add from Stage 04/05 evidence |

## Tasks

- [ ] Triage the first web alert
- [ ] Review Suricata HTTP and scan alerts
- [ ] Review Apache and PHP logs for the SQL injection
- [ ] Locate the web shell and record its hash
- [ ] Trace the reverse shell connection
- [ ] Confirm privilege escalation
- [ ] Collect Velociraptor process and network artifacts
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
