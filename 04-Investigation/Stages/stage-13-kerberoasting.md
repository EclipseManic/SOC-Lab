# Investigation — Stage 13 — Kerberoasting

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 13](../../02-Attack-Simulation/Stages/stage-13-kerberoasting.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-1d2d7fb4b8`, `wzb-c1e2642eb2` |
| **Rule ID** | Suricata SID `2019922` (ET Open Kerberos TGS-REQ) via `86601` + Wazuh `5715` |
| **Source** | Suricata Network IDS / Linux SSHD |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary requested a Kerberos service ticket (TGS-REQ) for service account `HANK_SHERMAN` to extract its crackable ticket. Suricata (operating in dual-interface mode, capturing intra-segment frames on `ens37` in promiscuous mode) flagged the Kerberos wire activity on port 88 (SID 2019922), and Wazuh Rule 5715 captured the pivot session.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Network & Pivot Alerted) |
| **Confidence** | High |
| **Rationale** | Kerberos TGS request packet captured on wire during Impacket GetUserSPNs.py ticket extraction targeting HANK_SHERMAN. |

---

## Investigation steps

1. Inspected Suricata alert wzb-c1e2642eb2 for Kerberos AS-REQ / TGS-REQ payload.
2. Verified promiscuous mode capture on router interface ens37.
3. Checked DC Security log for Event ID 4769 (Kerberos Service Ticket Request for HANK_SHERMAN with RC4 encryption 0x17).
4. Correlated with pivot SSH authentication alert wzb-1d2d7fb4b8.
5. Identified cracked HANK_SHERMAN Domain Admin account as compromised.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/41.png`](../../02-Attack-Simulation/Attack-Screenshots/41.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/11.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/11.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Target SPN | `ad.lab/HANK_SHERMAN` | Targeted Kerberos service principal |
| Encryption | `RC4-HMAC (0x17)` | Vulnerable ticket encryption |
| DC IP | `192.168.56.10:88` | Kerberos Key Distribution Center |

---

## Detection assessment

- **Status:** Detected (Network & Pivot Alerted)
- **Gap ID:** Pivot Telemetry
- **Engineering Assessment:** Suricata caught the Kerberos request via VMnet2 promiscuous sniffing; Wazuh alerted on the pivot session. DC Event 4769 was logged locally.

---

## Verdict

Confirmed True Positive Kerberoasting attack detected via wire signature and pivot session telemetry.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Steal or Forge Kerberos Tickets: Kerberoasting (T1558.003)
