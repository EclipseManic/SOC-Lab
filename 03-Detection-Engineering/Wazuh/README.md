# Wazuh Detection Engineering — Rules, Decoders & Tuning

> **Production Configuration & Artifacts:**
> - Complete XML Ruleset: [`local_rules.xml`](../../06-Resources/rules/wazuh/local_rules.xml)
> - Custom Log Decoders: [`local_decoder.xml`](../../06-Resources/rules/wazuh/local_decoder.xml)
> - Wazuh Manager Config: [`ossec.conf`](../../06-Resources/configs/ossec.conf)
> - Ingestion Hook: [`custom-thehive`](../../06-Resources/scripts/custom-thehive)
> - Correlation Engine: [`custom-thehive.py`](../../06-Resources/scripts/custom-thehive.py)
> - Flush Daemon: [`thehive-flush.service`](../../06-Resources/scripts/thehive-flush.service)
> - Tool Fingerprints: [`tool_fingerprints.json`](../../06-Resources/scripts/tool_fingerprints.json)

---

## 1. Overview & Architecture

Wazuh functions as the centralized SIEM and correlation engine in the SOC lab. It ingests multi-source telemetry from enrolled agents (`Suricata Gateway`, `DVWA`, `Win10User`, and `DomainWin10`), normalizes raw logs using custom and built-in decoders, and evaluates events against `local_rules.xml`.

Alerts matching level $\ge 8$ (or designated high-priority SIDs) are passed via Wazuh's integration mechanism to [`custom-thehive`](../../06-Resources/scripts/custom-thehive), which persists them in an SQLite WAL queue before asynchronous correlation and dispatch to TheHive 5.

> [!NOTE]
> ### ⏱️ Pipeline Latency Dynamics: TheHive Fast-Path vs. OpenSearch Indexing & Prompt Flushing
> When evaluating log arrival timestamps across the detection pipeline, analysts should note three operational architectural nuances:
> 1. **SOAR Fast-Path Delivery:** `wazuh-integratord` reads directly from `analysisd` in memory the moment a rule matches. Level $\ge 8$ alerts reach `custom-thehive` and are posted to TheHive 5 within **< 0.2 ms**. In contrast, the Wazuh Dashboard displays events only after Filebeat ships `alerts.json`, OpenSearch indexes the batch, and the web UI executes its search query—introducing a **1–3 second visual latency**. As a result, TheHive alert cards naturally record timestamps slightly earlier than indexed dashboard views.
> 2. **Bash Telemetry Flushing (`PROMPT_COMMAND`):** On Linux hosts (`DVWA`), command-line telemetry is captured via Bash's `PROMPT_COMMAND` hook, which executes and flushes to disk only **after** a command exits or interrupts (`Ctrl+C`). Long-running commands (such as `Responder.py` or interactive sessions) trigger Suricata network alerts and Windows target logs immediately upon network/RPC interaction, while the attacker's `bashcmd` entry is committed to disk only when returning to the terminal prompt.
> 3. **Interactive Simulation Multi-Attempts:** During live red-team adversary simulation, human operators often perform syntax trial-and-error (e.g. quote escaping, port testing). TheHive captures the first trigger within its 5-second correlation window, while analysts may capture Wazuh dashboard screenshots of subsequent successful executions.

### Ruleset Composition in `local_rules.xml`
The production ruleset contains **148 total `<rule id>` definitions**:
- **133 Custom Laboratory Rules (`id >= 100000`):** Behavioral detections, process fan-outs, Impacket tracking, and custom web shell decoders.
- **15 Core Rule Overwrites (`id < 100000`, `overwrite="yes"`):** Elevation of critical core rules (e.g., elevating Suricata Rule `86601` to Level 8 for TheHive forwarding; PAM authentication elevation).
- **87 Noise Suppression Rules (`level="0"`):** Zero-overhead filtering dropping background hypervisor, OS service, and machine account polling.

[![Wazuh Log Ingestion & Rules Engine Flow](../../06-Resources/diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)](../../06-Resources/diagrams/Wazuh%20Log%20Ingestion%20to%20TheHive%20Flow.png)

