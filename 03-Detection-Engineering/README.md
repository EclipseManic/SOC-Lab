# 03 — Detection Engineering

This section details the detection engineering architecture, custom rule definitions, log parsers, coverage validation, gap analysis, and SOAR pipeline automation. It answers the fundamental question: **what can the lab detect, where are the operational boundaries, and how do alerts flow to analysts?**

---

## Table of Contents

1. [Engineering Structure & Telemetry Catalog](#1-engineering-structure--telemetry-catalog)
2. [Architectural Linkage](#2-architectural-linkage)
3. [20-Stage Detection Coverage Matrix](#3-20-stage-detection-coverage-matrix)
4. [Detection Gap Register & Blind Spot Analysis](#4-detection-gap-register--blind-spot-analysis)
5. [thecustomhive Alert Pipeline](#5-thecustomhive-alert-pipeline)
6. [Performance Metrics Summary](#6-performance-metrics-summary)

---

## 1. Engineering Structure & Telemetry Catalog

### Deployed Rulesets, Decoders & Baselines

| Component | Path | Host / Location | Purpose |
|---|---|---|---|
| **Wazuh Engine** | [`Wazuh/README.md`](Wazuh/README.md) | Wazuh Manager | Complete rules catalog, decoders, false-positive tuning, and suppressions |
| **Wazuh Rules** | [`Wazuh/local_rules.xml`](Wazuh/local_rules.xml) | `/var/ossec/etc/rules/` | Custom detection rules (LOLBins, wmiexec, privilege escalation, suppressions) |
| **Wazuh Decoders** | [`Wazuh/local_decoder.xml`](Wazuh/local_decoder.xml) | `/var/ossec/etc/decoders/` | Custom regex parser extracting `uid, user, pwd, command` from `/var/log/bashcmd.log` |
| **Suricata NIDS** | [`Suricata/README.md`](Suricata/README.md) | Suricata Gateway | Inline network IDS signatures, AF-PACKET capture, and threshold configuration |
| **Suricata Rules** | [`Suricata/custom.rules`](Suricata/custom.rules) | `/etc/suricata/rules/` | Custom signatures (Nmap probes, SQLi, webshells, reverse shells, GoldenPac) |
| **Suricata Tuning** | [`Suricata/threshold.config`](Suricata/threshold.config) | `/etc/suricata/` | Rate-limiting rules for Nmap OS probes and multi-port scans |
| **Sysmon Baseline** | [`Sysmon/sysmonconfig.xml`](Sysmon/sysmonconfig.xml) | Windows 10 & DC (`C:\Windows\`) | Modular telemetry configuration for process creation, named pipes, and registry |
| **Linux Auditd** | [`Auditd/audit.rules`](Auditd/audit.rules) | DVWA (`/etc/audit/rules.d/`) | Syscall monitoring for SUID bash, execve execution, and identity file access |
| **Visual Evidence** | [`TheHive_Alert-ScreenShot/`](TheHive_Alert-ScreenShot/) | Repo Asset | Authentic visual alert captures across all detected campaign stages |
| **Empirical Alerts** | [`06-Resources/Alerts/`](../06-Resources/Alerts/) | Repo Asset | Raw JSON export of 46 TheHive 5 alerts and 808 Wazuh alert CSV records |

> [!NOTE]
> Supporting automation scripts ([`custom-thehive`](../06-Resources/Scripts/custom-thehive), [`custom-thehive.py`](../06-Resources/Scripts/custom-thehive.py)), background service units ([`thehive-flush.service`](../06-Resources/Scripts/thehive-flush.service)), and server configs ([`ossec.conf`](../06-Resources/Configs/ossec.conf)) are maintained under [06-Resources/](../06-Resources/).

---

## 2. Architectural Linkage

Detection engineering directly interfaces with the underlying lab infrastructure:

```text
Local Infrastructure (01-Lab-Setup)         Detection Engineering (03-Detection-Engineering)
===================================         ================================================
Suricata Gateway (Dual-NIC Router)   ----->  Custom Suricata Signatures (Suricata/custom.rules)
                                             Rate-limiting & Suppression (Suricata/threshold.config)
                                             Suricata JSON Decoder (Wazuh/local_decoder.xml)

DVWA Target (/var/log/bashcmd.log)   ----->  Custom bashcmd Decoder (Wazuh/local_decoder.xml)
                                             Auditd Syscall Rules (Auditd/audit.rules)

Windows 10 / DC (Sysmon & Auditpol)  ----->  Sysmon Modular Configuration (Sysmon/sysmonconfig.xml)
                                             Wazuh Rules: wmiexec, Sysmon, Registry (Wazuh/local_rules.xml)

Private Wazuh SIEM (Cloud VM 2)      ----->  Wazuh Engine & Local Rules (Wazuh/local_rules.xml)
                                             Integration Hook & Daemon (06-Resources/Scripts/)

TheHive Case Management (Cloud VM 1) ----->  TheHive 5 REST Ingestion & Cases (TheHive 5 API)
```

---

## 3. 20-Stage Detection Coverage Matrix

This matrix maps each of the 20 attack stages in the campaign to its corresponding MITRE ATT&CK technique, primary data source, detection rule ID, validation status, and empirical alert evidence from [`06-Resources/Alerts/thehive_alerts.json`](../06-Resources/Alerts/thehive_alerts.json).

### Status Legend
- **Detected (16 stages):** Telemetry collected, rule matched, and actionable alert reached TheHive.
- **Inherent Offline Gap (2 stages - Stages 04, 11):** Technique occurred offline on attacker GPU; no victim telemetry exists by definition.
- **Architectural / Logging Gap (2 stages - Stages 09, 12):** Telemetry alerted via pivot host; intra-subnet target-side LDAP/RPC activity documented.

### Coverage Matrix Table

| # | Stage | ATT&CK | Required Data Source | Rule / Analytic Name | Rule ID / SID | Status | Gap ID | TheHive Alert Evidence |
|---|---|---|---|---|---|---|---|---|
| **01** | Reconnaissance | `T1595.001` | Network Flow / IDS | ET SCAN NMAP OS Detection Probe / Portscan | `86601` / SID `3400002` | **Detected** | - | `wzb-3a8045a03c` (`1.png`–`1.3.png`) |
| **02** | Web Brute Force | `T1110.001` | Web Server Access Logs | Multiple common web attacks from same source | Wazuh `31153`, `31151` | **Detected** | - | `wzb-81becfcc8d` (`2.png`–`2.7.png`) |
| **03** | SQL Injection | `T1190` | Web Logs / Network IDS | ET WEB_SERVER SELECT USER SQL Injection | Wazuh `100201` / SID `2010937` | **Detected** | - | `wzb-10160d36c2` (`4.png`, `4.1.png`) |
| **04** | Hash Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local GPU Hashcat Execution)* | *N/A* | **Not Detected** | [DG-04](#dg-04--dg-11--offline-cryptographic-cracking-stages-04--11) | *Offline Activity (No Telemetry)* |
| **05** | Web Shell Upload | `T1505.003` | Network IDS / Web POST | ET WEB_SERVER PHP System Command in POST | Wazuh `100600` / SID `2014726` | **Detected** | - | `wzb-e9a1797ac4`, `wzb-61ed72e937` (`6.1.png`, `6.2.png`) |
| **06** | Reverse Shell | `T1059.004` | Network Connection / IDS | ET POLICY Outbound Reverse Shell Connection | Wazuh `86601` / SID `2002752` | **Detected** | - | `wzb-f87fab3eda` (`5.png`) |
| **07** | Privilege Escalation | `T1548.003` | Linux Auth / PAM | Sudo command execution by service user (`www-data`) | Wazuh `5402` (PAM) | **Detected** | - | `wzb-ccae331b77` (`6.png`, `6.3.png`) |
| **08** | SSH Persistence | `T1098.004` | FIM / Linux Auth | File added to `/root/.ssh/authorized_keys` | Wazuh `550` (Syscheck FIM) | **Detected** | - | `wzb-1c8dc0ab5d` (`7.png`, `7.1.png`) |
| **09** | Internal Discovery | `T1018` | Network IDS | Potential Internal Network Port Scan | Wazuh `86601` / SID `2000545` | **Detected** | [DG-09](#dg-09--intra-subnet-layer-2-visibility-stage-09) | `wzb-3152e3ed59` (`8.png`, `8.1.png`) |
| **10** | Responder Poisoning | `T1557.001` | Network IDS | ET SCAN Potential LLMNR/NBT-NS Poisoning Response | Wazuh `86601` / SID `2013028` | **Detected** | - | `wzb-7a4a134d1b` (`9.png`–`9.3.png`) |
| **11** | NTLMv2 Cracking | `T1110.002` | *Offline (Attacker)* | *None (Local Hashcat on Kali)* | *N/A* | **Not Detected** | [DG-11](#dg-04--dg-11--offline-cryptographic-cracking-stages-04--11) | *Offline Activity (No Telemetry)* |
| **12** | BloodHound AD Recon | `T1087.002` | Linux Auth / Pivot Audit | SSH authentication success (Root pivot session) | Wazuh `5715` | **Detected** (Pivot) | [DG-12](#dg-12--active-directory-ldap-query-volume-stage-12) | `wzb-dbf3197ceb` (`10.png`) |
| **13** | Kerberoasting | `T1558.003` | Kerberos / Windows Security | Kerberos TGS request anomaly (RC4 encryption) | Windows EID `4769` / Wazuh `60107` | **Detected** | - | `wzb-1d2d7fb4b8` (`13.png`) |
| **14** | DCSync | `T1003.006` | Directory Service / DRSUAPI | DS Access / Replication rights requested | Windows EID `4662` / Wazuh `60144` | **Detected** | - | `wzb-4174e3672e` (`14.png`) |
| **15** | Pass-the-Hash | `T1550.002` | Network IDS / SMB Auth | ET EXPLOIT Possible GoldenPac Priv Esc in-use | Wazuh `86601` / SID `2015862` | **Detected** | - | `wzb-c1e2642eb2` (`15.png`, `15.5.png`) |
| **16** | Golden Ticket | `T1558.001` | Kerberos / DC Security | TGS request without matching AS-REQ / RC4 | Windows EID `4769` / Wazuh `5715` | **Detected** | - | `wzb-8d45b2d236` (`16.png`, `16.5.png`) |
| **17** | DC Persistence | `T1136.002` | Sysmon / Process / AD Auth | Impacket `wmiexec` execution / User added to DA | Wazuh `100613`, `60109` | **Detected** | - | `wzb-26b4d06a63`, `wzb-299a007168` (`17.png`–`17.6.png`) |
| **18** | Data Collection | `T1005` | Sysmon Process Monitoring | Impacket `wmiexec` (`net user`, `whoami /all`, `type`) | Wazuh `100613` (Fan-out) | **Detected** | - | `wzb-aa66cb916a`, `wzb-ed666653f7` (`18.png`–`18.2.png`) |
| **19** | Exfiltration | `T1041` | Linux Auth / Secure Transport | Administrative SSH burst (Data staging & SCP) | Wazuh `5715` (6 sessions / 1s) | **Detected** (Pivot) | [DG-19](#dg-19--encrypted-exfiltration-inspection-stage-19) | `wzb-34f34a857c` (`19.png`) |
| **20** | Impact (Defacement) | `T1491.001` | Sysmon / Network IDS / Auth | Impacket `wmiexec` registry change / Wallpaper drop | Wazuh `100613`, `100100`, `86601` | **Detected** | - | `wzb-71ef983ad8`, `wzb-1f43c1540f` (`20.png`–`22.4.png`) |

---

## 4. Detection Gap Register & Blind Spot Analysis

A core engineering principle of this lab is: **document the blind spot**. A realistic detection engineering portfolio accounts for what cannot be detected and provides engineering mitigations.

### Gap Register

| Gap ID | Stage | ATT&CK | Classification | What Was Missed / Limited | Detection Mechanism Observed | Recommended Engineering Fix | Status |
|---|---|---|---|---|---|---|---|
| **DG-04** | 04 (Hash Crack) | `T1110.002` | **Inherent Offline Gap** | Local GPU password cracking generating zero host/network packets | *None* (Hashcat ran locally on Kali) | Enforce strong password complexity; replace MD5 with Argon2/bcrypt | **Documented** (Inherent) |
| **DG-09** | 09 (Internal Disc) | `T1018` | **Architectural Visibility** | Intra-subnet port scans between victim hosts do not cross Suricata | Suricata detected gateway probes; host telemetry caught process execution | Enable local Windows Firewall logging (Dropped packets) via Wazuh agent | **Closed** (Host Covered) |
| **DG-11** | 11 (NTLMv2 Crack) | `T1110.002` | **Inherent Offline Gap** | Offline cracking of intercepted NetNTLMv2 hash on Kali | *None* (Cracking executed offline on attacker GPU) | Disable LLMNR/NBT-NS globally via GPO to prevent Stage 10 capture | **Documented** (Inherent) |
| **DG-12** | 12 (BloodHound) | `T1087.002` | **Logging Gap** | High-volume LDAP enumeration queries not alerted as a specific AD rule | Detected via root SSH logon activity (`Rule 5715`) on pivot host | Enable Windows Event ID 1644 (Active Directory LDAP Search Query Logging) | **Remediated** (Pivot Alerted) |
| **DG-19** | 19 (Exfiltration) | `T1041` | **Encrypted Transport Gap** | Exfiltrated archive contents invisible to network IDS due to SSH/SCP encryption | Detected via SSH rapid session anomaly (`Rule 5715` - 6 logons in 1s) | Deploy endpoint File Integrity Monitoring (FIM) on staging directories | **Remediated** (Pivot Alerted) |

### In-Depth Gap Analysis

#### DG-04 & DG-11 — Offline Cryptographic Cracking (Stages 04 & 11)
- **Root Cause:** When an adversary extracts password hashes (from a database dump in Stage 03 or an LLMNR poison capture in Stage 10), cracking occurs entirely within the adversary's local GPU resources. No packets are transmitted to the victim network, and no processes spawn on target endpoints.
- **SOC Posture:** These stages cannot be detected at execution time. The SOC's defensive focus shifts to **prevention** (preventing the database dump, enforcing GPO restrictions against LLMNR/NetBIOS) and **post-crack detection** (alerting on subsequent use of cracked credentials).

#### DG-09 — Intra-Subnet Layer 2 Visibility (Stage 09)
- **Root Cause:** Suricata is deployed as an inline gateway router between `192.168.232.0/24` and `192.168.56.0/24`. When Kali attacks DVWA, all traffic crosses the gateway and is fully inspected. However, once the attacker pivots to DVWA (`192.168.56.30`) and scans Windows 10 (`192.168.56.20`), packets are switched locally at Layer 2 within VMware VMnet2 and never traverse the gateway router interfaces (`ens33`/`ens37`).
- **Resolution:** Addressed via **endpoint telemetry**: Wazuh agents running on DVWA and Windows 10 monitor process creation, network sockets, and command-line arguments directly.

#### DG-12 — Active Directory LDAP Query Volume (Stage 12)
- **Root Cause:** SharpHound and BloodHound execute high-volume LDAP queries to map AD trust relationships. While the inbound SSH session used to stage SharpHound was immediately flagged (`Rule 5715`), the Domain Controller did not generate an explicit LDAP anomaly alert because Event ID 1644 (LDAP Query Logging) was not enabled by default.
- **Resolution:** Configured Advanced Audit Policy on `PC-DC` for Directory Service Access and recommended enabling NTDS diagnostic logging for LDAP search filters.

#### DG-19 — Encrypted Exfiltration Inspection (Stage 19)
- **Root Cause:** The attacker used SCP over SSH (`22/TCP`) to exfiltrate collected sensitive files from the DVWA pivot back to Kali. Transport encryption prevented Suricata deep-packet inspection from identifying file names or content keywords.
- **Resolution:** Wazuh's correlation engine flagged the burst of administrative SSH sessions (6 consecutive root authentications in under 1 second), providing behavioral detection even when packet payload inspection was blind.

---

## 5. thecustomhive Alert Pipeline

`thecustomhive` implements an asynchronous, batched, correlation-driven pipeline between Wazuh and TheHive 5.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             WAZUH MANAGER HOST                                   │
│                                                                                  │
│   Incoming Telemetry (Agents & Suricata)                                         │
│          │                                                                       │
│          ▼                                                                       │
│   Wazuh Analysis Engine (Ruleset Level >= 8)                                     │
│          │                                                                       │
│          ▼                                                                       │
│   /var/ossec/integrations/custom-thehive <alert_file>                            │
│          │                                                                       │
│          ▼  (Tier 1: O(1) Local Ingestion - ZERO HTTP)                          │
│   SQLite WAL Queue (/var/ossec/logs/correlation_state.db)                        │
│          │                                                                       │
│          │  (Tier 2: Async Correlated Sync - 5s Cadence)                         │
│          ▼                                                                       │
│   thehive-flush.service (custom-thehive.py --flush-daemon)                       │
│          │                                                                       │
│          │  • Tool Fingerprint Matching (Nmap, sqlmap, Nikto, ffuf, Hydra)       │
│          │  • Correlation (Process Chains, Fan-outs, Logon Groups, Bursts)       │
│          │  • Deduplication & Aggregate Markdown Rendering                       │
│          │                                                                       │
│          ▼  (HTTP POST/PATCH - api/v1/alert)                                     │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ TheHive 5 Host (http://10.122.0.4:9000/api/v1)                               │ │
│ │ • Cases / Alerts Triage Queue                                                │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

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
```

---

## 6. Performance Metrics Summary

Across the 20 attack stages executed in the lab:

```text
Total Attack Stages Executed:           20
Verified Detections with Alerts:        16  (80.0%)
Inherent Offline Gaps (No Telemetry):    2  (10.0% - Stages 04, 11)
Partial / Protocol Logging Gaps:         2  (10.0% - Stages 09, 12)
Rule Failures:                           0   (0.0%)
```

### Telemetry Pipeline Throughput
| Metric | Measured Value |
|---|---|
| Total Raw Events Ingested | ~145,000 |
| Wazuh Rule Matches | ~4,200 |
| Level $\ge 8$ Ingested to SQLite | 808 records |
| Aggregated Alerts Created in TheHive 5 | 46 actionable alerts |
| Alert Reduction Ratio | ~94.3% reduction |
