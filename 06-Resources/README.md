# Resources

Supporting reference material and campaign artifacts for the SOC Lab.

## Contents

| Path | Status | Purpose |
|---|---|---|
| [attack-chain-full.pdf](attack-chain-full.pdf) | **Present** | Master attack-chain blueprint & 20-stage campaign reference document |
| [Diagrams/soc-lab.png](Diagrams/soc-lab.png) | **Present** | Authoritative high-level architecture overview diagram |

The latest high-level overview diagram is linked from [README.md](../README.md) and [01-Lab-Setup/architecture.md](../01-Lab-Setup/architecture.md). The Mermaid diagrams and detailed configuration tables in [01-Lab-Setup/architecture.md](../01-Lab-Setup/architecture.md) remain the authoritative reference for network addressing, routing, and traffic flows.

## Diagram Rules

Any diagram added here must:

- Be **vendor-neutral** — no cloud provider logos presented as a rigid requirement.
- Show functional roles and private subnets (`192.168.232.0/24`, `192.168.56.0/24`, `10.8.0.0/24`, and `10.122.0.0/16`).
- Have all public IPs, provider hostnames, API keys, and VPN credentials redacted or omitted.
- Mark or document the Suricata blind spot for intra-subnet Layer 2 victim-to-victim traffic.
- Be linked from [01-Lab-Setup/architecture.md](../01-Lab-Setup/architecture.md) rather than duplicated across multiple sections.

## Source Document

The master campaign blueprint (`attack-chain-full.pdf`) serves as the definitive reference document for the entire 20-stage simulation, detailing all tooling, attack parameters, and detection observations.
