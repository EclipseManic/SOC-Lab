# 📄 Telemetry Datasets, Case Exports & Blueprints (`06-Resources/files/`)

This directory houses the raw data dumps, SIEM event logs, SOAR platform database exports, and master command manuals generated during the operation of the SOC Lab.

---

## 🗂️ Directory Architecture

```
06-Resources/files/
├── attack-chain-full-commands.pdf          # 20-stage attack simulation master command manual
├── attack-chain-full.pdf                   # Alias reference to the attack simulation manual
├── alerts/ (Alerts-wazuh-thive/)           # Raw SIEM alerts and TheHive alert queue payloads
│   ├── Wazuh-Raw-Alerts.csv                # Complete raw CSV export of all 9,567 ingested SIEM logs
│   ├── thehive_alerts.json                 # JSON export of the 46 alerts ingested into TheHive 5
│   └── wazuh_alerts.csv                    # Curated CSV of key investigative alerts
└── cases/ (hive-cases-export-file/)        # Live database export from TheHive 5 SOAR platform
    └── TheHive-Case-Export.json            # Full 346 KB JSON export of cases CAS-001, CAS-002, CAS-003
```

---

## 📑 File Catalog & Forensic Significance

| File / Directory | File Type | Format | Primary Purpose |
|:---|:---|:---:|:---|
| `attack-chain-full-commands.pdf` | Documentation | PDF | Comprehensive command manual documenting every syntax, argument, and script used in Stages 01–20 |
| `alerts/Wazuh-Raw-Alerts.csv` | SIEM Telemetry | CSV | 9,567 raw security events recorded by Wazuh across the entire 74-minute attack exercise |
| `alerts/thehive_alerts.json` | SOAR Ingestion | JSON | Complete JSON structure of all 46 alerts forwarded from Wazuh to TheHive, including observables |
| `alerts/wazuh_alerts.csv` | Triage Dataset | CSV | Filtered spreadsheet containing the 809 most critical security events for triage analysis |
| `cases/TheHive-Case-Export.json` | Case Management | JSON | Full platform export containing the 3 master cases, associated observables, task histories, and notes |

---

## 🔗 Cross-References

- **Initial Triage Analysis**: [`04-Investigation/Initial-Triage-and-Investigation.md`](../../04-Investigation/Initial-Triage-and-Investigation.md)
- **Deep-Dive Attack Chain**: [`04-Investigation/Deep-Dive-Attack-Chain-Investigation.md`](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md)
- **Incident Summary Report**: [`05-Incident-Report/incident-report.md`](../../05-Incident-Report/incident-report.md)
