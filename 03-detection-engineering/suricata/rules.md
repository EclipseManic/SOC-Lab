# Suricata Rules

## Purpose

Inventory the Suricata signatures that fired during the campaign and the custom rules written for the lab. This is the network-detection side of the coverage matrix.

## Rule inventory

| SID | Signature | Stage | Severity | Status | Tuning notes |
|---|---|---|---|---|---|
| TBD | TBD | 01 | TBD | TBD | TBD |
| TBD | TBD | 02 | TBD | TBD | TBD |
| TBD | TBD | 03 | TBD | TBD | TBD |
| TBD | TBD | 05 | TBD | TBD | TBD |
| TBD | TBD | 06 | TBD | TBD | TBD |
| TBD | TBD | 09 | TBD | TBD | TBD |
| TBD | TBD | 10 | TBD | TBD | TBD |
| TBD | TBD | 12 | TBD | TBD | TBD |
| TBD | TBD | 13 | TBD | TBD | TBD |
| TBD | TBD | 14 | TBD | TBD | TBD |
| TBD | TBD | 15 | TBD | TBD | TBD |
| TBD | TBD | 19 | TBD | TBD | TBD |

## Custom rules

Document each custom rule with:

- SID and revision
- Message
- Source and destination
- Protocol and port
- Content matches
- Threshold or suppression
- Why the rule is needed
- Test evidence

## Rule sources

| Source | Purpose | Update method |
|---|---|---|
| ET Open | General network detections | `suricata-update` |
| Local custom rules | Lab-specific behavior | Version-controlled file in `resources/` or documented here |

Do not commit rule files containing sensitive hostnames or public IPs. Redact them.

## Tuning log

| Date | SID | Problem | Change | Result |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Validation

- [ ] `suricata -T` passes after every rule change
- [ ] Each rule has a matching stage and a test capture
- [ ] `eve.json` contains the expected alert fields
- [ ] Wazuh ingests the alert
- [ ] The alert reaches TheHive when the threshold is met
