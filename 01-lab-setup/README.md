# 01 — Lab Setup

This section documents what was built and how: the architecture, network, local victim machines, cloud SOC stack, and the custom Wazuh-to-TheHive pipeline.

## Documents

| Document | Contents |
|---|---|
| [architecture.md](architecture.md) | Design, data flow, trust boundaries, component roles |
| [network-topology.md](network-topology.md) | IP addressing, segments, domain information |
| [pipeline-thecustomhive.md](pipeline-thecustomhive.md) | Custom Wazuh -> TheHive alert bridge |
| [local/kali.md](local/kali.md) | Attacker workstation |
| [local/suricata-gateway.md](local/suricata-gateway.md) | Inline network detection gateway |
| [local/dvwa.md](local/dvwa.md) | Web application target |
| [local/win10.md](local/win10.md) | Windows workstation target |
| [local/dc-ad.md](local/dc-ad.md) | Domain Controller and Active Directory |
| [cloud/digitalocean.md](cloud/digitalocean.md) | Cloud VM layout and access |
| [cloud/wazuh.md](cloud/wazuh.md) | SIEM stack |
| [cloud/thehive.md](cloud/thehive.md) | Case management |
| [cloud/velociraptor.md](cloud/velociraptor.md) | Endpoint forensics |
| [cloud/caldera.md](cloud/caldera.md) | Adversary emulation |
| [cloud/wireguard.md](cloud/wireguard.md) | Encrypted log transport |

## Design summary

The lab has two sides:

1. **Local attack and victim network** — Kali, an inline Suricata gateway, DVWA, Windows 10, and a Domain Controller running `ad.lab`.
2. **Cloud SOC** — Wazuh for collection and detection, a custom Python bridge that creates TheHive alerts, and Velociraptor plus Caldera for investigation and response.

The local-to-cloud link is a WireGuard tunnel. Public cloud IPs, keys, and credentials are intentionally excluded from this repository.

## What belongs here

- Architecture decisions and trade-offs
- Network and IP layout using private ranges only
- VM specifications and configuration
- Tool installation and configuration
- Thecustomhive pipeline design and configuration
- Setup evidence screenshots (redacted)

## What does not belong here

- Attack narrative and commands (see `02-attack-simulation/`)
- Alert triage and analyst findings (see `04-investigation/`)
- Detection rules and coverage analysis (see `03-detection-engineering/`)

## Status

Scaffolded. Each document contains the structure and known values; version numbers, screenshots, and configuration excerpts are marked `TBD` until added.
