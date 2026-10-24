# TheHive / Automation VM

> Central hub for case management, DFIR tooling, VPN gateway, and internal reverse proxy.  
> This VM consolidates five core roles to keep the cloud footprint lean while remaining functionally segmented.

---

## Role Summary

| # | Service | Purpose | Listening Port(s) |
|---|---------|---------|-------------------|
| 1 | **TheHive 5.7.5-1** | Case & alert management | `9000/TCP` |
| 2 | **Velociraptor 0.77.3** | Endpoint forensics & live response | `8000/TCP` (frontend), `8889/TCP` (GUI) |
| 3 | **WireGuard** | Encrypted tunnel — only public entry point | `51820/UDP` |
| 4 | **Nginx Proxy Manager** | Internal reverse proxy (VPN-only domains) | `80`, `81`, `443/TCP` |
| 5 | **IP Forwarding / Cloud Router** | Routes agent traffic to Wazuh VM via VNet peering | — |

---

## VM Specifications

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04.4 LTS |
| **RAM** | 16 GB |
| **vCPU** | 4 |
| **Disk** | 123 GB |
| **Cloud network** | `10.122.0.0/16` (one of two peered `/24` VNets) |
| **VPN address** | `10.8.0.1/24` |
| **Public exposure** | `51820/UDP` only |
| **Public IP** | Dynamic (not published) |
| **SSH key** | `manichand gupta@ManicLenovo` |

---

## 1 — TheHive 5.7.5-1 (Case Management)

Native install (not Docker). Backend powered by Cassandra and Elasticsearch.

| Component | Version |
|-----------|---------|
| TheHive | 5.7.5-1 |
| Cassandra | 4.1.12 |
| Elasticsearch | 8.19.23 |

- **Listen:** `9000/TCP` — reachable only over the WireGuard VPN
- **Organisation:** `SOC-Lab`
- **API key:** `<REDACTED>` (exported as env var `THEHIVE_API_KEY`)
- **Observable types:** IP, domain, file, hash, user, URL

### Case Structure

| Case | Title | Attack Stages |
|------|-------|---------------|
| Case 01 | Web compromise | Stages 01 – 07 |
| Case 02 | Lateral movement | Stages 08 – 14 |
| Case 03 | Domain compromise | Stages 15 – 20 |

---

## 2 — Velociraptor 0.77.3 (DFIR)

Native systemd service providing endpoint forensics and live-response capabilities.

| Parameter | Value |
|-----------|-------|
| **Frontend (client connections)** | `8000/TCP` |
| **GUI (analyst access)** | `8889/TCP` (VPN only) |
| **Connection model** | Client-initiated — victim hosts dial the server |

### Enrolled Clients

| Host | OS | Velociraptor Client Version |
|------|----|-----------------------------|
| DVWA (Ubuntu) | Ubuntu 24.04 | 0.77.1 |
| Windows 10 | Windows 10 Pro N | 0.77.1 |
| Domain Controller | Windows Server 2022 | 0.77.1 |

### Collected Artifacts

- Process listing
- Network connections
- Persistence checks
- File collection
- User accounts

---

## 3 — WireGuard VPN Server

The **only publicly exposed service** in the entire lab. All analyst and agent traffic enters through this tunnel.

| Parameter | Value |
|-----------|-------|
| **Interface** | `wg0` |
| **Address** | `10.8.0.1/24` |
| **Listen port** | `51820/UDP` |
| **MTU** | 1420 |
| **NAT** | Masquerade on `eth0` |

### Peers

| Peer | Tunnel Address | Role |
|------|----------------|------|
| Suricata gateway | `10.8.0.2/32` | VPN client carrying agent logs + SOC access |
| Host laptop | `10.8.0.3/32` | Analyst direct access |

### Server Configuration — `/etc/wireguard/wg0.conf`

```ini
[Interface]
Address    = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <REDACTED>
MTU        = 1420
PostUp     = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown   = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
# Suricata gateway
PublicKey    = <REDACTED>
AllowedIPs   = 10.8.0.2/32, 192.168.232.0/24, 192.168.56.0/24
PersistentKeepalive = 25

[Peer]
# Host laptop
PublicKey    = <REDACTED>
AllowedIPs   = 10.8.0.3/32
PersistentKeepalive = 25
```

