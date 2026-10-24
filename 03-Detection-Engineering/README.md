# 03 — Detection Engineering

This section details the detection logic, rules, parsers, and pipeline automation that monitor the lab environment. It answers the fundamental question: **what can the lab detect, and where are the operational boundaries?**

## Engineering Structure

### 1. Analysis & Documentation

| Document | Purpose |
|---|---|
| [coverage-matrix.md](coverage-matrix.md) | Stage-by-stage mapping of ATT&CK techniques, data sources, rule IDs, and validation status |
| [gaps.md](gaps.md) | Detection gap register, root cause classifications, and remediation strategies |
| [pipeline-thecustomhive.md](pipeline-thecustomhive.md) | Custom Wazuh-to-TheHive automation bridge, field mapping, and systemd service |
| [Wazuh/rules.md](Wazuh/rules.md) | Custom XML rules (wmiexec, SQLi, registry persistence) and core rule catalog |
| [Wazuh/decoders.md](Wazuh/decoders.md) | Custom `bashcmd` shell decoder and Suricata JSON parser definitions |
| [Wazuh/false-positives.md](Wazuh/false-positives.md) | Tuning decisions, noise suppression rules, and triage metrics |
| [Suricata/rules.md](Suricata/rules.md) | Network IDS signatures (`et/open` + Nmap rules) and `threshold.config` tuning |
| [Suricata/log-samples.md](Suricata/log-samples.md) | Real, redacted `eve-alert.json` event captures across attack stages |

### 2. Deployed Rule Files & Scripts (Codebase Artifacts)

| File | Type | Host / Location | Purpose |
|---|---|---|---|
| [custom-thehive.py](custom-thehive.py) | Python 3 Script | TheHive VM (`/opt/thecustomhive/`) | Production polling bridge: Wazuh API $\rightarrow$ TheHive v1 API with cursor tracking |
| [thehive-flush.service](thehive-flush.service) | Systemd Unit | TheHive VM (`/etc/systemd/system/`) | Background daemon managing `custom-thehive.py` lifecycle |
| [Wazuh/local_rules.xml](Wazuh/local_rules.xml) | Wazuh Rules XML | Wazuh SIEM (`/var/ossec/etc/rules/`) | Custom XML rules: 100613 (`wmiexec`), 100603, 100410, 100201 (SQLi), 100100 (Reg) |
| [Wazuh/local_decoder.xml](Wazuh/local_decoder.xml) | Wazuh Decoder XML | Wazuh SIEM (`/var/ossec/etc/decoders/`) | Custom regex parser for `/var/log/bashcmd.log` command tracking |
| [Suricata/custom.rules](Suricata/custom.rules) | Suricata Rules | Gateway (`/etc/suricata/rules/`) | Raw signature definitions (SIDs 3400002, 2010937, 2014726, 2002752, 2015862) |
| [Suricata/threshold.config](Suricata/threshold.config) | Tuning Config | Gateway (`/etc/suricata/`) | Rate-limiting rules for Nmap OS probes and multi-port scans |
| [Suricata/disable.conf](Suricata/disable.conf) | Tuning Config | Gateway (`/etc/suricata/`) | Disabled noisy informational ICMP/NTP/TLS signatures |
| [Suricata/modify.conf](Suricata/modify.conf) | Tuning Config | Gateway (`/etc/suricata/`) | Severity modifications upgrading webshell & privilege escalation rules to High |
| [Sysmon/sysmonconfig.xml](Sysmon/sysmonconfig.xml) | Sysmon XML Config | Windows 10 & DC (`C:\Windows\`) | Olaf Hartong modular baseline for process creation, WMI, and registry tracking |
| [Auditd/audit.rules](Auditd/audit.rules) | Linux Auditd Rules | DVWA (`/etc/audit/rules.d/`) | Nextron-based syscall monitoring for SUID bash, execve, and file persistence |

---

## Architectural Linkage

Detection engineering directly interfaces with the underlying lab infrastructure:

```text
Local Infrastructure (01-Lab-Setup)         Detection Engineering (03-Detection-Engineering)
───────────────────────────────────         ────────────────────────────────────────────────
Suricata Gateway (Dual-NIC Router)   ───►   Suricata Rules & Threshold Tuning (Suricata/custom.rules)
                                            Suricata JSON Decoders (Wazuh/local_decoder.xml)

DVWA Target (/var/log/bashcmd.log)   ───►   Custom bashcmd Decoder (Wazuh/local_decoder.xml)
                                            Auditd Syscall Rules (Auditd/audit.rules)

Windows 10 / DC (Sysmon & Auditpol) ───►   Sysmon Modular Configuration (Sysmon/sysmonconfig.xml)
                                            Wazuh Custom Rules: wmiexec & Reg (Wazuh/local_rules.xml)

Private Wazuh SIEM (Cloud VM 2)      ───►   Wazuh Rules Engine & Decoders (Wazuh/local_rules.xml)

Cloud Ingress / TheHive (Cloud VM 1) ───►   thecustomhive SOAR Pipeline (custom-thehive.py)
                                            Systemd Flush Daemon (thehive-flush.service)
```

---

## Performance Summary

Across the 20 attack stages executed in the lab:
- **Verified Detections:** **16 / 20** (80.0%) produced actionable alerts forwarded to TheHive.
- **Inherent Offline Gaps:** **2 / 20** (10.0% - Stages 04 & 11) occurred offline on the attacker GPU where victim telemetry cannot exist.
- **Architectural / Logging Gaps:** **2 / 20** (10.0% - Stages 09 & 12) were alerted via pivot host telemetry while intra-subnet host inspection was refined.
- **Rule Failures:** **0** (0.0%).

## Related Sections

- [Lab Setup Documentation](../01-Lab-Setup/README.md)
- [Attack Simulation Write-ups](../02-Attack-Simulation/README.md)
- [Master Index & Traceability Matrix](../INDEX.md)
