# Sysmon Telemetry Baseline — Windows Endpoint Auditing

> **Production Configuration & Artifacts:**
> - Modular Configuration: [`sysmonconfig.xml`](sysmonconfig.xml)
> - Target Deployment: Domain Controller (`192.168.56.10`, Server 2022) & Windows 10 Workstation (`192.168.56.20`, Win10 Pro N)
> - Version: Microsoft Sysmon v15.20 (64-bit service `Sysmon64`)
> - Wazuh Ingestion: `Microsoft-Windows-Sysmon/Operational` eventchannel

---

## 1. Overview & Architecture

System Monitor (Sysmon) provides deep endpoint activity tracking on Windows targets. While standard Windows Security Event Logs (`Security.evtx`) record authentication and high-level process launches, Sysmon captures granular execution metadata, including full process command lines, parent-child relationships, hashes (MD5, SHA256), named pipe activity, and registry value manipulations.

In this lab, Sysmon is deployed using an adapted, high-signal **`sysmon-modular`** baseline tailored to capture adversary tradecraft without overwhelming memory or storage on constrained lab VMs.

---

## 2. Active Event Types & Campaign Coverage

| Event ID | Sysmon Event Name | Active Filters & Monitored Objects | Validated Campaign Stages |
|---|---|---|---|
| **EID 1** | Process Creation | Command-line logging, ParentImage `WmiPrvSE.exe`, `ADMIN$\__`, LOLBins (`whoami`, `net`, `dsquery`, `schtasks`, `rundll32`) | **15, 17, 18, 20** (Impacket `wmiexec`, `net user /add`, data staging) |
| **EID 3** | Network Connection | Ports 445 (SMB), 135 (RPC), 389/636 (LDAP), 5985/5986 (WinRM), 88 (Kerberos) | **13, 15** (Kerberos requests and SMB lateral movement) |
| **EID 11** | File Creation | Executables, scripts, and images written to `C:\Users\Public\` and `\Temp\` (`.bmp`, `.exe`, `.ps1`, `.vbs`) | **18, 20** (Staging collection archives, wallpaper drop) |
| **EID 12/13** | Registry Modification | Autostarts (`Run`, `RunOnce`), `Winlogon`, `Services`, `IFEO`, `Shell Folders`, Desktop `Wallpaper` | **17, 20** (Registry autostart persistence, desktop defacement) |
| **EID 17/18** | Named Pipe Events | Pipes `spoolss`, `atsvc`, `svcctl`, `wmiexec` | **15, 17** (Remote RPC and Impacket named pipe creation) |

> [!NOTE]
> **Tuning Decision on EID 7, 8, and 22:** High-volume event categories like Image Loaded (EID 7), CreateRemoteThread (EID 8), and DNS Query (EID 22) were intentionally omitted from `sysmonconfig.xml` to prevent log saturation on 4 GB RAM VMs while focusing detection capacity on execution, network connections, file staging, and registry persistence.

---

## 3. Configuration Highlights (`sysmonconfig.xml`)

### Process Creation (EID 1)
```xml
<RuleGroup name="ProcessCreate_Include" groupRelation="or">
  <ProcessCreate onmatch="include">
    <ParentImage condition="image">WmiPrvSE.exe</ParentImage>
    <Image condition="image">cmd.exe</Image>
    <Image condition="image">powershell.exe</Image>
    <Image condition="image">whoami.exe</Image>
    <Image condition="image">net.exe</Image>
    <Image condition="image">rundll32.exe</Image>
    <ParentCommandLine condition="contains">\ADMIN$\__</ParentCommandLine>
  </ProcessCreate>
</RuleGroup>

<!-- Exclude known background OS noise -->
<RuleGroup name="ProcessCreate_Exclude" groupRelation="or">
  <ProcessCreate onmatch="exclude">
    <Image condition="is">C:\Windows\System32\conhost.exe</Image>
    <Image condition="is">C:\Windows\System32\BackgroundTransferHost.exe</Image>
  </ProcessCreate>
</RuleGroup>
```

### Registry Persistence (EID 12/13)
```xml
<RuleGroup name="RegistryEvent_Include" groupRelation="or">
  <RegistryEvent onmatch="include">
    <TargetObject condition="contains">\CurrentVersion\Run</TargetObject>
    <TargetObject condition="contains">\CurrentVersion\RunOnce</TargetObject>
    <TargetObject condition="contains">\Microsoft\Windows NT\CurrentVersion\Winlogon</TargetObject>
    <TargetObject condition="contains">\System\CurrentControlSet\Services\</TargetObject>
    <TargetObject condition="contains">\Image File Execution Options\</TargetObject>
    <TargetObject condition="contains">\Explorer\Shell Folders</TargetObject>
    <TargetObject condition="contains">\Explorer\User Shell Folders</TargetObject>
    <TargetObject condition="contains">\Control Panel\Desktop\Wallpaper</TargetObject>
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
- **Rule 100100–100104 (Level 12):** Flags Registry `Run`/`RunOnce`, IFEO, and service hijacking attempts.
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
