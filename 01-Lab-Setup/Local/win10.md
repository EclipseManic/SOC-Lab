# Windows 10 — Domain-Joined Workstation Target

| Property | Value |
|----------|-------|
| **OS** | Windows 10 Pro N, Build 19045.6216 |
| **Role** | Domain-joined workstation target |
| **Address** | `192.168.56.20/24` |
| **Default gateway** | `192.168.56.150` |
| **Domain** | `ad.lab` |
| **Resources** | 2 vCPU · 4 GB RAM |
| **Local account** | `win10` / `Secur3Lab!` |
| **Wazuh agent** | `Win10User` |
| **Velociraptor** | Client v0.77.1 |

## Network Position

Win10 sits on the victim subnet (`192.168.56.0/24`) alongside the Domain Controller and DVWA.
Host-to-host traffic between Win10 and DC-AD **stays inside the subnet** — Suricata on the gateway never sees it.

> [!IMPORTANT]
> Detection for lateral movement and credential attacks on this host relies entirely on **Wazuh agent + Sysmon** telemetry, not network IDS.

## Windows Defender

**Disabled** — intentionally turned off to avoid interference with attack simulation.
This allows tools like Responder, Mimikatz, and Rubeus to execute without endpoint protection blocking them.

## LLMNR / NBT-NS

**Enabled** — required for Responder credential capture (Stage 10).
Win10 broadcasts LLMNR and NBT-NS queries for nonexistent hostnames, which Responder poisons to capture NTLMv2 hashes.

## Sysmon 15.20

Sysmon is configured with **sysmon-modular** (Olaf Hartong's modular Sysmon config), providing granular visibility into:

- Process creation (Event ID 1)
- Network connections (Event ID 3)
- File creation (Event ID 11)
- Registry modifications (Event ID 13)
- WMI activity (Event ID 19–21)
- DNS queries (Event ID 22)

### Verification

```powershell
Get-Service Sysmon64
# Status: Running

sysmon64 -c
# Shows loaded config hash
```

## Windows Audit Policies

### Process Creation Auditing (EID 4688)

Command-line auditing is enabled so every process creation event includes the full command line — critical for detecting encoded PowerShell, LOLBins, and tool execution.

```powershell
# Process creation auditing
reg query "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit" /v ProcessCreationIncludeCmdLine_Enabled
# Expected: 0x1
```

### PowerShell Logging

| Policy | Event ID | Purpose |
|--------|----------|---------|
| ScriptBlock Logging | 4104 | Captures full PowerShell script content, including decoded/deobfuscated blocks |
| Module Logging | 4103 | Logs pipeline execution details for loaded modules |

```powershell
# PowerShell ScriptBlock Logging
reg query "HKLM\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" /v EnableScriptBlockLogging
# Expected: 0x1
```

## Telemetry Sources

| Source | What it captures |
|--------|-----------------|
| Windows Security log | Logon events, process creation (4688), account management |
| Sysmon | Process tree, network connections, file/registry changes, DNS |
| PowerShell logs | Script blocks (4104), module execution (4103) |
| Wazuh agent (`Win10User`) | Aggregated host alerts shipped to manager |
| Velociraptor client | On-demand forensic collection |

## Related Documentation

- [Stage 10 — Responder](../../02-Attack-Simulation/stage-10/README.md)
- [Stage 15 — Lateral Movement](../../02-Attack-Simulation/stage-15/README.md)
- [Stage 18 — Exfiltration](../../02-Attack-Simulation/stage-18/README.md)
- [Detection Engineering — Wazuh Rules](../../03-Detection-Engineering/Wazuh/rules.md)