---

## 2. Key Custom Detection Rules

### Rule 100220 — Host Shell Execution & Interactive Command Auditing (`bashcmd`)
Captures verbatim interactive command executions on the DVWA web server (`192.168.56.30`). This custom detection pipeline provides the primary ground-truth host forensics for all post-exploitation activities conducted from the Linux pivot.

#### 🛡️ The Web Server Anomaly Principle
Production web application servers are static, headless execution environments running Apache, PHP, and database engines. Under normal operations, service accounts (`www-data`) never spawn interactive shells, and system administrators do not execute ad-hoc commands on production web servers without scheduled change windows. Therefore, **any interactive Bash command executed on the web server—whether under `www-data` following web shell exploitation or escalated to `root`—is an inherent, high-fidelity security anomaly indicating active human adversary presence.**

#### ⚙️ Pipeline Architecture: From Shell Hook to Wazuh SIEM
Standard Linux Auditd monitors `execve` system calls, but can miss shell built-ins (`export`, `cd`, `echo ... >> file`) and multi-command pipe chains without generating prohibitive log volume. The custom `bashcmd` pipeline captures every interactive command with complete execution context:

1. **Global Shell Hook:** `/etc/bash.bashrc` and `/etc/profile` inject a global `PROMPT_COMMAND` hook that fires upon completion of every terminal command:
   ```bash
   export PROMPT_COMMAND='logger -p local0.notice -t bashcmd "uid:$(id -u) user:$(id -un) pwd:$(pwd) cmd:$(history 1 | sed "s/^[ ]*[0-9]*[ ]*//")"'
   ```
2. **Dedicated Syslog Channel:** `/etc/rsyslog.d/50-bashcmd.conf` filters `local0.notice` tagged `bashcmd` into `/var/log/bashcmd.log`.
3. **Agent Log Collector:** The Wazuh agent collects `/var/log/bashcmd.log` and streams entries to the Wazuh Manager.
4. **Custom Decoder (`local_decoder.xml`):**
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
5. **Detection Rule (`local_rules.xml`):**
   ```xml
   <group name="local,bash_command_log,">
     <rule id="100220" level="5">
       <program_name>^bashcmd$</program_name>
       <description>Bash command by $(dstuser) (uid:$(uid)): $(command)</description>
     </rule>
   </group>
   ```

#### 🔍 Forensic Indexing vs. SOAR Integration Gate (Level 5 vs. Level $\ge 8$)
Wazuh routes alerts with `level >= 8` to `custom-thehive` for automated ticket generation in TheHive 5 to prevent SOAR alert floods. Rule 100220 is intentionally configured at **Level 5**:
- Every single interactive command is decoded, indexed in OpenSearch, and committed to `Wazuh-Raw-Alerts.csv`.
- When high-severity milestone alerts trigger TheHive cases (e.g., Rule 5402 PAM sudo elevation, Rule 550 FIM `authorized_keys` modification, or Rule 5715 root SSH login), SOC analysts query `rule.id: 100220` on agent `DVWA` to retrieve the verbatim, chronological command-line history typed by the adversary.

#### 📊 Empirical Telemetry: Verbatim Commands Captured in `Wazuh-Raw-Alerts.csv`
During the 20-stage attack simulation, Rule 100220 fired **50 times** (CSV data rows 9138 to 9500 / file lines 9139 to 9501), capturing every key offensive tool execution.

