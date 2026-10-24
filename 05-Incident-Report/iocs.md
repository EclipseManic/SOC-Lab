# Indicators of Compromise (IOCs)

Comprehensive inventory of observable artifacts generated and verified during the attack simulation.

---

## 1. Network Observables

| Observable | Type | Attribution | Context / Traffic Flow |
|---|---|---|---|
| `192.168.232.135` | IPv4 Address | Threat Actor (Kali) | External attacker workstation initiating scanning, exploitation, and C2. |
| `192.168.56.30` | IPv4 Address | Compromised Pivot (DVWA) | Ubuntu web server used as an internal pivoting staging post. |
| `192.168.56.20` | IPv4 Address | Victim Host (DomainWin10) | Active Directory domain-joined Windows 10 workstation. |
| `192.168.56.10` | IPv4 Address | Domain Controller (PC-DC) | Windows Server 2022 Active Directory Domain Controller. |
| `4444/TCP` | Port | C2 Channel | Inbound reverse shell listener port on attacker workstation. |
| `22/TCP` | Port | Inbound SSH / SCP | Interactive administrative access and data exfiltration channel. |
| `445/TCP` | Port | Lateral Movement | SMB transport used for Pass-the-Hash and WMI remote execution. |
| `88/TCP` | Port | Kerberos TGS-REQ | Kerberos Key Distribution Center port targeted during Kerberoasting. |

---

## 2. Host & Endpoint Observables

| Observable | Type | Host | Context |
|---|---|---|---|
| `/var/www/html/hackable/uploads/shell.php` | File Path | DVWA | Web shell uploaded through application vulnerability. |
| `/root/.ssh/authorized_keys` | File Path | DVWA | Modified persistence target containing attacker public key. |
| `/tmp/hank.hash` | File Path | DVWA | Staged Kerberos TGS hash extracted via `GetUserSPNs.py`. |
| `/tmp/admin.ccache` | File Path | DVWA | Staged forged Kerberos Ticket-Granting Ticket (Golden Ticket). |
| `/tmp/data.tar.gz` | File Path | DVWA | Staged compressed archive containing exfiltrated configuration data. |
| `C:\Windows\Temp\hacked.bmp` | File Path | DomainWin10 / PC-DC | Staged defacement wallpaper image. |
| `C:\Users\Public\hacked.bmp` | File Path | DomainWin10 / PC-DC | Permanent defacement wallpaper target. |
| `HKCU\Control Panel\Desktop\Wallpaper` | Registry Value | DomainWin10 / PC-DC | Registry key modified by adversary to force wallpaper defacement. |

---

## 3. Identity & Credential Observables

| Identity | Realm | Privilege Level | Context |
|---|---|---|---|
| `admin` | DVWA Local | Web Administrator | Web user account compromised via SQL injection. |
| `www-data` | Linux Local | Service Account | Web server execution context abused for reverse shell. |
| `root` | Linux Local | Superuser | Privileged local account compromised via SUID find abuse. |
| `ad.lab\win10` | Active Directory | Domain User | Workstation user account compromised via Responder LLMNR poisoning. |
| `ad.lab\HANK_SHERMAN` | Active Directory | Domain Admin (SPN) | High-privilege account kerberoasted via `GetUserSPNs.py`. |
| `ad.lab\Administrator` | Active Directory | Built-in Administrator | Target account for Pass-the-Hash lateral movement. |
| `backdoor_admin` | Active Directory | Domain Admin | Rogue persistent administrative domain account created in Stage 17. |

---

## 4. Cryptographic Hashes

| Material | Algorithm | Value | Context |
|---|---|---|---|
| DVWA Admin Password | MD5 | `5f4dcc3b5aa765d61d8327deb882cf99` | Dumped via Stage 03 SQL injection; cracked to `<REDACTED>`. |
| Workstation Hash | NetNTLMv2 | NetNTLMv2 challenge-response format | Intercepted via Stage 10 Responder; cracked offline. |
| Kerberos TGS Ticket | Kerberos 5 TGS-REP | `$krb5tgs$23$*HANK_SHERMAN$AD.LAB...` | Captured via Stage 13; cracked offline to `<REDACTED>`. |
| Domain Master Secret | NTLM | `krbtgt` NTLM Hash | Dumped via Stage 14 DCSync; used to forge Golden Ticket. |
