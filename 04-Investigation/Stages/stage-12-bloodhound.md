# Investigation — Stage 12 — BloodHound AD Recon

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 12](../../02-Attack-Simulation/Stages/stage-12-bloodhound.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-dbf3197ceb`, `wzb-1c8dc0ab5d` |
| **Rule ID** | Wazuh `5715` (Elevated Level 8 - Pivot SSH root logon) |
| **Source** | Linux SSHD (Pivot Host DVWA) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary connected via SSH to the DVWA pivot and launched SharpHound/BloodHound LDAP enumeration against Domain Controller `PC-DC` (`192.168.56.10`). Wazuh Rule 5715 flagged the pivot root authentication. Direct target-side LDAP query logging was not enabled (DG-12).

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Pivot Alerted; DG-12) |
| **Confidence** | High |
| **Rationale** | Administrative SSH session on the web pivot host immediately preceding mass LDAP directory queries. |

---

## Investigation steps

1. Correlated SSH root logon alert wzb-dbf3197ceb with execution of SharpHound.py.
2. Inspected DC security logs for LDAP search events.
3. Noted that DC lacked NTDS diagnostic logging (15 Field Engineering = 5) required for Event ID 1644 (DG-12).
4. Confirmed pivot SSH telemetry alerted the SOC to attacker presence.
5. Identified enumeration of HANK_SHERMAN SPN account in attacker output.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/33.png`](../../02-Attack-Simulation/Attack-Screenshots/33.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/10.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/10.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Pivot IP | `192.168.56.30` | Execution host |
| Target DC | `192.168.56.10:389` | LDAP target |
| Tool | `SharpHound.py` | AD enumeration utility |

---

## Detection assessment

- **Status:** Logging Gap (Pivot Alerted; DG-12)
- **Gap ID:** DG-12
- **Engineering Assessment:** DG-12 Documented: DC-side high-volume LDAP queries lacked specific EID 1644 alert, but pivot SSH session was detected and forwarded.

---

## Verdict

Confirmed True Positive AD reconnaissance detected via pivot host authentication telemetry.

---

## MITRE ATT&CK

- **Tactic:** Discovery
- **Technique:** Permission Groups Discovery: Domain Groups (T1069.002)
