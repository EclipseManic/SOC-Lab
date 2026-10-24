# Investigation — Stage 02 — Brute Force

> **Status:** Completed  
> **Attack stage:** [Stage 02](../../02-Attack-Simulation/Stages/stage-02-bruteforce.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-51c6a2fa5f` |
| **Rule ID** | `Wazuh 100213 / Suricata SID 2000547` |
| **Source** | Wazuh (Apache) / Suricata (Network IDS) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Suricata detected a rapid burst of HTTP POST authentication attempts matching Hydra dictionary attack signatures (SID 2000547). Wazuh Rule 100213 triggered upon detecting 8 failed authentication attempts (HTTP 401 Unauthorized) within a 15-second window on /dvwa/login.php.

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
3. Confirmed Suricata signature match for Hydra brute-force tooling.
4. Identified target account under attack (admin).
5. Checked for eventual HTTP 302/200 success response indicating successful compromise.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/05.png`](../../02-Attack-Simulation/Attack-Screenshots/05.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/2.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/2.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

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
