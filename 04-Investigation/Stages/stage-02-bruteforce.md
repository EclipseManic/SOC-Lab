# Investigation — Stage 02 — Brute Force

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 02](../../02-Attack-Simulation/Stages/stage-02-bruteforce.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-81becfcc8d`, `wzb-6a22425401`, `wzb-8b2c36ea17` |
| **Rule ID** | Wazuh `100213` (Level 10), Wazuh `31153` / Suricata SID `2000547` (via `86601`) |
| **Source** | Wazuh (Apache) / Suricata (Network IDS) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Suricata and Wazuh flagged an aggressive HTTP POST credential brute-force attack against `/login.php` using custom Python automation (`dvwa_bruteforce.py`) from `192.168.232.135`. Wazuh Rule 100213 alerted on multiple 401 Unauthorized responses, while Suricata SID 2017515 / 2000547 detected `python-requests` user-agent patterns.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | High-velocity credential stuffing against the DVWA authentication interface from the known recon IP. |

---

## Investigation steps

1. Inspected DVWA Apache access logs for rapid POST requests to /dvwa/login.php.
2. Verified 401 Unauthorized response codes exceeding threshold within 15 seconds.
3. Confirmed Suricata signature match for automated Python brute-force tooling (`python-requests` / 4xx burst).
4. Identified target account under attack (admin).
5. Checked for eventual HTTP 302/200 success response indicating successful compromise.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/6.png`](../../02-Attack-Simulation/Attack-Screenshots/6.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/2.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/2.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Attacker workstation (Kali Linux) |
| URI | `/dvwa/login.php` | Authentication target endpoint |
| User | `admin` | Targeted account name |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Rule 100213 provided clear threshold-based detection with minimal compute overhead.

---

## Verdict

Confirmed True Positive brute-force credential stuffing attack against DVWA.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Password Spraying / Brute Force (T1110.001)
