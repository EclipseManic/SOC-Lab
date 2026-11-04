# ⚙️ Server & Agent Configuration Profiles (`06-Resources/configs/`)

This directory maintains the master configuration files and reference lookup databases used to operate the Wazuh SIEM manager and connected sensor agents.

---

## 🗂️ Directory Architecture

```
06-Resources/configs/
├── ossec.conf                              # Wazuh server master configuration profile
└── lists/                                  # CDB (Constant Database) reference lookup tables
    └── wazuh-internal-bins                 # Whitelist of legitimate internal binaries and system utilities
```

---

## 📑 File Catalog & Operational Purpose

| File | Subdirectory | Primary Scope | Operational Significance |
|:---|:---|:---|:---|
| `ossec.conf` | `.` | Wazuh Manager (`/var/ossec/etc/ossec.conf`) | Master configuration file defining log ingestion ports (`1514/1515`), active response configurations, custom alert integration parameters (`custom-thehive`), and agent registration policies. |
| `wazuh-internal-bins` | [`lists/`](lists/) | CDB List (`/var/ossec/etc/lists/`) | Constant Database (CDB) list containing known benign operating system binaries. Used in correlation rules to distinguish authorized administrative execution from unauthorized Living-off-the-Land (LotL) adversary techniques. |

---

## 🔗 Cross-References

- **Wazuh Server Setup Guide**: [`01-Lab-Setup/Cloud/wazuh.md`](../../01-Lab-Setup/Cloud/wazuh.md)
- **Detection Engineering Architecture**: [`03-Detection-Engineering/Wazuh/README.md`](../../03-Detection-Engineering/Wazuh/README.md)
