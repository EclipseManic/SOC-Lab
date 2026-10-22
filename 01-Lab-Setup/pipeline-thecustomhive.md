# thecustomhive — Wazuh to TheHive Pipeline

## Purpose

`thecustomhive` is the custom Python bridge that turns selected Wazuh alerts into TheHive alerts. It is lab infrastructure, not a detection rule.

It runs on the **TheHive/automation VM**, pulls alerts from the Wazuh API over the private VNet, and posts to TheHive on the same host.

## Why it exists

Wazuh is good at collecting and correlating telemetry, but it is not a case-management system. TheHive is good at triage and investigation, but it does not collect endpoint logs. The bridge closes that gap and removes manual copy-paste from the analyst workflow.

## Placement and flow

```text
Wazuh VM (private /24 VNet inside 10.122.0.0/16)
  Wazuh API 55000/TCP
        ^
        | HTTPS over VNet peering
        |
TheHive/automation VM
  thecustomhive  -- localhost -->  TheHive API 9000/TCP
        |
        +--> dedupe / cursor store
        +--> retry queue (disk-backed)
```

The Wazuh call is the only network hop. The TheHive call stays on the host, so the bridge never sends an API key or case data across the tunnel.

## Flow inside the bridge

```text
Poll Wazuh API for alerts newer than the stored cursor
  -> filter by rule level and rule groups
  -> normalize fields (rule, agent, source IP, user, file, hash)
  -> map severity and tags
  -> deduplicate against recent TheHive alerts
  -> POST to TheHive alert API
  -> store the new cursor only after a successful POST
  -> analyst triages and creates a case
```

Cursor update ordering matters: advance the cursor **after** the POST succeeds. Advancing first turns a transient TheHive error into permanent data loss.

## Configuration

Document these values with secrets replaced by placeholders:

| Setting | Value |
|---|---|
| Runs on | TheHive/automation VM |
| Wazuh API base URL | `https://<wazuh-vm-private-address>:55000` |
| Wazuh API auth | `<REDACTED>` (token or user/password in env vars) |
| Alert source | Wazuh API (`alerts.json` only if read locally — not the case here) |
| Minimum rule level | `TBD` |
| Excluded rule groups | `TBD` |
| TheHive URL | `http://127.0.0.1:9000` (or the container name on the Docker network) |
| TheHive API key | `<REDACTED>` |
| TheHive organisation | `TBD` |
| TheHive alert type | `TBD` |
| Severity mapping | `TBD` |
| TLP / PAP defaults | `TBD` |
| Poll interval | `TBD` (e.g. 30–60 s) |
| Cursor store | `TBD` — file or container volume, must survive restarts |

The Wazuh API uses a self-signed certificate by default. Pin the CA file rather than disabling verification:

```bash
curl --cacert /etc/thecustomhive/wazuh-ca.pem \
     -u "$WAZUH_API_USER:$WAZUH_API_PASSWORD" \
     "https://<wazuh-vm-private-address>:55000/security/user/authenticate"
```

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

## Failure modes and backoff

| Failure | Behaviour | Operator action |
|---|---|---|
| Wazuh API unreachable (hub, peering, or manager down) | Poll fails; retry with exponential backoff; cursor does not move; no alerts lost | Check peering and the Wazuh service; the alert backlog drains on recovery |
| Wazuh API returns 401 | Authentication failure; escalate to a distinct log line; keep retrying slowly | Rotate the credential in env vars, restart the container |
| TheHive API unreachable | Alert is buffered, not dropped; retry with backoff | Check TheHive container health |
| Duplicate alert already in TheHive | Skip; do not advance past unprocessed alerts | Confirm dedupe window |
| Cursor store lost | Re-poll from the beginning and rely on dedupe; expect a burst | Restore the volume, then verify no duplicate flood |
| Burst of alerts | Cap per cycle so the analyst queue stays usable; backlog drains over subsequent cycles | Consider raising the rule-level threshold |

Backoff parameters to document once chosen:

| Parameter | Value |
|---|---|
| Initial delay | `TBD` |
| Maximum delay | `TBD` |
| Jitter | `TBD` |
| Max retries before alerting | `TBD` |
| Buffer location | `TBD` |

The bridge should log: attempt number, HTTP status, rule ID, and elapsed time. It must never log the API key, the full alert payload, or an entire authorization header.

## Operational hygiene

- Run under systemd or a Docker restart policy, never a bare terminal session.
- Deduplicate by rule ID, agent, and source IP within a time window.
- Cap alert volume so the analyst queue stays usable.
- Record the bridge version in the case summary.
- Health-check the bridge from outside the container (`systemctl status`, container healthcheck, or a metrics endpoint).

## Testing

- [ ] A known test alert appears in TheHive
- [ ] Severity mapping is correct
- [ ] Observables are attached
- [ ] Duplicate alerts are suppressed
- [ ] Stopping TheHive does not lose alerts — they drain after restart
- [ ] Stopping Wazuh does not advance the cursor
- [ ] The API key is not present in logs or Git history

## Evidence

Add redacted screenshots of the configuration (variable names only), a test alert, and the resulting TheHive alert.

## Related documents

- [TheHive/automation VM](Cloud/thehive.md)
- [Wazuh VM](Cloud/wazuh.md)
- [WireGuard](Cloud/wireguard.md)
- [Detection rules](../03-Detection-Engineering/Wazuh/rules.md)
