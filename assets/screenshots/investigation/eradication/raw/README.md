# Raw Eradication & Case Closure Telemetry Catalog

This directory preserves the unedited, timestamped screenshot evidence and database export artifacts captured during the live execution of Phase 4 (Eradication, Vulnerability Hardening & Operational Recovery) and TheHive 5 SOAR Case Closure.

---

## 🗂️ Directory Architecture

```
assets/screenshots/investigation/eradication/raw/
├── README.md                 # Raw evidence catalog & provenance map (this file)
├── vm_actions/               # 18 unedited captures from live Linux & Windows VM terminals
└── thehive_soar/             # 9 unedited captures & database export from TheHive 5 platform
```

---

## 🖥️ 1. Live Virtual Machine Actions (`vm_actions/`)

Captured directly from the analyst console, SSH sessions, and VM consoles across DVWA (`192.168.56.30`), Domain Controller `PC-DC` (`192.168.56.10`), Workstation `Win10User` (`192.168.56.20`), and Suricata Gateway (`192.168.56.150`):

| Raw Timestamp Filename | Target Host | Action & Commands Executed | Curated Figure Mapping |
|:---|:---|:---|:---|
| `16-04-16 - 03 November 2026 - WindowsTerminal.png` | DVWA | Cryptographic shredding of `/tmp/` staging loot; removal of `/opt/Responder`; verification of `systemd-resolved` running. | `slot_01_eradication_dvwa_loot_wiped.png` (Figure 1) |
| `16-03-05 - 03 November 2026 - WindowsTerminal.png` | DVWA | Precursor terminal review of `history \| grep "rm"` and `/tmp/` directory audit. | *Precursor Audit Proof* |
| `16-26-06 - 03 November 2026.png` | DVWA | Elimination of `www-data` NOPASSWD Python from sudoers; `PermitRootLogin no`; sudo access denied verification. | `slot_02_eradication_dvwa_sudoers_patched.png` (Figure 2) |
| `11-55-49 - 04 November 2026.png` | DVWA | POSIX regex `sed -i` updating DVWA `default_security_level = 'impossible'` in `config.inc.php`. | `slot_02b_eradication_dvwa_impossible_security.png` (Figure 2b) |
| `12-10-17 - 04 November 2026.png` | DVWA | Apache `AllowOverride All` configuration in `/etc/apache2/apache2.conf` and `curl -i` canary returning `HTTP 403 Forbidden`. | `slot_03_eradication_dvwa_upload_blocked.png` (Figure 3) |
| `16-26-34 - 03 November 2026.png` | DVWA | Initial `.htaccess` deployment test demonstrating default `AllowOverride None` behavior. | *Precursor Diagnostic Proof* |
| `16-27-29 - 03 November 2026.png` | PC-DC | `Remove-ADUser -Identity "backdoor" -Confirm:$false` and confirmation of null object return. | `slot_04_eradication_ad_backdoor_deleted.png` (Figure 4) |
| `16-30-09 - 03 November 2026.png` | PC-DC | Stripping `HANK_SHERMAN` from Domain Admins; clearing SPN; enforcing AES128/AES256 Kerberos encryption (`msDS-SupportedEncryptionTypes: 24`). | `slot_05_eradication_ad_hank_demoted.png` (Figure 5) |
| `16-30-35 - 03 November 2026.png` | PC-DC | Enrollment of `Administrator` & `HANK_SHERMAN` in `Protected Users`; verification of `krbtgt` `msDS-KeyVersionNumber: 3`. | `slot_06_eradication_ad_protected_users.png` (Figure 6) |
| `11-58-15 - 04 November 2026.png` | Win10User | PowerShell `Remove-Item` purging `README_HACKED.txt` and `*.enc` extortion files across user and administrator desktops. | *Workstation File Eradication* |
| `11-58-54 - 04 November 2026.png` | Win10User | Win32 C# P/Invoke `SystemParametersInfo(20, 0, $wallpaper, 3)` forcing immediate Explorer wallpaper repaint. | *Win32 API Execution Proof* |
| `12-00-01 - 04 November 2026.png` | Win10User | Full desktop view at 11:59 AM showing default blue Windows wallpaper, normal icons, and zero extortion files. | `slot_06b_eradication_desktop_wallpaper_restored.png` (Figure 6b) |
| `16-31-50 - 03 November 2026.png` | Win10User | Precursor execution creating `DNSClient` registry path and setting NetBIOS options via WMI. | *Precursor GPO Execution* |
| `16-32-04 - 03 November 2026.png` | Win10User | Verification of registry `EnableMulticast = 0` (LLMNR disabled) and adapter `TcpipNetbiosOptions = 2` (NetBIOS disabled). | `slot_07_eradication_llmnr_netbios_disabled.png` (Figure 7) |
| `12-05-22 - 04 November 2026.png` | DVWA | `iptables -I OUTPUT 1` rules rejecting outgoing traffic to DC (`.10`) and Workstation (`.20`) with `icmp-admin-prohibited`. | `slot_08_eradication_dmz_firewall_hardened.png` (Figure 8) |
| `16-32-47 - 03 November 2026.png` | Suricata GW | Perimeter firewall forward chain verification dropping attacker IP `192.168.232.135`. | *Perimeter Containment Audit* |
| `16-35-14 - 03 November 2026.png` | Wazuh Manager | `/var/ossec/bin/agent_control -l` confirming all 5 agents (Server 000, Suricata 001, DVWA 002, Win10User 003, DomainWin10 004) Active. | `slot_09_eradication_health_verification.png` (Figure 9) |
| `16-35-27 - 03 November 2026.png` | Suricata GW | Production web service availability check (`curl` returning `HTTP 200` in 0.029s). | *Production Service Latency Check* |