> [!NOTE]
> **Forensic Accounting Note on Line Numbers & User Attribution:**  
> - **File Lines vs. Data Rows:** The numbers cited in the table below reference the **raw file line numbers** in `Wazuh-Raw-Alerts.csv`. Because Line 1 contains the CSV column headers, each data row is exactly `File Line - 1` (e.g., File Line 9139 is Data Row 9138).
> - **User `root (33)` Attribution:** For file lines 9139, 9144, and 9148 (`stty sane`, `export TERM=xterm`, `sudo -l`), the log displays `user:root` with `uid:33`. This occurs because the interactive reverse shell executed under Apache service account `www-data` (UID 33) inherited `USER=root` from the system environment/subshell template while `id -u` accurately reported effective UID 33. Following GTFOBins sudo elevation in Stage 07, subsequent commands report `user:root` with `uid:0`.
> - **Pass-the-Hash Execution Timing:** The initial Stage 15 `wmiexec.py` execution occurred at **Data Row 9300 / File Line 9301** (`18:04:49 IST`), followed by secondary invocation testing at `18:06:26 IST` (File Line 9304 records DC-side privilege checks prior to Golden Ticket forgery).

| Raw File Line | Data Row | Timestamp (IST) | User (UID) | Working Dir | Verbatim Command Captured | Associated Attack Stage |
|:---:|:---:|:---:|:---:|:---|:---|:---|
| **9139** | 9138 | `17:25:22` | root (33) | `/var/www/.../uploads` | `stty sane` | Stage 06: Reverse Shell Stabilization |
| **9144** | 9143 | `17:25:28` | root (33) | `/var/www/.../uploads` | `export TERM=xterm` | Stage 06: Shell Environment Setup |
| **9148** | 9147 | `17:25:31` | root (33) | `/var/www/.../uploads` | `sudo -l` | Stage 07: Sudo PrivEsc Enumeration |
| **9155–9158** | 9154–9157 | `17:26:10` | root (0) | `/var/www/.../uploads` | `chmod 700 /root/.ssh && cat .../authorized_keys` | Stage 08: SSH Persistence Preparation |
| **9164** | 9163 | `17:29:19` | root (0) | `/var/www/.../uploads` | `echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5..." >> /root/.ssh/authorized_keys` | Stage 08: Root SSH Key Injection |
| **9170** | 9169 | `17:30:28` | root (0) | `/root` | `hostname && id && ip a` | Stage 09: Pivot Host Discovery |
| **9184** | 9183 | `17:31:19` | root (0) | `/root` | `nmap -sV -O 192.168.56.0/24 --open` | Stage 09: Internal Subnet Discovery Sweep |
| **9215** | 9214 | `17:32:27` | root (0) | `/root` | `nmap -sV -O 192.168.232.0/24 --open` | Stage 09: Perimeter Subnet Sweep |
| **9221** | 9220 | `17:35:41` | root (0) | `/tmp` | `cd /tmp && tar -xzf dvwa_tools.tar.gz` | Stage 10: Responder Tool Unpacking |
| **9222** | 9221 | `17:35:54` | root (0) | `/tmp` | `pip install --break-system-packages /tmp/pkgs/*` | Stage 10: Offensive Dependencies Install |
| **9223** | 9222 | `17:35:55` | root (0) | `/tmp` | `echo "192.168.56.10 PC-DC.ad.lab ad.lab" >> /etc/hosts` | Stage 10: Domain Controller DNS Staging |
| **9226–9232** | 9225–9231 | `17:36:08` | root (0) | `/tmp` | `sudo systemctl stop apache2 && sed ... resolved.conf` | Stage 10: Port 53/80 Conflict Resolution |
| **9233** | 9232 | `17:36:26` | root (0) | `/tmp` | `python3 /opt/Responder/Responder.py -I ens33 -wd` | Stage 10: Responder LLMNR Poisoning Start |
| **9242** | 9241 | `17:37:25` | root (0) | `/tmp` | `python3 /opt/Responder/Responder.py -I ens33 -wd` | Stage 10: Responder Second Invocations |
| **9244** | 9243 | `17:38:29` | root (0) | `/tmp` | `cp /opt/Responder/logs/SMB-NTLMv2-SSP-... /tmp/win10.hash` | Stage 10: NetNTLMv2 Hash Extraction |
| **9259** | 9258 | `18:01:00` | root (0) | `/tmp` | `cd /tmp && python3 -m bloodhound -d ad.lab -u win10 -p 'Secur3Lab!' -dc PC-DC.ad.lab -ns 192.168.56.10 -c All --zip` | Stage 12: BloodHound AD Enumeration |
| **9264** | 9263 | `18:01:18` | root (0) | `/tmp` | `python3 /usr/local/bin/GetUserSPNs.py ad.lab/win10:'Secur3Lab!' -dc-ip 192.168.56.10 -request -outputfile /tmp/hank.hash 2>/dev/null` | Stage 13: Kerberoasting HANK_SHERMAN |
| **9274** | 9273 | `18:02:40` | root (0) | `/tmp` | `python3 /usr/local/bin/secretsdump.py ad.lab/HANK_SHERMAN:'Password123'@192.168.56.10 -outputfile /tmp/dcsync_output` | Stage 14: DCSync NTDS Password Replication |
| **9276** | 9275 | `18:02:49` | root (0) | `/tmp` | `cat /tmp/dcsync_output.ntds` | Stage 14: Dumped Hashes Verification |
| **9286** | 9285 | `18:04:15` | root (0) | `/tmp` | `python3 /usr/local/bin/lookupsid.py ad.lab/HANK_SHERMAN:'Password123'@192.168.56.10 \| grep "Domain SID"` | Stage 16: Domain SID Discovery for Golden Ticket |
| **9301** | 9300 | `18:04:49` | root (0) | `/tmp` | `python3 /usr/local/bin/wmiexec.py -hashes :cc814... Administrator@192.168.56.10` | Stage 15: Pass-the-Hash Lateral Movement |
| **9306** | 9305 | `18:06:40` | root (0) | `/tmp` | `python3 /usr/local/bin/ticketer.py -nthash 611a8... -domain-sid S-1-5-21-3315718683-193253855-3518612541 -domain ad.lab Administrator` | Stage 16: Golden Ticket Forgery (krbtgt KVNO 3) |
| **9307** | 9306 | `18:06:48` | root (0) | `/tmp` | `export KRB5CCNAME=/tmp/Administrator.ccache` | Stage 16: Kerberos Cache Initialization |
| **9373** | 9372 | `18:14:50` | root (0) | `/tmp` | `python3 /usr/local/bin/wmiexec.py -k -no-pass ad.lab/Administrator@PC-DC.ad.lab` | Stage 17: Golden Ticket Lateral WMI to DC |
| **9391** | 9390 | `18:16:34` | root (0) | `/tmp` | `python3 /usr/local/bin/wmiexec.py -hashes :cc814... Administrator@192.168.56.20` | Stage 18: Workstation Lateral WMI Execution |
| **9393** | 9392 | `18:17:09` | root (0) | `/tmp` | `ls /tmp/domain_users.txt /tmp/admin_info.txt /tmp/sensitive_data.txt` | Stage 18: Staged Data Files Verification |
| **9443** | 9442 | `18:21:04` | root (0) | `/tmp` | `python3 /usr/local/bin/wmiexec.py -k -no-pass ad.lab/Administrator@PC-DC.ad.lab` | Stage 20: Golden Ticket DC Impact Execution |
| **9501** | 9500 | `18:24:18` | root (0) | `/tmp` | `python3 /usr/local/bin/wmiexec.py -hashes :cc814... Administrator@192.168.56.20` | Stage 20: Workstation Defacement & Reboot |

