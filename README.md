# SOC Lab — Attack Simulation, Detection & Response

A self-hosted SOC lab that emulates an Active Directory attack campaign, collects network and host telemetry through a Suricata gateway and Wazuh, routes alerts into TheHive, and documents the investigation end to end.

**Live site:** <https://soc-lab.eclipsemanic.me/>

> **Authorized lab only.** Everything here was performed against systems I own in an isolated environment. See [DISCLAIMER.md](DISCLAIMER.md).

## What this lab is

Three tiers, one story:

| Tier | What it is | Where it runs |
|---|---|---|
| Attack | Kali Linux on an isolated NAT segment | Local VMware |
| Victim | Windows Server 2022 DC, Windows 10, DVWA — routed through the Suricata gateway | Local VMware |
| SOC | Wazuh SIEM VM plus TheHive/automation VM, each in a `/24` VNet joined by peering and reached over WireGuard | Cloud (vendor-neutral) |

The point of the design is not the tool list. It is that a single public port opens the lab, every hop is documented, and the places where visibility is incomplete are named rather than hidden.

## Architecture

![SOC lab architecture](06-Resources/Diagrams/soc-lab.png)

*Latest high-level architecture. Suricata's victim-side address is `192.168.56.150/24`. The `10.122.0.0/16` block is a summary range for two peered `/24` VNets, not a single Layer 2 subnet. Detailed addresses, ports, and flows are documented in [01-Lab-Setup/architecture.md](01-Lab-Setup/architecture.md). Suricata sees traffic crossing the gateway; victim-to-victim traffic stays on the same subnet.*

The tunnel terminates on the TheHive/automation VM, not on Wazuh. That VM is the cloud ingress point, the VPN hub, and the router that reaches the Wazuh VM across the peered VNets.

Full detail: [01-Lab-Setup/architecture.md](01-Lab-Setup/architecture.md).

## Network at a glance

| Group | What is reachable | Notes |
|---|---|---|
| **Public ingress** | `51820/UDP` on the TheHive/automation VM — nothing else | Default-deny for all other public inbound |
| **VPN-only** | TheHive UI, Wazuh dashboard/API/agent ports, Velociraptor, SSH, NPM admin | Reachable from `10.8.0.0/24` only |
| **Private / peering** | TheHive VM ↔ Wazuh VM over the peered VNets in `10.122.0.0/16` | No public listener on the Wazuh VM |

The VPN policy allows `10.8.0.0/24` to both `192.168.232.0/24` and `192.168.56.0/24`, so the gateway can be managed and the local hosts can be reached for troubleshooting. That also exposes the Kali/NAT segment to VPN clients; if only gateway management is needed, narrow it to `192.168.232.162`.

## Stack

| Layer | Component | Where | Role |
|---|---|---|---|
| Attack | Kali Linux | Local, `192.168.232.0/24` | Adversary workstation and tooling |
| Network detection | Suricata gateway | Local, `192.168.56.150` / `192.168.232.162` | Router between attack and victim segments; `eve-alert.json` to Wazuh |
| Web target | DVWA on Ubuntu | Local, `192.168.56.30` | Initial access and web attack surface |
| Workstation | Windows 10 | Local, `192.168.56.20` | Credential access and lateral movement target |
| Identity | Windows Server 2022 DC, `ad.lab` | Local, `192.168.56.10` | AD DS, DNS, Kerberos |
| SIEM | Wazuh manager, indexer, dashboard | Wazuh VM, private only | Log collection, rules, alerting |
| Case management | TheHive | TheHive/automation VM | Alerts, cases, observables, tasks, timelines |
| Automation | [thecustomhive](03-Detection-Engineering/pipeline-thecustomhive.md) (Python) | TheHive/automation VM | Wazuh API → TheHive alert pipeline |
| DFIR | Velociraptor | TheHive/automation VM | Endpoint artifact collection |
| Ingress | Nginx Proxy Manager | TheHive/automation VM | Internal TLS/reverse proxy for SOC services |
| Connectivity | WireGuard | Both sides | VPN hub on `10.8.0.1/24`, Suricata client on `10.8.0.2/32` |

