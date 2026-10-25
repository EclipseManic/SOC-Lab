# 03 — Detection Engineering: Architecture, Rules & Alert Pipeline

> **The Core Mission:**  
> Transform high-volume, multi-source raw machine telemetry into clean, actionable, high-fidelity security incidents—without overwhelming analysts or dropping alerts under fire.

---

## At a Glance: Detection Performance

Before diving into configurations and rules, here is the empirical reality of the detection engineering stack across the entire 20-stage adversary campaign:

| Metric | Result | Plain-English Summary |
|---|:---:|---|
| **Attack Stages Simulated** | **20** | Full kill chain from external port scanning to domain-wide ransomware and defacement |
| **Stages Caught (Detection Rate)** | **16 (80%)** | Real-time, actionable alerts raised in TheHive 5 across network, endpoint, and SIEM |
| **Documented Blind Spots** | **4 (20%)** | **2 Offline:** Local GPU password cracking generated zero victim packets by definition.<br>**2 Logging Gaps:** Internal Layer 2 discovery and BloodHound LDAP scans lacked target-side rule alerts. |
| **Raw Telemetry Captured** | **9,567 records** | Complete raw event stream across all 4 monitored agents (`Wazuh-Raw-Alerts.csv`) |
| **Filtered Multi-Level Events** | **808 records** | Filtered incident analysis set preserving elevated multi-level activity (`wazuh_alerts.csv`) |
| **Actionable TheHive Cases** | **46 alerts** | Clustered, deduplicated incident cards delivered to analyst triage queues (`thehive_alerts.json`) |
| **Tuned Noise Suppressions** | **87 rules** | False-positive rules silencing background OS chatter, guest tools, and machine loops |

---

## 1. How Telemetry Moves: The 4 Interlocking Detection Layers

A resilient detection architecture never relies on a single tool. In this lab, four distinct detection technologies operate as interlocking gears. If an adversary evades network inspection with encryption, endpoint kernel tracing catches them; if an adversary bypasses endpoint hooks, wire-level NIDS captures their lateral movement.

