# 01 – Lab Setup & Architecture

> A production-mode hybrid SOC laboratory: local victim and attacker subnets connected over an encrypted WireGuard tunnel to a dual-VM cloud SIEM and case management stack.

---

## Complete Architecture Overview

The entire laboratory architecture—from the isolated attacker workstation on VMware to the split-cloud SIEM infrastructure—is captured in the master topology diagram below:

[![SOC Lab Complete Architecture](../06-Resources/Diagrams/SOC_Lab_Architecture.png)](../06-Resources/Diagrams/SOC_Lab_Architecture.png)

*Figure 1: Master architecture blueprint of the SOC Lab ([view full-resolution 4K asset](../06-Resources/Diagrams/SOC_Lab_Architecture.png)).*

---

## Architectural Philosophy & Engineering Decisions

Building an enterprise-grade detection environment on personal hardware requires balancing realistic network segregation, hypervisor performance, and cloud resource constraints. Four core design decisions define this lab:

### 1. Split-Cloud SOC Infrastructure (2 × Dedicated VMs)
- **The Problem:** Running Wazuh Manager, OpenSearch Indexer, Wazuh Dashboard, TheHive 5, Apache Cassandra, and Elasticsearch on a single cloud VM leads to memory starvation, JVM heap thrashing, and dropped agent events under heavy attack loads.
- **The Solution:** The cloud environment is split across two peered virtual machines on a shared private subnet (`10.122.0.0/16`):
  - **VM1 (`10.122.0.4`):** Ingress Hub, Case Management & Response (`TheHive 5`, `Cassandra 4.x`, `Elasticsearch 8.x`, `Velociraptor Server`, `Nginx Proxy Manager`, and `WireGuard Server`).
  - **VM2 (`10.122.0.5`):** Detection & Analytics (`Wazuh Manager 4.x`, `Wazuh Indexer`, `Wazuh Dashboard`, and the `custom-thehive` correlation daemon).
- **The Result:** Complete JVM isolation, stable log ingestion, and clean separation between detection engineering and incident case management.

### 2. Zero Public Cloud IPs & the "Single Inbound Port" Principle
- **The Problem:** Exposing SIEM dashboards, database ports (Elasticsearch `9200`, Cassandra `9042`), or API management endpoints directly to the public internet creates unacceptable security risk and constant brute-force noise.
- **The Solution:** Neither cloud VM has public web ports exposed. The **only** inbound port permitted across the cloud security group is **UDP 51820 (WireGuard VPN)** on VM1.
- **The Result:** All web dashboards (`https://wazuh.lab`, `https://thehive.lab`, `https://velo.lab`, `https://npm.lab`) are accessible strictly through the encrypted WireGuard tunnel via Nginx Proxy Manager with private TLS termination.

### 3. Dual-Homed Gateway: Perimeter Router + Passive NIDS
- **The Problem:** Running Suricata inline (IPS mode with NFQUEUE or inline bridging) can introduce packet jitter, drop timing-sensitive red-team scans (e.g. Nmap or Nikto), and distort real-world lateral movement dynamics.
- **The Solution:** The Ubuntu Security Gateway is dual-homed (`ens33` on `192.168.232.0/24` facing Kali; `ens37` on `192.168.56.0/24` facing the victims). It acts as an active Layer 3 router (`net.ipv4.ip_forward = 1`) with static routing enforced on Kali, while running Suricata 8.0.6 in **passive AF-PACKET promiscuous IDS mode** on `ens37`.
- **The Result:** Authentic adversary traffic delivery with zero packet distortion, combined with full wire-level packet inspection and logging to `eve-alert.json`.

### 4. Source IP Preservation (No Masquerading on Tunnel)
- **The Problem:** Applying standard NAT/MASQUERADE to traffic exiting the victim network into the WireGuard tunnel would cause all endpoint events to appear as originating from the gateway (`10.8.0.2`), breaking agent identity and source-based detection rules in Wazuh.
- **The Solution:** The gateway forwards victim telemetry directly into the WireGuard interface (`wg0`) without NAT. The cloud VPN hub (`10.8.0.1`) maintains a static kernel route directing `192.168.56.0/24` back through `10.8.0.2`.
- **The Result:** Wazuh Manager registers agents and correlates telemetry with authentic victim IP addresses (`192.168.56.10`, `.20`, `.30`).

---

## Lab Segmentation & Zone Profiles

The architecture spans four clearly bounded security zones:

