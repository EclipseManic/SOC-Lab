# Wazuh Detection Engineering — Rules, Decoders & Tuning

> **Production Configuration & Artifacts:**
> - Complete XML Ruleset: [`local_rules.xml`](local_rules.xml)
> - Custom Log Decoders: [`local_decoder.xml`](local_decoder.xml)
> - Wazuh Manager Config: [`ossec.conf`](../../06-Resources/Configs/ossec.conf)
> - Ingestion Hook: [`custom-thehive`](../../06-Resources/Scripts/custom-thehive)
> - Correlation Engine: [`custom-thehive.py`](../../06-Resources/Scripts/custom-thehive.py)
> - Flush Daemon: [`thehive-flush.service`](../../06-Resources/Scripts/thehive-flush.service)
> - Tool Fingerprints: [`tool_fingerprints.json`](../../06-Resources/Scripts/tool_fingerprints.json)

---

## 1. Overview & Architecture

Wazuh functions as the centralized SIEM and correlation engine in the SOC lab. It ingests multi-source telemetry from enrolled agents (`Suricata Gateway`, `DVWA`, `Win10User`, and `DomainWin10`), normalizes raw logs using custom and built-in decoders, and evaluates events against `local_rules.xml`.

Alerts matching level $\ge 8$ (or designated high-priority SIDs) are passed via Wazuh's integration mechanism to [`custom-thehive`](../../06-Resources/Scripts/custom-thehive), which persists them in an SQLite WAL queue before asynchronous correlation and dispatch to TheHive 5.

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
Fires on Windows Security Event ID 4672 when high-risk privileges (`SeDebugPrivilege`, `SeImpersonatePrivilege`, `SeTcbPrivilege`, `SeTakeOwnershipPrivilege`) are granted to a non-machine, human logon session. Elevated to Level 8 so it passes Wazuh's integration filter to TheHive.

```xml
<rule id="100603" level="8" ignore="2">
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

### Rule 100601 & 100602 — Machine Account Anomaly Detections
Detects lateral movement and privilege abuse involving domain machine accounts (`WIN10$`, `PC-DC$`):
- **Rule 100601 (Level 10):** Fires when a machine or service account logs on from a non-local or non-DC IP address.
- **Rule 100602 (Level 12):** Fires when a machine account logs on with an interactive or remote desktop session type (LogonType 2, 7, 9, 10).

```xml
<rule id="100601" level="10">
  <if_sid>60106</if_sid>
  <field name="win.eventdata.targetUserName" type="pcre2">\$(@|$)|^SYSTEM$|^LOCAL SERVICE$|^NETWORK SERVICE$</field>
  <field name="win.eventdata.ipAddress" type="pcre2">(?i)^(?!::1$|127\.0\.0\.1$|fe80:|192\.168\.56\.10$).+</field>
  <description>user=$(win.eventdata.targetUserName) src_ip=$(win.eventdata.ipAddress) authpkg=$(win.eventdata.authenticationPackageName) - ANOMALOUS: machine/service account logon from non-local source</description>
</rule>

<rule id="100602" level="12">
  <if_sid>60106</if_sid>
  <field name="win.eventdata.targetUserName" type="pcre2">\$$</field>
  <field name="win.eventdata.logonType" type="pcre2">^(2|7|9|10)$</field>
  <description>user=$(win.eventdata.targetUserName) src_ip=$(win.eventdata.ipAddress) logonType=$(win.eventdata.logonType) - ANOMALOUS: machine account logon with interactive/RDP/NewCredentials type</description>
</rule>
```

---

### Rule 100410, 100213, 100214 — Scan & Web Burst Rules
- **Rule 100410 (Level 8):** Aggregates Suricata HTTP 4xx client error events into an incident alert when 10 or more errors occur from the same source IP within a 15-second window (`frequency="10" timeframe="15"`).
- **Rule 100213 (Level 10):** Flags Apache access log bursts of 30+ 4xx errors within 15 seconds (`frequency="30" timeframe="15"`).
- **Rule 100214 (Level 12):** Flags Apache access log bursts of 15+ 5xx server errors within 15 seconds (`frequency="15" timeframe="15"`).

```xml
<rule id="100410" level="8" frequency="10" timeframe="15" ignore="15">
  <if_matched_sid>100400</if_matched_sid>
  <field name="src_ip">\.+</field>
  <description>Suricata: High-volume HTTP 4xx burst from $(src_ip) - possible scan/enumeration (10+ in 15s)</description>
