# 03 — Detection Engineering

This section details the detection logic, rules, parsers, and pipeline automation that monitor the lab environment. It answers the fundamental question: **what can the lab detect, and where are the operational boundaries?**

## Engineering Structure

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

---

## Architectural Linkage

Detection engineering directly interfaces with the underlying lab infrastructure:

```text
Local Infrastructure (01-Lab-Setup)         Detection Engineering (03-Detection-Engineering)
───────────────────────────────────         ────────────────────────────────────────────────
Suricata Gateway (Dual-NIC Router)   ───►   Suricata Rules & Threshold Tuning (Suricata/rules.md)
                                            Suricata JSON Decoders (Wazuh/decoders.md)

DVWA Target (/var/log/bashcmd.log)   ───►   Custom bashcmd Decoder (Wazuh/decoders.md)

Windows 10 / DC (Sysmon & Auditpol) ───►   Wazuh Custom Rules: wmiexec & Reg (Wazuh/rules.md)

Private Wazuh SIEM (Cloud VM 2)      ───►   Wazuh Manager Rules Engine (Wazuh/rules.md)

Cloud Ingress / TheHive (Cloud VM 1) ───►   thecustomhive SOAR Pipeline (pipeline-thecustomhive.md)
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
