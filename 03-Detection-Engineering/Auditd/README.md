# Auditd Telemetry Baseline — Linux Kernel Auditing

> **Production Configuration & Artifacts:**
> - Ruleset Definition: [`audit.rules`](audit.rules)
> - Target Deployment: DVWA Pivot Host (`192.168.56.30`, Ubuntu 24.04 LTS)
> - Target Location: `/etc/audit/rules.d/audit.rules`
> - Wazuh Ingestion: `/var/log/audit/audit.log` via local Wazuh agent

---

## 1. Overview & Purpose

Standard Linux system logs (`/var/log/syslog` and `/var/log/auth.log`) primarily capture authentication sessions and service status messages. They lack granular, real-time kernel tracing for interactive shell executions, sub-process spawns, sensitive file writes, and file permission changes.

To provide endpoint visibility on the DVWA pivot host, the Linux Audit Daemon (`auditd`) is configured with a hardened best-practice ruleset adapted from **Nextron Systems**. Auditd intercepts syscalls at the kernel layer, attaching cryptographic audit keys (`-k <key_name>`) that allow the Wazuh SIEM to correlate Linux exploit steps in real time.

---

## 2. Ruleset Structure & Syscall Mapping

The deployed [`audit.rules`](audit.rules) file is divided into five core monitoring zones:

### 1. Process Execution Tracing (`execve`, `execveat`)
Captures every program executed on the system across 32-bit and 64-bit architectures.
```ini
-a always,exit -F arch=b64 -S execve -k process_execution
-a always,exit -F arch=b32 -S execve -k process_execution
-a always,exit -F arch=b64 -S execveat -k process_execution
-a always,exit -F arch=b32 -S execveat -k process_execution
```
- **Detection Value:** Records binary paths, process IDs, parent PIDs, user IDs, and command arguments.

---

### 2. Privilege Escalation & SUID Creation
Monitors processes altering user credentials or creating SUID/SGID privileged binaries.
```ini
-a always,exit -F arch=b64 -S setuid,setgid,setreuid,setregid -k priv_escalation
-a always,exit -F arch=b32 -S setuid,setgid,setreuid,setregid -k priv_escalation
-a always,exit -F arch=b64 -S chmod,fchmod,fchmodat -F a2&04000 -k setuid_creation
-a always,exit -F arch=b32 -S chmod,fchmod,fchmodat -F a2&04000 -k setuid_creation
```
- **Validated in Stage 07:** Detects `chmod +s /tmp/bash` executed to establish SUID persistence.

---

### 3. Persistence & Critical File Access Watches
Watches critical authentication, user database, and web root directories for write/attribute changes (`-p wa`).
```ini
-w /root/.ssh -p wa -k ssh_root_persistence
-w /home -p wa -k ssh_user_persistence
-w /etc/passwd -p wa -k user_account_modification
-w /etc/shadow -p wa -k user_account_modification
-w /etc/sudoers -p wa -k sudoers_modification
-w /etc/sudoers.d/ -p wa -k sudoers_modification
-w /var/www/html -p wa -k web_directory_write
```
- **Validated in Stage 05:** Flags PHP web shell upload (`shell.php`) to `/var/www/html/hackable/uploads/`.
- **Validated in Stage 08:** Flags attacker public key appended to `/root/.ssh/authorized_keys`.

---

### 4. Suspicious Execution Paths & Interactive Tooling
Monitors execution (`-p x`) of network and scripting interpreters frequently abused by attackers.
```ini
-w /usr/bin/python3 -p x -k python_execution
-w /usr/bin/nc -p x -k netcat_execution
-w /bin/nc.traditional -p x -k netcat_execution
-w /tmp -p x -k tmp_execution
```
- **Validated in Stage 06:** Flags outbound reverse shell initiated via Python socket.
- **Validated in Stage 07:** Flags `sudo python3` execution used to spawn interactive root shell.
- **Validated in Stage 12–14:** Flags Impacket scripts (`secretsdump.py`, `GetUserSPNs.py`) executing out of `/tmp` or `/opt`.

---

### 5. Configuration Immutability
```ini
-e 2
```
Locks the audit configuration in kernel memory. Rules cannot be modified, deleted, or disabled until the system is rebooted, preventing an adversary from blinding the sensor after obtaining root.

---

## 3. Wazuh SIEM Ingestion & Rule Integration

The local Wazuh agent on DVWA reads `/var/log/audit/audit.log` via its `audit` log format collector:

```xml
<!-- /var/ossec/etc/ossec.conf on DVWA -->
<localfile>
  <log_format>audit</log_format>
  <location>/var/log/audit/audit.log</location>
</localfile>
```

Wazuh's analysis engine correlates Auditd events with custom rules defined in [`03-Detection-Engineering/Wazuh/local_rules.xml`](../Wazuh/local_rules.xml):
- **Rule 100199 (Level 10):** Syscall 59 (`execve`) executing enumeration or shell binaries (`whoami`, `id`, `nc`, `bash -i`).
- **Rule 100217 (Level 12):** Sensitive identity file access (`key="identity"` / `key="user_account_modification"`).
- **Rule 100218 (Level 12):** Credential file read operations (`/etc/shadow`, `/etc/passwd`).

---

## 4. Verification & Operational Commands

```bash
# Load audit rules from /etc/audit/rules.d/
sudo augenrules --load

# Verify active rules in kernel memory
sudo auditctl -l

# Check audit daemon status and backlog queue
sudo auditctl -s

# Search audit events by specific attack key
sudo ausearch -k setuid_creation -ts recent
sudo ausearch -k ssh_root_persistence -ts recent

# Generate executive execution summary report
sudo aureport -x --summary
```
