# Caldera — Adversary Emulation

## Role

Caldera provides repeatable adversary emulation. It can execute abilities and operations that map to ATT&CK techniques, which makes the attack campaign reproducible and measurable.

## Deployment

| Item | Value |
|---|---|
| Server | VM 2 |
| Version | `TBD` |
| Agents | `TBD` |
| Access | VPN or reverse proxy |
| Plugins | `TBD` |

## Use in this lab

Caldera is used for:

- Re-running selected techniques after a detection rule changes
- Validating that a rule fires on a known technique
- Generating repeatable evidence for detection coverage
- Demonstrating purple-team workflow

It is not a replacement for the manual attack chain. The manual chain provides realistic narrative and tool output; Caldera provides repeatability.

## Operations

| Operation | Technique | Target | Purpose | Result |
|---|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` | `TBD` |

## Safety

- Run only against lab hosts.
- Keep the Caldera server off the public internet.
- Do not load real credentials or third-party data.
- Snapshot hosts before an operation.
- Record the operation ID and timestamp for correlation.

## Evidence

- [ ] Operation configuration
- [ ] Agent status
- [ ] Ability output
- [ ] Matching Wazuh or Suricata alert

## Related documents

- [Detection coverage](../../03-detection-engineering/coverage-matrix.md)
- [Attack chain](../../02-attack-simulation/README.md)
