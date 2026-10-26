# Investigation — Stage 14 — DCSync

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 14](../../02-Attack-Simulation/Stages/stage-14-dcsync.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-4174e3672e` |
| **Rule ID** | Wazuh `5715` (Elevated Level 8 - Pivot SSH root logon) |
| **Source** | Linux SSHD (Pivot Host DVWA) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary utilized Impacket `secretsdump.py` via DRSUAPI directory replication against Domain Controller `PC-DC` (`192.168.56.10`), extracting all domain password hashes. Wazuh Rule 5715 captured the pivot execution session.

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

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/45.png`](../../02-Attack-Simulation/Attack-Screenshots/45.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/12.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/12.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

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
- **Gap ID:** Pivot Telemetry
- **Engineering Assessment:** Pivot SSH activity alerted in TheHive. DC-side EID 4662 logged locally. Raising EID 4662 rule level provides direct target alerting.

---

## Verdict

Confirmed True Positive DCSync credential dumping detected via pivot session telemetry.

---

## MITRE ATT&CK

- **Tactic:** Credential Access
- **Technique:** OS Credential Dumping: DCSync (T1003.006)
