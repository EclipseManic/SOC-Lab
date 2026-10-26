# Case 02 — Lateral Movement and Credential Access

> **Status:** Draft, not yet validated  
> **TheHive case ID:** `CAS-002-LATMOVE`  
> **Severity:** Critical  
> **TLP / PAP:** `TLP:AMBER / PAP:AMBER`  

---

## Summary

Following root privilege escalation on the DVWA host (`192.168.56.30`), the adversary established persistence by writing an SSH public key to `/root/.ssh/authorized_keys` and logging in interactively. Using DVWA as an internal pivot, the attacker performed internal subnet reconnaissance against `192.168.56.0/24`, deployed Responder to capture NetNTLMv2 credentials from `DomainWin10` (`192.168.56.20`), and cracked the `win10` hash offline. Using the recovered domain account, the adversary ran BloodHound/SharpHound LDAP enumeration against Domain Controller `PC-DC` (`192.168.56.10`), identified high-privilege SPN account `HANK_SHERMAN`, executed Kerberoasting to obtain and crack the service ticket, and performed DCSync replication via DRSUAPI to dump all domain password hashes including `krbtgt`.

---

## Scope

| Stage | Attack | Investigation | Detection Status |
|---|---|---|---|
| 08 | [SSH persistence](../../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | [stage-08](../Stages/stage-08-ssh-persistence.md) | **Detected** (Wazuh Rule 5715 Level 8 & Rule 100215) |
| 09 | [Internal discovery](../../02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | [stage-09](../Stages/stage-09-internal-discovery.md) | **Logging gap** (Suricata SID 3400001, 3400002 on ens37; DG-09) |
| 10 | [Responder poisoning](../../02-Attack-Simulation/Stages/stage-10-responder.md) | [stage-10](../Stages/stage-10-responder.md) | **Detected** (Wazuh bashcmd (uid:0 Responder.py execution on pivot)) |
| 11 | [NTLMv2 cracking](../../02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | [stage-11](../Stages/stage-11-ntlmv2-crack.md) | **Detection gap** (DG-11: Inherent offline cracking) |
| 12 | [BloodHound enumeration](../../02-Attack-Simulation/Stages/stage-12-bloodhound.md) | [stage-12](../Stages/stage-12-bloodhound.md) | **Detected** (Wazuh Rule 5715 pivot logon alerted; DG-12) |
| 13 | [Kerberoasting](../../02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | [stage-13](../Stages/stage-13-kerberoasting.md) | **Detected** (Suricata SID 2019922 wire alert & Wazuh Rule 5715) |
| 14 | [DCSync](../../02-Attack-Simulation/Stages/stage-14-dcsync.md) | [stage-14](../Stages/stage-14-dcsync.md) | **Detected** (Wazuh Rule 5715 pivot logon alerted in TheHive) |

---

## Detection sources

| Source | What it contributed |
|---|---|
| **Suricata** | Dual-interface NIDS: promiscuous capture on `ens37` observed internal subnet port sweeps from DVWA (SIDs 3400001, 3400002, 3400020) and Kerberos TGS-REQ wire frames during Kerberoasting (SID 2019922). |
| **Wazuh** | Monitored Linux authentication on DVWA: authorized_keys modification (Rule 100215) and interactive root SSH logons (Rule 5715 elevated to Level 8) providing end-to-end pivot visibility. Monitored Windows domain member events. |
| **TheHive** | Aggregated pivot logons and network IDS alerts into correlated incident cases. |
| **Velociraptor** | Queried Active Directory audit events, inspected `/root/.ssh/authorized_keys` and `/tmp/hank.hash` on DVWA pivot. |

---

## Timeline

| Time | Event | Source | Evidence |
|---|---|---|---|
| T+18m | Attacker public key added to /root/.ssh/authorized_keys | Wazuh Auditd | [Attack 26](../../02-Attack-Simulation/Attack-Screenshots/18.png) · [Alert 07](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/7.png) |
| T+20m | Inbound root SSH interactive session established from Kali | Wazuh SSHD | [Attack 26](../../02-Attack-Simulation/Attack-Screenshots/18.png) · [Alert 07](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/7.png) |
| T+23m | Internal subnet discovery sweep against 192.168.56.0/24 | Suricata (`ens37`) | [Attack 29](../../02-Attack-Simulation/Attack-Screenshots/21.png) · [Alert 08](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/8.png) |
| T+27m | Responder LLMNR/NBT-NS poisoning capturing win10 NetNTLMv2 hash | Suricata / Wazuh | [Attack 33](../../02-Attack-Simulation/Attack-Screenshots/28.png) · [Alert 09](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/9.png) |
| T+30m | Offline Hashcat NetNTLMv2 hash cracking on Kali | Offline GPU | [Attack 36](../../02-Attack-Simulation/Attack-Screenshots/31.png) · DG-11 |
| T+34m | BloodHound/SharpHound LDAP query volume from DVWA to DC | Wazuh SSHD | [Attack 38](../../02-Attack-Simulation/Attack-Screenshots/33.png) · [Alert 10](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/10.png) |
| T+38m | Kerberoasting TGS-REQ requested for HANK_SHERMAN SPN | Suricata / Wazuh | [Attack 41](../../02-Attack-Simulation/Attack-Screenshots/41.png) · [Alert 11](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/11.png) |
| T+42m | DCSync replication dumping domain hashes via DRSUAPI | Wazuh SSHD | [Attack 46](../../02-Attack-Simulation/Attack-Screenshots/45.png) · [Alert 12](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/12.png) |

---

## Observables

| Type | Value | Context |
|---|---|---|
| **Pivot IP** | `192.168.56.30` | Compromised DVWA host used as operational pivot |
| **Domain Member** | `192.168.56.20` (`Win10User`) | Workstation poisoned by Responder |
| **Domain Controller** | `192.168.56.10` (`PC-DC.ad.lab`) | Target of LDAP, Kerberoasting, and DCSync attacks |
| **Account** | `ad.lab\win10` | Compromised domain workstation user account |
| **Account** | `ad.lab\HANK_SHERMAN` | Kerberoasted Domain Admin service account |
| **Secret** | `krbtgt` NTLM hash | Replicated domain master key |

---

## Tasks

- [x] Triage SSH persistence and root authentication alerts on DVWA pivot
- [x] Disable LLMNR and NetBIOS over TCP/IP across domain workstations via GPO
- [x] Force immediate domain-wide password reset for `win10` and `HANK_SHERMAN`
- [x] Remove SPN registration from high-privilege accounts (`HANK_SHERMAN`)
- [x] Enable NTDS diagnostic logging (`15 Field Engineering` = 5) to alert on LDAP search volume
- [x] Initiate double `krbtgt` password reset procedure to invalidate all Kerberos tickets

---

## Detection performance

| Metric | Value |
|---|---|
| **Stages Executed** | 7 |
| **Verified Detections with Alerts** | 6 (85.7%) |
| **Inherent Offline Gaps** | 1 (14.3% - Stage 11) |
| **Logging / Diagnostic Gaps** | 2 (Stages 09, 12 - both detected via alternative sensor layers) |
| **Rule Failures** | 0 |

---

## Verdict

**True Positive.** Critical compromise of the Active Directory domain fabric. The attacker successfully escalated from the Linux web pivot into full Tier Zero domain dominance via Kerberoasting and DCSync directory replication.
