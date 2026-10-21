# DVWA — Web Application Target

## Role

DVWA (Damn Vulnerable Web Application) is the initial-access target. It provides deliberate web vulnerabilities — SQL injection, command injection, file upload, and more — in a controlled application.

## Configuration

| Item | Value |
|---|---|
| Operating system | Ubuntu (`TBD` version) |
| IP address | `192.168.56.30` |
| Web stack | Apache, PHP, MySQL/MariaDB |
| DVWA security level | `low` for the campaign |
| Wazuh agent | Installed and enrolled |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Services

| Service | Port | Purpose |
|---|---|---|
| Apache | 80 | DVWA web application |
| MySQL/MariaDB | 3306 | Application database |
| SSH | 22 | Administration (and later, persistence evidence) |

## Intentional weaknesses

- DVWA security level set to `low`
- Weak/default application credentials
- File upload permitted
- Verbose application errors
- No WAF in front of the application

These weaknesses are deliberate. They are the attack surface, not an accident.

## Telemetry

- Apache access and error logs
- PHP errors
- Authentication logs (`/var/log/auth.log`)
- Wazuh agent alerts
- Suricata HTTP events for requests crossing the gateway

## Reset procedure

1. Revert the VM to the clean snapshot.
2. Confirm DVWA is reachable.
3. Confirm the Wazuh agent reconnects.
4. Confirm the database is in the expected state.

Document the actual snapshot name and reset commands.

## Evidence

- [ ] DVWA login page
- [ ] Security level configuration
- [ ] Wazuh agent status
- [ ] Clean snapshot confirmation

## Related documents

- [Attack stage 05 — Web shell](../../02-attack-simulation/stages/stage-05-webshell.md)
- [Attack stage 06 — Reverse shell](../../02-attack-simulation/stages/stage-06-reverse-shell.md)
