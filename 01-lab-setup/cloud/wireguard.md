# WireGuard — VPN Hub and Tunnel

## Role

WireGuard is the only path between the local lab and the cloud SOC. The **server runs on the TheHive/automation VM**; the **Suricata gateway is its client**. The hub holds the private cloud routing; the client carries local telemetry and receives analyst access to the gateway.

No SOC service is published to the internet. The tunnel is the transport, not a security boundary on its own — the cloud firewall and the per-peer policy do that work.

## Topology

```text
                     10.8.0.0/24
  Suricata gateway  ----------------------------  TheHive/automation VM
  10.8.0.2/32           WireGuard tunnel          10.8.0.1/24  (hub, public 51820/UDP)
  eth0 192.168.232.162                               |
  eth1 192.168.56.150                                +--> Wazuh VM (private VNet, peered)
                                                     +--> TheHive, NPM, Velociraptor, Caldera
```

The hub is the router. It forwards agent traffic to the Wazuh VM and routes analyst traffic into `192.168.56.0/24` and `192.168.232.0/24` through the Suricata client.

## Addresses and keys

| Item | Value |
|---|---|
| VPN subnet | `10.8.0.0/24` |
| Hub / server address | `10.8.0.1/24` on `wg0` |
| Client address | `10.8.0.2/32` on `wg0` |
| Listen port | `51820/UDP` on the hub |
| Public endpoint | Hub's current public IP — dynamic, not published |
| Keys | One key pair per peer, generated locally, never committed |
| Preshared key | Optional per peer; documented by name only |

Interface addressing is a `/32` on the client side because the client is a single host, not a subnet router. Routing to the local segments is expressed through `AllowedIPs`, not by widening the address.

## Server (hub) configuration sketch

```ini
[Interface]
Address    = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <REDACTED>
MTU        = 1420

[Peer]
# Suricata gateway
PublicKey    = <CLIENT_PUBLIC_KEY>
AllowedIPs   = 10.8.0.2/32, 192.168.232.0/24, 192.168.56.0/24
PersistentKeepalive = 25
```

The hub must also own return routes for the local segments:

```bash
# Example only — confirm the interface name on the live host
ip route replace 192.168.56.0/24  dev wg0
ip route replace 192.168.232.0/24 dev wg0
```

## Client (Suricata gateway) configuration sketch

```ini
[Interface]
Address    = 10.8.0.2/32
PrivateKey = <REDACTED>
MTU        = 1420

[Peer]
# TheHive/automation VM
PublicKey           = <HUB_PUBLIC_KEY>
Endpoint            = <hub-public-ip>:51820
AllowedIPs          = 10.8.0.0/24, 10.122.0.0/16
PersistentKeepalive = 25
```

`AllowedIPs` here covers the VPN subnet and the whole cloud private plan, so the gateway can reach the hub and the Wazuh VM behind it. It does **not** include `0.0.0.0/0`; this is not a full-tunnel VPN.

## Routing versus authorization

| Concept | Where it lives | What it decides |
|---|---|---|
| Routing | `AllowedIPs`, `ip route` | Which destinations are *reachable through* the peer |
| Authorization | Cloud firewall, host firewall, forwarding rules | Whether the traffic is *allowed to pass* |
| Encryption | WireGuard | Confidentiality and peer identity |

A destination can appear in `AllowedIPs` and still be blocked by the firewall — that is the intended layering. Do not use `AllowedIPs` as a security control, and do not assume a permitted route is a permitted flow.

The lab's intended policy:

| Source | Destination | Allowed |
|---|---|---|
| `10.8.0.0/24` | `192.168.232.0/24` | Yes |
| `10.8.0.0/24` | `192.168.56.0/24` | Yes |
| `10.8.0.0/24` | `10.122.0.0/16` | Yes (service access) |
| `10.8.0.0/24` | Anything else | No |
| Internet | `51820/UDP` on the hub | Yes |
| Internet | Any other port | No |

> **Security note.** Allowing `192.168.232.0/24` exposes the Kali/NAT segment to every VPN client. That is convenient while troubleshooting and unnecessary for normal operation. If only gateway management is needed, replace `192.168.232.0/24` with `192.168.232.162/32` and keep the victim segment separate.

## Forwarding and firewall

On the Suricata gateway, the tunnel must be allowed to forward into both local interfaces and back:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
sudo nft add rule inet filter forward iifname "wg0" oifname "eth1" accept
sudo nft add rule inet filter forward iifname "eth1" oifname "wg0" accept
sudo nft add rule inet filter forward iifname "wg0" oifname "eth0" accept
sudo nft add rule inet filter forward iifname "eth0" oifname "wg0" accept
```

Stateful firewalls accept the return path of established flows; the rules above assume the default policy is drop and a conntrack rule exists. Confirm the live ruleset rather than copying this block blindly.

On the cloud side, the provider firewall allows `51820/UDP` inbound and denies everything else. The host firewall on the hub should mirror that: the WireGuard port is the only listener reachable from outside.

## MTU

WireGuard overhead is 60 bytes over IPv4. Default interface MTU `1420` works on most paths; the failure mode is a tunnel that handshakes and pings but stalls on large transfers (TLS handshakes, SMB, agent bulk uploads).

- Start at `1420`.
- If large packets stall, lower to `1380`, then `1280` — `1280` is the safe floor for IPv6-era paths.
- Test from the client while the tunnel is up:

```bash
ping -M do -s 1392 -c 3 10.8.0.1     # 1420 - 28
ping -M do -s 1352 -c 3 10.8.0.1     # 1380 - 28
```

A clean reply means that MTU fits. Timeouts with small pings that succeed point at MTU, not routing.

## Security rules

- Never commit `wg0.conf`, private keys, or preshared keys.
- Generate a dedicated key pair per peer; do not reuse keys across rebuilds.
- Keep `AllowedIPs` to the destinations actually needed.
- Keep the listener at `51820/UDP` and confirm nothing else is public.
- Rotate keys if a screenshot, log, or shell history exposes them.
- Redact the endpoint address in screenshots — it is the hub's public IP.

## Verification

```bash
# Hub
sudo wg show
sudo ss -lunp | grep 51820
sudo ip route get 192.168.56.10      # should be dev wg0

# Suricata gateway
sudo wg show
ping -c 3 10.8.0.1
ping -c 3 <wazuh-vm-private-address>
```

- [ ] `wg show` reports a recent handshake on both peers
- [ ] The gateway reaches the hub at `10.8.0.1`
- [ ] The gateway reaches the Wazuh VM at its private VNet address
- [ ] An analyst connected to the VPN reaches TheHive and the Wazuh dashboard
- [ ] `51820/UDP` is the only public inbound rule
- [ ] No public IPs or keys appear in the repository

## Evidence

- [ ] Redacted `wg show` output from both peers
- [ ] Tunnel reachability test
- [ ] Cloud firewall rule set (ports only, no addresses)
- [ ] Host firewall forwarding rules

## Related documents

- [Network topology](../network-topology.md)
- [Cloud provider layout](digitalocean.md)
- [TheHive/automation VM](thehive.md)
