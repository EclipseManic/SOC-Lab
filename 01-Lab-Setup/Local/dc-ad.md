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
| `HANK_SHERMAN` | Domain Admin + Service Account | SPN: `CIFS/AWSWAPPS1000000`, Password: `<REDACTED>`, PasswordNeverExpires: True | 13 (Kerberoasting) |
| `Administrator` | Domain Admin | High-value credential target | 14 (DCSync) |
| `backdoor` | Domain Account | Created for persistence (added to Domain Admins) | 17 (DC Persistence) |

> [!WARNING]
> `HANK_SHERMAN` is a service account with a Domain Admin group membership **and** a weak password — the exact combination that makes Kerberoasting devastating. This is a deliberate misconfiguration created by BadBlood.

## Sysmon 15.20

Sysmon is deployed using the tailored 90-line baseline ([`sysmonconfig.xml`](../../03-Detection-Engineering/Sysmon/sysmonconfig.xml)), identical across all Windows targets:
- **Process Creation (Event ID 1):** Tracks parent `WmiPrvSE.exe` and `cmd.exe /Q /c` with `\ADMIN$\__` output redirection, alongside 13 LOLBins (`net.exe`, `nltest.exe`, `whoami.exe`, `certutil.exe`, `reg.exe`, `dsquery.exe`, etc.).
- **Network Connections (Event ID 3):** Monitors connection attempts across ports 445 (SMB), 135 (RPC), 389/636 (LDAP), 5985/5986 (WinRM), and 88 (Kerberos).
- **File Creation (Event ID 11):** Monitors executable and script drops in staging folders (`C:\Users\Public\`, `\Temp\`).
- **Registry Modifications (Event ID 12/13):** Audits persistence keys (`Run`, `RunOnce`, `Winlogon`, `Services`, `IFEO`).
- **Named Pipes (Event ID 17/18):** Audits connections to pipes `spoolss`, `atsvc`, and `svcctl`.

> [!NOTE]
> **Impacket `wmiexec` Telemetry Reality:** Impacket executes remote commands over WMI/DCOM via `Win32_Process.Create` and redirects standard output to a temporary file on the `ADMIN$` share (`\\127.0.0.1\ADMIN$\__<timestamp>`). It does **not** create a named pipe. Detection is provided by Sysmon Event ID 1 (`WmiPrvSE.exe` -> `cmd.exe /Q /c ... \ADMIN$\__`) mapped to Wazuh Rule `100613`.

### Verification Commands

```powershell
# 1. Verify Sysmon service health and configuration schema
Get-Service Sysmon64
sysmon64 -c

# 2. Query recent Kerberos ticket events (Event ID 4769)
Get-WinEvent -LogName "Security" -MaxEvents 5 | Where-Object { $_.Id -eq 4769 } | Format-List TimeCreated, Message

# 3. Verify Wazuh agent connection status
& "C:\Program Files (x86)\ossec-agent\wazuh-agent.exe" status
```

## Advanced Audit Policies

```powershell
auditpol /get /category:*
# Key policies enabled:
# Account Logon → Kerberos Authentication Service: Success, Failure
# Account Logon → Kerberos Service Ticket Operations: Success, Failure
# Account Logon → Credential Validation: Success, Failure
# Account Management → User Account Management: Success, Failure (EID 4720/4726)
# Account Management → Security Group Management: Success, Failure (EID 4728)
# Privilege Use → Sensitive Privilege Use: Success, Failure (EID 4672)
# DS Access → Directory Service Access: Success, Failure (EID 4662)
```

> [!NOTE]
> For granular LDAP query logging (Event ID 1644, relevant to BloodHound enumeration in Stage 12), the NTDS Diagnostics registry setting `15 Field Engineering` must be configured to level `5` in addition to Directory Service Access auditing.

## Related Documentation

- [Stage 12 — BloodHound Enumeration](../../02-Attack-Simulation/Stages/stage-12-bloodhound.md)
- [Stage 13 — Kerberoasting](../../02-Attack-Simulation/Stages/stage-13-kerberoasting.md)
- [Stage 14 — DCSync](../../02-Attack-Simulation/Stages/stage-14-dcsync.md)
- [Stage 16 — Golden Ticket](../../02-Attack-Simulation/Stages/stage-16-golden-ticket.md)
- [Stage 17 — DC Persistence](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md)
- [Detection Engineering — Sysmon Baseline](../../03-Detection-Engineering/Sysmon/README.md)
- [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md)
