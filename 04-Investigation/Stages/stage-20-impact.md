# Investigation — Stage 20 — Impact

> **Status:** Completed  
> **Attack stage:** [Stage 20](../../02-Attack-Simulation/Stages/stage-20-impact.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-71ef983ad8 / wzb-1f43c1540f` |
| **Rule ID** | `Wazuh 100613 / Sysmon EID 1` |
| **Source** | Wazuh Windows Agent & Sysmon on Win10/DC |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh process fan-out rule 100613 triggered on DomainWin10 and PC-DC as Impacket wmiexec spawned registry modification commands (reg add) altering desktop wallpaper and user shell configurations to display defacement notices.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | WMI-driven administrative fan-out executing unauthorized registry tampering to modify user interface settings. |

---

## Investigation steps

1. Verified Sysmon Event ID 1 on DomainWin10 for wmiprvse.exe -> cmd.exe /Q /c reg add HKCU\Control Panel\Desktop.
2. Verified Sysmon Event ID 13 registry modification event for Wallpaper value.
3. Confirmed Wazuh process fan-out alert grouping in TheHive queue.
4. Confirmed physical defacement rendered on Windows client desktop.
5. Finalized Case 03 and transitioned to Incident Response / Remediation.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/70.png`](../../02-Attack-Simulation/Attack-Screenshots/70.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/18.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/18.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Tool | `wmiexec.py` | WMI command execution tool |
| Registry | `HKCU\Control Panel\Desktop\Wallpaper` | Tampered autostart/display key |
| Targets | `DomainWin10 & PC-DC` | Defaced domain endpoints |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Sysmon process creation and registry auditing rules combined with Wazuh fan-out correlation provided complete visibility of impact commands.

---

## Verdict

Confirmed True Positive enterprise impact and endpoint defacement.

---

## MITRE ATT&CK

- **Tactic:** Impact
- **Technique:** Defacement: Internal Defacement (T1491.001)
