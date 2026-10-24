# Wazuh SIEM VM

> Private SIEM stack — receives events from all monitored hosts, applies detection rules, and feeds alerts into the TheHive pipeline. No public IP; reachable only through the TheHive VM over VNet peering.

---

## VM Specifications

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04.4 LTS |
| **RAM** | 8 GB |
| **vCPU** | 2 |
| **Cloud network** | `10.122.0.0/16` (second of two peered `/24` VNets) |
| **Public IP** | None |
| **Public listeners** | None |
| **Access method** | VNet peering from TheHive VM; analyst access via WireGuard + NPM (`wazuh.lab`) |
| **SSH key** | `manichand gupta@ManicLenovo` |

---

## Components

| Component | Version | Purpose | Port |
|-----------|---------|---------|------|
| Wazuh Manager | 4.14.8 | Receives events, applies rules, generates alerts | `1514/TCP` (events), `1515/TCP` (enrollment) |
| Wazuh API | — | Query alerts for thecustomhive | `55000/TCP` |
| Wazuh Indexer | — | Stores and indexes alert data | `9200/TCP` |
| Wazuh Dashboard | — | Search, visualization, administration | `443/TCP` |

---

## Enrolled Agents

| Agent Name | Host | IP | OS | Status |
|------------|------|----|----|--------|
| DVWA | DVWA Ubuntu | `192.168.56.30` | Ubuntu 24.04 | Active |
| Win10User | Windows 10 | `192.168.56.20` | Windows 10 Pro N | Active |
| DomainWin10 | Domain Controller | `192.168.56.10` | Windows Server 2022 | Active |
| Suricata | Suricata Gateway | `192.168.56.150` | Ubuntu 24.04 | Active |

---

## Agent Configuration

Each agent's `ossec.conf` points to the Wazuh Manager's private cloud IP over port `1514/TCP`.

### Example — DVWA Agent (`/var/ossec/etc/ossec.conf`)

```xml
<ossec_config>
  <client>
    <server>
      <address>10.122.0.x</address>
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

## Alert Path

```
Agent / Suricata
  → Wazuh Manager (rule match)
    → alerts.json
      → Wazuh API (55000/TCP)
        → thecustomhive (on TheHive VM)
          → TheHive API (localhost:9000)
            → Analyst queue
```

For full pipeline details, see [pipeline-thecustomhive.md](../../03-Detection-Engineering/pipeline-thecustomhive.md).

---

## Detection Content

Custom rules and decoders are deployed on this Wazuh Manager. A brief summary of custom rule IDs is provided here; **full rule definitions and analysis are in Detection Engineering.**

### Custom Rule Summary

| Rule ID(s) | Detection |
|-------------|-----------|
| `100613` | Impacket wmiexec activity |
| `100603` | Sensitive privilege usage |
| `100410` | Suricata 4xx burst |
| `100201` | SQL injection (SQLi) patterns |
| `100100` – `100104` | Registry persistence mechanisms |

### Detection Engineering References

| Document | Content |
|----------|---------|
| [rules.md](../../03-Detection-Engineering/Wazuh/rules.md) | Custom rules in `local_rules.xml` |
| [decoders.md](../../03-Detection-Engineering/Wazuh/decoders.md) | Custom decoders in `local_decoder.xml` |
| [false-positives.md](../../03-Detection-Engineering/Wazuh/false-positives.md) | False-positive tuning and exclusions |
| [pipeline-thecustomhive.md](../../03-Detection-Engineering/pipeline-thecustomhive.md) | Alert pipeline (Wazuh API → TheHive) |

---

## Firewall Expectations

| Source | Destination | Port | Protocol | Purpose |
|--------|-------------|------|----------|---------|
| On-prem agents (via WireGuard) | Wazuh VM | `1514` | TCP | Event shipping |
| New agents (via WireGuard) | Wazuh VM | `1515` | TCP | Agent enrollment |
| TheHive VM (thecustomhive) | Wazuh VM | `55000` | TCP | Alert polling via API |
| Analyst (via WireGuard + NPM) | Wazuh VM | `443` | TCP | Dashboard access |
| TheHive VM (internal) | Wazuh VM | `9200` | TCP | Indexer queries (optional) |

> [!IMPORTANT]
> No inbound traffic reaches this VM from the public internet. Every flow above transits through VNet peering from the TheHive VM, which itself is gated behind WireGuard.

---

## Verification Commands

```bash
# Listening sockets
sudo ss -ltnp

# Wazuh service status
systemctl status wazuh-manager
systemctl status wazuh-indexer
systemctl status wazuh-dashboard

# Agent list
/var/ossec/bin/agent_control -l

# Connectivity test from TheHive VM (hub)
nc -vz <wazuh-vm-private> 1514
nc -vz <wazuh-vm-private> 55000
nc -vz <wazuh-vm-private> 443
```

---

## Related Documents

| Document | Description |
|----------|-------------|
| [thehive.md](thehive.md) | TheHive / Automation VM — VPN, routing, case management |
| [rules.md](../../03-Detection-Engineering/Wazuh/rules.md) | Custom Wazuh detection rules |
| [decoders.md](../../03-Detection-Engineering/Wazuh/decoders.md) | Custom Wazuh decoders |
| [false-positives.md](../../03-Detection-Engineering/Wazuh/false-positives.md) | False-positive tuning |
| [pipeline-thecustomhive.md](../../03-Detection-Engineering/pipeline-thecustomhive.md) | Alert pipeline (Wazuh → TheHive) |
