# 📜 Automation Daemons, Webhook Integrations & Tool Fingerprints (`06-Resources/scripts/`)

This directory houses the executable integration scripts, daemon services, and adversary fingerprint databases that power automated alert forwarding, queue maintenance, and threat intelligence enrichment across the SOC Lab.

---

## 🗂️ Directory Architecture

```
06-Resources/scripts/
├── custom-thehive                          # Shell wrapper executable invoked by Wazuh integrator
├── custom-thehive.py                       # Core Python daemon formatting and dispatching alerts to TheHive API
├── thehive-flush.service                   # Systemd service unit for automated alert queue maintenance
└── tool_fingerprints.json                  # Adversary tooling signature and behavioral hash database
```

---

## 📑 Script Inventory & Operational Mechanics

| File | Language / Type | Execution Target | Operational Mechanics |
|:---|:---:|:---|:---|
| `custom-thehive` | Shell Script | Wazuh Manager (`/var/ossec/integrations/custom-thehive`) | Integration wrapper invoked directly by the Wazuh manager whenever an alert meets the configured threshold (Level $\ge 8$). Passes alert JSON paths and parameters to `custom-thehive.py`. |
| `custom-thehive.py` | Python 3 | Wazuh Manager (`/var/ossec/integrations/custom-thehive.py`) | Core integration engine: reads raw Wazuh alert JSON, parses MITRE tactics/techniques, extracts observables (IPs, hashes, paths), formats the payload into TheHive 5 REST API schema, and posts to `http://10.122.0.4:9000/api/v1/alert`. |
| `thehive-flush.service` | Systemd Unit | TheHive Server (`/etc/systemd/system/thehive-flush.service`) | Automated maintenance service running on the cloud TheHive instance to manage alert queue rotation, prevent unbounded database growth, and ensure low-latency ingestion. |
| `tool_fingerprints.json` | JSON Config | Integrations Engine | Master dictionary of known adversary tool signatures, binary hashes, user-agent strings, and process execution patterns used to automatically enrich ingested alerts with threat intelligence tags. |

---

## 🔗 Cross-References

- **Wazuh-TheHive Integration Setup**: [`01-Lab-Setup/Cloud/wazuh.md`](../../01-Lab-Setup/Cloud/wazuh.md#wazuh-to-thehive-integration)
- **Detection Pipeline Architecture**: [`03-Detection-Engineering/Wazuh/README.md`](../../03-Detection-Engineering/Wazuh/README.md)
