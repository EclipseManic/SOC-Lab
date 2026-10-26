# Investigation — Stage 10 — Responder Poisoning

> **Status:** In Progress  
> **Attack stage:** [Stage 10](../../02-Attack-Simulation/Stages/stage-10-responder.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | None (Pivot Log Only — Sheet Row 9233 / CSV Row 9231) |
| **Rule ID** | Wazuh `bashcmd` (uid:0 Responder.py execution on pivot) |
| **Source** | Linux Auth / Pivot Host DVWA (`bashcmd`) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

The adversary launched Responder on the DVWA pivot at $T_0 + 26m$ (`17:36:26+05:30`), captured via Wazuh bashcmd logging (`python3 /opt/Responder/Responder.py -I ens33 -wd`, Sheet row 9233 / CSV data row 9231). At $T_0 + 28m$ (`17:38:29`), the captured NetNTLMv2 hash was copied to `/tmp/win10.hash` (Sheet row 9244 / CSV data row 9242). This command-line activity was logged locally on the pivot host at Level 5 without SIEM-to-SOAR escalation. (Note: Alert `wzb-7a4a134d1b`, which captured Suricata SIDs 2067085–2067087 NTLM Session Setup over SMB, occurred at 12:53:59 during Stage 20 remote execution against Win10).

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Adversary ran Responder on pivot host answering LLMNR/NBT-NS broadcast requests and forcing NetNTLMv2 authentication. |

---

## Investigation steps

1. Identified interactive Responder launch in `/var/log/bashcmd.log` on DVWA (`python3 /opt/Responder/Responder.py -I ens33 -wd`).
2. Confirmed extraction of captured NetNTLMv2 hash to `/tmp/win10.hash` via shell command logging at 17:38:29.
3. Noted that raw LLMNR/NBT-NS multicast frames did not trigger a high-severity alert on the gateway wire. (The separate SMB NTLM Session Setup alerts, SIDs 2067085–2067087 / `wzb-7a4a134d1b`, occurred later at 12:53:59 during Stage 20 remote execution).
4. Correlated host command history with downstream offline cracking attempts (Stage 11) and domain authentication.
5. Escalated incident case for potential domain credential compromise.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/28.png`](../../02-Attack-Simulation/Attack-Screenshots/28.png)
- **Alert Evidence:** *Pivot Logged (Sheet Row 9233 / CSV Row 9231 in `Wazuh-Raw-Alerts.csv`)*
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

- **Status:** Detected (Pivot Telemetry)
- **Gap ID:** None
- **Engineering Assessment:** Suricata SIDs 2067085–2067087 reliably flags inbound NTLM authentication negotiations over SMB.

---

## Verdict

Confirmed True Positive LLMNR/NBT-NS credential harvesting via Responder.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning and SMB Relay (T1557.001)
