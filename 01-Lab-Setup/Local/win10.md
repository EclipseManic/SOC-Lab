# Windows 10 — Domain-Joined Workstation Target

| Property | Value |
|----------|-------|
| **OS** | Windows 10 Pro N, Build 19045.6216 |
| **Role** | Domain-joined workstation target |
| **Address** | `192.168.56.20/24` |
| **Default gateway** | `192.168.56.150` |
| **Domain** | `ad.lab` |
| **Resources** | 2 vCPU · 4 GB RAM |
| **Local account** | `win10` / `<REDACTED>` |
| **Wazuh agent** | `Win10User` |
| **Velociraptor** | Client v0.77.1 |

## Network Position

Win10 sits on the victim subnet (`192.168.56.0/24`) alongside the Domain Controller and DVWA.
Host-to-host traffic between Win10 and DC-AD stays inside the subnet.

> [!IMPORTANT]
> Detection for lateral movement and credential attacks on this host relies primarily on **Wazuh agent + Sysmon** endpoint telemetry, supplemented by gateway promiscuous sniffing where visible.

## Windows Defender

**Disabled** — intentionally turned off to allow adversary tradecraft to execute during simulation stages without artificial AV blocking, mirroring a compromised endpoint where security controls were bypassed or absent.

## LLMNR / NBT-NS

**Enabled** — required for Responder credential capture (Stage 10).
Win10 broadcasts LLMNR and NBT-NS queries for nonexistent hostnames, which Responder poisons to capture NTLMv2 challenge-response hashes.

## Sysmon 15.20

Sysmon is configured with a tailored 90-line telemetry baseline ([`sysmonconfig.xml`](../../03-Detection-Engineering/Sysmon/sysmonconfig.xml)) designed to capture critical post-exploitation events without exhausting VM memory:

- **Process Creation (Event ID 1):** Explicitly tracks 13 LOLBins and execution binaries (`cmd.exe`, `powershell.exe`, `pwsh.exe`, `whoami.exe`, `net.exe`, `net1.exe`, `nltest.exe`, `dsquery.exe`, `klist.exe`, `reg.exe`, `schtasks.exe`, `certutil.exe`, `rundll32.exe`), parent tracking for `WmiPrvSE.exe`, and command lines referencing `\ADMIN$\__`.
- **Network Connections (Event ID 3):** Monitors connection attempts across ports 445 (SMB), 135 (RPC), 389/636 (LDAP), 5985/5986 (WinRM), and 88 (Kerberos).
- **File Creation (Event ID 11):** Monitors executable, script, and image drops (`.exe`, `.ps1`, `.vbs`, `.bmp`) in `C:\Users\Public\` and `\Temp\`.
- **Registry Modifications (Event ID 12/13):** Audits persistence keys (`\CurrentVersion\Run`, `RunOnce`, `Winlogon`, `Services`, `IFEO`, and `Control Panel\Desktop\Wallpaper`).
- **Named Pipes (Event ID 17/18):** Audits connections to pipes `spoolss`, `atsvc`, and `svcctl`.

> [!NOTE]
> **Impacket `wmiexec` Telemetry Reality:** Impacket's `wmiexec.py` executes commands remotely by invoking the WMI `Win32_Process.Create` method over DCOM/RPC (`135/TCP` + ephemeral ports). The WMI service host (`WmiPrvSE.exe`) executes `cmd.exe /Q /c <command> &> \\127.0.0.1\ADMIN$\__<timestamp> 2>&1` and transfers output back over SMB (`445/TCP`). Impacket does **not** create a named pipe. Detection is reliably achieved through Sysmon Event ID 1 (parent `WmiPrvSE.exe` spawning `cmd.exe` with `\ADMIN$\__` redirection), mapped to Wazuh Rule `100613`.

### Verification Commands

```powershell
# 1. Verify Sysmon service health and configuration schema
Get-Service Sysmon64
sysmon64 -c

# 2. Inspect recently captured Sysmon process creation events
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 5 | Where-Object { $_.Id -eq 1 } | Format-List TimeCreated, Message

# 3. Verify Wazuh agent connection status
& "C:\Program Files (x86)\ossec-agent\wazuh-agent.exe" status
```

## Windows Audit Policies

### Process Creation Auditing (EID 4688)

Command-line auditing is enabled so every process creation event includes the full command line — critical for detecting encoded PowerShell, LOLBins, and tool execution.

```powershell
# Process creation auditing verification
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled
# Expected: 0x1
```

### PowerShell Logging

| Policy | Event ID | Purpose |
|--------|----------|---------|
| ScriptBlock Logging | 4104 | Captures full PowerShell script content, including decoded/deobfuscated blocks |
| Module Logging | 4103 | Logs pipeline execution details for loaded modules |

```powershell
# PowerShell ScriptBlock Logging verification
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging
# Expected: 0x1
```

## Telemetry Sources

| Source | What it captures |
|--------|-----------------|
| Windows Security log | Logon events (4624/4625), process creation (4688), account management |
| Sysmon | Process tree, network connections, file/registry changes, named pipes |
| PowerShell logs | Script blocks (4104), module execution (4103) |
| Wazuh agent (`Win10User`) | Aggregated host alerts shipped to cloud manager |
| Velociraptor client | On-demand forensic collection |

## Related Documentation

- [Stage 10 — Responder](../../02-Attack-Simulation/Stages/stage-10-responder.md)
- [Stage 15 — Pass-the-Hash](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md)
- [Stage 18 — Collection](../../02-Attack-Simulation/Stages/stage-18-collection.md)
- [Stage 20 — Impact](../../02-Attack-Simulation/Stages/stage-20-impact.md)
- [Detection Engineering — Sysmon Baseline](../../03-Detection-Engineering/Sysmon/README.md)
- [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md)