The Suricata peer's `AllowedIPs` include both on-prem subnets (`192.168.232.0/24` and `192.168.56.0/24`) so that return traffic for Wazuh agent enrollment and event shipping can route back through the tunnel.

---

## 4 — Nginx Proxy Manager (Internal Reverse Proxy)

Runs as a Docker container. Provides friendly domain names for internal services, accessible **only over WireGuard** — no public DNS record, no public listener.

| Internal Domain | Backend | Proxy Port |
|-----------------|---------|------------|
| `thehive.lab` | `localhost:9000` | `443` |
| `wazuh.lab` | `<wazuh-vm-private>:443` | `443` |
| `velo.lab` | `localhost:8889` | `443` |
| `npm.lab` | `localhost:81` | `443` |

Container ports: `80`, `81`, `443/TCP`.

---

## 5 — Cloud Router (IP Forwarding)

This VM doubles as a software router, forwarding Wazuh agent traffic arriving on `wg0` to the Wazuh VM over VNet peering.

```bash
# Kernel forwarding
net.ipv4.ip_forward = 1
```

### Return Routes

| Destination | Next Hop |
|-------------|----------|
| `192.168.56.0/24` | via `wg0` |
| `192.168.232.0/24` | via `wg0` |

Traffic flow: on-prem agents → Suricata gateway → WireGuard tunnel → this VM (`10.8.0.1`) → VNet peering → Wazuh VM `1514/TCP`.

---

## 6 — Alert Ingestion (TheHive Endpoint)

TheHive receives incoming alerts pushed directly from the Wazuh Manager VM over private VNet peering.

- **Ingestion Hook:** Wazuh Manager pushes correlated batches to `http://10.122.0.4:9000/api/v1`
- **Automation Engine:** Powered by `thecustomhive` (running on the Wazuh VM via `thehive-flush.service`)
- **Full Architecture & Source Code:** See [pipeline-thecustomhive.md](../../03-Detection-Engineering/pipeline-thecustomhive.md) and [`03-Detection-Engineering/Wazuh/`](../../03-Detection-Engineering/Wazuh/)

---

## Consolidated Services & Ports

| Port | Protocol | Service | Exposure |
|------|----------|---------|----------|
| `51820` | UDP | WireGuard | **Public** (only public port) |
| `9000` | TCP | TheHive | VPN / Peered VNet (`10.122.0.4`) |
| `8889` | TCP | Velociraptor GUI | VPN only |
| `8000` | TCP | Velociraptor frontend | VPN only (client-initiated) |
| `443` | TCP | Nginx Proxy Manager (HTTPS) | VPN only |
| `81` | TCP | Nginx Proxy Manager (admin) | VPN only |
| `80` | TCP | Nginx Proxy Manager (HTTP redirect) | VPN only |

---

## Why These Roles Share One VM

Consolidating these services on a single host is a deliberate engineering trade-off for a lean lab environment:

- **Cost efficiency** — one 16 GB VM avoids multi-node cloud overhead.
- **Routing simplicity** — a single WireGuard endpoint avoids split-tunnel routing complexity.
- **Low throughput** — lab traffic volumes never stress shared system resources.

### Single Point of Failure

If this VM goes down, gateway connectivity, case management, and forensics are interrupted. The Wazuh VM continues ingesting telemetry and buffering alerts locally in SQLite WAL until TheHive becomes reachable again.

---

## Verification Commands

```bash
# Check all listening sockets
sudo ss -ltnup

# WireGuard tunnel status
sudo wg show

# Service health
systemctl status thehive
systemctl status velociraptor_server
systemctl status wg-quick@wg0
docker ps                              # NPM container

# Connectivity to Wazuh VM over VNet peering
nc -vz <wazuh-vm-private> 1514
nc -vz <wazuh-vm-private> 443
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [wazuh.md](wazuh.md) | Wazuh SIEM VM — rules, agents, indexer |
| [pipeline-thecustomhive.md](../../03-Detection-Engineering/pipeline-thecustomhive.md) | Alert pipeline (Wazuh → TheHive) |
| [rules.md](../../03-Detection-Engineering/Wazuh/rules.md) | Custom Wazuh detection rules |
