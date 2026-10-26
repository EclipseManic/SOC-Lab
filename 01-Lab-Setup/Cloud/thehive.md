# TheHive / Automation VM — Case Management, DFIR & Cloud Gateway

> Central cloud hub for security incident case management, DFIR live response, encrypted WireGuard VPN ingress, and internal reverse proxying.  
> This host consolidates five core roles onto a single 16 GB instance (`10.122.0.4`), keeping the cloud footprint lean while preserving functional segmentation.

---

## Role Summary

| # | Service | Purpose | Listening Port(s) | Management / Auth |
|---|---------|---------|-------------------|-------------------|
| 1 | **TheHive 5.7.5-1** | Case & alert management | `9000/TCP` | Native service · Cassandra + Elasticsearch |
| 2 | **Velociraptor 0.77.3** | Endpoint DFIR & live response | `8000/TCP` (frontend), `8889/TCP` (GUI) | Native systemd service · client-initiated |
| 3 | **WireGuard VPN** | Encrypted tunnel — only public entry point | `51820/UDP` | Kernel module · key-based auth |
| 4 | **Nginx Proxy Manager** | Internal reverse proxy (VPN-only domains) | `80`, `81`, `443/TCP` | Docker container · custom TLS |
| 5 | **Cloud Router** | IP forwarding for agent logs to Wazuh | — | Kernel forwarding (`net.ipv4.ip_forward = 1`) |

---

## VM Specifications

| Property | Value |
|----------|-------|
| **Hostname** | `thehive-core` |
| **OS** | Ubuntu 24.04.4 LTS (Noble Numbat) |
| **RAM** | 16 GB |
| **vCPU** | 4 |
| **Disk** | 123 GB SSD |
| **Cloud Subnet** | `10.122.0.0/24` private subnet (within `10.122.0.0/16` VPC) |
| **Private IP** | `10.122.0.4` |
| **VPN Address** | `10.8.0.1/24` (`wg0`) |
| **Public Exposure** | `51820/UDP` only (WireGuard) |
| **Public IP** | Dynamic (not published; VPN access only) |
| **SSH Management** | Host laptop key (`analyst@soc-workstation`) |

---

## 1. TheHive 5.7.5-1 (Case Management & Database Stack)

TheHive runs as a native systemd service supported by Apache Cassandra for graph/metadata storage and Elasticsearch for fast full-text searching.

### Architecture Components

| Component | Version | Port | Purpose |
|-----------|---------|------|---------|
| **TheHive** | 5.7.5-1 | `9000/TCP` | Analyst UI, REST API, alert ingestion |
| **Apache Cassandra** | 4.1.12 | `7000`, `9042/TCP` | Distributed NoSQL database (JanusGraph backend) |
| **Elasticsearch** | 8.19.23 | `9200`, `9300/TCP` | Alert indexing and full-text search engine |

---

### Step 1: Cassandra 4.1.12 Provisioning

```bash
# 1. Install Java 17 prerequisite and Cassandra dependencies
sudo apt-get update && sudo apt-get install -y openjdk-17-jre-headless apt-transport-https gnupg

# 2. Add Cassandra official repository
echo "deb https://debian.cassandra.apache.org 41x main" | sudo tee /etc/apt/sources.list.d/cassandra.sources.list
curl -s https://downloads.apache.org/cassandra/KEYS | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/cassandra.gpg --import && sudo chmod 644 /usr/share/keyrings/cassandra.gpg

sudo apt-get update
sudo apt-get install -y cassandra=4.1.12
```

Configure `/etc/cassandra/cassandra.yaml`:
```yaml
cluster_name: 'thp'
listen_address: 10.122.0.4
rpc_address: 10.122.0.4
seed_provider:
  - class_name: org.apache.cassandra.locator.SimpleSeedProvider
    parameters:
      - seeds: "10.122.0.4"
```

Start and verify Cassandra cluster:
```bash
sudo systemctl enable --now cassandra
nodetool status
# Status=Up/State=Normal (UN) 10.122.0.4
```

---

### Step 2: Elasticsearch 8.19.23 Provisioning

```bash
# 1. Install Elasticsearch 8
wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] https://artifacts.elastic.co/packages/8.x/apt stable main" | sudo tee /etc/apt/sources.list.d/elastic-8.x.list
sudo apt-get update && sudo apt-get install -y elasticsearch=8.19.23
```

Configure `/etc/elasticsearch/elasticsearch.yml`:
```yaml
cluster.name: thehive
network.host: 127.0.0.1
http.port: 9200
discovery.type: single-node
xpack.security.enabled: false
```

Start Elasticsearch:
```bash
sudo systemctl enable --now elasticsearch
curl -s http://127.0.0.1:9200 | grep "number"
# "number" : "8.19.23"
```

---

### Step 3: TheHive 5.7.5 Application Configuration (`/etc/thehive/application.conf`)

