# Investigation — Stage 06 — Reverse Shell

> **Status:** In Progress  
> **Attack stage:** [Stage 06](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-ccae331b77`, `wzb-81bb1f83f7` |
| **Rule ID** | Suricata SID `3400020` (`POSSBL SCAN SHELL M-SPLOIT TCP`) via `86601` / Wazuh `100199` |
| **Source** | Suricata Network IDS / Wazuh |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary established an outbound interactive Python reverse shell connection from DVWA (`192.168.56.30`) to Kali (`192.168.232.135:4444`). Suricata SID 3400020 and Wazuh interactive shell monitoring flagged the shell spawn.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Outbound socket connection spawned by Python interpreter executed by the web server service account (www-data). |

---

## Investigation steps

1. Inspected Wazuh alert wzb-ccae331b77 for exact command line captured by custom bashcmd decoder.
2. Verified outbound network socket from DVWA (192.168.56.30) to Kali (192.168.232.135) on port 4444/TCP.
3. Checked process ancestry: apache2 -> sh -> python3.
4. Confirmed active interactive shell session established.
5. Prepared host isolation action in TheHive case task.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/15.png`](../../02-Attack-Simulation/Attack-Screenshots/15.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/5.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/5.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

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
