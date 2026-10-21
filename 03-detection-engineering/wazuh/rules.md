# Wazuh Rules

## Purpose

Inventory the Wazuh rules that detected the campaign, including built-in rules and custom lab rules. This is the host and correlation side of the coverage matrix.

## Rule inventory

| Rule ID | Level | Description | Stage | Status | False-positive notes |
|---|---|---|---|---|---|
| TBD | TBD | TBD | 01 | TBD | TBD |
| TBD | TBD | TBD | 02 | TBD | TBD |
| TBD | TBD | TBD | 03 | TBD | TBD |
| TBD | TBD | TBD | 05 | TBD | TBD |
| TBD | TBD | TBD | 06 | TBD | TBD |
| TBD | TBD | TBD | 07 | TBD | TBD |
| TBD | TBD | TBD | 08 | TBD | TBD |
| TBD | TBD | TBD | 13 | TBD | TBD |
| TBD | TBD | TBD | 14 | TBD | TBD |
| TBD | TBD | TBD | 15 | TBD | TBD |
| TBD | TBD | TBD | 17 | TBD | TBD |
| TBD | TBD | TBD | 18 | TBD | TBD |
| TBD | TBD | TBD | 20 | TBD | TBD |

## Custom rule template

```xml
<group name="soc-lab,">
  <rule id="100000" level="10">
    <if_sid>TBD</if_sid>
    <field name="TBD">TBD</field>
    <description>TBD</description>
    <mitre>
      <id>TBD</id>
    </mitre>
  </rule>
</group>
```

Replace the ID, parent SID, field, description, and MITRE ID. Use a documented local range and keep the rules in version control.

## Alert path

```text
agent or Suricata -> Wazuh manager -> rule match -> alerts.json -> thecustomhive -> TheHive
```

## Tuning

- Suppress known-benign lab activity explicitly, not by raising the global threshold.
- Record every suppression with a reason and an expiry date.
- Test the rule against the attack stage and against at least one benign scenario.
- Keep the rule level aligned with the thecustomhive severity mapping.

## Validation

- [ ] Rule loads without error (`wazuh-logtest` or manager restart)
- [ ] The intended event matches
- [ ] The alert includes the expected fields
- [ ] The alert reaches TheHive
- [ ] The rule ID is recorded in `INDEX.md`
