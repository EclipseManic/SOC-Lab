# Response Actions & Incident Remediation Log

> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Report Identifier:** `IR-2026-1018-RESP`  
> **Lead Incident Responder:** Manichand Gupta  
> **Execution Environment:** SOC-Lab (`192.168.56.0/24`)  
> **Operational Status:** **100% Executed, Verified & Signed Off**

This document details the operational actions executed across all four phases of the incident remediation lifecycle—from emergency tactical containment and adversary lockout to permanent root-cause eradication, endpoint hardening, system recovery, and SOAR case resolution.

---

## 📑 Remediation Phase Index

1. [Operational Response Architecture & Tooling Authority](#1-operational-response-architecture--tooling-authority)
2. [Phase 1: Tactical Containment & Lockout (Immediate Containment)](#2-phase-1-tactical-containment--lockout-immediate-containment)
3. [Phase 2: Permanent Eradication & Vulnerability Hardening](#3-phase-2-permanent-eradication--vulnerability-hardening)
4. [Phase 3: Production Service Recovery & Health Validation](#4-phase-3-production-service-recovery--health-validation)
5. [Phase 4: TheHive Case Management & Operational Sign-Off](#5-phase-4-thehive-case-management--operational-sign-off)
6. [Consolidated Response Sign-Off Matrix](#6-consolidated-response-sign-off-matrix)

---

# 1. Operational Response Architecture & Tooling Authority

All containment and eradication procedures were executed through centralized enterprise management platforms without utilizing adversary-compromised interactive TTY channels:

- **Velociraptor Live Response Platform (`Linux.Sys.BashShell`):** Executed non-interactive, auditable remediation scripts on the Suricata Gateway (`192.168.56.150`) and DVWA Server (`192.168.56.30`) over TLS-encrypted agent polling.
- **Enterprise PowerShell (RSAT & CIM Modules):** Executed administrative remediation on Domain Controller `PC-DC` (`192.168.56.10`) and Workstation `Win10User` (`192.168.56.20`).
- **TheHive 5 SOAR Platform:** Executed alert queue triage, task tracking, case correlation, and formal case resolution.

---

# 2. Phase 1: Tactical Containment & Lockout (Immediate Containment)

> 📖 **Primary Operational Record:** [`04-Investigation/Immediate-Containment-Execution.md`](../04-Investigation/Immediate-Containment-Execution.md)  
> 🎯 **Objective:** Sever adversary communications, terminate active footholds, and isolate malicious files while preserving forensic integrity for deep-dive root cause analysis.

### Action 1: Perimeter Firewall Isolation & Adversary Block
- **Target:** Suricata Gateway (`192.168.56.150` / `192.168.232.162`)
- **Execution Command:**
  ```bash
  iptables -I INPUT 1 -s 192.168.232.135 -j DROP
  iptables -I FORWARD 1 -s 192.168.232.135 -j DROP
  iptables -L -n -v | grep 192.168.232.135
  ```
- **Verification:** Dropped packet counter actively incremented; 0 packets accepted from adversary origin.
- **Evidence:** [`slot_01_containment_firewall_drop.png`](../06-Resources/screenshots/initial-triage-action/slot_01_containment_firewall_drop.png)

### Action 2: DVWA Reverse Shell Termination & Web Shell Quarantine
- **Target:** DVWA Server (`192.168.56.30`)
- **Execution Command:**
  ```bash
  pkill -9 -f nc.openbsd
  mkdir -p /root/forensics_quarantine/
  mv /var/www/html/dvwa/hackable/uploads/shell.php /root/forensics_quarantine/
  chmod 000 /root/forensics_quarantine/shell.php
  ss -antp | grep 4444
  ```
- **Verification:** Netstat table confirmed zero active listeners or connections on port 4444; `shell.php` secured in quarantine.
- **Evidence:** [`slot_02a_containment_dvwa_shells_quarantined.png`](../06-Resources/screenshots/initial-triage-action/slot_02a_containment_dvwa_shells_quarantined.png)

### Action 3: DVWA Rogue Root SSH Key Eradication & Session Severing
- **Target:** DVWA Server (`192.168.56.30`)
- **Execution Command:**
  ```bash
  sed -i '/ssh-ed25519/d' /root/.ssh/authorized_keys
  pkill -9 -t pts/0 2>/dev/null; pkill -9 -t pts/1 2>/dev/null
  who; cat /root/.ssh/authorized_keys
  ```
- **Verification:** Injected ED25519 public key purged; rogue interactive root TTY sessions killed.
- **Evidence:** [`slot_03_containment_dvwa_root_ssh_eradication.png`](../06-Resources/screenshots/initial-triage-action/slot_03_containment_dvwa_root_ssh_eradication.png)

### Action 4: Active Directory Rogue Account Lockout (`AD\backdoor`)
- **Target:** Domain Controller `PC-DC` (`192.168.56.10`)
- **Execution Command:**
  ```powershell
  Disable-ADAccount -Identity "backdoor"
  Remove-ADGroupMember -Identity "Domain Admins" -Members "backdoor" -Confirm:$false
  Remove-ADGroupMember -Identity "Administrators" -Members "backdoor" -Confirm:$false
  Get-ADUser -Identity "backdoor" -Properties Enabled, MemberOf
  ```
- **Verification:** Account disabled (`Enabled: False`); administrative privileges revoked; object SID preserved for forensic log correlation.
- **Evidence:** [`slot_04a_containment_dc_backdoor_disabled.png`](../06-Resources/screenshots/initial-triage-action/slot_04a_containment_dc_backdoor_disabled.png)

### Action 5: Kerberos Golden Ticket Invalidation (`krbtgt` Double Reset)
- **Target:** Active Directory Domain Controller (`PC-DC`)
- **Execution Command:**
  ```powershell
  Set-ADAccountPassword -Identity "krbtgt" -NewPassword (ConvertTo-SecureString "TempKrbReset_Pass1!" -AsPlainText -Force) -Reset
  Set-ADAccountPassword -Identity "krbtgt" -NewPassword (ConvertTo-SecureString "FinalKrbReset_Pass2!" -AsPlainText -Force) -Reset
  klist purge
  Get-ADUser -Identity "krbtgt" -Properties PasswordLastSet, msDS-KeyVersionNumber
  ```
- **Verification:** Key Version Number (`msDS-KeyVersionNumber`) incremented to 3; forged Golden Tickets rejected by KDC.
- **Evidence:** [`slot_05a_containment_dc_krbtgt_reset.png`](../06-Resources/screenshots/initial-triage-action/slot_05a_containment_dc_krbtgt_reset.png)

### Action 6: Workstation Staged File Quarantine & Wallpaper Restoration
- **Target:** `Win10User` (`192.168.56.20`) & `PC-DC` (`192.168.56.10`)
- **Execution Command:**
  ```powershell
  New-Item -ItemType Directory -Path "C:\Forensics_Quarantine" -Force
  Move-Item -Path "C:\Windows\Temp\domain_users.txt", "C:\Windows\Temp\admin_info.txt", "C:\Windows\Temp\sensitive_data.txt" -Destination "C:\Forensics_Quarantine\" -ErrorAction SilentlyContinue
  Move-Item -Path "$env:USERPROFILE\Desktop\README_HACKED.txt", "$env:USERPROFILE\Desktop\*.enc", "C:\Users\Public\hacked.bmp" -Destination "C:\Forensics_Quarantine\" -ErrorAction SilentlyContinue
  reg add "HKCU\Control Panel\Desktop" /v Wallpaper /t REG_SZ /d "" /f
  reg add "HKCU\Control Panel\Desktop" /v WallpaperStyle /t REG_SZ /d "2" /f
  RUNDLL32.EXE user32.dll,UpdatePerUserSystemParameters
  ```
- **Verification:** Malicious files isolated; Windows desktop wallpaper restored to default.
- **Evidence:** [`slot_06b_containment_wallpaper_remediated.png`](../06-Resources/screenshots/initial-triage-action/slot_06b_containment_wallpaper_remediated.png)

### Action 7: DVWA Database & Web Application Credential Rotation
- **Target:** DVWA Server (`192.168.56.30`)
- **Execution Command:**
  ```bash
  mysql -e "ALTER USER 'dvwa'@'localhost' IDENTIFIED BY 'S0C_S3cur3_Db_P@ssw0rd_2026!'; FLUSH PRIVILEGES;"
  sed -i "s/db_password' \] = .*/db_password' \] = 'S0C_S3cur3_Db_P@ssw0rd_2026!';/" /var/www/html/dvwa/config/config.inc.php
  mysql -e "USE dvwa; UPDATE users SET password = MD5('NewStrongAdminP@ss2026!') WHERE user = 'admin';"
  systemctl restart apache2
  ```
- **Verification:** SQL-injected database credentials invalidated; web application authentication functional with new secrets.
- **Evidence:** [`slot_07_containment_dvwa_db_credential_rotation.png`](../06-Resources/screenshots/initial-triage-action/slot_07_containment_dvwa_db_credential_rotation.png)

---

# 3. Phase 2: Permanent Eradication & Vulnerability Hardening

> 📖 **Primary Operational Record:** [`04-Investigation/Eradication-Hardening-and-Recovery.md`](../04-Investigation/Eradication-Hardening-and-Recovery.md)  
> 🎯 **Objective:** Permanently eliminate all 7 root causes, shred adversary staging files, sanitize Active Directory, and enforce zero-trust network micro-segmentation.

### Step 1: Adversary Anti-Forensics Audit & Network Service Restoration
- **Target:** DVWA Server (`192.168.56.30`)
- **Actions:**
  - Audited root command history (`history | grep "rm"`) and Auditd execution logs, uncovering the adversary's track-covering deletion of all 9 staging files in `/tmp/` (`/tmp/win10.hash`, `/tmp/hank.hash`, `/tmp/dcsync_output.txt`, `/tmp/admin.ccache`, `/tmp/domain_users.txt`, `/tmp/admin_info.txt`, `/tmp/sensitive_data.txt`, `/tmp/hacked.bmp`, `/tmp/f`).
  - Verified clean `/tmp/` state with `ls -la /tmp/` and confirmed zero unlinked open file descriptors remain via `lsof +L1 /tmp`.
  - Recursive removal of rogue Responder installation: `rm -rf /opt/Responder /opt/impacket`.
  - Operational restoration of local DNS stub resolver: `systemctl unmask systemd-resolved && systemctl enable --now systemd-resolved`.
- **Evidence:** [`slot_01_eradication_dvwa_loot_wiped.png`](../06-Resources/screenshots/deep-investigation-action/slot_01_eradication_dvwa_loot_wiped.png)

### Step 2: Linux Root Cause Elimination & Web Hardening
- **Target:** DVWA Server (`192.168.56.30`)
- **Actions:**
  - Sudoers Hardening: Purged `www-data ALL=(ALL) NOPASSWD: /usr/bin/python3` from `/etc/sudoers`; validated syntax via `visudo -c`; verified access denial via `sudo -u www-data sudo -l`.
  - SSH Hardening: Set `PermitRootLogin no` and `PasswordAuthentication no` in `/etc/ssh/sshd_config`; restarted SSH daemon.
  - Upload Execution Lockdown: Deployed `.htaccess` denying script engines in `/var/www/html/dvwa/hackable/uploads/`; set filesystem permissions to `chmod 750`; verified via test curl returning `HTTP 403 Forbidden`.
- **Evidence:** [`slot_02_eradication_dvwa_sudoers_patched.png`](../06-Resources/screenshots/deep-investigation-action/slot_02_eradication_dvwa_sudoers_patched.png), [`slot_03_eradication_dvwa_upload_blocked.png`](../06-Resources/screenshots/deep-investigation-action/slot_03_eradication_dvwa_upload_blocked.png)

### Step 3: Active Directory Account Eradication & Forest Hardening
- **Target:** Domain Controller `PC-DC` (`192.168.56.10`)
- **Actions:**
  - Permanent Backdoor Removal: Executed `Remove-ADUser -Identity "backdoor" -Confirm:$false`.
  - Service Account Demotion: Stripped `HANK_SHERMAN` from `Domain Admins` & `Administrators`; purged SPN `CIFS/AWSWAPPS1000000.ad.lab` via `Set-ADUser`; enforced AES128/AES256 Kerberos encryption; rotated password to 32-character complex secret.
  - Protected Users Group Enrollment: Enrolled `Administrator` and `HANK_SHERMAN` into `Protected Users` security group, disabling NTLM caching, DES/RC4 encryption, and credential delegation.
- **Evidence:** [`slot_04_eradication_ad_backdoor_deleted.png`](../06-Resources/screenshots/deep-investigation-action/slot_04_eradication_ad_backdoor_deleted.png), [`slot_05_eradication_ad_hank_demoted.png`](../06-Resources/screenshots/deep-investigation-action/slot_05_eradication_ad_hank_demoted.png), [`slot_06_eradication_ad_protected_users.png`](../06-Resources/screenshots/deep-investigation-action/slot_06_eradication_ad_protected_users.png)

### Step 4: Enterprise Multicast & Broadcast Protocol Hardening
- **Target:** `PC-DC` (`192.168.56.10`) and `Win10User` (`192.168.56.20`)
- **Actions:**
  - Globally disabled LLMNR: Set `HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient\EnableMulticast = 0`.
  - Disabled NetBIOS over TCP/IP: Invoked CIM network adapter method `SetTcpipNetbios(TcpipNetbiosOptions = 2)` across all active interfaces.
- **Evidence:** [`slot_07_eradication_llmnr_netbios_disabled.png`](../06-Resources/screenshots/deep-investigation-action/slot_07_eradication_llmnr_netbios_disabled.png)

### Step 5: Network Micro-Segmentation & DMZ Lateral Lockdown
- **Target:** Gateway Firewall (`192.168.56.150`) and DVWA Host (`192.168.56.30`)
- **Actions:**
  - Implemented Gateway iptables FORWARD rules rejecting outbound TCP/UDP 88, 135, 137-139, 389, 445, 636, 3268, 3389, 5985 from DVWA to `192.168.56.0/24`.
  - Configured DVWA OUTPUT rules dropping traffic to `192.168.56.10` and `192.168.56.20`, permitting only SOC monitoring ports (1514, 1515, 8000).
- **Evidence:** [`slot_08_eradication_dmz_firewall_hardened.png`](../06-Resources/screenshots/deep-investigation-action/slot_08_eradication_dmz_firewall_hardened.png)

---

# 4. Phase 3: Production Service Recovery & Health Validation

Production service recovery was systematically verified across all four operating environments:

1. **DVWA Public Web Tier:** Verified HTTP response `HTTP 200 OK` in 14.2 ms; verified MariaDB database connectivity; tested upload execution denial returning `HTTP 403 Forbidden`.
2. **Active Directory Domain Services:** Executed `dcdiag /test:Replication /test:Advertising /test:FSMOCheck /test:Services` (all 5 core tests passed); confirmed `repadmin /showrepl` reports 0 replication errors.
3. **Corporate Workstation:** Confirmed domain logon functional with rotated credentials; confirmed desktop wallpaper restored to corporate default.
4. **Wazuh Central SIEM Fabric:** Validated all 4 agents (`Suricata-GW` 001, `DVWA-Server` 002, `DomainWin10` 003, `Win10User` 004) in **Active** state with zero critical alerts during the 60-minute post-remediation monitoring window.
- **Evidence:** [`slot_09_eradication_health_verification.png`](../06-Resources/screenshots/deep-investigation-action/slot_09_eradication_health_verification.png)

---

# 5. Phase 4: TheHive Case Management & Operational Sign-Off

The entire 46-alert operational queue in TheHive 5 was audited, disposed, and resolved:

- **3 False Positives Dismissed:**
  - Alert #01: External Nmap TCP 4444 SYN Probe -> Dismissed as perimeter port sweep noise.
  - Alert #06: Web App Shellshock HTTP Canary Probe -> Dismissed as scanner 404 failure.
  - Alert #18: Internal Subnet TCP 4444 SYN Probe -> Dismissed as internal sweep noise.
- **43 True Positive Alerts Promoted & Resolved Across 3 Master Cases:**
  - **Case 01 (`CAS-001-WEBCOMP`):** 13 alerts | Perimeter breach, SQLi, webshell & sudo privesc | **RESOLVED (True Positive With Impact)**
  - **Case 02 (`CAS-002-LATMOVE`):** 8 alerts | SSH pivot, Responder poisoning, BloodHound & DCSync | **RESOLVED (True Positive With Impact)**
  - **Case 03 (`CAS-003-DOMIMP`):** 22 alerts | Pass-the-Hash, Golden Ticket, AD backdoor & impact | **RESOLVED (True Positive With Impact)**
- **Evidence:** [`thehive_cases_overview_resolved.png`](../06-Resources/screenshots/thehive-cases/thehive_cases_overview_resolved.png), [`thehive_alert_queue_cleared.png`](../06-Resources/screenshots/thehive-cases/thehive_alert_queue_cleared.png)

---

# 6. Consolidated Response Sign-Off Matrix

| Action Item | Target System | Execution Standard | Verification Output | Operational Status | Sign-Off Lead |
|:---|:---|:---|:---|:---:|:---:|
| **Perimeter Block** | Gateway Firewall | iptables DROP rules on `192.168.232.135` | Ingress packet drops verified via counter | **VERIFIED ACTIVE** | Lead SOC Analyst |
| **Reverse Shell Kill** | DVWA (`192.168.56.30`) | `pkill -9 nc.openbsd` | Netstat port 4444 clear | **SEVERED** | Lead SOC Analyst |
| **Web Shell Quarantine** | DVWA (`192.168.56.30`) | Moved to `/root/forensics_quarantine/` (`chmod 000`) | Quarantined; `ls` verified | **QUARANTINED** | Lead SOC Analyst |
| **Root SSH Purge** | DVWA (`192.168.56.30`) | Purged ED25519 key; killed active TTYs | `authorized_keys` clean; `who` clear | **PURGED** | Lead SOC Analyst |
| **Anti-Forensics Audit & Loot Purge** | DVWA (`192.168.56.30`) | Audited adversary `rm` track-covering in history; verified `/tmp/` clean | `/tmp/` clean; `systemd-resolved` active | **VERIFIED & PURGED** | Lead SOC Analyst |
| **DNS Service Restore** | DVWA (`192.168.56.30`) | Unmasked & enabled `systemd-resolved` | Stub resolver bound to 127.0.0.53:53 | **OPERATIONAL** | Lead SOC Analyst |
| **Sudoers Patch** | DVWA (`192.168.56.30`) | Purged `www-data` NOPASSWD Python | `sudo -u www-data sudo -l` denied | **PATCHED** | Lead SOC Analyst |
| **SSH Hardening** | DVWA (`192.168.56.30`) | Set `PermitRootLogin no` & `PasswordAuth no` | `sshd -T` confirms root login denied | **HARDENED** | Lead SOC Analyst |
| **Upload Lockdown** | DVWA (`192.168.56.30`) | Deployed execution-blocking `.htaccess` | Test PHP request returns HTTP 403 | **LOCKED DOWN** | Lead SOC Analyst |
| **AD Backdoor Purge** | `PC-DC` (`192.168.56.10`) | `Remove-ADUser -Identity "backdoor"` | `Get-ADUser` returns null | **PERMANENTLY PURGED** | Lead SOC Analyst |
| **HANK_SHERMAN Demotion** | `PC-DC` (`192.168.56.10`) | Stripped DA; deleted SPN; forced AES | Empty `MemberOf` & `SPN` verified | **DEMOTED & HARDENED** | Lead SOC Analyst |
| **Protected Users** | `PC-DC` (`192.168.56.10`) | Added `Administrator` & `HANK_SHERMAN` | Membership verified; NTLM denied | **ENROLLED** | Lead SOC Analyst |
| **krbtgt Double Reset** | `PC-DC` (`192.168.56.10`) | Reset password twice; purged ticket cache | `msDS-KeyVersionNumber` = 3 | **INVALIDATED** | Lead SOC Analyst |
| **LLMNR/NetBIOS Disable**| `PC-DC` & `Win10User` | Registry `EnableMulticast=0`, CIM `NetbiosOptions=2` | Multicast queries completely silenced | **DISABLED** | Lead SOC Analyst |
| **Micro-Segmentation** | Gateway & DVWA | iptables drops on AD ports (88, 135, 389, 445) | Outbound lateral connection rejected | **ENFORCED** | Lead SOC Analyst |
| **Service Recovery** | All Hosts | Health tests: curl HTTP 200, DCDiag, Wazuh | All tests passed; 4 agents active | **HEALTHY & RESTORED** | Lead SOC Analyst |
| **SOAR Case Closure** | TheHive 5 Console | 46 alerts processed; Cases 01–03 closed | Zero pending alerts; 3 cases resolved | **OFFICIALLY RESOLVED** | Lead SOC Analyst |
