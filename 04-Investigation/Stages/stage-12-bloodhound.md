# Investigation — Stage 12 — BloodHound AD Recon

> **Status:** Completed  
> **Attack stage:** [Stage 12](../../02-Attack-Simulation/Stages/stage-12-bloodhound.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-dbf3197ceb / wzb-846468a306` |
| **Rule ID** | `Wazuh 5715 (Level 8)` |
| **Source** | Wazuh SSHD on DVWA pivot |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh Rule 5715 triggered on interactive root SSH logon to DVWA pivot from Kali (192.168.232.135). From this session, the attacker staged and executed SharpHound/BloodHound LDAP enumeration targeting PC-DC.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Pivot Alerted; DG-12) |
| **Confidence** | High |
| **Rationale** | Administrative SSH session on the web pivot host immediately preceding mass LDAP directory queries. |

---

## Investigation steps

1. Correlated SSH root logon alert wzb-846468a306 with execution of SharpHound.py.
2. Inspected DC security logs for LDAP search events.
3. Noted that DC lacked NTDS diagnostic logging (15 Field Engineering = 5) required for Event ID 1644 (DG-12).
4. Confirmed pivot SSH telemetry alerted the SOC to attacker presence.
5. Identified enumeration of HANK_SHERMAN SPN account in attacker output.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/38.png`](../../02-Attack-Simulation/Attack-Screenshots/38.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/10.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/10.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Pivot IP | `192.168.56.30` | Execution host |
| Target DC | `192.168.56.10:389` | LDAP target |
| Tool | `SharpHound.py` | AD enumeration utility |

---

## Detection assessment

- **Status:** Detected (Pivot Alerted)
- **Gap ID:** DG-12
- **Engineering Assessment:** DG-12 Documented: DC-side high-volume LDAP queries lacked specific EID 1644 alert, but pivot SSH session was detected and forwarded.

---

## Verdict

Confirmed True Positive AD reconnaissance detected via pivot host authentication telemetry.

---

## MITRE ATT&CK

- **Tactic:** Discovery
- **Technique:** Permission Groups Discovery: Domain Groups (T1069.002)
