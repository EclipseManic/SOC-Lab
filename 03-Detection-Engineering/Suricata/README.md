# Suricata Detection Engineering — Signatures & Threshold Tuning

> **Production Configuration & Signatures:**
> - Custom Signatures: [`custom.rules`](custom.rules)
> - Rate Limiting & Thresholds: [`threshold.config`](threshold.config)
> - Gateway Host Documentation: [`01-Lab-Setup/Local/suricata-gateway.md`](../../01-Lab-Setup/Local/suricata-gateway.md)

---

## 1. Overview & Sensor Architecture

Suricata 8.0.6 runs as a passive Network Intrusion Detection System (NIDS) on the dual-NIC Suricata Gateway (`192.168.232.162` on `ens33` / `192.168.56.150` on `ens37`). While the host routes traffic via Linux kernel IP forwarding, Suricata itself operates in passive capture mode using `af-packet` without inline packet dropping or IPS blocking.

Alert events are written to `/var/log/suricata/eve-alert.json`. A local Wazuh agent ingests these JSON events, normalizes them via Wazuh's JSON decoder, and forwards them across the WireGuard tunnel (`wg0`) to the cloud Wazuh SIEM.

```text
Kali (192.168.232.135)
         │  [ens33]
         ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ Suricata Gateway (Linux Router + Passive IDS)               │
 │ • Linux Kernel IP Forwarding (net.ipv4.ip_forward = 1)      │
 │ • AF-PACKET promiscuous capture on ens37                    │
 │ • Rulesets: ET Open + aleksibovellan/nmap + custom.rules    │
 │ • Rate-limiting: threshold.config                           │
 │ • Output: /var/log/suricata/eve-alert.json                  │
 └─────────────────────────────────────────────────────────────┘
         │  [ens37]
         ▼
 Victims Subnet: DC (.10), Win10 (.20), DVWA (.30)
```

---

## 2. Signature Sources & SID Range Management

| Source | Description | SID Range | Update Method |
|---|---|---|---|
| **ET Open** (`et/open`) | Emerging Threats Open community signatures | `2,000,000`–`2,999,999` | `suricata-update` |
| **`aleksibovellan/nmap`** | Specialized Nmap scanning and OS fingerprinting ruleset | `3,400,000`+ | Git sync to `/etc/suricata/rules/` |
| **Local Custom Rules** | Lab-specific detection signatures for web attacks and shells | `1,000,000`–`1,999,999` (and custom lab SIDs) | `/etc/suricata/rules/custom.rules` |

> [!NOTE]
> **SID Allocation Best Practice:** In production environments, custom site-specific rules should always use the reserved local range `1,000,000`–`1,999,999` to prevent SID namespace collisions when `suricata-update` pulls updated community signature files. In this lab, several signatures adapted community ET rules while retaining reference SIDs.

---

## 3. Verified Signatures Inventory

| SID | Signature Message | Stage | Target Protocol | Detection Mechanism & Evidence |
|---|---|---|---|---|
| `3400002` | `ET SCAN NMAP OS Detection Probe` | 01 (Recon) | TCP (Flags: SFPU) | Matches distinctive SYN-FIN-PSH-URG probe flags (`wzb-3a8045a03c`) |
| `2000537` | `POSSBL PORT SCAN (NMAP -sS)` | 01 (Recon) | TCP SYN | Threshold: 25 SYN packets in 5s from same source (`wzb-3a8045a03c`) |
| `2010937` | `ET SCAN Suspicious inbound to MySQL/MSSQL/PostgreSQL/SSH/VNC/RDP` | 01 (Recon) | TCP Multi-port | Inbound connection sweep against management ports (`wzb-e076a639a7`) |
| `2001569` | `ET SCAN WhatWeb Web Application Fingerprint Scanner Default User-Agent` | 02 (Brute Force) | HTTP User-Agent | Matches automated scanner user-agent string |
| `2010938` | `ET WEB_SERVER SELECT USER SQL Injection Attempt in URI` | 03 (SQLi) | HTTP URI | Matches `UNION` + `SELECT` with `user`/`password` keywords |
| `2014726` | `ET WEB_SERVER PHP System Command in HTTP POST` | 05 (Webshell) | HTTP POST Body | Matches `system(` execution within POST body (`wzb-e9a1797ac4`) |
| `2014727` | `ET WEB_SERVER Exploit Suspected PHP Injection Attack (cmd=)` | 05 (Webshell) | HTTP GET URI | Matches `cmd=` command parameter in web shell URI |
| `2002752` | `ET POLICY Outbound Interactive Shell Spawned / Reverse Shell TCP` | 06 (RevShell) | TCP Port 4444 | Matches outbound TCP connection established to listener port 4444 (`wzb-f87fab3eda`) |
| `2000545` | `ET SCAN Potential Internal Port Scan / Reconnaissance Sweep` | 09 (Internal Disc) | TCP SYN | Threshold: 20 SYN packets in 10s from internal pivot (`wzb-3152e3ed59`) |
| `2013028` | `ET SCAN Potential LLMNR / NBT-NS Poisoning Response` | 10 (Responder) | UDP 5355 | Matches LLMNR multicast poisoning response header |
| `2019922` | `ET EXPLOIT Possible GoldenPac Privilege Escalation in-use` | 13 (Kerberoasting) | TCP Port 88 | Matches Kerberos AS-REQ ASN.1 header bytes (`|05|...|0a|`) during ticket request (`wzb-c1e2642eb2`, `13.png`) |

