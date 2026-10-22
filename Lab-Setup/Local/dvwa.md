# DVWA — Web Application Target

## Role

DVWA (Damn Vulnerable Web Application) is the initial-access target and later the internal pivot. It provides deliberate web vulnerabilities — SQL injection, command injection, file upload, and more — in a controlled application.

## Configuration

| Item | Value |
|---|---|
| OS | Ubuntu (`TBD` version) |
| Address | `192.168.56.30/24` |
| Default gateway | `192.168.56.150` (Suricata `eth1`) |
| NICs | Single NIC on `192.168.56.0/24` |
| Web stack | Apache, PHP, MySQL/MariaDB |
| DVWA security level | `low` for the campaign |
| Wazuh agent | Installed and enrolled; manager reached through the tunnel |
| Resources | `TBD` vCPU / `TBD` GB RAM |

## Services

| Service | Port | Purpose |
|---|---|---|
| Apache | `80/TCP` | DVWA web application |
| MySQL/MariaDB | `3306/TCP` | Application database |
| SSH | `22/TCP` | Administration (and later, persistence evidence) |

## Why this host matters twice

DVWA is the only host that is both an internet-style target and an internal pivot:

1. **Initial access.** Kali reaches it through the Suricata gateway, so the web attacks are visible as network events.
2. **Pivot.** After the reverse shell, tooling runs *from* `192.168.56.30`. Internal discovery, Responder poisoning, and NTLM capture then happen inside `192.168.56.0/24`, where Suricata is blind. Those stages are host-telemetry detections.

## Network path

| Destination | Path |
|---|---|
| DC, Windows 10 (`192.168.56.0/24`) | Direct, same subnet — no router hop |
| Kali (`192.168.232.0/24`) | Via `192.168.56.150` |
| Wazuh manager (`10.122.0.0/16`) | Via `192.168.56.150` → `wg0` → hub → peering |

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
- Suricata HTTP events for requests crossing the gateway (Kali → DVWA only)

## Reset procedure

1. Revert the VM to the clean snapshot.
2. Confirm DVWA is reachable through the gateway.
3. Confirm the Wazuh agent reconnects through the tunnel.
4. Confirm the database is in the expected state.

Document the actual snapshot name and reset commands.

## Evidence

- [ ] DVWA login page
- [ ] Security level configuration
- [ ] Wazuh agent status with manager address
- [ ] Clean snapshot confirmation

## Related documents

- [Attack stage 05 — Web shell](../../Attack-Simulation/Stages/stage-05-webshell.md)
- [Attack stage 06 — Reverse shell](../../Attack-Simulation/Stages/stage-06-reverse-shell.md)
- [Attack stage 10 — Responder](../../Attack-Simulation/Stages/stage-10-responder.md)
