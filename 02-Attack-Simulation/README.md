# 02 — Attack Simulation

This section documents the 20-stage adversary campaign executed against the lab environment, ordered chronologically by execution. Each stage file details the attack objective, the exact commands executed, evidence screenshots, observed alerts in TheHive/Wazuh/Suricata (or the corresponding detection gap if undetected), and the mapped MITRE ATT&CK techniques.

---

## Master Reference & Single Source of Truth

> [!IMPORTANT]
> The primary blueprint and single source of truth for this entire adversary campaign is the comprehensive attack chain document:
> 
> 📄 **[`attack-chain-full.pdf`](../06-Resources/attack-chain-full.pdf) (redacted public copy)** *(the unredacted original is retained locally)*
>
> This reference document details the complete end-to-end attack narrative, threat actor profiling, operational steps, and intended progression from external reconnaissance through domain compromise and ransomware/defacement impact. The stage write-ups in this directory document the live execution, telemetry, and evidence generated while carrying out that blueprint in the isolated lab.

---

## Campaign Structure & Cases

[![Attack Simulation 20-Stage Kill Chain Roadmap](../06-Resources/Diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)](../06-Resources/Diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)
*Figure 1: Full 20-stage attack simulation lifecycle mapped across the 3 investigation cases, showing detection statuses and tool vectors ([view full asset](../06-Resources/Diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)).*

The 20 attack simulation stages are grouped into three distinct investigative cases:

- **[Case 01 — Web Application Compromise & Local Escalation](../04-Investigation/Cases/case-01-web-compromise.md) (Stages 01–07):**
  Adversary targets perimeter web services (DVWA on Ubuntu `192.168.56.30`), leverages SQL injection to harvest database credentials, uploads a PHP web shell, establishes an interactive reverse shell back to Kali (`192.168.232.135`), and escalates privileges to local `root` via passwordless sudo Python misconfiguration.
- **[Case 02 — Pivot, Credential Access & Active Directory Escalation](../04-Investigation/Cases/case-02-lateral-movement.md) (Stages 08–14):**
  Adversary establishes root SSH persistence on the web server, discovers the internal Active Directory subnet (`192.168.56.0/24`), poisons LLMNR/mDNS via Responder on the pivot interface to capture workstation hashes (`win10`), enumerates the AD domain with BloodHound, kerberoasts a Domain Admin account (`HANK_SHERMAN`), and extracts all domain credentials from the Domain Controller (`PC-DC`) using DCSync (DRSUAPI).
- **[Case 03 — Domain Compromise, Lateral Movement & Impact](../04-Investigation/Cases/case-03-domain-compromise.md) (Stages 15–20):**
  Adversary performs Pass-the-Hash and Golden Ticket forgery (`krbtgt`) to achieve complete domain control, implants a backdoor domain administrator account for persistent access, collects and exfiltrates sensitive business intelligence from the DC and Windows 10 workstation via SCP, and executes a coordinated simulated ransomware and desktop defacement attack across the domain.

---

## Stage Index & Traceability Matrix