</rule>
```

---

### Rules 100100–100104 — Registry Persistence & Service Hijack
Monitors Sysmon Event ID 13 (Registry Value Set) for adversary persistence across reboots:

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

  <rule id="100103" level="10">
    <if_group>sysmon_eid13_detections</if_group>
    <field name="win.eventdata.targetObject" type="pcre2">(?i)\\Explorer\\(Shell Folders|User Shell Folders)</field>
    <description>Persistence: Shell Folders registry modified - $(win.eventdata.details)</description>
    <mitre><id>T1547.001</id></mitre>
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

### Rules 100199, 100217, 100218 — Linux Host & Auditd Integrity Rules
Monitors Linux Auditd kernel syscalls (`execve`) and sensitive file watches on DVWA:

```xml
<!-- Custom Rule 100199: High-risk command invocation under auditd -->
<rule id="100199" level="10">
  <if_sid>80700</if_sid>
  <field name="audit.syscall">59</field>
  <match type="pcre2">comm="(whoami|id|nc|ncat|netcat)"|a0="sudo"[\s\S]*?a1="-l"|a0="bash"[\s\S]*?a1="-i"</match>
  <description>Auditd: blacklisted/suspicious command executed - $(audit.exe)</description>
  <group>blacklist_command,</group>
</rule>

<!-- Custom Rules 100217 & 100218: Sensitive identity file access -->
<rule id="100217" level="12">
  <if_sid>80700</if_sid>
  <decoded_as>auditd</decoded_as>
  <field name="audit.key">identity</field>
  <description>Auditd: sensitive file accessed - $(audit.file.name) by uid=$(audit.uid)</description>
</rule>

<rule id="100218" level="12">
  <if_sid>80700</if_sid>
  <decoded_as>auditd</decoded_as>
  <field name="audit.key">cat_sensitive_file</field>
  <description>Auditd: cat used on sensitive file - $(audit.file.name) by uid=$(audit.uid) auid=$(audit.auid)</description>
</rule>
```

---

### Rule 100300 — Masquerading & Parent-Process Integrity
Detects defense evasion where malware mimics Windows system tasks:
- **Rule 100299 (Level 0):** Suppresses legitimate `rundll32.exe` SysMain tasks when spawned by `svchost.exe` under `SYSTEM`.
- **Rule 100300 (Level 12):** Triggers a critical alert if `rundll32.exe` invokes a SysMain task parameter but the parent process is **not** `svchost.exe`, exposing process masquerading.

---

### DVWA Web Application Rule Family (100200–100214)
Processes Apache access logs decoded by custom web parsers:
- **Rule 100200 (Level 3):** Baseline decoder match for web requests.
- **Rules 100201–100205 (Level 7):** Signature matching for SQLi, XSS, LFI, Command Injection, and Open Redirect syntax.
- **Rule 100206 (Level 5):** Login page access tracking.
- **Rule 100207 (Level 10):** Web brute-force authentication thresholding.
- **Rule 100208 (Level 5):** File upload endpoint access tracking (Stage 05 webshell staging).
- **Rule 100213 (Level 10):** 30+ 4xx errors in 15 seconds (fuzzing/enumeration).
- **Rule 100214 (Level 12):** 15+ 5xx server errors in 15 seconds (application exploit attempts).

---

## 3. Decoders Catalog (`local_decoder.xml`)

### Custom Shell Decoder: `bashcmd`
Standard Linux PAM and audit logs do not always provide human-readable command-line arguments in real time without heavy overhead. On the DVWA pivot host, a bash shell hook appends executed commands to `/var/log/bashcmd.log` using colon delimiters: `uid:<uid> user:<user> pwd:<dir> cmd:<command>`.

```xml
<decoder name="bashcmd">
  <program_name>^bashcmd$</program_name>