```
┌─────────────────────────────────────────────────────────────┐
│                   LOCAL LAB (ON HOST LAPTOP)                │
│                                                             │
│  [Zone 1: Attacker]         [Zone 2: Security Gateway]      │
│  Kali Linux                 Ubuntu Server (Dual-NIC)        │
│  192.168.232.135/24 ──────▶ ens33: 192.168.232.162/24       │
│  (VMnet8 NAT)               ens37: 192.168.56.150/24        │
│                                    │                        │
│                                    ▼                        │
│                             [Zone 3: Victim Network]        │
│                             192.168.56.0/24 (VMnet2)        │
│                             ├─ DC: 192.168.56.10            │
│                             ├─ Win10: 192.168.56.20         │
│                             └─ DVWA: 192.168.56.30          │
└────────────────────────────────────┬────────────────────────┘
                                     │ WireGuard Tunnel (UDP 51820)
                                     │ 10.8.0.0/24
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│              CLOUD SOC INFRASTRUCTURE (2 × VMs)             │
│              Shared Private Subnet: 10.122.0.0/16           │
│                                                             │
│  [VM1 — TheHive & Ingress]    [VM2 — Wazuh SIEM]            │
│  Private: 10.122.0.4          Private: 10.122.0.5           │
│  • WireGuard Server (10.8.0.1) • Wazuh Manager & Indexer    │
│  • TheHive 5 Case Management   • Wazuh Dashboard (5601)     │
│  • Nginx Proxy Manager         • thecustomhive SOAR Daemon  │
│  • Velociraptor Server         • SQLite WAL Event Queue     │
└─────────────────────────────────────────────────────────────┘
```

### Zone 1: Attacker Zone (Kali Linux)
- **Subnet:** `192.168.232.0/24` (VMware VMnet8 NAT)
- **Host:** Kali Linux (`192.168.232.135/24`)
- **Routing:** Default route `0.0.0.0/0` points to VMware NAT gateway (`192.168.232.2`) for package updates. Static host route `192.168.56.0/24 via 192.168.232.162` forces all attack traffic through the Security Gateway router.
- **Tooling:** Nmap, Metasploit, Burp Suite, Hydra, Impacket (`wmiexec`, `GetUserSPNs`, `secretsdump`), BloodHound, Responder, CrackMapExec, Hashcat.

### Zone 2: Security Gateway (Ubuntu Server & Suricata)
- **Subnets:** Dual-homed on `192.168.232.0/24` (`ens33: 192.168.232.162`) and `192.168.56.0/24` (`ens37: 192.168.56.150`).
- **Roles:**
  - **Linux Router:** Kernel IP forwarding enabled (`sysctl net.ipv4.ip_forward=1`).
  - **Perimeter NIDS:** Suricata 8.0.6 operating with multi-threaded AF-PACKET promiscuous sniffing on `ens37`.
  - **VPN Client:** WireGuard client interface `wg0` (`10.8.0.2/32`) establishing the encrypted uplink to the cloud hub.
  - **Log Forwarder:** Wazuh Agent streaming `eve-alert.json` to the cloud Wazuh Manager.

### Zone 3: Victim Network (Isolated Enterprise Subnet)
- **Subnet:** `192.168.56.0/24` (VMware VMnet2 Host-Only, no direct internet access). Default gateway: `192.168.56.150`.
- **Hosts:**
  - **Windows Server 2022 (Domain Controller — `192.168.56.10`):** Active Directory Domain Services (`ad.lab`), DNS, Kerberos KDC, Sysmon endpoint logging, Wazuh Agent (`DomainWin10`), Velociraptor client.
  - **Windows 10 Workstation (`192.168.56.20`):** Domain-joined endpoint (`ad\victim`), Sysmon telemetry, Wazuh Agent (`Win10User`), Velociraptor client.
  - **DVWA Web Server (`192.168.56.30`):** Dual-purpose Linux host functioning as both the external vulnerable web target (Apache/MySQL) and internal adversary pivot. Instrumented with Linux Auditd syscall tracking (`audit.rules`), custom Bash command execution auditing (`bashcmd`), Wazuh Agent (`DVWA`), and Velociraptor client.

### Cloud SOC Infrastructure (VM1 & VM2)
- **Private Subnet:** `10.122.0.0/16` (peered cloud virtual network; zero public IP exposure).
- **VM1 — Case Management & Hub (`10.122.0.4`):**
  - WireGuard VPN Server listening on `UDP 51820` (`wg0: 10.8.0.1/24`).
  - TheHive 5 incident response platform backed by Apache Cassandra 4.x and Elasticsearch 8.x.
  - Nginx Proxy Manager terminating TLS and routing `*.lab` requests to internal services.
  - Velociraptor 0.77 digital forensics and endpoint response server.
- **VM2 — Wazuh SIEM & Integration (`10.122.0.5`):**
  - Wazuh Manager 4.x (analysis engine, custom XML decoders/rules).
  - Wazuh Indexer (OpenSearch-based distributed storage and indexing).
  - Wazuh Dashboard (`5601/TCP`).
  - `custom-thehive.py` correlation engine + `thehive-flush.service` background daemon.

