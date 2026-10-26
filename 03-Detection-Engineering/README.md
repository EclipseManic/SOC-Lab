# 03 — Detection Engineering: Architecture, Custom Rules & SOAR Pipeline

> **The Golden Rule of Detection Engineering:**  
> A security system is only as good as what it catches—and how clearly it communicates. If an engine fires 10,000 alerts a day, analysts miss real breaches due to alert fatigue. If it fires zero alerts, you are flying blind.  
> Detection engineering is the disciplined art of writing precise rules, eliminating false alarms, and turning thousands of raw machine logs into a handful of high-priority, actionable incident cases.

---

## The Big Picture: How This SOC Detects Attacks

To understand how detection works in this lab, imagine securing a corporate office building:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            THE 5 DEFENSIVE ROLES                            │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ 1. Suricata NIDS      │ The Perimeter Cameras: Watches all traffic entering │
│    (Network Wire)     │ the building and crossing between hallways.         │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 2. Linux Auditd       │ The Server Room Motion Sensor: Hooks the Linux      │
│    (Kernel Syscalls)  │ kernel to watch every command run by web services.  │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 3. Windows Sysmon     │ The Desktop Watchdog: Records process trees,        │
│    (Endpoint Context) │ command lines, and registry tampering on Windows.   │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 4. Wazuh SIEM         │ The Central Control Room: Ingests all sensor feeds, │
│    (Analysis Brain)   │ applies rules, silences noise, and sounds alarms.   │
├───────────────────────┼─────────────────────────────────────────────────────┤
│ 5. TheHive 5 + Script │ The Incident Desk: Groups related alerts into clean │
│    (SOAR & Pipeline)  │ investigation cases for human SOC analysts.         │
└───────────────────────┴─────────────────────────────────────────────────────┘
```

When an attacker launches a multi-stage attack across our network, all five components work as interlocking gears. If the attacker hides their payload with transport encryption, the endpoint kernel catches them; if the attacker disables local logging, the network wire catches them.

---

## Empirical Scorecard at a Glance

Before examining rules and code, here are the authentic results from our 20-stage attack simulation:

| Metric | Result | What It Means in Plain English |
|---|:---:|---|
| **Attack Stages Tested** | **20** | Full kill chain from external port scanning to Active Directory takeover and ransomware |
| **Stages Caught (Detection Rate)** | **16 (80%)** | Real-time, high-priority alerts raised in TheHive 5 with full forensic evidence |
| **Documented Blind Spots** | **4 (20%)** | **2 Offline:** Password cracking ran locally on the attacker's GPU (zero victim packets).<br>**2 Logging Gaps:** Internal switch discovery and BloodHound LDAP scans lacked target-side rule alerts. |
| **Total Raw Telemetry Ingested** | **9,567 records** | Complete raw alert baseline indexed in Wazuh across all 4 agents (`Wazuh-Raw-Alerts.csv`) |
| **Analyst Curated Records** | **808 records** | Focused forensic dataset created by applying 11 OpenSearch exclusion filters in Wazuh Dashboard (`wazuh_alerts.csv`) |
| **Live TheHive Incidents** | **46 cases** | Actionable, correlated incident tickets delivered live to TheHive 5 via Level ≥ 8 gate (`thehive_alerts.json`) |
| **Custom Noise Suppressions** | **87 rules** | Server-side false-positive rules silencing background OS chatter, guest tools, and machine loops |

---

## 1. The 4 Detection Layers: Why One Tool is Never Enough

No single security tool can see everything. In this lab, four complementary detection technologies cover each other's blind spots:

[![Cybersecurity Lab-to-Detection Mapping](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)
*Figure 1: Full-stack detection mapping connecting physical & virtual machines to their defensive inspection layers ([view full asset](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)).*

### Layer 1: The Network Wire — Suricata NIDS
- **Where It Lives:** On the dual-homed Security Gateway (`192.168.232.162` / `192.168.56.150`).
- **What It Does:** Sniffs raw packets passing between the attacker's subnet (`192.168.232.0/24`) and the victim subnet (`192.168.56.0/24`) using high-speed AF-PACKET promiscuous capture.
- **What It Catches:** Nmap port scans, WhatWeb web scanners, SQL injection payloads in HTTP URIs, and raw Kerberos ticket requests crossing the wire.
- **Its Blind Spot:** It cannot read encrypted HTTPS or SSH traffic, and it cannot see local commands typed directly on an endpoint.
- **Detailed Docs:** [`Suricata/README.md`](Suricata/README.md) · Active rules: [`Suricata/custom.rules`](Suricata/custom.rules)

### Layer 2: The Linux Kernel — Auditd
- **Where It Lives:** On the DVWA web server and pivot host (`192.168.56.30`).
- **What It Does:** Hooks directly into the Linux netlink kernel subsystem to audit system calls (`execve`). Specifically, rule `-S execve -F uid=33 -k web_process_creation` monitors **every command executed by the Apache web service user (`www-data`)**.
- **What It Catches:** When an attacker uploads a PHP web shell or spawns an interactive Python reverse shell, Auditd captures the process binary, command arguments, working directory, and user ID even if the traffic arrived over encrypted channels.
- **Its Blind Spot:** It only monitors Linux endpoints and has no visibility into network packets or Windows machines.
- **Detailed Docs:** [`Auditd/README.md`](Auditd/README.md) · Active rules: [`Auditd/audit.rules`](Auditd/audit.rules)

### Layer 3: Windows Endpoints — Sysmon & Security Event Logs
- **Where It Lives:** On the Active Directory Domain Controller (`PC-DC`, `192.168.56.10`) and Windows 10 workstation (`WIN10`, `192.168.56.20`).
- **What It Does:** Standard Windows Security logs record who logged in (Event ID 4624) and when privileges were assigned (Event ID 4672). Microsoft Sysmon adds deep endpoint forensics: full process command lines (EID 1), network sockets (EID 3), and registry modifications (EID 13).
- **What It Catches:** Lateral movement via Impacket `wmiexec` (spawning `WmiPrvSE.exe` $\to$ `cmd.exe /Q /c`), command-line reconnaissance (`whoami`, `net user /domain`), and unauthorized desktop wallpaper changes during defacement.
- **Its Blind Spot:** It only monitors Windows systems.
- **Detailed Docs:** [`Sysmon/README.md`](Sysmon/README.md) · Active baseline: [`Sysmon/sysmonconfig.xml`](Sysmon/sysmonconfig.xml)

### Layer 4: Central Correlation & Analysis — Wazuh SIEM
- **Where It Lives:** On the private cloud server (`10.122.1.4:1514/TCP`).
- **What It Does:** Receives real-time event streams from all four endpoint agents. It parses raw text into structured fields using [`local_decoder.xml`](Wazuh/local_decoder.xml), tests them against over 1,300 lines of custom rules in [`local_rules.xml`](Wazuh/local_rules.xml), matches entries against fast Constant Database (CDB) lookup tables, and enforces an alert threshold ($\ge 8$) to send serious emergencies to TheHive.
- **Detailed Docs:** [`Wazuh/README.md`](Wazuh/README.md) · Rules: [`Wazuh/local_rules.xml`](Wazuh/local_rules.xml)

---

## 2. Life of an Alert: An End-to-End Walkthrough

To see how all these pieces fit together in real life, let's trace **Stage 05 (Web Shell Upload & Command Execution)** step-by-step from the attacker's keyboard to the analyst's screen:

[![Life of an Alert End-to-End Walkthrough](../06-Resources/Diagrams/Life%20of%20an%20Alert%20End-to-End%20Walkthrough.png)](../06-Resources/Diagrams/Life%20of%20an%20Alert%20End-to-End%20Walkthrough.png)
*Figure 2: End-to-end detection pipeline tracing Stage 05 web shell execution from adversary command execution across multi-sensor capture, WireGuard transit, Wazuh decoding, SQLite WAL buffering, to TheHive 5 incident case ([view full asset](../06-Resources/Diagrams/Life%20of%20an%20Alert%20End-to-End%20Walkthrough.png)).*

```
[ Step 1: Attacker Action ]
Attacker on Kali (192.168.232.135) uploads cmd.php to DVWA and runs: "id"
       │
       ├────────────────────────────────────────┬────────────────────────────────────────┐
       ▼                                        ▼                                        ▼
