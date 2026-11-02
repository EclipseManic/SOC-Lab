# 📁 Master Enterprise Asset Repository (`assets/`)

This directory is the centralized, single-source-of-truth asset repository for the SOC Lab. All evidentiary screenshots, diagrams, telemetry datasets, configuration files, detection rules, and automation scripts are organized here in a structured, intuitive directory tree.

---

## 🌳 Asset Directory Tree

```
assets/
├── screenshots/                                # All empirical photographic evidence
│   ├── attack-simulation/                      # 62 adversary perspective screenshots (Stage 01–20)
│   ├── detection-engineering/                  # 60 TheHive alert & sensor triage captures
│   └── investigation/                          # Operational DFIR investigation evidence
│       ├── containment/                        # 15 live containment & lockout verification captures
│       ├── initial-triage/                     # 26 queue triage & chronological evidence captures
│       └── wazuh-alerts/                       # 68 verified SIEM & endpoint alert screenshots (wzb-01 to wzb-68)
├── diagrams/                                   # High-resolution architectural, flow, and network diagrams
├── files/                                      # Master datasets, reports, and blueprints
│   ├── alerts/                                 # Raw SIEM logs, CSVs, and TheHive alert JSON
│   │   ├── thehive_alerts.json                 # Correlated alert definitions
│   │   ├── wazuh_alerts.csv                    # 808 curated attack timeline SIEM alerts
│   │   └── Wazuh-Raw-Alerts.csv                # Complete raw uncurated SIEM telemetry
│   ├── attack-chain-full.pdf                   # Definitive 20-stage attack simulation master blueprint
│   └── _unredacted/                            # Unredacted forensic references
├── rules/                                      # Production detection engineering rule definitions
│   ├── auditd/                                 # Linux Auditd kernel syscall monitoring rules (audit.rules)
│   ├── suricata/                               # Suricata NIDS signatures & thresholds (custom.rules, threshold.config)
│   ├── wazuh/                                  # Wazuh custom decoders & correlation rules (local_decoder.xml, local_rules.xml)
│   └── sysmon/                                 # Windows Sysmon XML event filtering profile (sysmonconfig.xml)
├── configs/                                    # Server and agent configuration profiles
│   ├── ossec.conf                              # Wazuh server master configuration
│   └── lists/                                  # Constant database lists (wazuh-internal-bins)
└── scripts/                                    # Automation daemons, API webhooks, and fingerprint utilities
    ├── custom-thehive                          # Wazuh integration executable
    ├── custom-thehive.py                       # TheHive alert dispatching daemon
    ├── thehive-flush.service                   # Systemd queue maintenance service
    └── tool_fingerprints.json                  # Adversary tooling signature definitions
```

---

## 📑 Directory Purpose & Contents

| Subdirectory | Category | File Count | Purpose |
|:---|:---|:---:|:---|
| [`screenshots/attack-simulation/`](screenshots/attack-simulation/) | Attack Telemetry | 62 | Visual proof of offensive commands executed during stages 01 through 20 |
| [`screenshots/detection-engineering/`](screenshots/detection-engineering/) | Detection Alerts | 60 | TheHive alert cards, rule matches, and NIDS event details |
| [`screenshots/investigation/containment/`](screenshots/investigation/containment/) | Incident Response | 15 | Live Velociraptor VQL and host command execution proving attacker lockout |
| [`screenshots/investigation/initial-triage/`](screenshots/investigation/initial-triage/) | Incident Response | 26 | Queue triage by severity, chronological event sorting, and initial analysis |
| [`screenshots/investigation/wazuh-alerts/`](screenshots/investigation/wazuh-alerts/) | SIEM Telemetry | 68 | Chronological Wazuh SIEM alerts (`wzb-01` to `wzb-68`) covering the complete attack chain |
| [`diagrams/`](diagrams/) | Architecture | 15 | Master network topology, dual-pathway data flow, and IR pipeline diagrams |
| [`files/alerts/`](files/alerts/) | Telemetry Datasets | 3 | Master CSV and JSON files capturing all 808 SIEM events and 46 TheHive alerts |
| [`files/`](files/) | Blueprints & Docs | 1 | Complete 20-stage master attack simulation blueprint PDF |
| [`rules/`](rules/) | Detection Rules | 6 | Production rules for Linux Auditd, Suricata NIDS, Wazuh SIEM, and Windows Sysmon |
| [`configs/`](configs/) | Server Configurations | 2 | Wazuh manager configuration (`ossec.conf`) and internal binary lookup lists |
| [`scripts/`](scripts/) | Integrations & Tools | 4 | Wazuh-to-TheHive integration daemons, systemd unit files, and fingerprint databases |
