# Incident Report — SOC Lab Attack Simulation

## Report Metadata

| Field | Value |
|---|---|
| **Incident ID** | `SOC-LAB-2026-01` |
| **Report Status** | Final / Resolved |
| **Classification** | Simulated Multi-Stage Enterprise Intrusion |
| **Overall Severity** | Critical (Domain Compromise) |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |
| **Affected Scope** | Perimeter Web (DVWA), Workstation (DomainWin10), Active Directory Domain Controller (PC-DC) |
| **Lead Analyst** | SOC Engineering Team |
| **Related Cases** | [Case 01](../04-Investigation/Cases/case-01-web-compromise.md), [Case 02](../04-Investigation/Cases/case-02-lateral-movement.md), [Case 03](../04-Investigation/Cases/case-03-domain-compromise.md) |

---

## 1. Executive Summary

[![Consolidated Incident Response 74-Minute Timeline](../06-Resources/Diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)](../06-Resources/Diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)
*Figure 1: Full chronological incident timeline spanning 74 minutes ($T_0$ to $T_0 + 74\text{m}$), correlating attacker milestones (top) against blue-team detection alerts across Suricata, Auditd, Wazuh, Sysmon, and TheHive (bottom) ([view full asset](../06-Resources/Diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)).*

An advanced multi-stage cyber intrusion was simulated across the hybrid enterprise lab environment, originating from external IP `192.168.232.135` (Kali Linux) and culminating in complete Tier 0 Active Directory domain compromise. The adversary breached the perimeter by exploiting a SQL injection vulnerability on the DVWA server (`192.168.56.30`), dropping a PHP web shell, executing an interactive reverse shell, and escalating privileges to `root` via a passwordless sudo Python misconfiguration (`sudo /usr/bin/python3` GTFOBins). 

Establishing SSH persistence, the adversary used the compromised web server as a pivot into the internal network (`192.168.56.0/24`), poisoned LLMNR requests using Responder to capture domain credentials, enumerated Active Directory via BloodHound/SharpHound, kerberoasted Domain Admin `HANK_SHERMAN`, and executed DCSync directory replication via DRSUAPI. Using the dumped domain secrets, the adversary conducted Pass-the-Hash lateral movement to Windows 10 (`192.168.56.20`), forged a Kerberos Golden Ticket (`krbtgt`), created a persistent backdoor Domain Admin account, staged and exfiltrated sensitive data via SCP, and deployed registry-driven defacement and extortion artifacts across domain endpoints.

The detection architecture successfully detected **16 of 20 stages (80.0%)**, with **2 stages representing inherent offline computation** (Stages 04 and 11, producing zero victim telemetry) and **2 stages identified as protocol logging gaps** (Stages 09 and 12, successfully detected on alternate sensor layers). Zero rule execution failures occurred.

---

## 2. Scope and Affected Assets

| Asset | Operating System | IP Address | Role | Impact |
|---|---|---|---|---|
| **DVWA** | Ubuntu 24.04 LTS | `192.168.56.30` | Web Application Server | Compromised: Web shell drop, reverse shell, root escalation, operational pivot. |
| **Win10** (`Win10User`) | Windows 10 Enterprise | `192.168.56.20` | Domain Workstation | Compromised: LLMNR credential harvesting, Pass-the-Hash remote logon, defacement. |
| **PC-DC** (`DomainWin10`) | Windows Server 2022 | `192.168.56.10` | Domain Controller (AD DS / DNS) | Compromised: DCSync replication, Golden Ticket forgery, backdoor Domain Admin creation. |
| **Suricata Gateway** | Ubuntu 24.04 LTS | `192.168.56.1` / `10.122.0.x` | Dual-Homed Gateway / WireGuard Hub | Uncompromised: Monitored traffic and forwarded NIDS alerts to Cloud SIEM. |
| **Cloud SOC** | Ubuntu 24.04 LTS | `10.122.0.4` / `10.122.1.4` | TheHive 5 / Wazuh Manager | Uncompromised: Ingested, correlated, and alerted on incident telemetry in real time. |

---

## 3. Detection & Analysis

### 3.1 Detection Performance Metrics

```text
Total Attack Stages Executed:           20
Verified Detections with Alerts:        16  (80.0%)
Inherent Offline Gaps (Zero Telemetry):  2  (10.0% - Stages 04, 11)
Partial / Protocol Logging Gaps:         2  (10.0% - Stages 09, 12)
Encrypted Transport Gap:                 1  (DG-19: Documented / Pivot Alerted)
Rule Failures:                           0   (0.0%)
Total Baseline Raw Alerts in OpenSearch: 9,567 rows (Wazuh-Raw-Alerts.csv)
Analyst Curated Forensic Set:            808 rows (wazuh_alerts.csv - 11 Dashboard Filters)
Live SOAR Incidents Created in TheHive:  46 actionable alerts (thehive_alerts.json - Level >= 8)
Mean Time to Detect (MTTD):             < 15 seconds for online telemetry
```

