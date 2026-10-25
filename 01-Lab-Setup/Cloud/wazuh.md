# Wazuh SIEM VM

> Private SIEM stack — receives events from all monitored hosts, applies detection rules, and feeds alerts into the TheHive pipeline. No public IP; reachable only through the TheHive VM over VNet peering.

---

## VM Specifications

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04.4 LTS |
| **RAM** | 8 GB |
| **vCPU** | 2 |
| **Cloud network** | `10.122.1.0/24` private subnet (within `10.122.0.0/16` VPC) |
| **Private IP** | `10.122.1.4` |
| **Public IP** | None |
| **Public listeners** | None |
| **Access method** | VNet peering from TheHive VM; analyst access via WireGuard + NPM (`wazuh.lab`) |
| **SSH key** | `analyst@soc-workstation` |

---

## Components

| Component | Version | Purpose | Port / Path |
|-----------|---------|---------|-------------|
| Wazuh Manager | 4.14.8 | Receives events, applies rules, generates alerts | `1514/TCP` (events), `1515/TCP` (enrollment) |
| custom-thehive | — | POSIX wrapper & O(1) SQLite queue (Tier 1 Ingest) | `/var/ossec/integrations/custom-thehive` |
| thehive-flush.service | — | Background daemon (Tier 2 Async Flush to TheHive) | Service managing `custom-thehive.py --flush-daemon` |
| Wazuh Indexer | — | Stores and indexes alert data | `9200/TCP` |
| Wazuh Dashboard | — | Search, visualization, administration | `443/TCP` |

---

## Enrolled Agents

| Agent ID | Agent Name | Host | IP | OS | Status |
|:---:|------------|------|----|----|--------|
| `001` | **Suricata** | Suricata Gateway | `192.168.56.150` | Ubuntu 24.04 LTS | Active |
| `002` | **DVWA** | DVWA Web Server | `192.168.56.30` | Ubuntu 24.04 LTS | Active |
| `003` | **Win10User** | Windows 10 Workstation | `192.168.56.20` | Windows 10 Pro N (22H2) | Active |
| `004` | **DomainWin10** | Domain Controller (PC-DC) | `192.168.56.10` | Windows Server 2022 | Active |

---

## Agent Configuration

Each agent's `ossec.conf` points to the Wazuh Manager's private cloud IP over port `1514/TCP`.

### Example — DVWA Agent (`/var/ossec/etc/ossec.conf`)

```xml
<ossec_config>
  <client>
    <server>
      <address>10.122.1.4</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
  </client>
</ossec_config>
```

