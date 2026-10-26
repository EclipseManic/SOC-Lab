# Investigation — Stage 04 — Hash Cracking

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 04](../../02-Attack-Simulation/Stages/stage-04-hash-crack.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | *None (Offline Activity)* |
| **Rule ID** | *N/A (DG-04)* |
| **Source** | Attacker GPU (Hashcat on Kali) |
| **Severity** | Informational |
| **TLP / PAP** | `TLP:WHITE` |

---

## What was detected

Adversary performed offline cryptographic cracking of the extracted MD5 administrative password hash on local Kali Linux hardware using Hashcat. No network traffic or target endpoint execution occurred.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | Inherent Offline Architectural Gap |
| **Confidence** | High |
| **Rationale** | Offline cryptographic computation produces zero network traffic and zero target endpoint process executions. |

---

## Investigation steps

1. Documented extraction of MD5 password hash from Stage 03 SQL injection dump.
2. Verified that no network traffic was generated to or from the victim environment during cracking.
3. Verified that no endpoint logs exist on DVWA, Win10, or DC during this phase.
4. Confirmed plaintext password recovery (password) via subsequent login in Stage 05.
5. Recorded DG-04 in the Detection Gap Register.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/10.png`](../../02-Attack-Simulation/Attack-Screenshots/10.png)
- **Alert Evidence:** *None (Offline Activity)*
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Hash (MD5) | `5f4dcc3b5aa765d61d8327deb882cf99` | Extracted admin password hash |
| Plaintext | `<REDACTED>` | Cracked credential |

---

## Detection assessment

- **Status:** Detection Gap (Offline)
- **Gap ID:** DG-04
- **Engineering Assessment:** Inherent offline gap. SOC defenses must focus on prevention (preventing database exfiltration) and post-crack credential use alerting.

---

## Verdict

Confirmed Inherent Offline Gap (DG-04). Cracking occurred entirely off-network.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Password Cracking (T1110.002)
