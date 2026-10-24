# Investigation — Stage 09 — Internal Discovery

> **Status:** Completed  
> **Attack stage:** [Stage 09](../../02-Attack-Simulation/Stages/stage-09-internal-discovery.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-33519c2c62` |
| **Rule ID** | `Suricata SID 2000545 via Wazuh 86601 (Level 8)` |
| **Source** | Suricata on gateway (ens37 promiscuous capture) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Suricata network IDS captured port sweep traffic across internal subnet 192.168.56.0/24 originating from the DVWA pivot host (192.168.56.30), probing ports 88, 139, 445, and 389.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive (Network Alerted; DG-09) |
| **Confidence** | High |
| **Rationale** | Systematic multi-port scan targeting internal Active Directory infrastructure from a compromised web server. |

---

## Investigation steps

1. Inspected Suricata alerts on ens37 interface observing internal subnet traffic.
2. Identified source IP as DVWA pivot (192.168.56.30) probing DC (192.168.56.10) and Win10 (192.168.56.20).
3. Analyzed targeted ports corresponding to Kerberos, SMB, NetBIOS, and LDAP.
4. Noted that host-side auditd lacked command-line logging of ping sweeps (DG-09), but network capture succeeded.
5. Updated Case 02 scope to reflect internal reconnaissance.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/29.png`](../../02-Attack-Simulation/Attack-Screenshots/29.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/8.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/8.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Source IP | `192.168.56.30` | DVWA pivot host |
| Target Subnet | `192.168.56.0/24` | Internal victim subnet |
| Target Ports | `88, 139, 445, 389` | Active Directory core services |

---

## Detection assessment

- **Status:** Detected (Network Alerted)
- **Gap ID:** DG-09
- **Engineering Assessment:** DG-09 Documented: Intra-subnet layer 2 packets did not cross gateway IP stack, but promiscuous capture on ens37 caught multi-host sweep traffic.

---

## Verdict

Confirmed True Positive internal network reconnaissance alerted via NIDS promiscuous capture.

---

## MITRE ATT&CK

- **Tactic:** Discovery
- **Technique:** Remote System Discovery (T1018)
