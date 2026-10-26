# Case 01 — Web Application Compromise

> **Status:** Draft, not yet validated  
> **TheHive case ID:** `CAS-001-WEBCOMP`  
> **Severity:** High  
> **TLP / PAP:** `TLP:AMBER / PAP:AMBER`  

---

## Summary

The adversary initiated an external attack campaign targeting the public-facing Damn Vulnerable Web Application (DVWA) hosted at `192.168.56.30` from Kali Linux (`192.168.232.135`). Following automated port scanning and directory fuzzing, the adversary performed credential brute-forcing against `/dvwa/login.php` and exploited a SQL injection flaw to dump the user credentials table. After cracking the administrative hash offline, the adversary authenticated to DVWA, uploaded an executable PHP web shell (`shell.php`), spawned an interactive Python reverse shell connecting back to Kali (`4444/TCP`), and abused a passwordless sudo Python misconfiguration (`sudo /usr/bin/python3` GTFOBins) to obtain local `root` privileges.

---

## Scope

| Stage | Attack | Investigation | Detection Status |
|---|---|---|---|
| 01 | [Reconnaissance](../../02-Attack-Simulation/Stages/stage-01-recon.md) | [stage-01](../Stages/stage-01-recon.md) | **Detected** (Suricata SID 3400001, 3400002 & Wazuh Rule 100410) |
| 02 | [Brute force](../../02-Attack-Simulation/Stages/stage-02-bruteforce.md) | [stage-02](../Stages/stage-02-bruteforce.md) | **Detected** (Wazuh Rule 100213 & Suricata SID 2000547) |
| 03 | [SQL injection](../../02-Attack-Simulation/Stages/stage-03-sqli.md) | [stage-03](../Stages/stage-03-sqli.md) | **Detected** (Suricata SID 2010963 & Wazuh Rule 31106) |
| 04 | [Hash cracking](../../02-Attack-Simulation/Stages/stage-04-hash-crack.md) | [stage-04](../Stages/stage-04-hash-crack.md) | **Detection gap** (DG-04: Inherent offline cracking) |
| 05 | [Web shell upload](../../02-Attack-Simulation/Stages/stage-05-webshell.md) | [stage-05](../Stages/stage-05-webshell.md) | **Detected** (Suricata SID 2019284 / Wazuh Rule 100199 / Auditd) |
| 06 | [Reverse shell](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | [stage-06](../Stages/stage-06-reverse-shell.md) | **Detected** (Suricata SID 3400020 & Wazuh Rule 100199) |
| 07 | [Privilege escalation](../../02-Attack-Simulation/Stages/stage-07-privesc.md) | [stage-07](../Stages/stage-07-privesc.md) | **Detected** (Wazuh Rule 5402 (PAM) & Auditd web_process_creation) |

---

## Detection sources

| Source | What it contributed |
|---|---|
| **Suricata** | Dual-interface NIDS flagged Nmap port sweeps (SID 2000545), automated Python HTTP brute-force bursts (User-Agent: `python-requests`, SID 2017515 / 2000547), and SQL injection / sensitive parameter access (Wazuh Rule 31153 watchlist). |
| **Wazuh** | Apache access log analysis flagged HTTP 4xx scanning floods (Rule 100410) and 401 Unauthorized bursts (Rule 100213). Linux Auditd integration alerted on web shell command execution (Rule 100199), reverse shell execution (Rule 100199), and passwordless sudo privilege escalation (Rule 5402). |
| **TheHive** | Aggregated multiple correlated alerts into unified triage incidents (`tool_campaign`, `process_chain`). |
| **Velociraptor** | Host forensic artifact triage: extracted process tree (`apache2` -> `sh` -> `python3`), verified web shell on disk, and identified sudoers NOPASSWD misconfiguration. |

---

## Timeline

| Time | Event | Source | Evidence |
|---|---|---|---|
| T0 | External port scan and directory fuzzing from 192.168.232.135 | Suricata / Wazuh | [Attack 01](../../02-Attack-Simulation/Attack-Screenshots/1.png) · [Alert 01](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/1.png) |
| T+2m | Automated Python credential brute-force burst against `/login.php` | Suricata / Wazuh | [Attack 05](../../02-Attack-Simulation/Attack-Screenshots/6.png) · [Alert 02](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/2.png) |
| T+5m | SQL injection payload submitted dumping credentials | Suricata | [Attack 09](../../02-Attack-Simulation/Attack-Screenshots/8.png) · [Alert 03](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/3.png) |
| T+8m | Offline Hashcat MD5 password cracking on Kali | Offline GPU | [Attack 13](../../02-Attack-Simulation/Attack-Screenshots/10.png) · DG-04 |
| T+11m | Malicious PHP file uploaded to /var/www/html/hackable/uploads/ | Wazuh / Auditd | [Attack 16](../../02-Attack-Simulation/Attack-Screenshots/12.png) · [Alert 04](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/4.png) |
| T+13m | Python reverse shell spawned to 192.168.232.135:4444 | Wazuh Auditd | [Attack 19](../../02-Attack-Simulation/Attack-Screenshots/15.png) · [Alert 05](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/5.png) |
| T+16m | Passwordless sudo Python execution granting effective root and reading /etc/shadow | Wazuh Auditd | [Attack 23](../../02-Attack-Simulation/Attack-Screenshots/17.png) · [Alert 06](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/6.png) |

---

## Observables

| Type | Value | Context |
|---|---|---|
| **IP** | `192.168.232.135` | External adversary workstation (Kali Linux) |
| **IP** | `192.168.56.30` | Compromised web server (DVWA) |
| **File** | `/var/www/html/hackable/uploads/shell.php` | Web shell uploaded via application flaw |
| **Hash (MD5)** | `5f4dcc3b5aa765d61d8327deb882cf99` | Extracted admin password hash |
| **User** | `www-data` | Web service account used for initial code execution |
| **Binary** | `/usr/bin/python3` | Sudoers NOPASSWD binary abused for root privilege escalation |

---

## Tasks

- [x] Triage initial web port scan and directory fuzzing alerts
- [x] Review Suricata eve.json for SQL injection payload
- [x] Inspect Apache access logs for unauthorized file upload endpoint requests
- [x] Locate and quarantine uploaded web shell `shell.php`
- [x] Terminate reverse shell socket connection to `192.168.232.135:4444`
- [x] Remediate sudoers misconfiguration (remove NOPASSWD for `/usr/bin/python3`)
- [x] Rotate all extracted database passwords and enforce salted SHA-256/bcrypt hashing

---

## Detection performance

| Metric | Value |
|---|---|
| **Stages Executed** | 7 |
| **Verified Detections with Alerts** | 6 (85.7%) |
| **Inherent Offline Gaps** | 1 (14.3% - Stage 04) |
| **Mean Time to Detect (MTTD)** | < 15 seconds across all online stages |
| **Rule Failures** | 0 |

---

## Verdict

**True Positive.** Successful external compromise of the DVWA web application progressing from reconnaissance to full root privilege escalation. The host is compromised and serves as an active pivot candidate into the internal domain subnet.
