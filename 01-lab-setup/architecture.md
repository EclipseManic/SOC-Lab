# Architecture

## Purpose

Build a small but realistic SOC pipeline: an adversary attacks a local Active Directory network, network and endpoint telemetry is collected, alerts are created automatically in TheHive, and the incident is investigated and documented.

## High-level diagram

```text
+--------------------------- LOCAL LAB ---------------------------+
|                                                                  |
|  Kali Linux (attacker)                                           |
|       |                                                          |
|       v                                                          |
|  Security Gateway (Suricata, inline)                             |
|       |                                                          |
|       +--> DVWA (Ubuntu)          + Wazuh agent                  |
|       +--> Windows 10             + Wazuh agent                  |
|       +--> Domain Controller      + Wazuh agent                  |
|              ad.lab / PC-DC.ad.lab                               |
|                                                                  |
+------------------------------|-----------------------------------+
                               | WireGuard VPN
                               v
+--------------------------- CLOUD (DigitalOcean) -----------------+
|                                                                  |
|  VM 1: Wazuh Manager / Indexer / Dashboard                       |
|       |                                                          |
|       v                                                          |
|  thecustomhive (Python bridge)                                   |
|       |                                                          |
|       v                                                          |
|  VM 2: TheHive  +  Velociraptor  +  Caldera  +  Nginx Proxy Mgr  |
|                                                                  |
+------------------------------------------------------------------+
```

Replace this block with the exported architecture diagram when available: `resources/diagrams/architecture.png`.

## Data flow

1. Kali generates attack traffic against the victim network.
2. All traffic crosses the Suricata security gateway.
3. Suricata writes `eve.json` alerts and forwards them into Wazuh.
4. Wazuh agents on DVWA, Windows 10, and the Domain Controller ship endpoint logs to the Wazuh Manager.
5. Wazuh correlates and raises alerts.
6. `thecustomhive` reads high-severity Wazuh alerts and creates TheHive alerts through the API.
7. The analyst triages the TheHive alert, creates a case, adds observables and tasks, and records findings.
8. Velociraptor collects endpoint artifacts; Caldera provides repeatable adversary emulation.

## Components

| Component | Function | Why it is included |
|---|---|---|
| Suricata gateway | Inline network detection | Nothing bypasses inspection; produces network evidence |
| Wazuh | SIEM, log management, endpoint detection | Correlates network and host telemetry |
| thecustomhive | Alert automation | Demonstrates a real SIEM-to-case-management integration |
| TheHive | Case management | Structures triage, tasks, observables, and timelines |
| Velociraptor | DFIR | Collects process, network, persistence, and file artifacts |
| Caldera | Adversary emulation | Makes technique execution repeatable and measurable |
| WireGuard | Encrypted transport | Keeps local telemetry off the public internet |

## Trust boundaries

- **Attack network -> victim network:** untrusted; all traffic crosses Suricata.
- **Victim network -> cloud:** encrypted WireGuard tunnel; only required log and management traffic.
- **Internet -> cloud services:** restricted through the firewall and Nginx Proxy Manager; no direct public exposure of TheHive or Wazuh where avoidable.
- **Repository -> public:** documentation only; no keys, public IPs, or live credentials.

## Design decisions

### Inline Suricata instead of a SPAN port

An inline gateway makes the detection path unavoidable and creates a natural choke point for evidence. The trade-off is that a gateway failure can interrupt lab traffic, which is acceptable in an isolated environment.

### Cloud SIEM instead of an all-local stack

Separating the SOC from the victim network mirrors a common enterprise pattern, exercises VPN and remote log transport, and keeps the Wazuh load away from the attack hosts.

### TheHive instead of spreadsheets

TheHive forces the investigation into a case model: alerts, observables, tasks, TTPs, and timelines. It also produces a case report that can be summarized in `05-incident-report/`.

### Stage-wise documentation

Each attack stage has a matching investigation note. This keeps evidence traceable and makes detection gaps visible instead of hiding them inside a broad case narrative.

## Open items

- [ ] Export and add the final architecture diagram
- [ ] Record VM sizes and operating system versions
- [ ] Add the exact Suricata interface and rule configuration
- [ ] Add the WireGuard topology with keys redacted
- [ ] Confirm whether Sysmon is deployed on Windows hosts
