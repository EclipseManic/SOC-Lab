# thecustomhive — Batched Wazuh to TheHive Alert Pipeline

> **Source Code & Artifacts:**
> - Ingestion Wrapper: [`Wazuh/custom-thehive`](Wazuh/custom-thehive)
> - Core Correlation & Flush Engine: [`Wazuh/custom-thehive.py`](Wazuh/custom-thehive.py)
> - Flush Daemon Service: [`Wazuh/thehive-flush.service`](Wazuh/thehive-flush.service)
> - Wazuh Integration Configuration: [`Wazuh/ossec.conf`](Wazuh/ossec.conf)

---

## 1. Overview & Problem Statement

In standard SOC deployments, sending raw SIEM alerts 1:1 to a case management platform like TheHive causes immediate **alert fatigue** and database degradation. A single port scan or web fuzzing burst generates thousands of individual events in seconds. Furthermore, performing synchronous HTTP requests during Wazuh's per-alert fork/exec cycle introduces latency and risks dropping telemetry if the case management server is slow or restarting.

`thecustomhive` implements an asynchronous, batched, correlation-driven pipeline between Wazuh and TheHive 5.

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             WAZUH MANAGER HOST                                   │
│                                                                                  │
│   Incoming Telemetry (Agents & Suricata)                                         │
│          │                                                                       │
│          ▼                                                                       │
│   Wazuh Analysis Engine (Ruleset Level >= 8)                                     │
│          │                                                                       │
│          ▼                                                                       │
│   /var/ossec/integrations/custom-thehive <alert_file>                            │
│          │                                                                       │
│          ▼  (Tier 1: O(1) Local Ingestion - ZERO HTTP)                          │
│   SQLite WAL Queue (/var/ossec/logs/correlation_state.db)                        │
│          │                                                                       │
│          │  (Tier 2: Async Correlated Sync - 5s Cadence)                         │
│          ▼                                                                       │
│   thehive-flush.service (custom-thehive.py --flush-daemon)                       │
│          │                                                                       │
│          │  • Tool Fingerprint Matching (Nmap, sqlmap, Nikto, ffuf, Hydra)       │
│          │  • Correlation (Process Chains, Fan-outs, Logon Groups, Bursts)       │
│          │  • Deduplication & Aggregate Markdown Rendering                       │
│          │                                                                       │
│          ▼  (HTTP POST/PATCH - api/v1/alert)                                     │
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ TheHive 5 Host (http://10.122.0.4:9000/api/v1)                               │ │
│ │ • Cases / Alerts Triage Queue                                                │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Two-Tier Architecture

### Tier 1: Fast Durable Ingestion (Zero HTTP)
Whenever Wazuh matches a rule with level $\ge 8$, it executes `/var/ossec/integrations/custom-thehive` (a POSIX wrapper calling `/var/ossec/framework/python/bin/python3 custom-thehive.py "$@"`).
- **Zero Network Blocking:** No HTTP requests are made during ingest.
- **Atomic Deduplication:** Alerts are checked against `seen_alerts` in SQLite using `INSERT OR IGNORE`.
- **Precomputed Stages:** CPU-heavy rendering and extraction occur before acquiring the SQLite write lock.
- **O(1) Stage Sequencing:** Stages append into `group_stages` and mark the group dirty in `pending_groups`.
- **Lossless Spooling:** If the SQLite database is locked or under maintenance, raw alerts are spooled to `/var/ossec/logs/thehive_spool/` for automatic replay.

### Tier 2: Async Correlation & Flush Daemon
Running as `thehive-flush.service`, the daemon wakes on a 5-second interval (`THEHIVE_FLUSH_INTERVAL=5.0`) to drain queued stages:
- **Atomic Lease Claims:** Batches of groups are claimed atomically (`state='flushing'`, `lease_until=now + 90s`), allowing multiple worker processes to safely operate without race conditions.
- **Dynamic Group Correlation:** Alerts are aggregated into structured groups rather than isolated tickets:
  - `tool_campaign`: Reconnaissance and vulnerability scanning tools identified by user-agent and signatures.
  - `process_chain`: Related parent-child process executions linked by PID/PPID trees.
  - `process_fanout`: Sibling commands executed by untracked parent processes.
  - `logon_group`: Repeated authentication events (successes and failures) grouped by user and source IP.
  - `activity_burst`: High-frequency alert floods from a single rule/agent.
  - `watchlist_group`: High-risk commands matching sensitive keywords (`/etc/shadow`, `authorized_keys`, `chmod +s`, etc.).
  - `standalone_outbox`: Critical bypass events (agent disconnection, event log clearance) escalated immediately.
- **Idempotent Reconciliation:** Uses stable `sourceRef` values. If TheHive reports an alert already exists (`HTTP 400/409`), the engine automatically queries TheHive API (`/api/v1/query`), recovers the existing `_id`, and patches the current aggregate.

---

## 3. Recon Tool Fingerprinting

The integration includes built-in signature matching to group repetitive automated scans into single comprehensive campaign alerts:

```python
_BUILTIN_FINGERPRINTS = {
    "tools": {
        "Hydra": ["hydra"],
        "sqlmap": ["sqlmap"],
        "Nikto": ["nikto"],
        "wfuzz": ["wfuzz"],
        "ffuf": ["ffuf", "fuzz faster u fool"],
        "gobuster": ["gobuster"],
        "dirbuster": ["dirbuster"],
        "masscan": ["masscan"],
        "Nmap": ["nmap"],
        "Nuclei": ["nuclei"],
        "WPScan": ["wpscan", "wp-scan"]
    },
    "umbrellas": [
        "et scan",
        "et policy",
        "et web_specific_apps",
        "generic protocol command decode"
    ]
}
```

When a tool campaign is active:
- It aggregates all target ports, visited URLs, and matched signatures into one summary alert.
- It displays the first 5 and last 5 raw alert samples to avoid exceeding TheHive description size limits.
- It keeps the alert open across a 30-minute idle window (`TOOL_CAMPAIGN_IDLE_TIMEOUT_SECONDS=1800`).

---

## 4. Configuration & Deployment

### `ossec.conf` Integration Block
In `/var/ossec/etc/ossec.conf`:

```xml
<integration>
  <name>custom-thehive</name>
  <hook_url>http://10.122.0.4:9000/api/v1</hook_url>
  <api_key><REDACTED></api_key>
  <level>8</level>
  <alert_format>json</alert_format>
</integration>
```

### Systemd Service Unit (`thehive-flush.service`)
In `/etc/systemd/system/thehive-flush.service`:

```ini
[Unit]
Description=thecustomhive - Wazuh to TheHive Batched Alert Flush Daemon
After=network.target wazuh-manager.service
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/ossec/integrations
ExecStart=/var/ossec/framework/python/bin/python3 /var/ossec/integrations/custom-thehive.py --flush-daemon
Restart=always
RestartSec=10

Environment="THEHIVE_URL=http://10.122.0.4:9000/api/v1"
Environment="THEHIVE_API_TOKEN=<REDACTED>"
Environment="THEHIVE_CORRELATION_DB=/var/ossec/logs/correlation_state.db"
Environment="THEHIVE_FLUSH_INTERVAL=5.0"
Environment="THEHIVE_FLUSH_BATCH=50"
Environment="THEHIVE_VERIFY_SSL=0"

ProtectSystem=full
NoNewPrivileges=true
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

---

## 5. Operational Verification Commands

```bash
# Verify flush daemon status
systemctl status thehive-flush.service

# View live daemon flush logs
journalctl -u thehive-flush.service -f

# Inspect active correlation database queue
sqlite3 /var/ossec/logs/correlation_state.db "SELECT group_type, thehive_alert_id, total_stages, dirty FROM pending_groups;"

# View real-time JSON metrics snapshot
cat /var/ossec/logs/thehive_flush_metrics.json | jq .
```
