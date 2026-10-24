# Detection Coverage Matrix — MITRE ATT&CK Mapping

## Overview

This matrix maps each of the 20 attack stages in the campaign to its corresponding MITRE ATT&CK technique, primary data source, detection rule ID, validation status, and visual/empirical alert evidence.

Every entry represents an empirical result executed in the lab environment, cross-referenced with raw alert exports in [`06-Resources/Alerts/thehive_alerts.json`](../06-Resources/Alerts/thehive_alerts.json) and [`06-Resources/Alerts/wazuh_alerts.csv`](../06-Resources/Alerts/wazuh_alerts.csv).

## Status Legend

| Status | Definition | Count |
|---|---|---|
| **Detected** | Telemetry was collected, a detection rule matched, and an alert reached TheHive | **16** |
| **Not Detected (Offline Gap)** | The attack technique occurred offline on the attacker workstation; no telemetry exists on victim infrastructure | **2** |
| **Partial Detection (Logging Gap)** | Host pivot telemetry was alerted; intra-subnet target-side LDAP/RPC activity was not directly alerted | **2** |

---

## 20-Stage Coverage Matrix

| # | Stage | ATT&CK | Required Data Source | Rule / Analytic Name | Rule ID / SID | Status | Gap ID | TheHive Alert Evidence |
|---|---|---|---|---|---|---|---|---|
| **01** | Reconnaissance | `T1595.001` | Network Flow / IDS | ET SCAN NMAP OS Detection Probe / Portscan | `86601` / SID `3400002` | **Detected** | - | `wzb-3a8045a03c` (`1.png`–`1.3.png`) |
| **02** | Web Brute Force | `T1110.001` | Web Server Access Logs | Multiple common web attacks from same source | Wazuh `31153`, `31151` | **Detected** | - | `wzb-81becfcc8d` (`2.png`–`2.7.png`) |
| **03** | SQL Injection | `T1190` | Web Logs / Network IDS | ET WEB_SERVER SELECT USER SQL Injection | Wazuh `100201` / SID `2010937` | **Detected** | - | `wzb-10160d36c2` (`4.png`, `4.1.png`) |
| **04** | Hash Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local GPU Hashcat Execution)* | *N/A* | **Not Detected** | [DG-04](gaps.md#dg-04--offline-credential-cracking-stage-04) | *Offline Activity (No Telemetry)* |
| **05** | Web Shell Upload | `T1505.003` | Network IDS / Web POST | ET WEB_SERVER PHP System Command in POST | Wazuh `100600` / SID `2014726` | **Detected** | - | `wzb-e9a1797ac4`, `wzb-61ed72e937` (`6.1.png`, `6.2.png`) |
| **06** | Reverse Shell | `T1059.004` | Network Connection / IDS | ET POLICY Outbound Reverse Shell Connection | Wazuh `86601` / SID `2002752` | **Detected** | - | `wzb-f87fab3eda` (`5.png`) |
| **07** | Privilege Escalation | `T1548.003` | Linux Auth / PAM | Sudo command execution by service user (`www-data`) | Wazuh `5402` (PAM) | **Detected** | - | `wzb-ccae331b77` (`6.png`, `6.3.png`) |
| **08** | SSH Persistence | `T1098.004` | FIM / Linux Auth | File added to `/root/.ssh/authorized_keys` | Wazuh `550` (Syscheck FIM) | **Detected** | - | `wzb-1c8dc0ab5d` (`7.png`, `7.1.png`) |
| **09** | Internal Discovery | `T1018` | Network IDS | Potential Internal Network Port Scan | Wazuh `86601` / SID `2000545` | **Detected** | [DG-09](gaps.md#dg-09--intra-subnet-scan-visibility-stage-09) | `wzb-3152e3ed59` (`8.png`, `8.1.png`) |
| **10** | Responder Poisoning | `T1557.001` | Network IDS | ET SCAN Potential LLMNR/NBT-NS Poisoning Response | Wazuh `86601` / SID `2013028` | **Detected** | - | `wzb-7a4a134d1b` (`9.png`–`9.3.png`) |
| **11** | NTLMv2 Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local Hashcat on Kali)* | *N/A* | **Not Detected** | [DG-11](gaps.md#dg-11--offline-ntlmv2-hash-cracking-stage-11) | *Offline Activity (No Telemetry)* |
| **12** | BloodHound AD Recon | `T1087.002` | Linux Auth / Pivot Audit | SSH authentication success (Root pivot session) | Wazuh `5715` | **Detected** (Pivot) | [DG-12](gaps.md#dg-12--ldap-enumeration-telemetry-gap-stage-12) | `wzb-dbf3197ceb` (`10.png`) |
| **13** | Kerberoasting | `T1558.003` | Kerberos / Windows Security | Kerberos TGS request anomaly (RC4 encryption) | Windows EID `4769` / Wazuh `60107` | **Detected** | - | `wzb-1d2d7fb4b8` (`13.png`) |
| **14** | DCSync | `T1003.006` | Directory Service / DRSUAPI | DS Access / Replication rights requested | Windows EID `4662` / Wazuh `60144` | **Detected** | - | `wzb-4174e3672e` (`14.png`) |
| **15** | Pass-the-Hash | `T1550.002` | Network IDS / SMB Auth | ET EXPLOIT Possible GoldenPac Priv Esc in-use | Wazuh `86601` / SID `2015862` | **Detected** | - | `wzb-c1e2642eb2` (`15.png`, `15.5.png`) |
| **16** | Golden Ticket | `T1558.001` | Kerberos / DC Security | TGS request without matching AS-REQ / RC4 | Windows EID `4769` / Wazuh `5715` | **Detected** | - | `wzb-8d45b2d236` (`16.png`, `16.5.png`) |
| **17** | DC Persistence | `T1136.002` | Sysmon / Process / AD Auth | Impacket `wmiexec` execution / User added to DA | Wazuh `100613`, `60109` | **Detected** | - | `wzb-26b4d06a63`, `wzb-299a007168` (`17.png`–`17.6.png`) |
| **18** | Data Collection | `T1005` | Sysmon Process Monitoring | Impacket `wmiexec` (`net user`, `whoami /all`, `type`) | Wazuh `100613` (Fan-out) | **Detected** | - | `wzb-aa66cb916a`, `wzb-ed666653f7` (`18.png`–`18.2.png`) |
| **19** | Exfiltration | `T1041` | Linux Auth / Secure Transport | Administrative SSH burst (Data staging & SCP) | Wazuh `5715` (6 sessions / 1s) | **Detected** (Pivot) | [DG-19](gaps.md#dg-19--encrypted-c2-transport-payload-gap-stage-19) | `wzb-34f34a857c` (`19.png`) |
| **20** | Impact (Defacement) | `T1491.001` | Sysmon / Network IDS / Auth | Impacket `wmiexec` registry change / Wallpaper drop | Wazuh `100613`, `100100`, `86601` | **Detected** | - | `wzb-71ef983ad8`, `wzb-1f43c1540f` (`20.png`–`22.4.png`) |

---

## Performance Metrics Summary

```text
Total Attack Stages Executed:           20
Verified Detections with Alerts:        16  (80.0%)
Inherent Offline Gaps (No Telemetry):    2  (10.0% - Stages 04, 11)
Partial / Protocol Logging Gaps:         2  (10.0% - Stages 09, 12)
Rule Failures:                           0   (0.0%)
```

## Related Documents

- [Detection Gap Register](gaps.md)
- [Wazuh Rules Catalog](Wazuh/rules.md)
- [Suricata Signatures](Suricata/rules.md)
- [thecustomhive Alert Pipeline](pipeline-thecustomhive.md)
- [Raw Alert Exports Catalog](../06-Resources/README.md#alert-evidence-exports)
- [Attack Simulation Overview](../02-Attack-Simulation/README.md)