---

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
*Validated in Stages 15, 16, 17, 18, and 20.*

---

### Rule 100603 — Sensitive Attack Privileges Assigned to Human Account
Fires on Windows Security Event ID 4672 when high-risk privileges (`SeDebugPrivilege`, `SeImpersonatePrivilege`, `SeTcbPrivilege`, `SeTakeOwnershipPrivilege`) are granted to a non-machine, human logon session. Fired 19 times at Level 3 during baseline simulation capture; elevated to Level 8 in `local_rules.xml` during post-incident tuning so EID 4672 privilege assignments on human accounts cross the SOAR integration threshold.

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

### Rule 100615 — Non-Domain / DMZ Kerberos Remote Logon
Fires on Windows Security Event ID 4624 (LogonType 3 Network Logon) when authentication originates from outside authorized workstation and domain controller subnets. Configured in `local_rules.xml` (Line 960) at `level="5"`. Fired **7 times** (`DomainWin10` 6x, `Win10User` 1x) directly detecting adversary Kerberos authentications originating from the unauthorized Linux DMZ pivot (`192.168.56.30`) during BloodHound AD reconnaissance (Stage 12, Data Rows 9254, 9255) and Golden Ticket lateral movement (Stage 16, Data Rows 9308, 9339, 9358).

```xml
<rule id="100615" level="5">
  <if_sid>60106</if_sid>
  <field name="win.eventdata.logonType">^3$</field>
  <field name="win.eventdata.ipAddress" type="pcre2">^(?!192\.168\.56\.10$|192\.168\.56\.20$|127\.0\.0\.1$|::1$).+</field>
  <description>Remote logon by user account - user=$(win.eventdata.targetUserName) domain=$(win.eventdata.targetDomainName) logonType=$(win.eventdata.logonType) src_ip=$(win.eventdata.ipAddress) authpkg=$(win.eventdata.authenticationPackageName) host=$(win.system.computer)</description>
</rule>
```

