# Sysmon Telemetry Baseline — Windows Endpoint Auditing

> **Production Configuration & Artifacts:**
> - Modular Configuration: [`sysmonconfig.xml`](../../06-Resources/rules/sysmon/sysmonconfig.xml)
> - Target Deployment: Domain Controller (`192.168.56.10`, Server 2022 / Agent: `DomainWin10`) & Windows 10 Workstation (`192.168.56.20`, Win10 Pro N / Agent: `Win10User`)
> - Version: Microsoft Sysmon v15.20 (64-bit service `Sysmon64`)
> - Wazuh Ingestion: `Microsoft-Windows-Sysmon/Operational` eventchannel

---

## 1. Overview & Architecture

System Monitor (Sysmon) provides deep endpoint activity tracking on Windows targets. While standard Windows Security Event Logs (`Security.evtx`) record authentication and high-level process launches, Sysmon captures granular execution metadata, including full process command lines, parent-child relationships, hashes (MD5, SHA256), named pipe activity, and registry value manipulations.

In this lab, Sysmon is deployed using a tailored, high-signal 90-line baseline ([`sysmonconfig.xml`](../../06-Resources/rules/sysmon/sysmonconfig.xml)) engineered to capture adversary execution, network staging, and persistence without exhausting VM memory or disk I/O on constrained endpoints.

---

## 2. Active Event Types & Campaign Coverage

| Event ID | Sysmon Event Name | Active Filters & Monitored Objects | Telemetry Status in Campaign Dataset |
|---|---|---|---|
| **EID 1** | Process Creation | Command-line logging, ParentImage `WmiPrvSE.exe`, `ADMIN$\__`, 13 target binaries (`cmd.exe`, `powershell.exe`, `pwsh.exe`, `whoami.exe`, `net.exe`, `net1.exe`, `nltest.exe`, `dsquery.exe`, `klist.exe`, `reg.exe`, `schtasks.exe`, `certutil.exe`, `rundll32.exe`) | **Active Alerting (182 rows in raw export (167 in filtered analysis set))** — Traced Impacket `wmiexec` child processes in Stages 15, 16, 17, 18, and 20 |
| **EID 3** | Network Connection | Ports 445 (SMB), 135 (RPC), 389/636 (LDAP), 5985/5986 (WinRM), 88 (Kerberos) | **Telemetry Baseline Collected** — Ingested by agent; no independent alert rows generated |
| **EID 11** | File Creation | Executables, scripts, and images written to `C:\Users\Public\` and `\Temp\` (`.bmp`, `.exe`, `.ps1`, `.vbs`) | **Telemetry Baseline Collected** — Monitored on disk; no independent alert rows generated |
| **EID 12/13** | Registry Modification | Autostarts (`Run`, `RunOnce`), `Winlogon`, `Services`, `IFEO`, `Shell Folders`, Desktop `Wallpaper` | **Telemetry Baseline Collected** — Registry audited via EID 13; Sysmon EID 1 (Rule 92041: `reg.exe` process command line) captured wallpaper change |
| **EID 17/18** | Named Pipe Events | Watches `spoolss`, `atsvc`, `svcctl`, `wmiexec` | **Telemetry Baseline Collected** — Impacket `wmiexec` uses WMI DCOM and SMB file staging rather than named pipes; pipe rule did not fire |

> [!NOTE]
> **Tuning Decision on High-Volume Event Types (EID 7, 8, 10, 22):**  
> - **Omission Rationale:** High-volume event categories like Image Loaded (EID 7), CreateRemoteThread (EID 8), and DNS Query (EID 22) were intentionally omitted from `sysmonconfig.xml` to prevent log saturation and CPU thrashing on 4 GB RAM VMs while focusing detection capacity on process execution, network connections, file staging, and registry persistence.
> - **Event ID 10 (`ProcessAccess` targeting `lsass.exe`) Architectural Trade-Off:** Sysmon Event ID 10 intercepts handles opened to sensitive processes. In enterprise environments, EID 10 is the primary sensor mechanism for detecting credential dumping (e.g. Mimikatz, Procdump targeting `lsass.exe`). However, monitoring `lsass.exe` on constrained VMs generates heavy context-switching overhead from legitimate antivirus and Windows security services (`svchost.exe`, `csrss.exe`). In this simulation, credential dumping (Stage 14 DCSync) operated via network replication protocols (DRSUAPI / RPC) rather than local memory injection, so EID 10 was omitted from the baseline. For production deployments, a targeted EID 10 filter (`TargetImage is C:\Windows\System32\lsass.exe` with granted access filters like `0x1010` or `0x1038`) is strongly recommended.

---

## 3. Configuration Highlights (`sysmonconfig.xml`)

### Process Creation (EID 1)
```xml
<RuleGroup name="ProcessCreate_Include" groupRelation="or">
  <ProcessCreate onmatch="include">
    <ParentImage condition="image">WmiPrvSE.exe</ParentImage>
    <Image condition="image">cmd.exe</Image>
    <Image condition="image">powershell.exe</Image>
    <Image condition="image">pwsh.exe</Image>
    <Image condition="image">whoami.exe</Image>
    <Image condition="image">net.exe</Image>
    <Image condition="image">net1.exe</Image>
    <Image condition="image">nltest.exe</Image>
    <Image condition="image">dsquery.exe</Image>
    <Image condition="image">klist.exe</Image>
    <Image condition="image">reg.exe</Image>
    <Image condition="image">schtasks.exe</Image>
    <Image condition="image">certutil.exe</Image>
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

Wazuh correlates Sysmon events with custom rules in [`06-Resources/rules/wazuh/local_rules.xml`](../../06-Resources/rules/wazuh/local_rules.xml):
- **Rule 100613 (Level 10):** Flags Impacket `wmiexec` commands spawning `cmd.exe /Q /c` with `ADMIN$\__<id>` output redirection (fired on both `DomainWin10` and `Win10User`).
- **Rule 92041 (Level 5 / Sysmon Process Creation):** Belongs to Wazuh's built-in `sysmon_eid1_detections` rule group (matching Sysmon Event ID 1 process creation when `reg.exe` adds or modifies registry keys). Caught `reg.exe add "HKCU\Control Panel\Desktop" /v Wallpaper` during Stage 20 impact, elevated via `process_fanout` into TheHive Alerts #40, #41, #44, and #45. Custom rules `100100`–`100104` provide EID 13 coverage for `Run`, `Winlogon`, `IFEO`, `Shell Folders`, and `ServiceDll`; desktop wallpaper tampering was captured through process execution (`reg.exe`) rather than a dedicated EID 13 rule.
- **Rules 100100–100102 (Level 12):** Detects `Run`/`RunOnce`, Winlogon, and IFEO Debugger autostart registry persistence.
- **Rules 100103–100104 (Level 10):** Detects Shell Folders and Service DLL hijack registry persistence.
- **Rule 61603 (Level 3):** Standard Sysmon Process Creation baseline rule, correlated into `process_fanout` incident groups by [`custom-thehive.py`](../../06-Resources/scripts/custom-thehive.py).

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
