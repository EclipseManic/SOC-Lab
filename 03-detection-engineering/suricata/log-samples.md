# Suricata Log Samples

## Purpose

Keep a small set of redacted `eve.json` examples that show what the gateway produced for each stage. These are reference evidence, not a full packet capture.

## Sample format

```json
{
  "timestamp": "TBD",
  "event_type": "alert",
  "src_ip": "192.168.232.135",
  "dest_ip": "192.168.56.30",
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "signature": "TBD",
    "signature_id": 0,
    "severity": 0
  },
  "http": {
    "hostname": "192.168.56.30",
    "url": "TBD",
    "http_method": "GET",
    "status": 200
  }
}
```

## Samples

| Stage | Event type | Signature | SID | File |
|---|---|---|---|---|
| 01 | alert | TBD | TBD | TBD |
| 03 | alert / http | TBD | TBD | TBD |
| 06 | alert / flow | TBD | TBD | TBD |
| 10 | alert | TBD | TBD | TBD |
| 14 | alert | TBD | TBD | TBD |
| 19 | alert / flow | TBD | TBD | TBD |

## Field reference

| Field | Use |
|---|---|
| `timestamp` | Timeline correlation |
| `event_type` | Separate alerts from flow, DNS, HTTP, TLS |
| `src_ip`, `dest_ip` | Endpoint identification |
| `alert.signature` | Human-readable detection |
| `alert.signature_id` | Rule traceability |
| `alert.severity` | Triage priority |
| `http.url` | Web attack evidence |
| `payload` | Only when capture is enabled and safe to publish |

## Redaction checklist

- [ ] Replace public IPs with `<REDACTED>`
- [ ] Remove hostnames outside the lab
- [ ] Remove credentials, cookies, and authorization headers
- [ ] Remove payloads containing personal data
- [ ] Confirm hashes and tickets are not live credentials
