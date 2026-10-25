# Windows 10 — Domain-Joined Workstation Target

| Property | Value |
|----------|-------|
| **OS** | Windows 10 Pro N, Build 19045.6216 |
| **Role** | Domain-joined workstation target |
| **Hostname** | `Win10Workstation` / `win10` |
| **Address** | `192.168.56.20/24` |
| **Default gateway** | `192.168.56.150` |
| **Primary DNS** | `192.168.56.10` (`PC-DC.ad.lab`) |
| **Domain** | `ad.lab` |
| **Domain User Account** | `ad\victim` (Standard Domain User) |
| **Local Account** | `win10` / `<REDACTED>` |
| **Resources** | 2 vCPU · 4 GB RAM |
| **Wazuh agent** | `Win10User` |
| **Velociraptor** | Client v0.77.1 |

---

## 1. Network Configuration & Domain Joining

Win10 operates inside the isolated victim network (`192.168.56.0/24`, VMware VMnet2) with default routing directed through the Security Gateway (`192.168.56.150`) and DNS resolution pointed directly to the Domain Controller (`192.168.56.10`).

### Static Network Configuration

```powershell
# Assign static IP, subnet mask, default gateway, and DNS server
New-NetIPAddress -InterfaceAlias "Ethernet0" -IPAddress "192.168.56.20" -PrefixLength 24 -DefaultGateway "192.168.56.150"
Set-DnsClientServerAddress -InterfaceAlias "Ethernet0" -ServerAddresses ("192.168.56.10")

# Flush and verify DNS resolution against the domain controller
Clear-DnsClientCache
Resolve-DnsName -Name "ad.lab" -Server 192.168.56.10
```

### Joining the Active Directory Domain (`ad.lab`)

```powershell
# Join the machine to ad.lab using Domain Administrator credentials
$cred = Get-Credential -UserName "ad\Administrator" -Message "Enter Domain Admin Password"
Add-Computer -DomainName "ad.lab" -Credential $cred -Restart -Force
```

---

## 2. Windows Defender & Security Policy Adjustments

To evaluate host-level telemetry and simulate an enterprise environment where endpoint security controls have been bypassed or configured in audit-only mode, Windows Defender real-time blocking is disabled:

```powershell
# Disable Defender real-time, behavioral, and cloud monitoring
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableBehaviorMonitoring $true
Set-MpPreference -DisableIOAVProtection $true
Set-MpPreference -MAPSReporting 0

# Verify Defender status
Get-MpComputerStatus | Select-Object RealTimeProtectionEnabled, AntivirusEnabled
```

---

## 3. LLMNR & NetBIOS Name Resolution Configuration

Link-Local Multicast Name Resolution (LLMNR) and NetBIOS over TCP/IP (NBT-NS) are intentionally kept active. In enterprise environments, legacy name resolution protocols remain active by default, broadcasting queries across the local subnet whenever a hostname cannot be resolved via DNS.

In [Stage 10 — Responder Poisoning](../../02-Attack-Simulation/Stages/stage-10-responder.md), Win10 generates broadcast queries on `224.0.0.252:5355/UDP` (LLMNR) and `192.168.56.255:137/UDP` (NetBIOS), which Responder intercepts on the DVWA pivot host to capture NTLMv2 password challenge-response hashes.

```powershell
# 1. Ensure LLMNR multicast resolution is enabled (0 = Disabled, 1 = Enabled)
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient" /v "EnableMulticast" /t REG_DWORD /d 1 /f

# 2. Ensure NetBIOS over TCP/IP is enabled on the primary network adapter (1 = Enabled)
$adapters = Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true }
foreach ($adapter in $adapters) {
    $adapter.SetTcpipNetbios(1) | Out-Null
}

# 3. Verify NetBIOS status across active network interfaces
Get-WmiObject -Class Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object Description, TcpipNetbiosOptions
```

---

## 4. Sysmon v15.20 Deployment & Event Filtering

Sysmon is installed using the project's tailored 90-line telemetry baseline ([`sysmonconfig.xml`](../../03-Detection-Engineering/Sysmon/sysmonconfig.xml), schema version `4.90`, SHA256/MD5 hashing). This baseline captures critical post-exploitation and lateral movement indicators without saturating memory or disk I/O on a 4 GB RAM virtual machine:

```powershell
# Download and install Sysmon 64-bit with the production XML configuration
.\Sysmon64.exe -i sysmonconfig.xml -accepteula

# Verify Sysmon operational status and active configuration schema
Get-Service Sysmon64
.\Sysmon64.exe -c
```

