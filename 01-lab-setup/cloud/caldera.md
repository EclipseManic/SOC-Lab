# Caldera — Adversary Emulation

## Role

Caldera provides repeatable adversary emulation. It executes abilities and operations mapped to ATT&CK techniques, which makes parts of the campaign reproducible and measurable.

## Deployment

| Item | Value |
|---|---|
| Server | TheHive/automation VM |
| Version | `TBD` |
| Agents | `TBD` (deployed on victim hosts only) |
| Access | VPN only — no public listener |
| Port | `8888/TCP`, bound to the private/VPN interface |
| Plugins | `TBD` |

## Use in this lab

Caldera is used for:

- Re-running selected techniques after a detection rule changes
- Validating that a rule fires on a known technique
- Generating repeatable evidence for detection coverage
- Demonstrating a purple-team workflow

It is not a replacement for the manual attack chain. The manual chain provides realistic narrative and tool output; Caldera provides repeatability. Caldera results are recorded as `Not tested` until a rule actually fires and the alert is captured.

## Operations

| Operation | Technique | Target | Purpose | Result |
|---|---|---|---|---|
| `TBD` | `TBD` | `TBD` | `TBD` | Not tested |

## Safety

- Run only against lab hosts.
- Keep the server off the public internet; reach it over the VPN.
- Bind the listener to the private/VPN interface, not to a public address.
- Do not load real credentials or third-party data.
- Snapshot hosts before an operation.
- Record the operation ID and timestamp for correlation.

## Evidence

- [ ] Operation configuration
- [ ] Agent status
- [ ] Ability output
- [ ] Matching Wazuh or Suricata alert
- [ ] Confirmation that `8888/TCP` is unreachable from the internet

## Related documents

- [TheHive/automation VM](thehive.md)
- [WireGuard](wireguard.md)
- [Detection coverage](../../03-detection-engineering/coverage-matrix.md)
- [Attack chain](../../02-attack-simulation/README.md)
