# 03 — Detection Engineering

This section answers one question: **what can the lab detect, and what is missing?**

It is not a third retelling of the attack or the investigation. The attack file describes what the adversary did; the investigation file describes what the analyst concluded. This section owns the detection content: rules, coverage, false positives, and gaps.

## Documents

| Document | Purpose |
|---|---|
| [coverage-matrix.md](coverage-matrix.md) | Stage-by-stage mapping of technique, data source, rule, and status |
| [gaps.md](gaps.md) | Detection gap register with classification and remediation |
| [suricata/rules.md](suricata/rules.md) | Suricata signature inventory and tuning |
| [suricata/log-samples.md](suricata/log-samples.md) | Redacted `eve.json` examples and field reference |
| [wazuh/rules.md](wazuh/rules.md) | Wazuh rule inventory and custom rules |
| [wazuh/decoders.md](wazuh/decoders.md) | Decoder inventory, including Suricata JSON |
| [wazuh/false-positives.md](wazuh/false-positives.md) | False-positive log and tuning decisions |

## Coverage workflow

1. Take the technique from the attack stage.
2. Identify the required data source (network, endpoint, authentication, directory service).
3. Identify the rule or analytic that should fire.
4. Run the stage and record whether it fired.
5. Classify the result:
   - **Detected** — telemetry and rule existed, rule fired.
   - **Logging gap** — required telemetry was not collected.
   - **Detection gap** — telemetry existed, no rule covered the behavior.
   - **Rule failure** — a rule existed but did not fire as expected.
6. Add a gap entry with a proposed rule and a retest date.
7. Update `INDEX.md`.

## Principles

- A rule is not coverage until it has been tested against real behavior.
- A high alert volume is not coverage; false positives must be tuned.
- Offline stages (hash cracking, some collection) may legitimately produce no alert. Say so instead of inventing one.
- Keep rule IDs, stage numbers, and case numbers consistent across the repository.

## Status

Scaffolded. The coverage matrix and gap register are ready to be filled from the actual Wazuh and Suricata outputs.
