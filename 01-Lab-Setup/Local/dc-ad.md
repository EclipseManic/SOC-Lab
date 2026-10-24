# Domain Controller — Active Directory

| Property | Value |
|----------|-------|
| **OS** | Windows Server 2022 Standard, Build 20348.587 |
| **Role** | Domain Controller · DNS Server |
| **Hostname** | `PC-DC` |
| **FQDN** | `PC-DC.ad.lab` |
| **Address** | `192.168.56.10/24` |
| **Default gateway** | `192.168.56.150` |
| **Domain** | `ad.lab` |
| **Roles** | AD DS, DNS |
| **Resources** | 2 vCPU · 4 GB RAM |
| **Wazuh agent** | `DomainWin10` |
| **Velociraptor** | Client v0.77.1 |

## Windows Defender

**Disabled** — intentionally turned off to allow attack tools to execute during simulation stages without endpoint interference.

## WinRM

**Enabled** with Kerberos authentication — used for remote management and lateral movement scenarios.

## BadBlood AD Population

The domain was populated with [BadBlood](https://github.com/davidprowe/BadBlood) to create a realistic Active Directory environment:

| Object Type | Count |
|-------------|-------|
| Users | 2,493 |
| Groups | 546 |
| Computer objects | 101 |

This scale provides realistic BloodHound enumeration results and attack path discovery during Stage 12.

## Key Domain Objects Used in the Attack

| Object | Type | Details | Stage |
|--------|------|---------|-------|
| `HANK_SHERMAN` | Domain Admin + Service Account | SPN: `CIFS/AWSWAPPS1000000`, Password: `Password123`, PasswordNeverExpires: True | 13 (Kerberoasting) |
| `Administrator` | Domain Admin | High-value credential target | 14 (DCSync) |
| `backdoor` | Domain Account | Created for persistence (added to Domain Admins) | 17 (DC Persistence) |

> [!WARNING]
> `HANK_SHERMAN` is a service account with a Domain Admin group membership **and** a weak password — the exact combination that makes Kerberoasting devastating. This is a deliberate misconfiguration created by BadBlood.

## Sysmon 15.20

Sysmon is configured with **sysmon-modular** (Olaf Hartong's modular Sysmon config), identical to the Win10 workstation.
Captures process creation, network connections, file creation, registry modifications, WMI activity, and DNS queries.

## Advanced Audit Policies

```powershell
auditpol /get /category:*
# Key policies enabled:
# Account Logon → Kerberos Authentication Service: Success, Failure
# Account Logon → Kerberos Service Ticket Operations: Success, Failure
# Account Logon → Credential Validation: Success, Failure
# DS Access → Directory Service Access: Success, Failure
# DS Access → Directory Service Changes: Success, Failure
# Account Management → User Account Management: Success, Failure
# Account Management → Security Group Management: Success, Failure
# Logon/Logoff → Logon: Success, Failure
# Detailed Tracking → Process Creation: Success
```

> [!IMPORTANT]
> These audit policies are the **primary detection source** for Stages 13–17:
> - **Stage 13 (Kerberoasting):** Kerberos Service Ticket Operations logs TGS requests for SPNs with RC4 encryption
> - **Stage 14 (DCSync):** Directory Service Access logs replication requests from non-DC sources
> - **Stage 16 (Golden Ticket):** Kerberos Authentication Service detects forged TGTs
> - **Stage 17 (DC Persistence):** User Account Management and Security Group Management log the `backdoor` account creation and Domain Admins group modification

## Telemetry Sources

| Source | What it captures |
|--------|-----------------|
| Windows Security log | Kerberos events, logon/logoff, account management, process creation |
| Directory Service log | AD replication, object access, LDAP queries |
| DNS Server log | DNS resolution for domain-joined hosts |
| Sysmon | Process tree, network connections, file/registry changes |
| Wazuh agent (`DomainWin10`) | Aggregated host alerts shipped to manager |
| Velociraptor client | On-demand forensic collection |

## Related Documentation

- [Stage 12 — BloodHound Enumeration](../../02-Attack-Simulation/stage-12/README.md)
- [Stage 13 — Kerberoasting](../../02-Attack-Simulation/stage-13/README.md)
- [Stage 14 — DCSync](../../02-Attack-Simulation/stage-14/README.md)
- [Stage 16 — Golden Ticket](../../02-Attack-Simulation/stage-16/README.md)
- [Stage 17 — DC Persistence](../../02-Attack-Simulation/stage-17/README.md)
- [Detection Engineering — Sysmon Baseline](../../03-Detection-Engineering/Sysmon/README.md)
- [Detection Engineering — Wazuh Rules](../../03-Detection-Engineering/Wazuh/README.md)
