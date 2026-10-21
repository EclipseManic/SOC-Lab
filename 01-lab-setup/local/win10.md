# Windows 10 — Workstation Target

## Role

The Windows 10 host is a domain-joined workstation. It is the target for credential access, lateral movement, collection, and impact.

## Configuration

| Item | Value |
|---|---|
| Operating system | Windows 10 (`TBD` edition/version) |
| IP address | `192.168.56.20` |
| Domain | `ad.lab` |
| Wazuh agent | Installed and enrolled |
| Sysmon | `TBD` — document if deployed |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Domain context

| Item | Value |
|---|---|
| Domain | `ad.lab` |
| Domain Controller | `PC-DC.ad.lab` / `192.168.56.10` |
| Logged-in users | `TBD` |
| Local administrators | `TBD` |

## Telemetry

- Windows Security event log
- System and Application logs
- PowerShell operational log (if enabled)
- Sysmon (if deployed)
- Wazuh agent alerts
- SMB and authentication traffic visible to Suricata

## Intentional weaknesses

- Weak local or domain credentials
- SMB signing not enforced (verify)
- LLMNR/NBT-NS enabled (needed for Responder)
- Unpatched software (document the exact gap)
- Local administrator reuse (document)

## Evidence

- [ ] Domain join confirmation
- [ ] Wazuh agent status
- [ ] Relevant audit policy
- [ ] Clean snapshot confirmation

## Related documents

- [Attack stage 10 — Responder](../../02-attack-simulation/stages/stage-10-responder.md)
- [Attack stage 15 — Pass-the-Hash](../../02-attack-simulation/stages/stage-15-pass-the-hash.md)
- [Attack stage 18 — Collection](../../02-attack-simulation/stages/stage-18-collection.md)
