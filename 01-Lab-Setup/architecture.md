# Architecture & Network Topology

> [!NOTE]
> **Documentation Consolidation:** To maintain a single authoritative source of truth, all architectural blueprints, routing flows, network zones, addressing tables, and engineering decisions have been unified directly inside:
> 
> 👉 **[01-Lab-Setup/README.md](README.md)**

---

## Quick Navigation to Unified Architecture Sections

- **[Architectural Philosophy & Engineering Decisions](README.md#why-the-lab-was-built-this-way-engineering-decisions)** — Split cloud, zero public IPs, passive IDS rationale.
- **[End-to-End Routing Architecture & Infographic](README.md#4-how-traffic-routes--preserving-real-victim-ips-no-nat-on-the-tunnel)** — Kali static route, victim `.150` gateway, WireGuard tunnel, and zero-NAT IP preservation.
- **[Lab Segmentation & 4 Network Zones](README.md#lab-segmentation--network-zones)** — Attacker, gateway, victim subnet, and cloud SOC.
- **[8-Machine Master Addressing Plan & Port Matrix](README.md#ip-address-plan--port-matrix)** — IP allocations, listening ports, and access boundaries across all 8 machines.
- **[Sensor Visibility & Blind Spot Analysis](README.md#sensor-visibility--blind-spot-analysis)** — Analysis of wire vs. host visibility across all 4 traffic paths.
- **[Software Component Deployment Model](README.md#software-component-deployment-model)** — Host-by-host software deployment matrix.
- **[Host Build Specifications](README.md#detailed-host-profiles--technical-specifications)** — Dedicated provisioning links for Kali, Suricata, DVWA, Win10, DC, TheHive, and Wazuh.
- **[Pipeline Verification Commands](README.md#verification--health-check-commands)** — Step-by-step diagnostic checks.
