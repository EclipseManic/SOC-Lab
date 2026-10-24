# Suricata Gateway — Router, Sensor, VPN Client

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04 |
| **Role** | Router · IDS sensor · WireGuard VPN client |
| **Resources** | 2–3 vCPU · 3 GB RAM |
| **Suricata** | 8.0.6 (IDS mode) |
| **SSH key** | `manichand gupta@ManicLenovo` |

## Role

This host is the **single chokepoint** between the attacker (Kali) on the NAT segment and every victim on the internal subnet.
It performs three jobs simultaneously:

1. **Router** — forwards packets between `192.168.232.0/24` and `192.168.56.0/24`.
2. **IDS sensor** — Suricata inspects every frame on `ens37` (victim-side NIC).
3. **VPN client** — WireGuard tunnel (`wg0`) connects the local lab to the cloud Wazuh manager.

## Interfaces

| Interface | Address | Subnet | Purpose |
|-----------|---------|--------|---------|
| `ens33` | `192.168.232.162/24` | VMnet8 (NAT) | Uplink to Kali and internet |
| `ens37` | `192.168.56.150/24` | VirtualBox Host-Only | Victim network |
| `wg0` | `10.8.0.2/32` | WireGuard tunnel | Cloud connectivity to Wazuh manager |

## Why Inline

Placing Suricata on the gateway rather than as a passive tap guarantees that **every packet between Kali and the victims crosses the sensor**.
There is no alternate path — if the gateway is down, the attack cannot proceed.

## Configuration

### Netplan — Dual-NIC Static Addressing

```yaml
network:
  version: 2
  ethernets:
    ens33:
      addresses: [192.168.232.162/24]
      routes:
        - to: default
          via: 192.168.232.2
    ens37:
      addresses: [192.168.56.150/24]
```

### Routing

```bash
# Enable IP forwarding (persistent in /etc/sysctl.conf)
sysctl net.ipv4.ip_forward
# net.ipv4.ip_forward = 1

# Allow forwarding between interfaces
iptables -P FORWARD ACCEPT

# Verify forwarding path
ip route show
# default via 192.168.232.2 dev ens33 proto static
# 10.8.0.0/24 dev wg0 proto kernel scope link src 10.8.0.2
# 192.168.56.0/24 dev ens37 proto kernel scope link src 192.168.56.150
# 192.168.232.0/24 dev ens33 proto kernel scope link src 192.168.232.162
```

## Suricata Configuration

### `suricata.yaml` (excerpt)

```yaml
vars:
  address-groups:
    HOME_NET: "[192.168.56.0/24]"
    EXTERNAL_NET: "[192.168.232.0/24,10.8.0.0/24]"

default-rule-path: /etc/suricata/rules
rule-files:
  - suricata.rules

af-packet:
  - interface: ens37
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
```

### Rule Sources

| Source | Description |
|--------|-------------|
| `et/open` | Emerging Threats open ruleset — broad coverage |
| `aleksibovellan/nmap` | Custom Nmap detection ruleset for scan fingerprinting |

### Tuning Files

| File | Purpose |
|------|---------|
| `threshold.config` | Rate-limiting noisy signatures |
| `disable.conf` | Disabling false-positive-heavy rules |
| `modify.conf` | Adjusting rule actions or metadata |

For full rule details, see [Detection Engineering — Suricata Rules](../../03-Detection-Engineering/Suricata/rules.md).

### Capture Interface

Suricata listens on **`ens37`** (the victim-facing NIC) using `af-packet`.
This captures all traffic entering or leaving `192.168.56.0/24` through the gateway.

### Output Files

| File | Content | Consumer |
|------|---------|----------|
| `eve.json` | Full EVE log (all event types) | Local analysis |
| `eve-alert.json` | Filtered alerts only | Wazuh agent |

## WireGuard Client

```ini
[Interface]
Address    = 10.8.0.2/32
PrivateKey = <REDACTED>
MTU        = 1420

[Peer]
PublicKey           = <REDACTED>
Endpoint            = <hub-public-ip>:51820
AllowedIPs          = 10.8.0.0/24, 10.122.0.0/16
PersistentKeepalive = 25
```

The tunnel carries Wazuh agent traffic from local hosts to the cloud manager (`10.122.0.4`) and allows Velociraptor clients to reach the cloud frontend.

## Wazuh Integration

The Wazuh agent on this host reads **`eve-alert.json`** and ships Suricata alerts to the Wazuh manager through the WireGuard tunnel.
This gives the SOC a unified view — Suricata network alerts appear alongside host-based detections in the Wazuh dashboard.

## What This Sensor Cannot See

| Blind Spot | Reason |
|------------|--------|
| Host-to-host traffic within `192.168.56.0/24` | Traffic stays on the local switch; never crosses the gateway |
| Lateral movement Win10 ↔ DC | Both hosts share the same subnet segment |
| Post-exploitation commands from a reverse shell on DVWA to other victims | Originates inside the victim subnet |
| Encrypted WireGuard payload | Suricata sees the outer UDP envelope, not the inner cleartext |
| Localhost activity on any host | Loopback traffic never hits a physical NIC |

> [!IMPORTANT]
> Detection for intra-subnet activity relies entirely on **Wazuh agents + Sysmon** running on each endpoint.

## Verification Commands

```bash
# Suricata service status
systemctl status suricata
# ● suricata.service - Suricata IDS/IPS

# Interface check
ip -br addr show
# ens33  UP  192.168.232.162/24
# ens37  UP  192.168.56.150/24
# wg0    UNKNOWN  10.8.0.2/32

# IP forwarding
sysctl net.ipv4.ip_forward
# net.ipv4.ip_forward = 1

# WireGuard tunnel status
wg show
# interface: wg0
#   peer: <REDACTED>
#     endpoint: <hub-public-ip>:51820
#     allowed ips: 10.8.0.0/24, 10.122.0.0/16
#     latest handshake: ...

# Wazuh agent status
systemctl status wazuh-agent
```

## Related Documentation

- [Kali Attacker Workstation](kali.md)
- [Lab Architecture](../architecture.md)
- [Detection Engineering — Suricata Rules](../../03-Detection-Engineering/Suricata/rules.md)
