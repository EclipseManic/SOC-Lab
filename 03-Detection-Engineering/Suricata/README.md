# Suricata Detection Engineering — Signatures & Threshold Tuning

> **Production Configuration & Signatures:**
> - Custom Signatures: [`custom.rules`](custom.rules)
> - Rate Limiting & Thresholds: [`threshold.config`](threshold.config)
> - Sensor Host Architecture: [`01-Lab-Setup/Local/suricata-gateway.md`](../../01-Lab-Setup/Local/suricata-gateway.md)

---

## 1. Overview & Inline Sensor Deployment

Suricata 8.0.6 runs as an inline router and Network Intrusion Detection System on the Suricata Gateway (`192.168.232.162` on `ens33` / `192.168.56.150` on `ens37`). It inspects all IP traffic transitioning between the external attacker network (`192.168.232.0/24`) and the internal victim network (`192.168.56.0/24`).

Alert events are written to `/var/log/suricata/eve-alert.json`. A local Wazuh agent ingests these JSON events, normalizes them via Wazuh's JSON decoder, and forwards them across the WireGuard tunnel (`wg0`) to the Wazuh SIEM.

```text
Kali (192.168.232.135)
         │  [ens33]
         ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ Suricata Gateway (Inline IDS)                               │
 │ • AF-PACKET mode on ens33 & ens37                           │
 │ • Rules: ET Open + aleksibovellan/nmap + custom.rules       │
 │ • Tuning: threshold.config                                  │
 │ • Output: /var/log/suricata/eve-alert.json                  │
 └─────────────────────────────────────────────────────────────┘
         │  [ens37]
         ▼
 Victims Subnet: DC (.10), Win10 (.20), DVWA (.30)
```

---

## 2. Signature Sources

| Source | Description | Update Method |
|---|---|---|
| **ET Open** (`et/open`) | Emerging Threats Open community signatures | `suricata-update` |
| **`aleksibovellan/nmap`** | Specialized Nmap scanning, OS fingerprinting, and SYN probe signatures | Git sync to `/etc/suricata/rules/` |
| **Local Custom Rules** | Lab-specific detection signatures for web attacks, reverse shells, and lateral movement | `/etc/suricata/rules/custom.rules` |

---

## 3. Verified Signatures Inventory

| SID | Signature Message | Stage | Severity | Target Protocol | TheHive Alert / Evidence |
|---|---|---|---|---|---|
| `3400002` | `ET SCAN NMAP OS Detection Probe` | 01 (Recon) | High (1) | TCP | `wzb-3a8045a03c` (`1.1.png`) |
| `2000537` | `POSSBL PORT SCAN (NMAP -sS)` | 01 (Recon) | Medium (2) | TCP SYN | `wzb-3a8045a03c` (`1.png`) |
| `2010937` | `ET SCAN Suspicious inbound to MySQL/MSSQL/PostgreSQL/SSH/VNC/RDP` | 01 (Recon) | Medium (2) | TCP Multi-port | `wzb-e076a639a7` (`1.2.png`) |
| `2001569` | `ET SCAN WhatWeb Web Application Fingerprint Scanner Default User-Agent` | 03 (SQLi) | Low (3) | HTTP | `wzb-10160d36c2` (`4.png`) |
| `2010937` | `ET WEB_SERVER SELECT USER SQL Injection Attempt in URI` | 03 (SQLi) | High (1) | HTTP | `wzb-10160d36c2` (`4.png`) |
| `2014726` | `ET WEB_SERVER PHP System Command in HTTP POST` | 05 (Webshell) | High (1) | HTTP POST | `wzb-e9a1797ac4` (`6.1.png`) |
| `2014727` | `ET WEB_SERVER Exploit Suspected PHP Injection Attack (cmd=)` | 05 (Webshell) | High (1) | HTTP GET | `wzb-61ed72e937` (`6.1.png`) |
| `2002752` | `ET POLICY Outbound Interactive Shell Spawned / Reverse Shell TCP` | 06 (RevShell) | High (1) | TCP 4444 | `wzb-f87fab3eda` (`5.png`) |
| `2000545` | `ET SCAN Potential Internal Port Scan / Reconnaissance Sweep` | 09 (Internal Disc) | Medium (2) | TCP SYN | `wzb-3152e3ed59` (`8.png`) |
| `2013028` | `ET SCAN Potential LLMNR / NBT-NS Poisoning Response (Port 5355/137)` | 10 (Responder) | High (1) | UDP Multicast | `wzb-7a4a134d1b` (`9.png`) |
| `2015862` | `ET EXPLOIT Possible GoldenPac Privilege Escalation in-use` | 15 (PTH) | High (1) | SMB / Kerberos | `wzb-c1e2642eb2` (`15.png`) |

---

## 4. Tuning & Suppression Configuration

To maintain a high signal-to-noise ratio and prevent alert flooding during automated tools, rule adjustments were applied in `/etc/suricata/`:

### Rate Limiting (`threshold.config`)
```text
# Suppress repeat Nmap OS detection probes from the same source to 1 alert per 60 seconds
threshold gen_id 1, sig_id 3400002, type both, track by_src, count 1, seconds 60

# Rate-limit multi-port database probes
threshold gen_id 1, sig_id 2010937, type both, track by_src, count 5, seconds 60
```

---

## 5. Visibility Boundary & Sensor Blind Spots

| Traffic Flow | Visible to Suricata? | Reason | Alternative Detection Mechanism |
|---|---|---|---|
| Kali $\leftrightarrow$ Victim Network (`192.168.56.0/24`) | **Yes** | Crosses gateway interfaces `ens33` $\leftrightarrow$ `ens37` | Suricata signatures in `eve-alert.json` |
| Victim $\rightarrow$ Cloud SOC (`10.122.0.0/16`) | **Yes** | Routes out `wg0` through WireGuard tunnel | Monitored on tunnel interface |
| Victim $\leftrightarrow$ Victim on `192.168.56.0/24` | **NO** | Switched locally at Layer 2; does not cross router | Endpoint telemetry: Wazuh agent & Sysmon |
| Encrypted SSH Transport (`22/TCP`) | **Metadata Only** | Handshake & flow duration visible; payload encrypted | Linux `auth.log` & `bashcmd` decoder |
| Encrypted Kerberos Tickets | **Metadata Only** | Ticket exchange ports visible; payload encrypted | Domain Controller Security log (EID 4769) |

---

## 6. Verification Commands

```bash
# Verify configuration syntax
sudo suricata -T -c /etc/suricata/suricata.yaml -v

# Tail live alerts during attack execution
sudo tail -f /var/log/suricata/eve-alert.json | jq '{timestamp, src_ip, dest_ip, alert: .alert.signature}'
```
