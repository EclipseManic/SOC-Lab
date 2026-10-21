# Wazuh — SIEM and Detection

## Role

Wazuh collects endpoint and network telemetry, applies decoders and rules, and produces the alerts that feed TheHive.

## Components

| Component | Purpose |
|---|---|
| Wazuh Manager | Receives events, applies rules, generates alerts |
| Wazuh Indexer | Stores and indexes alerts and events |
| Wazuh Dashboard | Search, visualisation, and administration |
| Wazuh Agents | Collect logs and file integrity events from DVWA, Windows 10, and the DC |

## Agents

| Agent | Host | Status |
|---|---|---|
| `TBD` | DVWA (`192.168.56.30`) | `TBD` |
| `TBD` | Windows 10 (`192.168.56.20`) | `TBD` |
| `TBD` | Domain Controller (`192.168.56.10`) | `TBD` |
| `TBD` | Suricata gateway | `TBD` |

## Detection content

Document:

- Enabled rule groups
- Custom rules and their IDs
- Custom decoders, especially for Suricata `eve.json`
- File integrity monitoring paths
- Active response configuration (if used)
- Alert level threshold used by thecustomhive
- Suppression and false-positive tuning

The rule catalogue and coverage analysis live in `03-detection-engineering/wazuh/`.

## Alert path

```text
Agent or Suricata -> Wazuh Manager -> rule match -> alerts.json
  -> thecustomhive -> TheHive alert
```

## Verification

- [ ] All agents show as active
- [ ] A test event produces a Wazuh alert
- [ ] The alert appears in the dashboard
- [ ] The alert reaches TheHive
- [ ] The rule ID is recorded in `INDEX.md`

## Evidence

- [ ] Agent inventory
- [ ] Rule test output
- [ ] Dashboard alert screenshot
- [ ] Redacted manager configuration

## Related documents

- [Wazuh detection content](../../03-detection-engineering/wazuh/rules.md)
- [thecustomhive pipeline](../pipeline-thecustomhive.md)
