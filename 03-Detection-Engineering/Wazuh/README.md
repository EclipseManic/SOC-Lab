# Wazuh Detection Engineering — Rules, Decoders & Tuning

> **Production Configuration & Artifacts:**
> - Complete XML Ruleset: [`local_rules.xml`](local_rules.xml)
> - Custom Log Decoders: [`local_decoder.xml`](local_decoder.xml)
> - Wazuh Manager Config: [`ossec.conf`](../../06-Resources/Configs/ossec.conf)
> - Ingestion Hook: [`custom-thehive`](../../06-Resources/Scripts/custom-thehive)
> - Correlation Engine: [`custom-thehive.py`](../../06-Resources/Scripts/custom-thehive.py)
> - Flush Daemon: [`thehive-flush.service`](../../06-Resources/Scripts/thehive-flush.service)

---

## 1. Overview & Architecture

Wazuh functions as the centralized SIEM and correlation engine in the SOC lab. It ingests multi-source telemetry from enrolled agents (`Suricata Gateway`, `DVWA`, `Win10User`, and `DomainWin10`), normalizes raw logs using custom and built-in decoders, and evaluates events against `local_rules.xml`.

Alerts matching level $\ge 8$ (or designated high-priority SIDs) are queued into SQLite and dispatched to TheHive 5 via [`custom-thehive.py`](../../06-Resources/Scripts/custom-thehive.py).

```text
Log Sources (Auditd, Bash, Sysmon, EventLog, Suricata)
                         │
                         ▼
             Wazuh Decoders (local_decoder.xml)
                         │
                         ▼
        Wazuh Rules Engine (local_rules.xml)
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      Rule Level < 8          Rule Level >= 8
    (Indexed in Dashboard)   (custom-thehive Ingest)
                                     │
                                     ▼
                             TheHive 5 Alerts
```

---

## 2. Key Custom Detection Rules

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
*Validated in Stages 17, 18, and 20.*

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
*Validated in Stages 15 and 16.*

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
*Validated in Stage 20.*

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

## 3. Decoders Catalog (`local_decoder.xml`)

### Custom Shell Decoder: `bashcmd`
Standard Linux PAM and audit logs do not always provide human-readable command-line arguments in real time without heavy overhead. To achieve precise command visibility on the DVWA pivot host, a bash shell hook appends every executed command to `/var/log/bashcmd.log`.

```xml
<decoder name="bashcmd">
  <prematch>^bashcmd </prematch>
</decoder>

<decoder name="bashcmd-fields">
  <parent>bashcmd</parent>
  <regex>uid=(\d+)\s+user=(\S+)\s+pwd=(\S+)\s+command=(.+)$</regex>
  <order>uid, user, pwd, command</order>
</decoder>
```

**Log Format Examples:**
```text
bashcmd uid=33 user=www-data pwd=/var/www/html/vulnerabilities/upload command=python3 -c 'import pty;pty.spawn("/bin/bash")'
bashcmd uid=0 user=root pwd=/root command=chmod +s /tmp/bash
bashcmd uid=0 user=root pwd=/root/.ssh command=echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...' >> authorized_keys
```

**Extracted Dynamic Fields:**
| Regex Token | Dynamic Field Name | Sample Value | Usage in Rules |
|---|---|---|---|
| `(\d+)` | `uid` | `0` (root), `33` (www-data) | Distinguish privileged execution |
| `(\S+)` | `user` | `www-data`, `root` | Scope detection to compromised accounts |
| `(\S+)` | `pwd` | `/var/www/html` | Execution directory context |
| `(.+)` | `command` | `cat /etc/shadow` | Malicious command pattern matching |

### Built-in Decoders Used
| Decoder | Log Source | Format | Extracted Fields |
|---|---|---|---|
| `json` | Suricata `eve-alert.json` | JSON | `timestamp`, `src_ip`, `dest_ip`, `alert.signature`, `alert.signature_id`, `http.url` |
| `sshd` | Linux `/var/log/auth.log` | Syslog | `srcip`, `dstuser`, `logon_status`, `port` |
| `apache-access` | Apache `/var/log/apache2/access.log` | Combined | `srcip`, `url`, `id` (HTTP status code), `protocol` |
| `windows-eventlog` | Windows Security (`Security.evtx`) | Eventchannel | `win.system.eventID`, `win.eventdata.targetUserName`, `win.eventdata.ipAddress` |
| `sysmon` | Windows Sysmon | Eventchannel | `win.eventdata.image`, `win.eventdata.commandLine`, `win.eventdata.parentImage` |

---

## 4. Tuning, False Positives & Noise Suppression

### Tuning Log & Decisions
| Phase | Rule ID | Alert Description | Root Cause | Tuning Action | Outcome |
|---|---|---|---|---|---|
| Recon | `86601` | Suricata: Alert burst | Nmap scans generated >3,000 raw packet alerts | Created threshold rule `100410` (Level 8, 100 alerts/60s) | Replaced 3,000 alerts with 1 scan incident |
| Initial Access | `31168` | Shellshock attack detected | Nikto injected `() { :;};` in User-Agent | Kept active; tagged as `scanner-artifact` | Genuine detection of web probing |
| Pivot Access | `5715` | SSH auth success (root) | Admin sessions from `192.168.232.135` | Enriched alert title with source IP aggregation | Grouped admin logins; anomalous bursts flag |
| AD Setup | `60103` / `100603` | Sensitive privilege assignment | Routine DC machine account services | Suppressed DC machine account self-logons (`PC-DC$`) | Eliminated baseline noise while retaining user alerts |
| Domain Persistence | `61603` | Sysmon Process Creation | Routine Windows tasks (`conhost.exe`) | Configured Sysmon modular excludes | Reduced volume by 68% without filtering `cmd.exe` |

### Noise Suppressions in `local_rules.xml`
```xml
<!-- Suppress benign Windows Defender status changes (Defender intentionally disabled in lab) -->
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

### TheHive Severity Overrides
To ensure actionable security events trigger the Level 8 ingestion threshold for TheHive, key built-in rules were explicitly overridden:
```xml
<!-- Elevate SSH authentication success to level 8 -->
<rule id="5715" level="8" overwrite="yes">
  <if_sid>5700</if_sid>
  <match>^Accepted|authenticated.$</match>
  <description>sshd: authentication success.</description>
  <mitre><id>T1078</id><id>T1021</id></mitre>
</rule>

<!-- Elevate Windows Logon Failure to level 8 -->
<rule id="60105" level="8" overwrite="yes">
  <if_sid>60104</if_sid>
  <field name="win.system.eventID">^529$|^530$|^531$|^532$|^533$|^534$|^535$|^536$|^537$|^539$|^4625$</field>
  <description>Windows Logon Failure</description>
  <mitre><id>T1078</id></mitre>
</rule>
```

---

## 5. Verification Commands

```bash
# Verify rule and decoder syntax on Wazuh Manager
/var/ossec/bin/wazuh-analysisd -t

# Test bashcmd decoder interactively
/var/ossec/bin/wazuh-logtest
# Input: bashcmd uid=0 user=root pwd=/root command=python3 secretsdump.py

# Tail live alerts forwarded by local rules
tail -f /var/ossec/logs/alerts/alerts.json | grep -E "100613|100603|100201|5715"
```
