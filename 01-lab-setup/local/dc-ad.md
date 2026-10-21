# Domain Controller — Active Directory

## Role

The Domain Controller is the identity center of the lab. It provides AD DS, DNS, Kerberos, LDAP, and the domain context for credential access, Kerberoasting, DCSync, Golden Ticket, and domain persistence stages.

## Configuration

| Item | Value |
|---|---|
| Operating system | Windows Server (`TBD` version) |
| IP address | `192.168.56.10` |
| Hostname | `PC-DC.ad.lab` |
| Domain | `ad.lab` |
| Roles | AD DS, DNS |
| Wazuh agent | Installed and enrolled |
| Resources | `TBD` vCPU / `TBD` GB RAM |

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

## Telemetry

- Windows Security event log
- Directory Service log
- DNS Server log
- Wazuh agent alerts
- Suricata LDAP, Kerberos, SMB, and DRSUAPI traffic

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
- [ ] Wazuh agent status
- [ ] Clean snapshot confirmation

## Related documents

- [Attack stage 13 — Kerberoasting](../../02-attack-simulation/stages/stage-13-kerberoasting.md)
- [Attack stage 14 — DCSync](../../02-attack-simulation/stages/stage-14-dcsync.md)
- [Attack stage 16 — Golden Ticket](../../02-attack-simulation/stages/stage-16-golden-ticket.md)
