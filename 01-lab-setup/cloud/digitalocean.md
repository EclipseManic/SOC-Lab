# Cloud Provider Layout — Vendor-Neutral Guidance

> The filename is kept as `digitalocean.md` so existing links do not break. The content is provider-neutral: this lab has run on DigitalOcean, OVHcloud, Vultr, and Azure (current build). No provider is required, sponsored, or recommended over another.

## Purpose

The cloud side hosts the SOC services separately from the victim network. It receives telemetry over WireGuard and provides the investigation stack. What matters is the design, not the vendor:

- one public inbound port,
- two private VMs joined by private networking,
- a VPN hub that also routes,
- default-deny everywhere else.

## VM layout

| VM | Services | Purpose | Public exposure |
|---|---|---|---|
| Wazuh VM | Wazuh Manager, Indexer, Dashboard | SIEM and detection | None |
| TheHive/automation VM | TheHive, Docker, NPM, Velociraptor, Caldera, thecustomhive, WireGuard server | Ingress, VPN hub, router, case management, DFIR | `51820/UDP` only |

## Private addressing

| Item | Value |
|---|---|
| Cloud private plan | `10.122.0.0/16` |
| VNets | Two non-overlapping VNets, joined by VNet peering |
| Per-VNet / per-subnet CIDRs | Vary by provider build — not published |
| Public IPs | Dynamic — not published |

In the Azure build, the split into two VNets was required to place both VMs in the region under the available placement constraints. On providers without that constraint, both VMs can live in one private network; the firewall and VPN invariants do not change.

## Provider mapping

| Capability | DigitalOcean | OVHcloud | Vultr | Azure |
|---|---|---|---|---|
| Private networking | VPC | vRack / private network | VPC | VNet |
| Private network join | Same VPC | Same vRack | Same VPC | VNet peering |
| Perimeter firewall | Cloud Firewalls | Network firewall / security groups | Firewall groups | NSG |
| Console break-glass | Web console | Web console | Web console | Serial console / portal |
| Dynamic public IP | Yes | Yes | Yes | Yes (unless static/reserved) |

The names differ; the control does not. Whatever the provider calls it, the requirement is: allow `51820/UDP` inbound to the TheHive/automation VM, deny all other inbound, and keep the Wazuh VM with no public address.

## Firewall invariant

| Direction | Rule |
|---|---|
| Inbound, internet | `51820/UDP` → TheHive/automation VM only |
| Inbound, everything else | Deny |
| Private VNet traffic | Allow only the ports listed in [network-topology.md](../network-topology.md) |
| Outbound | Permitted as needed for package updates and the Wazuh pipeline |

If SSH is closed — which is the intended posture — the provider console is the only way back in. Keep console access working and credentials stored outside this repository.

## Sizing

| VM | vCPU | RAM | Disk | Notes |
|---|---|---|---|---|
| Wazuh VM | `TBD` | `TBD` | `TBD` | The indexer is memory-hungry; size for it first |
| TheHive/automation VM | `TBD` | `TBD` | `TBD` | TheHive, NPM, Velociraptor, and Caldera share the host |

Record the actual sizes and any resource limits in the deployment notes. Do not treat these as recommendations; they are placeholders until measured.

## Network and access rules

- Use private/VPN addresses in all documentation.
- Never publish public IP addresses, provider hostnames, or instance metadata.
- Restrict inbound ports to the minimum required — one port.
- Put TheHive, the Wazuh dashboard, Velociraptor, and Caldera behind the VPN, not behind a public proxy.
- Enable the provider firewall **and** the host firewall.
- Take snapshots before major changes.

## Deployment notes

Document:

- Image and OS version per VM
- Docker or native installation choice
- Volume layout and backup location
- TLS certificate handling (no private keys in the repo)
- Time synchronization
- Log retention
- Whether the public IP is static or dynamic, and how a change is detected

## Evidence

- [ ] Redacted VM inventory (roles and private ranges only)
- [ ] Firewall rules showing only `51820/UDP` inbound
- [ ] Peering status
- [ ] VPN and private address confirmation
- [ ] Snapshot policy

## Related documents

- [Wazuh](wazuh.md)
- [TheHive/automation VM](thehive.md)
- [Velociraptor](velociraptor.md)
- [Caldera](caldera.md)
- [WireGuard](wireguard.md)
- [Network topology](../network-topology.md)
