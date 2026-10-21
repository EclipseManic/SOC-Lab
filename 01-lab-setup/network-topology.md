# Network Topology

All addresses are private lab ranges. Cloud public IPs are dynamic and are deliberately not published; refer to the VMs by role.

## Hosts

| Host | OS | Address | Default gateway | Role | Telemetry |
|---|---|---|---|---|---|
| Kali | Kali Linux | `192.168.232.135/24` | VMnet8 NAT gateway | Attacker workstation | None |
| Suricata gateway | Linux | `eth0 192.168.232.162/24`<br/>`eth1 192.168.56.150/24`<br/>`wg0 10.8.0.2/32` | VMnet8 NAT gateway | Router + network sensor + VPN client | `eve.json` → Wazuh |
| Domain Controller | Windows Server 2022 | `192.168.56.10/24` | `192.168.56.150` | AD DS, DNS, Kerberos | Wazuh agent |
| Windows 10 | Windows 10 | `192.168.56.20/24` | `192.168.56.150` | Workstation target | Wazuh agent |
| DVWA | Ubuntu | `192.168.56.30/24` | `192.168.56.150` | Web application target | Wazuh agent |
| Wazuh VM | Ubuntu (cloud) | Private VNet address in `10.122.0.0/16` | Provider VNet | Manager, indexer, dashboard | Private only |
| TheHive/automation VM | Ubuntu (cloud) | Private VNet address in `10.122.0.0/16`<br/>`wg0 10.8.0.1/24` | Provider VNet | Ingress, VPN hub, router, TheHive stack | Public: `51820/UDP` only |

## Segments

| Segment | Range | Purpose | Crosses Suricata |
|---|---|---|---|
| Attack network (VMnet8 NAT) | `192.168.232.0/24` | Kali and the gateway's external interface | Yes (`eth0`) |
| Victim network | `192.168.56.0/24` | DC, Windows 10, DVWA | Yes (`eth1`), except host-to-host |
| WireGuard network | `10.8.0.0/24` | VPN tunnel; hub `10.8.0.1`, gateway `10.8.0.2/32` | Yes (`wg0`) |
| Cloud private plan | `10.122.0.0/16` | Two non-overlapping VNets joined by peering | No — peered VNet traffic |

Per-VNet and per-subnet CIDRs inside `10.122.0.0/16` vary by provider build and are not documented. Do not infer host addresses for the cloud VMs.

## Ports

### Public ingress

| Port | Proto | Host | Source | Purpose |
|---|---|---|---|---|
| `51820` | UDP | TheHive/automation VM | `0.0.0.0/0` | WireGuard listener |

Default-deny for everything else. This is the only public inbound rule in the lab.

### VPN-only services

Reachable from `10.8.0.0/24` after a successful handshake. Ports are the intended build; confirm on the live host.

| Service | Port | Host | Listener |
|---|---|---|---|
| SSH | `22/TCP` | Both cloud VMs | Public listener not exposed |
| TheHive UI | `9000/TCP` | TheHive/automation VM | Internal; via NPM or directly over VPN |
| Nginx Proxy Manager admin | `81/TCP` | TheHive/automation VM | Internal |
| NPM HTTP/HTTPS | `80`, `443/TCP` | TheHive/automation VM | Internal only — not public |
| Wazuh dashboard | `443/TCP` | Wazuh VM | Internal |
| Wazuh API | `55000/TCP` | Wazuh VM | Internal; used by thecustomhive |
| Wazuh agent enrollment | `1515/TCP` | Wazuh VM | Internal, forwarded by the hub |
| Wazuh agent events | `1514/TCP` | Wazuh VM | Internal, forwarded by the hub |
| Wazuh indexer | `9200/TCP` | Wazuh VM | Internal |
| Velociraptor frontend | `8000/TCP` | TheHive/automation VM | Client-initiated |
| Velociraptor GUI | `8889/TCP` | TheHive/automation VM | Internal |
| Caldera | `8888/TCP` | TheHive/automation VM | Internal |

## WireGuard

| Item | Value |
|---|---|
| Subnet | `10.8.0.0/24` |
| Hub (server) | `10.8.0.1/24` on the TheHive/automation VM |
| Suricata client | `10.8.0.2/32` |
| Listen port | `51820/UDP` |
| AllowedIPs (server peer) | `10.8.0.2/32`, `192.168.232.0/24`, `192.168.56.0/24` |
| PersistentKeepalive | `25` on the client |