## Design principles

1. **One public port.** `51820/UDP` on the TheHive/automation VM is the only public inbound rule. Everything else is VPN, peering, or closed. The provider console is the break-glass path.
2. **Vendor-neutral.** DigitalOcean, OVHcloud, Vultr, Azure, and AWS can host this architecture. The provider does not matter — the firewall, VPN, routing, peering, and segmentation do.
3. **TheHive VM routes telemetry.** It is the ingress hub: it terminates the tunnel, forwards agent traffic to the Wazuh VM, and runs the pipeline that turns Wazuh alerts into TheHive alerts.
4. **Fail closed.** If the tunnel or the hub is down, agents queue or fail; no service falls back to a public listener.
5. **Document the blind spot.** Suricata sees attacker↔victim and victim↔cloud traffic. It does not see victim-to-victim traffic on `192.168.56.0/24`, which is same-subnet. Lateral-movement detection for those stages depends on Wazuh and host telemetry.
6. **Honest evidence.** Unverified rules are marked unverified. Missing artifacts are marked missing. Nothing is presented as a result until it exists.

## Repository map

| Section | Purpose |
|---|---|
| [Lab-Setup](01-Lab-Setup/README.md) | Architecture, unified network, local VMs, and cloud stack documentation |
| [Attack-Simulation](02-Attack-Simulation/README.md) | 20-stage attack chain with commands, artifacts, and evidence |
| [Detection-Engineering](03-Detection-Engineering/README.md) | Rule catalog, ATT&CK coverage matrix, false positives, gaps, and thecustomhive pipeline |
| [Investigation](04-Investigation/README.md) | Stage-wise analyst notes and three TheHive cases |
| [Incident-Report](05-Incident-Report/README.md) | Executive report, timeline, IOCs, ATT&CK mapping, response and lessons |
| [INDEX.md](INDEX.md) | Master traceability matrix: stage, alert, rule, case, evidence |
| [Resources](06-Resources/README.md) | Reference material, master attack chain blueprint PDF, and architecture diagram |
| [SECURITY.md](SECURITY.md) | Redaction and secret-handling policy |

## Attack chain at a glance

| # | Stage | Tactic | Suggested ATT&CK | Detection Status |
|---|---|---|---|---|
| 01 | Reconnaissance | Reconnaissance | T1595.001 Active Scanning | **Detected** |
| 02 | Brute force | Credential Access | T1110.001 Password Guessing | **Detected** |
| 03 | SQL injection | Initial Access | T1190 Exploit Public-Facing Application | **Detected** |
| 04 | Hash cracking | Credential Access | T1110.002 Password Cracking | **Not Detected** (Offline) |
| 05 | Web shell upload | Persistence | T1505.003 Server Web Shell | **Detected** |
| 06 | Reverse shell | Execution | T1059.004 Unix Shell | **Detected** |
| 07 | Privilege escalation | Privilege Escalation | T1548.003 Sudo and Sudo Caching | **Detected** |
| 08 | SSH persistence | Persistence | T1098.004 SSH Authorized Keys | **Detected** |
| 09 | Internal discovery | Discovery | T1018 Remote System Discovery | **Detected** |
| 10 | Responder poisoning | Credential Access | T1557.001 LLMNR/NBT-NS Poisoning and Relay | **Detected** |
| 11 | NTLMv2 cracking | Credential Access | T1110.002 Password Cracking | **Not Detected** (Offline) |
| 12 | BloodHound enumeration | Discovery | T1087.002 Domain Account | **Detected** (Pivot) |
| 13 | Kerberoasting | Credential Access | T1558.003 Kerberoasting | **Detected** |
| 14 | DCSync | Credential Access | T1003.006 DCSync | **Detected** |
| 15 | Pass-the-Hash | Lateral Movement | T1550.002 Pass the Hash | **Detected** |
| 16 | Golden Ticket | Credential Access / Persistence | T1558.001 Golden Ticket | **Detected** |
| 17 | DC persistence | Persistence | T1136.002 Domain Account | **Detected** |
| 18 | Collection | Collection | T1005 Data from Local System | **Detected** |
| 19 | Exfiltration | Exfiltration | T1041 Exfiltration Over C2 Channel | **Detected** (Pivot) |
| 20 | Impact | Impact | T1491.001 Internal Defacement | **Detected** |