### 3.2 Sensor Attribution

| Sensor | Key Contributions |
|---|---|
| **Suricata NIDS** | Inbound port scanning (SIDs 3400001/3400002, 2018489), automated Python HTTP brute-force (SID 2017515/2000547), SQL injection UNION SELECT (SID 2010963), web shell id response (SID 2019284), reverse shell connection (SID 3400020), internal subnet sweep on `ens37` (14 alerts in raw CSV), NTLM Session Setup over SMB (SIDs 2067085–2067087), and Kerberos TGS-REQ wire frames (SID 2019922). |
| **Wazuh Host Agent** | Apache web server scanning thresholds (Rule 100410, 100213, 31153 passwd watchlist), Auditd `web_process_creation` (execve monitoring), reverse shell spawn (Rule 100199), passwordless sudo Python privilege escalation (Rule 5402 PAM), Syscheck FIM authorized_keys (Rule 550), and administrative SSH root logins and rapid exfiltration bursts (Rule 5715 elevated to Level 8). |
| **Wazuh Windows Agent** | Pass-the-Hash NTLM Logon Type 3 detection (EID 4624, 24 events in CSV: 15 on Win10User, 9 on DomainWin10), rogue Domain Admin account creation via Impacket WMI fan-out (Rule 100613), Impacket `wmiexec` process fan-out correlation (Rule 100613). |
| **Sysmon** | Process creation parent-child tracking (`wmiprvse.exe` -> `cmd.exe /Q /c`), command-line argument auditing, registry modification auditing. |

---

## 4. Indicators of Compromise (Summary)

*Refer to [iocs.md](iocs.md) for full IOC inventory.*

- **Network:** `192.168.232.135` (Kali Attacker), `192.168.56.30:4444` (Reverse Shell), `445/TCP` (SMB PtH), `88/TCP` (Kerberos TGS).
- **Files & Paths:** `/var/www/html/hackable/uploads/shell.php`, `/root/.ssh/authorized_keys`, `/tmp/hank.hash`, `/tmp/admin.ccache`, `/tmp/data.tar.gz`, `C:\Windows\Temp\hacked.bmp`.
- **Accounts:** `ad.lab\win10` (Captured user), `ad.lab\HANK_SHERMAN` (Kerberoasted DA), `backdoor_admin` (Rogue persistence account).
- **Hashes:** MD5 `5f4dcc3b5aa765d61d8327deb882cf99`, NetNTLMv2 hash for `win10`, `krbtgt` NTLM hash.

---

## 5. Containment, Eradication & Recovery

*Refer to [response-actions.md](response-actions.md) for step-by-step procedures.*

1. **Immediate Network Isolation:** Severed DVWA and Windows 10 network interfaces to arrest lateral movement and exfiltration.
2. **Process & Socket Termination:** Terminated reverse shell process tree and killed active WMI/SMB remote sessions.
3. **Credential Invalidation:** Performed dual reset of the Active Directory `krbtgt` account password (separated by 10 hours) to invalidate all forged Golden Tickets. Rotated all administrative passwords across the domain.
4. **Account Purge:** Deleted rogue persistence account `backdoor_admin` and removed SPNs from privileged accounts (`HANK_SHERMAN`).
5. **System Re-imaging:** Re-imaged the DVWA server from verified immutable configuration baselines and restored domain member endpoints from clean snapshots.

---

## 6. Root Cause and Strategic Recommendations

| Weakness / Control Gap | Attack Phase Exploit | Strategic Engineering Fix |
|---|---|---|
| Insecure Web File Upload | Stage 05 (Web Shell) | Implement strict MIME-type validation and mount uploads directory with `noexec`. |
| Sudoers Misconfiguration (NOPASSWD) | Stage 07 (Privesc) | Enforce strict least-privilege in `/etc/sudoers.d/`; eliminate NOPASSWD entries for interpreters like `python3`. |
| Insecure Protocols (LLMNR/NBT-NS) | Stage 10 (Responder) | Globally disable LLMNR and NetBIOS over TCP/IP via Group Policy across all domain endpoints. |
| Privileged Service Principal Names | Stage 13 (Kerberoasting) | Prohibit SPNs on Domain Admin accounts; transition all services to Group Managed Service Accounts (gMSA). |
| Unaudited Directory Replication | Stage 14 (DCSync) | Restrict DRSUAPI replication permissions strictly to Domain Controller computer objects; alert on EID 4662. |
| Unrestricted NTLM Authentication | Stage 15 (Pass-the-Hash) | Add all Domain Admins to Active Directory `Protected Users` group and enforce Remote Credential Guard. |