[ Step 2A: The Wire Sensor ]             [ Step 2B: The Kernel Sensor ]           [ Step 2C: Web Access Log ]
Suricata inspects HTTP response          Linux Auditd intercepts system call      Apache records HTTP 200:
Payload contains "uid=33(www-data)"      execve(/usr/bin/id) by uid=33            POST /hackable/uploads/cmd.php
Fires SID 2019284 into eve.json          Fires key="web_process_creation"         Saved to /var/log/apache2/access.log
       │                                        │                                        │
       └────────────────────────────────────────┼────────────────────────────────────────┘
                                                ▼
                                   [ Step 3: Wazuh Agent Forwarding ]
                                   Wazuh Agent on DVWA ships logs over encrypted
                                   WireGuard tunnel to Cloud SIEM (10.122.1.4:1514)
                                                ▼
                                   [ Step 4: Rules Engine & Decoding ]
                                   Wazuh decodes Auditd log using "bashcmd" decoder
                                   Matches custom Rule 100214: "Web shell command execution"
                                   Assigns severity: LEVEL 10 (High Priority)
                                                ▼
                                   [ Step 5: Tier 1 Fast Ingest (0.2 ms) ]
                                   Level 10 passes threshold (≥ 8)
                                   Wazuh forks /var/ossec/integrations/custom-thehive
                                   Appends alert JSON directly into SQLite WAL database
                                   ZERO HTTP calls — engine returns instantly without lag
                                                ▼
                                   [ Step 6: Tier 2 Async Correlation Daemon ]
                                   thehive-flush.service wakes up on 5-second polling loop
                                   Bundles the Auditd process execution with the Suricata alert
                                   Identifies tool signature: "PHP Web Shell RCE"
                                   Sends single batched HTTP POST across private VNet to TheHive
                                                ▼
                                   [ Step 7: SOC Analyst Triage ]
                                   TheHive 5 creates ONE clean incident card:
                                   "Web Shell Backdoor & RCE Command Execution on DVWA"
                                   Analyst sees: Attacker IP, process name, command arguments,
                                   and Suricata payload — all organized in one place!
