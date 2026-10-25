# Case 03 — Domain Compromise and Impact

> **Status:** Closed (Resolved)  
> **TheHive case ID:** `CAS-003-DOMIMP`  
> **Severity:** Critical  
> **TLP / PAP:** `TLP:AMBER / PAP:AMBER`  

---

## Summary

Armed with the dumped domain NTLM hashes from DCSync, the adversary executed Pass-the-Hash lateral movement over SMB (`445/TCP`) to compromise `Win10User` (`192.168.56.20`) and `DomainWin10` (`192.168.56.10`), generating 24+ high-fidelity Windows Security Event ID 4624 Type 3 NTLM logon alerts in Wazuh. The adversary then forged an unauthorized Kerberos Ticket-Granting Ticket (Golden Ticket) using the compromised `krbtgt` key. To maintain persistent administrative access, the attacker created a rogue domain user (`backdoor_admin`) via Impacket `wmiexec` on `PC-DC` (`192.168.56.10`) and added the user to `Domain Admins`. Automated collection commands harvested sensitive system configurations into `/tmp/data.tar.gz`, which was rapidly exfiltrated back to Kali via SCP. Finally, the adversary deployed internal defacement commands modifying desktop wallpaper across domain workstations to assert total compromise.

---

## Scope

| Stage | Attack | Investigation | Detection Status |
|---|---|---|---|
| 15 | [Pass-the-Hash](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) | [stage-15](../Stages/stage-15-pass-the-hash.md) | **Detected** (Windows EID 4624 (24x in CSV) / Wazuh Rule 100613) |
| 16 | [Golden Ticket](../../02-Attack-Simulation/Stages/stage-16-golden-ticket.md) | [stage-16](../Stages/stage-16-golden-ticket.md) | **Detected** (Wazuh Rule 5715 pivot logon alerted in TheHive) |
| 17 | [DC persistence](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md) | [stage-17](../Stages/stage-17-dc-persistence.md) | **Detected** (Wazuh Rule 100613 fan-out, EID 4720/4728) |
| 18 | [Collection](../../02-Attack-Simulation/Stages/stage-18-collection.md) | [stage-18](../Stages/stage-18-collection.md) | **Detected** (Wazuh Rule 100613 fan-out & Auditd archive staging) |
| 19 | [Exfiltration](../../02-Attack-Simulation/Stages/stage-19-exfiltration.md) | [stage-19](../Stages/stage-19-exfiltration.md) | **Detected** (Wazuh Rule 5715 rapid SSH burst: 6 sessions/1s; DG-19) |
| 20 | [Impact](../../02-Attack-Simulation/Stages/stage-20-impact.md) | [stage-20](../Stages/stage-20-impact.md) | **Detected** (Wazuh Rule 100613 process fan-out & Sysmon EID 1/13) |

---

## Detection sources

| Source | What it contributed |
|---|---|
| **Wazuh** | Windows Agent on DomainWin10 alerted on Pass-the-Hash NTLM Type 3 logons (Rule 60122, 24+ events). Windows Agent on PC-DC alerted on rogue user creation (Rule 60108, EID 4720) and Domain Admins membership addition (Rule 60109, EID 4728). Process fan-out correlation (Rule 100613) grouped Impacket wmiexec commands. Linux SSH logon rate correlation (Rule 5715) detected rapid exfiltration burst (6 sessions in 1s). |
| **Sysmon** | Process creation monitoring (EID 1) traced `wmiprvse.exe` -> `cmd.exe /Q /c` fan-outs. Registry modification monitoring (EID 13) recorded desktop wallpaper tampering. |
| **Suricata** | Monitored perimeter network sessions and inter-subnet SMB/RPC traffic. |
| **TheHive** | Aggregated correlated security events into actionable incident tasks and timeline observables. |
| **Velociraptor** | Performed forensic timeline recovery of rogue user creation, registry values, and file exfiltration staging paths. |

---

## Timeline

| Time | Event | Source | Evidence |
|---|---|---|---|
| T+45m | Pass-the-Hash remote logon Type 3 via NtLmSsp to DomainWin10 | Wazuh (Win10) | [Attack 50](../../02-Attack-Simulation/Attack-Screenshots/48.png) · [Alert 13](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/13.png) |
| T+48m | Forged Kerberos TGT (Golden Ticket) generated on pivot host | Wazuh SSHD | [Attack 54](../../02-Attack-Simulation/Attack-Screenshots/49.png) · [Alert 14](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/14.png) |
| T+52m | Rogue user `backdoor_admin` created and added to Domain Admins | Wazuh (PC-DC) | [Attack 58](../../02-Attack-Simulation/Attack-Screenshots/52.png) · [Alert 15](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/15.png) |
| T+55m | Automated host data collection commands and tar archive staging | Wazuh / Sysmon | [Attack 62](../../02-Attack-Simulation/Attack-Screenshots/54.png) · [Alert 16](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/16.png) |
| T+58m | Rapid administrative SSH burst exfiltrating /tmp/data.tar.gz via SCP | Wazuh SSHD | [Attack 66](../../02-Attack-Simulation/Attack-Screenshots/56.png) · [Alert 17](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/17.png) |
| T+62m | Impacket wmiexec fan-out altering desktop wallpaper registry keys | Wazuh / Sysmon | [Attack 70](../../02-Attack-Simulation/Attack-Screenshots/57.png) · [Alert 18](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/18.png) |

---

## Observables

| Type | Value | Context |
|---|---|---|
| **Account** | `Administrator` | Target of Pass-the-Hash remote logon |
| **Account** | `backdoor_admin` | Rogue administrative user created for persistence |
| **File** | `/tmp/data.tar.gz` | Exfiltrated staging archive containing system configurations |
| **Registry Key** | `HKCU\Control Panel\Desktop\Wallpaper` | Tampered wallpaper setting |
| **Process** | `wmiprvse.exe -> cmd.exe /Q /c` | Process ancestry for Impacket wmiexec commands |
| **Host** | `192.168.56.20` & `192.168.56.10` | Compromised domain member and Domain Controller |

---

## Tasks

- [x] Isolate `DomainWin10` and `PC-DC` from the production network segment
- [x] Terminate all active WMI and SMB sessions originating from `192.168.56.30`
- [x] Delete rogue domain account `backdoor_admin` and audit all group memberships
- [x] Perform two successive resets of the `krbtgt` account password (separated by 10 hours)
- [x] Revert tampered registry keys and restore corporate desktop configuration
- [x] Re-image compromised DVWA server and rebuild domain workstations from known baselines

---

## Detection performance

| Metric | Value |
|---|---|
| **Stages Executed** | 6 |
| **Verified Detections with Alerts** | 6 (100.0%) |
| **Inherent Offline Gaps** | 0 |
| **Encrypted Transport Gaps** | 1 (Stage 19 - detected via host session rate correlation) |
| **Rule Failures** | 0 |

---

## Verdict

**True Positive.** Full enterprise domain takeover culminating in rogue administrative persistence, data exfiltration, and desktop impact. Complete containment and domain forest recovery procedures executed successfully.
