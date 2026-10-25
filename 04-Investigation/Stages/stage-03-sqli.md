# Investigation — Stage 03 — SQL Injection

> **Status:** Completed  
> **Attack stage:** [Stage 03](../../02-Attack-Simulation/Stages/stage-03-sqli.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-10160d36c2` |
| **Rule ID** | Wazuh `31153` (Level 10 - Sensitive file /etc/passwd in URL parameter) |
| **Source** | Wazuh (Apache Access Logs) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh flagged an SQL injection and path traversal parameter pattern in Apache access logs attempting to access `/etc/passwd` via URL injection, triggering watchlist Rule 31153 and escalating to TheHive.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Classic UNION SELECT SQL injection syntax observed in HTTP request parameters attempting database credential exfiltration. |

---

## Investigation steps

1. Decoded HTTP URI query parameters in Suricata eve.json payload field.
2. Verified SQL injection syntax targeting backend MySQL/MariaDB database.
3. Queried DVWA Apache access logs for response size anomalies indicating data exfiltration.
4. Confirmed exfiltration of user table hashes from DVWA database.
5. Tagged alert for immediate credential rotation and web app patching.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/8.png`](../../02-Attack-Simulation/Attack-Screenshots/8.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/3.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/3.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Attacker workstation |
| URI | `/dvwa/vulnerabilities/sqli/?id=1'+UNION+SELECT...` | SQL injection exploit vector |
| Database | `dvwa.users` | Target database table |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Wazuh Rule 31153 flagged sensitive /etc/passwd parameter access from Apache access logs with zero latency. For TLS deployments, WAF or TLS termination inspection is required.

---

## Verdict

Confirmed True Positive SQL injection exploitation leading to database credential disclosure.

---

## MITRE ATT&CK

- **Tactic:** Initial Access
- **Technique:** Exploit Public-Facing Application (T1190)
