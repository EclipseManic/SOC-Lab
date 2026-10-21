# Resources

Supporting material that does not belong to a specific section.

## Contents

| Path | Purpose |
|---|---|
| `attack-chain-full.pdf` | Original attack-chain source document (add when ready) |
| `diagrams/` | Redacted architecture and network diagrams |
| `diagrams/architecture.png` | High-level architecture (add when exported) |
| `diagrams/network-topology.png` | Network diagram (add when exported) |

## Diagram rules

- Use the private lab ranges only.
- Remove public IPs, hostnames, API keys, and VPN details.
- Prefer PNG or SVG at a reasonable resolution.
- Keep each file small enough for GitHub; compress before committing.
- Link diagrams from `01-lab-setup/` rather than duplicating them in multiple sections.

## Source document

The original PDF is a reference, not the report. The repository documents should stand alone and should not require the reader to open the PDF first.

## Templates

Reusable templates live next to the content they support:

- `02-attack-simulation/_template-stage.md`
- `04-investigation/_template-stage.md`

Copy a template, rename it, and replace the placeholders. Do not edit the template itself for a specific stage.
