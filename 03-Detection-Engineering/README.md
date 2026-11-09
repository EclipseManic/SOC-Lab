# 03 — Detection Engineering: Architecture, Custom Rules & SOAR Pipeline

> **The Golden Rule of Detection Engineering:**  
> A security system is only as good as what it catches—and how clearly it communicates. If an engine fires 10,000 alerts a day, analysts miss real breaches due to alert fatigue. If it fires zero alerts, you are flying blind.  
> Detection engineering is the disciplined art of writing precise rules, eliminating false alarms, and turning thousands of raw machine logs into a handful of high-priority, actionable incident cases.

---

## The Big Picture: How This SOC Detects Attacks

To understand how detection works in this lab, imagine securing a corporate office building:

| Defensive Layer | Primary Mechanism | Real-World Office Analogy |
|---|---|---|
| **1. Suricata NIDS** (Network Wire) | High-speed AF-PACKET promiscuous sniffing on gateway interfaces | **The Perimeter Cameras:** Watches all traffic entering the building and crossing between hallways. |
| **2. Linux Auditd & Host Shell Auditing** (Kernel & Shell) | Hooks Linux netlink (`execve`) & shell `PROMPT_COMMAND` (`bashcmd`) | **The Server Room Motion Sensor:** Hooks the Linux kernel and shell to record every command typed or executed. |
| **3. Windows Sysmon** (Endpoint Context) | Deep process creation (EID 1), network (EID 3), and registry tracking (EID 1 reg.exe) | **The Desktop Watchdog:** Records process trees, command lines, and registry tampering on Windows. |
| **4. Wazuh SIEM** (Analysis Brain) | Real-time decoders, local_rules.xml, and CDB memory lookups | **The Central Control Room:** Ingests all sensor feeds, applies rules, silences noise, and sounds alarms. |
| **5. TheHive 5 + SOAR** (Incident Desk) | Two-tier SQLite WAL queue and async clustering daemon | **The Incident Desk:** Groups related alerts into clean investigation cases for human SOC analysts. |

When an attacker launches a multi-stage attack across our network, all five components work as interlocking gears. If the attacker hides their payload with transport encryption, the endpoint kernel catches them; if the attacker disables local logging, the network wire catches them.

---

## Empirical Scorecard at a Glance

Before examining rules and code, here are the authentic results from our 20-stage attack simulation:

| Metric | Result | What It Means in Plain English |
|---|:---:|---|
| **Attack Stages Tested** | **20** | Full kill chain from external port scanning to Active Directory takeover and ransomware |
| **Direct Target & Wire Detections** | **14 (70.0%)** | Direct payload, process execution, authentication, or network signature alert on victim host or wire |
| **Operational Pivot-Only Alerts** | **2 (10.0%)** | Attacking session/pivot caught (`bashcmd` / SSH exfil), but target DC missed technique logging (Stages 14, 16) |
| **Target-Side Logging Gaps** | **2 (10.0%)** | Host-level event logging unconfigured in pre-attack baseline (Stage 09 L2 drops, Stage 12 EID 1644 LDAP) |
| **Inherent Offline Computation Gaps** | **2 (10.0%)** | Password cracking ran offline on attacker GPU (zero victim packets); bracketed by upstream theft and downstream authentication |
| **Operational SOAR Alert Delivery** | **12 Technique / 16 Operational (60% / 80%)** | 12 stages generated technique-specific TheHive alerts; 4 additional stages covered by collateral SSH session alerts |
| **Detection Engine Rule Drops** | **0 (0.0%)** | All active defensive rules and pipeline decoders executed without silent failures or syntax errors |
| **Total Raw Telemetry Ingested** | **9,567 records** | Complete raw alert baseline indexed in Wazuh across all 4 agents (`Wazuh-Raw-Alerts.csv`) |
| **Analyst Curated Records** | **808 records** | Focused forensic dataset created by applying 11 OpenSearch exclusion filters in Wazuh Dashboard (`wazuh_alerts.csv`) |
| **Live TheHive Incidents** | **46 alerts** | Actionable, correlated incident tickets delivered live to TheHive 5 across 3 formal cases |
| **Custom Noise Suppressions** | **87 rules** | Server-side false-positive rules silencing background OS chatter, guest tools, and machine loops |

---

### 🎯 Why Looking at "Stages" Alone Doesn't Tell the Whole Story

If you only count stages on a spreadsheet, you might think offline password cracking was a defensive blind spot. But in a real SOC, you look at the **entire lifecycle of the stolen credential**:

