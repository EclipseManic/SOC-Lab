# Lessons Learned, Engineering Post-Mortem & Security Backlog

> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Report Identifier:** `IR-2026-1018-LESSONS`  
> **Lead Incident Responder:** Manichand Gupta  
> **Lifecycle Phase:** NIST SP 800-61r2 Phase 5: Post-Incident Activity  
> **Status:** **Approved & Integrated into SecOps Engineering Backlog**

This document details the strategic takeaways, defensive successes, architectural telemetry insights, and ongoing engineering roadmap derived from the 74-minute multi-stage enterprise intrusion simulation.

---

## 📑 Post-Mortem Structure

1. [Executive Summary: What We Learned](#1-executive-summary-what-we-learned)
2. [Defensive Architecture Victories: What Succeeded](#2-defensive-architecture-victories-what-succeeded)
3. [Why Timestamps Vary by a Few Seconds in Real SOC Environments](#3-why-timestamps-vary-by-a-few-seconds-in-real-soc-environments)
4. [Documented Detection Limits & Architectural Blind Spots](#4-documented-detection-limits--architectural-blind-spots)
5. [Completed Remediations vs. Ongoing Engineering Backlog](#5-completed-remediations-vs-ongoing-engineering-backlog)

---

# 1. Executive Summary: What We Learned

The main goal of this 74-minute exercise was simple: **Can a modern, small-team SOC detect, track, and stop a determined attacker moving from a web vulnerability all the way to an Active Directory domain takeover?**

The biggest takeaway from this simulation: **Perimeter defenses will eventually be breached, but layered detection—paired with fast, decisive live-response commands—can reliably catch and sever an attacker before permanent damage is done.**

Even though the attacker moved fast and reached Domain Admin in under 55 minutes, our defensive sensors captured actionable telemetry across **16 out of 20 stages (80.0% operational SOAR alert delivery; 14 direct target/wire + 2 pivot-only)**, with zero rule engine crashes or dropped logs.

---

# 2. Defensive Architecture Victories: What Succeeded

### 1. Multi-Sensor Layered Telemetry Fabric
No single defensive sensor possessed complete visibility across the hybrid environment. The intrusion was successfully reconstructed because telemetry from multiple distinct layers corroborated each phase:
- **Wire Inspection (Suricata):** Detected external port scans, automated brute-force bursts, SQL injection payloads, web shell verification, and Kerberos TGS-REQ requests that bypassed local endpoint loggers.
- **Kernel & Host Audit (Auditd & PAM):** Detected web shell OS command execution (`/usr/bin/id`), reverse shell socket establishment (`stty sane`), and passwordless sudo Python escalation (`Rule 5402`) within seconds.
- **Directory & Process Behavioral Analytics (Wazuh & Sysmon):** Captured Pass-the-Hash NTLM Logon Type 3 events (EID 4624), Impacket WMI fan-out commands, rogue user creation (EID 4720), and desktop wallpaper registry modifications (Sysmon EID 1 reg.exe).

### 2. The Custom Level >= 8 SOAR Ingestion Gateway
In a high-throughput enterprise environment, raw SIEM streams quickly overwhelm Tier 1 analysts (visible in our 9,567 raw OpenSearch baseline events). 
- Wazuh's `custom-thehive` integration acted as an intelligent operational filter: inspecting incoming events directly in analysisd memory, clustering alert bursts within a 5-second sliding window, and delivering **46 high-fidelity, actionable incident tickets** to TheHive.
- This prevented alert fatigue, preserved analyst cognitive bandwidth, and enabled rapid triage into three clean, scope-based investigation cases.

### 3. Sub-15-Second Host Mean Time to Detect (MTTD)
Host behavioral rules alerted with near-instantaneous speed:
- PAM sudo privilege escalation alerted in **< 1 second** (`17:25:36 IST`).
- Sysmon process creation tracking for Impacket WMI execution alerted in **< 2 seconds** (`18:04:47 IST`).
- SSH administrative rate anomaly correlation caught the 6-session exfiltration burst within **570 milliseconds** (`18:17:30 IST`).

### 4. Promiscuous Network Sniffing Resilience
By configuring Suricata in AF-PACKET promiscuous mode on gateway interface `ens37`, the IDS successfully observed intra-subnet Layer 2 port sweeps and Kerberos ticket requests traversing the VMware virtual switch that never hit the router's IP forwarding layer.

### 5. Analyst-Driven Investigative Attribution for Offline Gaps
While Stages 04 (MD5 password cracking) and 11 (NTLMv2 password cracking) generated zero telemetry on victim endpoints due to running on external adversary GPU hardware (`DG-04`, `DG-11`), the SOC team achieved complete investigative attribution through **adversary credential lifecycle triangulation**:
1. **Upstream Theft Corroboration:** Correlating the initial credential exfiltration (SQL injection dumping hashes in Stage 03, and Responder LLMNR harvesting in Stage 10).
2. **Offline Elapsed Interval:** Validating GPU computation duration against dictionary keyspace feasibility (< 60 seconds).
3. **Downstream Authentication Verification:** Verifying the subsequent successful authentication of the cracked credentials on target services (POST `/login.php` on DVWA, and Windows Security Event ID 4624 Logon Type 3 on Domain Controller).

---

# 3. Why Timestamps Vary by a Few Seconds in Real SOC Environments

One of the most practical takeaways from this investigation is that **in a real security operations center, raw event timestamps across different tools will often differ by a few seconds (or even a few minutes for interactive shell sessions)**. Understanding why this happens is crucial so analysts don't mistake normal pipeline mechanics for errors:

![Telemetry Flow and Timestamp Skew Mechanics](../06-Resources/diagrams/Telemetry%20Flow%20and%20Timestamp%20Skew%20Mechanics.png)

### Architectural Skew Mechanics Explained:
1. **TheHive SOAR Fast-Path vs. OpenSearch Dashboard Indexing:**
   - When Wazuh's `analysisd` matches a high-severity rule, `wazuh-integratord` hooks directly into the core engine memory and immediately posts the alert payload to `custom-thehive` via webhook in **< 0.2 milliseconds**.
   - Concurrently, the same alert is written to `alerts.json`, shipped across WireGuard by Filebeat, and indexed into OpenSearch. Because Filebeat uses buffered batch flushes and OpenSearch has a refresh interval (default 1s), **TheHive alerts routinely appear in the SOAR queue 1–3 seconds before the OpenSearch dashboard indexes them**.
2. **Linux Shell `PROMPT_COMMAND` Flushing Delays:**
   - Linux Auditd command-line logging (`bashcmd`) hooks into Bash's `PROMPT_COMMAND` environment variable. `PROMPT_COMMAND` executes **only after a running process exits and the next shell prompt is rendered**.
   - When an attacker executes long-running, blocking, or interactive commands (`Responder.py`, interactive Python subshells, or Impacket scripts), Suricata and the target Windows DC log the network and authentication packets immediately on wire arrival. However, `bashcmd` only flushes the command string to `/var/log/bashcmd.log` after the attacker terminates the command (`Ctrl+C`) or exits the shell. This explains why bashcmd timestamps can appear offset by several seconds to minutes relative to network IDS logs.
3. **Live Multi-Attempt Sequence Clustering:**
   - In realistic intrusions, operators frequently retry commands (e.g. escaping quotes, adjusting network interface flags). TheHive clusters events matching the same rule within its 5-second sliding aggregation window into a single parent card anchored to the first timestamp, while individual OpenSearch dashboard screenshots reflect subsequent attempts within that cluster.

---

# 4. Documented Detection Limits & Architectural Blind Spots

Our audit identified **two inherent offline computation gaps**, **two target-side logging gaps**, **two operational pivot-only alerts**, plus **one wire protocol payload inspection boundary** that require specialized defensive counter-strategies:

- **Direct Target & Wire Detections (14 Stages / 70.0%):** Direct sensor rules intercepted the adversary's actions on endpoints or the network wire (Stages 01, 02, 03, 05, 06, 07, 08, 10, 13, 15, 17, 18, 19, 20).
- **Operational Pivot-Only Alerts (2 Stages / 10.0% — `DG-14`, `DG-16`):** Adversary techniques were detected on the pivot host and session boundary, while target Domain Controller technique diagnostics were unconfigured.
- **Target-Side Logging Gaps (2 Stages / 10.0% — `DG-09`, `DG-12`):** Pre-attack default audit policies lacked diagnostic events on target Windows endpoints (host firewall drop logging and EID 1644 LDAP query diagnostics).
- **Inherent Offline Computation Gaps (2 Stages / 10.0% — `DG-04`, `DG-11`):** Computations occurring entirely on external adversary hardware (Kali GPU/CPU) producing zero victim telemetry by definition. These are verified and attributed via upstream theft detection and downstream authentication alerts.
- **Protocol Payload Inspection Boundary (`DG-19` — Stage 19):** Stage 19 is tracked as **Detected** because the exfiltration *transport activity* triggered a direct rate anomaly alert in Wazuh (Rule 5715, Alert #37: 6 rapid SSH sessions in 0.57s). However, `DG-19` documents the architectural limit that SSH transport encryption prevented Suricata NIDS from inspecting plaintext document filenames on the wire.

| Gap Code | Stage # | Detection Boundary | Root Cause Analysis | Defensive Counter-Strategy & Mitigation |
|:---:|:---:|:---|:---|:---|
| **DG-04** | Stage 04 | Inherent Offline Password Hash Cracking | Hashcat executed locally on the attacker's GPU using dumped MD5 hashes. Produces zero network or host telemetry on victim systems. | Focus detection upstream (preventing SQL injection dumps) and downstream (alerting on immediate administrative logins using newly cracked passwords). |
| **DG-09** | Stage 09 | Target Host Dropped-Packet Logging Gap | Nmap sweep detected on wire by Suricata (`ens37`) and pivot CLI by Wazuh (`Rule 100220`), but Windows target endpoints logged zero drops because host firewall drop logging was disabled. | Configure Windows Filtering Platform (WFP) dropped packet auditing and forward drop events to Wazuh (Backlog P2). |
| **DG-11** | Stage 11 | Inherent Offline NTLMv2 Hash Cracking | Hashcat cracked the intercepted `win10` challenge-response hash locally. Zero victim telemetry generated during the cracking phase. | Eliminate the capture vector entirely: globally disable LLMNR and NetBIOS over TCP/IP so hashes can never be broadcasted or captured. |
| **DG-12** | Stage 12 | Target AD LDAP Diagnostic Query Logging Gap | `bloodhound-python` command caught on pivot (`Rule 100220`), SSH retrieval alerted (#22), and generic logon logged (Rule `100615`), but technique-specific queries were missed because EID 1644 was unconfigured. | Set registry key `15 Field Engineering = 5` on all Domain Controllers to log Event ID 1644 for high-volume LDAP queries (Backlog P1). |
| **DG-14** | Stage 14 | Target Active Directory Replication Auditing Gap | `secretsdump.py` caught on pivot (`Rule 100220`), SSH exfil alerted (#24), and DC recorded generic logon/privilege (EID 4624/4672), but DRSUAPI replication was missed because Event ID 4662 SACLs were unconfigured. | Configure Directory Service Access SACLs on the domain root object auditing `Replicating Directory Changes All` and deploy Sigma rules matching non-DC replication. |
| **DG-16** | Stage 16 | Target Kerberos Service Ticket Auditing Gap | `ticketer.py` caught on pivot (`Rule 100220`) and `wmiexec -k` fan-out alerted (#27 & #28), but DC recorded standard Kerberos logons (EID 4624) because Kerberos Service Ticket Operations (EID 4769) were unconfigured. | Enable Kerberos Service Ticket Operations auditing, enroll privileged accounts in `Protected Users`, and execute a double `krbtgt` password reset (reaching KVNO 3). |
| **DG-19** | Stage 19 | Encrypted Transport Payload Inspection (Nuanced) | SCP over SSH encrypted the exfiltration payload on the wire, hiding document filenames from Suricata inspection. Method detected via host auth rate anomaly (Wazuh 5715). | Correlate host-level authentication rate anomalies: Wazuh Rule 5715 flagged 6 administrative SSH sessions initiated in under 570 milliseconds. |

---

# 5. Completed Remediations vs. Ongoing Engineering Backlog

During **Phase 4 (Eradication & Hardening)** ([`Eradication-Hardening-and-Recovery.md`](../04-Investigation/Eradication-Hardening-and-Recovery.md)), the incident response team permanently eliminated all 7 root causes. The table below outlines what was completed during live response versus the ongoing security engineering backlog:

### Remediated Root Causes (Completed & Verified in Phase 4)
- [x] **Flaw 1 (Sudoers NOPASSWD Python):** Directive purged from `/etc/sudoers`; syntax validated with `visudo -c`; access denial confirmed via `sudo -u www-data sudo -l`.
- [x] **Flaw 2 (Permissive SSH Root Logins):** Enforced `PermitRootLogin no` and `PasswordAuthentication no` in `/etc/ssh/sshd_config`; restarted SSH daemon.
- [x] **Flaw 3 (Web Upload Script Execution):** Deployed `.htaccess` denying script engines in `/hackable/uploads/`; tested and verified HTTP 403 Forbidden.
- [x] **Flaw 4 (Service Account in Domain Admins):** Stripped `HANK_SHERMAN` from `Domain Admins`; deleted SPN `CIFS/AWSWAPPS1000000.ad.lab`; enforced AES Kerberos encryption.
- [x] **Flaw 5 (Credential Exposure & Golden Tickets):** Enrolled `Administrator` and `HANK_SHERMAN` into `Protected Users` security group; completed double `krbtgt` password reset (KVNO 3).
- [x] **Flaw 6 (Insecure LLMNR & NetBIOS):** Globally disabled LLMNR (`EnableMulticast = 0`) and NetBIOS over TCP/IP (`NetbiosOptions = 2`) across all Windows workstations and servers.
- [x] **Flaw 7 (Flat DMZ Network Routing):** Enforced gateway and host iptables micro-segmentation rejecting outbound Windows AD ports from DVWA into `192.168.56.0/24`.

---

### Ongoing Security Engineering Backlog (Next 30–90 Days)

| Priority | Task Description | Target Component | Engineering Owner | Target Completion |
|:---:|:---|:---|:---:|:---:|
| **P1** | Set registry key `15 Field Engineering` to `5` on all Domain Controllers to log Event ID 1644 LDAP search volume anomalies | Active Directory (PC-DC) | Identity Engineering | 14 Days |
| **P1** | Implement Canary / Honeypot Service Accounts with registered SPNs in Active Directory for instant Kerberoast alert generation | Active Directory Infrastructure | SOC Detection Team | 21 Days |
| **P1** | Upgrade SOAR alert grouping (`custom-thehive.py` v2) to enforce a hard 15-minute maximum campaign window alongside rolling inactivity timeout, segregating recon from post-compromise activity | SOAR Integration Daemon | Automation Engineering | 21 Days |
| **P1** | Develop automated end-to-end integration test harness for SOAR pipeline covering SQLite crash recovery, concurrent multi-agent ingestion, and TheHive API 5xx/429 retry behavior | Testing & CI/CD Pipeline | SOC Engineering | 30 Days |
| **P2** | Migrate standalone domain service accounts to Active Directory Group Managed Service Accounts (gMSA) to enforce 128-character automatic password rotations | Enterprise Windows Fleet | Systems Administration | 45 Days |
| **P2** | Configure Windows Defender Firewall dropped packet logging and forward dropped session events to Wazuh | Windows 10 & Server 2022 | Endpoint Security | 30 Days |
| **P2** | Validate Wazuh Rule 100324 hardening ensuring SYSTEM discovery suppression strictly requires Wazuh/OSSEC agent parent/image conditions | Wazuh Ruleset (`local_rules.xml`) | Detection Engineering | 14 Days |
| **P2** | Formalize virtual switch interface audits to prevent shadow dual-homed network adapters (such as the decommissioned DVWA staging adapter) from bridging DMZ and external networks | Network Infrastructure | Infrastructure Team | 14 Days |
| **P2** | Deploy File Integrity Monitoring (FIM) with real-time whitelisting on all web server upload directories and temporary paths | Wazuh Agent (`ossec.conf`) | SOC Engineering | 30 Days |
| **P3** | Implement automated SOAR containment playbooks triggering instant Velociraptor network isolation upon detection of DCSync or Pass-the-Hash alerts | TheHive & Velociraptor | Automation Engineering | 60 Days |
| **P3** | Conduct quarterly Purple Team adversary emulation exercises testing Active Directory attack surface against updated detection baselines | Enterprise Threat Hunting | InfoSec Leadership | 90 Days |
