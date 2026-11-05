# Domain Controller — Active Directory

| Property | Value |
|----------|-------|
| **OS** | Windows Server 2022 Standard Evaluation, Build 10.0.20348.587 |
| **Role** | Domain Controller · DNS Server · Kerberos KDC |
| **Hostname** | `PC-DC` |
| **FQDN** | `PC-DC.ad.lab` |
| **Address** | `192.168.56.10/24` |
| **Default gateway** | `192.168.56.150` (Suricata Gateway) |
| **Domain** | `ad.lab` |
| **Roles** | Active Directory Domain Services (AD DS), DNS |
| **Resources** | 2 vCPU · 4 GB RAM · 40 GB NVMe |
| **Wazuh agent** | `DomainWin10` (Agent ID: `004`) |
| **Velociraptor** | Client v0.77.1 |
| **SSH Management** | None (Windows endpoint — managed via WinRM / local console) |

---

## 1. Initial Host Setup & OS Hardening Adjustments

### Windows Defender Real-Time Protection
To evaluate host-level telemetry and simulate an enterprise environment where endpoint security controls have been bypassed or configured in audit-only mode, Windows Defender real-time blocking is disabled:

```powershell
# Disable Defender real-time and behavior monitoring to allow authentic telemetry collection
Set-MpPreference -DisableRealtimeMonitoring $true
Set-MpPreference -DisableBehaviorMonitoring $true
Set-MpPreference -DisableIOAVProtection $true
Set-MpPreference -MAPSReporting 0
```

### WinRM Configuration
WinRM is enabled with Kerberos authentication across the victim subnet, providing administrative remote access and enabling lateral movement monitoring:

```powershell
# Enable WinRM service and configure firewall rules
winrm quickconfig -q
Set-Item -Path WSMan:\localhost\Service\Auth\Kerberos -Value $true
Enable-PSRemoting -Force
```

---

## 2. Active Directory Domain Population (BadBlood)

