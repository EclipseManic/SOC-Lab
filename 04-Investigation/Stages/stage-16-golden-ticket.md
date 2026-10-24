# Investigation — Stage 16 — Golden Ticket

> **Status:** Completed  
> **Attack stage:** [Stage 16](../../02-Attack-Simulation/Stages/stage-16-golden-ticket.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-8d45b2d236 / wzb-846468a306` |
| **Rule ID** | `Wazuh 5715 (Level 8)` |
| **Source** | Wazuh SSHD on DVWA pivot |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh Rule 5715 alerted on root SSH session on DVWA pivot executing Impacket ticketer.py to forge a Kerberos Ticket-Granting Ticket (TGT) using the dumped krbtgt NTLM hash.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Pivot Alerted) |
| **Confidence** | High |
| **Rationale** | Creation of an unauthorized Kerberos TGT with forged PAC claims granting perpetual Domain Admin rights. |

---

## Investigation steps

1. Verified pivot SSH session alert wzb-8d45b2d236 during ticket forgery execution.
2. Inspected DC Kerberos authentication logs for forged TGT presentation.
3. Confirmed creation of Kerberos credential cache (/tmp/admin.ccache) on pivot host.
4. Noted that DC logged Kerberos events locally; pivot SSH telemetry alerted TheHive queue.
5. Flagged enterprise domain ticket invalidation requirement (krbtgt double-reset).

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/54.png`](../../02-Attack-Simulation/Attack-Screenshots/54.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/14.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/14.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Forged User | `Administrator@ad.lab` | Forged administrative principal |
| File | `/tmp/admin.ccache` | Staged Kerberos credential cache |
| Domain SID | `S-1-5-21-...` | Domain security identifier |

---

## Detection assessment

- **Status:** Detected (Pivot Alerted)
- **Gap ID:** None
- **Engineering Assessment:** Pivot SSH activity alerted in TheHive. Target DC logged Kerberos service requests locally.

---

## Verdict

Confirmed True Positive Golden Ticket forgery detected via pivot session telemetry.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** Steal or Forge Kerberos Tickets: Golden Ticket (T1558.001)