AllowedIPs is routing; the firewall is authorization. Both are required for traffic to pass. The cloud plan (`10.122.0.0/16`) is local to the hub and reached over VNet peering, not through the Suricata client. Details: [cloud/wireguard.md](cloud/wireguard.md).

## Domain information

| Field | Value |
|---|---|
| Domain | `ad.lab` |
| Domain Controller | `PC-DC.ad.lab` / `192.168.56.10` |
| DNS | Domain Controller |
| Domain functional level | `TBD` |

## Traffic flows

| Source | Destination | Purpose | Path | Suricata sees it |
|---|---|---|---|---|
| Kali | `192.168.56.0/24` | Web, SMB, LDAP, Kerberos, RPC | `eth0` → `eth1` | Yes |
| Victim hosts | Wazuh VM | Agent events (`1514/TCP`) | `eth1` → `wg0` → hub → peering | Yes, until `wg0` |
| thecustomhive | Wazuh API (`55000/TCP`) | Alert polling | Hub → peering | No |
| thecustomhive | TheHive API | Alert creation | Local on hub | No |
| Analyst | TheHive, Wazuh, Velociraptor, Caldera | Investigation | WireGuard | No |
| Victim host | Victim host | Lateral movement | Same subnet | **No** |

## Verification

### WireGuard handshake

```bash
# On the hub
sudo wg show
# expect: latest handshake for the suricata peer within the keepalive window

# On the Suricata gateway
sudo wg show
sudo wg show wg0 latest-handshakes
```

### Tunnel reachability

```bash
# From the Suricata gateway
ping -c 3 10.8.0.1
ping -c 3 <wazuh-vm-private-address>

# From the hub
ping -c 3 192.168.56.150
ping -c 3 192.168.232.162
```

### NIC forwarding on the gateway

```bash
sysctl net.ipv4.ip_forward            # expect 1
ip -br addr show                      # expect eth0, eth1, wg0
ip route get 192.168.56.10            # expect dev eth1
ip route get <wazuh-vm-private-address>   # expect dev wg0
sudo nft list ruleset | grep -i forward   # or: sudo iptables -S FORWARD
```

```powershell
# Optional: disable forwarding temporarily and confirm agents stop delivering
sudo sysctl -w net.ipv4.ip_forward=0
# restore
sudo sysctl -w net.ipv4.ip_forward=1
```

### VNet peering

Confirm in the provider console that both peering directions show `Connected`, then verify from the hub:

```bash
ip route get <wazuh-vm-private-address>   # expect a route inside 10.122.0.0/16
nc -vz -w 3 <wazuh-vm-private-address> 55000
```

Azure example (substitute your resource group and VNet names):

```bash
az network vnet peering list -g <resource-group> --vnet-name <vnet-name> -o table
```

### Firewall deny tests

Run from the internet — a laptop on a different network, not the lab:

```bash
export HUB_PUBLIC=<hub-public-ip>    # do not commit this value
nc -vz -w 5 "$HUB_PUBLIC" 51820      # UDP: use `nc -u` or a wg handshake instead
nc -vz -w 5 "$HUB_PUBLIC" 22         # expect timeout or refused
nc -vz -w 5 "$HUB_PUBLIC" 443        # expect timeout or refused
nc -vz -w 5 "$HUB_PUBLIC" 9000       # expect timeout or refused
```

A listening socket is not proof of exposure — the cloud firewall is the control. Verify in the provider console that only `51820/UDP` is allowed inbound, and confirm the deny is at the perimeter, not just at the host.

### Checklist

- [ ] Every host address matches `ip addr` / `ipconfig`
- [ ] Kali cannot reach `10.122.0.0/16` (test times out)
- [ ] The gateway has `eth0`, `eth1`, `wg0` and IP forwarding enabled
- [ ] Agents appear as active in the Wazuh dashboard
- [ ] `wg show` reports a recent handshake on both peers
- [ ] Peering is `Connected` in both directions
- [ ] Public inbound is `51820/UDP` only
- [ ] No public cloud IP is present in this file
