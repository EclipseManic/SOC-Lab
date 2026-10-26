# Investigation — Stage 15 — Pass-the-Hash

> **Status:** In Progress  
> **Attack stage:** [Stage 15](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md)  
> **TheHive case:** [Domain Compromise and Impact](../Cases/case-03-domain-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-b7f91cd3ab`–`ccff195e0c` & 24x CSV |
| **Rule ID** | Windows EID `4624` (Logon Type 3 NTLM: 15 Win10, 9 DC) / Wazuh `100613` (WMI Fan-out) |
| **Source** | Windows Security Log / Wazuh Process Correlation |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary executed Pass-the-Hash remote logons over SMB using NTLM authentication, logging 24 instances of Windows Event ID 4624 Logon Type 3 across both `Win10User` (15 events) and `DomainWin10` (9 events). In TheHive, Impacket WMI fan-out commands escalated under Wazuh Rule 100613.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Remote administrative authentication over SMB using NTLM instead of Kerberos within an Active Directory domain environment. |

---

## Investigation steps

1. Inspected Wazuh alerts CSV confirming 24 occurrences of Windows Event ID 4624 on DomainWin10.
2. Verified Windows Security Event ID 4624: LogonType=3, AuthenticationPackage=NTLM, LogonProcessName=NtLmSsp.
3. Identified source IP as DVWA pivot (192.168.56.30) connecting to target 192.168.56.20.
4. Confirmed administrative session established without Kerberos pre-authentication.
5. Marked Case 03 scope as active lateral movement into Windows domain member.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/48.png`](../../02-Attack-Simulation/Attack-Screenshots/48.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/13.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/13.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

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

- **Status:** Detected (Host & Pivot Alerted)
- **Gap ID:** None
- **Engineering Assessment:** Wazuh Windows Event ID 4624 specifically detects NTLM network logons for administrative accounts, generating strong empirical evidence in alerts CSV.

---

## Verdict

Confirmed True Positive Pass-the-Hash lateral movement detected via Windows Security Event ID 4624.

---

## MITRE ATT&CK

- **Tactic:** Lateral Movement
- **Technique:** Use Alternate Authentication Material: Pass the Hash (T1550.002)