| # | Stage | Case | Primary Tool / Vector | ATT&CK ID | Attack Evidence | Detection Status | Alert Source |
|---|---|---|---|---|---|---|---|
| **01** | [Reconnaissance](Stages/stage-01-recon.md) | Case 01 | Ping, Nmap, WhatWeb, Nikto, Gobuster | `T1595` | `1.png`–`5.png` | **Detected** | Suricata / TheHive |
| **02** | [Brute Force](Stages/stage-02-bruteforce.md) | Case 01 | Custom Python CSRF script + RockYou | `T1110` | `6.png`, `7.png` | **Detected** | Wazuh / Suricata |
| **03** | [SQL Injection](Stages/stage-03-sqli.md) | Case 01 | Boolean bypass & UNION extraction | `T1190` | `8.png`, `9.png` | **Detected** | Suricata |
| **04** | [Hash Cracking](Stages/stage-04-hash-crack.md) | Case 01 | Hashcat mode 0 (MD5) | `T1110.002` | `10.png`, `11.png` | **Not Detected** | Offline Gap (`DG-04`) |
| **05** | [Web Shell Upload](Stages/stage-05-webshell.md) | Case 01 | PHP web shell upload & RCE | `T1505.003` | `12.png`–`14.png` | **Detected** | Suricata / Wazuh |
| **06** | [Reverse Shell](Stages/stage-06-reverse-shell.md) | Case 01 | Netcat listener + FIFO reverse shell | `T1059.004` | `15.png`–`17.png` | **Detected** | Wazuh / Suricata |
| **07** | [Privilege Escalation](Stages/stage-07-privesc.md) | Case 01 | Sudo Python GTFOBins root escape | `T1548.003` | `17.png` | **Detected** | Wazuh |
| **08** | [SSH Persistence](Stages/stage-08-ssh-persistence.md) | Case 02 | Ed25519 `authorized_keys` backdoor | `T1098.004` | `18.png`–`20.png` | **Detected** | Wazuh FIM / Syscheck |
| **09** | [Internal Discovery](Stages/stage-09-internal-discovery.md) | Case 02 | Dual NIC enum, Nmap pivot scans | `T1018` | `21.png`–`27.png` | **Detected** | Suricata / Wazuh |
| **10** | [Responder Poisoning](Stages/stage-10-responder.md) | Case 02 | LLMNR/mDNS poisoning on `ens33` | `T1557.001` | `28.png`–`30.png` | **Detected** | Suricata / Wazuh |
| **11** | [NTLMv2 Cracking](Stages/stage-11-ntlmv2-crack.md) | Case 02 | Hashcat mode 5600 (NetNTLMv2) | `T1110.002` | `31.png`, `32.png` | **Not Detected** | Offline Gap (`DG-11`) |
| **12** | [BloodHound Enumeration](Stages/stage-12-bloodhound.md) | Case 02 | `bloodhound.py` + Neo4j / CE Cypher | `T1087.002` | `33.png`–`40.png` | **Detected** | Wazuh / LDAP |
| **13** | [Kerberoasting](Stages/stage-13-kerberoasting.md) | Case 02 | `GetUserSPNs.py` + Hashcat 13100 | `T1558.003` | `41.png`–`44.png` | **Detected** | Wazuh / Win Security |
| **14** | [DCSync](Stages/stage-14-dcsync.md) | Case 02 | `secretsdump.py` DRSUAPI replication | `T1003.006` | `45.png`–`47.png` | **Detected** | Wazuh / Win Security |
| **15** | [Pass-the-Hash](Stages/stage-15-pass-the-hash.md) | Case 03 | `wmiexec.py` with Administrator hash | `T1550.002` | `48.png` | **Detected** | Suricata / Wazuh |
| **16** | [Golden Ticket](Stages/stage-16-golden-ticket.md) | Case 03 | `lookupsid.py`, `ticketer.py`, `wmiexec` | `T1558.001` | `49.png`–`51.png` | **Detected** | Wazuh / Win Security |
| **17** | [DC Persistence](Stages/stage-17-dc-persistence.md) | Case 03 | Rogue `backdoor` Domain Admin user | `T1136.002` | `52.png`, `53.png` | **Detected** | Wazuh (7 Alerts) |
| **18** | [Collection](Stages/stage-18-collection.md) | Case 03 | WMI automated staging & file harvesting | `T1005` | `54.png`, `55.png` | **Detected** | Wazuh / Win Security |
| **19** | [Exfiltration](Stages/stage-19-exfiltration.md) | Case 03 | SCP egress from pivot to Kali | `T1041` | `56.png` | **Detected** | Wazuh Auth |
| **20** | [Impact](Stages/stage-20-impact.md) | Case 03 | Ransomware simulation, defacement, reboot | `T1491.001` | `57.png`–`60.png` | **Detected** | Wazuh / Suricata (10 Alerts) |

---

## Evidence Repositories

The evidence sets below are published in the public repository. The attack screenshots are the original captures from the isolated lab; the master PDF is currently the redacted copy. The unredacted PDF original remains local-only and is ignored via `.gitignore`. The inline image links resolve to the original screenshots.

