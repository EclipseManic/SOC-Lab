# 📁 06 — Master Enterprise Resources Repository (`06-Resources/`)

This directory is the centralized, single-source-of-truth asset repository for the SOC Lab. All evidentiary screenshots, diagrams, telemetry datasets, configuration files, detection rules, and automation scripts are organized here in a structured, intuitive directory tree.

---

## 🌳 Asset Directory Tree

```
06-Resources/
├── screenshots/                                # All empirical photographic evidence (7 top-level directories, zero subdirectories)
│   ├── attack-simulation/                      # 62 adversary perspective screenshots (Stages 01–20)
│   ├── thehive-alert/                          # 60 TheHive alert & sensor triage captures
│   ├── thehive-cases/                          # 9 TheHive 5 case closure, task verification & FP dismissal captures
│   ├── initial-triage/                         # 26 queue triage & chronological evidence captures
│   ├── initial-triage-action/                  # 15 live tactical containment & lockout verification captures
│   ├── wazuh-deep-investigation/               # 68 verified SIEM & endpoint alert screenshots (wzb-01 to wzb-68)
│   └── deep-investigation-action/              # 11 live host eradication, vulnerability hardening & recovery captures
├── diagrams/                                   # High-resolution architectural, flow, and network diagrams
├── files/                                      # Master datasets, reports, and blueprints
│   ├── Alerts-wazuh-thive/                     # Raw SIEM logs, CSVs, and TheHive alert JSON
│   ├── hive-cases-export-file/                 # Live database export from TheHive 5 platform
│   └── attack-chain-full-commands.pdf          # 20-stage attack simulation master command manual
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
| [`screenshots/thehive-alert/`](screenshots/thehive-alert/) | Detection Alerts | 60 | TheHive alert cards, rule matches, and NIDS event details |
| [`screenshots/thehive-cases/`](screenshots/thehive-cases/) | SOAR Case Management | 9 | TheHive 5 case records, completed task lists, cleared alert queue, and dismissed false positives |
| [`screenshots/initial-triage/`](screenshots/initial-triage/) | Incident Triage | 26 | Queue triage by severity, chronological event sorting, and initial analysis |
| [`screenshots/initial-triage-action/`](screenshots/initial-triage-action/) | Tactical Containment | 15 | Live Velociraptor VQL and host command execution proving attacker lockout |
| [`screenshots/wazuh-deep-investigation/`](screenshots/wazuh-deep-investigation/) | Forensic Telemetry | 68 | Chronological Wazuh SIEM alerts (`wzb-01` to `wzb-68`) covering the complete attack chain |
| [`screenshots/deep-investigation-action/`](screenshots/deep-investigation-action/) | Eradication & Hardening | 11 | Host-level proof of root-cause elimination, ransomware cleanup, wallpaper restoration, and firewall drops |
| [`diagrams/`](diagrams/) | Architecture | 15 | Master network topology, dual-pathway data flow, and IR pipeline diagrams |
| [`rules/`](rules/) | Detection Rules | 6 | Production rules for Linux Auditd, Suricata NIDS, Wazuh SIEM, and Windows Sysmon |
| [`configs/`](configs/) | Server Configurations | 2 | Wazuh manager configuration (`ossec.conf`) and internal binary lookup lists |
| [`scripts/`](scripts/) | Integrations & Tools | 4 | Wazuh-to-TheHive integration daemons, systemd unit files, and fingerprint databases |
