# Case 03 — Domain Compromise and Impact

> **Status:** Closed / Validated  
> **TheHive case ID:** `CAS-003-DOMIMP`  
> **Severity:** Critical  
> **TLP / PAP:** `TLP:AMBER / PAP:AMBER`  
> **Master Incident Tag:** `INC-2026-1018-ALPHA`  
> **Linked Alerts:** 22 Ingested Alerts (Alerts #25 through #46)  
> **Eradication Playbook:** [`Eradication-Hardening-and-Recovery.md`](../Eradication-Hardening-and-Recovery.md#9-step-7-thehive-46-alert-queue-disposition--3-case-resolution-management)

![TheHive Case 03 Closed](../../06-Resources/screenshots/thehive-cases/thehive_case03_closed.png)  
*Figure 1: TheHive 5 Case Record for `CAS-003-DOMIMP` showing 22 linked alerts, forest-wide identity hardening, and formal closure verdict.*  

---

## Summary

Armed with the dumped domain NTLM hashes from DCSync, the adversary executed Pass-the-Hash lateral movement over SMB (`445/TCP`) to compromise `PC-DC` (`192.168.56.10`, monitored by Wazuh agent `DomainWin10`) at `18:04:46 IST`, generating Windows Security Event ID 4624 Type 3 NTLM logon alerts in Wazuh. At `18:06:40 IST`, the adversary forged an unauthorized Kerberos Ticket-Granting Ticket (Golden Ticket) using the compromised `krbtgt` key (`611a8cdcc21cb3fe3bf3a4c2f4e05f60`). To maintain persistent administrative access, the attacker created a rogue domain user (`backdoor`) with password `P@ssw0rd123!` via Impacket `wmiexec` on `PC-DC` and added the user to `Domain Admins`. Automated collection commands harvested sensitive system configurations and user data across both hosts (`domain_users.txt`, `admin_info.txt`, `sensitive_data.txt`), which was rapidly exfiltrated back to Kali via SCP (6 SSH sessions in 570ms). Finally, the adversary deployed internal defacement commands pushing `hacked.bmp` to `C:\Users\Public\hacked.bmp`, modifying desktop wallpaper registry keys, dropping `README_HACKED.txt` and simulated `.enc` ransomware files, and executing `shutdown /r /t 0` forced reboots across both domain endpoints.

---

## Scope

| Stage | Attack | Investigation | Detection Status |
|---|---|---|---|
| 15 | [Pass-the-Hash](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | [Phase 5 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Detected** (Windows EID 4624 Logon Type 3 NTLM / Wazuh Rule 100613) |
| 16 | [Golden Ticket](../../02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | [Phase 5 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Detected** (PC-DC Custom Rule 100603, Rule 100615 & TheHive Alerts #27, #28) |
| 17 | [DC persistence](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | [Phase 6 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Detected** (Wazuh Rule 100613 fan-out: net user /add, net localgroup) |
| 18 | [Collection](../../02-Attack-Simulation/Stages/stage-18-collection.md) | [Phase 6 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Detected** (Wazuh Rule 100613 fan-out & Sysmon EID 1 staging) |
| 19 | [Exfiltration](../../02-Attack-Simulation/Stages/stage-19-exfiltration.md) | [Phase 6 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-6-backdoors--smuggling-domain-persistence--rapid-exfiltration) | **Detected** (Wazuh Rule 5715 rapid SSH burst: 6 sessions/0.57s; Alert #37) |
| 20 | [Impact](../../02-Attack-Simulation/Stages/stage-20-impact.md) | [Phase 7 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-7-the-final-punch-simulated-ransomware-defacement--forced-reboots) | **Detected** (Wazuh Rule 100613 fan-out, Sysmon EID 1, & Suricata SIDs 2067085–87) |

---

## Detection sources

| Source | What it contributed |
|---|---|
| **Wazuh** | Windows Agent on DomainWin10 (`PC-DC`) alerted on Pass-the-Hash NTLM Type 3 logons (Event ID 4624). Windows Agent alerted on rogue user creation (Rule 60108, EID 4720) and Domain Admins membership addition (Rule 60109, EID 4728). Process fan-out correlation (Rule 100613) grouped Impacket wmiexec commands. Linux SSH logon rate correlation (Rule 5715) detected rapid exfiltration burst (6 sessions in 0.57s). On the DVWA pivot, Wazuh Rule 100220 (`bashcmd`) captured verbatim command invocations across rows 9304–9501 in `Wazuh-Raw-Alerts.csv` (Pass-the-Hash WMI, ticketer.py Golden Ticket forgery, export KRB5CCNAME, staged loot verification, and lateral impact fan-outs). |
| **Sysmon** | Process creation monitoring (EID 1) traced `wmiprvse.exe` -> `cmd.exe /Q /c` fan-outs. Registry modification monitoring (EID 13) recorded desktop wallpaper tampering. File staging tracked in `C:\Windows\Temp\`. |
| **Suricata** | Monitored perimeter network sessions and inter-subnet SMB/RPC traffic; promiscuous capture on `ens37` flagged SMB NTLM Session Setup negotiations (SIDs 2067085–2067087, alert `wzb-7a4a134d1b`) during Stage 20 remote execution against Win10. |
| **TheHive** | Aggregated correlated security events into actionable incident tasks and timeline observables. |
| **Velociraptor** | Performed forensic timeline recovery of rogue user creation, registry values, and file exfiltration staging paths. |

---

## Timeline

| Time (IST) | Event | Source | Evidentiary Alert Capture |
|---|---|---|---|
| `18:04:46` | Pass-the-Hash remote logon Type 3 via NtLmSsp to PC-DC | Wazuh (PC-DC) | [`wzb-35-pth-wazuh-eid4624-detection.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-35-pth-wazuh-eid4624-detection.jpg) |
| `18:06:40` | Forged Kerberos TGT (Golden Ticket) generated on pivot host via ticketer.py | Wazuh Rule 5715 / Rule 100220 (`ticketer.py`) | [`wzb-38-goldenticket-auditd-ticketer-forgery.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-38-goldenticket-auditd-ticketer-forgery.jpg) |
| `18:08:21` | Rogue user `backdoor` created (`P@ssw0rd123!`) and added to Domain Admins (`18:09:05`) | Wazuh / Sysmon | [`wzb-46-persist-wazuh-dc-domain-admins-add.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-46-persist-wazuh-dc-domain-admins-add.jpg) |
| `18:13:58` | Automated DC host data collection (`domain_users.txt`, `admin_info.txt`) | Wazuh / Sysmon | [`wzb-49-staging-sysmon-dc-domain-users-txt.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-49-staging-sysmon-dc-domain-users-txt.jpg) |
| `18:15:00` | Automated Win10 user document collection (`sensitive_data.txt`) | Win10 Sysmon | [`wzb-51-staging-sysmon-dc-sensitive-data-txt.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-51-staging-sysmon-dc-sensitive-data-txt.jpg) |
| `18:17:30` | Rapid administrative SSH burst exfiltrating staged files via SCP (6 sessions) | Wazuh SSHD | [`wzb-53-exfil-wazuh-sshd-rapid-sessions-burst.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-53-exfil-wazuh-sshd-rapid-sessions-burst.jpg) |
| `18:20:00` | Impacket wmiexec fan-out: wallpaper registry defacement, ransom notes & reboot on DC | Wazuh / Sysmon | [`wzb-55-impact-wazuh-dc-wallpaper-registry-add.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-55-impact-wazuh-dc-wallpaper-registry-add.jpg) |
| `18:21:04` | Workstation lateral fan-out: wallpaper defacement, ransom notes & forced reboot on Win10 | Wazuh / Sysmon | [`wzb-60-impact-auditd-workstation-wmiexec-fanout.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-60-impact-auditd-workstation-wmiexec-fanout.jpg) |

---

## Observables

| Type | Value | Context |
|---|---|---|
| **Account** | `AD.LAB\Administrator` | Target of Pass-the-Hash remote logon |
| **Account** | `AD.LAB\backdoor` | Rogue administrative user created for persistence (Password: `P@ssw0rd123!`) |
| **Files** | `domain_users.txt`, `admin_info.txt` | Staged DC user directories and token exports in `C:\Windows\Temp\` |
| **File** | `sensitive_data.txt` | Staged confidential documents from `C:\Users\win10\Documents\Sensitive\*` |
| **Defacement** | `hacked.bmp` | Malicious bitmap copied to `C:\Users\Public\hacked.bmp` and set as wallpaper |
| **Ransom Note** | `README_HACKED.txt` | Extortion note dropped on Administrator and Win10 user desktops |
| **Dummy Encrypted** | `passwords.enc`, `documents.enc` | Simulated ransomware payload artifacts |

---

## Tasks

- [x] Isolate external adversary IP `192.168.232.135` via iptables on the Gateway
- [x] Terminate unauthorized WMI remote execution sessions (`taskkill /F /IM cmd.exe`)
- [x] Disable rogue domain account `AD\backdoor` during containment to preserve SID for forensic timeline
- [x] Permanently eradicate rogue account `AD\backdoor` via `Remove-ADUser` during eradication phase
- [x] Strip `AD\backdoor` and `HANK_SHERMAN` from Domain Admins and Administrators groups
- [x] Enroll `Administrator` and `HANK_SHERMAN` into Active Directory `Protected Users` security group
- [x] Securely shred staged data files (`domain_users.txt`, `admin_info.txt`, `sensitive_data.txt`, `hacked.bmp`)
- [x] Revert desktop wallpaper registry keys (`Wallpaper` and `WallpaperStyle`) and refresh UI parameters
- [x] Perform dual `krbtgt` password resets (KVNO 3) to purge forged Kerberos Golden Tickets
- [x] Implement DMZ egress micro-segmentation rejecting outbound Windows AD ports from `192.168.56.30`

---

## Detection performance

| Metric | Value |
|---|---|
| **Stages Executed** | 6 |
| **Verified Detections with Alerts** | 6 (100%) |
| **Mean Time to Detect (MTTD)** | < 10 seconds across all remote execution and account changes |
| **Rule Failures** | 0 |

---

## Verdict

**True Positive.** Total enterprise domain compromise. The adversary achieved Tier Zero Active Directory dominance, established persistent backdoor administration, harvested and exfiltrated confidential internal data, and executed simultaneous dual-endpoint desktop defacement and forced system restarts.
