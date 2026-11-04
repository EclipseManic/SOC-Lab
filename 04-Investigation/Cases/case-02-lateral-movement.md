# Case 02 — Lateral Movement and Credential Access

> **Status:** Closed / Validated  
> **TheHive case ID:** `CAS-002-LATMOVE`  
> **Severity:** Critical  
> **TLP / PAP:** `TLP:AMBER / PAP:AMBER`  
> **Master Incident Tag:** `INC-2026-1018-ALPHA`  
> **Linked Alerts:** 8 Ingested Alerts (Alerts #16, #17, #19–#24)  
> **Eradication Playbook:** [`Eradication-Hardening-and-Recovery.md`](../Eradication-Hardening-and-Recovery.md#5-step-3-active-directory-account-eradication-privileged-demotion--kerberos-invalidation-pc-dc)

![TheHive Case 02 Closed](../../06-Resources/screenshots/thehive-cases/thehive_case02_closed.png)  
*Figure 1: TheHive 5 Case Record for `CAS-002-LATMOVE` showing 8 linked alerts, pivot eradication verification, and formal closure verdict.*  

---

## Summary

Following root privilege escalation on the DVWA host (`192.168.56.30`), the adversary established persistence by writing an ED25519 SSH public key to `/root/.ssh/authorized_keys` and logging in interactively. Using DVWA as an internal pivot, the attacker performed internal subnet reconnaissance against `192.168.56.0/24`, deployed Responder to capture NetNTLMv2 credentials from `Win10User` (`192.168.56.20`), and cracked the `win10` hash offline (`Secur3Lab!`). Using the recovered domain account, the adversary ran BloodHound LDAP enumeration against Domain Controller `PC-DC` (`192.168.56.10`, monitored by Wazuh agent `DomainWin10`), identified high-privilege SPN account `HANK_SHERMAN` (populated in `Domain Admins`), executed Kerberoasting to obtain and crack the service ticket (`Password123`), and performed DCSync replication via DRSUAPI to dump all domain password hashes including `krbtgt` (`...f4e05f60`).

---

## Scope

| Stage | Attack | Investigation | Detection Status |
|---|---|---|---|
| 08 | [SSH persistence](../../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) | [Phase 3 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | **Detected** (Wazuh Rule 550 [FIM] & Rule 5715 [SSH Auth], with Rule 100220 host shell capture) |
| 09 | [Internal discovery](../../02-Attack-Simulation/Stages/stage-09-internal-discovery.md) | [Phase 3 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-3-making-themselves-at-home-ssh-persistence--finding-windows) | **Logging gap** (Suricata SID 3400001, 3400002 on ens37; DG-09) |
| 10 | [Responder poisoning](../../02-Attack-Simulation/Stages/stage-10-responder.md) | [Phase 4 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Detected** (Wazuh bashcmd: uid:0 Responder.py execution on pivot) |
| 11 | [NTLMv2 cracking](../../02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) | [Phase 4 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Detection gap** (DG-11: Inherent offline cracking) |
| 12 | [BloodHound enumeration](../../02-Attack-Simulation/Stages/stage-12-bloodhound.md) | [Phase 4 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-4-poisoning-the-well-stealing-windows-passwords-with-responder) | **Pivot-Only Coverage** (Wazuh Rule 5715 pivot logon alerted; technique captured via host Rule 100220; DG-12) |
| 13 | [Kerberoasting](../../02-Attack-Simulation/Stages/stage-13-kerberoasting.md) | [Phase 5 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Detected** (Suricata SID 2019922 wire alert & Wazuh Rule 5715 & Rule 100220) |
| 14 | [DCSync](../../02-Attack-Simulation/Stages/stage-14-dcsync.md) | [Phase 5 Deep Dive](../Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket) | **Pivot-Only Coverage** (Wazuh Rule 5715 pivot logon alerted; technique captured via host Rule 100220; DC EID 4662 unforwarded) |

---

## Detection sources

| Source | What it contributed |
|---|---|
| **Suricata** | Dual-interface NIDS: promiscuous capture on `ens37` observed internal subnet port sweeps from DVWA (SIDs 3400001, 3400002, 3400020) and Kerberos TGS-REQ wire frames during Kerberoasting (SID 2019922 `ET EXPLOIT Possible GoldenPac Priv Esc in-use`). |
| **Wazuh** | Monitored Linux authentication on DVWA: authorized_keys modification (Rule 550 FIM & Rule 100220 host shell capture) and interactive root SSH logons (Rule 5715 elevated to Level 8) providing end-to-end pivot visibility. In addition, Wazuh's custom host shell auditing pipeline (`bashcmd` / Rule 100220 Level 5) captured verbatim adversary commands on the pivot host across rows 9139–9286 in `Wazuh-Raw-Alerts.csv` (nmap discovery sweep, Responder.py start and hash copy, BloodHound execution, GetUserSPNs.py Kerberoasting, and secretsdump.py DCSync). Monitored Windows domain member events (`DomainWin10` agent on DC and `Win10User` agent on workstation). |
| **TheHive** | Aggregated pivot logons and network IDS alerts into correlated incident cases. |
| **Velociraptor** | Queried Active Directory audit events, inspected `/root/.ssh/authorized_keys` and `/tmp/hank.hash` on DVWA pivot. |

---

## Timeline

| Time (IST) | Event | Source | Evidentiary Alert Capture |
|---|---|---|---|
| `17:26:14` | Attacker public key added to `/root/.ssh/authorized_keys` | Wazuh Auditd | [`wzb-19-ssh-persist-auditd-authorized-keys.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-19-ssh-persist-auditd-authorized-keys.jpg) |
| `17:29:43` | Inbound root SSH interactive session established from Kali | Wazuh SSHD | [`wzb-20-ssh-persist-key-inject-sshd-login.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-20-ssh-persist-key-inject-sshd-login.jpg) |
| `17:31:19` | Internal subnet discovery sweep against `192.168.56.0/24` | Suricata (`ens37`) | [`wzb-22-discovery-suricata-internal-nmap.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-22-discovery-suricata-internal-nmap.jpg) |
| `17:37:10` | Responder LLMNR/NetBIOS poisoning capturing `win10` NetNTLMv2 hash | Win10 Sysmon / Auditd | [`wzb-28-responder-win10-rundll32-davsetcookie.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-28-responder-win10-rundll32-davsetcookie.jpg) |
| `17:38:29` | NetNTLMv2 hash saved to `/tmp/win10.hash` for offline Hashcat cracking | Linux Pivot Auditd | [`wzb-29-responder-auditd-ntlmv2-hash-harvested.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-29-responder-auditd-ntlmv2-hash-harvested.jpg) |
| `18:00:57` | BloodHound LDAP query volume from DVWA to DC (`18:01:02` root SSH session) | Wazuh SSHD / Auditd | [`wzb-31-bloodhound-auditd-python-ingest.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-31-bloodhound-auditd-python-ingest.jpg) |
| `18:01:18` | Kerberoasting TGS-REQ requested for `HANK_SHERMAN` SPN via GetUserSPNs.py | Suricata / Wazuh | [`wzb-33-kerberoast-auditd-getuserspns.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-33-kerberoast-auditd-getuserspns.jpg) |
| `18:02:43` | DCSync replication dumping domain hashes via DRSUAPI (secretsdump.py) | Linux Pivot Auditd | [`wzb-34-dcsync-auditd-secretsdump-ntds.jpg`](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-34-dcsync-auditd-secretsdump-ntds.jpg) |

---

## Observables

| Type | Value | Context |
|---|---|---|
| **Pivot IP** | `192.168.56.30` | Compromised DVWA host used as operational pivot |
| **Domain Member** | `192.168.56.20` (`Win10User`) | Workstation poisoned by Responder |
| **Domain Controller** | `192.168.56.10` (`PC-DC.ad.lab` / `DomainWin10`) | Target of LDAP, Kerberoasting, and DCSync attacks |
| **Account** | `AD.LAB\win10` | Compromised domain workstation user account (`Secur3Lab!`) |
| **Account** | `AD.LAB\HANK_SHERMAN` | Kerberoasted Domain Admin service account (`Password123`) |
| **Secret** | `krbtgt` NTLM hash (`...f4e05f60`) | Replicated domain master key used for Golden Ticket |

---

## Tasks

- [x] Triage SSH persistence and root authentication alerts on DVWA pivot
- [x] Disable LLMNR and NetBIOS over TCP/IP across domain workstations via GPO
- [x] Force immediate domain-wide password reset for `win10` and `HANK_SHERMAN`
- [x] Strip `Domain Admins` & `Administrators` memberships from service account `HANK_SHERMAN`
- [x] Delete SPN `CIFS/AWSWAPPS1000000.ad.lab` from `HANK_SHERMAN` and enforce AES128/AES256 Kerberos encryption
- [x] Globally disable LLMNR (`EnableMulticast = 0`) & NetBIOS over TCP/IP (`NetbiosOptions = 2`) across all Windows hosts
- [x] Cryptographically shred `/tmp/*.hash` dumps and purge `/opt/Responder` from Linux pivot host
- [x] Enable NTDS diagnostic logging (`15 Field Engineering` = 5) to alert on LDAP search volume
- [x] Complete double `krbtgt` password reset procedure (incrementing KVNO to 3) to invalidate all forged Kerberos tickets

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
