# Incident Post-Mortem Report: Enterprise Network Breach & Active Directory Takeover

## Report Overview

| Field | Details |
|---|---|
| **Incident ID** | `INC-2026-1018-ALPHA` |
| **Report Status** | Final / Resolved |
| **What Happened** | Multi-stage cyber intrusion leading to full Active Directory domain compromise |
| **Severity** | Critical (CVSS 9.8 — Full Domain Takeover) |
| **Information Sharing** | `TLP:AMBER / PAP:AMBER` |
| **Affected Machines** | DMZ Web Server (`192.168.56.30`), Windows 10 Workstation (`192.168.56.20`), Domain Controller (`192.168.56.10`) |
| **Lead Investigator** | Manichand Gupta (Lead Incident Responder) |
| **Linked TheHive Cases** | [Case 01 (`CAS-001-WEBCOMP`)](../04-Investigation/Cases/case-01-web-compromise.md), [Case 02 (`CAS-002-LATMOVE`)](../04-Investigation/Cases/case-02-lateral-movement.md), [Case 03 (`CAS-003-DOMIMP`)](../04-Investigation/Cases/case-03-domain-compromise.md) |

[![Consolidated Incident Response 74-Minute Timeline](../06-Resources/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)](../06-Resources/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)
*Figure 1: Full 74-minute incident timeline ($T_0$ to $T_0 + 74\text{m}$), mapping attacker milestones (top) against blue-team detection alerts across Suricata, Auditd, Wazuh, Sysmon, and TheHive (bottom).*

---

## 📑 Table of Contents

