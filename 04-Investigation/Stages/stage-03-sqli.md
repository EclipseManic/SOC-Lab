# Investigation — Stage 03 — SQL Injection

> **Status:** Completed  
> **Attack stage:** [Stage 03](../../02-Attack-Simulation/Stages/stage-03-sqli.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | Suricata Wire Alert (Row 9108) & Wazuh Rule 31106 |
| **Rule ID** | Suricata SID `2010963` (`ET WEB_SERVER SELECT USER`) / Wazuh `31106` |
| **Source** | Suricata Network IDS (`ens33`) / Wazuh (Apache Access Logs) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

The adversary submitted an SQL injection payload targeting `/vulnerabilities/sqli/`:
`GET /vulnerabilities/sqli/?id=1%27+UNION+SELECT+user%2C+password+FROM+users--+-&Submit=Submit HTTP/1.1`
Suricata on `ens33` flagged the request under signature SID `2010963` (`ET WEB_SERVER SELECT USER SQL Injection Attempt in URI`, Row 9108 in raw CSV). Concurrently, Wazuh on DVWA logged Rule `31106` (*A web attack returned code 200 (success)*, Row 9109) and 5 occurrences of Rule `31103` (*SQL injection attempt*). Because these alerts operated at Level 6 (below the $\ge 8$ SOAR escalation threshold), they were preserved in raw telemetry rather than creating a separate incident in TheHive. (The separate TheHive alert `wzb-10160d36c2` corresponds to the Stage 01/02 automated Nikto fuzzing scan matching the `/etc/passwd` watchlist).

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