</decoder>

<decoder name="bashcmd-fields">
  <parent>bashcmd</parent>
  <use_own_name>yes</use_own_name>
  <prematch>uid:\d+ user:</prematch>
  <regex type="pcre2">uid:(\d+) user:(\S+) pwd:(\S+) cmd:(.+)$</regex>
  <order>uid, user, pwd, command</order>
</decoder>
```

**Log Format Examples:**
```text
uid:33 user:www-data pwd:/var/www/html/hackable/uploads cmd:python3 -c 'import pty;pty.spawn("/bin/bash")'
uid:0 user:root pwd:/root cmd:chmod +s /tmp/bash
uid:0 user:root pwd:/root/.ssh cmd:echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...' >> authorized_keys
```

**Extracted Dynamic Fields:**
| Dynamic Field | Extraction Regex | Sample Value | Role in Rules |
|---|---|---|---|
| `uid` | `uid:(\d+)` | `0` (root), `33` (www-data) | Identifies root vs service accounts |
| `user` | `user:(\S+)` | `www-data` | Scopes alerts to compromised accounts |
| `pwd` | `pwd:(\S+)` | `/var/www/html` | Identifies execution inside webroot |
| `command` | `cmd:(.+)$` | `cat /etc/shadow` | Malicious command pattern matching |

---

## 4. The 87 Suppressions & Noise Reduction Architecture

Of the 133 rules in `local_rules.xml`, **87 are Level 0 suppressions**. Rather than letting high-volume benign OS events flood the SIEM and exhaust analyst attention, noise is silenced at the earliest evaluation stage. Each suppression rule is safe by design:

1. **Machine Account Logons (32 rules):** Silences routine background authentications from domain machine accounts (`WIN10$`, `PC-DC$`), Type 3/5 service authentications, and routine Kerberos TGS renewals for local computer services (`100610`, `100611`, `100287`, `100288`).
   - *Why it is safe:* Suppressions require the username to terminate in `$` (domain computer accounts) and originate from local or DC addresses. Non-machine accounts and machine accounts logging on from anomalous or non-local IP addresses remain fully alertable via Rules `100601`, `100602`, and `100603`.
2. **PowerShell Diagnostic Checks (14 rules):** Suppresses internal Windows AppLocker `PSScriptPolicyTest` probe executions (`100286`), prompt rendering events (`100276`), and split inline fragments (`100295`).
   - *Why it is safe:* Windows PowerShell automatically drops transient `__PSScriptPolicyTest_*.ps1` files to test execution policy on startup; suppressing this specific filename eliminates thousands of false positives while leaving genuine user ScriptBlock executions (EID 4104 / Rule `100271`) completely untouched.
3. **Hypervisor & VM Noise (12 rules):** Filters out background VMware Tools execution scripts (`suspend-vm-default.bat`, `resume-vm-default.bat`, `vgauthservice.exe`) and virtual disk retrim warnings (`100244`).
4. **Wazuh Agent Self-Noise (18 rules):** Whitelists the Wazuh Agent's own SCA compliance queries and internal inventory file reads (`100216`, `100280`).
5. **Background OS Services & Utilities (11 rules):** Suppresses routine Disk Cleanup (`cleanmgr.exe`, `100230`), BITS Windows Update re-registrations (`100243`), and legitimate `rundll32.exe` SysMain tasks launched by `svchost.exe` under `SYSTEM` (`100299`).
   - *Defense-in-depth guarantee:* If `rundll32.exe` executes a SysMain task but its parent process is **not** `svchost.exe`, Rule `100300` fires at Level 12 for process masquerading.

---

## 5. Severity Overrides for TheHive

Wazuh's integration daemon evaluates `<level>8</level>` in `ossec.conf` before passing alerts to `custom-thehive`. To bridge network IDS alerts and critical authentication events into TheHive without manual polling, key built-in rules were explicitly overridden with elevated severity in `local_rules.xml`:

### The Critical Bridge: Rule 86601 Override (Level 8)
In Wazuh's default ruleset (`0025-suricata_rules.xml`), Rule `86601` (`Suricata: Alert - $(alert.signature)`) evaluates at **Level 3**. Because `custom-thehive` only forwards events with level $\ge 8$, default Wazuh configurations will drop all Suricata network alerts at the integration boundary. Overwriting Rule `86601` to Level 8 is the essential engineering bridge enabling Suricata alerts to cross into TheHive 5:

```xml
<!-- Suricata NIDS alerts elevated from default Level 3 to Level 8 for TheHive forwarding -->
<rule id="86601" level="8" overwrite="yes">
  <if_sid>86600</if_sid>
  <field name="event_type">^alert$</field>
  <description>Suricata: Alert - $(alert.signature)</description>
