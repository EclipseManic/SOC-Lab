# Resources

Supporting reference material, core automation scripts, server configurations, and campaign artifacts for the SOC Lab.

## Contents

| Path | Category | Purpose |
|---|---|---|
| [attack-chain-full.pdf](attack-chain-full.pdf) | Master Blueprint | Definitive 20-stage attack simulation and campaign reference document |
| [Diagrams/soc-lab.png](Diagrams/soc-lab.png) | Architecture Diagram | High-level 3-tier lab topology visual overview |
| [Scripts/custom-thehive](Scripts/custom-thehive) | Automation Script | POSIX wrapper invoked by Wazuh per alert on `/var/ossec/integrations/` |
| [Scripts/custom-thehive.py](Scripts/custom-thehive.py) | Automation Engine | Production 2-tier correlation & batched flush daemon (zero-HTTP ingest, recon tool fingerprinting, TheHive 5 sync) |
| [Scripts/thehive-flush.service](Scripts/thehive-flush.service) | Systemd Unit | Background service unit running `custom-thehive.py --flush-daemon` |
| [Configs/ossec.conf](Configs/ossec.conf) | Server Configuration | Wazuh Manager configuration defining the `custom-thehive` integration block (API keys redacted) |

---

## Architecture References

The high-level diagram is linked from [README.md](../README.md) and [01-Lab-Setup/architecture.md](../01-Lab-Setup/architecture.md). Detailed configuration tables and traffic flows in [01-Lab-Setup/architecture.md](../01-Lab-Setup/architecture.md) remain the authoritative reference for network addressing, routing, and trust boundaries.

## Automation & Integration Pipeline

The core scripts located in [`Scripts/`](Scripts/) power the alert bridge between Wazuh and TheHive:
- **Tier 1 Ingestion:** Wazuh Manager executes `custom-thehive` per alert ($\ge 8$). Inserts rows into `/var/ossec/logs/correlation_state.db` (SQLite WAL) with zero network I/O.
- **Tier 2 Flush Daemon:** `thehive-flush.service` runs `custom-thehive.py --flush-daemon` on a 5-second loop. Correlates attacks using the embedded tool fingerprint catalog and syncs grouped alerts to TheHive 5 REST API across private VNet peering.
- Full architectural analysis: [03-Detection-Engineering/pipeline-thecustomhive.md](../03-Detection-Engineering/pipeline-thecustomhive.md).

## Diagram Rules

Any diagram added here must:
- Be **vendor-neutral** — no cloud provider logos presented as a rigid requirement.
- Show functional roles and private subnets (`192.168.232.0/24`, `192.168.56.0/24`, `10.8.0.0/24`, and `10.122.0.0/16`).
- Have all public IPs, provider hostnames, API keys, and VPN credentials redacted or omitted.
- Mark or document the Suricata blind spot for intra-subnet Layer 2 victim-to-victim traffic.
- Be linked from [01-Lab-Setup/architecture.md](../01-Lab-Setup/architecture.md) rather than duplicated across multiple sections.