```

---

## 3. The 3 Hard Engineering Problems We Solved

Anyone can install security tools out of the box. Real detection engineering begins when those tools fail under realistic operational conditions. 

Here are the three biggest challenges we tackled:

### Challenge 1: The Alert Noise Nightmare (Taming 10,000 Logs into 46 Cases)
- **The Problem:** When we first ran Wazuh with default configurations, the dashboard was flooded with thousands of useless alerts every day. Analysts were buried under false positives caused by routine operating system behavior.
- **The Culprits:**
  1. *The Syscollector Scan Loop:* Wazuh's own agent periodically executes commands like `dpkg-query`, `rpm`, `uname`, `ps`, and `netstat` to update its software inventory. Because Auditd was logging all commands, Wazuh's own scanner generated over 6,000 Rule `80792` ("Auditd: Command executed") alerts every single day!
  2. *Windows Computer Accounts (`$` Accounts):* Domain controllers process computer account logins (`PC-DC$`, `WIN10$`) every few seconds, generating hundreds of Event ID 4672 ("Special privileges assigned") events.
  3. *VMware Guest Tools:* Hypervisor background polling (`vmtoolsd.exe`) continually created background process and named pipe noise.
- **How We Fixed It:**
  - We wrote **87 custom suppression rules** in `local_rules.xml` that drop benign background events to `level="0"`.
  - For the syscollector loop, we created a compiled Constant Database (CDB) lookup table at [`06-Resources/Configs/lists/wazuh-internal-bins`](../06-Resources/Configs/lists/wazuh-internal-bins). Custom Rule `100280` performs an instantaneous memory lookup against this list. If the command was run by a known system binary, it is silently dropped without alerting.
  - For Windows computer accounts, Rule `100603` uses regex negation (`negate="yes">^SYSTEM$|^LOCAL SERVICE$|\$$</field>`) to ensure alerts fire **only when a human user account** is granted administrative attack privileges.
- **The Payoff:** False alarms dropped by over 95%, leaving only genuine red-team activity.

---

### Challenge 2: The Webhook Bottleneck (Why Shuffle SOAR Was Replaced)

[![Wazuh Log Ingestion to TheHive Flow](../06-Resources/Diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)](../06-Resources/Diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)
*Figure 3: Multi-source log ingestion, decoders, and Level 8 threshold gate ([view full asset](../06-Resources/Diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)).*

- **The Problem:** We originally used [Shuffle SOAR](https://shuffler.io/) to receive alerts from Wazuh via webhooks and push them to TheHive. But when we simulated aggressive attacks (like Nikto web fuzzing or rapid Nmap port scans), Shuffle completely collapsed:
  1. *Dropped Packets:* Floods of 400 webhooks in 10 seconds overwhelmed Shuffle's HTTP listeners, silently dropping critical alerts.
  2. *Analysis Engine Freezes:* Wazuh forks an operating system process per alert. Having hundreds of forked scripts waiting on external HTTP network responses caused Wazuh's analysis engine (`wazuh-analysisd`) to run out of process memory and lag behind.
  3. *Alert Floods:* Every single port scan probe generated an isolated ticket, burying analysts under 300 identical cases for one scan.
- **How We Fixed It (`thecustomhive` Two-Tier Pipeline):**
  We replaced Shuffle with a custom, high-speed Python automation pipeline:

[![Wazuh-TheHive Neon Alert Pipeline](../06-Resources/Diagrams/Wazuh–TheHive%20Neon%20Alert%20Pipeline.png)](../06-Resources/Diagrams/Wazuh–TheHive%20Neon%20Alert%20Pipeline.png)
*Figure 3: Two-tier asynchronous alert correlation pipeline from Wazuh Manager Level ≥ 8 trigger into TheHive 5 case management.*

  - **Tier 1 (Instant Local Buffer — Zero HTTP):** When an alert ($\ge 8$) fires, Wazuh executes `/var/ossec/integrations/custom-thehive`. Instead of making network calls, this lightweight script writes the alert JSON into a local SQLite database running in Write-Ahead Logging (WAL) mode. This executes in under **0.2 milliseconds** locally. The Wazuh engine never freezes or drops an alert.
  - **Tier 2 (Smart Asynchronous Daemon):** A background systemd daemon (`thehive-flush.service`) wakes up every 5 seconds. It reads pending records from SQLite, applies regex tool fingerprinting (identifying Nmap, Nikto, Hydra, sqlmap), groups related bursts into a single case, and pushes clean, organized incident batches to TheHive 5 over private VNet peering.
- **The Payoff:** Zero dropped alerts under heavy attack bursts, zero SIEM engine lag, and 300 raw port scan alerts compressed into **one clean case** titled `Tool Campaign: Nmap Portscan from Kali`.

---

### Challenge 3: The Honest Gap Register (Why 80% Detection is Real Security)
In junior cybersecurity labs, people often claim "100% detection rate." In real enterprise security, 100% detection is impossible. 

We achieved an **80% detection rate (16 out of 20 stages caught)**. More importantly, we documented exactly why the remaining 4 stages were missed and how to fix them:

1. **Offline GPU Password Cracking (Stages 04 & 11 — Hashcat):**
   - *Why It Was Missed:* In Stage 04 (MD5) and Stage 11 (NTLMv2), password cracking occurred entirely on the attacker's physical laptop GPU. No network packets crossed the wire, and no processes spawned on victim servers.
   - *The Reality:* Offline cracking cannot be detected at execution time. The defense must focus on **prevention** (disabling LLMNR via GPO to prevent hash capture) and **post-crack alerting** (detecting when the stolen password is used).
2. **Intra-Subnet Layer 2 Discovery (Stage 09 — Internal Nmap Sweep):**
   - *Why It Was Missed by Routers:* When the attacker pivoted to DVWA (`192.168.56.30`) and scanned other Windows hosts on the same subnet (`192.168.56.0/24`), traffic was switched locally at Layer 2 within the virtual switch. Because packets never crossed a Layer 3 router, perimeter firewalls were blind to them.
   - *How We Caught Telemetry:* Suricata's second interface (`ens37`) was placed in promiscuous mode on the virtual switch, passively picking up probe frames.
   - *The Production Fix:* In hardware-switched environments, enable Windows Defender Firewall dropped-packet logging and forward those logs to Wazuh.
3. **Active Directory LDAP Query Volume (Stage 12 — BloodHound AD Recon):**
   - *Why It Was Missed:* BloodHound ran high-volume LDAP queries against the Domain Controller to map attack paths. Windows Server does not log individual LDAP queries by default, so no dedicated AD alert fired (though the SSH session on the pivot was flagged).
   - *The Production Fix:* Set registry key `HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics\15 Field Engineering` to `5` to generate Event ID 1644 ("Expensive/Inefficient LDAP Search Queries").
4. **Encrypted Transport Blindness (Stage 19 — Exfiltration via SCP):**
   - *Why It Was Missed on the Wire:* The attacker transferred files over encrypted SSH/SCP (`22/TCP`). Network sniffers cannot read encrypted file contents.
   - *How We Caught It Anyway:* Wazuh's correlation engine detected an authentication anomaly: a rapid burst of 6 administrative SSH logins in under one second (`Rule 5715`), catching the exfiltration through behavior rather than packet inspection.

---

## 4. 20-Stage Attack Coverage Map

Here is the complete traceability matrix mapping all 20 adversary stages across the three investigative cases:

### Case 01: Perimeter Web Compromise & Local Escalation (Stages 01–07)
| Stage | Technique | What the Attacker Did | Sensor That Caught It | Active Rule / SID | TheHive Verdict |
|:---:|---|---|---|---|:---:|
| **01** | Reconnaissance (`T1595.001`) | Nmap OS detection & port sweeps from Kali | Suricata NIDS | SID `3400002` / Wazuh `86601` | **Detected** (`wzb-3a8045a03c`) |
| **02** | Web Brute Force (`T1110.001`) | Hydra HTTP password flood on `/login.php` | Apache Web Access | Wazuh `31153`, `100410` | **Detected** (`wzb-81becfcc8d`) |
| **03** | SQL Injection (`T1190`) | UNION SELECT payload extracting users table | Suricata NIDS | SID `2010963` / Wazuh `31106` | **Detected** (CSV Row 9108) |
| **04** | Hash Cracking (`T1110.002`) | Hashcat MD5 password cracking on Kali | *Offline (Kali GPU)* | *None (Zero victim packets)* | **Detection Gap** (Inherent) |
| **05** | Web Shell (`T1505.003`) | Uploaded PHP backdoor and executed `id` | Linux Auditd & NIDS | SID `2019284` / Auditd `execve` | **Detected** (`wzb-e9a1797ac4`) |
| **06** | Reverse Shell (`T1059.004`) | Interactive reverse shell to Kali port 4444 | Suricata & Auditd | SID `3400020` / Wazuh `100199` | **Detected** (`wzb-ccae331b77`) |
| **07** | Privilege Escalation (`T1548.003`)| Sudo Python GTFOBins root escape | Linux PAM / Auditd | Wazuh `5402` / SUID bash | **Detected** (12x PAM alerts) |

### Case 02: Pivot, Credential Access & Active Directory Escalation (Stages 08–14)
| Stage | Technique | What the Attacker Did | Sensor That Caught It | Active Rule / SID | TheHive Verdict |
|:---:|---|---|---|---|:---:|
| **08** | SSH Persistence (`T1098.004`) | Injected rogue Ed25519 key to `authorized_keys`| Wazuh FIM / Auth | Wazuh `550` (Syscheck) / `5715` | **Detected** (`wzb-1208f0ea54`) |
| **09** | Internal Discovery (`T1018`) | Nmap scan of internal AD subnet from pivot | Suricata NIDS (`ens37`)| SID `3400001`, `3400002` | **Logging Gap** (`wzb-3152e3ed59`) |
| **10** | Responder Poisoning (`T1557.001`)| LLMNR spoofing on DVWA capturing hashes | Linux Pivot Host | Wazuh `bashcmd` (uid:0 Responder) | **Detected** (CSV Row 9231) |
| **11** | NTLMv2 Cracking (`T1110.002`)| Hashcat NetNTLMv2 password cracking on Kali| *Offline (Kali GPU)* | *None (Zero victim packets)* | **Detection Gap** (Inherent) |
| **12** | BloodHound Recon (`T1087.002`) | SharpHound automated LDAP domain scan | Pivot Host Auth | Wazuh `5715` (Elevated Level 8) | **Logging Gap** (`wzb-dbf3197ceb`) |
| **13** | Kerberoasting (`T1558.003`) | Requested TGS ticket for `HANK_SHERMAN` | Suricata & Pivot Auth | SID `2019922` / Wazuh `5715` | **Detected** (`wzb-1d2d7fb4b8`) |
| **14** | DCSync (`T1003.006`) | Impacket DRSUAPI replication extracting hashes | Pivot Host Auth | Wazuh `5715` (Elevated Level 8) | **Detected** (`wzb-4174e3672e`) |

### Case 03: Domain Takeover, Lateral Movement & Impact (Stages 15–20)
| Stage | Technique | What the Attacker Did | Sensor That Caught It | Active Rule / SID | TheHive Verdict |
|:---:|---|---|---|---|:---:|
| **15** | Pass-the-Hash (`T1550.002`) | Remote WMI login using Administrator NTLM hash | Windows Security / WMI | EID `4624` (24x in CSV) / `100613`| **Detected** (`wzb-b7f91cd3ab`) |
| **16** | Golden Ticket (`T1558.001`) | Forged Kerberos TGT using extracted `krbtgt` | Pivot Host Auth | Wazuh `5715` (Elevated Level 8) | **Detected** (`wzb-8d45b2d236`) |
| **17** | DC Persistence (`T1136.002`) | Created rogue `backdoor` Domain Admin account | Sysmon & Windows Sec | Wazuh `100613`, `60109`, `4728` | **Detected** (7 Alerts in TheHive) |
| **18** | Data Collection (`T1005`) | Harvested business documents across C:\ | Sysmon Process Trees | Wazuh `100613` (`whoami`, `net user`)| **Detected** (`wzb-aa66cb916a`) |
| **19** | Exfiltration (`T1041`) | Bulk SCP exfiltration from pivot to Kali | Linux Pivot Auth | Wazuh `5715` (Burst: 6 logons / 1s)| **Detected** (`wzb-34f34a857c`) |
| **20** | Impact (`T1491.001`) | Pushed `hacked.bmp` wallpaper and rebooted DC | Sysmon & Suricata | Wazuh `100613` / SIDs `2067085`–`87` | **Detected** (10 Alerts in TheHive) |

---

## 5. Telemetry Architecture: Live SOAR Ingestion vs. Analyst Dashboard Triage

A critical architectural distinction in this SOC lab is understanding **how the numbers 9,567, 808, and 46 actually relate to each other**. They are **not** a single linear waterfall; rather, they represent **two distinct operational pathways** originating from the same baseline telemetry stream:

[![SOC Telemetry Dual-Pathway Architecture](../06-Resources/Diagrams/SOC%20Telemetry%20Dual-Pathway%20Architecture.png)](../06-Resources/Diagrams/SOC%20Telemetry%20Dual-Pathway%20Architecture.png)
*Figure 4: The dual-pathway telemetry architecture showing the central 9,567 raw alert stream splitting into real-time Level >= 8 SOAR case creation (46 TheHive cases) and post-simulation analyst dashboard triage (808 curated forensic records via 11 exclusion filters) ([view full asset](../06-Resources/Diagrams/SOC%20Telemetry%20Dual-Pathway%20Architecture.png)).*

```
                              [ Wazuh SIEM Telemetry Ingestion ]
                              9,567 Total Raw Alerts Indexed in OpenSearch
                              (DVWA: 8,114  •  Suricata: 1,168  •  DC: 168  •  Win10: 117)
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼                                                   ▼
       [ PATHWAY A: Real-Time SOAR Engine ]            [ PATHWAY B: Analyst Dashboard Triage ]
       • Evaluated LIVE during simulation execution     • Performed in Wazuh Dashboard search UI
       • Filter: Alert Level ≥ 8 Ingestion Gate         • Filter: 11 OpenSearch Exclusion Query Filters
       • Engine: custom-thehive (SQLite WAL + 5s loop)    (Removes 404 fuzzing, SCA, VMware & Win services)
       • Purpose: Instant, non-blocking incident case   • Purpose: Eliminates background noise so analyst
         creation for human SOC analysts                  can inspect the exact attack progression
                    │                                                   │
                    ▼                                                   ▼
       [ 46 Correlated Cases in TheHive 5 ]            [ 808 Curated Alerts (wazuh_alerts.csv) ]
       (thehive_alerts.json - Actionable Incidents)     (Forensic dataset for timeline & case evidence)
