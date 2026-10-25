# Investigation — Stage 10 — Responder Poisoning

> **Status:** Completed  
> **Attack stage:** [Stage 10](../../02-Attack-Simulation/Stages/stage-10-responder.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-7a4a134d1b` |
| **Rule ID** | Suricata SIDs `2067085`–`2067087` (`ET INFO NTLM Session Setup Request - Negotiate`) via Wazuh `86601` |
| **Source** | Suricata Network IDS |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary ran Responder on the DVWA pivot to intercept LLMNR/NBT-NS name resolution requests from `Win10User` (`192.168.56.20`), poisoning the request and capturing the NetNTLMv2 hash. Suricata flagged the inbound NTLM Session Setup over SMB (SIDs 2067085–2067087), escalating to TheHive.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Adversary ran Responder on pivot host answering LLMNR/NBT-NS broadcast requests and forcing NetNTLMv2 authentication. |

---

## Investigation steps

1. Verified Suricata fast.log for SIDs 2067085–2067087 on SMB traffic between 192.168.56.20 and 192.168.56.30.
2. Confirmed NTLMSSP negotiation packet structure in network capture.
3. Correlated with Responder logs on DVWA showing capture of win10 user NetNTLMv2 hash.
4. Noted that Suricata alerted on the NTLM session setup request rather than raw LLMNR UDP.
5. Escalated case for potential domain credential compromise.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/28.png`](../../02-Attack-Simulation/Attack-Screenshots/28.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/9.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/9.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Poisoner IP | `192.168.56.30` | DVWA pivot running Responder |
| Victim IP | `192.168.56.20` | Domain workstation (DomainWin10) |
| Account | `ad.lab\win10` | Captured domain user account |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Suricata SIDs 2067085–2067087 reliably flags inbound NTLM authentication negotiations over SMB.

---

## Verdict

Confirmed True Positive LLMNR/NBT-NS credential harvesting via Responder.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning and SMB Relay (T1557.001)
