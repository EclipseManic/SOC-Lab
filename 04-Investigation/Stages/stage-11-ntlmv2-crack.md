# Investigation — Stage 11 — NTLMv2 Cracking

> **Status:** In Progress  
> **Attack stage:** [Stage 11](../../02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | *None (Offline Activity)* |
| **Rule ID** | *N/A (DG-11)* |
| **Source** | Attacker GPU (Hashcat on Kali) |
| **Severity** | Informational |
| **TLP / PAP** | `TLP:WHITE` |

---

## What was detected

Adversary cracked the captured `win10` NetNTLMv2 hash offline on Kali Linux using Hashcat. No target network traffic or host execution occurred.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | Inherent Offline Architectural Gap |
| **Confidence** | High |
| **Rationale** | Offline cryptographic computation produces zero network traffic and zero target endpoint process executions. |

---

## Investigation steps

1. Documented extraction of NetNTLMv2 hash from Stage 10 Responder output.
2. Verified zero network packets transmitted between Kali and victim subnets during cracking.
3. Verified no event logs generated on DomainWin10 or DC during cracking interval.
4. Confirmed plaintext password recovery via subsequent BloodHound authentication in Stage 12.
5. Recorded DG-11 in Detection Gap Register.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/31.png`](../../02-Attack-Simulation/Attack-Screenshots/31.png)
- **Alert Evidence:** *None (Offline Activity)*
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Account | `ad.lab\win10` | Targeted user account |
| Hash Format | `NetNTLMv2 (Hashcat mode 5600)` | Cryptographic material |
| Plaintext | `<REDACTED>` | Cracked domain credential |

---

## Detection assessment

- **Status:** Detection Gap (Offline)
- **Gap ID:** DG-11
- **Engineering Assessment:** Inherent offline gap. Mitigation requires GPO enforcement to disable LLMNR and NBT-NS across all domain endpoints.

---

## Verdict

Confirmed Inherent Offline Gap (DG-11). Cracking executed offline on attacker GPU.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Password Cracking (T1110.002)
