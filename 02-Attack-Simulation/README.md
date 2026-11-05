# 02 — Attack Simulation: The 20-Stage Attack Campaign

Welcome to the **Attack Simulation** section of the lab! This is the offensive (red team) half of the project.

Over the course of **74 continuous minutes**, I simulated a realistic, 20-stage cyberattack against our hybrid network. The attack starts with an external web probe, escalates to `root` on Linux in 10 seconds, pivots across the network to compromise Active Directory, and finishes with complete domain takeover, data exfiltration, and simulated ransomware.

Every stage writeup includes the attacker's objective, the exact terminal commands typed, screenshots showing what happened on the screen, the defensive alerts triggered in TheHive and Wazuh, and the corresponding MITRE ATT&CK techniques.

---

## 📄 Master Reference & Blueprint

> [!IMPORTANT]
> The primary blueprint for this entire attack campaign is our master attack chain reference document:
> 
> 📄 **[`attack-chain-full.pdf`](../06-Resources/docs/attack-chain-full.pdf) (redacted public version)** *(the unredacted copy is kept safely offline)*
> 
> This document details the threat actor profile, the attack playbook, and the intended path from external reconnaissance through domain compromise and desktop defacement. The individual stage files in this folder show how that plan was executed step-by-step in our isolated lab.

---

## 🗺️ The 3 Acts of the Attack Campaign

