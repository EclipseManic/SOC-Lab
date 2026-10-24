# Wazuh Rules — Custom & Built-in Rule Catalog

> **Production Ruleset:** The complete XML definition ready for Wazuh Manager deployment is located in [`local_rules.xml`](local_rules.xml).

## Overview

This catalog inventories the Wazuh rules responsible for detecting the 20-stage attack campaign across both Linux and Windows endpoints, as well as the ingested Suricata network events. 

Alerts at or above **Level 8** are automatically enriched and pushed into TheHive via [thecustomhive pipeline](../pipeline-thecustomhive.md).

## Custom Rules (`local_rules.xml`)

Custom detection logic was engineered to cover specific attacker tradecraft observed during lateral movement, privilege escalation, persistence, and web exploitation.

### 1. Rule 100613 — Impacket `wmiexec` Detection

Detects execution of Impacket's `wmiexec.py` tool. Impacket executes commands through WMI by spawning `cmd.exe /Q /c` with an output redirection file staged on the administrative share `ADMIN$\__<timestamp>`.

```xml
<group name="soc-lab,windows,sysmon,execution,">
  <rule id="100613" level="12">
    <if_sid>61603</if_sid>
    <field name="win.eventdata.parentCommandLine" type="pcre2">cmd\.exe\s+/Q\s+/c\s+.*\\\\ADMIN\$\\\\__\d+</field>
    <description>Impacket wmiexec detected: command execution via WMI with ADMIN$ share staging</description>
    <mitre>
      <id>T1047</id>
      <id>T1059.003</id>
    </mitre>
  </rule>
</group>
```

- **Observed in Stages:** [Stage 17](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md), [Stage 18](../../02-Attack-Simulation/Stages/stage-18-collection.md), [Stage 20](../../02-Attack-Simulation/Stages/stage-20-impact.md)
- **Fidelity:** Very High. Benign administrative scripts rarely utilize the specific `/Q /c ... \ADMIN$\__<digits>` redirection convention.

---

### 2. Rule 100603 — Sensitive Privilege Assignment on Logon

Fires when high-impact administrative privileges are assigned to a logon session (Windows Security Event ID 4672).

```xml
<group name="soc-lab,windows,privilege_escalation,">
  <rule id="100603" level="10">
    <if_sid>60103</if_sid>
    <field name="win.eventdata.privilegeList" type="pcre2">SeDebugPrivilege|SeTakeOwnershipPrivilege|SeLoadDriverPrivilege</field>
    <description>Windows: High-risk administrative privilege assigned during logon session</description>
    <mitre>
      <id>T1134</id>
      <id>T1078.002</id>
    </mitre>
  </rule>
</group>
```

- **Observed in Stages:** [Stage 15](../../02-Attack-Simulation/Stages/stage-15-pass-the-hash.md), [Stage 16](../../02-Attack-Simulation/Stages/stage-16-golden-ticket.md)
- **Tuning:** Standard domain controller service accounts are whitelisted to prevent false positives during regular replication.

---

### 3. Rule 100410 — High-Frequency Network Scan / 4xx Burst Correlation

Aggregates bursts of Suricata alerts or HTTP 400-series client errors from a single source within a 60-second window.

```xml
<group name="soc-lab,suricata,recon,">
  <rule id="100410" level="8" frequency="100" timeframe="60">
    <if_matched_sid>86601</if_matched_sid>
    <same_source_ip />
    <description>Suricata: Anomaly burst of network alerts from single source (>100 events in 60s)</description>
    <mitre>
      <id>T1595</id>
    </mitre>
  </rule>
</group>
```

- **Observed in Stages:** [Stage 01](../../02-Attack-Simulation/Stages/stage-01-recon.md), [Stage 02](../../02-Attack-Simulation/Stages/stage-02-bruteforce.md)
- **Function:** Aggregates noisy individual scan probes into a single actionable incident alert.

---

### 4. Rule 100201 — SQL Injection Parameter Inspection

Matches common SQL injection signatures within URI parameters that bypass simple web application firewalls.

```xml
<group name="soc-lab,web,sqli,">
  <rule id="100201" level="10">
    <if_sid>31101</if_sid>
    <url type="pcre2">(?i)(?:UNION(?:\s+ALL)?\s+SELECT|OR\s+1=1|AND\s+1=1|SLEEP\s*\(|BENCHMARK\s*\(|ORDER\s+BY\s+\d+)</url>
    <description>Web application attack: SQL injection payload detected in URI parameter</description>
    <mitre>
      <id>T1190</id>
    </mitre>
  </rule>
</group>
```

- **Observed in Stages:** [Stage 03](../../02-Attack-Simulation/Stages/stage-03-sqli.md)

---

### 5. Rules 100100–100104 — Registry Run Key Persistence

Detects modifications to Windows autostart execution points via Sysmon Event 13 (Registry Value Set).

