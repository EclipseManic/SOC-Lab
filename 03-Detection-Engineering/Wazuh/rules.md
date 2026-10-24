# Wazuh Rules — Custom & Built-in Rule Catalog

> **Production Ruleset:** The complete XML definition deployed on the Wazuh Manager is located in [`local_rules.xml`](local_rules.xml).
> **Manager Configuration:** Manager integration and logging settings are in [`ossec.conf`](ossec.conf).
> **TheHive Integration:** Ingestion wrapper [`custom-thehive`](custom-thehive), correlation engine [`custom-thehive.py`](custom-thehive.py), and service unit [`thehive-flush.service`](thehive-flush.service).

## Overview

This catalog inventories the custom Wazuh rules, overrides, and noise suppressions developed for the SOC lab. In this environment, Wazuh serves as the central correlation hub: endpoint logs (Auditd, Bash logging, Sysmon, Windows Security) and network events (Suricata) are evaluated against this unified ruleset.

Alerts matching level $\ge 8$ or designated in `ALWAYS_ESCALATE_RULE_IDS` are ingested into SQLite and forwarded to TheHive 5 via [`thecustomhive`](../pipeline-thecustomhive.md).

---

## 1. Key Custom Detection Rules

### Rule 100613 — Impacket `wmiexec` Detection
Detects semi-interactive remote command execution via WMI using Impacket's `wmiexec.py`. Impacket spawns `cmd.exe /Q /c` and stages output via a temporary file on the administrative `ADMIN$\__<id>` share.

```xml
<rule id="100613" level="10">
  <if_sid>92069</if_sid>
  <field name="win.eventdata.originalFileName" type="pcre2">(?i)^cmd\.exe$</field>
  <field name="win.eventdata.commandLine" type="pcre2">(?i)/Q\s+/c\s+.*ADMIN\$\\+__\d+</field>
  <description>Impacket wmiexec detected - user=$(win.eventdata.user) host=$(win.system.computer) cmdline=$(win.eventdata.commandLine)</description>
  <mitre>
    <id>T1047</id>
  </mitre>
</rule>
```

---

### Rule 100603 — Sensitive Attack Privileges Assigned to Human Account
Fires on Windows Security Event ID 4672 when high-risk privileges (`SeDebugPrivilege`, `SeImpersonatePrivilege`, `SeTcbPrivilege`, `SeTakeOwnershipPrivilege`) are granted to a non-machine, human logon session.

```xml
<rule id="100603" level="6" ignore="2">
  <if_sid>67028</if_sid>
  <field name="win.eventdata.privilegeList" type="pcre2">SeDebugPrivilege|SeImpersonatePrivilege|SeTcbPrivilege|SeTakeOwnershipPrivilege</field>
  <field name="win.eventdata.subjectUserName" type="pcre2" negate="yes">^SYSTEM$|^LOCAL SERVICE$|^NETWORK SERVICE$|\$$</field>
  <description>user=$(win.eventdata.subjectUserName) domain=$(win.eventdata.subjectDomainName) host=$(win.system.computer) logonId=$(win.eventdata.subjectLogonId) - ALERT: Sensitive privileges assigned to human account logon</description>
  <mitre>
    <id>T1134</id>
  </mitre>
</rule>
```

---

### Rule 100615 — Remote Human Logon from Non-Lab IP
Monitors Windows Security Event ID 4624 to detect user logins arriving from outside the known local management IP range (`.10` DC, `.20` Win10).

```xml
<rule id="100615" level="5" ignore="2">
  <if_sid>92651</if_sid>
  <field name="win.system.eventID">^4624$</field>
  <field name="win.eventdata.targetUserName" type="pcre2" negate="yes">(?i)\$$|^ANONYMOUS LOGON$|^SYSTEM$|^LOCAL SERVICE$|^NETWORK SERVICE$</field>
  <field name="win.eventdata.ipAddress" type="pcre2" negate="yes">^192\.168\.56\.(10|20)$</field>
  <description>Remote logon by user account - user=$(win.eventdata.targetUserName) domain=$(win.eventdata.targetDomainName) logonType=$(win.eventdata.logonType) src_ip=$(win.eventdata.ipAddress) authpkg=$(win.eventdata.authenticationPackageName) host=$(win.system.computer)</description>
  <mitre>
    <id>T1078</id>
  </mitre>
</rule>
```

---

### Rules 100100–100104 — Registry Persistence & Service Hijack
Monitors Sysmon Event ID 13 (Registry Value Set) for attacker persistence across reboots:

