# SOC Lab — 20-Stage Attack Simulation & Detection Engineering

I built a small company network in a hybrid cloud lab, executed an end-to-end 20-stage attack campaign—spanning external reconnaissance, web application exploitation, Linux host privilege escalation, network credential theft, and Active Directory domain compromise—and recorded which steps my security tools caught.

[![SOC Lab Complete Architecture](06-Resources/diagrams/SOC_Lab_Architecture.png)](06-Resources/diagrams/SOC_Lab_Architecture.png)

**Live interactive report:** <https://soc-lab.eclipsemanic.me/>

---

## How It Works

[![Conceptual Network Architecture](06-Resources/diagrams/Neon%20Cybersecurity%20Network%20Architecture%20Diagram.png)](06-Resources/diagrams/Neon%20Cybersecurity%20Network%20Architecture%20Diagram.png)

The attacker starts outside the network on an isolated subnet. Every perimeter probe crosses a Linux router running a **Suricata** network intrusion detection system (NIDS). Inside the victim network, endpoints run **Wazuh** agents, **Sysmon**, and **Auditd**. All telemetry is forwarded over an encrypted WireGuard VPN to a cloud-hosted SOC stack running **Wazuh SIEM** and **TheHive 5** case management.

> [!TIP]
> Looking for detailed network addressing, routing tables, and interface diagrams? See [01-Lab-Setup/README.md](01-Lab-Setup/README.md).

### Repository Directory Index

| Section | Primary Document | Description |
|---|---|---|
| **01 — Lab Setup** | [`01-Lab-Setup/README.md`](01-Lab-Setup/README.md) | Complete hybrid cloud architecture, network segmentation, WireGuard VPN configuration, and reproducible host build profiles for all 7 systems (5 local + 2 cloud). |
| **02 — Attack Simulation** | [`02-Attack-Simulation/README.md`](02-Attack-Simulation/README.md) | The 20-stage red-team playbook with exact terminal commands, execution tradecraft, and 62 attacker-side terminal proof screenshots. |
| **03 — Detection Engineering** | [`03-Detection-Engineering/README.md`](03-Detection-Engineering/README.md) | Custom Wazuh detection rules (`local_rules.xml`), Suricata NIDS signatures, Sysmon/Auditd telemetry baselines, and the `thecustomhive` SQLite WAL SOAR daemon. |
| **04 — Investigation** | [`04-Investigation/README.md`](04-Investigation/README.md) | **Completed & Formally Validated:** SOC analyst triage notes for all 46 TheHive alerts, immediate tactical containment, 7-phase deep-dive attack chain, and permanent eradication playbook. |
| **05 — Incident Report** | [`05-Incident-Report/README.md`](05-Incident-Report/README.md) | **Completed & Formally Validated:** Formal executive incident report, full chronological attack timeline, complete IOC tables, and remediation engineering backlog. |
| **06 — Assets & Resources** | [`06-Resources/README.md`](06-Resources/README.md) | Centralized asset repository: evidentiary screenshots, telemetry datasets (9,567 raw baseline alerts, 808 analyst-curated records, 46 TheHive incident cases), detection rules, configs, diagrams, and automation scripts. |
| **Master Index** | [`INDEX.md`](INDEX.md) | Master traceability matrix mapping every stage to MITRE ATT&CK techniques, detection rules, alert IDs, and raw evidence files. |

---

## The Attack Story in Three Acts

### 1. Break into the Web Server & Escalate to Root (Web Exploitation & Linux Host Compromise)
The attacker scans the perimeter, discovers a vulnerable web application (DVWA), and exploits an SQL injection vulnerability to dump database credentials. After cracking an administrative password, the attacker uploads a PHP web shell through an unrestricted file upload form, catches an interactive reverse shell, elevates privileges to root using a passwordless sudo Python misconfiguration (`sudo /usr/bin/python3` GTFOBins), and establishes persistent SSH access.

### 2. Pivot & Capture Network Credentials (Internal Recon, LLMNR Poisoning & AD Mapping)
Now inside the company network, the attacker turns the compromised web server into an internal pivot. Operating from this pivot, the attacker runs Responder to poison link-local multicast name resolution (LLMNR/NBT-NS), intercepting a domain user's password hash from a Windows 10 workstation. After cracking the hash offline, the attacker launches BloodHound to map Active Directory trust relationships and identify domain attack paths.

### 3. Take Over Active Directory & Impact Endpoints (Domain Takeover, Persistence & Defacement)
Using the mapped path, the attacker requests a Kerberos service ticket for a privileged service account (Kerberoasting) and cracks it to gain Domain Admin credentials. With domain admin rights, the attacker performs a DCSync attack against the Domain Controller to extract all Active Directory password hashes, forges an unrestricted Golden Ticket for indefinite persistence, creates a rogue domain administrator account, and pushes an unauthorized wallpaper defacement across the domain to demonstrate complete control.