---

## High-Level Automation & Response Flow

The end-to-end pipeline moves from adversary wire execution to formal SOC case resolution in 7 distinct steps:

```
[Adversary Execution]
       │ (1) Kali attacks victim subnet (192.168.56.0/24)
       ▼
[Security Gateway (Suricata)]
       │ (2) Wire inspection on ens37 -> eve-alert.json
       ▼
[WireGuard VPN Tunnel]
       │ (3) Suricata & host agent events streamed via UDP 51820 to 10.122.0.5:1514
       ▼
[Wazuh Manager (VM2)]
       │ (4) Rule engine evaluates logs; Level >= 8 alerts queued into SQLite WAL
       │     thecustomhive correlation daemon groups bursts by tool & host
       ▼
[TheHive 5 REST API (VM1)]
       │ (5) High-confidence alerts created automatically over private peering
       ▼
[SOC Analyst Triage]
       │ (6) Analyst investigates alert observables, timeline, and false-positive context
       │     Promotes true positives to formal multi-stage Incident Cases
       ▼
[Velociraptor DFIR (VM1)]
       │ (7) On-demand live endpoint artifact collection, memory dumps, and process inspection
```

---

## IP Address Plan & Port Matrix

### Addressing Table

| Device / Network | IP Address / Range | Subnet / Interface | Purpose & Roles |
|---|---|---|---|
| **Kali Linux** | `192.168.232.135/24` | VMnet8 (NAT) / `eth0` | Attacker workstation; default route via `.2`, static route to `.56.0/24` |
| **Security Gateway (NAT)** | `192.168.232.162/24` | VMnet8 / `ens33` | External gateway interface receiving Kali attack traffic |
| **Security Gateway (Internal)** | `192.168.56.150/24` | VMnet2 / `ens37` | Default gateway for victim network; Suricata AF-PACKET sensor |
| **Domain Controller** | `192.168.56.10/24` | VMnet2 / `Ethernet0` | Windows Server 2022: AD DS, DNS, Kerberos KDC, Sysmon, Wazuh Agent |
| **Windows 10 Workstation** | `192.168.56.20/24` | VMnet2 / `Ethernet0` | Domain-joined client workstation: Sysmon, Wazuh Agent |
| **DVWA Client** | `192.168.56.30/24` | VMnet2 / `ens33` | Ubuntu 24.04: Vulnerable web app + pivot host; Auditd, `bashcmd`, Wazuh |
| **WireGuard Tunnel** | `10.8.0.0/24` | Tunnel / `wg0` | Encrypted tunnel linking Security Gateway (`.2`) to Cloud Hub (`.1`) |
| **Cloud Subnet (VM1 & VM2)** | `10.122.0.0/16` | Private Cloud VNet | Peered private cloud network for SOC services (zero public IPs) |
| **Cloud VM1 (TheHive / Hub)** | `10.122.0.4` | Private Cloud / `eth0` | TheHive 5, Cassandra, Elasticsearch, Velociraptor, NPM, WireGuard Server |
| **Cloud VM2 (Wazuh SIEM)** | `10.122.0.5` | Private Cloud / `eth0` | Wazuh Manager, Indexer, Dashboard, `custom-thehive` flush daemon |

### Key Port Allocations

| Service / Component | Port | Protocol | Direction | Ingress Boundary |
|---|---|---|---|---|
| **WireGuard VPN** | `51820` | UDP | Inbound to VM1 | **Only public internet port open** |
| **Wazuh Agent $\rightarrow$ Manager** | `1514` | TCP | Local $\rightarrow$ Cloud (VM2) | Internal WireGuard tunnel |
| **Wazuh Agent Enrollment** | `1515` | TCP | Local $\rightarrow$ Cloud (VM2) | Internal WireGuard tunnel |
| **Wazuh REST API** | `55000` | TCP | Local/Cloud $\rightarrow$ VM2 | Internal WireGuard tunnel |
| **Wazuh Dashboard** | `5601` | HTTPS | VPN Client $\rightarrow$ VM2 | Internal WireGuard tunnel (`https://wazuh.lab`) |
| **TheHive Web UI** | `80` / `443` | TCP / HTTPS | VPN Client $\rightarrow$ VM1 | Internal WireGuard tunnel (`https://thehive.lab`) |
| **Velociraptor GUI** | `8889` | HTTPS | VPN Client $\rightarrow$ VM1 | Internal WireGuard tunnel (`https://velo.lab`) |
| **Nginx Proxy Manager** | `80` / `443` | TCP / HTTPS | VPN Client $\rightarrow$ VM1 | Internal WireGuard tunnel (`https://npm.lab`) |

---

## Sensor Visibility & Blind Spot Analysis

