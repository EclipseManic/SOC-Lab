# Windows 10 — Workstation Target

## Role

The Windows 10 host is a domain-joined workstation. It is the target for credential access, lateral movement, collection, and impact.

## Configuration

| Item | Value |
|---|---|
| OS | Windows 10 (`TBD` edition/version) |
| Address | `192.168.56.20/24` |
| Default gateway | `192.168.56.150` (Suricata `eth1`) |
| NICs | Single NIC on `192.168.56.0/24` |
| Domain | `ad.lab` |
| Wazuh agent | Installed and enrolled; manager reached through the tunnel |
| Sysmon | `TBD` — document if deployed |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Domain context

| Item | Value |
|---|---|
| Domain | `ad.lab` |
| Domain Controller | `PC-DC.ad.lab` / `192.168.56.10` |
| Logged-in users | `TBD` |
| Local administrators | `TBD` |

## Network path

| Destination | Path |
|---|---|
| DC, DVWA (`192.168.56.0/24`) | Direct, same subnet — no router hop |
| Kali (`192.168.232.0/24`) | Via `192.168.56.150` |
| Wazuh manager (`10.122.0.0/16`) | Via `192.168.56.150` → `wg0` → hub → peering |

Host-to-host traffic to the DC and DVWA does not cross Suricata. Stages that stay inside the subnet — credential access, lateral movement, collection — must be detected from Windows event logs, Sysmon (if deployed), and Wazuh rules. Do not record them as network detections.

## Telemetry

- Windows Security event log
- System and Application logs
- PowerShell operational log (if enabled)
- Sysmon (if deployed)
- Wazuh agent alerts
- SMB and authentication traffic visible to Suricata only when it leaves the subnet

## Intentional weaknesses

- Weak local or domain credentials
- SMB signing not enforced (verify)
- LLMNR/NBT-NS enabled (needed for Responder, which runs from the DVWA pivot on the same subnet)
- Unpatched software (document the exact gap)
- Local administrator reuse (document)

## Evidence

- [ ] Domain join confirmation
- [ ] Wazuh agent status with manager address
- [ ] Relevant audit policy
- [ ] Clean snapshot confirmation

## Related documents

- [Attack stage 10 — Responder](../../Attack-Simulation/Stages/stage-10-responder.md)
- [Attack stage 15 — Pass-the-Hash](../../Attack-Simulation/Stages/stage-15-pass-the-hash.md)
- [Attack stage 18 — Collection](../../Attack-Simulation/Stages/stage-18-collection.md)