### The Defensive Counterpart: How Detection Engineering Intercepted the Chain
While the adversary advanced through these three acts, the defensive stack operated as an interlocking, multi-layered mesh:
- **At the Perimeter & Wire:** Dual-homed **Suricata NIDS** (sniffing ingress `ens33` and internal `ens37`) caught inbound Nmap OS fingerprint probes, automated Python brute-force authentication floods, SQL injection payloads, and intra-subnet Kerberos ticket requests.
- **In the Linux Kernel:** **Linux Auditd** intercepted system calls (`execve`) executed by the web server user (`uid=33`), exposing the PHP web shell commands and reverse shell spawn regardless of transport encryption.
- **On the Windows Endpoints:** **Microsoft Sysmon & Windows Security Logs** caught Pass-the-Hash NTLM Type 3 logons (EID 4624), rogue account additions to `Domain Admins`, and Impacket's `wmiexec` process tree fan-out (`WmiPrvSE.exe` $\to$ `cmd.exe /Q /c`).
- **In the Cloud SIEM & SOAR Pipeline:** **Wazuh SIEM** evaluated all feeds against 148 rule definitions and 87 noise suppressions. Alerts meeting the $\ge \text{Level 8}$ threshold triggered `custom-thehive`, an asynchronous two-tier SOAR engine using local SQLite WAL queues and a 5-second flush daemon to cluster alert floods into **46 high-fidelity incident cases in TheHive 5**—delivering a **90% direct target detection rate (18 of 20 stages caught directly on endpoints or network wire)** and **90% operational alert coverage (18 of 20 stages producing actionable alerts)**, with zero detection engine rule execution failures.

---

## 20-Stage Attack & Detection Summary

