# Investigation — Stage 09 — Internal Discovery

> **Status:** Draft, not yet validated  
> **Attack stage:** [Stage 09](../../02-Attack-Simulation/Stages/stage-09-internal-discovery.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-3152e3ed59`, `wzb-f87fab3eda`, `wzb-de91bad685` |
| **Rule ID** | Suricata SIDs `3400001`, `3400002`, `3400020` on `ens37` via Wazuh `86601` |
| **Source** | Suricata Network IDS (`ens37` promiscuous capture) |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary executed internal network reconnaissance sweeps from the DVWA pivot against `192.168.56.0/24`. Suricata listening in AF-PACKET promiscuous mode on `ens37` captured 14 victim-to-victim alerts including Nmap probe signatures (SIDs 3400001/3400002) and Metasploit scans (SID 3400020), which escalated to TheHive.

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

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/21.png`](../../02-Attack-Simulation/Attack-Screenshots/21.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/8.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/8.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Source IP | `192.168.56.30` | DVWA pivot host |
| Target Subnet | `192.168.56.0/24` | Internal victim subnet |
| Target Ports | `88, 139, 445, 389` | Active Directory core services |

---

## Detection assessment

- **Status:** Logging Gap (Network Alerted; DG-09)
- **Gap ID:** DG-09
- **Engineering Assessment:** DG-09 Documented: Intra-subnet layer 2 packets did not cross gateway IP stack, but promiscuous capture on ens37 caught multi-host sweep traffic.

---

## Verdict

Confirmed True Positive internal network reconnaissance alerted via NIDS promiscuous capture.

---

## MITRE ATT&CK

- **Tactic:** Discovery
- **Technique:** Remote System Discovery (T1018)