### Monitored Event Channels & Event IDs

| Event ID | Event Name | Filtering Strategy & Detection Purpose |
|:---:|---|---|
| **EID 1** | **Process Creation** | Explicitly audits 13 command interpreters and LOLBins (`cmd.exe`, `powershell.exe`, `pwsh.exe`, `whoami.exe`, `net.exe`, `net1.exe`, `nltest.exe`, `dsquery.exe`, `klist.exe`, `reg.exe`, `schtasks.exe`, `certutil.exe`, `rundll32.exe`). Tracks parent process `WmiPrvSE.exe` spawning child processes, and command lines matching `\ADMIN$\__`. Captures Impacket `wmiexec` fan-out in Stage 15, 17, 18, and 20. |
| **EID 3** | **Network Connection** | Audits inbound and outbound connections on critical lateral movement ports: `445/TCP` (SMB), `135/TCP` (RPC), `389/TCP` & `636/TCP` (LDAP/S), `5985/TCP` & `5986/TCP` (WinRM), and `88/TCP` (Kerberos). |
| **EID 11** | **File Creation** | Monitors script, executable, and image file creation (`.exe`, `.ps1`, `.bat`, `.vbs`, `.bmp`) in high-risk staging directories (`C:\Users\Public\` and `C:\Windows\Temp\`). Tracks wallpaper staging during Stage 20 Impact. |
| **EID 12 / 13** | **Registry Modification** | Audits persistence keys (`CurrentVersion\Run`, `RunOnce`, `Winlogon`, `Services`, `IFEO`) and wallpaper defacement keys (`Control Panel\Desktop\Wallpaper`). |
| **EID 17 / 18** | **Named Pipes** | Audits connection to high-value administrative RPC pipes (`spoolss`, `atsvc`, `svcctl`). |

> [!NOTE]
> **Impacket `wmiexec` Telemetry Reality:** Impacket's `wmiexec.py` executes commands remotely by invoking the WMI `Win32_Process.Create` method over DCOM/RPC (`135/TCP` + ephemeral ports). The WMI service host (`WmiPrvSE.exe`) executes `cmd.exe /Q /c <command> &> \\127.0.0.1\ADMIN$\__<timestamp> 2>&1` and transfers output back over SMB (`445/TCP`). Impacket does **not** create a named pipe. Detection is reliably achieved through Sysmon Event ID 1 (parent `WmiPrvSE.exe` spawning `cmd.exe` with `\ADMIN$\__` redirection), mapped to Wazuh Rule `100613`.

> [!TIP]
> High-volume events such as Image Load (EID 7), CreateRemoteThread (EID 8), and raw DNS queries (EID 22) are deliberately excluded in `sysmonconfig.xml` to prevent log volume bloat and preserve hypervisor performance.

---

## 5. Advanced Windows Audit Policies & Registry Logging

### Command-Line Audit Policy Configuration

The Windows Advanced Audit Policy subcategories are explicitly configured via `auditpol.exe` to record process creation, user authentication, and resource access:

```cmd
:: Enable Success and Failure auditing for Process Creation
auditpol /set /subcategory:"Process Creation" /success:enable /failure:enable

:: Enable Success and Failure auditing for Logon and Special Logon (EID 4624, 4672)
auditpol /set /subcategory:"Logon" /success:enable /failure:enable
auditpol /set /subcategory:"Special Logon" /success:enable /failure:enable

:: Enable File System and Registry Auditing (EID 4663)
auditpol /set /subcategory:"File System" /success:enable /failure:enable
auditpol /set /subcategory:"Registry" /success:enable /failure:enable
```

### Process Command-Line Auditing (EID 4688)

By default, Windows Security Event ID 4688 records process execution but truncates the command-line arguments. To provide complete arguments for SOC triage and sigma rules, command-line auditing is enforced via the registry:

```powershell
# Enable full command-line inclusion in process creation events
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v "ProcessCreationIncludeCmdLine_Enabled" /t REG_DWORD /d 1 /f

# Verify registry configuration
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled
```

### PowerShell ScriptBlock & Module Logging

PowerShell ScriptBlock Logging captures the complete code block executed by any PowerShell instance, even when obfuscated, base64-encoded, or launched via reflection:

```powershell
# Enable PowerShell ScriptBlock Logging (EID 4104)
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging /t REG_DWORD /d 1 /f

# Enable PowerShell Module Logging (EID 4103)
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging" /v EnableModuleLogging /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging\ModuleNames" /v * /t REG_SZ /d * /f
```

---

## 6. Wazuh Agent Enrollment & Configuration

The Windows Wazuh Agent is deployed to stream all configured event logs to the cloud Wazuh Manager:

```cmd
:: Install Wazuh Agent with Manager IP (10.122.1.4) and Agent Name (Win10User)
msiexec /i wazuh-agent-4.14.8.msi /q WAZUH_MANAGER="10.122.1.4" WAZUH_REGISTRATION_SERVER="10.122.1.4" WAZUH_AGENT_NAME="Win10User"

:: Start and configure Wazuh agent service
net start Wazuh
sc config Wazuh start= auto
```

### Agent Configuration (`C:\Program Files (x86)\ossec-agent\ossec.conf`)

The agent is configured to ingest Windows Event Channels via native eventchannel listeners:

```xml
<ossec_config>
  <client>
    <server>
      <address>10.122.1.4</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
  </client>

  <!-- Windows Security Event Channel (Logon 4624, Process 4688) -->
  <localfile>
    <location>Security</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- Windows System Event Channel -->
  <localfile>
    <location>System</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- Microsoft Sysmon Operational Channel (EID 1, 3, 11, 12, 13, 17, 18) -->
  <localfile>
    <location>Microsoft-Windows-Sysmon/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- PowerShell Operational Channel (ScriptBlock 4104, Module 4103) -->
  <localfile>
    <location>Microsoft-Windows-PowerShell/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>
</ossec_config>
```

---

## 7. Velociraptor DFIR Client Installation

The Velociraptor Windows client is installed as a background Windows service connecting back to the cloud Velociraptor server (`https://velo.lab:8000` on `10.122.0.4`):

```cmd
:: Install Velociraptor client service using generated client configuration
velociraptor-v0.77.1-windows-amd64.exe --config client.config.yaml service install

:: Verify Velociraptor service health
sc query Velociraptor
```

---

## 8. Verification & Diagnostics Commands

```powershell
# 1. Verify Sysmon service health and configuration schema
Get-Service Sysmon64
.\Sysmon64.exe -c

# 2. Inspect recently captured Sysmon process creation events
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 5 | Where-Object { $_.Id -eq 1 } | Format-List TimeCreated, Message

# 3. Verify Wazuh agent connection status to cloud manager (10.122.1.4:1514)
Test-NetConnection -ComputerName 10.122.1.4 -Port 1514
& "C:\Program Files (x86)\ossec-agent\wazuh-agent.exe" status

# 4. Confirm Logon Type 3 NTLM events in Security log (Pass-the-Hash detection baseline)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 5 | Where-Object { $_.Properties[8].Value -eq 3 } | Format-List TimeCreated, Message

# 5. Verify PowerShell ScriptBlock Logging in event log
Get-WinEvent -LogName "Microsoft-Windows-PowerShell/Operational" -MaxEvents 5 | Where-Object { $_.Id -eq 4104 } | Format-List TimeCreated, Message
```

---

## 9. Telemetry Sources Summary

| Source | Event IDs / Logs | What it captures |
|--------|------------------|-----------------|
| **Windows Security Log** | `4624`, `4625`, `4672`, `4688` | Logon events (Type 3 NTLM lateral movement), administrative privileges, process creation |
| **Sysmon Operational** | `1`, `3`, `11`, `12`, `13`, `17`, `18` | Process execution trees (`WmiPrvSE.exe` spawning `cmd.exe`), network connections, file/wallpaper staging, named pipes |
| **PowerShell Operational** | `4103`, `4104` | Deobfuscated ScriptBlock execution, interactive shell scripts, pipeline execution |
| **Wazuh Agent (`Win10User`)** | TCP `1514` | Real-time event forwarding to cloud Wazuh Manager (`10.122.1.4`) |
| **Velociraptor Client** | TCP `8000` via WireGuard | Live digital forensics, endpoint artifact collection, MFT inspection, memory triage |

---

## Related Documentation

- [Stage 10 — Responder Poisoning](../../02-Attack-Simulation/Stages/stage-10-responder.md)
- [Stage 15 — Pass-the-Hash](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md)
- [Stage 18 — Internal Collection](../../02-Attack-Simulation/Stages/stage-18-collection.md)
- [Stage 20 — Impact & Defacement](../../02-Attack-Simulation/Stages/stage-20-impact.md)
- [Detection Engineering — Sysmon Baseline](../../03-Detection-Engineering/Sysmon/README.md)
- [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md)
