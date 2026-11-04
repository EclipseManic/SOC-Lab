# 🛡️ Detection Engineering Production Rule Definitions (`06-Resources/rules/`)

This directory contains the production-tested detection signatures, kernel auditing profiles, XML decoders, and event-correlation rules implemented across the laboratory defense stack.

---

## 🗂️ Directory Architecture

```
06-Resources/rules/
├── auditd/                                 # Linux kernel auditing rules
│   └── audit.rules                         # Syscall tracking for execve, ptrace, identity changes & file integrity
├── suricata/                               # Network Intrusion Detection Signatures (NIDS)
│   ├── custom.rules                        # Signatures for Nmap, SQL injection, webshells, and GoldenPac
│   └── threshold.config                    # Rate-limiting and noise suppression configurations
├── sysmon/                                 # Microsoft Windows Sysmon event filtering profile
│   └── sysmonconfig.xml                    # Process creation, network connections, and registry sabotage tracking
└── wazuh/                                  # Wazuh SIEM custom decoders and correlation rules
    ├── local_decoder.xml                   # Decoders for custom auditd, Apache, and Suricata log formats
    └── local_rules.xml                     # 1,314 lines of production correlation rules mapping to MITRE ATT&CK
```

---

## 📑 Rule Inventory & Scope

| Technology | Subdirectory | Primary File | Purpose & Coverage |
|:---|:---|:---|:---|
| **Linux Auditd** | [`auditd/`](auditd/) | `audit.rules` | Kernel-level syscall monitoring on DVWA web server; detects command execution (`execve`), shell privilege transitions (`setuid`), and SSH persistence. |
| **Suricata NIDS** | [`suricata/`](suricata/) | `custom.rules`, `threshold.config` | Perimeter network inspection on Suricata Gateway; detects TCP SYN scans, Nikto web scanning, SQL injection payloads, and suspicious Kerberos traffic. |
| **Windows Sysmon** | [`sysmon/`](sysmon/) | `sysmonconfig.xml` | Windows endpoint telemetry on `PC-DC` and `Win10User`; captures command-line process creation (EID 1), remote WMI invocation, and ransomware registry modifications (EID 13). |
| **Wazuh SIEM** | [`wazuh/`](wazuh/) | `local_decoder.xml`, `local_rules.xml` | Central correlation engine on Wazuh Manager; normalizes logs, identifies multi-stage attack patterns, assigns severity levels (3 to 15), and generates TheHive-ready alert payloads. |

---

## 🔗 Cross-References

- **Detection Engineering Overview**: [`03-Detection-Engineering/README.md`](../../03-Detection-Engineering/README.md)
- **Linux Auditd Configuration Guide**: [`03-Detection-Engineering/Auditd/README.md`](../../03-Detection-Engineering/Auditd/README.md)
- **Suricata NIDS Configuration Guide**: [`03-Detection-Engineering/Suricata/README.md`](../../03-Detection-Engineering/Suricata/README.md)
- **Windows Sysmon Configuration Guide**: [`03-Detection-Engineering/Sysmon/README.md`](../../03-Detection-Engineering/Sysmon/README.md)
- **Wazuh SIEM Rules Guide**: [`03-Detection-Engineering/Wazuh/README.md`](../../03-Detection-Engineering/Wazuh/README.md)