| Evidence Set | Location | Details |
|---|---|---|
| **Master Blueprint Document** | [`06-Resources/attack-chain-full.pdf`](../06-Resources/attack-chain-full.pdf) (redacted) | Redacted copy of the single-source PDF describing the full attack chain and threat model. |
| **Attacker-Side Screenshots** | [`02-Attack-Simulation/Attack-Screenshots/`](Attack-Screenshots/) (original) | 62 high-resolution screenshots (`1.png` through `60.png`, plus `58.5.png` and `59.5.png`) showing terminal commands, tool executions, browser actions, and GUI validations. |
| **SOC & Alert Screenshots** | [`03-Detection-Engineering/TheHive_Alert-ScreenShot/`](../03-Detection-Engineering/TheHive_Alert-ScreenShot/) | 60 screenshots showing fired alerts, triage views, rule classifications, and event telemetry in TheHive, Wazuh, and Suricata. |
| **Incident Response Screenshots** | `05-Incident-Report/Response_Action-Screenshot/` | No screenshot files are present in this folder. |

---

## Detection Engineering & Gap Analysis

- **Detection Coverage:**
  - **Verified Detections with Alerts:** 16 stages (80.0%)
  - **Inherent Offline Gaps (Zero Telemetry):** 2 stages (10.0% - Stages 04 & 11)
  - **Partial / Protocol Logging Gaps:** 2 stages (10.0% - Stages 09 & 12, where detection occurred on alternative layers: Stage 09 via network IDS promiscuous sweep, Stage 12 via pivot SSH session authentication)
  - **Rule Failures:** 0 stages (0.0%)
  - **Total Stages:** 20
- **Offline Detection Gaps:** 
  - **Stage 04 (Hash Cracking):** Recovering plaintext credentials from extracted MD5 database hashes occurs entirely offline on the attacker's workstation (Kali). No network traffic or host-level telemetry is emitted on victim systems.
  - **Stage 11 (NTLMv2 Cracking):** Cracking captured NetNTLMv2 hashes occurs offline via Hashcat dictionary attacks on the attacker's GPU/CPU.
  - *Mitigation & Upstream Detection:* While offline cracking itself cannot be detected directly at the endpoint, upstream actions (SQL injection in Stage 03, LLMNR poisoning in Stage 10) and downstream use of cracked credentials (SSH in Stage 08, BloodHound in Stage 12) are reliably detected. Full gap analyses are documented in [03-Detection-Engineering/README.md#4-detection-gap-register--blind-spot-analysis](../03-Detection-Engineering/README.md#4-detection-gap-register--blind-spot-analysis).

---

## How Each Stage File Is Structured

Each stage write-up in the [`Stages/`](Stages/) directory adheres to a rigorous, consistent format:

1. **Header Metadata:** Stage number, name, status (`Complete — evidence attached`), case link, investigation link, and evidence links.
2. **Objective:** What the adversary is attempting to achieve at this phase.
3. **Prerequisites & Tooling:** Required credentials, prior stage artifacts, network position, and tools used.
4. **Commands:** Verbatim commands executed during the simulation, with sensitive credentials and hashes safely redacted.
5. **What Happened:** Detailed chronological narrative of the execution, observed outputs, and results.
6. **Evidence:**
   - **Attack Evidence:** Markdown-embedded screenshots from `Attack-Screenshots/`.
   - **Alert Evidence:** Markdown-embedded screenshots from `TheHive_Alert-ScreenShot/` (or explicit Detection Gap reference).
7. **Alert Observed Table:** Alert source, rule description, rule ID, TheHive alert ID, and severity.
8. **MITRE ATT&CK Mapping:** Tactic, Technique, Sub-technique, and ATT&CK ID.
9. **Detection Opportunities:** Blue-team defensive analysis detailing log sources (Sysmon, Windows Event IDs, Suricata signatures, Linux auth logs) and recommended detection logic.
10. **Notes:** Operational caveats, pivoting considerations, and defensive takeaways.