The `ad.lab` domain was provisioned with the open-source [BadBlood](https://github.com/davidprowe/BadBlood) automation framework to populate a realistic, non-trivial Active Directory structure. Rather than testing against a hollow lab with two accounts, BadBlood builds nested Organizational Units (OUs), varied security groups, and thousands of user objects to simulate an enterprise domain:

```powershell
# Clone and execute BadBlood domain population from the Domain Controller
git clone https://github.com/davidprowe/BadBlood.git C:\BadBlood
cd C:\BadBlood
Import-Module .\BadBlood.ps1
Invoke-BadBlood
```

### Populated Object Inventory

| Object Type | Count | Purpose in Campaign |
|-------------|:---:|---------------------|
| **Users** | `2,493` | Populates realistic enterprise directory structure for BloodHound graph enumeration |
| **Security Groups** | `546` | Establishes nested delegation hierarchies and complex access control lists (ACLs) |
| **Computer Objects** | `101` | Generates realistic network endpoints across multiple subnets |

### Baseline Accounts & Service Principals

The baseline domain is provisioned with high-value accounts that serve as targets for the adversary campaign:

| Account | Type | Baseline Configuration & Target Role |
|---------|------|--------------------------------------|
| `Administrator` | Built-in Domain Admin | High-value credential target for DRSUAPI domain replication ([Stage 14 — DCSync](../../02-Attack-Simulation/Stages/stage-14-dcsync.md)) |
| `HANK_SHERMAN` | Domain Admin & Service Account | Populated by BadBlood with SPN `CIFS/AWSWAPPS1000000.ad.lab`, weak password `Password123`, and `PasswordNeverExpires: True` (target for [Stage 13 — Kerberoasting](../../02-Attack-Simulation/Stages/stage-13-kerberoasting.md)) |

```powershell
# Ensure the Service Principal Name (SPN) is registered for HANK_SHERMAN
setspn -S CIFS/AWSWAPPS1000000.ad.lab HANK_SHERMAN

# Verify SPN registration
setspn -L HANK_SHERMAN
# Expected output: Registered ServicePrincipalNames for CN=HANK_SHERMAN,... CIFS/AWSWAPPS1000000.ad.lab
```

> [!IMPORTANT]
> **Lab Setup Scope Boundary:** Only baseline accounts and BadBlood directory objects exist prior to the campaign. Rogue accounts created *during* the attack simulation (such as the `backdoor` Domain Admin account created during Stage 17) are **not** created during initial setup. They are dynamically provisioned by red-team execution in [Stage 17](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md).

---

## 3. Sysmon v15.20 Deployment & Configuration

System Monitor (Sysmon 64-bit) is installed using the tailored 90-line baseline configuration ([`sysmonconfig.xml`](../../06-Resources/rules/sysmon/sysmonconfig.xml)):

```powershell
# Install Sysmon service using the lab baseline configuration schema
.\Sysmon64.exe -i C:\Tools\sysmonconfig.xml -accepteula

# Verify Sysmon service health
Get-Service Sysmon64
# Status: Running

# Verify active schema and configuration hash
sysmon64 -c
```

### Monitored Event Channels in `sysmonconfig.xml`

| Event ID | Event Name | Monitored Signatures & Filtering Criteria |
|:---:|---|---|
| **EID 1** | Process Creation | Command-line logging enabled; filters for parent `WmiPrvSE.exe` and `cmd.exe /Q /c` with `\ADMIN$\__` output redirection; tracks 13 LOLBins (`net.exe`, `nltest.exe`, `whoami.exe`, `certutil.exe`, `reg.exe`, `dsquery.exe`, etc.) |
| **EID 3** | Network Connection | Explicitly monitors connection attempts across ports `445` (SMB), `135` (RPC), `389`/`636` (LDAP), `5985`/`5986` (WinRM), and `88` (Kerberos) |
| **EID 11** | File Creation | Audits executable, script, and image drops (`.exe`, `.ps1`, `.vbs`, `.bmp`) in `C:\Users\Public\` and `\Temp\` |
| **EID 12/13** | Registry Modification | Audits persistence autostart keys (`Run`, `RunOnce`, `Winlogon`, `Services`, `IFEO`, and `Control Panel\Desktop\Wallpaper`) |
| **EID 17/18** | Named Pipe Events | Audits pipe creation and connection for `spoolss`, `atsvc`, `svcctl`, and `wmiexec` |

> [!NOTE]
> **Tuning Decision on High-Volume Event Categories (EID 7, 8, 10, 22):**  
> - **Omission Rationale:** High-volume event categories like Image Loaded (EID 7), CreateRemoteThread (EID 8), and DNS Query (EID 22) were intentionally omitted from `sysmonconfig.xml` to prevent log saturation and CPU thrashing on 4 GB RAM VMs while focusing detection capacity on process execution, network connections, file staging, and registry persistence.
> - **Sysmon Event ID 10 (`ProcessAccess` targeting `lsass.exe`):** EID 10 intercepts handles opened to sensitive processes. In enterprise environments, EID 10 is the primary sensor mechanism for detecting local LSASS memory dumping (e.g. Mimikatz or Procdump). However, monitoring `lsass.exe` on constrained VMs generates heavy context-switching overhead from legitimate antivirus and Windows security services. In this simulation, credential access (Stage 14 DCSync) operated via network replication protocols (DRSUAPI / RPC) rather than local memory injection, so EID 10 was omitted from the initial baseline and is recommended as a production hardening enhancement.

---

## 4. Advanced Audit Policies & Windows Telemetry Configuration

To ensure comprehensive detection of Active Directory attacks (such as Kerberoasting, DCSync, and Golden Tickets), Advanced Audit Policies are explicitly configured using `auditpol.exe`:

```cmd
:: 1. Account Logon Policies (Kerberos & NTLM)
auditpol /set /subcategory:"Kerberos Authentication Service" /success:enable /failure:enable
auditpol /set /subcategory:"Kerberos Service Ticket Operations" /success:enable /failure:enable
auditpol /set /subcategory:"Credential Validation" /success:enable /failure:enable

:: 2. Account Management Policies
auditpol /set /subcategory:"User Account Management" /success:enable /failure:enable
auditpol /set /subcategory:"Security Group Management" /success:enable /failure:enable

:: 3. Privilege Use & Directory Access Policies
auditpol /set /subcategory:"Sensitive Privilege Use" /success:enable /failure:enable
auditpol /set /subcategory:"Directory Service Access" /success:enable /failure:enable
auditpol /set /subcategory:"Directory Service Changes" /success:enable /failure:enable

:: 4. Process Tracking
auditpol /set /subcategory:"Process Creation" /success:enable /failure:disable
```

### Critical Windows Security Event IDs Generated During Campaign

> [!NOTE]
> **Empirical Telemetry Accounting Note (EID 4662 & 4769):**  
> While `auditpol.exe` enables subcategories for "Directory Service Access" and "Kerberos Service Ticket Operations", in `Wazuh-Raw-Alerts.csv` neither EID 4662 nor EID 4769 generated SIEM alerts. In Windows Active Directory, EID 4662 for DCSync requires an explicit System Access Control List (SACL) configured on the domain root object (`DC=ad,DC=lab`) auditing `Replicating Directory Changes All` (`1131f6ad-9c07-11d1-f79f-00c04fc2dcd2`), and during Stage 14 the DC's Wazuh agent event queue overflowed (`Agent event queue is full`, Data Rows 9271–9272). Instead, target DC activity was directly captured via EID 4624, EID 4672, EID 4720/4728, and Sysmon EID 1.

| Event ID | Subcategory / Sensor | Security Significance & Ground-Truth Rule Attribution | Triggering Campaign Stages |
|:---:|---|---|---|
| **4624** | Logon (LogonType 3) | Network logon from unauthorized Linux DMZ IP (`192.168.56.30`); caught by Custom Rule `100615` & Rule `92657` | **Stage 12** (BloodHound, Rows 9254, 9265), **Stage 15** (PTH), **Stage 16** (Golden Ticket, Row 9308) |
| **4672** | Sensitive Privilege | Special privileges assigned to new logon (`SeDebugPrivilege`); caught by Custom Rule `100603` | **Stage 14** (`HANK_SHERMAN`, Rows 9268–9269, 9283), **Stage 16** (`Administrator`, Row 9307) |
| **4720 / 4722** | User Management | New domain user account created and enabled (`AD\backdoor`); caught by Wazuh Rule `60109` | **Stage 17** (DC Persistence: Alert #30 `wzb-26b4d06a63`) |
| **4728** | Group Management | User added to privileged global security group (`Domain Admins`); caught by Wazuh Rule `60159` | **Stage 17** (PrivEsc: Alert #33 `wzb-4125e4ac63`) |
| **4732** | Local Group Mgmt | User added to local security group; caught by Wazuh Rule `60154` | **Stage 17** (Alert #31 `wzb-5f5a18ce46`, Alert #34 `wzb-084193beae`) |
| **4738** | User Modification | Domain user account modified; caught by Wazuh Rule `60110` | **Stage 17** (Alert #46 `wzb-1834f3248e` at 18:36:34 IST) |
| **Sysmon EID 1** | Process Creation | Impacket `wmiexec` command execution (`cmd.exe /Q /c`); caught by Custom Rule `100613` | **Stages 15, 16, 17, 18, 20** (Alerts #25–#28, #35, #38–#42) |
| **Sysmon EID 1** | Process Creation | Desktop wallpaper defacement (`reg.exe add`); caught by Rule `92041` | **Stage 20** (Impact: Alerts #40, #41, #44, #45) |
| **System 1074** | System Shutdown | Forced operating system reboot (`shutdown.exe /r /t 0`) | **Stage 20** (Alert #39 `wzb-71ef983ad8`, Alert #42 `wzb-1f43c1540f`) |

---

## 5. Granular Logging Adjustments (PowerShell, Process Lines & LDAP)

### Command-Line Process Auditing (EID 4688)
Ensures every native process creation event includes the full executed command line:

```powershell
# Enable command-line capture in process creation events
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled /t REG_DWORD /d 1 /f
```

### PowerShell Script Block & Module Logging
Captures full, deobfuscated PowerShell code blocks and module pipeline execution:

```powershell
# Enable ScriptBlock Logging (EID 4104)
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging /t REG_DWORD /d 1 /f

# Enable Module Logging (EID 4103)
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging" /v EnableModuleLogging /t REG_DWORD /d 1 /f
reg add "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging\ModuleNames" /v * /t REG_SZ /d * /f
```

### Active Directory LDAP Field Engineering Logging (EID 1644) — Post-Simulation Hardening Addition (Phase 04)

> [!NOTE]
> **Baseline Status vs. Post-Incident Hardening (DG-12 Resolution):**  
> In default Windows Server installations, Event ID 1644 LDAP search query logging is disabled. During the live attack simulation, BloodHound reconnaissance (Stage 12) was detected at the network authentication layer via Custom Rule `100615` (LogonType 3 Kerberos logon), but the internal LDAP search filters were not recorded on the DC (constituting architectural gap `DG-12`). The NTDS Diagnostics registry configuration below was implemented post-simulation during **Phase 04 Hardening** to ensure granular LDAP query auditing for future operations:

```powershell
# Configure NTDS Field Engineering diagnostic level to 5 (Verbose LDAP query logging — Phase 04 Hardening)
reg add "HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics" /v "15 Field Engineering" /t REG_DWORD /d 5 /f

# Set query thresholds to 1 to log all automated LDAP sweeps to Event ID 1644
reg add "HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" /v "Expensive Search Results Threshold" /t REG_DWORD /d 1 /f
reg add "HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" /v "Inefficient Search Results Threshold" /t REG_DWORD /d 1 /f
```

---

## 6. Wazuh Agent Enrollment & Configuration

The Windows Wazuh Agent is deployed to stream all configured event logs to the cloud Wazuh Manager:

```cmd
:: Install Wazuh Agent with Manager IP and Agent Name
msiexec /i wazuh-agent-4.14.8.msi /q WAZUH_MANAGER="10.122.1.4" WAZUH_REGISTRATION_SERVER="10.122.1.4" WAZUH_AGENT_NAME="DomainWin10"

:: Start and set Wazuh service to automatic
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

  <!-- Windows Security Event Channel -->
  <localfile>
    <location>Security</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- Windows System Event Channel -->
  <localfile>
    <location>System</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- Microsoft Sysmon Operational Channel -->
  <localfile>
    <location>Microsoft-Windows-Sysmon/Operational</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- Active Directory NTDS Diagnostics (LDAP EID 1644) — Post-Incident Hardening Channel -->
  <localfile>
    <location>Directory Service</location>
    <log_format>eventchannel</log_format>
  </localfile>

  <!-- PowerShell Operational Channel -->
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
# 1. Verify active Advanced Audit Policies
auditpol /get /category:"Account Logon","Account Management","DS Access"

# 2. Query recent Kerberos ticket requests (EID 4769)
Get-WinEvent -LogName "Security" -MaxEvents 5 | Where-Object { $_.Id -eq 4769 } | Format-List TimeCreated, Message

# 3. Verify Sysmon operational logging status
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 5 | Format-Table TimeCreated, Id, Message -AutoSize

# 4. Confirm Wazuh Agent connectivity to cloud manager (10.122.1.4:1514)
Test-NetConnection -ComputerName 10.122.1.4 -Port 1514
& "C:\Program Files (x86)\ossec-agent\wazuh-agent.exe" status

# 5. Confirm LDAP query diagnostic logging in Directory Service log (Post-Hardening Validation)
Get-WinEvent -LogName "Directory Service" -MaxEvents 5 | Where-Object { $_.Id -eq 1644 } | Format-List TimeCreated, Message
```