```xml
<group name="soc-lab,windows,sysmon,persistence,">
  <rule id="100100" level="12">
    <if_sid>61603</if_sid>
    <field name="win.eventdata.targetObject" type="pcre2">(?i)\\\\CurrentVersion\\\\Run(?:Once)?\\\\[^\\]+$</field>
    <description>Persistence: Registry autostart Run/RunOnce key created or modified</description>
    <mitre>
      <id>T1547.001</id>
    </mitre>
  </rule>
</group>
```

- **Observed in Stages:** [Stage 17](../../02-Attack-Simulation/Stages/stage-17-dc-persistence.md)

---

## Built-in Rules Catalog & Stage Mapping

| Rule ID | Level | Description | Target / Log Source | Stage(s) | Status | TheHive Alert ID |
|---|---|---|---|---|---|---|
| `86601` | 3 | Suricata: Network Alert Event | Suricata `eve-alert.json` | 01, 03, 05, 06, 09, 10, 15, 20 | Verified | `wzb-3a8045a03c`, `wzb-e076a639a7` |
| `3400002` | 3 | ET SCAN NMAP OS Detection Probe | Suricata via Wazuh | 01 | Verified | `wzb-3a8045a03c` |
| `2010937` | 2 | ET SCAN Suspicious inbound probe (Multi-port) | Suricata via Wazuh | 01 | Verified | `wzb-e076a639a7` |
| `31153` | 10 | Multiple common web attacks from same source IP | Apache `access.log` (DVWA) | 02 | Verified | `wzb-81becfcc8d` |
| `31151` | 5 | Multiple 400-series web error responses | Apache `access.log` (DVWA) | 02 | Verified | `wzb-4de933ca95` |
| `31168` | 12 | Shellshock attack pattern detected | Apache `access.log` (DVWA) | 02 | Verified | `wzb-30ff03b872` |
| `100201` | 10 | SQL injection attempt detected in URI | Apache `access.log` (DVWA) | 03 | Verified | Alert 17 (`4.png`) |
| `100600` | 10 | Web server command injection / PHP upload exploit | Suricata `eve-alert.json` | 03, 05 | Verified | Alert 21, 22 (`6.1.png`) |
| `5402` | 10 | Successful sudo execution by service account (`www-data`) | Linux `/var/log/auth.log` | 07 | Verified | Alert 6 (`6.png`) |
| `550` | 7 | FIM: Integrity checksum modified (`/root/.ssh/authorized_keys`) | Wazuh Syscheck / FIM | 08 | Verified | Alert 7 (`7.png`) |
| `5715` | 3 | SSH authentication success (Administrative user from external IP) | Linux `/var/log/auth.log` | 08, 12, 13, 14, 16, 19, 20 | Verified | `[DVWA] Logon activity: ROOT` |
| `86601` | 3 | ET SCAN Potential Port Scan | Suricata `eve-alert.json` | 09 | Verified | Alert 8 (`8.png`) |
| `86601` | 3 | Suspicious Multicast / LLMNR Poisoning response | Suricata `eve-alert.json` | 10 | Verified | Alert 9 (`9.png`) |
| `86601` | 3 | ET EXPLOIT Possible GoldenPac Privilege Escalation | Suricata `eve-alert.json` | 15 | Verified | `[Suricata] Alert 15` (`15.png`) |
| `60103` | 5 | Windows: Successful logon (LogonType 3 / 9) | Windows Security EID 4624 | 15, 16, 17 | Verified | Aggregated in Wazuh |
| `60107` | 8 | Windows: Service ticket requested with RC4 encryption (Kerberoasting) | Windows Security EID 4769 | 13, 16 | Verified | Alert 13 (`13.png`) |
| `60144` | 10 | Windows: Directory Service access / replication rights requested (DCSync) | Windows Security EID 4662 | 14 | Verified | Alert 14 (`14.png`) |
| `100613` | 12 | Impacket `wmiexec` lateral movement execution | Sysmon EID 1 (`DomainWin10`) | 17, 18, 20 | Verified | Alert 17, 18, 20 (`17.png`–`20.png`) |
| `60109` | 8 | Windows: User account created or added to privileged group | Windows Security EID 4720 / 4728 | 17 | Verified | Alert 17.2 (`17.2.png`) |

## Alert Propagation Path

```text
Host / Network Sensor (Sysmon, auth.log, eve-alert.json)
       │
       ▼
Wazuh Agent (Ships via TCP/1514 across WireGuard)
       │
       ▼
Wazuh Manager (Evaluates local_rules.xml & core rules)
       │
       ▼ If Rule Level ≥ 8
alerts.json ──► thecustomhive.py ──► TheHive API (POST /api/v1/alert)
```

## Related Documents

- [Custom Decoders (`local_decoder.xml`)](decoders.md)
- [False-Positive Log & Tuning](false-positives.md)
- [thecustomhive Pipeline Documentation](../pipeline-thecustomhive.md)
- [Detection Coverage Matrix](../coverage-matrix.md)
