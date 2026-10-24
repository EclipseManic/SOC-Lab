# Suricata Gateway — Router, Sensor, VPN Client

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04 LTS |
| **Role** | Router · IDS sensor · WireGuard VPN client |
| **Resources** | 2–3 vCPU · 3 GB RAM |
| **Suricata** | 8.0.6 (AF-PACKET passive IDS mode on routing host) |
| **SSH key** | `manichand gupta@ManicLenovo` |

## Role

This host is the **single network chokepoint** between the attacker (Kali) on the NAT segment and every victim on the internal subnet.
It performs three jobs simultaneously:

1. **Router** — forwards IP packets between `192.168.232.0/24` and `192.168.56.0/24` via Linux kernel forwarding.
2. **IDS sensor** — Suricata sniffs frames on `ens37` (victim-side NIC) in passive AF-PACKET capture mode.
3. **VPN client** — WireGuard tunnel (`wg0`) connects the local lab to the cloud Wazuh manager and TheHive.

## Interfaces

| Interface | Address | Subnet | Purpose |
|-----------|---------|--------|---------|
| `ens33` | `192.168.232.162/24` | VMware VMnet8 (NAT) | Uplink to Kali and internet |
| `ens37` | `192.168.56.150/24` | VMware VMnet2 (Host-Only) | Victim network gateway |
| `wg0` | `10.8.0.2/32` | WireGuard tunnel | Site-to-cloud VPN connecting to hub `10.8.0.1` |

## Architecture: Inline Router with Passive IDS Sniffing

Suricata is deployed on the router host rather than an out-of-band SPAN tap.
- **Routing:** Linux kernel handles IP forwarding between `ens33` and `ens37` with standard routing (`net.ipv4.ip_forward = 1`).
- **Sniffing:** Suricata runs as a passive IDS engine using AF-PACKET on the network interfaces. It generates alerts without modifying or dropping packets inline.
- **No NAT on Victim Traffic:** To ensure the cloud Wazuh SIEM receives genuine endpoint IP addresses (`192.168.56.10`, `.20`, `.30`), static routes are configured on the cloud WireGuard hub pointing `192.168.56.0/24` to `10.8.0.2`. Masquerade (SNAT) is not applied to victim telemetry.

## Configuration

### Netplan — Dual-NIC Static Addressing (`/etc/netplan/01-netcfg.yaml`)

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

### Kernel Forwarding & Firewall

```bash
# Enable IP forwarding persistently in /etc/sysctl.conf
sysctl -w net.ipv4.ip_forward=1

# Allow forwarding across interfaces
iptables -P FORWARD ACCEPT

# Verify routing table
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
  - custom.rules

af-packet:
  - interface: ens37
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmsg: yes
```

### Capture & Visibility Scope

Suricata listens on **`ens37`** using `af-packet` in promiscuous mode:
- **Cross-Segment Traffic:** All routed traffic passing between Kali (`192.168.232.135`) and the victim network (`192.168.56.0/24`) is inspected.
- **Intra-Segment Observation:** Because AF-PACKET enables promiscuous mode on VMware VMnet2, multicast, broadcast, and segment-level traffic directed toward or traversing the gateway can be observed (e.g., the Kerberos AS-REQ exchange between DVWA and the Domain Controller in Stage 13).
- **Unicast Blind Spot:** Direct Layer 2 host-to-host unicast switching between virtual machines that does not traverse the gateway interface is not guaranteed to be captured on the wire, making endpoint agents (Wazuh & Sysmon) the authoritative detection layer for lateral movement.

### Output Files

| File | Content | Consumer |
|------|---------|----------|
| `eve.json` | Full EVE log (all event types) | Local analysis |
| `eve-alert.json` | Filtered alerts only | Local Wazuh agent |

## WireGuard Client

```ini
[Interface]
Address    = 10.8.0.2/32
PrivateKey = <REDACTED>
MTU        = 1420

[Peer]
PublicKey           = <REDACTED>
Endpoint            = <TheHive-VM-public-IP>:51820
AllowedIPs          = 10.8.0.0/24, 10.122.0.0/16
PersistentKeepalive = 25
```

The tunnel carries Wazuh agent events from on-prem hosts to the cloud Wazuh manager (`10.122.0.5`), connects to TheHive (`10.122.0.4`), and allows Velociraptor clients to reach the cloud frontend.

## Verification Commands

```bash
# Suricata service status
systemctl status suricata

# Interface check
ip -br addr show
# ens33  UP  192.168.232.162/24
# ens37  UP  192.168.56.150/24
# wg0    UNKNOWN  10.8.0.2/32

# Verify Suricata rule parsing syntax
sudo suricata -T -c /etc/suricata/suricata.yaml -v

# Tail live alert output
sudo tail -f /var/log/suricata/eve-alert.json | jq '{timestamp, src_ip, dest_ip, signature: .alert.signature}'
```

## Related Documentation

- [Kali Attacker Workstation](kali.md)
- [Lab Architecture](../architecture.md)
- [Detection Engineering — Suricata README](../../03-Detection-Engineering/Suricata/README.md)