Install TheHive repository and package:
```bash
# 1. Add StrangeBee repository
curl -fsSL https://deb.strangebee.com/keys/strangebee.gpg | sudo gpg --dearmor -o /usr/share/keyrings/strangebee-archive-keyring.gpg
echo 'deb [signed-by=/usr/share/keyrings/strangebee-archive-keyring.gpg] https://deb.strangebee.com thehive-5.2 main' | sudo tee /etc/apt/sources.list.d/strangebee.list

sudo apt-get update && sudo apt-get install -y thehive=5.7.5-1
```

Configure `/etc/thehive/application.conf`:
```hocon
# Local file storage location for evidence attachments
storage {
  provider = localfs
  localfs.location = "/opt/thp/files"
}

# Database backend connection to Cassandra
db.janusgraph {
  storage {
    backend = cql
    hostname = ["10.122.0.4"]
    cql {
      cluster-name = "thp"
      keyspace = "thehive"
    }
  }
}

# Index engine connection to Elasticsearch
search {
  provider = elasticsearch
  elasticsearch {
    hosts = ["http://127.0.0.1:9200"]
    index-prefix = "thehive"
  }
}
```

Enable and start TheHive:
```bash
sudo mkdir -p /opt/thp/files && sudo chown -R thehive:thehive /opt/thp
sudo systemctl enable --now thehive
```

### Initial Administrative Setup & Case Templates
- **Organisation Created:** `SOC-Lab`
- **Analyst Role:** `org-admin` (`analyst@soc-workstation`)
- **API Key Generated:** Exported to `/var/ossec/integrations/custom-thehive` on Wazuh VM as `THEHIVE_API_KEY`
- **Case Hierarchy:**
  - `Case 01 — Web Compromise`: Stages 01 – 07 (Recon, SQLi, web shell, root privesc)
  - `Case 02 — Lateral Movement`: Stages 08 – 14 (SSH persistence, pivot, Responder, BloodHound, Kerberoasting)
  - `Case 03 — Domain Compromise`: Stages 15 – 20 (DCSync, pass-the-hash, Golden Ticket, persistence, exfil, impact)

---

## 2. Velociraptor 0.77.3 (DFIR & Live Forensics)

Velociraptor runs as a native systemd server providing endpoint hunting, live artifact collection, and triage.

### Server Provisioning

```bash
# 1. Download official Velociraptor binary
sudo wget -O /usr/local/bin/velociraptor https://github.com/Velocidex/velociraptor/releases/download/v0.77.3/velociraptor-v0.77.3-linux-amd64
sudo chmod +x /usr/local/bin/velociraptor

# 2. Generate initial server configuration
mkdir -p /etc/velociraptor
sudo /usr/local/bin/velociraptor config generate > /etc/velociraptor/velociraptor.config.yaml
```

Tune `/etc/velociraptor/velociraptor.config.yaml`:
- **Frontend (Agent Comm):** `0.0.0.0:8000/TCP` (reachable via WireGuard)
- **GUI (Analyst Web Console):** `10.8.0.1:8889/TCP` (restricted to VPN pool)

Create systemd service `/etc/systemd/system/velociraptor_server.service`:
```ini
[Unit]
Description=Velociraptor DFIR Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/velociraptor --config /etc/velociraptor/velociraptor.config.yaml frontend
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Start the service and extract the client configuration:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now velociraptor_server

# Generate client onboarding configuration
sudo /usr/local/bin/velociraptor --config /etc/velociraptor/velociraptor.config.yaml config client > /etc/velociraptor/client.config.yaml
```

### Enrolled Clients & Artifact Collection

| Endpoint Host | Operating System | Client Version | Client ID |
|---------------|------------------|----------------|-----------|
| **DVWA** | Ubuntu 24.04 LTS | 0.77.1 | `C.34fd07e6c2ec0623` |
| **Windows 10** | Windows 10 Pro N (22H2) | 0.77.1 | Active enrollment |
| **Domain Controller** | Windows Server 2022 | 0.77.1 | Active enrollment |

---

## 3. WireGuard VPN Server (`51820/UDP`)

WireGuard provides the single secure public entrance to the entire lab environment. All external telemetry, red-team victim responses, and analyst management traffic enter through this encrypted UDP tunnel.

### Configuration (`/etc/wireguard/wg0.conf`)

```ini
[Interface]
Address    = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <REDACTED>
MTU        = 1420
PostUp     = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE
PostDown   = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -s 10.8.0.0/24 -o eth0 -j MASQUERADE

[Peer]
# Suricata Gateway (Carries on-prem victim traffic and logs)
PublicKey    = <REDACTED>
AllowedIPs   = 10.8.0.2/32, 192.168.232.0/24, 192.168.56.0/24
PersistentKeepalive = 25

[Peer]
# Analyst Laptop (Direct management access)
PublicKey    = <REDACTED>
AllowedIPs   = 10.8.0.3/32
PersistentKeepalive = 25
```

Enable and start the WireGuard interface:
```bash
sudo systemctl enable --now wg-quick@wg0
sudo wg show
# interface: wg0
#   public key: ...
#   listening port: 51820
```

---

## 4. Nginx Proxy Manager (Internal TLS Reverse Proxy)

Runs in Docker to provide friendly internal hostnames with valid TLS certificates for analyst access over the VPN. No public DNS or public listeners exist.

