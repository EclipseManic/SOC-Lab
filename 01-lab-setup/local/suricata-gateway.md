# Security Gateway — Suricata

## Role

The gateway is an inline Linux router running Suricata. Every packet between the attack network and the victim network crosses it. This makes network detection unavoidable and produces a single, reliable source of network evidence.

## Why inline

A SPAN port or TAP is passive and easy to bypass if traffic takes another path. An inline gateway is a choke point: if traffic flows, Suricata sees it. The trade-off is availability — a gateway failure interrupts the lab, which is acceptable in an isolated environment.

## Configuration

| Item | Value |
|---|---|
| Operating system | Linux (`TBD` distribution/version) |
| Interfaces | `TBD` (attack side), `TBD` (victim side) |
| Routing | IP forwarding enabled |
| IDS/IPS mode | `TBD` (IDS recommended for the first campaign) |
| Rule sources | `TBD` (ET Open, custom rules) |
| Output | `eve.json` |
| Log shipping | Wazuh agent or local collector |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Suricata basics

```text
HOME_NET: "[192.168.56.0/24]"
EXTERNAL_NET: "[192.168.232.0/24]"
default-rule-path: /etc/suricata/rules
rule-files:
  - suricata.rules
  - custom.rules
```

Document the actual `suricata.yaml` values with secrets removed.

## Detection output

Suricata writes JSON events to `eve.json`. The fields used most often in this lab are:

| Field | Meaning |
|---|---|
| `timestamp` | Event time |
| `event_type` | `alert`, `flow`, `dns`, `http`, `tls` |
| `src_ip`, `dest_ip` | Network endpoints |
| `alert.signature` | Rule message |
| `alert.signature_id` | Suricata signature ID |
| `alert.severity` | Suricata severity |
| `http` | HTTP request metadata |
| `payload` | Packet payload when captured |

## Wazuh integration

The gateway ships `eve.json` to the Wazuh Manager, where decoders and rules turn network events into alerts. Document:

- The Wazuh decoder used for `eve.json`
- The rule IDs that consume Suricata events
- The alert threshold that reaches TheHive
- Any dropped or filtered signatures

## Verification

- [ ] `suricata -T -c /etc/suricata/suricata.yaml` passes
- [ ] Traffic from Kali to DVWA appears in `eve.json`
- [ ] A test signature fires
- [ ] Wazuh receives the event
- [ ] The event can reach TheHive through thecustomhive

## Evidence

- [ ] Redacted interface and routing configuration
- [ ] Suricata test output
- [ ] Sample `eve.json` alert
- [ ] Wazuh alert screenshot

## Related documents

- [Network topology](../network-topology.md)
- [Detection engineering: Suricata](../../03-detection-engineering/suricata/rules.md)
