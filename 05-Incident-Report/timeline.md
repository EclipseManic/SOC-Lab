# Consolidated Incident & Response Timeline

> **Incident Identifier:** `INC-2026-1018-ALPHA`  
> **Campaign Date:** October 18, 2026  
> **Simulation Duration:** 74 minutes, 9 seconds ($T_0$ = `11:40:09` UTC / `17:10:09` IST)  
> **Operational Response:** Immediate Containment executed at $T_0 + 80\text{m}$; Eradication & Hardening completed at $T_0 + 130\text{m}$

[![Consolidated Incident Response 74-Minute Timeline](../assets/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)](../assets/diagrams/Consolidated%20Incident%20Response%2074-Minute%20Timeline.png)
*Figure 1: Full chronological incident timeline spanning 74 minutes ($T_0$ to $T_0 + 74\text{m}$), correlating attacker milestones (top) against blue-team detection alerts across Suricata, Auditd, Wazuh, Sysmon, and TheHive (bottom).*

All timestamps represent elapsed simulation time from campaign initiation ($T_0$ = `11:40:09` UTC).

| Elapsed Time | Stage | Phase | Telemetry Event | Source Sensor | Evidence Reference |
|---|---|---|---|---|---|
| **$T_0$** (`11:40:09`) | 01 | Initial Access | Inbound Nmap port scan & Nikto directory fuzzing | Suricata SID 2018489, 3400001, 3400002 / Wazuh Rule 100410 | [Attack 1](../assets/screenshots/attack-simulation/1.png) · [Alert 1](../assets/screenshots/detection-engineering/1.png) |
| **$T_0 + 8m$** (`11:48:02`) | 02 | Initial Access | Automated Python credential brute force on `/login.php` | Wazuh Rule 100213 / Suricata SID 2017515, 2000547 | [Attack 6](../assets/screenshots/attack-simulation/6.png) · [Alert 2](../assets/screenshots/detection-engineering/2.png) |
| **$T_0 + 10m$** (`11:49:58`) | 03 | Initial Access | SQL injection UNION SELECT payload extracting users table | Suricata SID 2010963 / Wazuh Rule 31106 | [Attack 8](../assets/screenshots/attack-simulation/8.png) · [Alert 3](../assets/screenshots/detection-engineering/3.png) |
| **$T_0 + 11m$** | 04 | Credential Access | Offline Hashcat MD5 cracking on attacker GPU (`password`) | *Offline Activity (No Victim Telemetry)* | [Attack 10](../assets/screenshots/attack-simulation/10.png) · DG-04 |
| **$T_0 + 12m$** (`11:51:58`) | 05 | Persistence | Executable PHP web shell executed (`id` command output) | Suricata SID 2019284 / Wazuh 100199 / Auditd | [Attack 12](../assets/screenshots/attack-simulation/12.png) · [Alert 4](../assets/screenshots/detection-engineering/4.png) |
| **$T_0 + 14m$** (`11:54:03`) | 06 | Execution | Named-pipe FIFO Netcat reverse shell connecting on TCP 4444 | Suricata SID 3400020 / Wazuh Rule 100199 | [Attack 15](../assets/screenshots/attack-simulation/15.png) · [Alert 5](../assets/screenshots/detection-engineering/5.png) |
| **$T_0 + 15m$** (`11:55:00`) | 07 | Privilege Escalation | Passwordless sudo Python execution (`sudo /usr/bin/python3` GTFOBins) & sudo to root | Wazuh Rule 5402 (PAM) / Auditd `web_process_creation` | [Attack 17](../assets/screenshots/attack-simulation/17.png) · [Alert 6](../assets/screenshots/detection-engineering/6.png) |
| **$T_0 + 20m$** (`11:59:43`) | 08 | Persistence | Attacker SSH key written & root interactive SSH session | Wazuh Rule 550 (Syscheck FIM) / Wazuh 5715 | [Attack 18](../assets/screenshots/attack-simulation/18.png) · [Alert 7](../assets/screenshots/detection-engineering/7.png) |
| **$T_0 + 21m$** (`12:00:49`) | 09 | Discovery | Internal subnet multi-port sweep (`192.168.56.0/24`) | Suricata SIDs 3400001, 3400002, 3400020 (`ens37` capture) | [Attack 21](../assets/screenshots/attack-simulation/21.png) · [Alert 8](../assets/screenshots/detection-engineering/8.png) |
| **$T_0 + 24m$** (`12:04:27`) | 12 | Discovery | SharpHound/BloodHound LDAP query sweep targeting PC-DC | Wazuh Rule 5715 (Pivot root SSH logon alerted) | [Attack 33](../assets/screenshots/attack-simulation/33.png) · [Alert 10](../assets/screenshots/detection-engineering/10.png) |
| **$T_0 + 26m$** (`12:06:26`) | 10 | Credential Access | Responder launched on DVWA capturing `win10` hash | Wazuh `bashcmd` (uid:0 Responder.py) | [Attack 28](../assets/screenshots/attack-simulation/28.png) · [Alert 9](../assets/screenshots/detection-engineering/9.png) |
| **$T_0 + 29m$** | 11 | Credential Access | Offline Hashcat NetNTLMv2 cracking on attacker GPU | *Offline Activity (No Victim Telemetry)* | [Attack 31](../assets/screenshots/attack-simulation/31.png) · DG-11 |
| **$T_0 + 51m$** (`12:31:18`) | 13 | Credential Access | Kerberoasting TGS request for `HANK_SHERMAN` SPN | Suricata SID 2019922 (`ens37`) & Wazuh 5715 | [Attack 41](../assets/screenshots/attack-simulation/41.png) · [Alert 11](../assets/screenshots/detection-engineering/11.png) |
| **$T_0 + 53m$** (`12:33:52`) | 14 | Credential Access | Impacket `secretsdump.py` DRSUAPI directory replication | Wazuh Rule 5715 (Pivot root SSH logon alerted) | [Attack 45](../assets/screenshots/attack-simulation/45.png) · [Alert 12](../assets/screenshots/detection-engineering/12.png) |
| **$T_0 + 55m$** (`12:34:47`) | 15 | Lateral Movement | Pass-the-Hash remote logon Type 3 & Impacket WMI fan-out | Windows EID 4624 (24x in CSV) / Wazuh Rule 100613 | [Attack 48](../assets/screenshots/attack-simulation/48.png) · [Alert 13](../assets/screenshots/detection-engineering/13.png) |
| **$T_0 + 58m$** (`12:38:21`) | 17 | Persistence | Rogue domain user `backdoor` created and added to DA | Wazuh Rule 100613 (WMI Fan-out: `net user`, `net localgroup`) | [Attack 52](../assets/screenshots/attack-simulation/52.png) · [Alert 15](../assets/screenshots/detection-engineering/15.png) |
| **$T_0 + 64m$** (`12:43:58`) | 18 | Collection | Host reconnaissance harvesting commands & staging | Wazuh Rule 100613 (Fan-out: `whoami`, `net user`, `net group`) | [Attack 54](../assets/screenshots/attack-simulation/54.png) · [Alert 16](../assets/screenshots/detection-engineering/16.png) |
| **$T_0 + 67m$** (`12:47:30`) | 19 | Exfiltration | Rapid SCP burst transferring files from pivot to Kali | Wazuh Rule 5715 (Logon burst: 6 sessions / 1s) | [Attack 56](../assets/screenshots/attack-simulation/56.png) · [Alert 17](../assets/screenshots/detection-engineering/17.png) |
| **$T_0 + 69m$** (`12:49:02`) | 16 | Privilege Escalation | Forged Kerberos TGT (Golden Ticket) tested via pivot | Wazuh Rule 5715 (Pivot root SSH logon alerted) | [Attack 49](../assets/screenshots/attack-simulation/49.png) · [Alert 14](../assets/screenshots/detection-engineering/14.png) |
| **$T_0 + 70m$–$74m$** (`12:49:49`–`12:54:18`) | 20 | Impact | Impacket `wmiexec` registry autostart & SMB execution | Wazuh Rule 100613 / Sysmon EID 1 / Suricata SIDs 2067085–87 | [Attack 57](../assets/screenshots/attack-simulation/57.png) · [Alert 18](../assets/screenshots/detection-engineering/18.png) |