</rule>
```

### Authentication & Privilege Overrides
```xml
<!-- sshd authentication success elevated from Level 3 to Level 8 -->
<rule id="5715" level="8" overwrite="yes">
  <if_sid>5700</if_sid>
  <match>^Accepted|authenticated.$</match>
  <description>sshd: authentication success.</description>
  <mitre><id>T1078</id><id>T1021</id></mitre>
</rule>

<!-- sshd authentication failed elevated from Level 5 to Level 8 -->
<rule id="5716" level="8" overwrite="yes">
  <if_sid>5700</if_sid>
  <match>^Failed|^failure</match>
  <description>sshd: authentication failed.</description>
  <mitre><id>T1110.001</id></mitre>
</rule>

<!-- Windows Logon Failure (Event ID 4625/529) elevated from Level 5 to Level 8 -->
<rule id="60105" level="8" overwrite="yes">
  <if_sid>60104</if_sid>
  <field name="win.system.eventID">^529$|^530$|^531$|^532$|^533$|^534$|^535$|^536$|^537$|^539$|^4625$</field>
  <description>Windows Logon Failure</description>
  <mitre><id>T1078</id></mitre>
</rule>

<rule id="60122" level="8" overwrite="yes">
  <if_sid>60105</if_sid>
  <field name="win.system.eventID">^529$|^4625$</field>
  <description>Logon Failure - Unknown user or bad password</description>
  <mitre><id>T1531</id></mitre>
</rule>
```

---

---

## 6. Alert Exports & Telemetry Datasets

The repository provides two empirical alert export datasets in [`06-Resources/Alerts/`](../../06-Resources/Alerts/):

| Dataset File | Records | Scope & Content |
|---|---|---|
| [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv) | **9,567 rows** | Complete raw alert export across all agents (`DVWA`: 8,114, `Suricata`: 1,168, `DomainWin10`: 168, `Win10User`: 117). Contains raw rule descriptions, agent names, and JSON-encoded event objects in `full_log`. |
| [`wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv) | **808 rows** | Filtered incident dataset capturing elevated alerts and triage events. |
| [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json) | **46 alerts** | Actionable incident alerts created in TheHive 5 after correlation and aggregation by `thecustomhive`. |

### CSV Structure
Both CSV exports contain three core columns:
- `rule.description`: The Wazuh rule description string.
- `agent.name`: The reporting agent (`DVWA`, `Suricata`, `DomainWin10` for DC, `Win10User` for Windows 10 workstation).
- `full_log`: The raw underlying event payload, including Suricata EVE-JSON (with `signature_id`, flow IPs/ports), Windows EventChannel XML/JSON (with `eventID`, `targetUserName`, `logonType`), and Linux Auditd messages (with syscall, binary path, and `key`).

## 7. Verification Commands

```bash
# Verify rule and decoder syntax on Wazuh Manager
/var/ossec/bin/wazuh-analysisd -t

# Test bashcmd decoder interactively
/var/ossec/bin/wazuh-logtest
# Input:
# bashcmd uid:0 user:root pwd:/root cmd:python3 /opt/impacket/examples/secretsdump.py ad.lab/administrator@192.168.56.10

# Tail alerts forwarded to local alerts.json
tail -f /var/ossec/logs/alerts/alerts.json | jq '{timestamp, rule: .rule.id, description: .rule.description, agent: .agent.name}'
```
