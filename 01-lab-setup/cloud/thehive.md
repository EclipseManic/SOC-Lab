# TheHive/automation VM — Case Management, Ingress, and Routing

## Role

This VM is the cloud edge of the lab. It runs more than a case-management UI:

| Function | Component |
|---|---|
| Case management | TheHive |
| SIEM → case pipeline | thecustomhive (Python) |
| VPN hub and server | WireGuard on `wg0` (`10.8.0.1/24`), listener `51820/UDP` |
| Cloud router | Forwards agent traffic to the Wazuh VM over VNet peering |
| Internal TLS / reverse proxy | Nginx Proxy Manager (NPM) on Docker |
| Endpoint forensics | Velociraptor server |
| Container runtime | Docker / Docker Compose |

It is the only host in the lab with a public inbound port. Everything it serves to humans is VPN-only.

## Placement

| Item | Value |
|---|---|
| Cloud private plan | `10.122.0.0/16` (one of two peered VNets) |
| Private address | Provider-assigned inside `10.122.0.0/16` — not published |
| VPN address | `10.8.0.1/24` |
| Public exposure | `51820/UDP` only |
| Peering | Private route to the Wazuh VM |

The public IP is dynamic. It is not recorded in this repository and should be re-read from the provider console when a client config needs updating.

## Configuration

| Item | Value |
|---|---|
| OS | Ubuntu (`TBD` version) |
| TheHive version | `TBD` (TheHive 5.x — verify) |
| Deployment | Docker Compose (`TBD` file names) |
| Organisation | `TBD` |
| Analyst account | `TBD` |
| API key | `<REDACTED>` |
| Case templates | `TBD` |
| Observable types | IP, domain, file, hash, user, URL |
| Data path | `TBD` — container volume for TheHive/Cassandra/Elasticsearch data |
| Backups | `TBD` |

## Services and ports

| Service | Port | Exposure |
|---|---|---|
| TheHive UI | `9000/TCP` | VPN only |
| NPM admin | `81/TCP` | VPN only |
| NPM HTTP/HTTPS | `80`, `443/TCP` | VPN only — no public listener |
| Velociraptor frontend | `8000/TCP` | VPN only, client-initiated |
| Velociraptor GUI | `8889/TCP` | VPN only |
| WireGuard | `51820/UDP` | **Public** |

Confirm the live listeners with `sudo ss -ltnup`. A service listening on `0.0.0.0` is still unreachable from the internet if the cloud firewall denies it — but the intent is that only `51820/UDP` is ever permitted.

## Why these roles share one VM

- One public host means one firewall rule and one thing to patch at the edge.
- TheHive, NPM, and WireGuard already need to talk to each other; co-locating removes a hop.
- thecustomhive posts to TheHive over loopback, which removes an API-key-bearing flow from the network entirely.
- The Wazuh VM then needs no public address, no proxy, and no VPN listener.

## Routing duties

1. Terminate the tunnel for the Suricata client (`10.8.0.2/32`).
2. Accept Wazuh agent traffic arriving on `wg0` and forward it to the Wazuh VM at its private VNet address.
3. Route analyst VPN sessions to TheHive, NPM, and Velociraptor locally.
4. Keep return routes for `192.168.232.0/24` and `192.168.56.0/24` pointed at `wg0`.

```bash
# Forwarding must be enabled for the hub role
sysctl net.ipv4.ip_forward
ip route get <wazuh-vm-private-address>   # expect a route in the peered VNet
ss -lunp | grep 51820
```

## Single point of failure

This VM is the ingress, the VPN hub, the router, and the case management system. If it fails:

- The tunnel drops and agents on the victim network cannot deliver events. Wazuh agents buffer locally and retry; the queue window depends on agent configuration.
- The analyst loses the TheHive UI, Velociraptor, and NPM at once.
- The Wazuh VM stays up but becomes unreachable from the lab until the hub returns.

Mitigations used and still open:

- [ ] Provider snapshot before changes
- [ ] Monitoring: a heartbeat check on `51820/UDP` plus a VPN-side check of the TheHive UI
- [ ] Documented rebuild order: Docker volumes → TheHive → NPM → Velociraptor → WireGuard
- [ ] Confirm agent buffer behaviour during an outage and record the retention window

Monitoring must be configured from **outside** the VM, or it will not detect the VM being down. The provider console remains the break-glass path when SSH is closed and the tunnel is broken.

## Case model used in this lab

| Case | Scope | Stages |
|---|---|---|
| Case 01 | Web application compromise | 01–07 |
| Case 02 | Lateral movement and credential access | 08–14 |
| Case 03 | Domain compromise and impact | 15–20 |

An incident is a case, not a stage. Each stage becomes a task or a set of tasks inside the relevant case. Detailed stage notes live in `04-investigation/stages/`; case summaries live in `04-investigation/cases/`.

## Triage workflow

1. Review the incoming alert and confirm the rule and source.
2. Decide true positive, false positive, or benign.
3. Set severity, TLP, and PAP.
4. Create a case or add the alert to an existing case.
5. Add observables (IP, user, file, hash, URL).
6. Add tasks for each investigation step.
7. Record findings and evidence links.
8. Write the case summary and close the case.

## Fields to capture

| Field | Why |
|---|---|
| Alert ID | Traceability back to Wazuh |
| Rule ID | Detection content reference |
| Source IP | Attacker or affected host |
| Destination IP | Target |
| User | Account involved |
| File / hash | Malware or tooling evidence |
| ATT&CK technique | Coverage and reporting |
| Timeline | Reconstruction |

## Evidence

- [ ] Redacted alert queue
- [ ] Case 01 overview
- [ ] Observable list
- [ ] Task list and completed findings
- [ ] Case report export
- [ ] Redacted `docker ps` output

## Related documents

- [WireGuard](wireguard.md)
- [thecustomhive pipeline](../pipeline-thecustomhive.md)
- [Investigation methodology](../../04-investigation/README.md)
- [Case 01](../../04-investigation/cases/case-01-web-compromise.md)
