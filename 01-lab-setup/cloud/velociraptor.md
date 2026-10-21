# Velociraptor — Endpoint Forensics

## Role

Velociraptor provides live endpoint visibility and artifact collection during investigation and response. It complements Wazuh: Wazuh alerts, Velociraptor explains what is happening on the host.

## Deployment

| Item | Value |
|---|---|
| Server | TheHive/automation VM |
| Version | `TBD` |
| Clients | DVWA, Windows 10, Domain Controller (`TBD` — confirm enrollment) |
| Access | VPN only — no public listener, no public reverse proxy |
| Connection direction | Client-initiated; victim hosts dial the server |
| Storage | `TBD` — datastore path and retention |
| Ports | `8000/TCP` frontend, `8889/TCP` GUI |

The server is reached by an analyst on the WireGuard VPN. Because the connection is client-initiated, the victim hosts only need a route to the hub's VPN address; no inbound port is opened toward the victim network.

## Artifacts used

Document the exact artifact names and versions:

| Artifact | Purpose | Hosts |
|---|---|---|
| Process listing | Running processes and command lines | All |
| Network connections | Established connections and listeners | All |
| Persistence | Services, scheduled tasks, autoruns, SSH keys | All |
| File collection | Web shell, scripts, staging files | DVWA / Windows |
| User accounts | Local and domain account changes | DC / Windows |
| Browser or credential artifacts | Only if relevant and authorized | `TBD` |

## Investigation use

- Confirm a web shell path and creation time.
- Identify the reverse shell process and parent process.
- Verify persistence mechanisms.
- Collect files for hashing and comparison.
- Capture a timeline that can be correlated with Wazuh and Suricata.

## Response use

- Isolate a host from the network (if the deployment supports it).
- Kill a malicious process.
- Collect volatile evidence before remediation.
- Verify that persistence was removed.

Document what was actually executed. If response actions were not performed, say so explicitly in `05-incident-report/response-actions.md`.

## Access control

| Control | Requirement |
|---|---|
| Public exposure | None |
| Analyst access | WireGuard VPN, `10.8.0.0/24` |
| Server firewall | Allow `8000` and `8889` from `10.8.0.0/24` only |
| Client enrollment | Pre-provisioned config or server-approved enrollment |
| Datastore | Not world-readable; backup path documented |

If the GUI is fronted by Nginx Proxy Manager, NPM must listen only on the private/VPN interface. A proxy does not make a service public by itself, but a poor bind address or an `0.0.0.0` listener plus a permissive firewall will.

## Evidence

- [ ] Client inventory
- [ ] Artifact collection output (redacted)
- [ ] Process and network timeline
- [ ] Collected file hashes
- [ ] Confirmation that the GUI is unreachable from the internet

## Related documents

- [TheHive/automation VM](thehive.md)
- [WireGuard](wireguard.md)
- [Investigation methodology](../../04-investigation/README.md)
- [Response actions](../../05-incident-report/response-actions.md)