[![Cybersecurity Lab-to-Detection Mapping](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)
*Figure 1: Full-stack detection mapping connecting physical & virtual machines to their defensive inspection layers ([view full asset](../06-Resources/Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png)).*

```
   [ Layer 1: The Wire ]           [ Layer 2: Linux Kernel ]        [ Layer 3: Windows Endpoints ]
    Suricata NIDS (Gateway)         Linux Auditd (DVWA)              Sysmon & Security EVTX (DC/Win10)
    • Inbound TCP port sweeps       • execve calls on uid=33         • Process command lines (EID 1)
    • SQLi UNION payloads           • Reverse shell FIFO pipes       • WmiPrvSE child fan-outs
    • Kerberos TGS wire frames      • SUID privilege escalation      • Registry autostarts & desktop keys
            │                                  │                                  │
            └──────────────────────────────────┼──────────────────────────────────┘
                                               ▼
                             [ Layer 4: Central SIEM & Correlation ]
                              Wazuh Manager 4.14.8 (Private Cloud)
                              • local_decoder.xml & local_rules.xml
                              • 87 Tuned Noise Suppressions
                              • Level ≥ 8 Ingestion Gate
                                               ▼
                              [ Tier 1: custom-thehive Wrapper ]
                               O(1) Non-blocking SQLite WAL Queue
                                               ▼
                             [ Tier 2: thehive-flush.service ]
                               5s Loop: Tool Fingerprinting & Deduplication
                                               ▼
                             [ TheHive 5 Case Management (46 Incidents) ]
```

### The 4 Detection Layers Explained:

1. **Layer 1: The Wire (Suricata NIDS on Security Gateway):**  
   Positioned on the dual-homed perimeter gateway (`192.168.232.162` / `192.168.56.150`). Using high-speed AF-PACKET sniffing, Suricata inspects raw network frames across both the external attack interface (`ens33`) and the internal victim interface (`ens37`). It identifies inbound Nmap port sweeps (Stage 01), HTTP web attacks (Stages 02 & 03), and unencrypted Kerberos ticket requests (Stage 13).
2. **Layer 2: The Linux Kernel (Auditd on DVWA Web Server):**  
   Sitting inside the Linux target (`192.168.56.30`), Auditd hooks directly into the Linux netlink kernel subsystem. Its primary rule (`-S execve -F uid=33 -k web_process_creation`) watches every single executable spawned by the Apache web service. When an attacker uploads a web shell (Stage 05) or triggers an interactive Python reverse shell (Stage 06), Auditd captures the process name, arguments, and working directory even if the traffic was encrypted.
3. **Layer 3: Windows Endpoints (Sysmon & Security EVTX on DC & Win10):**  
   Deployed across the Active Directory Domain Controller (`PC-DC`, `.10`) and workstation (`WIN10`, `.20`). Standard Windows logs record high-level authentication, while Microsoft Sysmon captures deep operational context: full process command lines (EID 1), remote WMI child process fan-outs (`WmiPrvSE.exe`), network sockets (EID 3), and registry wallpaper tampering (EID 13).
4. **Layer 4: Central Correlation & Decoders (Wazuh SIEM Manager):**  
   Hosted on the private cloud network (`10.122.1.4`). Wazuh acts as the central brain. It receives JSON logs and eventchannels from all four endpoints, normalizes unstructured text using [`local_decoder.xml`](Wazuh/local_decoder.xml), evaluates custom detection logic in [`local_rules.xml`](Wazuh/local_rules.xml), executes instant CDB lookups, and filters out background operating system noise.

---

## 2. Taming the Noise: The 87 Suppressions & CDB Architecture

In enterprise security, **unfiltered SIEM deployments always fail**. When an engine generates 10,000 alerts a day, analysts suffer from alert fatigue and real adversary activity gets lost in the crowd.

During our initial campaign runs, routine operating system tasks generated thousands of false alarms. We engineered **87 custom suppression rules** and fast Constant Database (CDB) lookup tables to eliminate false positives at the root.

### The 4 Biggest Noise Sources We Silenced:

1. **The Syscollector Inventory Loop (The Problem & The Fix):**
   - *The Problem:* Wazuh's built-in `syscollector` daemon runs hourly hardware, network, and package scans on Linux agents. To do this, it executes standard system utilities (`dpkg-query`, `rpm`, `uname`, `ps`, `netstat`, `ip`, `which`). Because Linux Auditd was configured to audit all `execve` calls, these routine inventory scans triggered thousands of Wazuh Rule `80792` ("Auditd: Command executed") alerts every hour.
   - *How We Fixed It:* We created a dedicated CDB list at [`06-Resources/Configs/lists/wazuh-internal-bins`](../06-Resources/Configs/lists/wazuh-internal-bins) containing known agent binaries. In `local_rules.xml`, custom Rule `100280` performs an instantaneous $O(1)$ lookup against this compiled binary table:
     ```xml
     <group name="audit,">
       <rule id="100280" level="0">
         <if_sid>80792</if_sid>
         <list field="audit.exe" lookup="match_key">etc/lists/wazuh-internal-bins</list>
         <description>Suppress Wazuh's own internal inventory scan noise</description>
       </rule>
     </group>
     ```
   - *The Payoff:* Over 6,000 recurring false-positive audit logs per day were silenced without blinding the engine to malicious web-shell commands.

2. **Windows Machine Account Logon Chatter (`$` Accounts):**
   - *The Problem:* Windows domain controllers constantly process machine authentication events (e.g., `PC-DC$`, `WIN10$`) for Kerberos renewals, RPC registrations, and group policy updates, generating hundreds of Event ID 4672 ("Special privileges assigned to new logon") events.
   - *How We Fixed It:* Rule `100603` filters out computer accounts using regex negation (`negate="yes">^SYSTEM$|^LOCAL SERVICE$|^NETWORK SERVICE$|\$$</field>`), ensuring alerts fire **only when a human user account** is granted high-risk attack privileges (`SeDebugPrivilege`, `SeImpersonatePrivilege`, `SeTakeOwnershipPrivilege`).

3. **VMware Hypervisor Artifacts:**
   - *The Problem:* VMware Tools daemon (`vmtoolsd.exe`) continually polls guest memory, disk stats, and time synchronization, generating repetitive process creation and pipe events.
   - *How We Fixed It:* Specific parent-child suppression rules in `local_rules.xml` ignore `vmtoolsd.exe` service queries while continuing to audit interactive `cmd.exe` and `powershell.exe` execution.

4. **Routine PAM Session Open/Close Noise:**
   - *The Problem:* Linux cron jobs and service checks open and close PAM authentication sessions every few minutes (Rule 5501 / 5502).
   - *How We Fixed It:* Overrode Rule `100219` and `100105` at `level="0"` to silence routine background session turnover while keeping SSH interactive logins (Rule 5715) elevated at Level 8.

---

## 3. The Alert Bridge: `thecustomhive` & Why Shuffle SOAR Was Replaced

### The Backstory: Why Shuffle Webhooks Failed Under Pressure
During early development, we tested [Shuffle SOAR](https://shuffler.io/) to bridge alerts between Wazuh and TheHive via incoming HTTP webhooks. However, when we ran aggressive red-team attack stages, Shuffle completely broke down:

1. **Webhook Dropped Packets:** When Nikto web fuzzing (Stage 02) or Nmap port sweeps (Stage 01) generated 400 alerts in 10 seconds, Shuffle's HTTP listeners hit connection limits, dropping alert packets silently.
2. **Analysis Engine Starvation:** Wazuh's default integration model forks a synchronous operating system process per alert. Having hundreds of forked scripts waiting on external HTTP network calls caused the Wazuh analysis engine (`wazuh-analysisd`) to queue up and lag behind real-time events.
3. **Alert Floods in TheHive:** Every single raw alert created its own independent ticket, leaving analysts with 300 separate cases for one single port scan.

### The Engineering Solution: A Two-Tier Pipeline
To permanently solve this, we engineered **`thecustomhive`**: a custom, resilient, two-tier alert pipeline designed for zero data loss:

[![Wazuh-TheHive Neon Alert Pipeline](../06-Resources/Diagrams/Wazuh–TheHive%20Neon%20Alert%20Pipeline.png)](../06-Resources/Diagrams/Wazuh–TheHive%20Neon%20Alert%20Pipeline.png)
*Figure 2: Two-tier asynchronous alert correlation pipeline from Wazuh Manager Level ≥ 8 trigger into TheHive 5 case management.*

```
Wazuh Rules Engine Evaluation
  │
  ├── Level < 8: Stored in Wazuh Indexer (Search & Dashboard Analytics)
  │
  └── Alert Level ≥ 8 Triggered
        │
        ▼
  [ Tier 1: Fast Durable Ingest (Zero HTTP) ]
  • File: /var/ossec/integrations/custom-thehive
  • Action: Reads alert JSON file and inserts row into SQLite WAL database
  • Latency: Sub-millisecond execution (O(1) non-blocking local write)
  • Network Overhead: ZERO HTTP calls (Engine never starves)
        │
        ▼
  [ SQLite WAL Database: /var/ossec/logs/correlation_state.db ]
  • Persistent local buffer (safeguards alerts if TheHive restarts)
        │
        ▼
  [ Tier 2: Asynchronous Correlation Daemon ]
  • File: thehive-flush.service (custom-thehive.py --flush-daemon)
  • Cycle: 5-second polling loop
  • Logic:
      1. Tool Fingerprinting: Regex catalog identifying Nmap, Nikto, Hydra, sqlmap, ffuf
      2. Campaign Grouping: Merges rapid tool bursts into a single case
      3. Process Fan-Out: Links sibling commands spawned by wmiexec
      4. Alert Deduplication: Eliminates redundant repeated events
        │
        ▼
  [ Transport: HTTP POST over Private Cloud VNet Peering ]
  • Destination: http://10.122.0.4:9000/api/v1 (Private VNet transit)
        │
        ▼
  [ TheHive 5 Analyst Triage Queue ]
  • 46 High-Signal, Correlated Cases with MITRE ATT&CK tags and full evidence
```

---

## 4. 20-Stage Detection Coverage Matrix

This matrix maps every stage of the 20-stage attack campaign to its corresponding MITRE ATT&CK technique, data source, detection rule ID, validation status, and empirical alert evidence from [`thehive_alerts.json`](../06-Resources/Alerts/thehive_alerts.json) and [`wazuh_alerts.csv`](../06-Resources/Alerts/wazuh_alerts.csv).

### Status Legend
- **Detected (16 stages):** Actionable incident alert generated and delivered to TheHive 5.
- **Logging Gap (2 stages - Stages 09, 12):** Telemetry observed on the wire or pivot host, but target-side host telemetry lacked automated alerting.
- **Detection Gap / Offline (2 stages - Stages 04, 11):** Attack ran offline on the attacker's local GPU; zero victim packets generated by definition.

### Master Coverage Matrix

| # | Stage | MITRE ATT&CK | Primary Telemetry | Rule ID / SID | Detection Status | Empirical Alert Evidence |
|:---:|---|:---:|---|---|:---:|---|
| **01** | [Reconnaissance](../02-Attack-Simulation/Stages/stage-01-recon.md) | `T1595.001` | Suricata NIDS | SID `3400002` / `86601` | **Detected** | `wzb-3a8045a03c` (`1.png`–`1.3.png`) |
| **02** | [Brute Force](../02-Attack-Simulation/Stages/stage-02-bruteforce.md) | `T1110.001` | Apache Web Access | Wazuh `31153`, `100410` | **Detected** | `wzb-81becfcc8d` (`2.png`–`2.7.png`) |
| **03** | [SQL Injection](../02-Attack-Simulation/Stages/stage-03-sqli.md) | `T1190` | Suricata & Web Logs | SID `2010963` / Wazuh `31106` | **Detected** | Suricata wire alert (CSV Row 9108, `3.png`) |
| **04** | [Hash Cracking](../02-Attack-Simulation/Stages/stage-04-hash-crack.md) | `T1110.002` | *Offline (Attacker)* | *None (Local GPU Hashcat)* | **Detection Gap** | *Offline activity (Zero victim telemetry)* |
| **05** | [Web Shell Upload](../02-Attack-Simulation/Stages/stage-05-webshell.md) | `T1505.003` | Linux Auditd / NIDS | SID `2019284` / Auditd `execve` | **Detected** | `wzb-e9a1797ac4`, `wzb-61ed72e937` (`4.png`) |
| **06** | [Reverse Shell](../02-Attack-Simulation/Stages/stage-06-reverse-shell.md) | `T1059.004` | Suricata & Auditd | SID `3400020` / Wazuh `100199` | **Detected** | `wzb-ccae331b77`, `wzb-81bb1f83f7` (`5.png`) |
| **07** | [Privilege Escalation](../02-Attack-Simulation/Stages/stage-07-privesc.md) | `T1548.003` | Linux PAM / Auditd | Wazuh `5402` / SUID bash | **Detected** | 12x PAM alerts in CSV (`6.png`–`6.3.png`) |
| **08** | [SSH Persistence](../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | `T1098.004` | Wazuh FIM / Auth | Wazuh `550` (FIM) / `5715` | **Detected** | `wzb-1208f0ea54` (`7.png`, `7.1.png`) |
| **09** | [Internal Discovery](../02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | `T1018` | Suricata NIDS (`ens37`) | SID `3400001`, `3400002` | **Logging Gap** | `wzb-3152e3ed59`, `wzb-f87fab3eda` (`8.png`) |
| **10** | [Responder Poisoning](../02-Attack-Simulation/Stages/stage-10-responder.md) | `T1557.001` | Linux Pivot Host | Wazuh `bashcmd` (uid:0) | **Detected** | CSV Row 9231 (`9.png`–`9.3.png`) |
| **11** | [NTLMv2 Cracking](../02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | `T1110.002` | *Offline (Attacker)* | *None (Local GPU Hashcat)* | **Detection Gap** | *Offline activity (Zero victim telemetry)* |
| **12** | [BloodHound AD Recon](../02-Attack-Simulation/Stages/stage-12-bloodhound.md) | `T1087.002` | Pivot Host Auth | Wazuh `5715` (Elevated Level 8) | **Logging Gap** | `wzb-dbf3197ceb` (`10.png`, `10.1.png`) |
| **13** | [Kerberoasting](../02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | `T1558.003` | Suricata & Pivot Auth | SID `2019922` / Wazuh `5715` | **Detected** | `wzb-1d2d7fb4b8`, `wzb-c1e2642eb2` (`11.png`) |
| **14** | [DCSync](../02-Attack-Simulation/Stages/stage-14-dcsync.md) | `T1003.006` | Pivot Host Auth | Wazuh `5715` (Elevated Level 8) | **Detected** | `wzb-4174e3672e` (`12.png`) |
| **15** | [Pass-the-Hash](../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | `T1550.002` | Windows Security / WMI | EID `4624` (24x in CSV) / `100613` | **Detected** | `wzb-b7f91cd3ab` (`13.png`) |
| **16** | [Golden Ticket](../02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | `T1558.001` | Pivot Host Auth | Wazuh `5715` (Elevated Level 8) | **Detected** | `wzb-8d45b2d236` (`16.png`, `16.5.png`) |
| **17** | [DC Persistence](../02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | `T1136.002` | Sysmon & Security | Wazuh `100613`, `60109`, `4728` | **Detected** | `wzb-26b4d06a63` (7 Alerts in TheHive) |
| **18** | [Data Collection](../02-Attack-Simulation/Stages/stage-18-collection.md) | `T1005` | Sysmon Process Trees | Wazuh `100613` (`whoami`, `net user`) | **Detected** | `wzb-aa66cb916a` (`18.png`) |
| **19** | [Exfiltration](../02-Attack-Simulation/Stages/stage-19-exfiltration.md) | `T1041` | Linux Pivot Auth | Wazuh `5715` (Burst: 6 logons / 1s) | **Detected** | `wzb-34f34a857c` (`19.png`) |
| **20** | [Impact & Defacement](../02-Attack-Simulation/Stages/stage-20-impact.md) | `T1491.001` | Sysmon, Security & NIDS | Wazuh `100613` / SIDs `2067085`–`87` | **Detected** | `wzb-71ef983ad8`, `wzb-7a4a134d1b` (10 Alerts) |

---

## 5. Honest Detection Gap Register: Explaining the 20% Missed

A realistic detection engineering portfolio must document what **cannot** be detected and provide concrete engineering fixes. Claiming "100% detection" in a lab is almost always a sign of unrealistic testing.

Here is the honest breakdown of the 4 stages that were not caught directly by target-side detection rules:

### 1. Inherent Offline Gaps (Stages 04 & 11 — Hash Cracking)
- **Why It Happened:** In Stage 04 (MD5 hash cracking) and Stage 11 (NTLMv2 hash cracking), the operator extracted hashes and ran Hashcat locally on the Kali Linux machine's dedicated GPU. Zero packets traveled across the network, and zero processes spawned on victim hosts.
- **SOC Posture:** These stages cannot be detected at execution time. The defense shifts to **prevention** (preventing database exfiltration and disabling LLMNR/NBT-NS via GPO) and **post-crack alerting** (detecting when the cracked credentials are used in Stages 05 and 12).

### 2. Architectural Visibility Limits (Stage 09 — Internal Discovery)
- **Why It Happened:** When the attacker pivoted to DVWA (`192.168.56.30`) and scanned the Windows hosts (`192.168.56.10`, `.20`), packets were switched locally at Layer 2 within VMware VMnet2. Because intra-subnet traffic never crosses a Layer 3 router, standard gateway firewalls are blind to it.
- **Why We Saw Telemetry:** Because Suricata was deployed on the same virtual switch with interface `ens37` in AF-PACKET promiscuous mode, it passively captured broadcast and multicast probe packets, generating 14 NIDS alerts in the raw export.
- **Production Engineering Fix:** In a physical enterprise with hardware switch isolation, promiscuous sniffing cannot be guaranteed. The proper host-level fix is enabling Windows Defender Firewall dropped-packet logging and shipping those events via the Wazuh agent.

### 3. Active Directory Telemetry Baseline (Stage 12 — BloodHound AD Recon)
- **Why It Happened:** SharpHound executed high-volume LDAP search queries against the Domain Controller. While the SSH session used to launch the tool on the pivot host was immediately flagged (`Rule 5715`), the Domain Controller did not raise an explicit LDAP anomaly alert because Windows Server does not log individual LDAP queries by default.
- **Production Engineering Fix:** Set registry key `HKLM\SYSTEM\CurrentControlSet\Services\NTDS\Diagnostics\15 Field Engineering` to `5` (DWORD) to generate Event ID 1644 ("Expensive/Inefficient LDAP Search Queries").

### 4. Encrypted Transport Blindness (Stage 19 — Exfiltration)
- **Why It Happened:** The adversary exfiltrated files from DVWA to Kali over encrypted SCP/SSH (`22/TCP`). Transport-layer encryption prevented Suricata deep packet inspection from reading file contents or archive names.
- **How We Caught It Anyway:** Wazuh's correlation engine detected the behavioral anomaly: a rapid burst of 6 administrative SSH authentications occurring in under one second (`Rule 5715`), alerting analysts to anomalous bulk transport even without inspecting payload plaintext.

---

## 6. The Telemetry Funnel: 9,567 Logs $\to$ 46 Incidents

How do thousands of raw machine events become a handful of prioritized incidents on an analyst's desk?

```
┌─────────────────────────────────────────────────────────────┐
│  Stage 1: Complete Raw Wazuh Alerts (Wazuh-Raw-Alerts.csv)  │
│  9,567 raw events across all 4 agents                       │
│  (DVWA: 8,114  •  Suricata: 1,168  •  DC: 168  •  Win10: 117)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Filtered by Multi-Level Severity
┌─────────────────────────────────────────────────────────────┐
│  Stage 2: Curated Analysis Dataset (wazuh_alerts.csv)       │
│  808 elevated security events across the 20 attack stages   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼ Wazuh <level>8</level> Gate & custom-thehive
┌─────────────────────────────────────────────────────────────┐
│  Stage 3: Correlated Incident Alerts (thehive_alerts.json)  │
│  46 high-signal, actionable incident cases in TheHive 5     │
│  (Grouped by tool campaigns, process trees, and logon bursts)│
└─────────────────────────────────────────────────────────────┘
```

1. **Top of Funnel (9,567 Raw Alerts):** Captures every single event from low-severity policy checks (Level 3) to brute-force attempts.
2. **Middle of Funnel (808 Elevated Events):** Retains events associated with active adversary stages while filtering out background operating system chatter.
3. **Bottom of Funnel (46 TheHive Incidents):** The result of `thecustomhive` correlation. Instead of an analyst receiving 300 tickets for a single web fuzzing scan, they receive **one single clustered incident** titled `Tool Campaign: Nikto on DVWA` with all 300 raw hits attached as evidence observables.

---

## Component Deep-Dive Directories

To inspect the raw configuration files, baseline policies, and rulesets for each defensive technology, explore the dedicated subdirectories:

| Directory | Core Files | Technology | Focus Area |
|---|---|---|---|
| [`Wazuh/`](Wazuh/README.md) | [`local_rules.xml`](Wazuh/local_rules.xml)<br>[`local_decoder.xml`](Wazuh/local_decoder.xml) | Wazuh SIEM 4.14.8 | 1,300+ line tuned ruleset, decoders, and 87 suppressions |
| [`Suricata/`](Suricata/README.md) | [`custom.rules`](Suricata/custom.rules)<br>[`threshold.config`](Suricata/threshold.config) | Suricata 7.x NIDS | Dual-homed network wire signatures, rate limiting, and ET Open rules |
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
