# Investigation — Stage 03 — SQL Injection

> **Status:** Completed  
> **Attack stage:** [Stage 03](../../02-Attack-Simulation/Stages/stage-03-sqli.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-c276fcddb8` |
| **Rule ID** | `Suricata SID 2010938 / Wazuh 86601` |
| **Source** | Suricata Network IDS via Wazuh integration |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Suricata signature SID 2010938 (ET WEB_SERVER Possible SQL Injection - UNION SELECT) fired on inbound HTTP GET traffic containing SQL syntax (' UNION SELECT user, password FROM users --) destined for DVWA.

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

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/09.png`](../../02-Attack-Simulation/Attack-Screenshots/09.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/3.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/3.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

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
- **Engineering Assessment:** NIDS signature SID 2010938 matched cleanly on unencrypted HTTP traffic. For TLS deployments, WAF or TLS termination inspection is required.

---

## Verdict

Confirmed True Positive SQL injection exploitation leading to database credential disclosure.

---

## MITRE ATT&CK

- **Tactic:** Initial Access
- **Technique:** Exploit Public-Facing Application (T1190)
