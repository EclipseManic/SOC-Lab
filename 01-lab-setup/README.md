# 01 — Lab Setup

What was built and how: the three-tier model, the addressing plan, the local victim machines, the two cloud VMs, and the custom Wazuh-to-TheHive pipeline.

## Documents

| Document | Contents |
|---|---|
| [architecture.md](architecture.md) | Design, data flow, trust boundaries, decisions, open items |
| [network-topology.md](network-topology.md) | Addresses, segments, port tables, verification commands |
| [pipeline-thecustomhive.md](pipeline-thecustomhive.md) | Wazuh API → TheHive alert bridge |
| **Local** | |
| [local/kali.md](local/kali.md) | Attacker workstation on VMnet8 NAT |
| [local/suricata-gateway.md](local/suricata-gateway.md) | Two-NIC router and network sensor |
| [local/dvwa.md](local/dvwa.md) | Web application target |
| [local/win10.md](local/win10.md) | Windows workstation target |
| [local/dc-ad.md](local/dc-ad.md) | Domain Controller and Active Directory |
| **Cloud** | |
| [cloud/digitalocean.md](cloud/digitalocean.md) | Provider-neutral cloud VM layout and access (filename kept for link stability) |
| [cloud/thehive.md](cloud/thehive.md) | Case management, ingress hub, VPN server, router |
| [cloud/wazuh.md](cloud/wazuh.md) | SIEM stack, private only |
| [cloud/velociraptor.md](cloud/velociraptor.md) | Endpoint forensics |
| [cloud/caldera.md](cloud/caldera.md) | Adversary emulation |
| [cloud/wireguard.md](cloud/wireguard.md) | VPN hub and tunnel policy |

## Design summary

The lab has three tiers:

1. **Attack** — Kali Linux at `192.168.232.135/24` on VMware VMnet8 (NAT). It has a route to the victim network only through the Suricata gateway.
2. **Victim** — `192.168.56.0/24`: Windows Server 2022 DC (`.10`), Windows 10 (`.20`), DVWA (`.30`). Their default gateway is the gateway's `eth1` address, `192.168.56.150`.
3. **Cloud SOC** — two VMs in a private `10.122.0.0/16` plan, split across two peered VNets:
   - **Wazuh VM** — manager, indexer, dashboard. No public listener.
   - **TheHive/automation VM** — TheHive, Docker, Nginx Proxy Manager, Velociraptor, Caldera, thecustomhive, and the WireGuard server. It is the cloud ingress point, VPN hub, and router toward the Wazuh VM.

The Suricata gateway is the middle tier of the local lab, not a passive tap: `eth0` faces Kali/NAT, `eth1` faces the victim network, and `wg0` (`10.8.0.2/32`) reaches the hub at `10.8.0.1/24` over `51820/UDP`.

The only public inbound port in the whole lab is `51820/UDP` on the TheHive/automation VM. Public cloud IPs, keys, and credentials are intentionally excluded from this repository.

## Visibility boundary

| Traffic | Crosses Suricata | Detected by |
|---|---|---|
| Kali → victim | Yes | Suricata (`eve.json`) → Wazuh |
| Victim → cloud (agent logs) | Yes, via `wg0` | Wazuh manager |
| Victim ↔ victim on `192.168.56.0/24` | **No** — same subnet, no router hop | Wazuh agents and host telemetry only |
| Analyst → SOC services | No | N/A; VPN-only access |

## What belongs here

- Architecture decisions and trade-offs
- Network and IP layout using private ranges only
- VM specifications and configuration
- Tool installation and configuration
- thecustomhive pipeline design and configuration
- Setup evidence screenshots (redacted)

## What does not belong here

- Attack narrative and commands (see `02-attack-simulation/`)
- Alert triage and analyst findings (see `04-investigation/`)
- Detection rules and coverage analysis (see `03-detection-engineering/`)

## Status

Documents are written against the confirmed build. Values that still need to be captured on the live systems are marked `TBD`; nothing here is presented as tested.
