# Investigation — Stage 15 — Pass-the-Hash

> **Status:** Completed  
> **Attack stage:** [Stage 15](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-c1e2642eb2 / wzb-4624-pth` |
| **Rule ID** | `Wazuh Rule 60122 (Windows EID 4624) + Suricata 86601` |
| **Source** | Wazuh Windows Agent on DomainWin10 |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Wazuh Rule 60122 triggered 24+ times on DomainWin10 (192.168.56.20): 'Successful Remote Logon Detected - User:\Administrator - NTLM authentication, possible pass-the-hash attack.' Logon Type 3 via NtLmSsp from DVWA (192.168.56.30).

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Remote administrative authentication over SMB using NTLM instead of Kerberos within an Active Directory domain environment. |

---

## Investigation steps

1. Inspected Wazuh alerts CSV confirming 24 occurrences of Rule 60122 on DomainWin10.
2. Verified Windows Security Event ID 4624: LogonType=3, AuthenticationPackage=NTLM, LogonProcessName=NtLmSsp.
3. Identified source IP as DVWA pivot (192.168.56.30) connecting to target 192.168.56.20.
4. Confirmed administrative session established without Kerberos pre-authentication.
5. Marked Case 03 scope as active lateral movement into Windows domain member.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/50.png`](../../02-Attack-Simulation/Attack-Screenshots/50.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/13.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/13.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| User | `Administrator` | Target administrative account |
| Logon Type | `3 (Network)` | Remote network logon |
| Package | `NtLmSsp` | NTLM authentication package |
| Source IP | `192.168.56.30` | Pivot workstation |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Wazuh Rule 60122 specifically detects NTLM network logons for administrative accounts, generating strong empirical evidence in alerts CSV.

---

## Verdict

Confirmed True Positive Pass-the-Hash lateral movement detected via Windows Security Event ID 4624.

---

## MITRE ATT&CK

- **Tactic:** Lateral Movement
- **Technique:** Use Alternate Authentication Material: Pass the Hash (T1550.002)
