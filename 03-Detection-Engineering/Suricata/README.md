# Suricata NIDS Baseline — Network Intrusion Signatures

> **Production Configuration & Artifacts:**
> - Custom Signatures: [`custom.rules`](../../06-Resources/rules/suricata/custom.rules)
> - Rate-Limiting & Suppression: [`threshold.config`](../../06-Resources/rules/suricata/threshold.config)
> - Tool Fingerprints: [`tool_fingerprints.json`](../../06-Resources/scripts/tool_fingerprints.json)
> - Target Deployment: Suricata Gateway Host (Ubuntu 24.04 LTS, dual-homed `ens33` / `ens37`)
> - Output Channel: EVE JSON alert log (`/var/log/suricata/eve-alert.json`) forwarded to Wazuh (`Rule 86601` / `100600`)

---

## 1. Gateway Deployment & Ingestion Topology

Suricata operates in passive IDS mode on the gateway router between the external attack segment (`192.168.232.0/24`, `ens33`) and the internal victim segment (`192.168.56.0/24`, `ens37`).

[![Suricata Gateway Network Topology](../../06-Resources/diagrams/Neon%20Suricata%20Network%20Defense%20Diagram.png)](../../06-Resources/diagrams/Neon%20Suricata%20Network%20Defense%20Diagram.png)

---

## 2. Ruleset Curation & Engineering Rationale

Rather than running an untuned ruleset of 50,000 signatures that overwhelms gateway memory and generates alert fatigue, the Suricata NIDS ruleset was deliberately curated across three tiers:

1. **Curated Emerging Threats Open (`et/open`) Categories:**
   Enabled only high-confidence ruleset categories via `suricata-update`:
   - `scan`: Inbound port scans, TCP sweeps, and OS fingerprinting.
   - `web_server`: Web exploitation, SQL injection, and web shell payloads.
   - `exploit`: Known privilege escalation and remote code execution frameworks.
   - `info`: Suspicious HTTP user-agents (`python-requests`, `whatweb`) and NTLM session negotiations.
   - `attack_response`: Outbound data leaks, command execution proof (`uid=33(www-data)`), and reverse shell headers.
2. **Specialized `aleksibovellan/nmap` Ruleset (`SID 3400000+`):**
   Standard ET scan rules focus primarily on external Internet sweeps and often miss specialized TCP flag combinations or internal probe structures. The `aleksibovellan/nmap` repository was imported to provide definitive signature detection for `-sS`, `-sT`, `-sX` (Xmas), and Metasploit payload sockets on TCP 4444.
3. **Local Custom Rules (`custom.rules`) & Rate Limiting (`threshold.config`):**
   Tailored laboratory signatures covering application endpoints (`/vulnerabilities/upload/`, `dvwa`), Kerberos ticket validation structures, and rate limits to ensure that scanner bursts do not flood the SIEM while never blinding the sensor to attacker IPs.
4. **Tool Fingerprinting Bridge (`tool_fingerprints.json`):**
   In the SOAR pipeline, raw Suricata signatures are ingested by `custom-thehive.py`. The daemon uses `tool_fingerprints.json` to map disparate Suricata alerts into unified tool campaigns (e.g. collapsing 300+ probe packets into single consolidated cases such as `[TOOL:Nmap]` or `[TOOL:Nikto]`).

| Source | Description | SID Range | Update / Deployment Method |
|---|---|---|---|
| **ET Open** (`et/open`) | Emerging Threats Open community signatures | `2,000,000`–`2,999,999` | `suricata-update` |
| **`aleksibovellan/nmap`** | Specialized Nmap scanning, OS probes, and shell signatures | `3,400,000`+ | Git sync to `/etc/suricata/rules/` |
| **Local Custom Rules** | Lab-specific detection signatures and overrides | `3,400,000`+ and local overrides | `/etc/suricata/rules/custom.rules` |

---