---

## 4. Understanding Sensor Visibility & The Stage 13 Flow

A critical engineering question in dual-NIC sensor architecture is: **what can the network sensor see, and why did it observe traffic between DVWA and the Domain Controller?**

### The Promiscuous Sniffing Mechanism
- Suricata's capture interface is attached to **`ens37`**, which connects directly to VMware Host-Only network `VMnet2`.
- By default, AF-PACKET places the capture interface into **promiscuous mode**.
- When DVWA (`192.168.56.30`) sent a Kerberos ticket request to the Domain Controller (`192.168.56.10:88`) during Stage 13, the TCP stream was observed on the wire by Suricata on `ens37`.
- Because rule `2019922` checks for Kerberos ASN.1 header bytes (`|05|` at offset 0 and `|0a|` at offset 2 on port 88), it matched the standard Kerberos AS-REQ handshake, generating alert `wzb-c1e2642eb2` (`13.png`).

### Boundary Comparison

| Flow Type | Traverses Gateway Router? | Observed by Suricata on `ens37`? | Authoritative Telemetry Layer |
|---|---|---|---|
| Kali $\leftrightarrow$ Victim | **Yes** (ens33 $\rightarrow$ ens37) | **Yes** (100% full inspection) | Suricata Network IDS |
| Victim $\rightarrow$ Cloud SOC | **Yes** (ens37 $\rightarrow$ wg0) | **Yes** (Flow visible before tunnel encapsulation) | Suricata Network IDS |
| Victim $\leftrightarrow$ Victim (Broadcast / Multicast) | **No** (Local L2 segment) | **Yes** (Promiscuous sniffer receives all broadcast/multicast) | Suricata (`ens37`) + Host Logs |
| Victim $\leftrightarrow$ Victim (Unicast Kerberos / SMB) | **No** (Direct L2 delivery) | **Observed when frames cross virtual switch port** | **Endpoint Agents (Wazuh + Sysmon)** |

---

## 5. Rate Limiting & Tuning Configuration (`threshold.config`)

To prevent high-speed scanners (such as Nmap and Nikto) from generating thousands of duplicate alerts that exhaust disk space and trigger false-positive storms:

```text
# Rate-limit repeat Nmap OS detection probes from the same source to 1 alert per 60 seconds
threshold gen_id 1, sig_id 3400002, type both, track by_src, count 1, seconds 60

# Rate-limit multi-port database probes to 5 per 60 seconds
threshold gen_id 1, sig_id 2010937, type both, track by_src, count 5, seconds 60
```

---

## 6. Verification Commands

```bash
# Verify Suricata configuration and rule syntax
sudo suricata -T -c /etc/suricata/suricata.yaml -v

# Tail live alerts in structured JSON format
sudo tail -f /var/log/suricata/eve-alert.json | jq '{timestamp, src_ip, dest_ip, alert: .alert.signature, sid: .alert.signature_id}'
```
