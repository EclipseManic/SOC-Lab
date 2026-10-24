# Auditd Telemetry Baseline — Linux Kernel Auditing

> **Production Configuration & Artifacts:**
> - Ruleset Definition: [`audit.rules`](audit.rules)
> - Target Deployment: DVWA Pivot Host (`192.168.56.30`, Ubuntu 24.04 LTS)
> - Target Location: `/etc/audit/rules.d/audit.rules`
> - Wazuh Ingestion: `/var/log/audit/audit.log` via local Wazuh agent

---

## 1. Overview & Purpose

Standard Linux system logs (`/var/log/syslog` and `/var/log/auth.log`) primarily capture authentication sessions and service status messages. They lack granular, real-time kernel tracing for interactive shell executions, sub-process spawns, sensitive file writes, and file permission changes.

To provide endpoint visibility on the DVWA pivot host, the Linux Audit Daemon (`auditd`) is configured with a hardened best-practice ruleset adapted from **Nextron Systems**. Auditd intercepts syscalls at the kernel layer, attaching audit keys (`-k <key_name>`) that match Wazuh rules in [`local_rules.xml`](../Wazuh/local_rules.xml).

---

## 2. Ruleset Structure & Syscall Mapping

The deployed [`audit.rules`](audit.rules) file is divided into five core monitoring zones:

### 1. Process Execution Tracing (`execve`, `execveat`)
Captures program execution across 32-bit and 64-bit architectures with key `process_execution`:
```ini
-a always,exit -F arch=b64 -S execve -k process_execution
-a always,exit -F arch=b32 -S execve -k process_execution
-a always,exit -F arch=b64 -S execveat -k process_execution
-a always,exit -F arch=b32 -S execveat -k process_execution
```

---

### 2. Privilege Escalation & SUID Creation
Monitors processes altering user credentials or creating SUID/SGID privileged binaries:
```ini
-a always,exit -F arch=b64 -S setuid,setgid,setreuid,setregid -k priv_escalation
-a always,exit -F arch=b32 -S setuid,setgid,setreuid,setregid -k priv_escalation
-a always,exit -F arch=b64 -S chmod,fchmod,fchmodat -F a2&04000 -k setuid_creation
-a always,exit -F arch=b32 -S chmod,fchmod,fchmodat -F a2&04000 -k setuid_creation
```
*Validated in Stage 07:* Detects `chmod +s /tmp/bash` executed to establish SUID persistence.

---

### 3. Persistence & Critical File Access (Aligned with Wazuh Rules 100217 & 100218)
Watches critical authentication, user database, and web root directories:
```ini
# SSH persistence
-w /root/.ssh -p wa -k ssh_root_persistence
-w /home -p wa -k ssh_user_persistence

# Identity file modifications (Wazuh Rule 100217)
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/gshadow -p wa -k identity

# Credential file read operations (Wazuh Rule 100218)
-w /etc/passwd -p r -k cat_sensitive_file
-w /etc/shadow -p r -k cat_sensitive_file

# Sudoers modifications
-w /etc/sudoers -p wa -k sudoers_modification
-w /etc/sudoers.d/ -p wa -k sudoers_modification

# Web directory file creation (Webshell upload)
-w /var/www/html -p wa -k web_directory_write
```
*Validated in Stage 05 (Webshell upload) and Stage 08 (SSH key persistence).*

---

### 4. Suspicious Execution Paths & Tool Staging
Monitors execution of scripting interpreters and recursive executions from staging directories:
```ini
-w /usr/bin/python3 -p x -k python_execution
-w /usr/bin/nc -p x -k netcat_execution
-w /bin/nc.traditional -p x -k netcat_execution
-a always,exit -F arch=b64 -S execve,execveat -F dir=/tmp -k tmp_execution
-a always,exit -F arch=b32 -S execve,execveat -F dir=/tmp -k tmp_execution
-a always,exit -F arch=b64 -S execve,execveat -F dir=/opt -k opt_tool_execution
-a always,exit -F arch=b32 -S execve,execveat -F dir=/opt -k opt_tool_execution
```
*Validated in Stage 06 (Reverse shell), Stage 07 (Sudo python3), and Stages 12–14 (Impacket tool execution from `/opt`).*

---

### 5. Configuration Immutability (`-e 2`)
```ini
-e 2
```
Locks the audit configuration in kernel memory.

> [!CAUTION]
> **Immutability Enforcement:** Once `-e 2` is loaded into the kernel, the audit ruleset is immutable. Rules cannot be modified, deleted, or reloaded with `augenrules --load` until the system is rebooted. To make rule changes, modify `/etc/audit/rules.d/audit.rules` and reboot the host.

---

## 3. Wazuh SIEM Ingestion & Rule Integration

The local Wazuh agent on DVWA reads `/var/log/audit/audit.log` via its native audit collector:

```xml
<!-- /var/ossec/etc/ossec.conf on DVWA -->
<localfile>
  <log_format>audit</log_format>
  <location>/var/log/audit/audit.log</location>
</localfile>
```

Wazuh's analysis engine correlates Auditd events with custom rules defined in [`03-Detection-Engineering/Wazuh/local_rules.xml`](../Wazuh/local_rules.xml):
- **Rule 100199 (Level 10):** Syscall 59 (`execve`) executing enumeration or shell binaries (`whoami`, `id`, `nc`, `bash -i`).
- **Rule 100217 (Level 12):** Sensitive identity file access (`audit.key: identity`).
- **Rule 100218 (Level 12):** Credential file read operations (`audit.key: cat_sensitive_file` on `/etc/passwd` or `/etc/shadow`).

---

## 4. Verification & Operational Commands

```bash
# Load audit rules from /etc/audit/rules.d/ (on clean/rebooted system)
sudo augenrules --load

# Verify active rules in kernel memory
sudo auditctl -l

# Check audit daemon status and backlog queue
sudo auditctl -s

# Search audit events by specific attack key
sudo ausearch -k setuid_creation -ts recent
sudo ausearch -k ssh_root_persistence -ts recent
sudo ausearch -k identity -ts recent

# Generate executive execution summary report
sudo aureport -x --summary
```
