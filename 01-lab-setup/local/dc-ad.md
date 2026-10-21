# Domain Controller — Active Directory

## Role

The Domain Controller is the identity center of the lab. It provides AD DS, DNS, Kerberos, LDAP, and the domain context for credential access, Kerberoasting, DCSync, Golden Ticket, and domain persistence stages.

## Configuration

| Item | Value |
|---|---|
| OS | Windows Server 2022 |
| Address | `192.168.56.10/24` |
| Default gateway | `192.168.56.150` (Suricata `eth1`) |
| NICs | Single NIC on `192.168.56.0/24` |
| Hostname | `PC-DC.ad.lab` |
| Domain | `ad.lab` |
| Roles | AD DS, DNS |
| Wazuh agent | Installed and enrolled; manager reached through the tunnel |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Network path

| Destination | Path |
|---|---|
| Windows 10, DVWA (`192.168.56.0/24`) | Direct, same subnet — no router hop |
| Kali (`192.168.232.0/24`) | Via `192.168.56.150` |
| Wazuh manager (`10.122.0.0/16`) | Via `192.168.56.150` → `wg0` → hub → peering |

The agent's configured manager address is the Wazuh VM's private VNet address, resolved through the gateway. `10.122.0.0/16` must never be reachable except through the hub; the DC has no route to it other than the default gateway.

## Domain objects used in the lab

| Object | Type | Purpose |
|---|---|---|
| `Administrator` | Domain admin | High-value credential |
| `HANK_SHERMAN` | Service account | Kerberoasting target |
| `backdoor` | Domain account | Persistence evidence (Stage 17) |
| `Domain Admins` | Group | Privilege target |
| `TBD` | `TBD` | Add the remaining users, groups, and service accounts |

Do not publish real password hashes. Reference them by stage and redact the values in screenshots.

## Audit policy

Enable and document:

- Logon and logoff events
- Account management
- Directory service access
- Kerberos service ticket operations
- Process creation (if available)
- PowerShell script block logging (if available)

Audit policy is the primary detection source for stages 13–17. Suricata sees the LDAP, Kerberos, SMB, and DRSUAPI conversations between the DC and other hosts, but it cannot see the DC's own account changes, ticket requests handled locally, or directory replication internals.

## Telemetry

- Windows Security event log
- Directory Service log
- DNS Server log
- Wazuh agent alerts
- Suricata LDAP, Kerberos, SMB, and DRSUAPI traffic (network view only)

## Intentional weaknesses

- Kerberoastable service account
- Weak service account password
- Reversible encryption or weak policy (verify)
- SMB signing not enforced (verify)
- Domain admin credentials exposed during the campaign

## Evidence

- [ ] Domain and forest information
- [ ] User and group inventory (redacted)
- [ ] Audit policy configuration
- [ ] Wazuh agent status with manager address
- [ ] Clean snapshot confirmation

## Related documents

- [Attack stage 13 — Kerberoasting](../../02-attack-simulation/stages/stage-13-kerberoasting.md)
- [Attack stage 14 — DCSync](../../02-attack-simulation/stages/stage-14-dcsync.md)
- [Attack stage 16 — Golden Ticket](../../02-attack-simulation/stages/stage-16-golden-ticket.md)
