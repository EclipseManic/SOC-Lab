# 03 — Detection Engineering

This section details the detection logic, rules, parsers, and pipeline automation that monitor the lab environment. It answers the fundamental question: **what can the lab detect, and where are the operational boundaries?**

## Engineering Structure

### 1. Analysis & Documentation

| Document | Purpose |
|---|---|
| [coverage-matrix.md](coverage-matrix.md) | Stage-by-stage mapping of ATT&CK techniques, data sources, rule IDs, and validation status |
| [gaps.md](gaps.md) | Detection gap register, root cause classifications, and remediation strategies |
| [pipeline-thecustomhive.md](pipeline-thecustomhive.md) | Custom Wazuh-to-TheHive automation bridge, batched correlation engine, and systemd daemon |
| [Wazuh/rules.md](Wazuh/rules.md) | Detailed documentation of custom rules (`local_rules.xml`), LOLBins, suppressions, and overrides |
| [Wazuh/decoders.md](Wazuh/decoders.md) | Custom `bashcmd` shell decoder and Suricata JSON parser definitions |
| [Wazuh/false-positives.md](Wazuh/false-positives.md) | Tuning decisions, noise suppression rules, and triage metrics |
| [Suricata/rules.md](Suricata/rules.md) | Network IDS signatures (`et/open` + custom Nmap rules) and `threshold.config` tuning |

### 2. Deployed Rule Files & Scripts (Codebase Artifacts)

| File | Type | Host / Location | Purpose |
|---|---|---|---|
| [Wazuh/custom-thehive](Wazuh/custom-thehive) | Shell Script | Wazuh Manager (`/var/ossec/integrations/`) | POSIX wrapper invoked by Wazuh per alert |
| [Wazuh/custom-thehive.py](Wazuh/custom-thehive.py) | Python 3 Script | Wazuh Manager (`/var/ossec/integrations/`) | Production correlation & batched flush engine: zero-HTTP ingest, recon tool fingerprinting, TheHive 5 sync |
| [Wazuh/thehive-flush.service](Wazuh/thehive-flush.service) | Systemd Unit | Wazuh Manager (`/etc/systemd/system/`) | Background daemon managing `custom-thehive.py --flush-daemon` |
| [Wazuh/local_rules.xml](Wazuh/local_rules.xml) | Wazuh Rules XML | Wazuh SIEM (`/var/ossec/etc/rules/`) | Complete authentic local ruleset: LOLBins, wmiexec, privilege escalation, suppressions |
| [Wazuh/local_decoder.xml](Wazuh/local_decoder.xml) | Wazuh Decoder XML | Wazuh SIEM (`/var/ossec/etc/decoders/`) | Custom regex parser extracting `uid, user, pwd, command` from `/var/log/bashcmd.log` |
| [Wazuh/ossec.conf](Wazuh/ossec.conf) | Wazuh Config XML | Wazuh SIEM (`/var/ossec/etc/`) | Wazuh manager configuration defining the `custom-thehive` integration block |
| [Suricata/custom.rules](Suricata/custom.rules) | Suricata Rules | Gateway (`/etc/suricata/rules/`) | Custom signatures (Nmap OS detection probes, SQL injection, LLMNR, GoldenPac) |
| [Suricata/threshold.config](Suricata/threshold.config) | Tuning Config | Gateway (`/etc/suricata/`) | Rate-limiting rules for Nmap OS probes and multi-port scans |
| [Sysmon/sysmonconfig.xml](Sysmon/sysmonconfig.xml) | Sysmon XML Config | Windows 10 & DC (`C:\Windows\`) | Modular telemetry baseline for process creation, named pipes, and registry tracking |
| [Auditd/audit.rules](Auditd/audit.rules) | Linux Auditd Rules | DVWA (`/etc/audit/rules.d/`) | Syscall monitoring for SUID bash, execve execution, and identity file access |

---

## Architectural Linkage

Detection engineering directly interfaces with the underlying lab infrastructure:

```text
Local Infrastructure (01-Lab-Setup)         Detection Engineering (03-Detection-Engineering)
===================================         ================================================
Suricata Gateway (Dual-NIC Router)   ----->  Custom Suricata Signatures (Suricata/custom.rules)
                                             Rate-limiting & Suppression (Suricata/threshold.config)
                                             Suricata JSON Decoder (Wazuh/local_decoder.xml)

DVWA Target (/var/log/bashcmd.log)   ----->  Custom bashcmd Decoder (Wazuh/local_decoder.xml)
                                             Auditd Syscall Rules (Auditd/audit.rules)

Windows 10 / DC (Sysmon & Auditpol)  ----->  Sysmon Modular Configuration (Sysmon/sysmonconfig.xml)
                                             Wazuh Rules: wmiexec, Sysmon, Registry (Wazuh/local_rules.xml)

Private Wazuh SIEM (Cloud VM 2)      ----->  Wazuh Engine & Local Rules (Wazuh/local_rules.xml)
                                             Manager Integration Block (Wazuh/ossec.conf)
                                             thecustomhive Ingest & Queue (Wazuh/custom-thehive, Wazuh/custom-thehive.py)

TheHive Case Management (Cloud VM 1) ----->  thecustomhive Flush Daemon (Wazuh/thehive-flush.service)
                                             Correlated Case & Alert Creation (TheHive 5 API)
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