The on-prem agents do not have direct connectivity to the `10.122.0.0/16` network. Traffic is routed through the WireGuard tunnel (see [Forwarding Path](#forwarding-path) below).

---

## Agent Forwarding Path

How on-prem agents reach the cloud-hosted Wazuh Manager:

```
Victim host (192.168.56.x)
  → default gateway 192.168.56.150 (Suricata)
    → wg0 tunnel (10.8.0.2)
      → WireGuard → TheHive VM (10.8.0.1)
        → VNet peering
          → Wazuh VM 1514/TCP
```

Return traffic follows the reverse path. The TheHive VM has kernel forwarding enabled (`net.ipv4.ip_forward = 1`) and static routes for `192.168.56.0/24` and `192.168.232.0/24` pointing back through `wg0`.

---

## Alert Path & Integration Architecture

The manager evaluates incoming telemetry and automatically processes alerts through the local correlation pipeline:

```
Agent / Suricata Event
  → Wazuh Manager Engine (local_rules.xml evaluation)
    → Alert Level >= 8 Triggered
      → /var/ossec/integrations/custom-thehive (Tier 1: O(1) SQLite WAL queue - ZERO HTTP)
        → thehive-flush.service (Tier 2: Async Correlation Daemon on 5s loop)
          → HTTP POST over VNet peering (http://10.122.0.4:9000/api/v1)
            → TheHive 5 Case Management
              → Analyst Triage Queue
```

For full pipeline details, see [README.md#5-thecustomhive-alert-pipeline](../../03-Detection-Engineering/README.md#5-thecustomhive-alert-pipeline).

---

## Detection Content

Custom rules, decoders, and integration scripts are deployed directly on this Wazuh Manager. A brief summary is provided below; **full definitions and analysis are in Detection Engineering.**

### Custom Rule Summary

| Rule ID(s) | Detection |
|-------------|-----------|
| `100613` | Impacket wmiexec activity |
| `100603` | Sensitive privilege usage |
| `100410` | Suricata 4xx burst |
| `100201` | SQL injection (SQLi) patterns |
| `100100` – `100104` | Registry persistence mechanisms |

### Detection Engineering References

| Reference | Content |
|---|---|
| [Wazuh Detection Rules](../../03-Detection-Engineering/Wazuh/README.md#2-key-custom-detection-rules) | Custom rules in `local_rules.xml` |
| [Wazuh Decoders Catalog](../../03-Detection-Engineering/Wazuh/README.md#3-decoders-catalog-local_decoderxml) | Custom decoders in `local_decoder.xml` |
| [Wazuh Manager Config](../../06-Resources/Configs/ossec.conf) | Wazuh Manager integration configuration |
| [custom-thehive](../../06-Resources/Scripts/custom-thehive) | POSIX integration wrapper script |
| [custom-thehive.py](../../06-Resources/Scripts/custom-thehive.py) | Production correlation & flush engine |
| [thehive-flush.service](../../06-Resources/Scripts/thehive-flush.service) | Systemd unit file for the flush daemon |
| [Wazuh Noise Reduction & Suppressions](../../03-Detection-Engineering/Wazuh/README.md#4-the-87-suppressions--noise-reduction-architecture) | False-positive tuning and exclusions |
| [thecustomhive Pipeline](../../03-Detection-Engineering/README.md#5-thecustomhive-alert-pipeline) | Alert pipeline architecture documentation |

---

## Static Routing & Agent Enrollment Setup

To allow Wazuh Manager to respond to agents on `192.168.56.0/24` without NAT (preserving original endpoint IP addresses), a persistent return route points to the TheHive VM (`10.122.0.4`):

```bash
# Configure persistent return route to local victim lab via TheHive cloud router
sudo ip route add 192.168.56.0/24 via 10.122.0.4

# Verified agent enrollment command executed on Linux victim hosts:
WAZUH_MANAGER="10.122.1.4" sudo -E apt-get install wazuh-agent
sudo systemctl enable --now wazuh-agent
```

---

## Firewall Expectations

| Source | Destination | Port | Protocol | Purpose |
|--------|-------------|------|----------|---------|
| On-prem agents (via WireGuard) | Wazuh VM | `1514` | TCP | Event shipping |
| New agents (via WireGuard) | Wazuh VM | `1515` | TCP | Agent enrollment |
| Analyst (via WireGuard + NPM) | Wazuh VM | `443` | TCP | Dashboard access |
| Wazuh VM (thehive-flush.service) | TheHive VM (`10.122.0.4`) | `9000` | TCP | Correlated alert batches pushed via VNet peering |
| TheHive VM (internal) | Wazuh VM | `9200` | TCP | Indexer queries (optional) |

> [!IMPORTANT]
> No inbound traffic reaches this VM from the public internet. Every flow above transits through VNet peering from the TheHive VM, which itself is gated behind WireGuard.

---

## Verification Commands

```bash
# Listening sockets
sudo ss -ltnp

# Wazuh and integration service status
systemctl status wazuh-manager
systemctl status wazuh-indexer
systemctl status wazuh-dashboard
systemctl status thehive-flush.service

# Agent list
/var/ossec/bin/agent_control -l

# Verify integration script and SQLite WAL queue
ls -la /var/ossec/integrations/custom-thehive*
ls -lh /var/ossec/logs/correlation_state.db*

# Connectivity to TheHive over VNet peering
nc -vz 10.122.0.4 9000
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [thehive.md](thehive.md) | TheHive VM — VPN, routing, case management |
| [Wazuh Detection Rules](../../03-Detection-Engineering/Wazuh/README.md#2-key-custom-detection-rules) | Custom Wazuh detection rules |
| [Wazuh Decoders Catalog](../../03-Detection-Engineering/Wazuh/README.md#3-decoders-catalog-local_decoderxml) | Custom Wazuh decoders |
| [Wazuh Noise Reduction & Suppressions](../../03-Detection-Engineering/Wazuh/README.md#4-the-87-suppressions--noise-reduction-architecture) | False-positive tuning & suppressions |
| [thecustomhive Alert Pipeline](../../03-Detection-Engineering/README.md#5-thecustomhive-alert-pipeline) | Alert pipeline (Wazuh → TheHive) |