```xml
<group name="sysmon,registry_persistence,">
  <rule id="100100" level="12">
    <if_group>sysmon_eid13_detections</if_group>
    <field name="win.eventdata.targetObject" type="pcre2">(?i)\\Microsoft\\Windows\\CurrentVersion\\(Run|RunOnce|RunOnceEx|RunServices|RunServicesOnce)\\</field>
    <description>Persistence: Run/RunOnce registry key modified - $(win.eventdata.details)</description>
    <mitre><id>T1547.001</id></mitre>
  </rule>

  <rule id="100101" level="12">
    <if_group>sysmon_eid13_detections</if_group>
    <field name="win.eventdata.targetObject" type="pcre2">(?i)\\Winlogon\\(Shell|Userinit)</field>
    <description>Persistence: Winlogon Shell/Userinit modified - $(win.eventdata.details)</description>
    <mitre><id>T1547.004</id></mitre>
  </rule>

  <rule id="100102" level="12">
    <if_group>sysmon_eid13_detections</if_group>
    <field name="win.eventdata.targetObject" type="pcre2">(?i)\\Image File Execution Options\\.*\\Debugger</field>
    <description>Persistence: IFEO Debugger hijack - $(win.eventdata.details)</description>
    <mitre><id>T1546.012</id></mitre>
  </rule>

  <rule id="100104" level="10">
    <if_group>sysmon_eid13_detections</if_group>
    <field name="win.eventdata.targetObject" type="pcre2">(?i)\\Services\\.*\\Parameters\\ServiceDll</field>
    <description>Persistence: Service DLL hijack (svchost service) - $(win.eventdata.details)</description>
    <mitre><id>T1543.003</id></mitre>
  </rule>
</group>
```

---

### Linux Host & Web Exploit Rules

| Rule ID | Level | Group | Description / Match Condition | MITRE |
|---|---|---|---|---|
| `100199` | 10 | `local,audit_process` | Auditd syscall 59: execution of `whoami`, `id`, `nc`, `ncat`, `netcat`, `sudo -l`, or `bash -i` | T1059.004 |
| `100217` | 12 | `local,audit_file_access` | Auditd key `identity`: access to sensitive identity configurations | T1003.008 |
| `100218` | 12 | `local,audit_credential_read` | Auditd key `cat_sensitive_file`: `cat` invoked on `/etc/passwd`, `/etc/shadow`, `/etc/group` | T1003.008 |
| `100220` | 5 | `local,bash_command_log` | Decodes `/var/log/bashcmd.log`: user commands executed via root or www-data | T1059.004 |
| `100201` | 7 | `dvwa,web,accesslog` | SQL Injection signatures in HTTP URI (`UNION`, `SELECT`, `information_schema`, etc.) | T1190 |
| `100202` | 7 | `dvwa,web,accesslog` | XSS payloads in URI (`<script>`, `javascript:`, `onerror=`) | T1059.007 |
| `100203` | 7 | `dvwa,web,accesslog` | LFI / Path Traversal (`../`, `etc/passwd`, `boot.ini`) | T1055 |
| `100204` | 7 | `dvwa,web,accesslog` | Command injection (`cat`, `whoami`, `nc`, `&& id`) | T1059.004 |
| `100207` | 10 | `dvwa,web,accesslog` | Brute-force threshold: repeated `login.php` accesses (6 in 15s) | T1110 |
| `100213` | 10 | `dvwa,web,accesslog` | High rate of 4xx errors from same source (30+ in 15s) | T1595.002 |
| `100214` | 12 | `dvwa,web,accesslog` | High rate of 5xx errors from same source (15+ in 15s) | T1499 |

---

## 2. Noise Suppression & Tuning Architecture

Standard Wazuh and Windows baseline environments generate thousands of benign operational events. Rather than filtering alerts downstream in TheHive, noise is suppressed at the Wazuh analysis engine level (`level="0"`):

- **Machine & Service Accounts:** Suppresses machine account (`WIN10$`, `PC-DC$`) routine self-logons (`100610`, `100611`), type 3/5 service authentications (`100287`, `100288`), and logoffs (`100291`, `100307`).
- **PowerShell Diagnostics:** Suppresses internal `PSScriptPolicyTest` AppLocker probe drops (`100286`, `100170`, `100171`), prompt rendering (`100276`), and CIM alias autoload blocks (`100328`).
- **Hypervisor Artifacts:** Filters VMware Tools background scripts (`suspend-vm-default.bat`, `resume-vm-default.bat`) and parent processes (`100167`, `100169`, `100350`, `100351`, `100372`, `100373`).
- **Wazuh Self-Noise:** Whitelists Wazuh Agent's own SCA assessment commands (`100318`, `100319`, `100381`) and FIM database checks (`100160`).
- **Suricata Internal Anomaly Noise:** Silences high-volume non-actionable signature IDs originating from DC interfaces (`100250`, `100252`).

---

## 3. TheHive Severity Overrides

To ensure security incidents reach TheHive with appropriate priority, key built-in rules were overridden with elevated severity levels:

```xml
<!-- sshd authentication success elevated to level 8 for TheHive forwarding -->
<rule id="5715" level="8" overwrite="yes">
  <if_sid>5700</if_sid>
  <match>^Accepted|authenticated.$</match>
  <description>sshd: authentication success.</description>
  <mitre><id>T1078</id><id>T1021</id></mitre>
</rule>

<!-- sshd authentication failure elevated to level 8 -->
<rule id="5716" level="8" overwrite="yes">
  <if_sid>5700</if_sid>
  <match>^Failed|^error: PAM: Authentication</match>
  <description>sshd: authentication failed.</description>
  <mitre><id>T1110</id></mitre>
</rule>

<!-- Windows Logon Failure elevated to level 8 -->
<rule id="60105" level="8" overwrite="yes">
  <if_sid>60104</if_sid>
  <field name="win.system.eventID">^529$|^530$|^531$|^532$|^533$|^534$|^535$|^536$|^537$|^539$|^4625$</field>
  <description>Windows Logon Failure</description>
  <mitre><id>T1078</id></mitre>
</rule>
```
