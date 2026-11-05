# 🛡️ SOC-Lab: Eradication, Vulnerability Hardening & System Recovery Execution

> **Analyst:** Manichand Gupta  
> **Environment:** SOC-Lab (`192.168.56.0/24` — DVWA `192.168.56.30`, PC-DC `192.168.56.10`, Win10User `192.168.56.20`, Suricata Gateway `192.168.56.150` / `192.168.232.162`)  
> **Attacker Origin:** `192.168.232.135` (Adversary Kali Linux)  
> **Lifecycle Phase:** NIST SP 800-61r2 Phase 4: Eradication, Hardening & Operational Recovery  
> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Case Scope:** `CAS-001-WEBCOMP`, `CAS-002-LATMOVE`, `CAS-003-DOMIMP` (46 Alerts Processed)  
> **Operational Status:** **100% Remediated, Hardened & Officially Closed**
> [!IMPORTANT]
> **Investigative Foundation & Lifecycle Continuum:**  
> This operational eradication and recovery record forms the essential fourth tier of our investigation, executing directly upon the evidentiary discoveries documented across our incident suite:
> - **[`Initial-Triage-and-Investigation.md`](Initial-Triage-and-Investigation.md)**: Triaged 46 TheHive alerts by severity, critiqued 9 detection pipeline flaws, and established the 6-window chronological baseline.
> - **[`Immediate-Containment-Execution.md`](Immediate-Containment-Execution.md)**: Executed 7 emergency tactical actions (firewall drops, reverse shell kills, `shell.php` quarantine, `AD\backdoor` account disabling, and `krbtgt` invalidation) to freeze the breach without destroying forensic evidence.
> - **[`Deep-Dive-Attack-Chain-Investigation.md`](Deep-Dive-Attack-Chain-Investigation.md)**: Mapped all 7 attack phases, identified the **7 root-cause architectural vulnerabilities**, and inventoried all adversary artifacts across our 68-screenshot telemetry catalog.

---

## 📑 Table of Contents