| # | What the Attacker Did | Caught? | Details & Evidence |
|:---:|---|:---:|---|
| **01** | Perimeter TCP SYN port scan and OS fingerprinting probe | **Yes** (Network IDS) | [Stage 01 — Recon](02-Attack-Simulation/Stages/stage-01-recon.md) · [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) |
| **02** | Automated password guessing / brute-force attack on web application | **Yes** (Web 4xx burst) | [Stage 02 — Brute Force](02-Attack-Simulation/Stages/stage-02-bruteforce.md) · [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) |
| **03** | SQL injection exploiting database to extract user accounts and password hashes | **Yes** (Network & Web log) | [Stage 03 — SQLi](02-Attack-Simulation/Stages/stage-03-sqli.md) · [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) |
| **04** | Offline GPU password cracking of extracted MD5 database hashes | **No** (Offline on GPU) | [Stage 04 — Hash Cracking](02-Attack-Simulation/Stages/stage-04-hash-crack.md) · [Phase 1 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation) |
| **05** | Uploading a PHP web shell through an unrestricted file upload form | **Yes** (IDS & Auditd execve) | [Stage 05 — Web Shell](02-Attack-Simulation/Stages/stage-05-webshell.md) · [Phase 2 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) |
| **06** | Interactive reverse shell connection back to the attacker | **Yes** (IDS & Host shell spawn) | [Stage 06 — Reverse Shell](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) · [Phase 2 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) |
| **07** | Local privilege escalation via passwordless sudo Python misconfiguration (sudo /usr/bin/python3 GTFOBins) to gain root | **Yes** (Host PAM & Auditd) | [Stage 07 — PrivEsc](02-Attack-Simulation/Stages/stage-07-privesc.md) · [Phase 2 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root) |
| **08** | Injecting attacker SSH key into root authorized_keys for persistent access | **Yes** (FIM & SSH logon alert) | [Stage 08 — Persistence](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) · [Phase 3 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) |
| **09** | Internal network sweep from the compromised pivot host to discover targets | **Yes** (Caught on wire & pivot host) | [Stage 09 — Discovery](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) · [Phase 3 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) |
| **10** | LLMNR/NBT-NS broadcast poisoning (Responder) to capture workstation credentials | **Yes** (Win10 DavSetCookie & pivot host) | [Stage 10 — Responder](02-Attack-Simulation/Stages/stage-10-responder.md) · [Phase 4 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) |
| **11** | Offline GPU password cracking of intercepted workstation NetNTLMv2 hash | **No** (Offline on GPU) | [Stage 11 — NTLM Crack](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) · [Phase 4 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) |
| **12** | BloodHound / SharpHound Active Directory enumeration mapping domain trust paths | **Yes** (DC & Win10 Custom Rule 100615) | [Stage 12 — BloodHound](02-Attack-Simulation/Stages/stage-12-bloodhound.md) · [Phase 4 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) |
| **13** | Kerberoasting request for a Domain Admin service account ticket | **Yes** (Wire Kerberos TGS-REQ alert) | [Stage 13 — Kerberoasting](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) · [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) |
| **14** | DCSync attack dumping all domain password hashes via DRSUAPI replication | **Yes** (DC Custom Rule 100603 & Rule 92657) | [Stage 14 — DCSync](02-Attack-Simulation/Stages/stage-14-dcsync.md) · [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) |
| **15** | Pass-the-Hash remote command execution to Windows 10 over SMB/WMI | **Yes** (NTLM Type 3 & WMI fan-out) | [Stage 15 — Pass-the-Hash](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) · [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) |
| **16** | Forging an unrestricted Kerberos Golden Ticket for indefinite domain persistence | **Yes** (DC Custom Rule 100603, 100615 & Alerts #27, #28) | [Stage 16 — Golden Ticket](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) · [Phase 5 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) |
| **17** | Creating a backdoor domain user account and adding it to Domain Admins | **Yes** (WMI fan-out & AD event) | [Stage 17 — DC Persistence](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) · [Phase 6 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) |
| **18** | Automated collection of confidential domain files and system information | **Yes** (Sysmon process fan-out) | [Stage 18 — Collection](02-Attack-Simulation/Stages/stage-18-collection.md) · [Phase 6 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) |
| **19** | Exfiltrating stolen data archive to the attacker over encrypted SCP | **Yes** (Rapid SSH session burst) | [Stage 19 — Exfiltration](02-Attack-Simulation/Stages/stage-19-exfiltration.md) · [Phase 6 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) |
| **20** | Pushing remote desktop wallpaper defacement across domain endpoints via WMI | **Yes** (WMI fan-out & Sysmon registry) | [Stage 20 — Impact](02-Attack-Simulation/Stages/stage-20-impact.md) · [Phase 7 Deep Dive](04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-7-the-final-punch-simulated-ransomware-defacement--forced-reboots) |

---

## Result at a Glance

| Metric | Result | Engineering Ground Truth |
|---|:---:|---|
| **Attack stages run** | **20** | Full kill chain: external reconnaissance, web exploitation, Linux privilege escalation, network credential theft, Active Directory takeover, and domain defacement |
| **Direct Target Detections** | **18 (90%)** | **Direct target & wire triggers:** Dedicated rules inspecting target payloads, command arguments, process trees, auth rate anomalies, and wire telemetry directly on victim hosts or network sensors |
| **Operational Alert Coverage** | **18 (90%)** | **Actionable incident cases:** 18 of 20 stages delivered live, verified alerts to TheHive 5 / central SIEM fabric across all online phases |
| **Inherent Offline Gaps** | **2 (10%)** | **Offline GPU cracking:** Stages 04 (MD5) and 11 (NTLMv2) ran locally on attacker's GPU (zero victim or network telemetry by definition) |
| **Target Logging Gaps** | **0 (0%)** | **Zero unmonitored online stages:** Network NIDS (ens37) and custom endpoint rules (100615, 92657) directly detected internal discovery and AD recon |
| **Rule Execution Failures** | **0 (0%)** | **Zero pipeline crashes:** All configured rules parsed and fired; zero syntax errors, dropped packets, or engine failures |

---

## How to Read This Repo

- **5 minutes:** Read this page, review the result numbers, and scan the 20-stage attack table above.
- **30 minutes:** Read five standout stage simulations and detection engineering baselines comparing attack tradecraft against the telemetry rulesets:
  - [Stage 03 — SQL Injection](02-Attack-Simulation/Stages/stage-03-sqli.md) (Web application exploitation: UNION SELECT database dump & [Suricata SID 2010963](03-Detection-Engineering/Suricata/README.md#3-empirically-verified-signatures-fired-in-campaign))
  - [Stage 07 — Privilege Escalation](02-Attack-Simulation/Stages/stage-07-privesc.md) (Linux host compromise: passwordless sudo Python misconfiguration & [Auditd execve tracking](03-Detection-Engineering/Auditd/README.md))
  - [Stage 10 — Responder Poisoning](02-Attack-Simulation/Stages/stage-10-responder.md) (Network MitM: Link-local broadcast poisoning & [Wazuh bashcmd logging](03-Detection-Engineering/Wazuh/README.md))
  - [Stage 13 — Kerberoasting](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) (Active Directory exploitation: Kerberos TGS-REQ wire frames & [Suricata SID 2019922](03-Detection-Engineering/Suricata/README.md#3-empirically-verified-signatures-fired-in-campaign))
  - [Stage 15 — Pass-the-Hash](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) (Lateral movement: NTLM Logon Type 3 & [Wazuh WMI Rule 100613](03-Detection-Engineering/Wazuh/README.md))

---

## Disclaimer & License

> **Authorized Educational Research Only:** All attack simulations and defensive telemetry in this project were executed against dedicated, isolated virtual machines in a private lab environment owned by the author. No production systems or unauthorized networks were targeted. See [DISCLAIMER.md](DISCLAIMER.md).

This project is licensed under the [MIT License](LICENSE).
