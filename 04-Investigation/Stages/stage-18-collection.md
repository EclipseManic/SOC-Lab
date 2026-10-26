# Investigation — Stage 18 — Data Collection

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 18](../../02-Attack-Simulation/Stages/stage-18-collection.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-aa66cb916a`, `wzb-96e8d5856b`, `wzb-ed666653f7` |
| **Rule ID** | Wazuh `100613` (Process Fan-out: `cmd.exe /Q /c whoami`, `net user`, `net group`) |
| **Source** | Windows Security / Sysmon EID 1 / Wazuh |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary executed automated data harvesting commands across `DomainWin10` and `Win10User` using Impacket `wmiexec`. Wazuh Rule 100613 alerted on rapid child process fan-outs spawning `whoami`, `net user`, and `net group` from parent PID 4432 / 4008.

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

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/54.png`](../../02-Attack-Simulation/Attack-Screenshots/54.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/16.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/16.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

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