Understanding where security sensors have full visibility versus where blind spots exist is vital for detection engineering:

| Traffic Path | Suricata Visibility | Endpoint Visibility (Sysmon / Auditd / Wazuh) | Detection Rationale |
|---|---|---|---|
| **Kali $\rightarrow$ Victim Subnet** | ✅ **Full (Wire)** | ✅ **Full (Host)** | Inbound perimeter traffic crosses the gateway router (`ens33` $\rightarrow$ `ens37`). Suricata inspects full TCP streams; endpoint agents record execution. |
| **Victim $\rightarrow$ Cloud SIEM** | ✅ **Full (Wire)** | ✅ **Full (Log)** | Telemetry leaves `ens37` and enters `wg0`. Source IPs are preserved without NAT. |
| **Victim $\leftrightarrow$ Victim (Intra-Subnet)** | ⚠️ **Partial (Promiscuous)** | ✅ **Full (Host Authoritative)** | Intra-subnet traffic does not cross the Layer 3 router. However, Suricata's AF-PACKET promiscuous listener on `ens37` captured 14 broadcast/multicast wire alerts (e.g. Kerberos TGS requests). Direct unicast lateral movement (e.g. WMI process creation, Pass-the-Hash) is caught authoritatively by **Sysmon EID 1** and **Auditd**. |
| **Cloud $\leftrightarrow$ Cloud (VNet)** | ❌ **None (Out of Scope)** | ✅ **Internal Service Logs** | Wazuh-to-TheHive traffic traverses cloud private peering; never touches the local physical gateway. |

---

## Detailed Host Profiles & Technical Specifications

Each host has a dedicated, reproducible build specification:

| Document | Host / Role | Network Placement | Primary Software & Telemetry Stack |
|---|---|---|---|
| **[architecture.md](architecture.md)** | **Master Architecture Reference** | All Segments | Authoritative reference for topology, routing tables, and trust boundaries |
| **[Local/kali.md](Local/kali.md)** | **Attacker Workstation** | `192.168.232.135/24` (VMnet8) | Kali Linux 2024.x, full red-team toolchain, custom routing tables |
| **[Local/suricata-gateway.md](Local/suricata-gateway.md)** | **Security Gateway & NIDS** | Dual-NIC (`.232.162` / `.56.150`) | Ubuntu 24.04 LTS, Suricata 8.0.6 (AF-PACKET), WireGuard client, Wazuh Agent |
| **[Local/dvwa.md](Local/dvwa.md)** | **Web Target & Pivot** | `192.168.56.30/24` (VMnet2) | Ubuntu 24.04 LTS, Apache/MySQL, Linux Auditd (`audit.rules`), `bashcmd` decoder |
| **[Local/win10.md](Local/win10.md)** | **Domain Workstation** | `192.168.56.20/24` (VMnet2) | Windows 10 Pro N, Sysmon modular config, Wazuh Agent, Velociraptor client |
| **[Local/dc-ad.md](Local/dc-ad.md)** | **Domain Controller** | `192.168.56.10/24` (VMnet2) | Windows Server 2022, Active Directory Domain Services, DNS, Sysmon, Wazuh Agent |
| **[Cloud/thehive.md](Cloud/thehive.md)** | **Ingress & Case Hub (VM1)** | `10.122.0.4/16` (Cloud VNet) | TheHive 5, Cassandra 4.x, Elasticsearch 8.x, Velociraptor Server, WireGuard, NPM |
| **[Cloud/wazuh.md](Cloud/wazuh.md)** | **SIEM & Analytics (VM2)** | `10.122.0.5/16` (Cloud VNet) | Wazuh Manager 4.x, Wazuh Indexer, Dashboard, `custom-thehive` correlation daemon |

---

## Verification & Health Check Commands

To verify that the complete SOC lab pipeline is operational:

```bash
# 1. Verify WireGuard tunnel status on Security Gateway
sudo wg show wg0
# Expected: peer handshake active, transfer rx/tx incrementing

# 2. Test ping reachability across the encrypted tunnel
ping -c 3 10.8.0.1
ping -c 3 10.122.0.5

# 3. Confirm Linux kernel IP forwarding is active on the Gateway
sysctl net.ipv4.ip_forward
# Expected: net.ipv4.ip_forward = 1

# 4. Verify Wazuh Agent daemon status on Gateway or DVWA
sudo systemctl status wazuh-agent --no-pager
sudo /var/ossec/bin/agent_control -l    # (Run on Wazuh Manager)

# 5. Check TheHive correlation flush daemon status on Wazuh VM
sudo systemctl status thehive-flush.service --no-pager

# 6. Verify web dashboards over VPN (resolving *.lab via local hosts or NPM)
curl -k -I https://wazuh.lab
curl -k -I https://thehive.lab
curl -k -I https://velo.lab
```
