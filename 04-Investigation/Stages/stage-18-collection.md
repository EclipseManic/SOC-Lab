# Investigation — Stage 18 — Data Collection

> **Status:** Completed  
> **Attack stage:** [Stage 18](../../02-Attack-Simulation/Stages/stage-18-collection.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-aa66cb916a / wzb-ed666653f7` |
| **Rule ID** | `Wazuh 100613 / Wazuh 100602` |
| **Source** | Wazuh Windows Agent & Linux Auditd |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh process fan-out rule 100613 alerted on rapid reconnaissance commands via wmiexec on Windows hosts (whoami, net user, systeminfo), while Auditd on DVWA detected tar archive staging (/tmp/data.tar.gz).

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Systematic collection of host configuration and staging of compressed archive in temporary directory. |

---

## Investigation steps

1. Inspected Sysmon Event ID 1 events on DomainWin10 and PC-DC for data harvesting commands.
2. Verified Auditd execve events on DVWA for tar -czf /tmp/data.tar.gz.
3. Confirmed Wazuh process fan-out correlation grouping in TheHive.
4. Identified staged archive path and file size.
5. Prepared network perimeter monitoring for exfiltration attempt.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/62.png`](../../02-Attack-Simulation/Attack-Screenshots/62.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/16.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/16.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Staged File | `/tmp/data.tar.gz` | Compressed staging archive |
| Commands | `whoami /all, net user, ipconfig /all` | Reconnaissance commands |
| Host | `DVWA & DomainWin10` | Collection targets |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Wazuh process fan-out correlation compressed dozens of collection commands into a single high-fidelity incident alert.

---

## Verdict

Confirmed True Positive automated data collection and staging.

---

## MITRE ATT&CK

- **Tactic:** Collection
- **Technique:** Data from Local System (T1005)
