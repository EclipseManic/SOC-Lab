# Wazuh Decoders

## Purpose

Document how Wazuh parses the log sources used in the lab, especially Suricata `eve.json` and Windows event channels.

## Decoder inventory

| Decoder | Source | Format | Status | Notes |
|---|---|---|---|---|
| TBD | Suricata `eve.json` | JSON | TBD | Maps signature, SID, src/dst, HTTP fields |
| TBD | Windows Security | Windows event channel | TBD | Logon, account management, Kerberos |
| TBD | Linux auth | Syslog | TBD | SSH and sudo |
| TBD | Apache access | Combined log | TBD | Web requests |
| TBD | DVWA / PHP | Application log | TBD | Web shell and error evidence |

## Suricata JSON fields

| Source field | Wazuh field | Use |
|---|---|---|
| `timestamp` | `timestamp` | Event time |
| `src_ip` | `data.srcip` | Source |
| `dest_ip` | `data.dstip` | Destination |
| `alert.signature` | `data.alert.signature` | Rule text |
| `alert.signature_id` | `data.alert.signature_id` | Rule ID |
| `alert.severity` | `data.alert.severity` | Priority |
| `http.url` | `data.url` | Web evidence |

## Validation

- [ ] `wazuh-logtest` parses a sample event
- [ ] Fields appear in the alert JSON
- [ ] A rule can match the decoded fields
- [ ] The event is visible in the dashboard
- [ ] The same event can reach TheHive

## Notes

Do not publish full decoder files if they contain environment-specific hostnames or credentials. Publish the relevant excerpts and redact the rest.
