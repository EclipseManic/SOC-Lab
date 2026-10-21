# thecustomhive — Wazuh to TheHive Pipeline

## Purpose

`thecustomhive` is the custom Python bridge that turns selected Wazuh alerts into TheHive alerts. It is part of the lab infrastructure, not a detection rule.

## Why it exists

Wazuh is good at collecting and correlating telemetry, but it is not a case-management system. TheHive is good at triage and investigation, but it does not collect endpoint logs. The bridge closes that gap and removes manual copy-paste from the analyst workflow.

## Flow

```text
Wazuh alert JSON
  -> filter by rule level and rule groups
  -> normalize fields (rule, agent, source IP, user, file, hash)
  -> map severity and tags
  -> POST to TheHive alert API
  -> TheHive alert appears in the analyst queue
  -> analyst triages and creates a case
```

## Configuration

Document these values with secrets replaced by placeholders:

| Setting | Value |
|---|---|
| Wazuh alert source | `TBD` (alerts.json or API) |
| Minimum rule level | `TBD` |
| Excluded rule groups | `TBD` |
| TheHive URL | `TBD` (private/VPN address only) |
| TheHive API key | `<REDACTED>` |
| TheHive organisation | `TBD` |
| TheHive alert type | `TBD` |
| Severity mapping | `TBD` |
| TLP / PAP defaults | `TBD` |

Never commit the API key or a `.env` file. Use environment variables and document the variable names only.

## Field mapping

| Wazuh field | TheHive field | Notes |
|---|---|---|
| `rule.id` | Alert source reference | Keep the original rule ID |
| `rule.description` | Alert title | Prefix with `Wazuh:` |
| `rule.level` | Severity | Define a documented mapping |
| `agent.name` | Alert tag / description | Host context |
| `data.srcip` | Observable: IP | Only when present |
| `data.dstip` | Observable: IP | Only when present |
| `data.file` | Observable: file | Only when present |
| `syscheck.sha256_after` | Observable: hash | Only when present |
| `rule.mitre.id` | TTP | Map to ATT&CK when available |

## Reliability

- Deduplicate alerts by rule ID, agent, and source IP within a time window.
- Retry failed API calls with backoff.
- Log failures without logging the API key or full alert payloads containing sensitive data.
- Cap alert volume so the analyst queue stays usable.
- Record the bridge version in the case summary.

## Testing

- [ ] Send a known test alert and confirm it appears in TheHive
- [ ] Confirm the severity mapping is correct
- [ ] Confirm observables are attached
- [ ] Confirm duplicate alerts are suppressed
- [ ] Confirm the API key is not present in logs or Git history

## Evidence

Add redacted screenshots of the script configuration, a test alert, and the resulting TheHive alert.