Full detail: [02-Attack-Simulation/README.md](02-Attack-Simulation/README.md).

## Known gaps

- **Cloud addressing is summarized, not published.** The `10.122.0.0/16` summary covers two non-overlapping `/24` VNets joined by peering; it is not one flat subnet. Exact per-VNet/subnet CIDRs vary by provider build and are not documented here. Public cloud IPs are dynamic and are deliberately excluded.
- **Intra-subnet lateral movement is invisible to Suricata.** Victim-to-victim traffic stays inside `192.168.56.0/24` and never crosses the gateway. Detection on those stages relies on Wazuh and host telemetry.
- **Offline stages generate zero victim telemetry.** Hash cracking (Stage 04) and NTLMv2 cracking (Stage 11) occur on the attacker GPU and produce no network or host telemetry by definition.

## Project status

| Area | Status |
|---|---|
| Lab setup documentation | **Complete** — reconciled with live configuration |
| Attack stage write-ups | **Complete** — all 20 stages documented with commands and screenshots |
| Detection coverage matrix | **Complete** — 16 detected, 4 documented gaps |
| Stage-wise investigation | **In progress** — analyst triage pending |
| TheHive case summaries | **Scaffolded** — 3 cases defined |
| Incident report | **Scaffolded** — draft pending |

## Evidence convention

All attack and alert evidence screenshots live in dedicated evidence folders:

- `02-Attack-Simulation/Attack-Screenshots/` — attacker-side terminal outputs and tools (`1.png` – `60.png`)
- `03-Detection-Engineering/TheHive_Alert-ScreenShot/` — TheHive and Wazuh alert evidence (`1.png` – `22.4.png`)
- `06-Resources/attack-chain-full.pdf` — unredacted campaign master blueprint reference

Never include cloud public IPs, provider hostnames, API keys, VPN keys, or real password hashes. See [SECURITY.md](SECURITY.md).

## Detection performance

Empirical results across the 20-stage attack simulation:

| Metric | Value |
|---|---|
| Stages executed | 20 |
| Stages with verified detection | 16 (80.0%) |
| Inherent offline gaps | 2 (DG-04, DG-11) |
| Logging / visibility gaps | 2 (DG-09, DG-12) |
| Rule failures | 0 |
| False positives reviewed | 3 |

## Skills demonstrated

Attack simulation, Active Directory attack paths, Suricata and Wazuh detection, detection engineering, alert triage, TheHive case management, IOC extraction, timeline reconstruction, Velociraptor forensics, network segmentation and VPN design, incident reporting, and technical documentation.

## Visual tour (optional)

The repository is the record; the site is a presentation layer over the same data. It is not required to read the lab.

- **Open locally:** `python -m http.server 8000 --directory Site`, then <http://localhost:8000/>
- **Site notes and deployment:** [Site/README.md](Site/README.md)
- **Pages workflow:** [.github/workflows/pages.yml](.github/workflows/pages.yml) publishes only `Site/`

## Start here

1. [Architecture & Network](01-Lab-Setup/architecture.md)
2. [Attack chain overview](02-Attack-Simulation/README.md)
3. [Detection coverage matrix](03-Detection-Engineering/coverage-matrix.md)
4. [Pipeline & Automation bridge](03-Detection-Engineering/pipeline-thecustomhive.md)
5. [Investigation methodology](04-Investigation/README.md)
6. [Incident report](05-Incident-Report/incident-report.md)
7. [Master index](INDEX.md)

## License

MIT. See [LICENSE](LICENSE).
