# MITRE ATT&CK Mapping

Stage-by-stage mapping of the adversary campaign across the MITRE ATT&CK enterprise framework.

---

## ATT&CK Coverage Matrix

| # | Stage | Tactic | Technique Name | Technique ID | Detection Status | Primary Sensor |
|---|---|---|---|---|---|---|
| 01 | Reconnaissance | Reconnaissance | Active Scanning | `T1595.001` | **Detected** | Suricata SID `3400001`, `3400002` / Wazuh `100410` (Level 10) |
| 02 | Brute Force | Credential Access | Password Spraying / Brute Force | `T1110.001` | **Detected** | Wazuh `100213` (Level 10), Wazuh `31153` / Suricata SID `2000547` |
| 03 | SQL Injection | Initial Access | Exploit Public-Facing Application | `T1190` | **Detected** | Wazuh `31153` (Level 10 - Sensitive /etc/passwd in URL) |
| 04 | Hash Cracking | Credential Access | Password Cracking | `T1110.002` | **Detection Gap** (Offline) | *Inherent Offline Gap (DG-04)* |
| 05 | Web Shell Upload | Persistence | Server Software Component: Web Shell | `T1505.003` | **Detected** | Suricata SID `2019284` / Wazuh `100214` (Level 12) / Auditd `web_process_creation` |
| 06 | Reverse Shell | Execution | Command and Scripting Interpreter: Unix Shell | `T1059.004` | **Detected** | Suricata SID `3400020` / Wazuh `100199` |
| 07 | Privilege Escalation | Privilege Escalation | Abuse Elevation Control Mechanism: SUID | `T1548.003` | **Detected (Host Alerted)** | Wazuh `5402` (PAM) / Auditd `web_process_creation` |
| 08 | SSH Persistence | Persistence | Account Manipulation: SSH Authorized Keys | `T1098.004` | **Detected** | Wazuh `5715` (Elevated Level 8) / Wazuh `550` (Syscheck) |
| 09 | Internal Discovery | Discovery | Remote System Discovery | `T1018` | **Detected (Network Alerted; DG-09)** | Suricata SIDs `3400001`, `3400002`, `3400020` on `ens37` (14 alerts) |
| 10 | Responder Poisoning | Credential Access | Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning | `T1557.001` | **Detected** | Suricata SIDs `2067085`–`2067087` (`ET INFO NTLM Session Setup`) |
| 11 | NTLMv2 Cracking | Credential Access | Password Cracking | `T1110.002` | **Detection Gap** (Offline) | *Inherent Offline Gap (DG-11)* |
| 12 | BloodHound AD Recon | Discovery | Permission Groups Discovery: Domain Groups | `T1087.002` | **Logging Gap (Pivot Alerted; DG-12)** | Wazuh `5715` (Pivot root SSH logon alerted) |
| 13 | Kerberoasting | Credential Access | Steal or Forge Kerberos Tickets: Kerberoasting | `T1558.003` | **Detected (Network & Pivot Alerted)** | Suricata SID `2019922` (ET Open Kerberos TGS-REQ) & Wazuh `5715` |
| 14 | DCSync | Credential Access | OS Credential Dumping: DCSync | `T1003.006` | **Detected (Pivot Alerted)** | Wazuh `5715` (Pivot root SSH logon alerted) |
| 15 | Pass-the-Hash | Lateral Movement | Use Alternate Authentication Material: Pass the Hash | `T1550.002` | **Detected (Host & Pivot Alerted)** | Windows EID `4624` (24x in CSV: 15 Win10, 9 DC) / Wazuh `100613` |
| 16 | Golden Ticket | Credential Access | Steal or Forge Kerberos Tickets: Golden Ticket | `T1558.001` | **Detected (Pivot Alerted)** | Wazuh `5715` (Pivot root SSH logon alerted) |
| 17 | DC Persistence | Persistence | Create Account: Domain Account | `T1136.002` | **Detected** | Wazuh `100613` / Windows EID `4720`, `4728` |
| 18 | Collection | Collection | Data from Local System | `T1005` | **Detected** | Wazuh `100613` (Process Fan-out: `whoami`, `net user`, `net group`) |
| 19 | Exfiltration | Exfiltration | Exfiltration Over C2 Channel | `T1041` | **Detected (Pivot Alerted; DG-19)** | Wazuh `5715` (Rapid logon burst: 6 sessions / 1s) |
| 20 | Impact | Impact | Defacement: Internal Defacement | `T1491.001` | **Detected** | Wazuh `100613` / Sysmon EID `1` |

---

## Tactical Coverage Summary

- **Total Tactics Exercised:** 9 distinct MITRE ATT&CK tactics.
- **Total Unique Techniques Simulated:** 20 techniques.
- **Coverage Summary:** 16 Detected, 2 Inherent Offline Gaps, 2 Protocol Logging Gaps, 0 Rule Failures.
