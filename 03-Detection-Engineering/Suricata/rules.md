# Suricata Rules — Network IDS Signature Catalog & Tuning

> **Production Configuration & Signatures:**
> - Custom Rules: [`custom.rules`](custom.rules)
> - Rate Limiting: [`threshold.config`](threshold.config)
> - Disabled Signatures: [`disable.conf`](disable.conf)
> - Severity Tuning: [`modify.conf`](modify.conf)

## Overview

The Suricata Network Intrusion Detection System (v8.0.6) operates as an inline router on the Suricata Gateway (`192.168.232.162` / `192.168.56.150`). It inspects all traffic traversing between the Kali attacker subnet (`192.168.232.0/24`) and the victim network (`192.168.56.0/24`).

Alert events are written to `/var/log/suricata/eve-alert.json`, where a local Wazuh agent ingests them and ships them across the WireGuard VPN to the Wazuh SIEM.

## Signature Sources

| Source | Description | Update Method |
|---|---|---|
| **ET Open** (`et/open`) | Emerging Threats Open community signatures | `suricata-update` |
| **`aleksibovellan/nmap`** | Highly specialized Nmap scanning and OS fingerprinting ruleset | Git sync to `/etc/suricata/rules/` |
| **Local Custom Rules** | Lab-specific detection signatures for web attacks and lateral movement | `/etc/suricata/rules/custom.rules` |

## Verified Signatures Inventory

| SID | Signature Message | Stage | Severity | Target Protocol | TheHive Alert / Evidence |
|---|---|---|---|---|---|
| `3400002` | `ET SCAN NMAP OS Detection Probe` | 01 (Recon) | High (1) | TCP | `wzb-3a8045a03c` (`1.1.png`) |
| `2000537` | `POSSBL PORT SCAN (NMAP -sS)` | 01 (Recon) | Medium (2) | TCP SYN | `wzb-3a8045a03c` (`1.png`) |
| `2010937` | `ET SCAN Suspicious inbound to MySQL/MSSQL/PostgreSQL/SSH/VNC/RDP` | 01 (Recon) | Medium (2) | TCP Multi-port | `wzb-e076a639a7` (`1.2.png`) |
| `2001569` | `ET SCAN WhatWeb Web Application Fingerprint Scanner Default User-Agent` | 03 (SQLi) | Low (3) | HTTP | Alert 17 (`4.png`) |
| `2010937` | `ET WEB_SERVER SELECT USER SQL Injection Attempt in URI` | 03 (SQLi) | High (1) | HTTP | Alert 17 (`4.png`) |
| `2014726` | `ET WEB_SERVER PHP System Command in HTTP POST` | 05 (Webshell) | High (1) | HTTP POST | Alert 21 (`6.1.png`) |
| `2014727` | `ET WEB_SERVER Exploit Suspected PHP Injection Attack (cmd=)` | 05 (Webshell) | High (1) | HTTP GET | Alert 22 (`6.1.png`) |
| `2002752` | `ET POLICY Outbound Interactive Shell Spawned / Reverse Shell TCP` | 06 (RevShell) | High (1) | TCP 4444 | Alert 5 (`5.png`) |
| `2000545` | `ET SCAN Potential Internal Port Scan / Reconnaissance Sweep` | 09 (Internal Disc) | Medium (2) | TCP SYN | Alert 8 (`8.png`, `8.1.png`) |
| `2013028` | `ET SCAN Potential LLMNR / NBT-NS Poisoning Response (Port 5355/137)` | 10 (Responder) | High (1) | UDP Multicast | Alert 9 (`9.png`–`9.3.png`) |
| `2015862` | `ET EXPLOIT Possible GoldenPac Privilege Escalation in-use` | 15 (PTH) | High (1) | SMB / Kerberos | Alert 15 (`15.png`, `15.5.png`) |

## Tuning & Suppression Configuration

To maintain high signal-to-noise ratio during automated vulnerability scanning, rule adjustments were implemented in `/etc/suricata/`:

### 1. `threshold.config`
Rate-limits high-volume scanning signatures to prevent log saturation:

```text
# Suppress repeat Nmap OS detection probes from the same source to 1 alert per 60 seconds
threshold gen_id 1, sig_id 3400002, type both, track by_src, count 1, seconds 60

# Rate-limit multi-port database probes
threshold gen_id 1, sig_id 2010937, type both, track by_src, count 5, seconds 60
```

### 2. `disable.conf`
Disables signatures that produce non-actionable noise in an isolated lab environment:

```text
# Disable generic ICMP ping informational alerts
2000001
# Disable routine NTP check-in signatures
2000002
```

### 3. `modify.conf`
Adjusts signature severity or adds custom metadata to aid Wazuh categorization:

```text
# Upgrade severity of PHP command injection signatures to 1 (High)
2014726 "severity 1"
2014727 "severity 1"
```

## Visibility Boundary & Sensor Blind Spots

| Traffic Flow | Visible to Suricata? | Reason | Detection Mechanism |
|---|---|---|---|
| Kali $\leftrightarrow$ Victim Network (`192.168.56.0/24`) | **Yes** | Crosses gateway interfaces `ens33` $\leftrightarrow$ `ens37` | Suricata signatures in `eve-alert.json` |
| Victim $\rightarrow$ Cloud SOC (`10.122.0.0/16`) | **Yes** | Routes out `wg0` through WireGuard tunnel | Monitored on tunnel interface |
| Victim $\leftrightarrow$ Victim on `192.168.56.0/24` | **NO** | Switched locally at Layer 2; does not cross router | Endpoint telemetry: Wazuh agent & Sysmon |
| Encrypted SSH Transport (`22/TCP`) | **Metadata Only** | Handshake & flow duration visible; payload encrypted | Linux `auth.log` & `bashcmd` decoder |
| Encrypted Kerberos Tickets | **Metadata Only** | Ticket exchange ports visible; payload encrypted | Domain Controller Security log (EID 4769) |

## Validation & Syntax Check

```bash
# Verify configuration syntax
sudo suricata -T -c /etc/suricata/suricata.yaml -v

# Tail live alerts during attack execution
sudo tail -f /var/log/suricata/eve-alert.json | jq '{timestamp, src_ip, dest_ip, alert: .alert.signature}'
```

## Related Documents

- [Suricata Log Samples & JSON Reference](log-samples.md)
- [Suricata Gateway Host Setup](../../01-Lab-Setup/Local/suricata-gateway.md)
- [Wazuh Decoders for Suricata](Wazuh/decoders.md)
- [Detection Coverage Matrix](coverage-matrix.md)