### Docker Compose Configuration (`/opt/npm/docker-compose.yml`)

```yaml
version: '3.8'
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

Deploy the container:
```bash
cd /opt/npm && sudo docker compose up -d
```

### Configured Internal Hostnames

| Internal Domain | Destination Backend | HTTPS Port | Purpose |
|-----------------|---------------------|:---:|---------|
| `thehive.lab` | `http://localhost:9000` | `443` | TheHive 5 Analyst Web UI |
| `wazuh.lab` | `https://10.122.1.4:443` | `443` | Wazuh Dashboard Web Interface |
| `velo.lab` | `https://localhost:8889` | `443` | Velociraptor Forensics Console |

The NPM web administration console is accessed strictly at **`https://10.122.0.4:81`** using custom-generated TLS certificates.

---

## 5. Cloud Router & Zero-NAT IP Preservation

This VM acts as a central cloud router forwarding on-prem agent traffic arriving on `wg0` to the Wazuh SIEM VM over VNet peering (`10.122.0.0/16`).

### Kernel Forwarding (`/etc/sysctl.conf`)

```ini
net.ipv4.ip_forward = 1
```

Activate immediately:
```bash
sudo sysctl -p
```

### Preserving Authentic Source IPs

- **Zero-NAT on Transit:** When on-prem agents on `192.168.56.0/24` ship logs over `wg0`, packets pass through this VM without undergoing source NAT.
- **Static Return Routes:** TheHive VM routes responses back to `wg0`:
  ```bash
  sudo ip route add 192.168.56.0/24 dev wg0
  sudo ip route add 192.168.232.0/24 dev wg0
  ```
- **Result:** Wazuh Manager sees the true endpoint IP (`192.168.56.10`, `.20`, `.30`) rather than `10.8.0.2` or `10.122.0.4`, ensuring exact source attribution in all alerts.

---

## 6. Alert Ingestion & API Security

Correlated alert batches are pushed directly from Wazuh Manager to TheHive REST API across private VNet peering:

- **Ingestion Hook:** `http://10.122.0.4:9000/api/v1`
- **Engine:** Powered by `thecustomhive` (running via `thehive-flush.service` on Wazuh VM)
- **Batch Processing:** 5-second polling loop delivering burst-correlated cases
- **Documentation:** [README.md#5-telemetry-architecture-live-soar-ingestion-vs-analyst-dashboard-triage](../../03-Detection-Engineering/README.md#5-telemetry-architecture-live-soar-ingestion-vs-analyst-dashboard-triage)

---

## 7. Service Port Matrix

| Port | Protocol | Service | Exposure | Purpose |
|------|----------|---------|----------|---------|
| `51820` | UDP | WireGuard | **Public** | Encrypted tunnel entry |
| `9000` | TCP | TheHive 5 | VPN / Peered VNet | Case management & API |
| `7000`, `9042` | TCP | Apache Cassandra | Localhost / Peered VNet | Metadata graph storage |
| `9200`, `9300` | TCP | Elasticsearch | Localhost | Alert indexing & search |
| `8889` | TCP | Velociraptor GUI | VPN only | Live response web console |
| `8000` | TCP | Velociraptor Frontend | VPN only | Client communications |
| `443` | TCP | Nginx Proxy Manager | VPN only | HTTPS reverse proxy |
| `81` | TCP | NPM Admin Console | VPN only | Proxy configuration (`https://10.122.0.4:81`) |
| `80` | TCP | Nginx Proxy Manager | VPN only | HTTP to HTTPS redirect |

> [!NOTE]
> **Caldera Installation Note:** MITRE Caldera is installed at `/opt/caldera-venv/` with listeners on ports `8888`, `2222`, `8022`, `7012`, `7010`. In this campaign, all 20 adversary stages were executed manually via authentic red-team tradecraft from Kali and DVWA, so Caldera remained unutilized during active simulation runs.

---

## 8. Verification & Diagnostics Commands

```bash
# 1. Check all listening sockets
sudo ss -ltnup

# 2. WireGuard tunnel handshake and peers
sudo wg show

# 3. Check health of core systemd services
sudo systemctl status thehive --no-pager
sudo systemctl status cassandra --no-pager
sudo systemctl status elasticsearch --no-pager
sudo systemctl status velociraptor_server --no-pager
sudo systemctl status wg-quick@wg0 --no-pager

# 4. Check Docker Nginx Proxy Manager container
sudo docker ps

# 5. Verify connectivity to Wazuh SIEM over VNet peering
nc -zv 10.122.1.4 1514
nc -zv 10.122.1.4 443
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [wazuh.md](wazuh.md) | Wazuh SIEM VM — rules, CDB lists, agent ingestion, indexer |
| [thecustomhive Pipeline](../../03-Detection-Engineering/README.md#5-telemetry-architecture-live-soar-ingestion-vs-analyst-dashboard-triage) | Alert pipeline architecture (Wazuh → TheHive) |
| [Wazuh Detection Rules](../../03-Detection-Engineering/Wazuh/README.md) | Custom Wazuh detection rules & suppressions |
