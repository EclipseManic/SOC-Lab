# Detection Coverage Matrix — MITRE ATT&CK Mapping

## Overview

This matrix maps each of the 20 attack stages in the campaign to its corresponding MITRE ATT&CK technique, primary data source, detection rule ID, validation status, and visual evidence.

Every entry represents an empirical result executed in the lab environment.

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
| **03** | SQL Injection | `T1190` | Web Logs / Network IDS | ET WEB_SERVER SELECT USER SQL Injection | Wazuh `100201` / SID `2010937` | **Detected** | - | Alert 17 (`4.png`, `4.1.png`) |
| **04** | Hash Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local GPU Hashcat Execution)* | *N/A* | **Not Detected** | [DG-04](gaps.md#dg-04--offline-credential-cracking-stage-04) | *Offline Activity (No Telemetry)* |
| **05** | Web Shell Upload | `T1505.003` | Network IDS / Web POST | ET WEB_SERVER PHP System Command in POST | Wazuh `100600` / SID `2014726` | **Detected** | - | Alert 21, 22 (`6.1.png`, `6.2.png`) |
| **06** | Reverse Shell | `T1059.004` | Network Connection / IDS | ET POLICY Outbound Reverse Shell Connection | Wazuh `86601` / SID `2002752` | **Detected** | - | Alert 5 (`5.png`) |
| **07** | Privilege Escalation | `T1548.003` | Linux Auth / PAM | Sudo command execution by service user (`www-data`) | Wazuh `5402` (PAM) | **Detected** | - | Alert 6 (`6.png`, `6.3.png`) |
| **08** | SSH Persistence | `T1098.004` | FIM / Linux Auth | File added to `/root/.ssh/authorized_keys` | Wazuh `550` (Syscheck FIM) | **Detected** | - | Alert 7 (`7.png`, `7.1.png`) |
| **09** | Internal Discovery | `T1018` | Network IDS | Potential Internal Network Port Scan | Wazuh `86601` / SID `2000545` | **Detected** | [DG-09](gaps.md#dg-09--intra-subnet-scan-visibility-stage-09) | Alert 8 (`8.png`, `8.1.png`) |
| **10** | Responder Poisoning | `T1557.001` | Network IDS | ET SCAN Potential LLMNR/NBT-NS Poisoning Response | Wazuh `86601` / SID `2013028` | **Detected** | - | Alert 9 (`9.png`–`9.3.png`) |
| **11** | NTLMv2 Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local Hashcat on Kali)* | *N/A* | **Not Detected** | [DG-11](gaps.md#dg-11--offline-ntlmv2-hash-cracking-stage-11) | *Offline Activity (No Telemetry)* |
| **12** | BloodHound AD Recon | `T1087.002` | Linux Auth / Pivot Audit | SSH authentication success (Root pivot session) | Wazuh `5715` | **Detected** (Pivot) | [DG-12](gaps.md#dg-12--ldap-enumeration-telemetry-gap-stage-12) | `[4x] [DVWA] Logon activity: ROOT` (`10.png`) |
| **13** | Kerberoasting | `T1558.003` | Kerberos / Windows Security | Kerberos TGS request anomaly (RC4 encryption) | Windows EID `4769` / Wazuh `60107` | **Detected** | - | Alert 13 (`13.png`) |
| **14** | DCSync | `T1003.006` | Directory Service / DRSUAPI | DS Access / Replication rights requested | Windows EID `4662` / Wazuh `60144` | **Detected** | - | Alert 14 (`14.png`) |
| **15** | Pass-the-Hash | `T1550.002` | Network IDS / SMB Auth | ET EXPLOIT Possible GoldenPac Priv Esc in-use | Wazuh `86601` / SID `2015862` | **Detected** | - | Alert 15 (`15.png`, `15.5.png`) |
| **16** | Golden Ticket | `T1558.001` | Kerberos / DC Security | TGS request without matching AS-REQ / RC4 | Windows EID `4769` / Wazuh `5715` | **Detected** | - | Alert 16 (`16.png`, `16.5.png`) |
| **17** | DC Persistence | `T1136.002` | Sysmon / Process / AD Auth | Impacket `wmiexec` execution / User added to DA | Wazuh `100613`, `60109` | **Detected** | - | Alert 17 (`17.png`–`17.6.png`) |
| **18** | Data Collection | `T1005` | Sysmon Process Monitoring | Impacket `wmiexec` (`net user`, `whoami /all`, `type`) | Wazuh `100613` (Fan-out) | **Detected** | - | Alert 18 (`18.png`–`18.2.png`) |
| **19** | Exfiltration | `T1041` | Linux Auth / Secure Transport | Administrative SSH burst (Data staging & SCP) | Wazuh `5715` (6 sessions / 1s) | **Detected** (Pivot) | [DG-19](gaps.md#dg-19--encrypted-c2-transport-payload-gap-stage-19) | Alert 19 (`19.png`) |
| **20** | Impact (Defacement) | `T1491.001` | Sysmon / Network IDS / Auth | Impacket `wmiexec` registry change / Wallpaper drop | Wazuh `100613`, `100100`, `86601` | **Detected** | - | Alert 20 (`20.png`–`22.4.png`) |

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
- [Attack Simulation Overview](../../02-Attack-Simulation/README.md)
