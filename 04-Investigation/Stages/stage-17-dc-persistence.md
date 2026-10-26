# Investigation — Stage 17 — DC Persistence

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 17](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-26b4d06a63`, `wzb-299a007168`, `wzb-1834f3248e` |
| **Rule ID** | Wazuh `100613` (WMI Fan-out: `net user /add`, `net localgroup`) |
| **Source** | Windows Security / Wazuh Process Correlation |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary created a rogue local domain user `backdoor_admin` and added it to Domain Admins via Impacket `wmiexec`. Wazuh Rule 100613 alerted on the WMI process fan-out, Wazuh Rule 100613 alerted on child process command lines executing net user and net localgroup Domain Admins.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Creation of an administrative domain account spawned via WMI remote execution from an untracked parent process. |

---

## Investigation steps

1. Verified Windows Security Event ID 4720 (User account created: backdoor_admin).
2. Verified Event ID 4728 (Member added to security group: Domain Admins).
3. Inspected Sysmon process creation events for wmiprvse.exe -> cmd.exe /Q /c net user.
4. Correlated with Wazuh Rule 100613 process fan-out alert in TheHive.
5. Issued emergency remediation task to disable backdoor account.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/52.png`](../../02-Attack-Simulation/Attack-Screenshots/52.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/15.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/15.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Rogue Account | `backdoor_admin` | Persisted domain administrative user |
| Group | `Domain Admins` | Target privileged security group |
| Parent Process | `wmiprvse.exe` | WMI provider host execution |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Both host security event IDs and Sysmon process creation rules generated high-severity alerts.

---

## Verdict

Confirmed True Positive domain persistence account creation.

---

## MITRE ATT&CK

- **Tactic:** Persistence
- **Technique:** Create Account: Domain Account (T1136.002)