---

## 🏛️ 2. TheHive 5 SOAR Case Closure Telemetry (`thehive_soar/`)

Captured directly from TheHive 5 web interface (`http://10.122.0.4:9000`):

| Raw Timestamp Filename | Platform View | Recorded Operational State | Curated Figure Mapping |
|:---|:---|:---|:---|
| `13-06-39 - 04 November 2026.png` | Alerts Console (`Status: FalsePositive`) | All 3 benign scanner alerts (#01 Nmap SYN sweep, #06 Nikto Shellshock canary, #18 internal sweep) officially dismissed as False Positives. | `thehive_false_positives_dismissed.png` (Figure 9b) |
| `13-05-13 - 04 November 2026.png` | Case 01 Detail (`CAS-001-WEBCOMP`) | Status: `True Positive`, `TLP:AMBER`, `Impact: Yes`, 13 linked alerts, full remediation narrative. | `thehive_case01_closed.png` (Figure 10) |
| `13-05-38 - 04 November 2026.png` | Case 01 Tasks Tab | Verification that all 10 remediation tasks are marked `Completed / Closed`. | `thehive_case01_tasks.png` (Figure 10b) |
| `13-05-45 - 04 November 2026.png` | Case 02 Detail (`CAS-002-LATMOVE`) | Status: `True Positive`, `TLP:AMBER`, `Impact: Yes`, 8 linked alerts, full lateral movement remediation narrative. | `thehive_case02_closed.png` (Figure 11) |
| `13-05-54 - 04 November 2026.png` | Case 02 Tasks Tab | Verification that all 8 lateral movement tasks are marked `Completed / Closed`. | `thehive_case02_tasks.png` (Figure 11b) |
| `13-06-01 - 04 November 2026.png` | Case 03 Detail (`CAS-003-DOMIMP`) | Status: `True Positive`, `TLP:AMBER`, `Impact: Yes`, 22 linked alerts, full domain impact recovery narrative. | `thehive_case03_closed.png` (Figure 12) |
| `13-06-07 - 04 November 2026.png` | Case 03 Tasks Tab | Verification that all 8 domain recovery tasks are marked `Completed / Closed`. | `thehive_case03_tasks.png` (Figure 12b) |
| `13-05-02 - 04 November 2026.png` | Cases Master Overview Table | All 3 master cases (#1, #2, #3) displayed in green `Resolved / Closed` status with complete alert counts and tags. | `thehive_cases_overview_resolved.png` (Figure 13) |
| `13-06-26 - 04 November 2026.png` | Alerts Ingestion Queue (`Stage: New`) | Cleared alert queue displaying *"No alert has been found"*, proving 0 pending unhandled alerts across the SOAR pipeline. | `thehive_alert_queue_cleared.png` (Figure 14) |
| `Case-export-20261104-13_08.json` | TheHive Database Export | Complete 346 KB JSON database export of all 3 cases, observables, task audit records, and alert associations. Also preserved in [`assets/files/cases/TheHive-Case-Export.json`](../../../../files/cases/TheHive-Case-Export.json). | *Forensic Audit Archive* |
