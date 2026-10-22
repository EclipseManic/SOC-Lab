# Suricata Gateway — Router, Sensor, VPN Client

## Role

The gateway is an inline Linux router running Suricata. It sits between the attack segment and the victim segment, forwards traffic between them, and ships network events to Wazuh over the VPN.

| Interface | Address | Faces |
|---|---|---|
| `eth0` | `192.168.232.162/24` | Kali and the VMnet8 NAT segment |
| `eth1` | `192.168.56.150/24` | Victim network — also the victims' default gateway |
| `wg0` | `10.8.0.2/32` | Cloud SOC via WireGuard (`10.8.0.1` hub) |

It is not a passive tap. If the gateway is down, the victim network has no path out, which is the intended fail-closed behaviour for an isolated lab.

## Why inline instead of a SPAN port

A SPAN port or TAP is passive and easy to bypass if traffic takes another path. An inline router is a choke point for traffic entering the victim network from the attack segment: that traffic has to cross it. It is not a choke point for victim-to-victim traffic on the same subnet. The trade-off is availability, which is acceptable here.

## Configuration

| Item | Value |
|---|---|
| OS | Linux (`TBD` distribution/version) |
| Interfaces | `eth0` `192.168.232.162/24`, `eth1` `192.168.56.150/24`, `wg0` `10.8.0.2/32` |
| Forwarding | `net.ipv4.ip_forward=1`, forward rules for `eth0↔eth1` and `wg0↔eth0/eth1` |
| IDS/IPS mode | `TBD` — IDS for the first campaign, IPS only after rules are tuned |
| Rule sources | `TBD` — ET Open plus custom rules |
| Output | `eve.json` |
| Log shipping | Wazuh agent reading `eve.json` |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Routing

```bash
# Forwarding
sysctl net.ipv4.ip_forward

# Local delivery
ip route show
# 192.168.232.0/24 dev eth0
# 192.168.56.0/24  dev eth1
# 10.8.0.0/24      dev wg0

# Path checks
ip route get 192.168.56.10    # dev eth1
ip route get 10.8.0.1         # dev wg0
```

Victims point their default gateway at `192.168.56.150`. Kali points at `192.168.232.162` for the victim range. Without those two facts, traffic either bypasses the sensor or does not flow at all.

## Suricata basics

```yaml
vars:
  address-groups:
    HOME_NET: "[192.168.56.0/24]"
    # Cloud/VPN peers are external to the victim network, so the sensor can
    # match on tunnel-origin traffic as well as NAT-origin traffic.
    EXTERNAL_NET: "[192.168.232.0/24,10.8.0.0/24]"

default-rule-path: /etc/suricata/rules
rule-files:
  - suricata.rules
  - custom.rules
```

`EXTERNAL_NET` must include `10.8.0.0/24`. A VPN client reaching into `192.168.56.0/24` arrives on `wg0`; if the tunnel subnet is not classified as external, direction-sensitive rules will silently miss it.

## Capture interfaces

```yaml
af-packet:
  - interface: eth1      # victim side — sees attack-in and victim-out
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
  - interface: wg0       # tunnel — sees agent traffic and VPN access
    cluster-id: 98
    cluster-type: cluster_flow
    defrag: yes
```

| Interface | Seen traffic | Notes |
|---|---|---|
| `eth1` | Attack → victim (ingress), victim → attack (return) | Primary vantage; one copy per flow |
| `wg0` | Victim → cloud, analyst → victim | Needed for tunnel traffic |
| `eth0` | Same forwarded flows, mirrored | Optional; produces duplicate alerts if captured alongside `eth1` |

Capturing both `eth0` and `eth1` on a router duplicates every forwarded flow. Use `eth1` + `wg0` as the default and add `eth0` only if traffic targeted at the gateway itself must be inspected.

Disable NIC offload before relying on packet capture:

```bash
sudo ethtool -K eth0 gro off lro off gso off tso off
sudo ethtool -K eth1 gro off lro off gso off tso off
```

## Firewall and forwarding

```bash
# Example nftables posture: drop by default, allow established, forward explicitly
sudo nft list ruleset
sudo iptables -S FORWARD
```

The gateway firewall should:

- accept `51820/UDP` outbound to the hub (client side),
- accept forwarded traffic `eth0 → eth1` for the victim range,
- accept forwarded traffic `eth1 → wg0` for the Wazuh manager,
- drop forwarding to anything else.

No inbound rule is needed on the gateway. It is a client, not a listener.

## Detection output

Suricata writes JSON events to `eve.json`. Fields used most often in this lab:

| Field | Meaning |
|---|---|
| `timestamp` | Event time |
| `event_type` | `alert`, `flow`, `dns`, `http`, `tls` |
| `src_ip`, `dest_ip` | Network endpoints |
| `alert.signature` | Rule message |
| `alert.signature_id` | Suricata signature ID |
| `alert.severity` | Suricata severity |
| `http` | HTTP request metadata |
| `payload` | Packet payload when captured |

## Wazuh integration

The gateway ships `eve.json` to the Wazuh Manager through the tunnel and the hub. Document:

- The Wazuh decoder used for `eve.json`
- The rule IDs that consume Suricata events
- The alert threshold that reaches TheHive
- Any dropped or filtered signatures

## What this sensor cannot see

| Blind spot | Why | Where the evidence comes from instead |
|---|---|---|
| Victim ↔ victim on `192.168.56.0/24` | Same subnet, switched locally, no router hop | Wazuh agents, Windows Security log, Sysmon (if deployed) |
| Cloud VM ↔ cloud VM in `10.122.0.0/16` | Peered VNet traffic, never reaches the gateway | Wazuh manager logs, host telemetry |
| Traffic inside a host (`localhost`, process-to-process) | Never touches a NIC | Endpoint telemetry, Velociraptor |
| Encrypted payloads (TLS, SMB3, Kerberos) | Content is encrypted | Metadata only; host logs carry the semantics |
| Traffic blocked before routing completes | Seen at the NIC but not forwarded | Firewall counters |

Lateral movement stages (09–17) mostly run host-to-host inside `192.168.56.0/24`. The lab does not claim network coverage for them. Report them as host-telemetry detections or as gaps — never as network detections.

## Verification

```bash
suricata -T -c /etc/suricata/suricata.yaml
sudo suricata --build-info | head
sudo tail -f /var/log/suricata/eve.json
ip -br addr show
sysctl net.ipv4.ip_forward
```

- [ ] `suricata -T` passes
- [ ] A Kali → DVWA request appears in `eve.json`
- [ ] A test signature fires
- [ ] Wazuh receives the event through `wg0`
- [ ] The event reaches TheHive through thecustomhive
- [ ] Forwarding between `eth0`, `eth1`, and `wg0` is confirmed

## Evidence

- [ ] Redacted interface, route, and forwarding configuration
- [ ] Suricata test output
- [ ] Sample `eve.json` alert
- [ ] Wazuh alert screenshot

## Related documents

- [Network topology](../network-topology.md)
- [WireGuard](../Cloud/wireguard.md)
- [Detection engineering: Suricata](../../03-Detection-Engineering/Suricata/rules.md)