1. [Operational Architecture: Transitioning from Containment to Eradication](#1-operational-architecture-transitioning-from-containment-to-eradication)

2. [Incident Remediation Tooling & Authority](#2-incident-remediation-tooling--authority)

3. [Step 1: Adversary Anti-Forensics Audit, Staging File Purge & Network Service Restoration (DVWA)](#3-step-1-adversary-anti-forensics-audit-staging-file-purge--network-service-restoration-dvwa)

4. [Step 2: Linux Root-Cause Vulnerability Elimination & Web Hardening (DVWA)](#4-step-2-linux-root-cause-vulnerability-elimination--web-hardening-dvwa)

5. [Step 3: Active Directory Account Eradication, Privileged Demotion & Kerberos Invalidation (PC-DC)](#5-step-3-active-directory-account-eradication-privileged-demotion--kerberos-invalidation-pc-dc)

6. [Step 4: Enterprise Multicast & Broadcast Name Resolution Hardening (Disable LLMNR & NetBIOS)](#6-step-4-enterprise-multicast--broadcast-name-resolution-hardening-disable-llmnr--netbios)

7. [Step 5: Network Micro-Segmentation & DMZ Lateral Movement Boundary Enforcement](#7-step-5-network-micro-segmentation--dmz-lateral-movement-boundary-enforcement)

8. [Step 6: Full Operational Recovery, Service Availability & Security Health Verification](#8-step-6-full-operational-recovery-service-availability--security-health-verification)

9. [Step 7: TheHive 46-Alert Queue Disposition & 3-Case Resolution Management](#9-step-7-thehive-46-alert-queue-disposition--3-case-resolution-management)

10. [Eradication & System Recovery Sign-Off Matrix](#10-eradication--system-recovery-sign-off-matrix)

---

# 1. Operational Architecture: Transitioning from Containment to Eradication

In accordance with the **NIST SP 800-61r2 Computer Security Incident Handling Guide** and the SANS Incident Handling methodology, incident response comprises distinct operational boundaries:

```mermaid

flowchart LR

A["<b>Phase 2: Detection & Triage</b><br>Initial-Triage (46 Alerts)<br>SIEM/SOAR Ingestion"] --> B["<b>Phase 3: Containment</b><br>Immediate-Containment<br>Freeze Footholds & Isolate"]

B --> C["<b>Forensic Deep-Dive</b><br>Deep-Dive Attack Chain<br>Identify 7 Root Causes"]

C --> D["<b>Phase 4: Eradication</b><br>Eradication & Hardening<br>Purge Loot & Patch Flaws"]

D --> E["<b>Phase 4: Recovery</b><br>Health Diagnostics<br>Verify Production Baseline"]

E --> F["<b>Phase 5: Post-Incident</b><br>Incident Report & Closure<br>Formal Case Sign-off"]

style A fill:#1c2430,stroke:#58a6ff,stroke-width:2px,color:#fff

style B fill:#1c2430,stroke:#d29922,stroke-width:2px,color:#fff

style C fill:#1c2430,stroke:#8957e5,stroke-width:2px,color:#fff

style D fill:#1c2430,stroke:#238636,stroke-width:2px,color:#fff

style E fill:#1c2430,stroke:#238636,stroke-width:2px,color:#fff

style F fill:#1c2430,stroke:#388bfd,stroke-width:2px,color:#fff

```

### Why Containment Was Intentionally Paused Short of Eradication

During **Immediate Containment** ([`Immediate-Containment-Execution.md`](Immediate-Containment-Execution.md)), our sole priority was **adversary lockout and forensic preservation**:

1. We **isolated** the network origin (`192.168.232.135`) and terminated active network connections (`pkill nc.openbsd`).

2. We moved `shell.php` to `/root/forensics_quarantine/` with `chmod 000` rather than deleting it so cryptographic checksums could be generated.

3. We **disabled** rogue user `AD\backdoor` (`UserAccountControl: ACCOUNTDISABLE`) rather than deleting it so its Security Identifier (`S-1-5-21-3315718683-193253855-3518612541-4192`) could be traced across historical Windows Event logs.

With forensic deep-dive analysis fully completed ([`Deep-Dive-Attack-Chain-Investigation.md`](Deep-Dive-Attack-Chain-Investigation.md)), we now move into **Phase 4: Eradication, Hardening & Recovery**:

- **Eradication:** Completely and irreversibly purge all adversary implants, staging caches, harvested hash dumps, and rogue user accounts from production disk and directory storage.

- **Hardening:** Permanently remediate all 7 systemic architectural flaws so that repeating the exact offensive exploit sequence produces immediate failure.

- **Recovery:** Restore impacted business services, validate replication and authentication pipelines, verify SIEM agent integrity, and formally close all 46 alerts across TheHive's 3 master cases.

---

# 2. Incident Remediation Tooling & Authority

All actions documented in this playbook were executed strictly through authorized, auditable enterprise management channels:

1. **Velociraptor DFIR Live Response Platform (`Linux.Sys.BashShell`):**

- Direct execution on the Suricata Gateway (`192.168.56.150`) and DVWA Linux Server (`192.168.56.30`).

- Ensures encrypted, non-interactive execution that leaves an immutable audit trail with microsecond precision while bypassing interactive TTY shell sessions.

2. **Enterprise PowerShell (RSAT Active Directory & CIM/WMI Engine):**

- Direct administrative execution on Domain Controller `PC-DC` (`192.168.56.10`) and Workstation `Win10User` (`192.168.56.20`).

- Provides native AD object modification, Group Policy registry enforcement, and CimSession hardware adapter reconfigurations.

3. **TheHive 5.7.5 SOAR Incident Management Console:**

- Centralized review and disposition of all 46 imported telemetry alerts.

- Formal case promotion, task sign-off, observable tagging, and operational closure under master incident identifier `INC-2026-1018-ALPHA`.

---

# 3. Step 1: Adversary Anti-Forensics Audit, Staging File Purge & Network Service Restoration (DVWA)

> 🎯 **Objective:** Audit adversary track-covering deletion commands in root bash history, verify the purge of all 9 staging artifacts in `/tmp/`, permanently remove rogue tooling (`/opt/Responder`), and restore the local `systemd-resolved` DNS resolution service.  
> 💻 **Target:** DVWA Linux Server (`192.168.56.30`)  
> 🔧 **Channel:** Velociraptor Live Response (`Linux.Sys.BashShell`)

### Tactical Context & Forensic Verification

During Phases 4 through 7 of the attack, the adversary utilized DVWA as their internal staging and pivoting platform, generating 9 critical intermediate files in `/tmp/`:

- Captured NTLMv2 and Kerberos hashes: `/tmp/win10.hash` and `/tmp/hank.hash`.
- Full DCSync NTDS password dump: `/tmp/dcsync_output.ntds`.
- Forged Kerberos Golden Ticket: `/tmp/Administrator.ccache`.
- Staged exfiltration dumps: `/tmp/domain_users.txt`, `/tmp/admin_info.txt`, `/tmp/sensitive_data.txt`.
- Workstation defacement bitmap: `/tmp/hacked.bmp`.
- Netcat reverse shell named pipe: `/tmp/f`.
- The adversary also deployed Responder into `/opt/Responder` and disabled `systemd-resolved` to prevent UDP port 53 binding conflicts with Responder's rogue DNS poisoner.

#### Adversary Anti-Forensics (Track-Covering via `rm`):
Prior to disconnecting their interactive sessions, the adversary attempted to thwart post-incident forensic discovery by executing `rm` commands to delete all 9 intermediate staging files from `/tmp/`:
```bash
rm /tmp/win10.hash /tmp/hank.hash /tmp/dcsync_output.ntds /tmp/Administrator.ccache /tmp/domain_users.txt /tmp/admin_info.txt /tmp/sensitive_data.txt /tmp/hacked.bmp /tmp/f
```

#### Analyst Forensic Discovery & Verification Actions:
During live response and forensic auditing of DVWA, the incident response team inspected the root command history (`Auditd and bashcmd forensic inspection`) and Linux Auditd records. The shell history explicitly confirmed the adversary's deletion attempts, revealing the exact filenames and paths of the compromised staging files. The analyst then verified that `/tmp/` was clean (`ls -la /tmp/`), verified no lingering unlinked file descriptors remained open, purged `/opt/Responder`, unmasked and restarted `systemd-resolved`, and validated upstream DNS resolution.

### Execution Script:

```bash
# ==============================================================================
# 1. ADVERSARY ARTIFACT PURGE & WIPING: Securely overwrite and unlink staged loot
# ==============================================================================
shred -u -z -n 3 /tmp/*.hash /tmp/*.ccache /tmp/dcsync_output* /tmp/*.txt /tmp/*.bmp /tmp/f 2>/dev/null || true

# ==============================================================================
# 2. FILESYSTEM AUDIT: Verify /tmp/ directory clean state & unlinked descriptors
# ==============================================================================
ls -la /tmp/
lsof +L1 /tmp 2>/dev/null || true

# ==============================================================================
# 3. ADVERSARY TOOLING REMOVAL: Purge rogue Responder and Impacket directories
# ==============================================================================
rm -rf /opt/Responder /opt/impacket
ls -la /opt/

# ==============================================================================
# 4. SYSTEM SERVICE RESTORATION: Unmask, enable, and verify systemd-resolved
# ==============================================================================
systemctl unmask systemd-resolved
systemctl enable --now systemd-resolved
systemctl status systemd-resolved --no-pager
resolvectl status
```

### 📸 Proof of Execution:

![DVWA loot verification and systemd-resolved restoration](../06-Resources/screenshots/deep-investigation-action/slot_01_eradication_dvwa_loot_wiped.png)  
*Figure 1: Analyst console review demonstrating secure forensic wiping (shred -u -z -n 3) of staged loot in /tmp/ (*.hash, *.ccache, dcsync_output.ntds, *.txt, *.bmp), purge of /opt/Responder, and operational restoration of systemd-resolved (matching slot_01_eradication_dvwa_loot_wiped.png).*

---

<a id="step-2-linux-root-cause-vulnerability-elimination--web-hardening-dvwa"></a>

# 4. Step 2: Linux Root-Cause Vulnerability Elimination & Web Hardening (DVWA)

> 🎯 **Objective:** Permanently eliminate Root Cause Flaw 1 (Sudoers NOPASSWD Python), Flaw 2 (Permissive SSH root logon), and Flaw 3 (Arbitrary PHP execution in web upload directory).  
> 💻 **Target:** DVWA Linux Server (`192.168.56.30`)  
> 🔧 **Channel:** Velociraptor Live Response (`Linux.Sys.BashShell`)

### Vulnerability Breakdown & Remediation Rationale

1. **Root Cause Flaw 1 (`www-data` Sudoers NOPASSWD Python):** The web service user was granted unrestricted passwordless root execution for `/usr/bin/python3`. In Stage 07, the attacker used `sudo python3 -c 'import os; os.system("/bin/bash")'` (GTFOBins) to achieve instant root in under 10 seconds.

- *Fix:* Purge the directive from `/etc/sudoers` and `/etc/sudoers.d/`, validate syntax via `visudo -c`, and verify with `sudo -u www-data sudo -l`.

2. **Root Cause Flaw 2 (Permissive OpenSSH Server Configuration):** OpenSSH permitted direct interactive root logins (`PermitRootLogin yes`) and password authentication, enabling the attacker to inject an ED25519 public key and log in directly as root (Alert #16, `wzb-20`).

- *Fix:* Enforce `PermitRootLogin no` and `PasswordAuthentication no` in `/etc/ssh/sshd_config` and reload SSHD.

3. **Root Cause Flaw 3 (Arbitrary Web Upload Script Execution):** The `/var/www/html/dvwa/hackable/uploads/` directory lacked execution restrictions, allowing `shell.php` to execute as a native web process under Apache.

- *Fix:* Deploy an immutable `.htaccess` file explicitly disabling PHP engine interpretation (`php_flag engine off`) and blocking all executable script MIME types (`Require all denied`).

### Execution Script:

```bash

# ==============================================================================

# 1. REMEDIATE FLAW 1: Purge Sudoers NOPASSWD Python misconfiguration

# ==============================================================================

grep -E 'www-data|python' /etc/sudoers /etc/sudoers.d/* 2>/dev/null

sed -i '/www-data.*python3/d' /etc/sudoers

rm -f /etc/sudoers.d/www-data

# Validate sudoers configuration syntax

visudo -c

# Defensive verification: Test www-data sudo rights

sudo -u www-data sudo -l

# Expected Output: "Sorry, user www-data may not run sudo on dvwa."

# ==============================================================================

# 2. REMEDIATE FLAW 2: Enforce Hardened OpenSSH Daemon Configuration

# ==============================================================================

sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config

sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config

sed -i 's/^#\?PermitEmptyPasswords.*/PermitEmptyPasswords no/' /etc/ssh/sshd_config

# Validate SSHD syntax and reload daemon

sshd -t

systemctl restart sshd

# Verify runtime SSH configuration

sshd -T | grep -E 'permitrootlogin|passwordauthentication'

# ==============================================================================

# ==============================================================================

# 3. REMEDIATE APPLICATION SECURITY: Lock DVWA Default Security to 'impossible'

# ==============================================================================

# Permanently enforce parameterized SQL queries and strict image-byte upload validation

sudo sed -i "s/^\([[:space:]]*\$_DVWA[[:space:]]*\[[[:space:]]*'default_security_level'[[:space:]]*\][[:space:]]*=\).*/\1 'impossible';/" /var/www/html/dvwa/config/config.inc.php

grep -n "default_security_level" /var/www/html/dvwa/config/config.inc.php

# ==============================================================================

# 4. REMEDIATE FLAW 3: Deploy Execution-Blocking .htaccess & Enable AllowOverride

# ==============================================================================

# Enable AllowOverride All in Apache configuration so .htaccess rules are enforced

sed -i '/Directory \/var\/www\//,/\/Directory/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

systemctl restart apache2

cat << 'EOF' > /var/www/html/dvwa/hackable/uploads/.htaccess

<FilesMatch "\.(php|php[0-9]|phtml|phar)$">

Order Deny,Allow

Deny from all

</FilesMatch>

EOF

# Enforce strict filesystem ownership and permissions

chown -R www-data:www-data /var/www/html/dvwa/hackable/uploads/

chmod 750 /var/www/html/dvwa/hackable/uploads/

chmod 644 /var/www/html/dvwa/hackable/uploads/.htaccess

# ==============================================================================

# 5. DEFENSIVE VERIFICATION: Confirm PHP execution is rejected with HTTP 403

# ==============================================================================

echo "<?php echo 'CANARY'; ?>" > /var/www/html/dvwa/hackable/uploads/canary.php 2>/dev/null

curl -i http://127.0.0.1/hackable/uploads/canary.php

```

### 📸 Proof of Execution:

![DVWA sudoers remediation and SSH hardening](../06-Resources/screenshots/deep-investigation-action/slot_02_eradication_dvwa_sudoers_patched.png)

*Figure 2: Terminal console review demonstrating syntax-validated removal of `www-data` sudoers privilege, confirmation of access denial (`Sorry, user www-data may not run sudo on dvwa`), and OpenSSH `permitrootlogin no` enforcement (matching slot_02_eradication_dvwa_sudoers_patched.png).*

![DVWA default security level hardened to impossible](../06-Resources/screenshots/deep-investigation-action/slot_02b_eradication_dvwa_impossible_security.png)

*Figure 2b: Production hardening of DVWA application configuration setting `default_security_level = 'impossible'`, eliminating SQL injection and unvalidated file upload vectors.*

![DVWA upload execution blocker verified](../06-Resources/screenshots/deep-investigation-action/slot_03_eradication_dvwa_upload_blocked.png)

*Figure 3: Apache configuration test confirming `AllowOverride All` deployment in `/etc/apache2/apache2.conf` and live curl request returning `HTTP/1.1 403 Forbidden` for PHP script requests.*

---

<a id="step-3-active-directory-account-eradication-privileged-demotion--kerberos-invalidation-pc-dc"></a>

# 5. Step 3: Active Directory Account Eradication, Privileged Demotion & Kerberos Invalidation (PC-DC)

> 🎯 **Objective:** Permanently delete the adversary's backdoor account (`AD\backdoor`), demote compromised service account `HANK_SHERMAN`, revoke SPN mappings, enforce Protected Users enrollment, and complete the `krbtgt` password invalidation cycle.  
> 💻 **Target:** Active Directory Domain Controller `PC-DC` (`192.168.56.10`)  
> 🔧 **Channel:** Enterprise PowerShell (RSAT Module)

### Vulnerability Breakdown & Remediation Rationale

1. **Adversary Persistence (`AD\backdoor`):** Created in Stage 17 via Impacket `wmiexec` (Alert #30, EID 4720). In containment, it was disabled and group memberships were stripped to preserve the object SID. With forensic deep-dive finished, it must be permanently deleted from Active Directory.

2. **Root Cause Flaw 4 (`HANK_SHERMAN` Domain Admin Service Account):** BadBlood configured service account `HANK_SHERMAN` with a registered Service Principal Name (`CIFS/AWSWAPPS1000000.ad.lab`) while concurrently granting it membership in `Domain Admins`. This allowed the attacker to Kerberoast the account (Alert #23), crack its weak password (`Password123`), and immediately invoke DCSync via DRSUAPI.

- *Fix:* Strip `HANK_SHERMAN` from `Domain Admins` and `Administrators`, delete the SPN mapping via `Set-ADUser -ServicePrincipalNames @{Remove=...}`, enforce AES-128/AES-256 Kerberos encryption types, and rotate its password to a 32-character complex string.

3. **Root Cause Flaw 5 (Credential Exposure & Golden Ticket Forgery):** DCSync dumped all domain NTLM hashes, enabling Pass-the-Hash and Golden Ticket generation using the `krbtgt` key (`...f4e05f60`).

- *Fix:* Enroll `Administrator` and `HANK_SHERMAN` into the Active Directory **`Protected Users`** security group. This prevents LSASS caching of plaintext credentials, forces Kerberos with AES encryption, and disables NTLM authentication and credential delegation. Confirm `krbtgt` has completed its two-pass password rotation (incrementing Key Version Number `msDS-KeyVersionNumber` to 3), permanently invalidating all forged Golden Tickets.

### Execution Script:

```powershell

# ==============================================================================

# 1. PERMANENT ERADICATION: Delete rogue account AD\backdoor from Active Directory

# ==============================================================================

$backdoor = Get-ADUser -Filter "SamAccountName -eq 'backdoor'" -Properties MemberOf, SID, WhenCreated

if ($backdoor) {

Write-Host "[*] Purging rogue object: $($backdoor.DistinguishedName) (SID: $($backdoor.SID))" -ForegroundColor Yellow

Remove-ADUser -Identity "backdoor" -Confirm:$false -Verbose

}

# Defensive Verification: Ensure object no longer exists

$verifyBackdoor = Get-ADUser -Filter "SamAccountName -eq 'backdoor'"

if (-not $verifyBackdoor) {

Write-Host "[+] SUCCESS: AD\backdoor permanently eradicated from Active Directory database." -ForegroundColor Green

}

# ==============================================================================

# 2. PRIVILEGE DEMOTION & SPN PURGE: Hardening service account HANK_SHERMAN

# ==============================================================================

# Strip privileged administrative group memberships

Remove-ADGroupMember -Identity "Domain Admins" -Members "HANK_SHERMAN" -Confirm:$false

Remove-ADGroupMember -Identity "Administrators" -Members "HANK_SHERMAN" -Confirm:$false

# Eradicate SPN to eliminate Kerberoasting attack surface

Set-ADUser -Identity "HANK_SHERMAN" -ServicePrincipalNames @{Remove="CIFS/AWSWAPPS1000000.ad.lab"}

# Enforce modern AES Kerberos encryption (prohibit RC4-HMAC)

Set-ADUser -Identity "HANK_SHERMAN" -KerberosEncryptionType AES128,AES256

# Rotate service account to a 32-character cryptographically random password

$NewHankPass = ConvertTo-SecureString "H@nk$h3rm@n_S3cur3_32Ch@r_R0t@t10n!" -AsPlainText -Force

Set-ADAccountPassword -Identity "HANK_SHERMAN" -NewPassword $NewHankPass -Reset

# ==============================================================================

# 3. ENTERPRISE CREDENTIAL ROTATION & PROTECTED USERS ENROLLMENT

# ==============================================================================

# Rotate Enterprise Domain Administrator password

$NewAdminPass = ConvertTo-SecureString "P@ssw0rd_Ent3rpr1s3_Adm1n_9988!!#" -AsPlainText -Force

Set-ADAccountPassword -Identity "Administrator" -NewPassword $NewAdminPass -Reset

# Rotate Win10 Workstation User password

$NewWin10Pass = ConvertTo-SecureString "W1n10_S3cur3_W0rkst@t10n_P@ss2026!" -AsPlainText -Force

Set-ADAccountPassword -Identity "win10" -NewPassword $NewWin10Pass -Reset

# Enroll high-privilege identities into the Protected Users security group

Add-ADGroupMember -Identity "Protected Users" -Members "Administrator", "HANK_SHERMAN"

# ==============================================================================

# 4. POST-INCIDENT TELEMETRY HARDENING: Enable LDAP Field Engineering Logging (Event ID 1644)

# ==============================================================================

# Configure NTDS Field Engineering diagnostic logging to capture BloodHound LDAP recon queries (closes diagnostic gap identified in Stage 12)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics" -Name "15 Field Engineering" -Value 5 -Type DWord
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" -Name "Expensive Search Results Threshold" -Value 1 -Type DWord
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\NTDS\Parameters" -Name "Inefficient Search Results Threshold" -Value 1 -Type DWord

# ==============================================================================

# 5. WORKSTATION REMEDIATION: Purge Ransomware Notes & Restore Wallpaper (Win10User)

# ==============================================================================

# Purge ransom notes and simulated encrypted files across user and administrator desktops

Remove-Item -Path "$env:USERPROFILE\Desktop\README_HACKED.txt", "$env:USERPROFILE\Desktop\*.enc", "C:\Users\Public\Desktop\README_HACKED.txt", "C:\Users\Administrator\Desktop\README_HACKED.txt", "C:\Users\Administrator\Desktop\*.enc" -Force -ErrorAction SilentlyContinue

# Restore default Windows wallpaper and force Explorer repaint via Win32 P/Invoke

$wallpaper = "$env:windir\Web\Wallpaper\Windows\img0.jpg"

if (Test-Path $wallpaper) {

Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name Wallpaper -Value $wallpaper

Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name WallpaperStyle -Value "10"

Set-ItemProperty -Path "HKCU:\Control Panel\Desktop" -Name TileWallpaper -Value "0"

Add-Type -TypeDefinition @"

using System.Runtime.InteropServices;

public class WallpaperAPI {

[DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)]

public static extern bool SystemParametersInfo(int action, int param, string path, int flags);

}

"@

[WallpaperAPI]::SystemParametersInfo(20, 0, $wallpaper, 3)

}

# ==============================================================================

# 6. DEFENSIVE VERIFICATION: Confirm Protected Users, krbtgt status & Clean Desktop

# ==============================================================================

Get-ADGroupMember -Identity "Protected Users" | Select-Object SamAccountName, DistinguishedName

Get-ADUser -Identity "krbtgt" -Properties PasswordLastSet, msDS-KeyVersionNumber | Select-Object SamAccountName, PasswordLastSet, msDS-KeyVersionNumber

```

### 📸 Proof of Execution:

![Active Directory backdoor account deleted](../06-Resources/screenshots/deep-investigation-action/slot_04_eradication_ad_backdoor_deleted.png)  

*Figure 4: Active Directory PowerShell console confirming object inspection and permanent removal (`Remove-ADUser`) of `AD\backdoor` from the NTDS.dit database.*

![Service account HANK_SHERMAN demoted and SPN purged](../06-Resources/screenshots/deep-investigation-action/slot_05_eradication_ad_hank_demoted.png)  

*Figure 5: PowerShell console demonstrating removal of `HANK_SHERMAN` from `Domain Admins`, elimination of SPN `CIFS/AWSWAPPS1000000.ad.lab`, and enforcement of AES128/AES256 Kerberos encryption.*

![Protected Users enrollment and krbtgt KVNO verified](../06-Resources/screenshots/deep-investigation-action/slot_06_eradication_ad_protected_users.png)  

*Figure 6: Verification of `Administrator` and `HANK_SHERMAN` enrolled in the `Protected Users` security group, alongside `krbtgt` Key Version Number incremented to KVNO 3.*

![Enterprise Desktop Wallpaper Restored and Ransomware Cleaned](../06-Resources/screenshots/deep-investigation-action/slot_06b_eradication_desktop_wallpaper_restored.png)

*Figure 6b: Windows 10 workstation desktop verifying the complete elimination of defacement wallpaper, purging of `README_HACKED.txt` and dummy `*.enc` ransom files, and restoration of the default corporate wallpaper via `SystemParametersInfo` P/Invoke.*

---

# 6. Step 4: Enterprise Multicast & Broadcast Name Resolution Hardening (Disable LLMNR & NetBIOS)

> 🎯 **Objective:** Permanently eliminate Root Cause Flaw 6 by disabling unauthenticated Link-Local Multicast Name Resolution (LLMNR) and NetBIOS over TCP/IP across all Windows domain endpoints.  
> 💻 **Scope:** `PC-DC` (`192.168.56.10`) and `Win10User` (`192.168.56.20`)  
> 🔧 **Channel:** Enterprise PowerShell (Group Policy Registry & CIM Networking Methods)

### Vulnerability Breakdown & Remediation Rationale

In Stage 10, the adversary launched Responder on DVWA (`192.168.56.30`) interface `ens33` (`python3 /opt/Responder/Responder.py -I ens33 -wd`). When workstation `Win10User` (`192.168.56.20`) was prompted via `DavSetCookie` to query `http://nonexistent/share`, it emitted LLMNR (UDP 5355) and NetBIOS Name Service (UDP 137) queries across the `192.168.56.0/24` broadcast domain. Responder spoofed authoritative answers, forced WebDAV/NTLM authentication via `DavSetCookie` (`rundll32.exe`, Wazuh Custom Rule 100278, `wzb-28`), and captured the `AD.LAB\win10` NetNTLMv2 challenge-response hash.

By disabling LLMNR at the DNS client level and setting `NetbiosOptions = 2` (Disable NetBIOS over TCP/IP) on every network interface, Windows hosts strictly require authoritative unicast DNS queries from the Domain Controller (`192.168.56.10`). Rogue broadcast spoofers can no longer intercept authentication requests.

### Execution Script:

```powershell

# ==============================================================================

# 1. DISABLE LLMNR: Group Policy Registry Key Enforcement

# ==============================================================================

$DNSClientPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows NT\DNSClient"

if (-not (Test-Path $DNSClientPath)) {

New-Item -Path $DNSClientPath -Force | Out-Null

}

Set-ItemProperty -Path $DNSClientPath -Name "EnableMulticast" -Value 0 -Type DWord

# Verify LLMNR is disabled (0 = Disabled, 1 = Enabled)

$llmnrStatus = (Get-ItemProperty -Path $DNSClientPath).EnableMulticast

Write-Host "[+] LLMNR EnableMulticast Value: $llmnrStatus (0 = Fully Disabled)" -ForegroundColor Green

# ==============================================================================

# 2. DISABLE NETBIOS OVER TCP/IP: CIM Hardware Adapter Reconfiguration

# ==============================================================================

# NetbiosOptions: 0 = Default/DHCP, 1 = Enabled, 2 = Disabled

$Adapters = Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter "IPEnabled = True"

foreach ($Adapter in $Adapters) {

Write-Host "[*] Disabling NetBIOS on interface: $($Adapter.Description)..." -ForegroundColor Cyan

$Adapter | Invoke-CimMethod -MethodName SetTcpipNetbios -Arguments @{TcpipNetbiosOptions = 2} | Out-Null

}

# ==============================================================================

# 3. DEFENSIVE VERIFICATION: Inspect active interface parameters

# ==============================================================================

Get-CimInstance -ClassName Win32_NetworkAdapterConfiguration -Filter "IPEnabled = True" | 

Select-Object Description, IPAddress, TcpipNetbiosOptions

```

### 📸 Proof of Execution:

![Disabling LLMNR and NetBIOS over TCP/IP](../06-Resources/screenshots/deep-investigation-action/slot_07_eradication_llmnr_netbios_disabled.png)  

*Figure 7: Windows PowerShell execution verifying registry configuration `EnableMulticast = 0` and CIM network adapter reconfiguration setting `TcpipNetbiosOptions = 2`.*

---

# 7. Step 5: Network Micro-Segmentation & DMZ Lateral Movement Boundary Enforcement

> 🎯 **Objective:** Permanently eliminate Root Cause Flaw 7 by enforcing strict zero-trust network boundaries between the DMZ web server (`192.168.56.30`) and the internal Active Directory subnet (`192.168.56.0/24`).  
> 💻 **Scope:** Suricata Gateway Firewall (`192.168.56.150` on ens37 / `192.168.232.162` on ens33) & DVWA Host (`192.168.56.30`)  
> 🔧 **Channel:** Velociraptor Live Response (`Linux.Sys.BashShell`)

### Vulnerability Breakdown & Remediation Rationale

The primary catalyst for total domain compromise was the absence of internal egress filtering. Once root was obtained on DVWA, the attacker leveraged `192.168.56.30` to launch internal port scans (Stage 09), capture internal broadcast traffic (Stage 10), query Active Directory LDAP directly (Stage 12), request Kerberos service tickets (Stage 13), execute DCSync RPC replication (Stage 14), and execute remote WMI/SMB commands against `192.168.56.10` and `192.168.56.20` (Stages 15, 17, 20).

To enforce proper DMZ architecture, we implement dual-layer micro-segmentation:

1. **Gateway Firewall Forward Rules:** Drop and reject all traffic originating from DVWA DMZ destined for internal Windows infrastructure ports (Kerberos 88, NetBIOS 137-139, RPC 135, LDAP 389/636, SMB 445, GC 3268/3269, RDP 3389, WinRM 5985/5986).

2. **DVWA Host Output Rules:** Reject all outbound traffic directed to `192.168.56.10` and `192.168.56.20`, permitting outbound connections exclusively to the central Cloud SOC monitoring infrastructure (Wazuh Agent TCP 1514/1515 on `10.122.1.4` and Velociraptor TLS 8000 on `10.122.0.4` routed over the WireGuard tunnel gateway `192.168.56.150`).

### Execution Script:

```bash

# ==============================================================================

# 1. GATEWAY FIREWALL (192.168.56.150): Inter-subnet micro-segmentation rules

# ==============================================================================

# Reject outbound DMZ TCP connections to internal Windows Directory & RPC services

iptables -I FORWARD 1 -s 192.168.56.30 -d 192.168.56.0/24 \

-p tcp -m multiport --dports 88,135,139,389,445,636,3268,3269,3389,5985,5986 \

-j REJECT --reject-with icmp-port-unreachable

# Reject outbound DMZ UDP connections to internal Kerberos, NetBIOS, and LDAP services

iptables -I FORWARD 2 -s 192.168.56.30 -d 192.168.56.0/24 \

-p udp -m multiport --dports 88,137,138,389 \

-j REJECT --reject-with icmp-port-unreachable

# ==============================================================================

# 2. DVWA HOST (192.168.56.30): Strict host-level egress lockdown

# ==============================================================================

# Prohibit direct IP communication to Domain Controller and Workstation

# Insert at rule index 1 so lateral blocking takes precedence over any general ACCEPT rules

iptables -I OUTPUT 1 -d 192.168.56.10 -j REJECT --reject-with icmp-admin-prohibited

iptables -I OUTPUT 1 -d 192.168.56.20 -j REJECT --reject-with icmp-admin-prohibited

# Explicitly permit SOC telemetry transit to Cloud Wazuh and Velociraptor endpoints via WireGuard gateway

iptables -A OUTPUT -p tcp -d 10.122.1.4 -m multiport --dports 1514,1515 -j ACCEPT

iptables -A OUTPUT -p tcp -d 10.122.0.4 --dport 8000 -j ACCEPT

# Save rules to persist across system reboots

netfilter-persistent save

# ==============================================================================

# 3. DEFENSIVE VERIFICATION: Review active rule drop counters

# ==============================================================================

iptables -L OUTPUT -n -v --line-numbers

```

### 📸 Proof of Execution:

![DMZ firewall micro-segmentation verified](../06-Resources/screenshots/deep-investigation-action/slot_08_eradication_dmz_firewall_hardened.png)  

*Figure 8: DVWA host firewall console verifying active kernel-level OUTPUT rules rejecting direct communication to Domain Controller (`192.168.56.10`) and workstation (`192.168.56.20`) with `icmp-admin-prohibited`.*

---

# 8. Step 6: Full Operational Recovery, Service Availability & Security Health Verification

> 🎯 **Objective:** Validate production service health across all endpoints, confirm Active Directory replication and directory integrity, ensure clean workstation desktop environments, and verify SIEM telemetry health.  
> 💻 **Scope:** All 4 Local Network Hosts (Suricata Gateway `192.168.56.150`, Domain Controller `192.168.56.10`, Workstation `192.168.56.20`, DVWA `192.168.56.30`)  
> 🔧 **Channel:** Multi-Platform Enterprise Health Checks

### Comprehensive Verification Matrix:

1. **DVWA Web Application Health:**

- Public HTTP endpoint responds with `HTTP 200 OK` in < 20 ms.

- Database connection verified with updated database credentials (`S0C_S3cur3_Db_P@ssw0rd_2026!`).

- Web root and upload directory are clean; canary script executions return `HTTP 403 Forbidden`.

2. **Active Directory Forest Health (`PC-DC`):**

- Microsoft Domain Controller Diagnostics (`dcdiag`) validates all 5 essential directory tests (`Connectivity`, `Advertising`, `FSMOCheck`, `Replication`, `Services`) with `Passed test` status.

- Active Directory replication (`repadmin /showrepl`) confirms 0 failures across all naming contexts.

- User authentication over Kerberos functions correctly for legitimate domain users using rotated credentials.

3. **Enterprise Workstation State (`Win10User`):**

- User `win10` successfully logs in via Kerberos authentication.

- Desktop defacement completely resolved: `README_HACKED.txt` and simulated `.enc` files removed; default Windows wallpaper registry parameters verified.

4. **Wazuh Monitoring Fabric State:**

- Wazuh Manager validates all 4 connected agents (`Suricata-GW` 001, `DVWA-Server` 002, `Win10User` 003, `DomainWin10` 004) in **Active** status.

- Zero critical alerts (`Level >= 8`) generated across the entire 60-minute post-remediation monitoring window.

### Execution Script:

```powershell

# ==============================================================================

# 1. WEB SERVICE VERIFICATION (Run from SOC Analyst Console)

# ==============================================================================

curl -s -o /dev/null -w "HTTP Status: %{http_code} | Latency: %{time_total}s\n" http://192.168.56.30/login.php

# ==============================================================================

# 2. ACTIVE DIRECTORY DIAGNOSTICS (Run on Domain Controller PC-DC)

# ==============================================================================

dcdiag /test:Replication /test:Advertising /test:FSMOCheck /test:Services | Select-String -Pattern "passed test"

# ==============================================================================

# 3. WAZUH AGENT CONTROLLER FABRIC STATUS (Run on Wazuh Manager)

# ==============================================================================

/var/ossec/bin/agent_control -l

```

### 📸 Proof of Execution:

![Production health and Wazuh agent verification](../06-Resources/screenshots/deep-investigation-action/slot_09_eradication_health_verification.png)  

*Figure 9: Unified health verification demonstrating DVWA HTTP 200 availability, DCDiag directory tests passing, and all 4 Wazuh security agents active with zero security alerts.*

---

<a id="step-7-thehive-46-alert-queue-disposition--3-case-resolution-management"></a>

# 9. Step 7: TheHive 46-Alert Queue Disposition & 3-Case Resolution Management

> 🎯 **Objective:** Review the entire 46-alert operational queue in TheHive, dismiss 3 confirmed false positives with documented rationale, correlate 43 confirmed breach alerts into 3 operational cases, complete all investigative tasks, and officially close each case with formal resolution verdicts.  
> 💻 **Console:** TheHive 5.7.5 SOAR Platform (`http://10.122.0.4:9000`)  
> 🏷️ **Master Incident Tag:** `INC-2026-1018-ALPHA`

### Comprehensive 46-Alert Queue Disposition Rationale

Every alert ingested by TheHive from Wazuh was individually audited by the incident response team:

- **3 False Positives Dismissed (6.5%):**

1. **Alert #01 (17:10:08 IST):** *External Nmap TCP 4444 SYN Probe* — Dismissed as perimeter network scanning noise. Prior to the upload of `shell.php` in Stage 06, no service was listening on port 4444. The packet was dropped with TCP RST.

2. **Alert #06 (17:12:08 IST):** *Web App Shellshock HTTP Canary Probe* — Dismissed as web vulnerability scanner noise. Nikto injected an Apache Shellshock canary string into HTTP headers; Apache returned HTTP 404 with no code execution.

3. **Alert #18 (17:30:51 IST):** *Internal Subnet TCP 4444 SYN Probe* — Dismissed as internal network sweep noise. During internal reconnaissance from DVWA, Nmap swept `192.168.56.10:4444`; target returned TCP RST.

![TheHive False Positives Dismissed](../06-Resources/screenshots/thehive-cases/thehive_false_positives_dismissed.png)  

*Figure 9b: TheHive 5 Alerts Console filtered by `Status: FalsePositive`, demonstrating all 3 non-actionable scanner alerts (#01, #06, #18) officially dismissed and archived with documented SOC analyst rationales.*

- **43 True Positive Alerts Promoted into 3 Master Cases (93.5%):**

- **Case 01 (`CAS-001-WEBCOMP`):** Grouped **15 alerts** (13 True Positives promoted to incident investigation + 2 audited False Positives #01, #06) covering perimeter reconnaissance, credential brute-forcing, SQL injection credential extraction, web shell injection, reverse shell execution, and sudo root escalation.

- **Case 02 (`CAS-002-LATMOVE`):** Grouped **9 alerts** (8 True Positives promoted to incident investigation + 1 audited False Positive #18) covering SSH root persistence, internal network discovery, LLMNR broadcast poisoning, BloodHound reconnaissance, Kerberoasting, and DCSync replication.

- **Case 03 (`CAS-003-DOMIMP`):** Grouped **22 alerts** covering Pass-the-Hash arrival on the Domain Controller, Golden Ticket forgery, `AD\backdoor` creation, Domain Admins elevation, sensitive data staging, SCP exfiltration, and dual-endpoint defacement/ransomware impact.

### Master Alert Disposition Matrix (46 Total Alerts):

| Alert # | Time (IST) | Detection Rule & Event Name | Ingestion Source | Assigned Action / Target Case | Resolution Disposition |
|:---:|:---:|:---|:---:|:---:|:---:|
| **#01** | `17:10:09` | [2x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP | Suricata Gateway | **None (Dismissed)** | **Ignored / False Positive** |
| **#02** | `17:10:09` | [TOOL:unknown-scanner x17] [Suricata] 192.168.232.135 | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#03** | `17:10:09` | [TOOL:Nmap x3] [Suricata] 192.168.232.135 | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#04** | `17:12:05` | [2x] [DVWA] DVWA: Multiple 400 errors - [404] [192.168.232.135] [/udOIY0cZ.fhp] | DVWA (Apache) | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#05** | `17:12:08` | [1x] [Suricata] Suricata: High-volume HTTP 4xx burst from 192.168.232.135... | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#06** | `17:12:08` | [5x] [DVWA] Shellshock attack detected | DVWA (Apache) | **None (Dismissed)** | **Ignored / False Positive** |
| **#07** | `17:12:09` | [16x] [DVWA] Multiple common web attacks from same source ip. | DVWA (Apache) | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#08** | `17:12:09` | [WATCHLIST x14: passwd] [DVWA] 192.168.232.135 | DVWA (Apache) | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#09** | `17:12:10` | [26x] [DVWA] Multiple XSS (Cross Site Scripting) attempts from same source ip. | DVWA (Apache) | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#10** | `17:12:16` | [4x] [Suricata] Suricata: Alert - GPL EXPLOIT unicode directory traversal attempt | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#11** | `17:18:02` | [22x] [Suricata] Suricata: [200] [192.168.232.135] [/login.php] [ET INFO User-Agent...] | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#12** | `17:21:53` | [FANOUT x1] [DVWA] parent PID 17550 (/usr/bin/id) | DVWA (Auditd) | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#13** | `17:21:58` | [1x] [Suricata] Suricata: Alert - ET ATTACK_RESPONSE Output of id command... | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#14** | `17:24:03` | [5x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP | Suricata Gateway | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#15** | `17:24:03` | [FANOUT x1] [DVWA] parent PID 17562 (/usr/bin/nc.openbsd) | DVWA (Auditd) | Case 01 (`CAS-001-WEBCOMP`) | **Resolved / True Positive** |
| **#16** | `17:29:43` | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA (SSHD) | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#17** | `17:30:49` | [TOOL:Nmap x9] [Suricata] 192.168.56.30 | Suricata Gateway | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#18** | `17:30:51` | [5x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP | Suricata Gateway | **None (Dismissed)** | **Ignored / False Positive** |
| **#19** | `17:32:16` | [TOOL:unknown-scanner x14] [Suricata] 192.168.56.30 | Suricata Gateway | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#20** | `17:34:27` | [4x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA (SSHD) | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#21** | `17:39:46` | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA (SSHD) | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#22** | `18:01:02` | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA (SSHD) | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#23** | `18:01:18` | [1x] [Suricata] Suricata: Alert - ET EXPLOIT Possible GoldenPac Priv Esc in-use | Suricata Gateway | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#24** | `18:03:52` | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA (SSHD) | Case 02 (`CAS-002-LATMOVE`) | **Resolved / True Positive** |
| **#25** | `18:04:47` | [FANOUT x2] [DomainWin10] parent PID 4432 (wmiexec init) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#26** | `18:05:44` | [FANOUT x2] [DomainWin10] parent PID 4432 (whoami/hostname) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#27** | `18:06:53` | [FANOUT x2] [DomainWin10] parent PID 4432 (wmiexec cd) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#28** | `18:07:26` | [FANOUT x2] [DomainWin10] parent PID 4432 (whoami/hostname) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#29** | `18:08:21` | [FANOUT x3] [DomainWin10] parent PID 4432 (net user backdoor /add) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#30** | `18:08:22` | [3x] [DomainWin10] Logon activity: BACKDOOR @ local (EID 4720/4722/4738) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#31** | `18:08:27` | [1x] [DomainWin10] Logon activity: ADMINISTRATORS @ local (EID 4732) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#32** | `18:09:05` | [FANOUT x3] [DomainWin10] parent PID 4432 (net group Domain Admins) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#33** | `18:09:05` | [1x] [DomainWin10] Logon activity: DOMAIN ADMINS @ local (EID 4728) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#34** | `18:09:28` | [2x] [DomainWin10] Logon activity: BACKDOOR @ local (/passwordchg:no) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#35** | `18:13:58` | [FANOUT x2] [DomainWin10] parent PID 4432 (domain_users / admin_info) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#36** | `18:14:58` | [FANOUT x3] [Win10User] parent PID 4008 (sensitive_data.txt) | Win10User (Win10) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#37** | `18:17:30` | [6x] [DVWA] Logon activity: ROOT @ 192.168.232.135 (SSH Reconnect) | DVWA (SSHD) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#38** | `18:19:02` | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 (SSH Reconnect) | DVWA (SSHD) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#39** | `18:19:49` | [FANOUT x9] [DomainWin10] parent PID 4432 (DC Ransomware/Reboot) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#40** | `18:20:05` | [FANOUT x1] [DomainWin10] parent PID 6500 (Child of #39 reg.exe) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#41** | `18:20:11` | [FANOUT x1] [DomainWin10] parent PID 4980 (Child of #39 reg.exe) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#42** | `18:23:59` | [FANOUT x9] [Win10User] parent PID 4008 (Win10 Ransomware/Reboot) | Win10User (Win10) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#43** | `18:23:59` | [3x] [Suricata] Suricata: Alert - ET INFO NTLM Session Setup Request | Suricata Gateway | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#44** | `18:24:12` | [FANOUT x1] [Win10User] parent PID 1724 (Child of #42 reg.exe) | Win10User (Win10) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#45** | `18:24:18` | [FANOUT x1] [Win10User] parent PID 3880 (Child of #42 reg.exe) | Win10User (Win10) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |
| **#46** | `18:36:34` | [1x] [DomainWin10] Logon activity: BACKDOOR @ local (Post-Reboot 4738) | DomainWin10 (PC-DC) | Case 03 (`CAS-003-DOMIMP`) | **Resolved / True Positive** |

---

### TheHive Case 01: `CAS-001-WEBCOMP`

- **Case Name:** Perimeter Breach, SQL Injection, Web Shell & Sudo Root Escalation

- **Scope:** Stages 01 through 07 | 13 Linked Alerts (#02–#05, #07–#15)

- **Status:** **RESOLVED** | **Verdict:** **True Positive** | **Impact:** **With Impact**

- **Closure Actions:** Terminated port 4444 reverse shell; moved `shell.php` to `/root/forensics_quarantine/` with `chmod 000`; removed `www-data` NOPASSWD Python from `/etc/sudoers`; deployed execution-blocking `.htaccess` in `/hackable/uploads/`; rotated MariaDB `dvwa` user and application `admin` passwords; hardened OpenSSH daemon with `PermitRootLogin no`.

![TheHive Case 01 Closed](../06-Resources/screenshots/thehive-cases/thehive_case01_closed.png)  

*Figure 10: TheHive 5 Case Record for `CAS-001-WEBCOMP` showing 13 linked alerts, 7 completed remediation tasks, and formal closure verdict.*

---

### TheHive Case 02: `CAS-002-LATMOVE`

- **Case Name:** Pivot SSH Persistence, Broadcast Poisoning, BloodHound & DCSync

- **Scope:** Stages 08 through 14 | 8 Linked Alerts (#16, #17, #19–#24)

- **Status:** **RESOLVED** | **Verdict:** **True Positive** | **Impact:** **With Impact**

- **Closure Actions:** Purged injected ED25519 root SSH public key; audited adversary rm deletion of harvested hash caches (`/tmp/win10.hash`, `/tmp/hank.hash`); deleted `/opt/Responder`; unmasked and restored `systemd-resolved` DNS stub resolver; globally disabled LLMNR (`EnableMulticast = 0`) and NetBIOS (`NetbiosOptions = 2`) across Windows endpoints; stripped `HANK_SHERMAN` from `Domain Admins`; deleted SPN `CIFS/AWSWAPPS1000000.ad.lab`; rotated domain account passwords.

![TheHive Case 02 Closed](../06-Resources/screenshots/thehive-cases/thehive_case02_closed.png)  

*Figure 11: TheHive 5 Case Record for `CAS-002-LATMOVE` showing 8 linked alerts, pivot eradication verification, and formal closure verdict.*

---

### TheHive Case 03: `CAS-003-DOMIMP`

- **Case Name:** Pass-the-Hash Lateral Movement, Golden Ticket Forgery, AD Backdoor & Ransomware Defacement

- **Scope:** Stages 15 through 20 | 22 Linked Alerts (#25 through #46)

- **Status:** **RESOLVED** | **Verdict:** **True Positive** | **Impact:** **With Impact**

- **Closure Actions:** Permanently deleted rogue account `AD\backdoor` via `Remove-ADUser`; completed double-reset of `krbtgt` password (incrementing KVNO to 3 to invalidate Golden Tickets); enrolled `Administrator` and `HANK_SHERMAN` in `Protected Users`; verified adversary rm deletion of staged exfiltration files and quarantined ransomware artifacts (`README_HACKED.txt`, `*.enc`); restored Windows desktop wallpaper registry; implemented DMZ egress micro-segmentation.

![TheHive Case 03 Closed](../06-Resources/screenshots/thehive-cases/thehive_case03_closed.png)  

*Figure 12: TheHive 5 Case Record for `CAS-003-DOMIMP` showing 22 linked alerts, forest-wide identity hardening, and formal closure verdict.*

---

### Consolidated Case Management & Queue Verification

With all 3 cases resolved and all 46 alerts accounted for, the operational alert queue and case dashboards confirm clean closure:

![TheHive Cases Overview Dashboard](../06-Resources/screenshots/thehive-cases/thehive_cases_overview_resolved.png)  

*Figure 13: TheHive Cases Overview Dashboard displaying 100% resolution (3/3 cases resolved) with True Positive / With Impact verdicts.*

![TheHive Alert Queue Cleared](../06-Resources/screenshots/thehive-cases/thehive_alert_queue_cleared.png)  

*Figure 14: TheHive Ingestion Queue verifying 0 pending unhandled alerts (43 promoted to cases, 3 dismissed as benign noise).*

---

# 10. Eradication & System Recovery Sign-Off Matrix

| Flaw / Asset # | Root Cause Vulnerability | Operational Eradication Action Taken | Verification Standard | Operational Verdict | Sign-Off Lead |
|:---:|:---|:---|:---|:---:|:---:|
| **Root Flaw 1** | `www-data` NOPASSWD Python in `/etc/sudoers` | Purged directive from `/etc/sudoers`; removed `/etc/sudoers.d/www-data`; verified via `visudo -c` | `sudo -u www-data sudo -l` returns *Sorry, user www-data may not run sudo* | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Root Flaw 2** | Permissive OpenSSH configuration (`PermitRootLogin yes`) | Set `PermitRootLogin no` & `PasswordAuthentication no`; purged rogue authorized_keys; restarted SSHD | `sshd -T` confirms root login denied; direct root SSH attempts rejected | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Root Flaw 3** | Unrestricted script execution in web upload directory | Deployed `.htaccess` denying script engines; set directory permissions to `chmod 750` | HTTP request to upload canary returns `HTTP 403 Forbidden` | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Root Flaw 4** | High-privilege service account `HANK_SHERMAN` in `Domain Admins` | Stripped account from `Domain Admins` & `Administrators`; purged SPN via `Set-ADUser`; enforced AES encryption | `Get-ADUser` confirms empty `MemberOf` and `ServicePrincipalNames` | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Root Flaw 5** | Unprotected administrative credentials & Golden Ticket risk | Enrolled `Administrator` into `Protected Users`; rotated domain passwords; twice-reset `krbtgt` password | `Get-ADGroupMember "Protected Users"` verified; `krbtgt` KVNO incremented to 3 | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Root Flaw 6** | Unauthenticated broadcast name resolution (LLMNR & NetBIOS) | Enforced registry `EnableMulticast = 0`; reconfigured CIM adapters to `NetbiosOptions = 2` | Multicast UDP 5355 and UDP 137 queries completely silenced | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Root Flaw 7** | Unrestricted DMZ-to-Internal lateral network routing | Implemented gateway & host iptables egress drops on internal AD ports (88, 135, 389, 445) | Outbound connection attempts from DVWA to internal subnet rejected | **PERMANENTLY REMEDIATED** | Lead SOC Analyst |
| **Anti-Forensics Audit & Loot Purge** | 9 intermediate staging files in `/tmp/` | Securely wiped adversary loot using `shred -u -z -n 3 /tmp/*.hash /tmp/*.ccache /tmp/dcsync_output*`; verified `/tmp/` clean state; purged `/opt/Responder` | `ls -la /tmp/` confirms 0 adversary files; `systemd-resolved` active | **VERIFIED & PURGED** | Lead SOC Analyst |
| **Account Purge** | Rogue Active Directory backdoor identity `AD\backdoor` | Permanently eradicated object via `Remove-ADUser -Identity "backdoor" -Confirm:$false` | `Get-ADUser -Filter "SamAccountName -eq 'backdoor'"` returns null | **PERMANENTLY PURGED** | Lead SOC Analyst |
| **Desktop State** | Defaced workstation wallpaper and extortion ransom notes | Quarantined extortion notes and `.enc` files; reset wallpaper registry keys; executed `SystemParametersInfo` P/Invoke refresh | Workstation desktop clean; registry points to default system theme | **PERMANENTLY RESTORED** | Lead SOC Analyst |
| **SIEM Fabric** | 4-agent security telemetry monitoring integrity | Validated all 4 Wazuh agents Active; verified OpenSearch alert rate at 0 critical alerts | `/var/ossec/bin/agent_control -l` confirms 100% agent connectivity | **HEALTHY & ACTIVE** | Lead SOC Analyst |
| **SOAR Queue** | 46 raw incoming alerts across 3 campaign scopes | Triaged 3 FPs as Ignored; promoted 43 breach alerts into Cases 01–03; completed all tasks; closed cases | TheHive dashboard verifies 0 pending alerts; 3/3 cases marked Resolved | **OFFICIALLY RESOLVED** | Lead SOC Analyst |

