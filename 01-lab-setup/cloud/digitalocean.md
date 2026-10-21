# DigitalOcean — Cloud Layout

## Purpose

The cloud side hosts the SOC services separately from the victim network. It receives telemetry over WireGuard and provides the investigation stack.

## VM layout

| VM | Services | Purpose | Public exposure |
|---|---|---|---|
| VM 1 | Wazuh Manager, Indexer, Dashboard | SIEM and detection | Restricted; VPN or proxy |
| VM 2 | TheHive, Velociraptor, Caldera, Nginx Proxy Manager | Case management, DFIR, emulation, reverse proxy | Restricted; VPN or proxy |

## Sizing

| VM | vCPU | RAM | Disk | Notes |
|---|---|---|---|---|
| VM 1 | `TBD` | `TBD` | `TBD` | Wazuh Indexer is memory-hungry |
| VM 2 | `TBD` | `TBD` | `TBD` | TheHive, Velociraptor, and Caldera share the host |

Record the actual sizes and any resource limits in the deployment notes.

## Network and access

- Use the private/VPN address in all documentation.
- Do not publish public IP addresses, DNS names, or provider metadata.
- Restrict inbound ports to the minimum required.
- Put TheHive and Wazuh behind Nginx Proxy Manager or the VPN.
- Enable the provider firewall and host firewall.
- Take snapshots before major changes.

## Deployment notes

Document:

- Image and operating system version
- Docker or native installation choice
- Volume layout and backup location
- TLS certificate handling (no private keys in the repo)
- Time synchronization
- Log retention

## Evidence

- [ ] Redacted VM inventory
- [ ] Firewall rules
- [ ] VPN and private address confirmation
- [ ] Snapshot policy

## Related documents

- [Wazuh](wazuh.md)
- [TheHive](thehive.md)
- [Velociraptor](velociraptor.md)
- [Caldera](caldera.md)
- [WireGuard](wireguard.md)
