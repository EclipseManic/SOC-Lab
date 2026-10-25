# Suricata NIDS Baseline — Network Intrusion Signatures

> **Production Configuration & Artifacts:**
> - Custom Signatures: [`custom.rules`](custom.rules)
> - Rate-Limiting & Suppression: [`threshold.config`](threshold.config)
> - Tool Fingerprints: [`tool_fingerprints.json`](../../06-Resources/Scripts/tool_fingerprints.json)
> - Target Deployment: Suricata Gateway Host (Ubuntu 24.04 LTS, dual-homed `ens33` / `ens37`)
> - Output Channel: EVE JSON alert log (`/var/log/suricata/eve-alert.json`) forwarded to Wazuh (`Rule 86601` / `100600`)

---

## 1. Gateway Deployment & Ingestion Topology

Suricata operates in passive IDS mode on the gateway router between the external attack segment (`192.168.232.0/24`, `ens33`) and the internal victim segment (`192.168.56.0/24`, `ens37`).

```text
Attacker (Kali 192.168.232.135)
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

## 2. Signature Sources & SID Allocation

| Source | Description | SID Range | Update Method |
|---|---|---|---|
| **ET Open** (`et/open`) | Emerging Threats Open community signatures | `2,000,000`–`2,999,999` | `suricata-update` |
| **`aleksibovellan/nmap`** | Specialized Nmap scanning, OS probes, and shell signatures | `3,400,000`+ | Git sync to `/etc/suricata/rules/` |
| **Local Custom Rules** | Lab-specific detection signatures and overrides | `3,400,000`+ and ET-referenced IDs | `/etc/suricata/rules/custom.rules` |

---

## 3. Empirically Verified Signatures (Fired in Campaign)

Analysis of the 9,567 raw alerts in [`06-Resources/Alerts/Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv) and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json) confirms the following primary signatures:

| SID | Signature Message | Stage | Target Protocol | Detection Mechanism & TheHive Alert |
|---|---|---|---|---|
| `3400001` / `3400002` | `POSSBL PORT SCAN (NMAP -sS)` / `ET SCAN NMAP OS Detection Probe` | 01 (Recon) & 09 (Internal Disc) | TCP SYN / Probe Flags | Inbound port sweep (`wzb-3a8045a03c`) and internal pivot sweep (`wzb-3152e3ed59`) |
| `2001569` | `ET INFO User-Agent (python-requests) Inbound to Webserver` | 02 (Brute Force) | HTTP User-Agent | Automated brute force tool hitting `/login.php` (`wzb-6a22425401`, Rule 100600) |
| `2019284` | `ET ATTACK_RESPONSE Output of id command from HTTP server` | 05 (Webshell) | HTTP Server Response | Response payload containing `uid=33(www-data)` (`wzb-e9a1797ac4`) |
| `3400020` | `POSSBL SCAN SHELL M-SPLOIT TCP` | 06 (RevShell) & 09 (Internal Disc) | TCP Port 4444 | Outbound reverse shell connection (`wzb-81bb1f83f7`) and internal sweep (`wzb-f87fab3eda`) |
| `2067085`–`2067087` | `ET INFO NTLM Session Setup Request - Negotiate / Challenge / Auth` | 10 (Responder) | SMB / NTLM | NTLMSSP authentication negotiation over SMB (`wzb-7a4a134d1b`) |
| `2019922` | `ET EXPLOIT Possible MS14-068 GoldenPac Priv Esc in-use` | 13 (Kerberoasting) | TCP Port 88 (Kerberos) | Kerberos TGS-REQ wire frame captured on VMnet2 (`wzb-c1e2642eb2`) |

> [!NOTE]
> **Stage 13 Protocol Note:** Kerberoasting involves requesting a Kerberos service ticket (**TGS-REQ**), not an AS-REQ. In this campaign, the unrouted Kerberos traffic between DVWA (`192.168.56.30:33986`) and Domain Controller (`192.168.56.10:88`) triggered community signature `SID 2019922` on port 88. Custom rule `SID 2015862` did not fire.

---

## 4. Promiscuous Sniffing & Intra-Subnet Visibility

In standard IP routing, traffic exchanged between hosts on the same Layer 2 subnet (`192.168.56.0/24`) is switched directly by the hypervisor virtual switch and does not traverse the router's IP routing stack. 

However, Suricata is configured with **AF-PACKET promiscuous mode** on interface `ens37`. In VMware Workstation VMnet2, promiscuous mode allows the gateway virtual interface to receive broadcast, multicast, and unicast frames switched across the segment.

As documented in [`06-Resources/Alerts/Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), Suricata generated **14 victim-to-victim alerts** during the campaign:
1. **Nmap Port Scans:** `192.168.56.30 -> 192.168.56.20` on ports 995, 111, 443 (SIDs `3400001` / `3400002`).
2. **Metasploit / Shell Sweep:** `192.168.56.30` probing internal targets on port 4444 (SID `3400020`).
3. **Kerberoasting TGS-REQ:** `192.168.56.30:33986 -> 192.168.56.10:88` (SID `2019922`).
4. **NTLM Session Setup:** `192.168.56.30:32922 -> 192.168.56.20:445` (SIDs `2067085`, `2067086`).

This empirical evidence demonstrates that network sensors deployed in promiscuous mode provide critical intra-subnet detection capabilities even when packets bypass gateway routing.

---

## 5. Noise Reduction & Rate Limiting (`threshold.config`)

To prevent alert fatigue and pipeline saturation during high-volume scans, [`threshold.config`](threshold.config) implements rate limiting:

```text
# Rate-limit high-volume port scan alerts: 1 alert per 10s per source IP
suppress gen_id 1, sig_id 2000537, track by_src, ip 192.168.232.135
suppress gen_id 1, sig_id 3400001, track by_src, ip 192.168.232.135
suppress gen_id 1, sig_id 3400002, track by_src, ip 192.168.232.135

# Rate-limit HTTP scanner user-agents to 1 alert per 30s
threshold gen_id 1, sig_id 2001569, type both, track by_src, count 5, seconds 30
```
