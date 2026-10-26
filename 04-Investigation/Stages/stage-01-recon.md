# Investigation — Stage 01 — Reconnaissance

> **Status:** In Progress  
> **Attack stage:** [Stage 01](../../02-Attack-Simulation/Stages/stage-01-recon.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-3a8045a03c`, `wzb-6a39ab2a3d`, `wzb-4de933ca95` |
| **Rule ID** | Wazuh `100410` (Level 10) / Suricata SID `2018489`, `3400001`, `3400002` (via `86601`) |
| **Source** | Wazuh (Apache) / Suricata (Network IDS) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Suricata network IDS flagged inbound port scans and Nmap probes from Kali Linux (`192.168.232.135`). Simultaneously, Wazuh Rule 100410 triggered on DVWA after exceeding the threshold of 10 HTTP 4xx error responses within a 15-second window during automated web directory fuzzing.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Synchronized network port scanning and high-rate web enumeration from an external IP directly targeting public services. |

---

## Investigation steps

1. Verified Suricata fast.log and eve.json for SID 2000545 (ET SCAN Nmap Scripting Engine User-Agent).
2. Analyzed Apache access logs on DVWA (/var/log/apache2/access.log) for bursts of 404 responses.
3. Correlated HTTP 4xx flood with Wazuh Rule 100410 in TheHive case queue.
4. Confirmed attacker source IP as 192.168.232.135 targeting port 80/TCP.
5. Escalated case to active reconnaissance phase.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/1.png`](../../02-Attack-Simulation/Attack-Screenshots/1.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/1.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/1.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Attacker workstation (Kali Linux) |
| Port | `80/TCP` | Target web service (DVWA) |
| User-Agent | `Mozilla/5.0 (compatible; Nmap Scripting Engine)` | Scanning fingerprint |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Both network-level port scan signatures and host-level web server error bursts fired with low latency. Zero false positives observed.

---

## Verdict

Confirmed True Positive reconnaissance activity targeting the DVWA web application.

---

## MITRE ATT&CK

- **Tactic:** Reconnaissance
- **Technique:** Active Scanning (T1595)
