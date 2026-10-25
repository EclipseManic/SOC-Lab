# Resources

Supporting reference material, core automation scripts, server configurations, and campaign artifacts for the SOC Lab.

## Contents

| Path | Category | Purpose |
|---|---|---|
| [attack-chain-full.pdf](attack-chain-full.pdf) | Master Blueprint | Definitive 20-stage attack simulation and campaign reference document |
| [Diagrams/SOC_Lab_Architecture.png](Diagrams/SOC_Lab_Architecture.png) | Architecture Diagram | High-resolution master architecture diagram covering local zones, WireGuard tunnel, and split-cloud SOC VMs |
| [Diagrams/Secure%20Network%20Topology%20Infographic.png](Diagrams/Secure%20Network%20Topology%20Infographic.png) | Architecture Diagram | End-to-end routing blueprint showing Kali static route, dual-homed gateway, and zero-NAT WireGuard tunnel |
| [Diagrams/Neon%20Cybersecurity%20Network%20Architecture%20Diagram.png](Diagrams/Neon%20Cybersecurity%20Network%20Architecture%20Diagram.png) | Architecture Diagram | High-level 3-tier lab topology conceptual overview |
| [Diagrams/Neon%20Cybersecurity%20Lab%20Network%20Diagram.png](Diagrams/Neon%20Cybersecurity%20Lab%20Network%20Diagram.png) | Architecture Diagram | Detailed 4-zone network segmentation & WireGuard tunnel addressing |
| [Diagrams/Neon%20SOC%20Network%20Architecture%20Diagram.png](Diagrams/Neon%20SOC%20Network%20Architecture%20Diagram.png) | Architecture Diagram | Complete interface routing, VNet peering, and IP configuration flow |
| [Diagrams/Neon%20Cybersecurity%20Incident%20Response%20Pipeline.png](Diagrams/Neon%20Cybersecurity%20Incident%20Response%20Pipeline.png) | Detection Pipeline | 7-step automated detection, triage, and live response lifecycle |
| [Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png](Diagrams/Cybersecurity%20Lab-to-Detection%20Mapping.png) | Detection Engineering | Physical and virtual host infrastructure mapped to detection rulesets |
| [Diagrams/Neon%20Suricata%20Network%20Defense%20Diagram.png](Diagrams/Neon%20Suricata%20Network%20Defense%20Diagram.png) | Detection Engineering | Dual-NIC router, AF-PACKET promiscuous sniffing, and threshold filtering |
| [Diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png](Diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png) | Detection Engineering | Wazuh multi-source ingestion, decoders, and Level 8 threshold fork |
| [Diagrams/Wazuh%20to%20TheHive%20Security%20Pipeline.png](Diagrams/Wazuh%20to%20TheHive%20Security%20Pipeline.png) | Detection Engineering | 2-tier SQLite WAL queue and asynchronous correlation flush daemon |
| [Diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png](Diagrams/SOC%20Analyst%20Investigation%20Lifecycle.png) | Investigation Lifecycle | 10-step analyst playbook from alert intake through case archiving |
| [Scripts/custom-thehive](Scripts/custom-thehive) | Automation Script | POSIX wrapper invoked by Wazuh per alert on `/var/ossec/integrations/` |
| [Scripts/custom-thehive.py](Scripts/custom-thehive.py) | Automation Engine | Production 2-tier correlation & batched flush daemon (zero-HTTP ingest, recon tool fingerprinting, TheHive 5 sync) |
| [Scripts/thehive-flush.service](Scripts/thehive-flush.service) | Systemd Unit | Background service unit running `custom-thehive.py --flush-daemon` |
| [Configs/ossec.conf](Configs/ossec.conf) | Server Configuration | Wazuh Manager configuration defining the `custom-thehive` integration block (API keys redacted) |
| [Configs/lists/wazuh-internal-bins](Configs/lists/wazuh-internal-bins) | CDB Lookup List | Binary lookup table compiled via `wazuh-makelists` to suppress syscollector scan noise (Rule 100280) |
| [Alerts/thehive_alerts.json](Alerts/thehive_alerts.json) | Empirical Evidence | Raw JSON export of 46 TheHive 5 alerts produced by the `custom-thehive` correlation engine |
| [Alerts/Wazuh-Raw-Alerts.csv](Alerts/Wazuh-Raw-Alerts.csv) | Raw Telemetry | 9,567 raw alerts across all 4 agents and log levels exported from Wazuh |
| [Alerts/wazuh_alerts.csv](Alerts/wazuh_alerts.csv) | Curated Analysis Set | 808-row filtered incident analysis set across all stages (Suricata, Apache, Sysmon, Auditd) |

---

## Architecture References

The high-level diagram is linked from [README.md](../README.md) and [01-Lab-Setup/README.md](../01-Lab-Setup/README.md). Detailed configuration tables and traffic flows in [01-Lab-Setup/README.md](../01-Lab-Setup/README.md) remain the authoritative reference for network addressing, routing, and trust boundaries.

## Automation & Integration Pipeline

The core scripts located in [`Scripts/`](Scripts/) power the alert bridge between Wazuh and TheHive:
- **Tier 1 Ingestion:** Wazuh Manager executes `custom-thehive` per alert ($\ge 8$). Inserts rows into `/var/ossec/logs/correlation_state.db` (SQLite WAL) with zero network I/O.
- **Tier 2 Flush Daemon:** `thehive-flush.service` runs `custom-thehive.py --flush-daemon` on a 5-second loop. Correlates attacks using the embedded tool fingerprint catalog and syncs grouped alerts to TheHive 5 REST API across private VNet peering.
- Full architectural analysis: [03-Detection-Engineering/README.md#5-thecustomhive-alert-pipeline](../03-Detection-Engineering/README.md#5-thecustomhive-alert-pipeline).

## Alert Evidence Exports

The raw data files in [`Alerts/`](Alerts/) provide direct empirical proof of the detection pipeline execution across all 20 campaign stages:

- **[`thehive_alerts.json`](Alerts/thehive_alerts.json):** 46 correlated alerts synchronized to TheHive 5. Includes full JSON payloads, correlation group types (`tool_campaign`, `process_fanout`, `logon_group`, `activity_burst`, `watchlist_group`), alert sourceRefs (`wzb-3a8045a03c`, `wzb-34f34a857c`, `wzb-71ef983ad8`, etc.), and timeline telemetry.
- **[`Wazuh-Raw-Alerts.csv`](Alerts/Wazuh-Raw-Alerts.csv):** Complete 9,567-row raw telemetry dataset containing every event captured across DVWA, Suricata, DomainWin10, and Win10User.
- **[`wazuh_alerts.csv`](Alerts/wazuh_alerts.csv):** Curated 808-row filtered incident analysis set preserving multi-level alert activity across the campaign, containing rule descriptions, agent names (`Suricata`, `DVWA`, `Win10User`, `DomainWin10`), and complete JSON payloads (`full_log`) for Suricata IDS events, Apache access logs, Linux PAM/Auditd events, and Windows Sysmon/Security event channels.

## Diagram Rules

Any diagram added here must:
- Be **vendor-neutral** — no cloud provider logos presented as a rigid requirement.
- Show functional roles and private subnets (`192.168.232.0/24`, `192.168.56.0/24`, `10.8.0.0/24`, and `10.122.0.0/16`).
- Have all public IPs, provider hostnames, API keys, and VPN credentials redacted or omitted.
- Mark or document the Suricata blind spot for intra-subnet Layer 2 victim-to-victim traffic.
- Be linked from [01-Lab-Setup/README.md](../01-Lab-Setup/README.md) rather than duplicated across multiple sections.
