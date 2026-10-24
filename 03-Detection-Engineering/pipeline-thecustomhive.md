# thecustomhive — Wazuh to TheHive Alert Pipeline

## Overview

`thecustomhive` is a custom Python-based detection engineering pipeline that automates the ingestion, filtering, enrichment, and escalation of high-severity Wazuh alerts into TheHive case management platform.

Initially, generic SOAR workflows (such as Shuffle) were evaluated. However, Shuffle proved rigid, overly hardcoded for custom event schemas, and added unnecessary operational overhead. A purpose-built Python bridge (`custom-thehive.py`) and companion systemd service (`thehive-flush.service`) were developed to provide granular control over event parsing, regex extraction, alert deduplication, and observable creation.

## Architecture and Data Flow

```text
┌──────────────────────────────────────────────────────────────┐
│ Wazuh VM (10.122.1.4 - Private VNet)                         │
│                                                              │
│  Endpoint & Network Telemetry                                │
│  (DVWA, Win10, DC, Suricata)                                │
│       │                                                      │
│       ▼                                                      │
│  Wazuh Manager (v4.14.8)                                     │
│  Rules Engine -> Match Level ≥ 8                             │
│       │                                                      │
│       ▼                                                      │
│  Wazuh REST API (55000/TCP)                                  │
└───────┬──────────────────────────────────────────────────────┘
        │
        │ HTTPS over Provider Private VNet Peering
        ▼
┌──────────────────────────────────────────────────────────────┐
│ TheHive / Automation VM (10.122.0.4 / 10.8.0.1)              │
│                                                              │
│  thecustomhive / thehive-flush.service                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 1. Polls Wazuh API (/alerts or disk cursor)            │  │
│  │ 2. Filters rule.level ≥ 8                              │  │
│  │ 3. Normalizes fields (rule, agent, src/dst IP, hashes) │  │
│  │ 4. Extracts observables & MITRE ATT&CK IDs             │  │
│  │ 5. Deduplicates against sliding window cache           │  │
│  │ 6. Advances disk cursor only AFTER successful delivery │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│                           │ HTTP POST (Loopback: 9000/TCP)   │
│                           ▼                                  │
│  TheHive 5.7.5 API (/api/v1/alert)                           │
│  (Native Cassandra + Elasticsearch Backend)                  │
│       │                                                      │
│       ▼                                                      │
│  SOC Analyst Triage Queue & Automated Case Creation          │
└──────────────────────────────────────────────────────────────┘
```

The bridge runs directly on the TheHive host. It reaches Wazuh over the cloud provider's private VNet peering, and delivers alerts to TheHive over the local loopback (`127.0.0.1:9000`). Case data, API keys, and sensitive alert payloads never traverse public networks.

## Pipeline Logic & Cursor Management

1. **Query & Cursor Tracking:** The script maintains a persistent cursor on disk storing the timestamp/ID of the last processed alert. On restart, it resumes from the cursor, guaranteeing zero duplicate case floods and zero dropped alerts during service maintenance.
2. **Severity Thresholding:** Only alerts with `rule.level >= 8` are ingested into TheHive. Lower-severity informational events (such as routine Windows logins or single 404s) remain searchable in the Wazuh Indexer without fatiguing the SOC triage queue.
3. **Fail-Closed Queueing:** If TheHive is down or undergoing updates, alerts buffer in a local queue and retry using exponential backoff with jitter. The cursor advances **only after** receiving an HTTP `201 Created` from TheHive.

## Field Mapping Matrix

| Wazuh JSON Field | TheHive Alert Field | Transformation / Logic |
|---|---|---|
| `rule.id` | `sourceRef` / Tag | Original Wazuh rule ID (e.g., `100613`, `86601`, `5715`) |
| `rule.description` | `title` | Prefixed with agent name: `[{agent.name}] {rule.description}` |
| `rule.level` | `severity` | Level 8–9 $\rightarrow$ **Medium (2)**<br>Level 10–11 $\rightarrow$ **High (3)**<br>Level 12+ $\rightarrow$ **Critical (4)** |
| `rule.mitre.id` | `tags` / TTPs | Formatted as `attack:{mitre.id}` (e.g., `attack:T1047`, `attack:T1059.003`) |
| `agent.name` | `tags` | Target identifier tag (`DVWA`, `DomainWin10`, `Win10User`, `Suricata`) |
| `data.srcip` | Observable: `ip` | Direction: Outbound/Inbound; tagged `src-ip` |
| `data.dstip` | Observable: `ip` | Target IP; tagged `dst-ip` |
| `data.url` / `http.url` | Observable: `uri_path` | Extracted for web attacks (SQLi, webshell access) |
| `data.win.eventdata.targetFilename` | Observable: `filename` | File paths from Sysmon Event 11 or FIM |
| `syscheck.sha256_after` | Observable: `hash` | Extracted on file creation/modification alerts |

## Systemd Service Configuration

The pipeline runs as a resilient daemon under systemd on the TheHive VM:

```ini
# /etc/systemd/system/thehive-flush.service
[Unit]
Description=thecustomhive - Wazuh to TheHive Alert Pipeline Bridge
After=network.target cassandra.service elasticsearch.service thehive.service
Wants=thehive.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/thecustomhive
ExecStart=/usr/bin/python3 /opt/thecustomhive/custom-thehive.py
Restart=always
RestartSec=15
Environment="WAZUH_API_URL=https://10.122.1.4:55000"
Environment="WAZUH_API_USER=<REDACTED>"
Environment="WAZUH_API_PASSWORD=<REDACTED>"
Environment="THEHIVE_API_URL=http://127.0.0.1:9000"
Environment="THEHIVE_API_KEY=<REDACTED>"
Environment="MIN_RULE_LEVEL=8"
Environment="CURSOR_FILE=/var/lib/thecustomhive/alert.cursor"

# Security sandboxing
ProtectSystem=full
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

## Verification & Operational Health

Check service status on the TheHive host:

```bash
sudo systemctl status thehive-flush.service
```

Inspect live ingestion logs:

```bash
sudo journalctl -u thehive-flush.service -f --no-tail
```

Sample successful flush entry:

```text
2026-10-24 10:14:22 [INFO] Connected to Wazuh API at 10.122.1.4:55000
2026-10-24 10:14:23 [INFO] Retrieved 3 alerts (level >= 8) since cursor 1729764800
2026-10-24 10:14:23 [INFO] [Rule 100613] Transformed: Impacket wmiexec execution on DomainWin10
2026-10-24 10:14:24 [INFO] [HTTP 201] Forwarded alert to TheHive -> ID: wzb-3a8045a03c
2026-10-24 10:14:24 [INFO] Advanced cursor to 1729764864
```

## Related Documents

- [Wazuh Custom & Built-in Rules](Wazuh/rules.md)
- [Detection Coverage Matrix](coverage-matrix.md)
- [TheHive / Automation Host Setup](../01-Lab-Setup/Cloud/thehive.md)
- [Wazuh SIEM Host Setup](../01-Lab-Setup/Cloud/wazuh.md)