---

### Rule 100600 — Suricata HTTP 2xx Attack Elevation
Elevates Suricata NIDS alerts on HTTP 2xx successful responses to `level="8"` for SOAR forwarding (`local_rules.xml` Line 330). Generated **TheHive Alert #11 (`wzb-6a22425401`)** with 22 merged sub-events spanning Stage 02 credential brute forcing, Stage 03 SQL injection (Data Row 9109 / File Line 9110), Stage 05 web shell upload (`shell.php`), and Stage 06 reverse shell trigger.

```xml
<!-- Suricata HTTP 2xx elevated to Level 8 for SOAR alert forwarding -->
<rule id="100600" level="8">
  <if_sid>86601</if_sid>
  <field name="http.status">^2\d\d$</field>
  <description>Suricata: [$(http.status)] [$(src_ip)] [$(http.url)] [$(alert.signature)]</description>
</rule>
```
*Note on variable interpolation:* In two CSV records where non-HTTP or missing-status Suricata events passed through the parent chain, Wazuh rendered the literal string `$(http.status)` rather than a numeric status code.

---

### Rules 100270–100275 — Windows Process Execution & PowerShell ScriptBlock Rules
A family of custom rules in `local_rules.xml` (Lines 85–156) capturing command-line execution (EID 4688 / Sysmon EID 1) and PowerShell ScriptBlock logging (Event ID 4104). These rules fired **130+ times** in `wazuh_alerts.csv`:
- **Rule 100270 (Level 8):** PowerShell suspicious ScriptBlock execution (catching `Invoke-WebRequest`, `DownloadString`, `IEX`, `Compress-Archive`).
- **Rule 100271 (Level 8):** Staging commands (`net user /domain`, `net group "Domain Admins" /domain`).
- **Rule 100272 (Level 8):** Ransom note and extortion file drop indicators (`README_HACKED.txt`).
- **Rule 100275 (Level 5):** Windows process creation baseline with full command-line arguments.

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

<!-- Custom Rules 100217 & 100218: Sensitive identity file access (local_rules.xml Lines 711–737) -->
<rule id="100217" level="12">
  <if_group>audit</if_group>
  <field name="audit.key">identity</field>
  <description>Auditd: sensitive file accessed - $(audit.file.name) by uid=$(audit.uid)</description>
</rule>

<rule id="100218" level="12">
  <if_group>audit</if_group>
  <field name="audit.key">cat_sensitive_file</field>
  <field name="audit.file.name" type="pcre2">^/etc/(passwd|shadow|group|gshadow)$</field>
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
- **Rule 100200 (Level 3):** Baseline decoder match for web requests (fired 58 times on 2xx/3xx HTTP requests).
- **Rules 100201–100205 (Level 7):** Signature matching for SQLi, XSS, LFI, Command Injection, and Open Redirect syntax.
- **Rule 100206 (Level 5):** Login page access tracking.
- **Rule 100207 (Level 10):** Web brute-force authentication thresholding.
- **Rule 100208 (Level 5):** File upload endpoint access tracking (Stage 05 webshell staging).
- **Rule 100213 (Level 10):** 30+ 4xx errors in 15 seconds (fuzzing/enumeration).
- **Rule 100214 (Level 12):** 15+ 5xx server errors in 15 seconds (application exploit attempts).

