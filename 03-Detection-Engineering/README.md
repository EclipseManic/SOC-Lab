# 03 — Detection Engineering

This section details the detection engineering architecture, custom rule definitions, log parsers, coverage validation, gap analysis, and SOAR pipeline automation. It answers the fundamental question: **what can the lab detect, where are the operational boundaries, and how do alerts flow to analysts?**

---

## Table of Contents

1. [Engineering Structure & Telemetry Catalog](#1-engineering-structure--telemetry-catalog)
2. [Architectural Linkage](#2-architectural-linkage)
3. [20-Stage Detection Coverage Matrix](#3-20-stage-detection-coverage-matrix)
4. [Detection Gap Register & Blind Spot Analysis](#4-detection-gap-register--blind-spot-analysis)
5. [thecustomhive Alert Pipeline](#5-thecustomhive-alert-pipeline)
6. [Performance Metrics & Funnel Mechanics](#6-performance-metrics--funnel-mechanics)

---

## 1. Engineering Structure & Telemetry Catalog

### Deployed Rulesets, Decoders & Baselines

| Component | Documentation | Active Configuration / Baseline | Host / Location | Purpose |
|---|---|---|---|---|
| **Wazuh Engine** | [`Wazuh/README.md`](Wazuh/README.md) | [`Wazuh/local_rules.xml`](Wazuh/local_rules.xml)<br>[`Wazuh/local_decoder.xml`](Wazuh/local_decoder.xml) | Wazuh Manager (`10.122.1.4`) | Custom rules (wmiexec, LOLBins, privesc, 87 suppressions) & `bashcmd` decoder |
| **Suricata NIDS** | [`Suricata/README.md`](Suricata/README.md) | [`Suricata/custom.rules`](Suricata/custom.rules)<br>[`Suricata/threshold.config`](Suricata/threshold.config) | Suricata Gateway (`.56.150` / `.232.162`) | Passive AF-PACKET IDS sniffing, scan fingerprinting, and rate limiting |
| **Sysmon Baseline** | [`Sysmon/README.md`](Sysmon/README.md) | [`Sysmon/sysmonconfig.xml`](Sysmon/sysmonconfig.xml) | DC (`.56.10`) & Win10 (`.56.20`) | Endpoint telemetry: EID 1 (Process), EID 3 (Network), EID 11 (File), EID 13 (Registry), EID 17/18 (Pipes) |
| **Linux Auditd** | [`Auditd/README.md`](Auditd/README.md) | [`Auditd/audit.rules`](Auditd/audit.rules) | DVWA (`.56.30`) | Kernel syscall tracing (`execve`), SUID creation (`chmod +s`), and identity file watches |
| **Alert Pipeline** | [`06-Resources/Scripts/`](../06-Resources/Scripts/) | `custom-thehive`<br>`custom-thehive.py`<br>`thehive-flush.service`<br>`tool_fingerprints.json` | Wazuh Manager | 2-tier O(1) SQLite ingestion queue & async correlation flush daemon to TheHive 5 |
| **Server Config** | [`06-Resources/Configs/`](../06-Resources/Configs/) | `ossec.conf` | Wazuh Manager | Wazuh Manager integration block with `<level>8</level>` threshold (API keys redacted) |
| **Visual Evidence** | [`TheHive_Alert-ScreenShot/`](TheHive_Alert-ScreenShot/) | 60 PNG screenshots | Repository Asset | Empirical visual proof of TheHive alert creation across all detected stages |
| **Raw Alert Exports** | [`06-Resources/Alerts/`](../06-Resources/Alerts/) | `thehive_alerts.json`<br>`wazuh_alerts.csv` | Repository Asset | Raw export of 46 TheHive 5 alerts and 808 Wazuh alert CSV records |

---

## 2. Architectural Linkage

Detection engineering directly interfaces with the underlying lab infrastructure:

[![Cybersecurity Lab-to-Detection Mapping](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)

---

## 3. 20-Stage Detection Coverage Matrix

This matrix maps each of the 20 attack stages in the campaign to its corresponding MITRE ATT&CK technique, primary data source, detection rule ID, validation status, and empirical alert evidence from [`06-Resources/Alerts/thehive_alerts.json`](../06-Resources/Alerts/thehive_alerts.json) and [`06-Resources/Alerts/wazuh_alerts.csv`](../06-Resources/Alerts/wazuh_alerts.csv).

### Status Legend
- **Detected (16 stages):** Actionable telemetry reached TheHive as an incident alert.
  - *Pivot vs Target Telemetry Note:* In Stages 12, 13, 14, 16, and 19, attack tools executed through the DVWA pivot. The primary alerts reaching TheHive represent the pivot ingress activity (Wazuh Rule 5715 administrative sessions and Suricata Kerberos wire alerts), while target-side DC audit events (e.g. EID 4769, 4662) were generated at the OS level but not escalated independently.
- **Logging Gap (2 stages - Stages 09, 12):** Partial detection achieved via pivot telemetry, but direct target-side inspection represents a documented logging gap.
- **Detection Gap / Offline (2 stages - Stages 04, 11):** Technique executed entirely offline on the attacker GPU; zero victim telemetry exists by definition.

### Coverage Matrix Table

| # | Stage | ATT&CK | Primary Telemetry Source | Detection Mechanism / Rule Description | Rule ID / SID | Validation Status | Gap ID | Empirical Alert Evidence |
|---|---|---|---|---|---|---|---|---|
| **01** | Reconnaissance | `T1595.001` | Network Flow / IDS | ET SCAN NMAP OS Detection Probe / Portscan | `86601` / SID `3400002` | **Detected** | - | `wzb-3a8045a03c` (`1.png`–`1.3.png`) |
| **02** | Web Brute Force | `T1110.001` | Web Server Access Logs | Multiple common web attacks & 4xx burst | Wazuh `31153`, `31151`, `100410` | **Detected** | - | `wzb-81becfcc8d` (`2.png`–`2.7.png`) |
| **03** | SQL Injection | `T1190` | Network Flow & Web Access | ET WEB_SERVER SELECT USER / Web attack returned 200 | Suricata SID `2010963` / Wazuh `31106` | **Detected (Telemetry Verified)** | - | Suricata wire alert (Sheet Row 9110 / CSV Row 9108) (`3.png`) |
| **04** | Hash Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local GPU Hashcat Execution)* | *N/A* | **Detection gap** | [DG-04](#dg-04--dg-11--offline-cryptographic-cracking-stages-04--11) | *Offline Activity (No Telemetry)* |
| **05** | Web Shell Upload | `T1505.003` | Network IDS / Auditd | ET ATTACK_RESPONSE id command output / execve | Wazuh `86601` / SID `2019284` | **Detected** | - | `wzb-e9a1797ac4`, `wzb-61ed72e937` (`4.png`, `4.1.png`) |
| **06** | Reverse Shell | `T1059.004` | Network Connection / IDS | POSSBL SCAN SHELL M-SPLOIT TCP / shell spawn | Wazuh `86601` / SID `3400020` | **Detected** | - | `wzb-ccae331b77`, `wzb-81bb1f83f7` (`5.png`) |
| **07** | Privilege Escalation | `T1548.003` | Linux Auth / Auditd | Sudo command execution & SUID bash invocation | Wazuh `5402` (PAM) / `web_process_creation` | **Detected (Host Alerted)** | - | Logged in CSV (12x Rule `5402`) (`6.png`–`6.3.png`) |
| **08** | SSH Persistence | `T1098.004` | FIM / Linux Auth | Administrative SSH login / authorized_keys | Wazuh `550` (Syscheck) / `5715` | **Detected** | - | `wzb-1208f0ea54` (`7.png`, `7.1.png`) |
| **09** | Internal Discovery | `T1018` | Network IDS (ens37) | Nmap scan / Metasploit tool probes on ens37 | Wazuh `86601` / SID `3400001`, `3400002` | **Logging gap (Network Alerted; DG-09)** | [DG-09](#dg-09--intra-subnet-layer-2-visibility-stage-09) | `wzb-3152e3ed59`, `wzb-f87fab3eda` (`8.png`, `8.1.png`) |
| **10** | Responder Poisoning | `T1557.001` | Linux Auth / Pivot Host | Wazuh bashcmd logging (uid:0 Responder.py execution on pivot) | Wazuh `bashcmd` | **Detected (Pivot Logged)** | - | Sheet Row 9233 / CSV Row 9231 (`9.png`–`9.3.png`) |
| **11** | NTLMv2 Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local Hashcat on Kali)* | *N/A* | **Detection gap** | [DG-11](#dg-04--dg-11--offline-cryptographic-cracking-stages-04--11) | *Offline Activity (No Telemetry)* |
| **12** | BloodHound AD Recon | `T1087.002` | Linux Auth (Pivot Host) | Pivot SSH root logon session launching SharpHound | Wazuh `5715` (Elevated Level 8) | **Logging gap (Pivot Alerted; DG-12)** | [DG-12](#dg-12--active-directory-ldap-query-volume-stage-12) | `wzb-dbf3197ceb`, `wzb-1c8dc0ab5d` (`10.png`, `10.1.png`) |
| **13** | Kerberoasting | `T1558.003` | Network IDS / Pivot Auth | Kerberos TGS-REQ wire alert & Pivot SSH logon | Wazuh `86601` (SID `2019922`) / `5715` | **Detected (Network & Pivot Alerted)** | [Pivot Telemetry](#pivot-telemetry-vs-target-endpoint-analytics) | `wzb-1d2d7fb4b8`, `wzb-c1e2642eb2` (`11.png`, `13.png`) |
| **14** | DCSync | `T1003.006` | Linux Auth (Pivot Host) | Pivot SSH root logon session launching secretsdump | Wazuh `5715` (Elevated Level 8) | **Detected (Pivot Alerted)** | [Pivot Telemetry](#pivot-telemetry-vs-target-endpoint-analytics) | `wzb-4174e3672e` (`12.png`) |
| **15** | Pass-the-Hash | `T1550.002` | Windows Security / WMI | NTLM Logon Type 3 / Impacket WMI fan-out | EID `4624` (24x in CSV) / Wazuh `100613` | **Detected (Host & Pivot Alerted)** | - | `wzb-b7f91cd3ab`–`ccff195e0c` & 24x CSV (`13.png`) |
| **16** | Golden Ticket | `T1558.001` | Linux Auth (Pivot Host) | Pivot SSH root logon session executing ticketer | Wazuh `5715` (Elevated Level 8) | **Detected (Pivot Alerted)** | [Pivot Telemetry](#pivot-telemetry-vs-target-endpoint-analytics) | `wzb-8d45b2d236` (`16.png`, `16.5.png`) |
| **17** | DC Persistence | `T1136.002` | Sysmon / Security / WMI | Impacket wmiexec fan-out / Rogue user added to DA | Wazuh `100613`, `60109`, `4728` | **Detected** | - | `wzb-26b4d06a63`, `wzb-299a007168` (`17.png`) |
| **18** | Data Collection | `T1005` | Sysmon Process Monitoring | Impacket wmiexec fan-out (`whoami`, `net user`) | Wazuh `100613` (Process Fan-out) | **Detected** | - | `wzb-aa66cb916a`, `wzb-ed666653f7` (`18.png`) |
| **19** | Exfiltration | `T1041` | Linux Auth (Pivot Host) | Rapid administrative SSH burst (6 sessions / 1s) | Wazuh `5715` (Elevated Level 8) | **Detected (Pivot Alerted; DG-19)** | [DG-19](#dg-19--encrypted-exfiltration-inspection-stage-19) | `wzb-34f34a857c` (`19.png`) |
| **20** | Impact (Defacement) | `T1491.001` | Sysmon / Security / IDS | Impacket wmiexec fan-out, defacement, SMB NTLM setup | Wazuh `100613` / Suricata SIDs `2067085`–`2067087` | **Detected** | - | `wzb-71ef983ad8`, `wzb-1f43c1540f`, `wzb-7a4a134d1b` (`20.png`) |

---

## 4. Detection Gap Register & Blind Spot Analysis

A core engineering principle of this lab is: **document the blind spot**. A realistic detection engineering portfolio accounts for what cannot be detected on the wire or endpoint and provides actionable engineering remediations.

### Gap Register

| Gap ID | Stage | ATT&CK | Classification | What Was Missed / Limited | Detection Mechanism Observed | Recommended Engineering Fix | Status |
|---|---|---|---|---|---|---|---|
| **DG-04** | 04 (Hash Crack) | `T1110.002` | **Inherent Offline Gap** | Local GPU password cracking generating zero host/network packets | *None* (Hashcat ran locally on Kali) | Enforce strong password complexity; replace MD5 with Argon2/bcrypt | **Documented** (Inherent) |
| **DG-09** | 09 (Internal Disc) | `T1018` | **Architectural Visibility** | Intra-subnet port scans between victim hosts bypass router IP stack | Captured via AF-PACKET promiscuous sniffing on `ens37` (14 alerts in raw CSV) | Enable local Windows Firewall logging (Dropped packets) via Wazuh agent | **Documented** (Network Alerted) |
| **DG-11** | 11 (NTLMv2 Crack) | `T1110.002` | **Inherent Offline Gap** | Offline cracking of intercepted NetNTLMv2 hash on Kali | *None* (Cracking executed offline on attacker GPU) | Disable LLMNR/NBT-NS globally via GPO to prevent Stage 10 capture | **Documented** (Inherent) |
| **DG-12** | 12 (BloodHound) | `T1087.002` | **Logging Gap** | High-volume LDAP enumeration queries not alerted as a specific AD rule | Detected via root SSH logon activity (`Rule 5715`) on pivot host | Enable NTDS diagnostic logging (`15 Field Engineering` = 5) for Event ID 1644 | **Documented** (Pivot Alerted) |
| **DG-19** | 19 (Exfiltration) | `T1041` | **Encrypted Transport Gap** | Exfiltrated archive contents invisible to network IDS due to SSH/SCP encryption | Detected via SSH rapid session anomaly (`Rule 5715` - 6 logons in 0.57s) | Deploy endpoint File Integrity Monitoring (FIM) on staging directories | **Documented** (Pivot Alerted) |

### In-Depth Gap Analysis

#### DG-04 & DG-11 — Offline Cryptographic Cracking (Stages 04 & 11)
- **Root Cause:** When an adversary extracts password hashes (from a database dump in Stage 03 or an LLMNR poison capture in Stage 10), cracking occurs entirely within the adversary's local GPU resources. No packets are transmitted to the victim network, and no processes spawn on target endpoints.
- **SOC Posture:** These stages cannot be detected at execution time. The SOC's defensive focus shifts to **prevention** (preventing the database dump, enforcing GPO restrictions against LLMNR/NetBIOS) and **post-crack detection** (alerting on subsequent use of cracked credentials).

#### DG-09 — Intra-Subnet Layer 2 Visibility (Stage 09)
- **Root Cause:** When the adversary pivots to DVWA (`192.168.56.30`) and scans target hosts (`192.168.56.20`, `192.168.56.10`), packets are switched locally at Layer 2 within VMware VMnet2 and bypass the gateway router's Layer 3 IP forwarding stack.
- **Why Suricata Observed Traffic:** Because Suricata was deployed on the same virtual switch with interface `ens37` operating in AF-PACKET promiscuous mode, it passively received broadcast, multicast, and segment-level frames, generating 14 NIDS alerts in raw telemetry (e.g. SIDs 3400001, 3400002, 3400020).
- **Engineering Resolution & SOC Reality:** Passive promiscuous capture on virtual switches cannot be guaranteed in production hardware-switched environments where unicast traffic is isolated per switch port. The defense-in-depth engineering remediation is **endpoint telemetry**: configuring Windows Defender Firewall dropped-packet logging and Wazuh agent socket/process monitoring on endpoints.

#### DG-12 — Active Directory LDAP Query Volume (Stage 12)
- **Root Cause:** SharpHound and BloodHound execute high-volume LDAP queries to map AD trust relationships. While the inbound SSH session used to stage SharpHound was immediately flagged (`Rule 5715`), the Domain Controller did not generate an explicit LDAP anomaly alert because Event ID 1644 (LDAP Search Query Logging) requires an explicit registry diagnostic setting.
- **Engineering Fix:** To generate Event ID 1644, set registry key `HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics\15 Field Engineering` to `5` (DWORD) and configure Directory Service Access auditing.

#### Pivot Telemetry vs. Target Endpoint Analytics (Stages 13, 14, 16)
- **Root Cause:** In a multi-tier attack simulation where post-exploitation scripts execute through a compromised pivot, detection occurs at multiple layers:
  1. **Pivot Ingress:** Wazuh Rule 5715 (elevated to Level 8) flags every administrative authentication and interactive session on DVWA (`192.168.56.30`), generating alerts `wzb-1d2d7fb4b8`, `wzb-4174e3672e`, and `wzb-8d45b2d236`.
  2. **Target Endpoints:** On the Domain Controller, Kerberos TGS requests (Event 4769) and replication calls (Event 4662) were generated in `Security.evtx`, but were not configured with custom SIEM escalation rules matching $\ge 8$.
- **SOC Insight:** Documenting that these stages reached TheHive via pivot session telemetry rather than target EIDs provides an honest reflection of SIEM routing and correlation realities.

#### DG-19 — Encrypted Exfiltration Inspection (Stage 19)
- **Root Cause:** The attacker used SCP over SSH (`22/TCP`) to exfiltrate collected sensitive files from the DVWA pivot back to Kali. Transport encryption prevented Suricata deep-packet inspection from identifying file names or content keywords.
- **Resolution:** Wazuh's correlation engine flagged the burst of administrative SSH sessions (6 consecutive root authentications in under 1 second), providing behavioral detection even when packet payload inspection was blind.

---

## 5. thecustomhive Alert Pipeline

`thecustomhive` implements an asynchronous, batched, correlation-driven pipeline between Wazuh and TheHive 5.

### Engineering Backstory: Why Shuffle Was Replaced
During initial prototyping, [Shuffle SOAR](https://shuffler.io/) was tested as the alert integration bridge between Wazuh and TheHive via incoming webhooks. However, high-volume attack bursts (such as Nikto web fuzzing in Stage 02 and Nmap port sweeps in Stage 01) exposed severe operational bottlenecks:
1. **Webhook Saturation & Packet Loss:** When hundreds of alert events fired in rapid succession, webhook receivers dropped incoming HTTP requests or hit timeout thresholds.
2. **Synchronous Fork Bottlenecks:** Wazuh's default integration script model forks an external process per alert. Executing synchronous HTTP POST calls inside each forked process created backlog queuing in `wazuh-analysisd`.
3. **Alert Floods in TheHive:** Each raw alert generated an isolated case, burying analysts under hundreds of redundant alerts for a single scan.

To solve this, **`thecustomhive`** was engineered as a resilient two-tier pipeline:
- **Tier 1 (Fast Durable Ingest):** `/var/ossec/integrations/custom-thehive` is a lightweight POSIX wrapper that reads the alert JSON and appends it directly to a local SQLite database in Write-Ahead Logging (WAL) mode. This executes locally in sub-millisecond time with zero HTTP overhead.
- **Tier 2 (Async Correlation & Batched Flush):** A standalone systemd daemon (`thehive-flush.service`) running `custom-thehive.py --flush-daemon` executes an asynchronous 5-second polling loop. It acquires atomic leases on queued records, applies regex tool fingerprinting (Nmap, sqlmap, Nikto, ffuf, Hydra), groups related events by campaign, process tree, or logon burst, and syncs aggregated Markdown alerts to TheHive 5 REST API across private cloud networking. If TheHive VM is temporarily restarted or unreachable, events remain securely buffered on disk.

[![Wazuh to TheHive Security Pipeline](../06-Resources/Diagrams/Wazuh%20to%20TheHive%20Security%20Pipeline.png)](../06-Resources/Diagrams/Wazuh%20to%20TheHive%20Security%20Pipeline.png)

### Two-Tier Pipeline Mechanics
1. **Tier 1 (Fast Durable Ingest - Zero HTTP):** Wazuh forks `/var/ossec/integrations/custom-thehive` per alert ($\ge 8$). Inserts rows into an SQLite WAL queue (`correlation_state.db`) in O(1) time without blocking on network requests.
2. **Tier 2 (Async Correlation & Flush Daemon):** `thehive-flush.service` runs every 5 seconds. Claims batches of pending groups with atomic leases, applies correlation rules, and pushes/patches aggregated markdown alerts to TheHive 5 REST API across private VNet peering.

### Correlation Models
- `tool_campaign`: Reconnaissance and scanning tools aggregated by tool name, source IP, and target agent over a 30-minute idle window.
- `process_chain`: Related parent-child process executions linked by PID/PPID trees.
- `process_fanout`: Sibling commands executed by untracked parent processes (e.g., Impacket wmiexec fan-outs).
- `logon_group`: Repeated authentication events grouped by user and source IP (e.g., SSH bursts).
- `activity_burst`: High-frequency alert floods from a single rule/agent.
- `watchlist_group`: High-risk commands matching sensitive keywords (`/etc/shadow`, `authorized_keys`, `chmod +s`).

### Pipeline Configuration Excerpts
**Wazuh Manager `ossec.conf`:**
```xml
<integration>
  <name>custom-thehive</name>
  <hook_url>http://10.122.0.4:9000/api/v1</hook_url>
  <api_key><REDACTED></api_key>
  <level>8</level>
  <alert_format>json</alert_format>
</integration>
```

**Systemd Unit (`thehive-flush.service`):**
```ini
[Unit]
Description=thecustomhive - Wazuh to TheHive Batched Alert Flush Daemon
After=network.target wazuh-manager.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/ossec/integrations
ExecStart=/var/ossec/framework/python/bin/python3 /var/ossec/integrations/custom-thehive.py --flush-daemon
Restart=always
RestartSec=10

Environment="THEHIVE_URL=http://10.122.0.4:9000/api/v1"
Environment="THEHIVE_API_TOKEN=<REDACTED>"
Environment="THEHIVE_CORRELATION_DB=/var/ossec/logs/correlation_state.db"
Environment="THEHIVE_FLUSH_INTERVAL=5.0"
Environment="THEHIVE_FLUSH_BATCH=50"
Environment="THEHIVE_VERIFY_SSL=0"

ProtectSystem=full
NoNewPrivileges=true
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

## 6. Performance Metrics & Funnel Mechanics

### Accurate Funnel Explanation
The repository provides two empirical alert export datasets:
1. **Raw Alert Export ([`06-Resources/Alerts/Wazuh-Raw-Alerts.csv`](../06-Resources/Alerts/Wazuh-Raw-Alerts.csv)):** Contains **9,567 raw alert records** across all monitored agents (`DVWA`: 8,114, `Suricata`: 1,168, `DomainWin10`: 168, `Win10User`: 117).
2. **Analysis Dataset ([`06-Resources/Alerts/wazuh_alerts.csv`](../06-Resources/Alerts/wazuh_alerts.csv)):** Contains **808 filtered records** capturing elevated multi-level rules.
3. **Actionable TheHive Incidents ([`06-Resources/Alerts/thehive_alerts.json`](../06-Resources/Alerts/thehive_alerts.json)):** Contains **46 actionable correlated incident alerts** in TheHive 5.

1. **Wazuh Integration Gate:** The `<level>8</level>` filter in `ossec.conf` passes only high-severity events to `/var/ossec/integrations/custom-thehive`. Lower-level baseline events (e.g. Rule 5402 at level 3, Rule 60122 at level 5) remain indexed in the Wazuh Dashboard and CSV exports for triage queries but do not trigger integration fork/exec calls.
2. **Correlation Engine Compression:** `custom-thehive.py` aggregates hundreds of repetitive events into unified incident groups (`tool_campaign`, `process_fanout`, `logon_group`, `watchlist_group`), producing **46 actionable incident alerts** in TheHive 5, preventing case management saturation while preserving high-fidelity forensic context.

```text
Total Attack Stages Executed:           20
Verified Detections with Alerts:        16  (80.0%)
Inherent Offline Gaps (No Telemetry):    2  (10.0% - Stages 04, 11)
Target Logging Gaps (Pivot Alerted):     2  (10.0% - Stages 09, 12)
Rule Failures:                           0   (0.0%)
```

### Telemetry Pipeline Throughput
| Pipeline Stage | Telemetry Volume | Description |
|---|---|---|
| Complete Raw Wazuh Alerts (`Wazuh-Raw-Alerts.csv`) | **9,567 records** | All alert events generated across 4 agents (`DVWA`: 8,114, `Suricata`: 1,168, `DomainWin10`: 168, `Win10User`: 117) |
| Curated Analysis Export (`wazuh_alerts.csv`) | **808 records** | Filtered dataset preserving multi-level alert activity across the attack chain |
| Correlated Incident Alerts Created in TheHive 5 | **46 actionable alerts** | Distinct incident alerts delivered to analyst triage queues after correlation and batching |