## 3. Empirically Verified Signatures (Fired in Campaign)

Analysis of the 9,567 raw alerts in [`../../06-Resources/alerts/Wazuh-Raw-Alerts.csv`](../../06-Resources/alerts/Wazuh-Raw-Alerts.csv) and [`thehive_alerts.json`](../../06-Resources/alerts/thehive_alerts.json) confirms the following primary signatures:

| SID | Signature Message | Stage | Target Protocol | Detection Mechanism & TheHive Alert |
|---|---|---|---|---|
| `3400001` / `3400002` | `POSSBL PORT SCAN (NMAP -sS)` | 01 (Recon) & 09 (Internal Disc) | TCP SYN / Probe Flags | Inbound port sweep (`wzb-3a8045a03c`, Alert #03) and internal pivot sweep (`wzb-3152e3ed59`, Alert #17) |
| `3400005` | `POSSBL PORT SCAN (NMAP -sX)` | 09 (Internal Disc) | TCP Xmas Flags | Internal reconnaissance sweep on `ens37` (`wzb-3152e3ed59`, Alert #17) |
| `2018489` | `ET SCAN NMAP OS Detection Probe` | 01 (Recon) | UDP / Nmap Fingerprint | Inbound OS probe on `ens33` (`wzb-3a8045a03c`, Alert #03) |
| `2010935` / `2010937` | `ET SCAN Suspicious inbound to MSSQL/MySQL/Oracle/PostgreSQL` | 01 & 09 (Recon) | Database Ports | Scanning across TCP 1433, 3306, 5432 (Alerts #02 and #17) |
| `2001219` / `2003068` | `ET SCAN Potential SSH Scan / OUTBOUND` | 01 & 09 (Recon) | TCP Port 22 | Inbound and lateral SSH reconnaissance (24x in raw CSV; Alert #19 `wzb-de91bad685`) |
| `2019232` | `ET EXPLOIT QNAP Shellshock CVE-2014-6271` | 01 (Nikto) | HTTP User-Agent / Headers | Inbound Nikto web vulnerability scan probe (`wzb-30ff03b872`, Alert #06) |
| `2101807` | `GPL EXPLOIT unicode directory traversal attempt` | 01 (Nikto) | HTTP URI | Nikto path traversal fuzzing (`wzb-df413d7c7e`, Alert #10) |
| `2017515` | `ET INFO User-Agent (python-requests) Inbound to Webserver` | 02 (Brute Force) | HTTP User-Agent | Automated brute-force tool hitting `/login.php` (`wzb-6a22425401`, Alert #11, Custom Rule 100600) |
| `2010960` | `ET SCAN WhatWeb Web Application Fingerprint Scanner` | 01 / 02 (Recon) | HTTP User-Agent | Automated web discovery probe hitting `/` and `/login.php` (Data Row 9057 / File Line 9058) |
| `2010963` | `ET WEB_SERVER SELECT USER SQL Injection Attempt in URI` | 03 (SQLi) | HTTP URI | UNION SELECT SQL injection targeting `/vulnerabilities/sqli/` (Data Row 9109 / File Line 9110, Alert #11) |
| `2014726` | `ET WEB_SERVER PHP System Command in HTTP POST` | 05 (Webshell) | HTTP POST Body | File upload containing PHP system execution syntax (`wzb-6a22425401`, Alert #11 sub-events 18–21) |
| `2019284` | `ET ATTACK_RESPONSE Output of id command from HTTP server` | 05 (Webshell) | HTTP Server Response | Response payload containing `uid=33(www-data)` (`wzb-e9a1797ac4`, Alert #13) |
| `3400020` | `POSSBL SCAN SHELL M-SPLOIT TCP` | 06 (RevShell) & 09 (Internal Disc) | TCP Port 4444 | Outbound reverse shell connection (`wzb-81bb1f83f7`, Alert #14; Auditd Alert #15 is `wzb-ccae331b77`) and internal sweep (`wzb-f87fab3eda`, Alert #18) |
| `2019922` | `ET EXPLOIT Possible MS14-068 GoldenPac Priv Esc in-use` | 13 (Kerberoasting) | TCP Port 88 (Kerberos) | Kerberos TGS-REQ wire frame captured on VMnet2 `ens37` (`wzb-c1e2642eb2`, Alert #23) |
| `2043996` | `ET INFO Suspected Impacket WMIExec Activity` | 18 & 20 (WMI Lateral/Impact) | TCP / RPC SMB | Lateral WMI execution from `192.168.56.30` to `192.168.56.20` (Data Rows 9529, 9540, 9546) |
| `2067085`–`2067087` | `ET INFO NTLM Session Setup Request - Negotiate / Challenge / Auth` | 20 (Impact / SMB Exec) | SMB / NTLM | NTLMSSP authentication negotiation over SMB (`wzb-7a4a134d1b`, Alert #43) |

> [!NOTE]
> **Stage 10 Telemetry Attribution:** Stage 10 (Responder) was executed locally on the DVWA pivot host (`python3 Responder.py -I ens33 -wd`). It was captured through endpoint bash command logging (Wazuh `bashcmd`, Level 5, CSV row 9231) and did not generate a network alert on the gateway wire. The SMB NTLM session alerts (SIDs `2067085`–`2067087`, `wzb-7a4a134d1b`) occurred at 12:53:59 during Stage 20 remote execution against Win10.

> [!NOTE]
> **Stage 13 Protocol Note:** Kerberoasting involves requesting a Kerberos service ticket (**TGS-REQ**), not an AS-REQ. In this campaign, the unrouted Kerberos traffic between DVWA (`192.168.56.30:33986`) and Domain Controller (`192.168.56.10:88`) triggered community signature `SID 2019922` (`ET EXPLOIT Possible GoldenPac Priv Esc in-use`) on port 88. This rule was originally authored to detect MS14-068/GoldenPac PAC validation exploitation on Kerberos port 88, but coincidentally fired here due to matching ASN.1 Kerberos request structures generated by Impacket's `GetUserSPNs.py` requesting an RC4-HMAC ticket. Custom rule `SID 2015862` did not fire.
>
> **Defense-in-Depth Custom Signatures Context:**  
> Several custom rules defined in `06-Resources/rules/suricata/custom.rules` served as pre-configured defense-in-depth baselines that did not fire in this specific execution run:
> - `SID 2014727` (`cmd=` parameter in URI): DVWA web shell execution used POST bodies and `id` commands rather than GET `cmd=` strings.
> - `SID 2000545` (Internal Port Scan on `192.168.56.0/24`): The internal sweep matched `aleksibovellan/nmap` SIDs `3400001` and `3400002` first.
> - `SID 2013028` (Responder LLMNR UDP 5355): Responder was bound to external interface `ens33` (`-I ens33`), so broadcast queries did not traverse `ens37` wire inspection.
> - `SID 2001569` (WhatWeb scanner): Fired under community `SID 2010960` in the raw CSV rather than the local rule clone.

---

## 4. Promiscuous Sniffing & Intra-Subnet Visibility

In standard IP routing, traffic exchanged between hosts on the same Layer 2 subnet (`192.168.56.0/24`) is switched directly by the hypervisor virtual switch and does not traverse the router's IP routing stack. 

While external attack traffic arrives across **`ens33`**, Suricata is additionally configured with **AF-PACKET promiscuous mode** on interface **`ens37`**. In VMware Workstation VMnet2, promiscuous mode allows the gateway virtual interface to receive broadcast, multicast, and unicast frames switched across the segment.

As documented in [`../../06-Resources/alerts/Wazuh-Raw-Alerts.csv`](../../06-Resources/alerts/Wazuh-Raw-Alerts.csv), Suricata generated exactly **14 victim-to-victim alerts** on internal interface `ens37` during the campaign:
1. **Nmap Port Scans (5 alerts):** `192.168.56.30 -> 192.168.56.20` on ports 995, 111, 443, and Xmas probes (SIDs `3400001`, `3400002`, `3400005`).
2. **Metasploit / Reverse Shell Probe (2 alerts):** `192.168.56.30` probing internal targets on TCP 4444 (SID `3400020`).
3. **Kerberoasting TGS-REQ (1 alert):** `192.168.56.30:33986 -> 192.168.56.10:88` (SID `2019922` in Alert #23 `wzb-c1e2642eb2`).
4. **Impacket WMIExec Activity (3 alerts):** `192.168.56.30 -> 192.168.56.20` over SMB/RPC (SID `2043996`, Data Rows 9529, 9540, 9546).
5. **NTLM Session Setup (3 alerts):** `192.168.56.30:32922 -> 192.168.56.20:445` (SIDs `2067085`, `2067086`, `2067087` in Alert #43 `wzb-7a4a134d1b`).

These categories sum precisely to $5 + 2 + 1 + 3 + 3 = 14$ alerts, proving complete accounting of unrouted Layer 2 promiscuous captures.

This empirical evidence demonstrates that network sensors deployed in promiscuous mode provide critical intra-subnet detection capabilities even when packets bypass gateway routing.

> [!NOTE]
> **Dual-Interface Packet Evaluation & Telemetry Accounting:**  
> Because Suricata runs AF-PACKET listeners on both the external perimeter interface (`ens33`) and the internal routed interface (`ens37`), routed packets crossing the Layer 3 kernel forwarding boundary are evaluated upon ingress and again upon egress.  
> - In the raw telemetry baseline ([`Wazuh-Raw-Alerts.csv`](../../06-Resources/alerts/Wazuh-Raw-Alerts.csv)), this generates dual-interface alert events for cross-boundary traffic (e.g. `in_iface: ens33` and `in_iface: ens37`).
> - In operational metrics, **this does NOT inflate incident figures**. The headline detection rate is measured across the **20 attack stages**, and the 46 TheHive cases ([`thehive_alerts.json`](../../06-Resources/alerts/thehive_alerts.json)) are produced by the `custom-thehive` asynchronous SOAR pipeline, which groups and de-duplicates alert bursts by tool fingerprint, source IP, and correlation time window into single consolidated incident tickets.

---

## 5. Noise Reduction & Rate Limiting (`threshold.config`)

To prevent alert fatigue and pipeline saturation during high-volume scans without blinding the sensor to the attacker, [`threshold.config`](../../06-Resources/rules/suricata/threshold.config) implements rate limiting:

```text
# Rate limit secondary Nmap SYN portscan probe to 1 event per source IP per 60 seconds
threshold gen_id 1, sig_id 3400002, type both, track by_src, count 1, seconds 60

# Rate limit multi-port database probes to 5 events per source IP per 60 seconds
threshold gen_id 1, sig_id 2010937, type both, track by_src, count 5, seconds 60

# Rate limit generic SYN portscan signature to 1 event per source IP per 30 seconds
threshold gen_id 1, sig_id 2000537, type both, track by_src, count 1, seconds 30

# Rate limit internal reconnaissance sweep alerts on pivot subnet
threshold gen_id 1, sig_id 2000545, type both, track by_src, count 2, seconds 60
```

> [!IMPORTANT]
> **Engineering Rationale: Rate-Limiting vs. Suppression:**
> Notice that `threshold.config` uses `type both` rate limiting rather than `suppress` directives against Kali's IP (`192.168.232.135`). Suppressing an attacker's IP would completely blind the IDS to malicious traffic. Rate limiting allows the initial intrusion detection alerts to pass to Wazuh while preventing thousands of redundant alerts during continuous scans from saturating the pipeline.