> [!NOTE]
> **Detection Engineering Precedence Lesson (Rules 100201–100214 vs. Built-in 31100):**  
> In the live campaign, `Rule 100200` fired 58 times on successful requests, but `100201`–`100214` fired 0 times. Why? In `local_rules.xml`, `Rule 100200` was defined with `<decoded_as>web-accesslog</decoded_as>` rather than `<if_sid>31100</if_sid>`. As a result, Wazuh's default web rules (`31100` $\to$ `31101`, `31151`, `31153`, `31154`, `31168`) evaluated first and intercepted 4xx exploit attempts before custom rules could match. The recommended hardening pattern is to bind application-specific rules via `<if_sid>31100,100200</if_sid>` to guarantee rule-tree inheritance.

---

<a id="3-decoders-catalog-local_decoderxml"></a>
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

Across the 148 total rule definitions in `local_rules.xml` (comprising 133 custom rules with ID $\ge$ 100000 and 15 core rule overwrites with ID < 100000), **87 are Level 0 suppressions**. Rather than letting high-volume benign OS events flood the SIEM and exhaust analyst attention, noise is silenced at the earliest evaluation stage. Each suppression rule is safe by design:

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

#### 🛡️ SOAR Severity Mapping & Tag Architecture (`custom-thehive.py`)
While Rule `86601` assigns an arbitrary Wazuh Level 8 wrapper to enable forwarding across the integration threshold, downstream SOAR triage requires granular, signature-aware severity:
1. **Suricata Native Severity Factorization (`severity_from_level`):** Rather than flattening every Suricata alert to Level 8 / Medium (2) in TheHive, `custom-thehive.py` directly parses `data.alert.severity` / `data.signature_severity` from Suricata's EVE-JSON:
   - **Suricata Severity 1 (Major/High):** Mapped to TheHive **High (3)**, or **Critical (4)** if tagged with known CISA-KEV CVEs.
   - **Suricata Severity 2:** Mapped to TheHive **Medium (2)**.
   - **Suricata Severity 3–4 (Info/Low):** Mapped to TheHive **Low (1)**.
2. **Tag Clarification (`occurrences:N` vs Attack Stages):** The alerts in `06-Resources/alerts/thehive_alerts.json` were captured during live simulation execution before code refactoring and therefore carry `stages:N` tags (representing the deduplicated event count within each cluster). To eliminate terminology confusion with the project's **20 sequential attack simulation stages**, the integration daemon (`custom-thehive.py` Lines 1314 & 1556) was refactored post-campaign to emit **`occurrences:N`** (e.g., `occurrences:4`). Attack simulation stages are referenced exclusively by their documented MITRE techniques and case phases.

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

## 6. Alert Exports & Telemetry Datasets

The repository provides two empirical alert export datasets in [`../../06-Resources/alerts/`](../../06-Resources/alerts/):

| Dataset File | Records | Scope & Content |
|---|---|---|
| [`Wazuh-Raw-Alerts.csv`](../../06-Resources/alerts/Wazuh-Raw-Alerts.csv) | **9,567 rows** | Complete baseline raw alert export across all 4 agents (`DVWA`: 8,114, `Suricata`: 1,168, `DomainWin10`: 168, `Win10User`: 117) indexed in OpenSearch following detection rule evaluation. Contains raw rule descriptions, agent names, and JSON-encoded event objects in `full_log`. |
| [`wazuh_alerts.csv`](../../06-Resources/alerts/wazuh_alerts.csv) | **808 rows** | Analyst-curated forensic analysis dataset. Created by applying 11 OpenSearch `must_not` exclusion filters on the Wazuh Dashboard to strip 404 scan floods, SCA scans, and background services, isolating genuine attack steps for triage. |
| [`thehive_alerts.json`](../../06-Resources/alerts/thehive_alerts.json) | **46 alerts** | Actionable incident cases created LIVE during simulation execution directly from the raw stream via the Wazuh Level >= 8 integration gate and the `thecustomhive` two-tier correlation daemon. |

