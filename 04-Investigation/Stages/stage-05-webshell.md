# Investigation — Stage 05 — Web Shell Upload

> **Status:** Completed  
> **Attack stage:** [Stage 05](../../02-Attack-Simulation/Stages/stage-05-webshell.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-bbf93049b4` |
| **Rule ID** | `Wazuh 100214 / Auditd File Watch` |
| **Source** | Wazuh (Apache) / Linux Auditd on DVWA |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh Rule 100214 triggered on DVWA web upload directory monitoring. Auditd file watch (-w /var/www/html/hackable/uploads/ -p wa) generated a file creation event for executable PHP script shell.php.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Direct creation of an executable PHP script within a public-facing web upload directory following authenticated session. |

---

## Investigation steps

1. Verified Auditd event log (/var/log/audit/audit.log) for write activity in /var/www/html/hackable/uploads/.
2. Inspected created file shell.php for PHP command execution functions (system, exec, shell_exec).
3. Checked Apache access logs for GET requests invoking the newly uploaded shell.php.
4. Correlated with Wazuh Rule 100214 alert in TheHive.
5. Initiated incident response containment to isolate web server.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/16.png`](../../02-Attack-Simulation/Attack-Screenshots/16.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/4.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/4.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| File | `/var/www/html/hackable/uploads/shell.php` | Uploaded web shell |
| IP | `192.168.232.135` | Attacker workstation |
| User | `www-data` | Web server service account |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Auditd directory watch combined with Wazuh Rule 100214 provided high-confidence endpoint detection of the web shell drop.

---

## Verdict

Confirmed True Positive web shell installation on DVWA.

---

## MITRE ATT&CK

- **Tactic:** Persistence
- **Technique:** Server Software Component: Web Shell (T1505.003)