```

### Pathway A: Live Automated SOAR Pipeline (46 TheHive Cases)
- **Evaluated In Real-Time:** When red-team attack stages executed, the Wazuh Manager's rules engine evaluated all incoming logs in real-time.
- **The Level $\ge 8$ Gate:** Inside `/var/ossec/etc/ossec.conf`, the integration block specifies `<level>8</level>`. Any alert with a severity level of 8 or higher immediately triggers `/var/ossec/integrations/custom-thehive`.
- **Why Only 46 Cases Were Created:** Instead of bombarding TheHive with 9,567 raw hits, `custom-thehive` writes each Level $\ge 8$ alert to an SQLite Write-Ahead Logging (WAL) queue in sub-millisecond time. The background daemon (`thehive-flush.service`) wakes up every 5 seconds, groups related alerts (such as rapid Nikto 4xx web fuzzing, Impacket `wmiexec` process fan-outs, and SSH logon bursts), applies tool regex fingerprints, and pushes **46 distinct, high-fidelity incident cases** to TheHive 5.
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

- **What Remained:** Applying these 11 search filters reduced 9,567 noisy logs down to **808 curated, high-value security events**. This filtered view was exported as [`wazuh_alerts.csv`](../06-Resources/Alerts/wazuh_alerts.csv), giving the analyst a focused forensic dataset to correlate attack stages, build the master timeline, and verify detections across all 20 stages.

---

## 6. Directory Index: Where to Find the Raw Code & Rules

All configuration files, rulesets, and detection scripts are organized in dedicated subdirectories:

| Directory | What's Inside | Defensive Technology | Key Highlights |
|---|---|---|---|
| [`Wazuh/`](Wazuh/README.md) | [`local_rules.xml`](Wazuh/local_rules.xml)<br>[`local_decoder.xml`](Wazuh/local_decoder.xml) | Wazuh SIEM 4.14.8 | 1,300+ line tuned ruleset, Impacket wmiexec detection, 87 suppressions |
| [`Suricata/`](Suricata/README.md) | [`custom.rules`](Suricata/custom.rules)<br>[`threshold.config`](Suricata/threshold.config) | Suricata 7.x NIDS | Nmap OS detection rules, SQLi URIs, rate-limiting configuration |
| [`Sysmon/`](Sysmon/README.md) | [`sysmonconfig.xml`](Sysmon/sysmonconfig.xml) | Microsoft Sysmon v15.20 | Windows process command lines (EID 1), network sockets, and registry tracking |
| [`Auditd/`](Auditd/README.md) | [`audit.rules`](Auditd/audit.rules) | Linux Auditd Subsystem | Kernel syscall tracing on `execve`, SUID creation, and identity file watches |

---

## Related Documentation

| Reference | Category | Description |
|---|---|---|
| [Lab Setup & Architecture](../01-Lab-Setup/README.md) | Architecture | Complete 8-machine network topology and WireGuard tunnel routing |
| [Wazuh SIEM Setup](../01-Lab-Setup/Cloud/wazuh.md) | Cloud Setup | Wazuh Manager, Indexer, and Dashboard installation & CDB lists |
| [Attack Simulation Directory](../02-Attack-Simulation/README.md) | Red Team | 20-stage adversary simulation execution, scripts, and commands |
| [Investigation Cases](../04-Investigation/README.md) | Blue Team | Analyst triage playbooks, 3 TheHive cases, and 20 stage investigation notes |
| [Formal Incident Report](../05-Incident-Report/README.md) | Post-Incident | Post-incident executive review, root cause analysis, and remediation actions |
| [thecustomhive Source Engine](../06-Resources/Scripts/custom-thehive.py) | Automation | Production 2-tier asynchronous alert correlation daemon script |
