# Investigation — Stage 19 — Exfiltration

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 19](../../02-Attack-Simulation/Stages/stage-19-exfiltration.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-34f34a857c` |
| **Rule ID** | Wazuh `5715` (Elevated Level 8 - 6 rapid SSH sessions in 0.57s) |
| **Source** | Linux SSHD (Pivot Host DVWA) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary exfiltrated collected archive data from the DVWA pivot back to Kali via SCP. While network payload was encrypted (DG-19), Wazuh Rule 5715 triggered on the burst of 6 administrative SSH connections within 0.57 seconds, escalating to TheHive.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Pivot Alerted; DG-19) |
| **Confidence** | High |
| **Rationale** | High-frequency SCP connection burst over SSH used to transfer staged sensitive data out of the network. |

---

## Investigation steps

1. Verified Wazuh logon_group correlation alert wzb-34f34a857c aggregating 6 SSH logons.
2. Analyzed auth.log on DVWA for scp execution parameters.
3. Noted that SSH transport encryption prevented Suricata deep-packet inspection of archive content (DG-19).
4. Confirmed exfiltration source as 192.168.56.30 and destination as 192.168.232.135.
5. Completed scope assessment for regulatory data breach reporting.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/56.png`](../../02-Attack-Simulation/Attack-Screenshots/56.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/17.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/17.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| File | `/tmp/data.tar.gz` | Exfiltrated archive |
| Channel | `SCP over SSH (22/TCP)` | Exfiltration protocol |
| Destination | `192.168.232.135` | Attacker workstation |

---

## Detection assessment

- **Status:** Detected (Pivot Alerted; DG-19)
- **Gap ID:** DG-19
- **Engineering Assessment:** DG-19 Documented: Network payload inspection was blind due to SSH encryption, but host-level session rate correlation caught the exfiltration burst.

---

## Verdict

Confirmed True Positive encrypted data exfiltration detected via host authentication rate anomaly.

---

## MITRE ATT&CK

- **Tactic:** Exfiltration
- **Technique:** Exfiltration Over C2 Channel (T1041)
