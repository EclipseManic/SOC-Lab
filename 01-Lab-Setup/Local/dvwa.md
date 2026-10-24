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
| **SSH key** | `manichand gupta@ManicLenovo` |

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

## Intentional Weaknesses (Deliberate Attack Surface)

| Weakness | Purpose |
|----------|---------|
| DVWA security level `low` | No input validation — enables SQLi, XSS, command injection |
| MySQL credentials `dvwa:<REDACTED>` | Weak database credentials |
| File upload with no restrictions | Allows webshell upload (Stage 05) |
| SUID bash at `/tmp/bash` | Privilege escalation path (Stage 07) |
| `www-data` has `sudo python3 NOPASSWD` | Alternative privilege escalation |
| `/etc/passwd` chmod 666 | Writable by any user — allows account creation |
| No WAF in front of the application | All payloads reach Apache unfiltered |

> [!CAUTION]
> These weaknesses are **intentional** for the lab. Every one maps to a specific attack stage and a corresponding detection rule.

## Auditd Configuration

Nextron-adapted auditd rules provide comprehensive syscall auditing across the host.
The ruleset is loaded from `/etc/audit/rules.d/audit.rules` and includes watches for identity files (`/etc/passwd`, `/etc/shadow`), execution from `/tmp` and `/opt`, and SUID creation (`chmod +s`).

```bash
# Check loaded audit rules
sudo auditctl -l
```

Custom web-specific rules monitor Apache and PHP process activity, capturing file access patterns and command execution by the `www-data` user.

## Custom Bash Command Logging

All bash commands executed by `root` and `www-data` are captured to `/var/log/bashcmd.log` using a shell prompt hook (`PROMPT_COMMAND`):
```bash
# Format in /var/log/bashcmd.log:
# uid:<uid> user:<user> pwd:<dir> cmd:<command>
```
This provides a structured audit trail of every interactive and scripted shell command on the host.

A custom Wazuh decoder (`bashcmd`) parses these log entries into structured alerts.
See [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md#3-decoders-catalog-local_decoderxml) for the decoder configuration.

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
