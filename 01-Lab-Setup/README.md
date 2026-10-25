# 01 – Lab Setup

Everything needed to reproduce the SOC Lab from scratch — architecture, network topology, and per-host build guides.

## Document Index

| Document | Contents |
|----------|----------|
| [architecture.md](architecture.md) | Unified architecture, network topology, addressing, ports, traffic flows, trust boundaries, verification |
| **Local** | |
| [Local/kali.md](Local/kali.md) | Attacker workstation on VMnet8 NAT |
| [Local/suricata-gateway.md](Local/suricata-gateway.md) | Two-NIC router, Suricata 8.0.6, VPN client |
| [Local/dvwa.md](Local/dvwa.md) | Web application target and internal pivot |
| [Local/win10.md](Local/win10.md) | Domain-joined Windows workstation |
| [Local/dc-ad.md](Local/dc-ad.md) | Domain Controller and Active Directory |
| **Cloud** | |
| [Cloud/thehive.md](Cloud/thehive.md) | TheHive, Velociraptor, WireGuard server, NPM — cloud ingress hub |
| [Cloud/wazuh.md](Cloud/wazuh.md) | Wazuh Manager / Indexer / Dashboard — private SIEM stack |

> [!NOTE]
> Rules, decoders, and the alert-to-case pipeline are documented in [03-Detection-Engineering/](../03-Detection-Engineering/).

---

## Design Summary

```
Kali ──attack──▶ Suricata Gateway ──route──▶ Victims (DC, Win10, DVWA)
                        │                          │
                     eve.json                 Wazuh agents
                        │                          │
                        ▼                          ▼
                   WireGuard ◀─────────────── agent events
                        │
                        ▼
                  Cloud SOC VMs
              ┌─────────┴─────────┐
          Wazuh VM          TheHive VM
        (SIEM stack)     (cases + automation)
```

All attack traffic crosses the Suricata gateway, giving the IDS full visibility of adversary-to-victim flows. Agent telemetry exits the lab over WireGuard to the cloud SIEM. Alerts are pulled from Wazuh and pushed into TheHive as cases.

---

## Visibility Boundary

What Suricata **can** and **cannot** inspect:

| Traffic | Visible to Suricata | Why |
|---------|---------------------|-----|
| Kali → Victim | ✅ Yes | Routed through ens33 → ens37 (gateway forward) |
| Victim → Cloud | ✅ Yes | Exits via ens37 → wg0 (WireGuard tunnel; no MASQUERADE preserves source IPs) |
| Victim ↔ Victim | ⚠️ Partial (Layer 2 Promiscuous) | Captured by Suricata AF-PACKET promiscuous sniffing on ens37 (14 alerts captured in raw data); unicast L2 traffic not hitting promiscuous mirror is monitored via Wazuh/Sysmon endpoint telemetry |
| Cloud ↔ Cloud | ❌ No | VNet peering, never reaches local gateway |
| Loopback | ❌ No | Never leaves the host |

---

## What Belongs Here

- **Architecture & topology** — the single [architecture.md](architecture.md) covers all network, addressing, and design decisions.
- **Host build guides** — one document per VM/host under `Local/` or `Cloud/`, covering installation, configuration, and service hardening.

## What Does NOT Belong Here

| Topic | Correct Location |
|-------|-----------------|
| Detection rules, decoders, custom integrations | [03-Detection-Engineering/](../03-Detection-Engineering/) |
| Alert-to-case pipeline (thecustomhive) | [03-Detection-Engineering/](../03-Detection-Engineering/) |
| Attack execution & red-team playbooks | [02-Attack-Simulation/](../02-Attack-Simulation/) |
| Investigation timelines & evidence | [04-Investigation/](../04-Investigation/) |
| Final incident report | [05-Incident-Report/](../05-Incident-Report/) |