---

## 🛡️ Operational Containment & Eradication Response Milestones

Following the adversary's simulated forced reboot at $T_0 + 74\text{m}$, the incident response team initiated formal incident response operations:

| Milestone ID | Operational Phase | Action Taken | Tooling Used | Operational Outcome | Evidence Asset Link |
|:---:|:---|:---|:---:|:---|:---:|
| **M-01** | **Containment** | Enforce Gateway perimeter DROP rule on `192.168.232.135` | Velociraptor VQL | Adversary completely locked out of network | [`slot_01_containment_firewall_drop.png`](../assets/screenshots/investigation/containment/slot_01_containment_firewall_drop.png) |
| **M-02** | **Containment** | Kill reverse shell port 4444; quarantine `shell.php` with `chmod 000` | Velociraptor VQL | Linux web footholds severed; evidence preserved | [`slot_02a_containment_dvwa_shells_quarantined.png`](../assets/screenshots/investigation/containment/slot_02a_containment_dvwa_shells_quarantined.png) |
| **M-03** | **Containment** | Purge `/root/.ssh/authorized_keys` and terminate rogue sessions | Velociraptor VQL | Attacker SSH persistence neutralized | [`slot_03_containment_dvwa_root_ssh_eradication.png`](../assets/screenshots/investigation/containment/slot_03_containment_dvwa_root_ssh_eradication.png) |
| **M-04** | **Containment** | Disable `AD\backdoor` account and strip Domain Admins membership | PowerShell RSAT | Account frozen; SID preserved for forensic trace | [`slot_04a_containment_dc_backdoor_disabled.png`](../assets/screenshots/investigation/containment/slot_04a_containment_dc_backdoor_disabled.png) |
| **M-05** | **Containment** | Execute double reset of `krbtgt` password and purge ticket cache | PowerShell RSAT | Forged Golden Tickets permanently invalidated | [`slot_05a_containment_dc_krbtgt_reset.png`](../assets/screenshots/investigation/containment/slot_05a_containment_dc_krbtgt_reset.png) |
| **M-06** | **Containment** | Quarantine defacement files and restore wallpaper registry keys | PowerShell | Workstation desktop clean; evidence archived | [`slot_06b_containment_wallpaper_remediated.png`](../assets/screenshots/investigation/containment/slot_06b_containment_wallpaper_remediated.png) |
| **M-07** | **Eradication** | Shred 9 staging files in `/tmp/`, delete `/opt/Responder`, restore DNS | Velociraptor VQL | Adversary loot destroyed; `systemd-resolved` active | [`slot_01_eradication_dvwa_loot_wiped.png`](../assets/screenshots/investigation/eradication/slot_01_eradication_dvwa_loot_wiped.png) |
| **M-08** | **Eradication** | Purge `www-data` sudoers Python; block PHP upload execution via `.htaccess` | Velociraptor VQL | Root causes 1, 2, 3 permanently patched | [`slot_02_eradication_dvwa_sudoers_patched.png`](../assets/screenshots/investigation/eradication/slot_02_eradication_dvwa_sudoers_patched.png) |
| **M-09** | **Eradication** | Permanently delete `AD\backdoor`; strip `HANK_SHERMAN` DA & SPN | PowerShell RSAT | Rogue objects purged; Kerberoast vector closed | [`slot_04_eradication_ad_backdoor_deleted.png`](../assets/screenshots/investigation/eradication/slot_04_eradication_ad_backdoor_deleted.png) |
| **M-10** | **Eradication** | Enroll `Administrator` in `Protected Users`; rotate domain credentials | PowerShell RSAT | Pass-the-Hash & LSASS caching disabled | [`slot_06_eradication_ad_protected_users.png`](../assets/screenshots/investigation/eradication/slot_06_eradication_ad_protected_users.png) |
| **M-11** | **Eradication** | Globally disable LLMNR (`EnableMulticast = 0`) & NetBIOS over TCP/IP | PowerShell CIM | Responder broadcast poisoning vectors closed | [`slot_07_eradication_llmnr_netbios_disabled.png`](../assets/screenshots/investigation/eradication/slot_07_eradication_llmnr_netbios_disabled.png) |
| **M-12** | **Eradication** | Implement DMZ egress micro-segmentation blocking internal AD ports | iptables | Lateral movement boundary enforced | [`slot_08_eradication_dmz_firewall_hardened.png`](../assets/screenshots/investigation/eradication/slot_08_eradication_dmz_firewall_hardened.png) |
| **M-13** | **Recovery** | Validate DVWA HTTP 200, DCDiag replication, and Wazuh 4-agent fabric | Multi-Host Health | Enterprise production baseline confirmed healthy | [`slot_09_eradication_health_verification.png`](../assets/screenshots/investigation/eradication/slot_09_eradication_health_verification.png) |
| **M-14** | **Case Closure** | Dismiss 3 FPs; resolve Cases 01–03 under `INC-2026-1018-ALPHA` | TheHive 5 SOAR | 46 alerts triaged; cases officially resolved | [`thehive_cases_overview_resolved.png`](../assets/screenshots/investigation/eradication/thehive_cases_overview_resolved.png) |