[![Attack Simulation 20-Stage Kill Chain Roadmap](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)
*Figure 1: Full 20-stage attack simulation lifecycle mapped across the 3 investigation cases ([view full-size diagram](../06-Resources/diagrams/Attack%20Simulation%2020-Stage%20Kill%20Chain%20Roadmap.png)).*

The 20 attack stages are organized into three clear, sequential acts (matching our three cases in TheHive):

- **[Case 01 — Web Compromise to Root](../04-Investigation/Cases/case-01-web-compromise.md) (Stages 01–07):**  
  The attacker scans our perimeter web server (`192.168.56.30`), uses SQL injection to dump database password hashes, uploads a simple PHP webshell, pops a Netcat reverse shell back to Kali (`192.168.232.135`), and jumps to `root` in 10 seconds via a passwordless sudo Python misconfiguration.
- **[Case 02 — Pivoting & Stealing Active Directory Credentials](../04-Investigation/Cases/case-02-lateral-movement.md) (Stages 08–14):**  
  The attacker adds an SSH backdoor key, discovers the internal Windows subnet (`192.168.56.0/24`), runs Responder on the Linux box to steal the Windows 10 password hash, maps the domain using BloodHound, Kerberoasts account `HANK_SHERMAN`, and abuses its DCSync replication rights to dump every password hash in the domain from the Domain Controller.
- **[Case 03 — Domain Takeover, Data Theft & Impact](../04-Investigation/Cases/case-03-domain-compromise.md) (Stages 15–20):**  
  The attacker uses Pass-the-Hash and forges a Kerberos Golden Ticket (`krbtgt`) for permanent god-mode access, creates a backdoor Domain Admin user (`AD\backdoor`), steals sensitive files over SSH, defaces user desktops with a custom wallpaper, drops simulated ransomware notes, and forcibly reboots both machines.

---

## 📋 Complete Stage Index & Traceability Matrix

| # | Stage | Case | Primary Tool / Attack Vector | ATT&CK ID | Attack Screenshot | Detection Verdict | Alert Source |
|:---:|---|:---:|---|---|:---:|:---:|---|
| **01** | [Reconnaissance](Stages/stage-01-recon.md) | Case 01 | Nmap, Nikto, Dirbuster, WhatWeb | `T1595.001` | `1.png`–`5.png` | **Detected** | Suricata Gateway (SIDs `3400001`, `3400002` / `wzb-3a8045a03c`) |
| **02** | [Brute Force](Stages/stage-02-bruteforce.md) | Case 01 | Custom Python script + RockYou list | `T1110.001` | `6.png`, `7.png` | **Detected** | Suricata SID `2017515` + Custom Wazuh Rule `100600` / Rule `100200` (`wzb-6a22425401`) |
| **03** | [SQL Injection](Stages/stage-03-sqli.md) | Case 01 | UNION SELECT database extraction | `T1190` | `8.png`, `9.png` | **Detected** | Suricata SID `2010963` + Custom Wazuh Rule `100600` (`wzb-6a22425401`) |
| **04** | [Hash Cracking](Stages/stage-04-hash-crack.md) | Case 01 | Hashcat mode 0 (MD5) | `T1110.002` | `10.png`, `11.png` | **Investigatively Attributed** | Ran offline on attacker GPU (`DG-04`) — Caught upstream in 03 & downstream in 05 |
| **05** | [Web Shell Upload](Stages/stage-05-webshell.md) | Case 01 | PHP webshell upload & command execution | `T1505.003` | `12.png`–`14.png` | **Detected** | Linux Auditd Rule `100199` (`wzb-61ed72e937`) & Suricata SIDs `2011768`, `2020102`, `2019284` |
| **06** | [Reverse Shell](Stages/stage-06-reverse-shell.md) | Case 01 | Netcat listener + FIFO reverse shell | `T1059.004` | `15.png`–`17.png` | **Detected** | Suricata SID `3400020` & Auditd `nc.openbsd` Rule `100199` (`wzb-ccae331b77`) |
| **07** | [Privilege Escalation](Stages/stage-07-privesc.md) | Case 01 | Sudo Python GTFOBins root escape | `T1548.003` | `17.png` | **Detected** | Linux PAM Rule `5402` (12x sudo alerts) & Rule `100220` (`sudo -l`) |
| **08** | [SSH Persistence](Stages/stage-08-ssh-persistence.md) | Case 02 | Ed25519 `authorized_keys` backdoor | `T1098.004` | `18.png`–`20.png` | **Detected** | Wazuh SSH Rule `5715` and Rule `100220` (`wzb-1208f0ea54`) |
| **09** | [Internal Discovery](Stages/stage-09-internal-discovery.md) | Case 02 | Pivot subnet sweep via Nmap | `T1018` | `21.png`–`27.png` | **Target Logging Gap (DG-09)** | Suricata NIDS `ens37` (Alerts #17–#19) & Wazuh Rule `100220` on pivot; target Windows firewall drops unlogged |
| **10** | [Responder Poisoning](Stages/stage-10-responder.md) | Case 02 | LLMNR/mDNS poisoning on pivot interface | `T1557.001` | `28.png`–`30.png` | **Detected** | Wazuh Rule `100220` (`Responder.py`) + Win10User EID 4688 `DavSetCookie` (Rule `100278`) |
| **11** | [NTLMv2 Cracking](Stages/stage-11-ntlmv2-crack.md) | Case 02 | Hashcat mode 5600 (NetNTLMv2) | `T1110.002` | `31.png`, `32.png` | **Investigatively Attributed** | Ran offline on attacker GPU (`DG-11`) — Caught upstream in 10 & downstream in 12 |
| **12** | [BloodHound Recon](Stages/stage-12-bloodhound.md) | Case 02 | `bloodhound-python` LDAP domain scan | `T1087.002` | `33.png`–`40.png` | **Target Logging Gap (DG-12)** | Linux Pivot Wazuh Rule `100220` + Alert #22 (`wzb-1d2d7fb4b8`); DC EID 1644 LDAP logging unconfigured |
| **13** | [Kerberoasting](Stages/stage-13-kerberoasting.md) | Case 02 | `GetUserSPNs.py` + Hashcat 13100 | `T1558.003` | `41.png`–`44.png` | **Detected** | Suricata `ens37` (SID `2019922` / `wzb-c1e2642eb2`) & Wazuh Rule `100220` |
| **14** | [DCSync](Stages/stage-14-dcsync.md) | Case 02 | `secretsdump.py` DRSUAPI replication | `T1003.006` | `45.png`–`47.png` | **Pivot-Only Coverage (DG-14)** | Linux Pivot Wazuh Rule `100220` (`secretsdump.py`) + Alert #24 (`wzb-4174e3672e`); DC EID 4662 SACL unconfigured |
| **15** | [Pass-the-Hash](Stages/stage-15-pass-the-hash.md) | Case 03 | `wmiexec.py` with Administrator hash | `T1550.002` | `48.png` | **Detected** | Windows EID `4624` (Rule `92657`) & Sysmon Custom Rule `100613` (`wzb-b7f91cd3ab`) |
| **16** | [Golden Ticket](Stages/stage-16-golden-ticket.md) | Case 03 | `lookupsid.py`, `ticketer.py`, `wmiexec` | `T1558.001` | `49.png`–`51.png` | **Pivot-Only Coverage (DG-16)** | Linux Pivot Wazuh Rule `100220` (`ticketer.py`) + Alerts #27, #28 on `wmiexec -k` (Sysmon EID 1 / Custom Rule `100613`); DC EID 4769 unconfigured |
| **17** | [DC Persistence](Stages/stage-17-dc-persistence.md) | Case 03 | Rogue `backdoor` Domain Admin user | `T1136.002` | `52.png`, `53.png` | **Detected** | Wazuh Custom Rule `100613`, Windows EID `4720` (60109), EID `4732` (60154), EID `4728` (60159), EID `4738` (60110) (7 Alerts) |
| **18** | [Collection](Stages/stage-18-collection.md) | Case 03 | WMI automated staging & file harvesting | `T1005` | `54.png`, `55.png` | **Detected** | Sysmon EID 1 (Custom Rule `100613`, Rules `100271`, `100272`, `100275`, Alerts #35, #36) |
| **19** | [Exfiltration](Stages/stage-19-exfiltration.md) | Case 03 | SCP exfiltration from pivot to Kali | `T1041` | `56.png` | **Detected** | Wazuh SSH Rule `5715` (Logon burst: 6 sessions / 0.57s; Alert #37 `wzb-34f34a857c`) |
| **20** | [Impact](Stages/stage-20-impact.md) | Case 03 | Wallpaper defacement, ransom notes, reboots | `T1491.001` | `57.png`–`60.png` | **Detected** | Sysmon EID 1 (Rule `92041`: `reg.exe` & Custom Rule `100613`) / System EID 1074 (8 Alerts) |

---

## 📸 Where to Find the Evidence

All visual proof, commands, and alerts are organized across the resources directory:

| Evidence Type | Folder Link | What's Inside |
|---|---|---|
| **Attacker Terminal Screenshots** | [`../06-Resources/screenshots/attack-simulation/`](../06-Resources/screenshots/attack-simulation/) | 62 original screenshots (`1.png` to `60.png`) showing actual commands typed, tool screens, browser responses, and desktop results. |
| **Defensive Alert Screenshots** | [`../06-Resources/screenshots/thehive-alert/`](../06-Resources/screenshots/thehive-alert/) | 60 screenshots showing the real alerts that fired in TheHive, Wazuh, and Suricata as the attack unfolded. |
| **Containment Proof Screenshots** | [`../06-Resources/screenshots/initial-triage-action/`](../06-Resources/screenshots/initial-triage-action/) & [`../06-Resources/screenshots/deep-investigation-action/`](../06-Resources/screenshots/deep-investigation-action/) | 26 before-and-after screenshots proving services were terminated, accounts were locked, and files were securely shredded. |

---

## 🎯 What Each Stage File Contains

To make following along simple, every single stage guide in the [`Stages/`](Stages/) folder follows the exact same clean layout:

1. **Header & Navigation:** Fast links to the parent case, deep-dive investigation narrative, and evidence screenshots.
2. **The Objective:** What the attacker was trying to accomplish in simple, practical terms.
3. **Commands Executed:** The verbatim commands typed in the terminal, with real payloads and parameters.
4. **What Actually Happened:** A play-by-play explanation of the command output and what changed on the target machine.
5. **Visual Evidence:** Clear screenshots of the attack in progress and the defensive alerts that triggered.
6. **Defensive Analysis & Detection Opportunities:** What rules caught it, what logs to look for in your own environment (Sysmon, Event IDs, Auditd), and how to prevent it.
