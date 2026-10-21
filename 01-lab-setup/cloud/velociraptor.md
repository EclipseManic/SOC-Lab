# Velociraptor — Endpoint Forensics

## Role

Velociraptor provides live endpoint visibility and artifact collection during investigation and response. It complements Wazuh: Wazuh alerts, Velociraptor explains what is happening on the host.

## Deployment

| Item | Value |
|---|---|
| Server | VM 2 |
| Version | `TBD` |
| Clients | DVWA, Windows 10, Domain Controller |
| Access | VPN or reverse proxy |
| Storage | `TBD` |

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

## Evidence

- [ ] Client inventory
- [ ] Artifact collection output (redacted)
- [ ] Process and network timeline
- [ ] Collected file hashes

## Related documents

- [Investigation methodology](../../04-investigation/README.md)
- [Response actions](../../05-incident-report/response-actions.md)
