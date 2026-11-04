# 🗺️ Master Architecture & Workflow Diagrams (`06-Resources/diagrams/`)

This directory contains the 15 master architectural, topological, pipeline, and forensic workflow diagrams created for the SOC Lab. All diagrams are high-resolution PNGs illustrating network boundaries, sensor placements, telemetry dual-pathways, alert integration lifecycles, and attack-to-detection mappings.

---

## 📑 Diagram Catalog & Purpose

| Diagram Filename | Subject Area | Primary Focus & Description |
|:---|:---|:---|
| `Attack Simulation 20-Stage Kill Chain Roadmap.png` | Offensive Operations | 20-stage adversary progression from external recon to Active Directory ransomware |
| `Consolidated Incident Response 74-Minute Timeline.png` | Incident Timeline | Minute-by-minute correlation between attacker commands, alerts, and defensive actions |
| `Cybersecurity Lab-to-Detection Mapping.png` | Engineering | Comprehensive cross-mapping between laboratory hosts, attack vectors, and defensive sensors |
| `Life of an Alert End-to-End Walkthrough.png` | Detection Pipeline | End-to-end journey of an event from endpoint syscall/packet capture to TheHive alert card |
| `Neon Cybersecurity Incident Response Pipeline.png` | Incident Management | The 4-phase incident handling cycle: Triage, Containment, Deep-Dive, and Hardening |
| `Neon Cybersecurity Lab Network Diagram.png` | Network Architecture | Dual-subnet configuration showing DMZ (`192.168.232.0/24`) and Internal AD (`192.168.56.0/24`) |
| `Neon Cybersecurity Network Architecture Diagram.png` | Infrastructure | High-level topology illustrating firewall boundaries, monitoring interfaces, and cloud SIEM |
| `Neon Suricata Network Defense Diagram.png` | Network Security | Suricata NIDS placement on dual-homed gateway inspecting WAN and LAN traffic |
| `On-Prem to Cloud Telemetry Flow.png` | Cloud Telemetry | Secure TLS log forwarding from on-premise local VMs to Google Cloud SIEM/SOAR |
| `SOC Analyst Investigation Lifecycle.png` | SOC Operations | Standard operating procedure for triage, case promotion, evidence collection, and closure |
| `SOC Telemetry Dual-Pathway Architecture.png` | Data Pipeline | Dual-path log ingestion: Host-based (Wazuh/Sysmon/Auditd) and Network-based (Suricata) |
| `SOC_Lab_Architecture.png` | Master Architecture | Complete enterprise laboratory overview featuring all 6 virtual machines and their roles |
| `Secure Network Topology Infographic.png` | Visual Infographic | Detailed network layout highlighting IP assignments, open ports, and routing rules |
| `Wazuh Log Ingestion to TheHive Flow.png` | SOAR Integration | Technical data flow showing Wazuh server rule triggering and Python daemon webhook dispatch |
| `Wazuh-TheHive Neon Alert Pipeline.png` | Pipeline Architecture | Visual schematic of Wazuh-to-TheHive automated alert forwarding and triage queues |

---

## 🔗 Cross-References

- **Lab Setup & Network Topology**: [`01-Lab-Setup/README.md`](../../01-Lab-Setup/README.md)
- **Attack Simulation Overview**: [`02-Attack-Simulation/README.md`](../../02-Attack-Simulation/README.md)
- **Detection Engineering Architecture**: [`03-Detection-Engineering/README.md`](../../03-Detection-Engineering/README.md)
- **Incident Investigation Workflow**: [`04-Investigation/README.md`](../../04-Investigation/README.md)
