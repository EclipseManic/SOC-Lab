# Stage XX — Stage Name

> **Status:** Draft — evidence pending
> **Case:** [Case XX](../Investigation/Cases/case-XX-name.md)
> **Investigation:** [Stage XX](../Investigation/Stages/stage-XX-name.md)
> **Evidence:** [attack](../Attack-Screenshots/stage-XX/) · [alert](../alert-screenshots/stage-XX/)

## Objective

What is the attacker trying to achieve in this stage?

## Prerequisites

- Access, credentials, or findings required from earlier stages
- Tools and versions used

## Commands

```text
Paste the exact commands, with secrets and public IPs redacted.
```

## What happened

Describe the observed result step by step, including failures and retries.

## Evidence

### Attack

```markdown
![Stage XX attack evidence](../Attack-Screenshots/stage-XX/stage-XX-01-description.png)
```

### Alert

```markdown
![Stage XX alert evidence](../alert-screenshots/stage-XX/stage-XX-01-description.png)
```

If no alert fired:

> No alert observed. See `DG-XX` in [Detection-Engineering/gaps.md](../Detection-Engineering/gaps.md).

## Alert observed

| Field | Value |
|---|---|
| Source | Suricata / Wazuh / TheHive |
| Rule | TBD |
| Rule ID | TBD |
| TheHive alert | TBD |
| Severity | TBD |
| TLP / PAP | TBD |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| TBD | TBD | TBD |

## Detection opportunities

What telemetry, rule, or behavior would detect this stage?

## Notes

Caveats, tool versions, and links to the investigation.