1. **The Attacker Cracks Hashes on Their Own Hardware (Stages 04 & 11):**
   You can't install an agent on an attacker's laptop. When they crack passwords offline using Hashcat on their GPU, our lab servers don't see a single packet or CPU cycle. But we still caught them at every step around it:
   - **We caught the initial theft:** Suricata caught the SQL injection dumping the database in Stage 03 (Alert #11), while Linux Auditd and Wazuh caught Responder poisoning in Stage 10 (Alert #20).
   - **We caught the file transfer:** Wazuh Rule 5715 flagged the rapid SCP/SSH session used to pull the hash file to Kali.
   - **We caught the unauthorized login:** The moment they used the cracked password, our sensors lit up—hitting `/login.php` on the web server, and triggering Windows Event ID 4624 (Logon Type 3) on the domain.
   From a practical SOC perspective, the attacker was never invisible; we intercepted them the moment they touched our systems.

2. **Every Command That Touched Our Systems Was Caught (100% of Observable Actions):**
   When you look at actual commands typed and actions executed—port scans, webshell uploads, running `id`, typing `sudo -l`, dropping SSH keys, running Responder, Kerberoasting, Pass-the-Hash, creating backdoors, and altering the registry—our sensors intercepted every single one:

| Phase | Observable Procedure / Command Executed | Target Host | Defensive Sensor | Detection Rule / Signature | Visual Proof Link | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| **Reconnaissance** | External TCP SYN sweep (`nmap -sS -p-`) | Perimeter | Suricata Gateway | SID 3400001, 3400002 | [Alert 1](../06-Resources/screenshots/thehive-alert/1.png) · [wzb-04](../06-Resources/screenshots/wazuh-deep-investigation/wzb-04-recon-suricata-nmap-syn-scan.jpg) | **DETECTED** |
| **Reconnaissance** | Web vulnerability scanning (`nikto -h`) | DVWA | Suricata / Apache | Wazuh Rules 100410, 31151, 31153, 31154, 31168 / Suricata Shellshock (SID 2019904) & LFI SIDs | [Alert 1.1](../06-Resources/screenshots/thehive-alert/1.1.png) · [wzb-06](../06-Resources/screenshots/wazuh-deep-investigation/wzb-06-recon-nikto-shellshock-probes.jpg) | **DETECTED** |
| **Initial Access** | HTTP POST login brute force (`python-requests`) | DVWA | Suricata / Apache | Suricata SID 2017515 + Custom Rule 100600 / Rule 100200 | [Alert 11 (`3.png`, `4.png`)](../06-Resources/screenshots/thehive-alert/4.png) · [wzb-09](../06-Resources/screenshots/wazuh-deep-investigation/wzb-09-bruteforce-dvwa-login-endpoint.jpg) | **DETECTED** |
| **Credential Theft** | SQLi `1' UNION SELECT user, password` | DVWA | Suricata / Wazuh | Suricata SID 2010963 + Custom Rule 100600 / Wazuh Rule 31106 | [Alert 11 sub-event 17 (`5.png`)](../06-Resources/screenshots/thehive-alert/5.png) · [wzb-11](../06-Resources/screenshots/wazuh-deep-investigation/wzb-11-sqli-suricata-select-user.jpg) | **DETECTED** |
| **Credential Abuse** | Admin authentication with cracked password | DVWA | Apache / Wazuh | Wazuh Rule 100200 (POST `/login.php` 302/200 OK) | [Alert 11 (`4.1.png`)](../06-Resources/screenshots/thehive-alert/4.1.png) · [wzb-12](../06-Resources/screenshots/wazuh-deep-investigation/wzb-12-webshell-dvwa-post-upload.jpg) | **DETECTED** |
| **Persistence** | Upload of `shell.php` via web form | DVWA | Suricata / Apache | Suricata SIDs 2011768, 2020102 & 2019284 / Rule 100200 | [Alerts 12 & 13 (`6.png`–`6.3.png`)](../06-Resources/screenshots/thehive-alert/6.png) · [wzb-12](../06-Resources/screenshots/wazuh-deep-investigation/wzb-12-webshell-dvwa-post-upload.jpg) | **DETECTED** |
| **Execution** | Invocation of `shell.php?cmd=id` | DVWA | Suricata / Auditd | Auditd Rule 100199 (`wzb-61ed72e937`, Alert #12), Suricata SID 2019284 via Rule 86601 (`wzb-e9a1797ac4`, Alert #13), and Wazuh Rule 31109 (Data Row 9121) | [Alerts 12 & 13 (`6.2.png`, `6.3.png`)](../06-Resources/screenshots/thehive-alert/6.2.png) · [wzb-13](../06-Resources/screenshots/wazuh-deep-investigation/wzb-13-webshell-auditd-id-command.jpg) | **DETECTED** |
| **Execution** | Named pipe FIFO Netcat reverse shell on TCP 4444 | DVWA | Suricata Gateway | SID 3400020 (Outbound TCP 4444, Alert #14) / Auditd `nc.openbsd` (Alert #15) | [Alerts 14 & 15 (`7.png`–`7.2.png`)](../06-Resources/screenshots/thehive-alert/7.png) · [wzb-15](../06-Resources/screenshots/wazuh-deep-investigation/wzb-15-revshell-auditd-stty-sane.jpg) | **DETECTED** |
| **Privilege Escalation** | `sudo /usr/bin/python3` (GTFOBins) | DVWA | Linux PAM / Host Shell | Wazuh Rule 5402 (PAM sudo root, 12x) & Rule 100220 (`sudo -l`, Data Row 9147) | [SIEM PAM Alert](../06-Resources/screenshots/wazuh-deep-investigation/wzb-17-privesc-pam-sudo-python-root.jpg) · [wzb-18](../06-Resources/screenshots/wazuh-deep-investigation/wzb-18-privesc-auditd-sudo-l.jpg) | **DETECTED** |
| **Persistence** | Attacker SSH key written to `authorized_keys` | DVWA | Wazuh Rule 100220 & SSHD | Wazuh Rule 100220 (`echo "ssh-ed25519..."`) & Rule 5715 | [Alert 16 (`8.png`, `8.1.png`)](../06-Resources/screenshots/thehive-alert/8.png) · [wzb-19](../06-Resources/screenshots/wazuh-deep-investigation/wzb-19-ssh-persist-auditd-authorized-keys.jpg) | **DETECTED** |
| **Persistence** | Interactive root SSH session from Kali | DVWA | SSHD / Wazuh | Wazuh Rule 5715 (Alert #16 `wzb-1208f0ea54`) | [Alert 16 (`8.1.png`)](../06-Resources/screenshots/thehive-alert/8.1.png) · [wzb-20](../06-Resources/screenshots/wazuh-deep-investigation/wzb-20-ssh-persist-key-inject-sshd-login.jpg) | **DETECTED** |
| **Discovery** | Internal subnet multi-port sweep (`192.168.56.0/24`) | DVWA → LAN | Suricata (`ens37`) & Wazuh | SIDs 3400001, 3400002, 3400020 (Alerts #17–#19) / Wazuh Rule 100220 | [Alerts 17–19 (`9.png`–`9.3.png`)](../06-Resources/screenshots/thehive-alert/9.png) · [wzb-22](../06-Resources/screenshots/wazuh-deep-investigation/wzb-22-discovery-suricata-internal-nmap.jpg) | **LOGGING GAP (DG-09)** |
| **Credential Theft** | Responder LLMNR/NBT-NS daemon launched | DVWA & Win10 | Wazuh bashcmd & Win10 Sysmon | Wazuh Rule 100220 (`Responder.py`, Data Row 9232) + Win10User EID 4688 `DavSetCookie` (Rule 100278, `wzb-28`) + SSH staging Alert #20 | [Alert 20 (`10.png`)](../06-Resources/screenshots/thehive-alert/10.png) · [wzb-27](../06-Resources/screenshots/wazuh-deep-investigation/wzb-27-responder-auditd-daemon-start.jpg) | **DETECTED** |
| **Discovery** | BloodHound LDAP queries targeting DC | DVWA → DC | Linux Pivot / bashcmd | Linux Pivot Wazuh Rule 100220 (`bloodhound-python`) + SSH retrieval Alert #22 (`wzb-1d2d7fb4b8`) | [Alert 22 (`12.png`)](../06-Resources/screenshots/thehive-alert/12.png) · [wzb-31](../06-Resources/screenshots/wazuh-deep-investigation/wzb-31-bloodhound-auditd-python-ingest.jpg) | **LOGGING GAP (DG-12)** |
| **Credential Theft** | Kerberoasting TGS request for `HANK_SHERMAN` | DVWA → DC | Suricata (`ens37`) & bashcmd | Suricata SID 2019922 (TheHive Alert #23 `wzb-c1e2642eb2`) & Wazuh Rule 100220 (`GetUserSPNs.py`) | [Alert 23 (`13.png`)](../06-Resources/screenshots/thehive-alert/13.png) · [wzb-33](../06-Resources/screenshots/wazuh-deep-investigation/wzb-33-kerberoast-auditd-getuserspns.jpg) | **DETECTED** |
| **Credential Access** | DCSync NTDS database replication | DVWA → DC | Linux Pivot / bashcmd | Linux Pivot Wazuh Rule 100220 (`secretsdump.py`) + SSH exfil Alert #24 (`wzb-4174e3672e`) | [Alert 24 (`14.png`)](../06-Resources/screenshots/thehive-alert/14.png) · [wzb-34](../06-Resources/screenshots/wazuh-deep-investigation/wzb-34-dcsync-auditd-secretsdump-ntds.jpg) | **PIVOT-ONLY (DG-14)** |
| **Lateral Movement** | Pass-the-Hash WMI execution (`wmiexec.py`) | DC / Win10 | Sysmon / Event Log / Wazuh | Windows EID 4624 (Rule 92657) & Wazuh Custom Rule 100613 (`wzb-b7f91cd3ab`, `wzb-eb083a8537`, Alerts #25, #26) | [Alerts 25 & 26 (`15.png`, `15.5.png`)](../06-Resources/screenshots/thehive-alert/15.png) · [wzb-35](../06-Resources/screenshots/wazuh-deep-investigation/wzb-35-pth-wazuh-eid4624-detection.jpg) | **DETECTED** |
| **Credential Access** | Golden Ticket forgery & caching (`ticketer.py`) | DVWA & PC-DC | Linux Pivot / bashcmd & DomainWin10 Sysmon | Linux Pivot Wazuh Rule 100220 (`ticketer.py`) + Alerts #27 (`wzb-ccff195e0c`) & #28 (`wzb-c200f52606`) on `wmiexec -k` via Sysmon EID 1 / Custom Rule 100613 | [Alerts 27 & 28 (`16.png`, `16.5.png`)](../06-Resources/screenshots/thehive-alert/16.png) · [wzb-38](../06-Resources/screenshots/wazuh-deep-investigation/wzb-38-goldenticket-auditd-ticketer-forgery.jpg) | **PIVOT-ONLY (DG-16)** |
| **Persistence** | `net user backdoor P@ssw0rd123! /add` | Domain Controller | Sysmon / Event Log | Sysmon EID 1 (Rule 100613) / Windows EID 4720 (Rule 60109) (Alert #30) | [Alert 30 (`17.png`)](../06-Resources/screenshots/thehive-alert/17.png) · [wzb-44](../06-Resources/screenshots/wazuh-deep-investigation/wzb-44-persist-dc-eid4720-backdoor-created.jpg) | **DETECTED** |
| **Privilege Escalation** | `net group "Domain Admins" backdoor /add` | Domain Controller | Windows Security | Windows EID 4728 (Rule 60159) / Custom Rule 100613 (Alert #33) | [Alert 33 (`17.5.png`, `17.png`)](../06-Resources/screenshots/thehive-alert/17.5.png) · [wzb-46](../06-Resources/screenshots/wazuh-deep-investigation/wzb-46-persist-wazuh-dc-domain-admins-add.jpg) | **DETECTED** |
| **Exfiltration** | Rapid SCP file transfer burst | DVWA → Kali | SSHD / Wazuh | Wazuh Rule 5715 (Logon burst: 6 sessions / 0.57s; Alert #37) | [Alert 37 (`19.png`)](../06-Resources/screenshots/thehive-alert/19.png) · [wzb-53](../06-Resources/screenshots/wazuh-deep-investigation/wzb-53-exfil-wazuh-sshd-rapid-sessions-burst.jpg) | **DETECTED** |
| **Impact** | Registry wallpaper defacement (`hacked.bmp`) | Win10 / DC | Windows Sysmon / Wazuh | Sysmon EID 1 (Rule 92041: `reg.exe` registry modification) / Wazuh Custom Rule 100613 | [Alerts 38–41 (`20.png`–`21.png`)](../06-Resources/screenshots/thehive-alert/21.png) · [wzb-55](../06-Resources/screenshots/wazuh-deep-investigation/wzb-55-impact-wazuh-dc-wallpaper-registry-add.jpg) | **DETECTED** |
| **Impact** | Extortion note & dummy file drops (`.enc`) | Win10 / DC | Windows Sysmon & PowerShell | Sysmon EID 1 & PowerShell EID 4104 (Wazuh Rules 100613, 100271, 100272, 100275) | [Alert 39 (`21.png`)](../06-Resources/screenshots/thehive-alert/21.png) · [wzb-57](../06-Resources/screenshots/wazuh-deep-investigation/wzb-57-impact-sysmon-dc-ransom-note-and-payload.jpg) | **DETECTED** |
| **Impact** | Forced system reboot (`shutdown /r /t 0`) | Win10 / DC | Windows System / Sysmon | System EID 1074 / Sysmon EID 1 (Rule 100613, Alerts #39, #42) | [Alert 42 (`22.4.png`)](../06-Resources/screenshots/thehive-alert/22.4.png) · [wzb-59](../06-Resources/screenshots/wazuh-deep-investigation/wzb-59-impact-wazuh-dc-forced-reboot.jpg) | **DETECTED** |

---

## 1. The 4 Detection Layers: Why One Tool is Never Enough

No single security tool can see everything. In this lab, four complementary detection technologies cover each other's blind spots:

[![Cybersecurity Lab-to-Detection Mapping](../06-Resources/diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)](../06-Resources/diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)
*Figure 1: Full-stack detection mapping connecting physical & virtual machines to their defensive inspection layers ([view full asset](../06-Resources/diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)).*

### Layer 1: The Network Wire — Suricata NIDS
- **Where It Lives:** On the dual-homed Security Gateway (`192.168.232.162` / `192.168.56.150`).
- **What It Does:** Sniffs raw packets passing between the attacker's subnet (`192.168.232.0/24`) and the victim subnet (`192.168.56.0/24`) using high-speed AF-PACKET promiscuous capture.
- **What It Catches:** Nmap port scans, WhatWeb web scanners, SQL injection payloads in HTTP URIs, and raw Kerberos ticket requests crossing the wire.
- **Its Blind Spot:** It cannot read encrypted HTTPS or SSH traffic, and it cannot see local commands typed directly on an endpoint.
- **Detailed Docs:** [`Suricata/README.md`](Suricata/README.md) · Active rules: [`06-Resources/rules/suricata/custom.rules`](../06-Resources/rules/suricata/custom.rules)

### Layer 2: The Linux Kernel & Host Shell Auditing — Auditd & `bashcmd` (Rule 100220)
- **Where It Lives:** On the DVWA web server and pivot host (`192.168.56.30`).
- **What It Does:** Employs a dual-engine host detection architecture tailored for enterprise application servers:
  1. **Linux Auditd (`execve` syscalls):** Hooks directly into the Linux netlink kernel subsystem. Rule `-S execve -F uid=33 -k web_process_creation` monitors **every process executed by the Apache web service user (`www-data`)**, capturing binary paths, argument arrays, working directories, and process ancestry.
  2. **Custom Bash Command Auditing (`bashcmd` pipeline / Wazuh Rule 100220):** Enterprise web servers run headless daemon workloads; interactive command typing is inherently anomalous. Using a global `PROMPT_COMMAND` hook in `/etc/bash.bashrc` and `/etc/profile`, every interactive command typed by `www-data` or escalated to `root` is logged to `/var/log/bashcmd.log`, parsed by Wazuh's `bashcmd` decoder, and evaluated by Rule 100220.
- **What It Catches:** Auditd catches binary invocations like `/usr/bin/id` or `sudo /usr/bin/python3`. Rule 100220 captures verbatim multi-command chains, compound shell syntax, pipes, and built-ins (`stty sane`, `sudo -l`, `echo "ssh-ed25519..." >> authorized_keys`, `nmap -sV -O ...`, `Responder.py`, `bloodhound.py`, `GetUserSPNs.py`, `secretsdump.py`, `ticketer.py`, `wmiexec.py`).
- **Its Blind Spot:** It only monitors Linux endpoints and has no visibility into raw wire packets or Windows domain members.
- **Detailed Docs:** [`Auditd/README.md`](Auditd/README.md) · Active rules: [`06-Resources/rules/auditd/audit.rules`](../06-Resources/rules/auditd/audit.rules) · Wazuh Rule 100220: [`Wazuh/README.md`](Wazuh/README.md#rule-100220--host-shell-execution--interactive-command-auditing-bashcmd)

### Layer 3: Windows Endpoints — Sysmon & Security Event Logs
- **Where It Lives:** On the Active Directory Domain Controller (`PC-DC`, `192.168.56.10`) and Windows 10 workstation (`WIN10`, `192.168.56.20`).
- **What It Does:** Standard Windows Security logs record who logged in (Event ID 4624) and when privileges were assigned (Event ID 4672). Microsoft Sysmon adds deep endpoint forensics: full process command lines (EID 1), network sockets (EID 3), and registry modifications via process execution (EID 1 reg.exe add).
- **What It Catches:** Lateral movement via Impacket `wmiexec` (spawning `WmiPrvSE.exe` $\to$ `cmd.exe /Q /c`), command-line reconnaissance (`whoami`, `net user /domain`), and unauthorized desktop wallpaper changes during defacement.
- **Its Blind Spot:** It only monitors Windows systems.
- **Detailed Docs:** [`Sysmon/README.md`](Sysmon/README.md) · Active baseline: [`06-Resources/rules/sysmon/sysmonconfig.xml`](../06-Resources/rules/sysmon/sysmonconfig.xml)

### Layer 4: Central Correlation & Analysis — Wazuh SIEM
- **Where It Lives:** On the private cloud server (`10.122.1.4:1514/TCP`).
- **What It Does:** Receives real-time event streams from all four endpoint agents. It parses raw text into structured fields using [`local_decoder.xml`](../06-Resources/rules/wazuh/local_decoder.xml), tests them against over 1,300 lines of custom rules in [`local_rules.xml`](../06-Resources/rules/wazuh/local_rules.xml), matches entries against fast Constant Database (CDB) lookup tables, and enforces an alert threshold ($\ge 8$) to send serious emergencies to TheHive.
- **Detailed Docs:** [`Wazuh/README.md`](Wazuh/README.md) · Rules: [`06-Resources/rules/wazuh/local_rules.xml`](../06-Resources/rules/wazuh/local_rules.xml)

---

## 2. Life of an Alert: An End-to-End Walkthrough

To see how all these pieces fit together in real life, let's trace **Stage 05 (Web Shell Upload & Command Execution)** step-by-step from the attacker's keyboard to the analyst's screen:

[![Life of an Alert End-to-End Walkthrough](../06-Resources/diagrams/Life%20of%20an%20Alert%20End-to-End%20Walkthrough.png)](../06-Resources/diagrams/Life%20of%20an%20Alert%20End-to-End%20Walkthrough.png)
*Figure 2: End-to-end detection pipeline tracing Stage 05 web shell execution from adversary command execution across multi-sensor capture, WireGuard transit, Wazuh decoding, SQLite WAL buffering, to TheHive 5 incident case ([view full asset](../06-Resources/diagrams/Life%20of%20an%20Alert%20End-to-End%20Walkthrough.png)).*

---

## 3. The 3 Hard Engineering Problems We Solved

Anyone can install security tools out of the box. Real detection engineering begins when those tools fail under realistic operational conditions. 

Here are the three biggest challenges we tackled:

### Challenge 1: The Alert Noise Nightmare (Taming 10,000 Logs into 46 TheHive Alerts across 3 Cases)
- **The Problem:** When we first ran Wazuh with default configurations, the dashboard was flooded with thousands of useless alerts every day. Analysts were buried under false positives caused by routine operating system behavior.
- **The Culprits:**
  1. *The Syscollector Scan Loop:* Wazuh's own agent periodically executes commands like `dpkg-query`, `rpm`, `uname`, `ps`, and `netstat` to update its software inventory. Because Auditd was logging all commands, Wazuh's own scanner generated over 6,000 Rule `80792` ("Auditd: Command executed") alerts every single day!
  2. *Windows Computer Accounts (`$` Accounts):* Domain controllers process computer account logins (`PC-DC$`, `WIN10$`) every few seconds, generating hundreds of Event ID 4672 ("Special privileges assigned") events.
  3. *VMware Guest Tools:* Hypervisor background polling (`vmtoolsd.exe`) continually created background process and named pipe noise.
- **How We Fixed It:**
  - We wrote **87 custom suppression rules** in `local_rules.xml` that drop benign background events to `level="0"`.
  - For the syscollector loop, we created a compiled Constant Database (CDB) lookup table at [`../06-Resources/configs/lists/wazuh-internal-bins`](../06-Resources/configs/lists/wazuh-internal-bins). Custom Rule `100280` performs an instantaneous memory lookup against this list. If the command was run by a known system binary, it is silently dropped without alerting.
  - For Windows computer accounts, Rule `100603` uses regex negation (`negate="yes">^SYSTEM$|^LOCAL SERVICE$|\$$</field>`) to ensure alerts fire **only when a human user account** is granted administrative attack privileges.
- **The Payoff:** False alarms dropped by over 95%, leaving only genuine red-team activity.

---

### Challenge 2: The Webhook Bottleneck (Why Shuffle SOAR Was Replaced)

[![Wazuh Log Ingestion to TheHive Flow](../06-Resources/diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)](../06-Resources/diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)
*Figure 3: Multi-source log ingestion, decoders, and Level 8 threshold gate ([view full asset](../06-Resources/diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)).*

- **The Problem:** We originally used [Shuffle SOAR](https://shuffler.io/) to receive alerts from Wazuh via webhooks and push them to TheHive. But when we simulated aggressive attacks (like Nikto web fuzzing or rapid Nmap port scans), Shuffle completely collapsed:
  1. *Dropped Packets:* Floods of 400 webhooks in 10 seconds overwhelmed Shuffle's HTTP listeners, silently dropping critical alerts.
  2. *Analysis Engine Freezes:* Wazuh forks an operating system process per alert. Having hundreds of forked scripts waiting on external HTTP network responses caused Wazuh's analysis engine (`wazuh-analysisd`) to run out of process memory and lag behind.
  3. *Alert Floods:* Every single port scan probe generated an isolated ticket, burying analysts under 300 identical cases for one scan.
- **How We Fixed It (`thecustomhive` Two-Tier Pipeline):**
  We replaced Shuffle with a custom, high-speed Python automation pipeline:

[![Wazuh-TheHive Neon Alert Pipeline](../06-Resources/diagrams/Wazuh-TheHive%20Neon%20Alert%20Pipeline.png)](../06-Resources/diagrams/Wazuh-TheHive%20Neon%20Alert%20Pipeline.png)
*Figure 4: Two-tier asynchronous alert correlation pipeline from Wazuh Manager Level ≥ 8 trigger into TheHive 5 case management.*

  - **Tier 1 (Instant Local Buffer — Zero HTTP):** When an alert ($\ge 8$) fires, Wazuh executes `/var/ossec/integrations/custom-thehive`. Instead of making network calls, this lightweight script writes the alert JSON into a local SQLite database running in Write-Ahead Logging (WAL) mode. This executes in under **0.2 milliseconds** locally. The Wazuh engine never freezes or drops an alert.
  - **Tier 2 (Smart Asynchronous Daemon):** A background systemd daemon (`thehive-flush.service`) wakes up every 5 seconds. It reads pending records from SQLite, applies regex tool fingerprinting (identifying Nmap, Nikto, Hydra, sqlmap), groups related bursts into a single case, and pushes clean, organized incident batches to TheHive 5 over private VNet peering.
- **The Payoff:** Zero dropped alerts under heavy attack bursts, zero SIEM engine lag, and 300 raw port scan alerts compressed into **one clean case** titled `Tool Campaign: Nmap Portscan from Kali`.

#### Precision Latency Metric Definitions & Benchmark Verification
To prevent confusing raw disk performance with end-to-end incident dispatching, latencies across the pipeline are separated into distinct measurement tiers, verified via our reproducible test harness ([`soar-benchmark-report.md`](../06-Resources/benchmarks/soar-benchmark-report.md)):

| Measurement Tier | What It Measures | Empirical Latency | Technical Implementation Details |
|---|---|:---:|---|
| **Raw SQLite WAL Commit** | Underlying C-level disk append duration for a single row insert in WAL mode | **< 0.2 ms** | In-memory page write appending to SQLite WAL ring buffer without synchronous disk fsync. |
| **Python Ingest Execution** | Full execution time of `ingest_alert(a)` in Python runtime | **18.5 ms (p50)**<br>23.0 ms (p95) | Evaluates JSON deserialization, regex tool fingerprinting, deduplication query, and SQLite transaction. |
| **Delivery Latency** | Network transit and API response time when transmitting an alert batch to TheHive 5 REST endpoint (`/api/v1/alert`) | **150 – 300 ms** | Round-trip HTTP API dispatch across Azure private VNet peering (`10.122.0.4:9000`). |
| **End-to-End Latency** | Total elapsed duration from adversary action on endpoint, through sensor capture and WireGuard transit, to created TheHive ticket | **Median: 4.6 s**<br>(Min: 1.4 s) | Bounded by the daemon's 5.0-second flush interval (`FLUSH_INTERVAL_SECONDS`). |

#### Concurrency & Generation-Counter Logic in `custom-thehive.py`
To eliminate race conditions between incoming Wazuh alert bursts and the background flush daemon without holding global table locks during network I/O, `custom-thehive.py` implements **optimistic concurrency control via generation counters**:
1. When an alert arrives, `ingest_alert()` updates the group row in `pending_groups`, setting `dirty = 1` and incrementing `generation = generation + 1`.
2. When the background daemon claims a group, it records `claimed_gen = generation` and executes the external HTTP POST/PATCH request to TheHive outside any database transaction.
3. Upon receiving HTTP 200/201 from TheHive, the daemon opens an immediate transaction and updates the record:
   ```sql
   UPDATE pending_groups 
   SET dirty = CASE WHEN generation = ? THEN 0 ELSE 1 END,
       claimed = 0, lease_until = 0 
   WHERE group_type = ? AND thehive_id = ?
   ```
4. If new alerts arrived while the HTTP call was in flight (`generation > claimed_gen`), the `CASE` statement keeps `dirty = 1`, ensuring the group is automatically re-rendered and updated on the next daemon tick without dropped events.

> [!WARNING]
> **Architectural Security Flag — Insecure TLS & Plain HTTP Defaults:**  
> In `custom-thehive.py`, TLS verification is off and the token goes over plain HTTP by default. `THEHIVE_VERIFY_SSL` defaults to `0` and the URL defaults to `http://` (`http://10.122.0.4:9000/api/v1`). The script warns about this and the docs say it's lab-only (operating across private Azure VNet peering), but a default of "insecure" is risky if someone copies it to production. Over plain HTTP, the bearer API token and alert telemetry travel in cleartext. In enterprise production deployments, always enforce HTTPS (`https://`), configure valid TLS certificates, and set `THEHIVE_VERIFY_SSL=1`.

> [!WARNING]
> **Architectural Security Flag — Unauthenticated Agent Enrollment:**  
> In `ossec.conf`, Wazuh agent enrollment is unauthenticated (`use_password` is set to `no` and `ssl_verify_host` is set to `no`). Any host that can reach port 1515 can enroll. This is fine on an isolated range (such as our private WireGuard mesh), but it should be flagged in the docs. In enterprise networks, unauthenticated enrollment introduces the risk of rogue agent registration; production setups must enforce `<use_password>yes</use_password>` with `/var/ossec/etc/authd.pass` and `<ssl_verify_host>yes</ssl_verify_host>`.

#### Honest Operational Delivery Accounting: Technique Alerts vs. Collateral Logging
A rigorous SOC audit requires distinguishing between **technique-specific alerting** (where the alert directly detects the attack action) and **collateral session alerting** (where background access is alerted, but the technique itself was unlogged or fell below the integration threshold):
- **Technique-Specific Operational Alerts in TheHive: 12 of 20 Stages (60.0%)**  
  Direct, high-fidelity alerts ($\ge \text{Level } 8$) matching the technique: Stage 01 (Nmap SIDs 3400001/3400002), Stage 02 (Hydra HTTP burst), Stage 03 (SQLi SID 2010963), Stage 05 (Web shell SID 2019284), Stage 06 (Reverse shell SID 3400020), Stage 08 (SSH key persistence logon Rule 5715), Stage 13 (Kerberoasting SID 2019922), Stage 15 (WMIExec Rule 100613), Stage 16 (Golden Ticket injection Rule 100613), Stage 17 (Backdoor user creation Rule 100613), Stage 18 (Staging/collection Rule 100613), and Stage 20 (SMB NTLM / ransomware defacement Rule 100613).
- **Sub-Gate Telemetry (Indexed Only, Level < 8): 3 Stages (15.0%)**  
  Indexed in OpenSearch / Wazuh Dashboard for post-incident triage, but **did not page anyone in TheHive** due to the Level $\ge 8$ threshold:
  - *Stage 07 (Privilege Escalation):* Sudo PAM execution logged by Rule 5402 (Level 3) and command line logged by Rule 100220 (Level 5).
  - *Stage 10 (Responder Poisoning):* Command line logged by Rule 100220 (Level 5); WebDAV coercion on Win10 logged by Rule 100278 (Level 3).
  - *Stage 14 (DCSync):* Command line logged by Rule 100220 (Level 5) on the pivot.
- **Collateral-Only Session Logging in TheHive: Stages 10, 11, 12, 14**  
  In these stages, the adversary operated through the compromised Linux pivot. The only alert reaching TheHive was the generic `sshd authentication success: root` (Rule 5715, Level 10). Counting these as "operational alerts" reflects that the analyst knew a session existed, but **the specific adversary techniques (Responder poisoning, offline cracking, BloodHound queries, and DCSync replication) did not generate standalone alerts in TheHive**.
- **Inherent Offline Computation Gaps: 2 Stages (10.0%)**  
  Stage 04 (MD5 hash cracking) and Stage 11 (NetNTLMv2 hash cracking) occurred entirely offline on the attacker's GPU (zero host or wire packets).
- **Target-Side Logging Gaps: 2 Stages (10.0%)**  
  Stage 09 (intra-subnet Layer-2 scan drops unlogged on Windows firewall) and Stage 12 (Domain Controller Event ID 1644 LDAP diagnostic query auditing disabled).

#### Pipeline Limitations & Engineering Roadmap (v2)
1. **Alert Grouping Lifetime (Issue 4 Roadmap):** The v1 integration script implements a 30-minute rolling inactivity timeout for tool campaigns. However, an adversary executing active operations within each 30-minute interval keeps the group open indefinitely (e.g., our initial web scanner alert accumulated events over 69 minutes). For v2, we are introducing a hard 15-minute maximum campaign window and kill-chain phase boundaries to segregate reconnaissance, exploitation, and post-compromise activity into distinct incident cases.
2. **Automated Testing Suite (Issue 5 Roadmap):** While the integration includes a self-test and synthetic ingestion benchmark for fingerprint verification, v2 expands testing into full end-to-end lifecycle verification, including SQLite crash recovery after abnormal termination, retry behavior during TheHive API 5xx/429 outages, concurrent multi-agent ingestion stress tests, and resilience against malformed alert schemas.

---

<a id="detection-gap-register"></a><a id="4-detection-gap-register--blind-spot-analysis"></a>
### Detection Gap Register: The Honest 14 / 2 / 2 / 2 Empirical Partition (Challenge 3)
In junior cybersecurity labs, people often claim "100% detection rate." In real enterprise security, 100% detection is impossible because adversaries perform offline computations on their own hardware, and enterprise environments balance audit logging overhead against forensic depth.

We achieved an empirical **70.0% direct target detection rate (14 of 20 stages caught directly on endpoints or network wire)** and an **80.0% operational alert coverage rate (16 of 20 stages delivering actionable alerts to TheHive)**, backed by verifiable sensor telemetry. More importantly, we rigorously cataloged the **2 operational pivot-only alerts (10.0%)**, **2 target-side logging gaps (10.0%)**, and **2 inherent offline computation gaps (10.0%)**:

#### The 2 Inherent Offline Computation Gaps (10.0%)
1. **Stage 04 — Inherent Offline Password Hash Cracking (Hashcat MD5):**
   - *Why It Is an Inherent Gap:* Password hash cracking occurred entirely on the attacker's physical laptop GPU. No network packets crossed the enterprise wire, and zero processes spawned on victim servers.
   - *Investigative Attribution:* Bracketed upstream by Stage 03 SQL injection detection (Suricata SID `2010963` + Custom Rule `100600` / Wazuh Rule `31106`) and downstream by Stage 05 web authentication (Rule `100200` POST `/login.php`).
   - *The Defense:* Offline cracking cannot be intercepted at execution time. Enterprise defense must focus on cryptographic storage (Argon2id/bcrypt) and upstream web input validation.
2. **Stage 11 — Inherent Offline NTLMv2 Hash Cracking (Hashcat NetNTLMv2):**
   - *Why It Is an Inherent Gap:* The NetNTLMv2 challenge-response harvested in Stage 10 was cracked locally on the attacker's GPU with zero target interaction.
   - *Investigative Attribution:* Bracketed upstream by Stage 10 NetNTLMv2 capture (Win10 `DavSetCookie` Rule `100278` + Wazuh Rule `100220`) and downstream by Stage 12 authenticated domain reconnaissance.
   - *The Defense:* Globally disable LLMNR (`EnableMulticast = 0`) and NetBIOS over TCP/IP so hashes can never be broadcasted or captured in the first place.

#### The 2 Target-Side Logging Gaps (10.0%)
1. **Stage 09 — Intra-Subnet Layer 2 Wire Detection vs. Target Host Drop Logging (DG-09):**
   - *Detection Status:* **Target Logging Gap**. Suricata's internal interface (`ens37`) promiscuously inspected Layer 2 switch traffic (TheHive Alerts #17–#19), and DVWA logged command execution via Rule `100220`, but the victim Windows endpoints produced zero telemetry because host-based firewall dropped-packet logging was disabled.
   - *Remediation:* Enabled host-based Windows Filtering Platform (WFP) drop auditing and forwarded drops to Wazuh.
2. **Stage 12 — Target Authentication Detection vs. LDAP Filter Diagnostics (DG-12):**
   - *Detection Status:* **Target Logging Gap**. Linux pivot logged `bloodhound-python` command execution via Rule `100220` and Alert #22 on SSH data retrieval. The DC logged a standard Kerberos network logon, but the technique itself was missed because Event ID 1644 LDAP query logging was unconfigured in default Windows Server baselines.
   - *Remediation:* Configured registry key `15 Field Engineering = 5` in Phase 04 Hardening to generate Event ID 1644 for expensive/inefficient LDAP directory search queries.

#### The 2 Operational Pivot-Only Detections (10.0%)
1. **Stage 14 — Impacket secretsdump Execution vs. DC Directory Replication Auditing (DG-14):**
   - *Detection Status:* **Pivot-Only Detection**. Wazuh Rule `100220` caught the command invocation on the pivot host, and Alert #24 caught SSH exfiltration staging (`wzb-4174e3672e`), but the Domain Controller failed to generate technique-specific telemetry because Event ID 4662 (`DS-Replication-Get-Changes-All`) was unconfigured in the pre-attack baseline.
   - *Remediation:* Configured Directory Service Access SACLs and Advanced Audit Policies on Domain Controllers to detect non-DC replication requests.
2. **Stage 16 — Golden Ticket Forgery & Caching vs. Service Ticket Auditing (DG-16):**
   - *Detection Status:* **Pivot-Only Detection**. Wazuh Rule `100220` logged `ticketer.py` command invocation on the pivot host, and Alerts #27 & #28 caught `wmiexec -k` command execution, but the DC event log recorded standard Kerberos logons rather than ticket forgery detection because Kerberos Service Ticket Operations (EID 4769) were unconfigured.
   - *Remediation:* Configured Kerberos Service Ticket Operations auditing and hardened against forged tickets via double `krbtgt` password reset (KVNO 3) and `Protected Users` enrollment.

#### Architectural Transport Boundary
1. **Stage 19 — Encrypted Transport Payload Inspection Limitation (DG-19):**
   - *Detection Status:* **Direct Detection** via Wazuh correlation Rule `5715` catching the rapid burst of 6 administrative SSH logins in 0.57s (Alert #37).
   - *The Architectural Limitation:* SSH transport encryption (`22/TCP`) prevented Suricata NIDS from reading plaintext file contents on the wire.

> [!NOTE]
> **Four-Tier Detection Engineering Taxonomy:**  
> 1. **Tier 1 — Direct Target & Wire Detections (14 of 20 stages, 70.0%):** A specific rule directly intercepted the adversary's payload, binary invocation, authentication, privilege assignment, or network probe on the target host or wire (Stages 01, 02, 03, 05, 06, 07, 08, 10, 13, 15, 17, 18, 19, 20).
> 2. **Tier 2 — Operational Pivot-Only Alerts (2 of 20 stages, 10.0%):** The attack was detected on the attacking session or pivot host, but the target DC missed technique-specific logging (Stages 14 & 16).
> 3. **Tier 3 — Target-Side Logging Gaps (2 of 20 stages, 10.0%):** Pre-attack default audit policies lacked diagnostic events on target hosts (Stages 09 & 12).
> 4. **Tier 4 — Investigatively Attributed Offline Gaps (2 of 20 stages, 10.0%):** Stages 04 & 11 occurred entirely offline on the attacker's GPU hardware, producing zero victim telemetry. They are verified and attributed via upstream theft detection and downstream authentication alerts.

---

## 4. 20-Stage Attack Coverage Map

Here is the complete traceability matrix mapping all 20 adversary stages across the three investigative cases:

### Case 01: Perimeter Web Compromise & Local Escalation (Stages 01–07)
| Stage | Technique | What the Attacker Did | Sensor That Caught It | Active Rule / SID | TheHive Verdict |
|:---:|---|---|---|---|:---:|
| **01** | Reconnaissance (`T1595.001`) | Nmap OS detection & port sweeps from Kali | Suricata NIDS | SID `3400002` / Wazuh `86601` | **Detected** (`wzb-3a8045a03c`) |
| **02** | Web Brute Force (`T1110.001`) | Automated Python credential brute force on `/login.php` | Suricata & Apache | SID `2017515` + Custom Rule `100600` / Rule `100200` | **Detected** (`wzb-6a22425401`, Alert #11) |
| **03** | SQL Injection (`T1190`) | UNION SELECT payload extracting users table | Suricata & Wazuh | SID `2010963` + Custom Rule `100600` / Rule `31106` | **Detected** (`wzb-6a22425401`, Alert #11 sub-event 17) |
| **04** | Hash Cracking (`T1110.002`) | Hashcat MD5 password cracking on Kali | *Offline (Kali GPU)* | *Bracketed Lifecycle: stolen in Stage 03, authenticated in Stage 05* | **Investigatively Attributed (Offline Gap)** |
| **05** | Web Shell (`T1505.003`) | Uploaded PHP backdoor and executed `id` | Linux Auditd & NIDS | SIDs `2011768`, `2020102`, `2019284` / Auditd `100199` & `31109` | **Detected** (`wzb-61ed72e937`, `wzb-e9a1797ac4`) |
| **06** | Reverse Shell (`T1059.004`) | Interactive reverse shell to Kali port 4444 | Suricata & Auditd | SID `3400020` / Auditd `nc.openbsd` / Rule `100199` | **Detected** (`wzb-ccae331b77`) |
| **07** | Privilege Escalation (`T1548.003`)| Sudo Python GTFOBins root escape | Linux PAM / Host Shell | Wazuh `5402` (PAM sudo root, 12x) & Rule `100220` (`sudo -l`) | **Detected** (12x PAM alerts) |

### Case 02: Pivot, Credential Access & Active Directory Escalation (Stages 08–14)
| Stage | Technique | What the Attacker Did | Sensor That Caught It | Active Rule / SID | TheHive Verdict |
|:---:|---|---|---|---|:---:|
| **08** | SSH Persistence (`T1098.004`) | Injected rogue Ed25519 key to `authorized_keys`| Wazuh Auth / bashcmd | Wazuh Rule `5715` (Level 8) / Rule `100220` | **Detected** (`wzb-1208f0ea54`, Alert #16) |
| **09** | Internal Discovery (`T1018`) | Nmap scan of internal AD subnet from pivot | Suricata NIDS (`ens37`) & bashcmd | SIDs `3400001`, `3400002`, `3400020` / Wazuh Rule `100220` | **Target Logging Gap (DG-09)** |
| **10** | Responder Poisoning (`T1557.001`)| LLMNR spoofing on DVWA capturing hashes & WebDAV coercion | Linux Pivot Host & Win10 Endpoint | Wazuh `100220` (`bashcmd`: Responder.py) + Win10 EID 4688 `DavSetCookie` (Rule `100278`, `wzb-28`) | **Detected** (`wzb-28` in SIEM; Alert #20 `wzb-dbf3197ceb`) |
| **11** | NTLMv2 Cracking (`T1110.002`)| Hashcat NetNTLMv2 password cracking on Kali| *Offline (Kali GPU)* | *Bracketed Lifecycle: harvested in Stage 10, authenticated in Stage 12* | **Investigatively Attributed (Offline Gap)** |
| **12** | BloodHound Recon (`T1087.002`) | `bloodhound-python` automated LDAP domain scan | Linux Pivot Host / bashcmd | Linux Pivot Wazuh Rule `100220` + Alert #22 (`wzb-1d2d7fb4b8`) | **Target Logging Gap (DG-12)** |
| **13** | Kerberoasting (`T1558.003`) | Requested TGS ticket for `HANK_SHERMAN` | Suricata (`ens37`) & bashcmd | SID `2019922` (Alert #23) & Wazuh Rule `100220` (`GetUserSPNs.py`) | **Detected** (`wzb-c1e2642eb2`) |
| **14** | DCSync (`T1003.006`) | Impacket DRSUAPI replication extracting hashes | Linux Pivot Host & bashcmd | Linux Pivot Wazuh Rule `100220` (`secretsdump.py`) + Alert #24 (`wzb-4174e3672e`) | **Pivot-Only Coverage (DG-14)** |

### Case 03: Domain Takeover, Lateral Movement & Impact (Stages 15–20)
| Stage | Technique | What the Attacker Did | Sensor That Caught It | Active Rule / SID | TheHive Verdict |
|:---:|---|---|---|---|:---:|
| **15** | Pass-the-Hash (`T1550.002`) | Remote WMI login using Administrator NTLM hash | Windows Security / Sysmon / Wazuh | Windows EID `4624` (Rule `92657`) / Custom Rule `100613` (`wmiexec.py`) | **Detected** (`wzb-b7f91cd3ab`, `wzb-eb083a8537` / `15.5.png`, Alerts #25, #26) |
| **16** | Golden Ticket (`T1558.001`) | Forged Kerberos TGT using extracted `krbtgt` & wmiexec | Linux Pivot Host & DomainWin10 Sysmon | Linux Pivot Wazuh Rule `100220` (`ticketer.py`) + Alerts #27, #28 (`wmiexec -k` via Sysmon EID 1 / Custom Rule `100613`) | **Pivot-Only Coverage (DG-16)** |
| **17** | DC Persistence (`T1136.002`) | Created rogue `backdoor` Domain Admin account | Sysmon & Windows Security | Wazuh Custom Rule `100613` (WMI Fan-out), Windows EID `4720` (Rule `60109`), EID `4728` (Rule `60159`) | **Detected** (7 Alerts in TheHive: #29–#34, #46) |
| **18** | Data Collection (`T1005`) | Harvested business documents across C:\ and AD users | Sysmon Process Trees & Security | Custom Rule `100613` / Sysmon EID 1 (Rules `100271`, `100272`, `100275`) | **Detected** (`wzb-96e8d5856b`, `wzb-ed666653f7`, Alerts #35, #36) |
| **19** | Exfiltration (`T1041`) | Bulk SCP exfiltration from pivot to Kali | Linux Pivot Auth | Wazuh Rule `5715` (Logon burst: 6 sessions / 0.57s; Alert #37) | **Detected** (`wzb-34f34a857c`, Alert #37) |
| **20** | Impact (`T1491.001`) | Pushed `hacked.bmp` wallpaper and rebooted DC | Sysmon Process Trees & Windows System | Custom Rule `100613` / Sysmon EID 1 (Rule `92041`: `reg.exe`) / System EID 1074 | **Detected** (8 Alerts in TheHive: #38–#45) |

---

<a id="5-thecustomhive-alert-pipeline"></a><a id="thecustomhive-alert-pipeline"></a>
## 5. Telemetry Architecture: Live SOAR Ingestion vs. Analyst Dashboard Triage

A critical architectural distinction in this SOC lab is understanding **how the numbers 9,567, 808, and 46 actually relate to each other**. They are **not** a single linear waterfall; rather, they represent **two distinct operational pathways** originating from the same baseline telemetry stream:

[![SOC Telemetry Dual-Pathway Architecture](../06-Resources/diagrams/SOC%20Telemetry%20Dual-Pathway%20Architecture.png)](../06-Resources/diagrams/SOC%20Telemetry%20Dual-Pathway%20Architecture.png)
*Figure 5: The dual-pathway telemetry architecture showing the central 9,567 raw alert stream splitting into real-time Level >= 8 SOAR alert ingestion (46 TheHive alerts consolidated into 3 cases) and post-simulation analyst dashboard triage (808 curated forensic records via 11 exclusion filters) ([view full asset](../06-Resources/diagrams/SOC%20Telemetry%20Dual-Pathway%20Architecture.png)).*

### Pathway A: Live Automated SOAR Pipeline (46 TheHive Alerts Grouped into 3 Cases)
- **Evaluated In Real-Time:** When red-team attack stages executed, the Wazuh Manager's rules engine evaluated all incoming logs in real-time.
- **The Level $\ge 8$ Gate:** Inside `/var/ossec/etc/ossec.conf`, the integration block specifies `<level>8</level>`. Any alert with a severity level of 8 or higher immediately triggers `/var/ossec/integrations/custom-thehive`.
- **Why 46 Alerts Were Ingested:** Instead of bombarding TheHive with 9,567 raw hits, `custom-thehive` writes each Level $\ge 8$ alert to an SQLite Write-Ahead Logging (WAL) queue in sub-millisecond time. The background daemon (`thehive-flush.service`) wakes up every 5 seconds, groups related alerts (such as rapid Nikto 4xx web fuzzing, Impacket `wmiexec` process fan-outs, and SSH logon bursts), applies tool regex fingerprints, and pushes **46 distinct, high-fidelity alerts** to TheHive 5, which are then triaged and consolidated into 3 formal incident cases.
- **Result:** Analysts receive clean, organized incident cards directly from the live simulation without losing context or dropping alerts.

---

### Pathway B: Human Analyst Dashboard Triage & Filtering (808 Records)
- **The Forensic Challenge:** When a SOC analyst sits down at the Wazuh Dashboard to investigate an incident, the database contains all **9,567 raw alerts**. Over 8,000 of these alerts are repetitive 404 HTTP errors from directory brute-forcing, routine SCA security compliance summaries, VMware background heartbeats, and benign Windows background services.
- **How the Analyst Filtered the Noise:** To isolate the authentic attack footprint without drowning in noise, the analyst configured **11 precision exclusion filters (`must_not` clauses)** in the Wazuh Dashboard (OpenSearch) query interface:

```json
{
  "query": {
    "bool": {
      "must_not": [
        { "wildcard": { "rule.description": { "value": "*SCA*Summary*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*VMware*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*secpol*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*SecurityHealthsystray*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*reporting*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*msedgeweb*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*SessionEnv*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*CIS*Microsoft*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*4xx*error*", "case_insensitive": true } } },
        { "wildcard": { "rule.description": { "value": "*[404]*", "case_insensitive": true } } },
        {
          "bool": {
            "should": [
              { "match_phrase": { "full_log": "HTTP/1.1 404" } },
              { "match_phrase": { "full_log": "HTTP/1.0 404" } },
              { "match_phrase": { "full_log": "HTTP/2.0 404" } }
            ],
            "minimum_should_match": 1
          }
        }
      ]
    }
  }
}
```

- **What Remained:** Applying these 11 search filters reduced 9,567 noisy logs down to **808 curated, high-value security events**. This filtered view was exported as [`wazuh_alerts.csv`](../06-Resources/alerts/wazuh_alerts.csv), giving the analyst a focused forensic dataset to correlate attack stages, build the master timeline, and verify detections across all 20 stages.

---

### 5.3 Telemetry Ingestion Latency, Buffer Flushing & Multi-Sensor Arrival Mechanics

In a production hybrid SOC environment, security events never arrive in a perfectly synchronized millisecond lockstep. When reviewing raw timestamps across network wire captures, Linux kernel hooks, Windows endpoint event logs, OpenSearch dashboards, and TheHive cases, analysts will observe small, expected timing offsets (typically 1–3 seconds, or up to minutes for interactive shells). These variances are **inherent architectural realities of enterprise log transport and shell execution**:

> [!NOTE]
> **Understanding Telemetry Arrival Latencies Across the Defensive Stack:**
>
> 1. **TheHive Webhook Dispatch vs. OpenSearch Dashboard Indexing:**
>    * **The Fast Path (TheHive):** Wazuh's `wazuh-integratord` hooks directly into the core analysis engine (`analysisd`) in memory. The millisecond a rule hits Level >= 8, `integratord` forks `custom-thehive.py`, appending the alert to the local SQLite WAL queue in **< 0.2 ms**.
>    * **The Buffered Path (Wazuh Dashboard):** Displaying that same alert in the Wazuh Dashboard requires Filebeat to read `alerts.json`, package events into batches, transmit them over the encrypted WireGuard tunnel, and wait for OpenSearch to index them into shard storage. As a result, incident cases frequently register in TheHive **1 to 3 seconds before** the corresponding event appears in the OpenSearch dashboard query UI.
>
> 2. **Linux Shell Telemetry (`PROMPT_COMMAND` Hook Execution):**
>    * Linux command-line auditing (`bashcmd`) on the DVWA pivot relies on Bash's `PROMPT_COMMAND` hook. In Unix systems, `PROMPT_COMMAND` executes **only after a command terminates** and the shell redraws the next command prompt.
>    * When long-running or interactive tools execute (such as `Responder.py`, `wmiexec.py`, or interactive subshells), Suricata and target Windows machines log network traffic and remote process creations **in real-time** as packets arrive. In contrast, `bashcmd` flushes to `/var/log/bashcmd.log` only after the operator interrupts (`Ctrl+C`) or exits the process, creating an expected forensic interval between host execution start and bashcmd journal writes.
>
> 3. **Live Campaign Multi-Attempt Iterations vs. Alert Window Anchoring:**
>    * Because the 20 attack stages were executed live as a continuous 74-minute campaign, realistic operator retries occurred (e.g., formatting quotes in `net group "Domain Admins"`, adjusting proxy chains, or retrying commands).
>    * TheHive's asynchronous correlation engine groups events within a 5-second sliding correlation window, anchoring the case creation timestamp to the **first trigger** in the cluster. Meanwhile, specific forensic screenshots captured in the Wazuh Dashboard may depict subsequent execution instances within that same multi-attempt sequence.

---

## 6. Directory Index: Where to Find the Raw Code & Rules

All configuration files, rulesets, and detection scripts are organized in dedicated subdirectories:

| Directory | What's Inside | Defensive Technology | Key Highlights |
|---|---|---|---|
| [`Wazuh/`](Wazuh/README.md) | [`local_rules.xml`](../06-Resources/rules/wazuh/local_rules.xml)<br>[`local_decoder.xml`](../06-Resources/rules/wazuh/local_decoder.xml) | Wazuh SIEM 4.14.8 | 1,300+ line tuned ruleset, Impacket wmiexec detection, 87 suppressions |
| [`Suricata/`](Suricata/README.md) | [`custom.rules`](../06-Resources/rules/suricata/custom.rules)<br>[`threshold.config`](../06-Resources/rules/suricata/threshold.config) | Suricata 8.0.6 NIDS | Nmap OS detection rules, SQLi URIs, rate-limiting configuration |
| [`Sysmon/`](Sysmon/README.md) | [`sysmonconfig.xml`](../06-Resources/rules/sysmon/sysmonconfig.xml) | Microsoft Sysmon v15.20 | Windows process command lines (EID 1), network sockets, and registry tracking |
| [`Auditd/`](Auditd/README.md) | [`audit.rules`](../06-Resources/rules/auditd/audit.rules) | Linux Auditd Subsystem | Kernel syscall tracing on `execve`, SUID creation, and identity file watches |

---

## Related Documentation

| Reference | Category | Description |
|---|---|---|
| [Lab Setup & Architecture](../01-Lab-Setup/README.md) | Architecture | Complete 7-system network topology and WireGuard tunnel routing |
| [Wazuh SIEM Setup](../01-Lab-Setup/Cloud/wazuh.md) | Cloud Setup | Wazuh Manager, Indexer, and Dashboard installation & CDB lists |
| [Attack Simulation Directory](../02-Attack-Simulation/README.md) | Red Team | 20-stage adversary simulation execution, scripts, and commands |
| [Investigation Cases](../04-Investigation/README.md) | Blue Team | Analyst triage playbooks, 3 TheHive cases, and 20 stage investigation notes |
| [Formal Incident Report](../05-Incident-Report/README.md) | Post-Incident | Post-incident executive review, root cause analysis, and remediation actions |
| [thecustomhive Source Engine](../06-Resources/scripts/custom-thehive.py) | Automation | Production 2-tier asynchronous alert correlation daemon script |
