# Sysmon Telemetry Baseline — Windows Endpoint Auditing

> **Production Configuration & Artifacts:**
> - Modular Configuration: [`sysmonconfig.xml`](sysmonconfig.xml)
> - Target Deployment: Domain Controller (`192.168.56.10`, Server 2022) & Windows 10 Workstation (`192.168.56.20`, Win10 Pro N)
> - Version: Microsoft Sysmon v15.20 (64-bit service `Sysmon64`)
> - Wazuh Ingestion: `Microsoft-Windows-Sysmon/Operational` eventchannel

---

## 1. Overview & Architecture

System Monitor (Sysmon) provides deep endpoint activity tracking on Windows targets. While standard Windows Security Event Logs (`Security.evtx`) record authentication and high-level process launches, Sysmon captures granular execution metadata, including full process command lines, parent-child relationships, hashes (MD5, SHA256, IMPHASH), named pipe activity, and registry value manipulations.

In this lab, Sysmon is deployed using Olaf Hartong's **`sysmon-modular`** baseline, tailored to capture adversary tradecraft across Active Directory and workstation environments.

---

## 2. Event Types & Campaign Coverage

| Event ID | Sysmon Event Name | Focus in Attack Campaign | Validated Stages |
|---|---|---|---|
| **EID 1** | Process Creation | Full command-line arguments, parent process name/PID, process hashes | **15, 17, 18, 20** (Impacket `wmiexec`, LOLBins, `net user /add`) |
| **EID 3** | Network Connection | Destination IP, destination port, initiating process image | **15, 16** (SMB/RPC connections from pivot host) |
| **EID 7** | Image Loaded | DLL loads, unsigned module execution | **14, 16** (DCSync replication and ticket injection) |
| **EID 8** | CreateRemoteThread | Cross-process memory injection | **16** (Process injection for ticket manipulation) |
| **EID 11** | FileCreate | Dropped scripts, staging output files | **18, 20** (Staging reconnaissance text files, wallpaper drop) |
| **EID 13** | Registry Value Set | Persistence mechanisms (`Run`, `RunOnce`, `Winlogon`, `IFEO`) | **17, 20** (Desktop wallpaper path, autostart registry keys) |
| **EID 17/18** | Named Pipe Events | Named pipe creation and connection (`\pipe\wmiexec`, `\pipe\psexec`) | **15, 17** (Remote lateral movement RPC communication) |
| **EID 22** | DNS Query | Domain name resolution queries by process | **12, 13** (Active Directory service discovery) |

---

## 3. Configuration Highlights (`sysmonconfig.xml`)

### Process Creation & Hashes
```xml
<Sysmon schemaversion="4.90">
  <HashAlgorithms>md5,sha256</HashAlgorithms>
  <CheckRevocation>False</CheckRevocation>
  <EventFiltering>
    <!-- Event ID 1: Process Creation -->
    <RuleGroup name="process_creation" groupRelation="or">
      <ProcessCreate onmatch="include">
        <CommandLine condition="contains">cmd.exe</CommandLine>
        <CommandLine condition="contains">powershell.exe</CommandLine>
        <CommandLine condition="contains">ADMIN$</CommandLine>
        <CommandLine condition="contains">net user</CommandLine>
        <CommandLine condition="contains">net group</CommandLine>
      </ProcessCreate>
    </RuleGroup>
```

### Registry Persistence Monitoring
```xml
    <!-- Event ID 13: Registry Value Set -->
    <RuleGroup name="registry_persistence" groupRelation="or">
      <RegistryEvent onmatch="include">
        <TargetObject condition="contains">\CurrentVersion\Run</TargetObject>
        <TargetObject condition="contains">\CurrentVersion\RunOnce</TargetObject>
        <TargetObject condition="contains">\Winlogon\Shell</TargetObject>
        <TargetObject condition="contains">\Control\Terminal Server</TargetObject>
      </RegistryEvent>
    </RuleGroup>
```

---

## 4. Wazuh SIEM Integration

Wazuh agents on `DomainWin10` and `Win10User` collect Sysmon operational events via native Windows Event Channel ingestion:

```xml
<!-- ossec.conf on Windows Agents -->
<localfile>
  <location>Microsoft-Windows-Sysmon/Operational</location>
  <log_format>eventchannel</log_format>
</localfile>
```

Wazuh correlates Sysmon events with custom rules in [`03-Detection-Engineering/Wazuh/local_rules.xml`](../Wazuh/local_rules.xml):
- **Rule 100613 (Level 10):** Flags Impacket `wmiexec` commands spawning `cmd.exe /Q /c` with `ADMIN$\__<id>` redirection.
- **Rule 100100–100104 (Level 12):** Flags Registry `Run`/`RunOnce` modifications and service hijacking attempts.
- **Rule 61603 (Level 3):** Standard Sysmon Process Creation baseline rule, correlated into `process_fanout` groups by [`custom-thehive.py`](../../06-Resources/Scripts/custom-thehive.py).

---

## 5. Verification Commands (PowerShell)

```powershell
# Verify Sysmon64 service status
Get-Service Sysmon64

# Display loaded Sysmon configuration schema and hash
sysmon64 -c

# Query latest 5 Sysmon process creation events
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=1} -MaxEvents 5 | Format-List TimeCreated, Message

# Query registry modification events (Event ID 13)
Get-WinEvent -FilterHashtable @{LogName='Microsoft-Windows-Sysmon/Operational'; Id=13} -MaxEvents 5 | Format-List TimeCreated, Message
```