1. [Executive Summary: What Happened](#1-executive-summary-what-happened)
2. [What Systems Were Hit?](#2-what-systems-were-hit)
3. [The Full Attack Story (Phase by Phase)](#3-the-full-attack-story-phase-by-phase)
4. [The 7 Mistakes That Made This Breach Possible](#4-the-7-mistakes-that-made-this-breach-possible)
5. [How Well Did Our Detections Work?](#5-how-well-did-our-detections-work)
6. [How We Contained and Fixed It](#6-how-we-contained-and-fixed-it)
7. [Our Hardening Roadmap](#7-our-hardening-roadmap)
8. [Formal Sign-Off](#8-formal-sign-off)

---

# 1. Executive Summary: What Happened

On **October 18, 2026, between 17:10:09 and 18:24:18 IST** (a total span of **74 minutes and 9 seconds**), an external attacker sitting at `192.168.232.135` (Kali Linux) completely compromised our hybrid corporate network. 

The attack escalated with shocking speed: starting with an ordinary web port scan, the attacker found a vulnerable web app, jumped to `root` on Linux in 10 seconds, pivoted into our private Windows subnet, cracked Active Directory credentials, forged a Kerberos Golden Ticket, stole confidential files, and defaced desktops while dropping simulated ransomware notes.

![Consolidated 4-Act Attack Chain](../06-Resources/diagrams/Consolidated%204-Act%20Attack%20Chain.png)

### Real-World Business & Security Impact
- **Confidentiality: Severe Compromise**
  - All web application database user credentials and password hashes were dumped via SQL injection.
  - The corporate Windows 10 user hash (`AD.LAB\win10`) was stolen over the wire and cracked offline (`Secur3Lab!`).
  - An Active Directory service account ticket (`AD.LAB\HANK_SHERMAN`) was Kerberoasted and cracked (`Password123`).
  - The entire Active Directory database (`NTDS.dit`) was stolen using DCSync, compromising password hashes for every single user, computer, and the master domain `krbtgt` secret (`611a8cdcc21cb3fe3bf3a4c2f4e05f60`).
  - Sensitive internal documents (`domain_users.txt`, `admin_info.txt`, `sensitive_data.txt`) were exfiltrated via SCP.
- **Integrity: Full Control Lost**
  - The attacker obtained full root command execution on the Linux web server.
  - A persistent backdoor user (`AD\backdoor`) was added directly to `Domain Admins`.
  - A Kerberos Golden Ticket was forged, giving the attacker untraceable god-mode access that survived password resets.
  - Desktop wallpapers on both the Domain Controller and workstation were tampered with via the registry.
- **Availability: Systems Disrupted**
  - The web application was degraded during active exploitation.
  - Both the Domain Controller and Windows 10 workstation were forcibly rebooted (`shutdown /r /t 0`) over WMI.
  - Simulated ransomware notes (`README_HACKED.txt`) and dummy encrypted files (`documents.enc`) were planted across desktops.

---

# 2. What Systems Were Hit?

Our environment consists of an internet-facing DMZ, an internal Windows corporate network, a Suricata network sensor, and a secure Cloud SIEM/SOAR stack:

| Machine Name | Operating System | IP Address | Role in the Lab | What Happened to It |
|:---|:---|:---|:---|:---:|
| **DVWA Server** | Ubuntu 24.04 LTS | `192.168.56.30` | Public Web Server (Apache / MariaDB) | **COMPROMISED** (Full Root & Used as Pivot) |
| **Domain Workstation** | Windows 10 Pro N for Workstations (22H2) | `192.168.56.20` | Corporate Workstation (`Win10User`) | **COMPROMISED** (Credentials Stolen & Defaced) |
| **Domain Controller** | Windows Server 2022 | `192.168.56.10` | Active Directory DC (`ad.lab` / DNS / Kerberos) | **COMPROMISED** (DCSync, Backdoor Admin Added) |
| **Security Gateway** | Ubuntu 24.04 LTS | `192.168.56.150` / `192.168.232.162` | Network Firewall & Suricata NIDS | **SAFE** (Recorded all wire traffic) |
| **Cloud SIEM / SOAR** | Ubuntu 24.04 LTS | `10.122.0.4` / `10.122.1.4` | Wazuh SIEM & TheHive 5 Case Management | **SAFE** (Processed and stored all alerts) |
| **Attacker Machine** | Kali Linux | `192.168.232.135` | External Attacker Box | **ATTACKER ORIGIN** |

---

# 3. The Full Attack Story (Phase by Phase)

Here is the play-by-play narrative of how the 74-minute attack unfolded:

### Phase 1: Rattling the Doorknobs (17:10:09 – 17:20:30 IST)
The attacker started by probing our perimeter with an Nmap stealth port scan (`-sS`). Once they saw port 80 open, they ran automated web scanners like Nikto and Gobuster. They spotted the DVWA application, used a quick Python script to brute-force the login page, and then entered a UNION SELECT SQL injection payload (`1' UNION SELECT user, password FROM users-- -`). The database dumped its entire user table on the screen. The attacker took the extracted MD5 hash for admin (`5f4dcc3b5aa7...`) and cracked it offline in 30 seconds using Hashcat (`DG-04`).

### Phase 2: The 10-Second Mistake (17:21:44 – 17:25:36 IST)
Logged in as admin, the attacker uploaded a simple one-line PHP webshell (`shell.php`) through DVWA's file upload form. They confirmed command execution by running `?cmd=id`, and then connected back to Kali using a Netcat reverse shell on port 4444. 
Once inside as low-privilege user `www-data`, they ran `sudo -l` and spotted our worst mistake: `www-data` had permission to run Python with `sudo` with **no password required**. They ran one line of Python (`sudo python3 -c 'import os; os.system("/bin/bash")'`) and **became root in under 10 seconds**.

### Phase 3: Moving in and Finding Windows (17:26:14 – 17:31:25 IST)
Now that they were root, the attacker made sure they wouldn't lose access. They dropped their own SSH key into `/root/.ssh/authorized_keys` and logged in cleanly over SSH from Kali. Next, they realized the web server had an internal network interface. They ran an Nmap sweep across the internal `192.168.56.0/24` subnet, immediately finding our Domain Controller (`192.168.56.10`) and a Windows 10 workstation (`192.168.56.20`).

### Phase 4: Poisoning the Well with Responder (17:36:26 – 18:01:00 IST)
The attacker launched Responder on the web server to listen for internal broadcast queries. When the Windows 10 workstation asked the network for a missing file share, Responder answered first. Windows sent its NetNTLMv2 password hash directly to the attacker. The hash was saved to `/tmp/win10.hash` and cracked offline in under 60 seconds (`Secur3Lab!`). With valid domain credentials in hand, the attacker ran BloodHound from the Linux box to map out every trust relationship, user, and computer in the domain.

### Phase 5: Becoming God in Active Directory (18:01:18 – 18:06:40 IST)
BloodHound revealed a critical finding: a service account named `HANK_SHERMAN` was a member of `Domain Admins` with an SPN registered. The attacker requested its Kerberos service ticket (Kerberoasting) and cracked its weak password (`Password123`) offline in 25 seconds. 
Now holding Domain Admin credentials, the attacker ran DCSync (`secretsdump.py`), pretending to be a replicating Domain Controller. The real DC happily replicated the entire `NTDS.dit` database, giving the attacker every password hash in the domain—including the master `krbtgt` hash. With `krbtgt`, the attacker used `ticketer.py` to forge an unbreakable Kerberos Golden Ticket and logged into the Domain Controller over WMI.

### Phase 6: Backdoors & Smuggling Data (18:08:21 – 18:17:30 IST)
The attacker secured permanent persistence by creating a rogue user directly on the Domain Controller: `net user backdoor P@ssw0rd123! /add /domain`, and adding it to `Domain Admins`. Next, they staged sensitive files (`domain_users.txt`, `admin_info.txt`, `sensitive_data.txt`), pulled them back to the web server, and smuggled them out to Kali via SCP across 6 rapid SSH sessions in just 570 milliseconds.

### Phase 7: The Final Punch (18:20:00 – 18:24:35 IST)
In the final minutes of the attack, the adversary executed simultaneous disruption commands against both the Domain Controller and the workstation:
- Pushed a custom hacker wallpaper (`hacked.bmp`) to both machines and changed registry keys to lock it in.
- Dropped fake ransomware ransom notes (`README_HACKED.txt`) and dummy encrypted files (`passwords.enc`) on user desktops.
- Executed immediate forced reboots (`shutdown /r /t 0`) on both machines to lock in the defacement and throw analysts off balance.

---

# 4. The 7 Mistakes That Made This Breach Possible

This breach did not require a zero-day exploit. It succeeded because **seven everyday security oversights** stacked up like falling dominos:

![Seven Fatal Architectural Flaws](../06-Resources/diagrams/Seven%20Fatal%20Architectural%20Flaws.png)

| Mistake # | What Went Wrong | How the Attacker Abused It | How We Permanently Fixed It |
|:---:|:---|:---|:---|
| **Flaw 1** | `www-data` had passwordless sudo for Python | Jumped from web user to `root` in 10 seconds via one line of Python. | Removed all NOPASSWD directives from `/etc/sudoers` and audited all binaries. |
| **Flaw 2** | Root SSH logins were enabled on the web server | Attacker added an SSH key to `/root/.ssh/authorized_keys` for instant persistent access. | Enforced `PermitRootLogin no` and `PasswordAuthentication no` in `sshd_config`. |
| **Flaw 3** | Upload directory allowed script execution | The web server happily executed uploaded `.php` files inside `/uploads/`. | Added `.htaccess` with `php_flag engine off` and mounted uploads with `noexec`. |
| **Flaw 4** | Service account had Domain Admin privileges | Account `HANK_SHERMAN` had an SPN and was in `Domain Admins`, enabling DCSync. | Stripped administrative rights from all service accounts; planned migration to gMSAs. |
| **Flaw 5** | Weak passwords (`Password123`, `Secur3Lab!`) | Passwords were easily cracked offline with Hashcat in seconds. | Enforced strong passphrases and added admins to the `Protected Users` group. |
| **Flaw 6** | Legacy broadcast protocols were enabled | Windows 10 broadcasted LLMNR queries across the subnet, easily poisoned by Responder. | Disabled LLMNR and NetBIOS across the entire domain via Group Policy (GPO). |
| **Flaw 7** | Flat DMZ network with no firewall rules | Web server was allowed to talk directly to Windows endpoints on ports 445, 135, and 88. | Put strict firewall rules on the gateway blocking DMZ traffic to internal Windows ports. |

---

# 5. How Well Did Our Detections Work?

Here are the honest, real-world numbers from our defensive monitoring:

```text
Total Attack Stages Tested:             20  (100.0%)
├─ Caught Directly on Victim or Wire:   14  (70.0% - Stages 01,02,03,05,06,07,08,10,13,15,17,18,19,20)
├─ Caught via Pivot Host Commands:       2  (10.0% - Stages 14, 16: DCSync and Golden Ticket caught on Linux)
├─ Diagnostic Logging Gaps:              2  (10.0% - Stages 09, 12: Internal sweeps and LDAP queries unlogged)
└─ Offline Hash Cracking:                2  (10.0% - Stages 04, 11: MD5 and NTLMv2 cracked on attacker GPU)
─────────────────────────────────────────────────────────────────────────────
Detection Rule / Parser Crashes:         0  (0.0% - All rules evaluated cleanly; zero dropped logs)

Real-World Telemetry Numbers:
• Stages Delivering Alerts to TheHive:  16 stages (80.0%)
• Pivot Command Audit Rate:             50 interactive root commands caught (100% of pivot commands via Rule 100220)
• Total Raw Security Logs Ingested:     9,567 rows (Wazuh-Raw-Alerts.csv)
• Curated Forensic Alert Dataset:       808 rows (wazuh_alerts.csv - 11 dashboard filters applied)
• High-Priority TheHive Incidents:      46 alerts (thehive_alerts.json - Level >= 8)
• False Positives Dismissed:            3 alerts (6.5% - scanner noise safely closed)
• Confirmed True Breach Alerts:         43 alerts (93.5% - grouped into Cases 01–03)
• Average Time to Detect (MTTD):        < 15 seconds across all live telemetry
```

### The Truth About Detection Gaps
- **Offline Cracking (Stages 04 & 11):** You can't put an agent on an attacker's laptop. When an attacker cracks hashes offline with Hashcat, detection relies on catching the initial credential theft upstream and spotting the unusual login downstream.
- **Internal Sweeps & LDAP (Stages 09 & 12):** Standard Windows defaults don't log dropped Layer 2 pings (`DG-09`) or LDAP queries (`DG-12`). Suricata caught the network scan on the wire, and our Linux command logger caught `bloodhound.py`, but the Windows machines remained silent—highlighting why diagnostic audit policies are needed.
- **DCSync & Golden Tickets (Stages 14 & 16):** Without Directory Service Replication SACLs (EID 4662) or Ticket Granting Service auditing (EID 4769) enabled on the Domain Controller, the DC only recorded generic logon events. Fortunately, our Linux command auditing pipeline caught `secretsdump.py` and `ticketer.py` on the pivot host, proving the value of layered defense.

---

# 6. How We Contained and Fixed It

We handled incident response in two clean phases: first, kicking the attacker out immediately; second, permanently fixing the environment so it can never happen again.

### Phase 1: Live Containment (Locking the Attacker Out)
1. **Blocked Attacker IP:** Dropped all traffic from `192.168.232.135` at the firewall.
2. **Killed Shells:** Terminated the reverse shell process (`pkill -9 -f nc.openbsd`) and moved `shell.php` to quarantine with permissions `000`.
3. **Kicked Out Backdoor SSH Keys:** Cleared the attacker's public key from `/root/.ssh/authorized_keys` and terminated active terminal sessions.
4. **Disabled Rogue Accounts:** Disabled the `AD\backdoor` user in Active Directory while preserving the account object for forensic tracking.
5. **Killed the Golden Ticket:** Performed an Active Directory double `krbtgt` password reset to invalidate all forged Kerberos tickets (**KVNO 3**).
6. **Cleaned Up Desktops:** Quarantined staged files (`domain_users.txt`, `sensitive_data.txt`, `README_HACKED.txt`) and restored desktop wallpaper registry settings.
7. **Rotated Web Credentials:** Changed the MariaDB database password and updated `config.inc.php`.

### Phase 2: Permanent Eradication & System Hardening
1. **Cleaned Up Staged Files:** Verified attacker history (`history | grep rm`) and securely shredded all 9 temporary files in `/tmp/` (`shred -u -z -n 3 /tmp/*.hash /tmp/*.ccache /tmp/dcsync_output*`). Purged `/opt/Responder` and restored DNS services.
2. **Hardened the Linux Server:** Removed passwordless sudo from `/etc/sudoers`, disabled root SSH logins, and blocked PHP execution in the uploads folder.
3. **Hardened Active Directory:** Deleted `AD\backdoor`, demoted `HANK_SHERMAN`, stripped its SPN, rotated all domain passwords, and enrolled `Administrator` into the `Protected Users` group.
4. **Disabled Risky Network Protocols:** Disabled LLMNR and NetBIOS domain-wide via Group Policy.
5. **Isolated the DMZ:** Put strict firewall rules on the gateway blocking web servers from communicating with internal Windows ports (445, 135, 389, 88).
6. **Closed Cases:** Formally resolved and closed all 46 alerts across TheHive's 3 cases (`CAS-001-WEBCOMP`, `CAS-002-LATMOVE`, `CAS-003-DOMIMP`).

---

# 7. Our Hardening Roadmap

To make sure our defenses stay strong, we organized future improvements into three clear timeframes:

![Enterprise Hardening Strategic Roadmap](../06-Resources/diagrams/Enterprise%20Hardening%20Strategic%20Roadmap.png)

---

# 8. Formal Sign-Off

This post-incident report has been reviewed, cross-referenced against all raw logs, and formally approved:

| Role | Name / Title | Status | Approval Date |
|:---|:---|:---:|:---:|
| **Lead Incident Responder** | Manichand Gupta | **APPROVED** | `2026-11-01` |
| **Detection Engineering Lead** | SOC Automation Team | **VALIDATED** | `2026-11-01` |
| **Active Directory Security Admin** | Systems Administration Team | **VERIFIED** | `2026-11-01` |
| **Incident Commander** | Lead SOC Incident Lead | **RESOLVED & CLOSED** | `2026-11-01` |

> **Final Status:** Incident `INC-2026-1018-ALPHA` is **OFFICIALLY RESOLVED AND CLOSED**. All attacker access has been severed, all 7 root-cause flaws have been permanently fixed, domain health has been restored, and all 46 alerts in TheHive are completed.
