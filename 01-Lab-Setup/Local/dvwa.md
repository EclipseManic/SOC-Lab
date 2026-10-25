# DVWA — Web Application Target & Internal Pivot

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04 |
| **Role** | Vulnerable web application · internal pivot host |
| **Address** | `192.168.56.30/24` |
| **Default gateway** | `192.168.56.150` |
| **Resources** | 2 vCPU · 4 GB RAM |
| **Wazuh agent** | `DVWA` |
| **Velociraptor** | Client v0.77.1 |
| **SSH key** | `analyst@soc-workstation` |

## Why This Host Matters Twice

DVWA serves a **dual role** in the attack chain:

1. **Initial access target** — Kali reaches DVWA through the Suricata gateway, so every inbound exploit attempt generates network-level alerts on the sensor.
2. **Internal pivot** — After obtaining a reverse shell, tools run **from** DVWA inside `192.168.56.0/24`, where direct victim-to-victim traffic is primarily captured by endpoint telemetry (Wazuh agent, auditd, and bash command logging) and promiscuous gateway sniffing.

## Services

| Service | Port | Protocol |
|---------|------|----------|
| Apache | 80 | TCP |
| MySQL | 3306 | TCP |
| SSH | 22 | TCP |

### Web Stack

- **Apache 2.4.58** with PHP
- **MySQL** — database user `dvwa` / password `<REDACTED>`
- **DVWA security level:** `low`

## Intentional Weaknesses (Baseline Attack Surface)

To evaluate web application and endpoint detection engineering under realistic conditions, DVWA is provisioned with the following baseline vulnerabilities:

| Weakness | Initial Configuration | Defensive Purpose |
|----------|-----------------------|-------------------|
| DVWA Security Level `low` | Configured in `config/config.inc.php` | Disables input sanitization, allowing evaluation of perimeter NIDS and web log detection rules |
| Weak Database Credentials | `dvwa:<REDACTED>` on `3306/TCP` | Simulates exposed database credentials on a compromised web host |
| Permissive File Uploads | Native DVWA upload module | Allows testing file write auditing and process execution tracking |
| Passwordless Sudo (`sudoers`) | `www-data ALL=(ALL) NOPASSWD: /usr/bin/python3` in `/etc/sudoers.d/dvwa` | Real-world administrative misconfiguration enabling privilege escalation tracking |
| Direct Inbound Exposure | Apache exposed on `80/TCP` without WAF | Ensures adversary attack traffic reaches Suricata and Apache directly without intermediate filtering |

> [!IMPORTANT]
> **Lab Setup Scope:** Only the vulnerable web service and sudoers configuration are set up initially. Attacker artifacts (such as uploaded web shells, reverse shell pipes, or modified SSH keys) are **not** pre-created; they are generated dynamically during the execution of the attack simulation stages.

## Auditd Configuration

A targeted 58-line auditd baseline ([`audit.rules`](../../03-Detection-Engineering/Auditd/audit.rules)) is deployed to `/etc/audit/rules.d/audit.rules`. Rather than running a bulky, generic syscall ruleset that would saturate disk I/O on a 4 GB RAM VM, the configuration focuses tightly on high-signal operational indicators:
- **Web Service Execution:** Traces all `execve` invocations initiated by user `www-data` (`uid=33`) under key `web_process_creation`.
- **Staging Directory Execution:** Traces binary execution originating from `/tmp` and `/opt`.
- **Privilege Changes & SUID Backdoors:** Tracks `setuid`/`setgid` calls and SUID bit modifications (`chmod +s`).
- **Identity & Persistence Watches:** Monitors write access to `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`, and `/root/.ssh`.
- **Kernel Immutability (`-e 2`):** Locks the audit configuration into kernel memory until the next full system reboot.

```bash
# Load audit rules and verify status
sudo augenrules --load
sudo auditctl -l
```

## Custom Bash Command Logging

All bash commands executed by `root` and `www-data` are captured to `/var/log/bashcmd.log` using a shell prompt hook (`PROMPT_COMMAND`) deployed in `/etc/bash.bashrc`:
```bash
# Hook in /etc/bash.bashrc:
export PROMPT_COMMAND='logger -p local0.notice -t bashcmd "uid:$(id -u) user:$(id -un) pwd:$(pwd) cmd:$(history 1 | sed "s/^[ ]*[0-9]*[ ]*//")"'
```
This produces structured audit records:
```text
uid:<uid> user:<user> pwd:<dir> cmd:<command>
```
A custom Wazuh decoder (`bashcmd`) parses these log entries into structured fields (`uid`, `user`, `pwd`, `command`) in [`local_decoder.xml`](../../03-Detection-Engineering/Wazuh/local_decoder.xml).

## Host Provisioning & Verification

```bash
# 1. Install core web and auditing packages
sudo apt-get update && sudo apt-get install -y apache2 php php-mysqli mariadb-server auditd audispd-plugins

# 2. Deploy audit rules and reload
sudo cp /path/to/audit.rules /etc/audit/rules.d/audit.rules
sudo augenrules --load

# 3. Verify audit subsystem status
sudo auditctl -s
# enabled 2 flag 1 pid ...

# 4. Test bashcmd logging pipeline
logger -p local0.notice -t bashcmd "uid:0 user:root pwd:/root cmd:id"
tail -n 1 /var/log/bashcmd.log

# 5. Verify Wazuh agent connection
sudo /var/ossec/bin/wazuh-control status
```

## Telemetry Sources

| Source | What it captures |
|--------|-----------------|
| Apache access/error logs | HTTP requests, errors, webshell activity |
| `/var/log/auth.log` | SSH logins, sudo usage, PAM events |
| `/var/log/bashcmd.log` | All bash commands (root, www-data) |
| `/var/log/audit/audit.log` | Syscall events: execve, SUID creation, file watches |
| Wazuh agent (`DVWA`) | Aggregated host-based alerts shipped to manager |
| Velociraptor client | On-demand forensic collection |
| Suricata HTTP events | Gateway-crossing traffic only (inbound from Kali) |

## Related Documentation

- [Stage 03 — SQL Injection](../../02-Attack-Simulation/Stages/stage-03-sqli.md)
- [Stage 05 — Webshell Upload](../../02-Attack-Simulation/Stages/stage-05-webshell.md)
- [Stage 06 — Reverse Shell](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md)
- [Stage 07 — Privilege Escalation](../../02-Attack-Simulation/Stages/stage-07-privesc.md)
- [Stage 08 — SSH Persistence](../../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md)
- [Stage 10 — Responder](../../02-Attack-Simulation/Stages/stage-10-responder.md)
- [Detection Engineering — Auditd Baseline](../../03-Detection-Engineering/Auditd/README.md)
- [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md#3-decoders-catalog-local_decoderxml)
