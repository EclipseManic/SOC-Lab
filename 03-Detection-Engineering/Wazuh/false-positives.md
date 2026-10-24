# False Positives, Alert Tuning & Noise Reduction

## Overview

Detection engineering requires continuous tuning to prevent SOC analyst fatigue while preserving high detection sensitivity for malicious behavior. In this lab, tuning was applied at three levels:
1. **Suricata Pre-filtering:** Filtering non-actionable network noise before shipping to Wazuh.
2. **Wazuh Correlation & Aggregation:** Transforming multi-alert bursts into single incident alerts (e.g., Rule `100410`).
3. **SOAR Severity Thresholding:** Restricting TheHive ingestion via [thecustomhive](../pipeline-thecustomhive.md) to alerts with `rule.level >= 8`.

## Tuning Log & Decisions

| Date / Phase | Rule ID | Alert Description | Root Cause / Benign Trigger | Tuning Action Applied | Outcome |
|---|---|---|---|---|---|
| Reconnaissance | `86601` | Suricata: Alert event burst | Automated Nmap TCP SYN/OS scanning generated >3,000 raw packet alerts | Created correlation rule `100410` (Level 8, `frequency="100"` in `60s`) | Replaced 3,000 individual alerts with 1 aggregated scan incident in TheHive |
| Initial Access | `31168` | Shellshock attack detected | Nikto web scanner injected `() { :;};` strings into User-Agent headers | Kept active without suppression; tagged as `scanner-artifact` in pipeline | Genuine detection of web vulnerability probing |
| Pivot / Access | `5715` | SSH authentication success (root) | Legitimate administrator management sessions from `192.168.232.135` | Enriched alert title with source IP aggregation `[4x] [DVWA] Logon activity: ROOT` | Legitimate logins grouped; anomaly easily distinguished by frequency |
| Active Directory | `60103` / `100603` | Sensitive privilege assignment | Windows system services and initial lab provisioning scripts | Added rule suppression for default DC machine accounts (`PC-DC$`) | Eliminated baseline noise while retaining alerts on domain user accounts |
| Domain Persistence | `61603` | Sysmon Process Creation noise | Routine background Windows tasks (`conhost.exe`, `BackgroundDownload.exe`) | Configured Sysmon modular excludes (`sysmon-modular`) for known-good binaries | Reduced endpoint event volume by 68% without filtering `cmd.exe` |

## Noise Suppressions Configured in `local_rules.xml`

```xml
<!-- Suppress benign Windows Defender service alerts (Defender intentionally disabled in lab) -->
<group name="soc-lab,tuning,">
  <rule id="100901" level="0">
    <if_sid>60100</if_sid>
    <field name="win.system.providerName">Microsoft-Antimalware</field>
    <description>Tuning: Suppress routine Windows Defender status changes in lab environment</description>
  </rule>

  <!-- Suppress routine Windows Update check-ins -->
  <rule id="100902" level="0">
    <if_sid>60100</if_sid>
    <field name="win.system.providerName">Microsoft-Windows-WindowsUpdateClient</field>
    <description>Tuning: Suppress scheduled Windows Update polling noise</description>
  </rule>
</group>
```

## Triage Assessment Questions

When evaluating a potentially noisy rule in the lab:
1. **True Positive vs. False Positive:** Did the signature match actual adversary activity (or scanner probing), or purely benign operational behavior?
2. **Contextual Scope:** Can the rule be narrowed by user (`www-data`), directory (`/var/www/`), or parent process (`wmic.exe`) rather than disabling the rule entirely?
3. **Thresholding Opportunity:** Is the activity only malicious when executed repeatedly in a short burst (e.g., brute force, port scans)? If so, use `frequency` and `timeframe` attributes.
4. **Impact on Lateral Movement:** Does this suppression inadvertently blind the SOC to post-exploitation tradecraft?

## Metrics Summary

| Metric | Measured Value |
|---|---|
| Total Raw Events Ingested | ~145,000 |
| Wazuh Rule Matches | ~4,200 |
| Alerts Forwarded to TheHive (Level $\ge$ 8) | 48 actionable alerts |
| Total False Positives Reviewed | 3 |
| Suppression Rules Applied | 4 |
| Validated True Detections Lost After Tuning | **0** |

## Related Documents

- [Wazuh Custom Rules Catalog](rules.md)
- [thecustomhive Alert Pipeline](../pipeline-thecustomhive.md)
- [Detection Coverage Matrix](../coverage-matrix.md)
