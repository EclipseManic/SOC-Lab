# Resources

Supporting material that does not belong to a specific section.

## Contents

| Path | Status | Purpose |
|---|---|---|
| `attack-chain-full.pdf` | **Planned — not present** | Original attack-chain source document |
| `diagrams/soc-lab.png` | Present | Latest high-level architecture overview |
| `diagrams/network-topology.png` | **Planned — not present** | Network diagram export |

The latest high-level overview is linked from [README.md](../README.md) and [01-lab-setup/architecture.md](../01-lab-setup/architecture.md). The Mermaid diagram and detailed tables remain the source of truth for addresses and flows.

## Diagram rules

Any diagram added here must:

- Be **vendor-neutral** — no provider logos presented as a requirement, no implication of sponsorship.
- Show roles and subnets, not cloud host addresses. The accepted ranges are `192.168.232.0/24`, `192.168.56.0/24`, `10.8.0.0/24`, and `10.122.0.0/16` as a plan.
- Have all public IPs, provider hostnames, API keys, and VPN details redacted or absent.
- Mark the Suricata blind spot for victim-to-victim traffic, or state it in the caption.
- Be PNG or SVG at a reasonable resolution, compressed before committing.
- Be linked from `01-lab-setup/` rather than duplicated in multiple sections.

## Source document

The original PDF is a reference, not the report. The repository documents stand alone and should not require the reader to open the PDF first.

## Templates

Reusable templates live next to the content they support:

- `02-attack-simulation/_template-stage.md`
- `04-investigation/_template-stage.md`

Copy a template, rename it, and replace the placeholders. Do not edit the template itself for a specific stage.