### CSV Structure
Both CSV exports contain three core columns with backslash-escaped dot notation headers as emitted by OpenSearch dashboard exports:
- `rule\.description`: The Wazuh rule description string.
- `agent\.name`: The reporting agent (`DVWA`, `Suricata`, `DomainWin10` for DC, `Win10User` for Windows 10 workstation).
- `full_log`: The raw underlying event payload, including Suricata EVE-JSON (with `signature_id`, flow IPs/ports), Windows EventChannel XML/JSON (with `eventID`, `targetUserName`, `logonType`), and Linux Auditd messages (with syscall, binary path, and `key`).

### 📸 Empirical Visual Proof Galleries
The physical evidentiary captures validating these detection rules are curated in:
- **[TheHive Alert Cards (`06-Resources/screenshots/thehive-alert/`)](../../06-Resources/screenshots/thehive-alert/)**: 60 empirical alert cards generated live by the Wazuh-to-TheHive integration engine.
- **[Wazuh Chronological Telemetry (`06-Resources/screenshots/wazuh-deep-investigation/`)](../../06-Resources/screenshots/wazuh-deep-investigation/)**: 68 verified SIEM and endpoint telemetry captures (`wzb-01` to `wzb-68`) tracing detection alerts across all attack stages.

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

---

## 8. Detection Engineering Observations & Production Tuning Insights

During deep forensic audit of `local_rules.xml` against the 9,567 rows in `Wazuh-Raw-Alerts.csv`, four notable rule behaviors were analyzed:

1. **Rule 100278 Severity (`level="3"` vs. Suppression):**
   - *Behavior:* Rule 100278 is titled `"user=... - Suppress: EID 4688 duplicate (Sysmon EID 1 covers it)"`, but was defined with `level="3"` instead of `level="0"`.
   - *Impact:* Because Level 3 is active alerting, it emitted 45 alerts into `Wazuh-Raw-Alerts.csv` (including `rundll32.exe DavSetCookie` during Stage 10) rather than silently dropping them. In this lab, that operational quirk proved highly valuable—it provided direct victim-side confirmation of WebDAV coercion on `Win10User` (`wzb-28`).
2. **Rule 100180 Auditd Key Matching Substring:**
   - *Behavior:* Rule 100180 checks `<field name="audit.key">process_creation</field>`.
   - *Impact:* Wazuh performs substring matching on the field value, causing it to match `web_process_creation` (20 hits in the CSV), while `audit.rules` Line 27 defines `-k process_execution`. Aligning the key name ensures full fidelity with the hardened kernel ruleset.
3. **Rules 100250 & 100252 Host Attribution Alignment:**
   - *Behavior:* The original descriptions for Rules 100250 and 100252 had swapped host labels (`192.168.56.10` labeled as client and `192.168.56.20` labeled as DC).
   - *Resolution:* Fixed in `local_rules.xml` to correctly attribute `.10` to the Domain Controller (`PC-DC`) and `.20` to `DomainWin10` / `Win10User`.
4. **Rule 100340 SYSTEM WmiPrvSE Suppression Scope:**
   - *Behavior:* Rule 100340 suppresses LOLBins executing under `NT AUTHORITY\\SYSTEM` when parent is `WmiPrvSE.exe`.
   - *Insight:* Adversary WMI execution under human domain admin accounts (`AD\\Administrator`) correctly bypasses this suppression and triggers Rule `100613`. However, if an adversary executes remote WMI as `SYSTEM`, Rule 100340 would suppress `100274`. Production recommendation: ensure Rule `100613` evaluates prior to `100340` regardless of account context.
