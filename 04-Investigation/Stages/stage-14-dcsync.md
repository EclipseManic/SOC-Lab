# Investigation — Stage 14 — DCSync

> **Status:** Completed  
> **Attack stage:** [Stage 14](../../02-Attack-Simulation/Stages/stage-14-dcsync.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-4174e3672e / wzb-846468a306` |
| **Rule ID** | `Wazuh 5715 (Level 8)` |
| **Source** | Wazuh SSHD on DVWA pivot |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh Rule 5715 alerted on root SSH session on DVWA pivot (192.168.56.30) executing Impacket secretsdump.py to replicate Active Directory directory objects over DRSUAPI.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Pivot Alerted) |
| **Confidence** | High |
| **Rationale** | Execution of DRSUAPI replication from an unauthorized Linux workstation using cracked Domain Admin credentials. |

---

## Investigation steps

1. Verified pivot SSH session alert wzb-4174e3672e during DCSync timestamp.
2. Checked DC Security log for Event ID 4662 (Directory Service Access with DS-Replication-Get-Changes-All extended right).
3. Noted DC Event 4662 was logged locally but level filter prevented forwarding; pivot SSH activity was alerted in TheHive.
4. Confirmed full domain credential disclosure including krbtgt NTLM hash.
5. Escalated incident to critical domain-wide compromise.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/46.png`](../../02-Attack-Simulation/Attack-Screenshots/46.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/12.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/12.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| User | `ad.lab\HANK_SHERMAN` | Domain Admin account abusing replication |
| DC | `PC-DC.ad.lab (192.168.56.10)` | Target Domain Controller |
| Target Hash | `krbtgt NTLM hash` | Compromised domain ticket-granting key |

---

## Detection assessment

- **Status:** Detected (Pivot Alerted)
- **Gap ID:** None
- **Engineering Assessment:** Pivot SSH activity alerted in TheHive. DC-side EID 4662 logged locally. Raising EID 4662 rule level provides direct target alerting.

---

## Verdict

Confirmed True Positive DCSync credential dumping detected via pivot session telemetry.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** OS Credential Dumping: DCSync (T1003.006)
