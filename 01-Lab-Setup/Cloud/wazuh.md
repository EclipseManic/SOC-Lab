# Wazuh VM — SIEM and Detection

## Role

The Wazuh VM collects host and network telemetry, applies decoders and rules, and produces the alerts that feed TheHive. It is **private only**: it has no public listener, no reverse proxy, and no VPN endpoint of its own. Everything reaches it through the TheHive/automation VM over VNet peering.

## Placement

| Item | Value |
|---|---|
| Cloud private plan | `10.122.0.0/16` summary; this VM is in the second of two peered `/24` VNets |
| Private address | Provider-assigned inside `10.122.0.0/16` — not published |
| Public exposure | None |
| Inbound path | TheHive/automation VM → VNet peering |
| Outbound path | Peering back to the hub, then the WireGuard tunnel |

## Components

| Component | Purpose | Port |
|---|---|---|
| Wazuh Manager | Receives events, applies rules, generates alerts | `1514/TCP` events, `1515/TCP` enrollment |
| Wazuh API | Query alerts for thecustomhive | `55000/TCP` |
| Wazuh Indexer | Stores and indexes alerts and events | `9200/TCP` |
| Wazuh Dashboard | Search, visualisation, administration | `443/TCP` |
| Wazuh Agents | Collect logs and file integrity events from DVWA, Windows 10, DC | outbound to manager |

All of the above are private. The dashboard is reached by an analyst connected to the VPN, routed through the hub.

## Forwarding path

```text
Victim host (192.168.56.0/24)
  -> default gateway 192.168.56.150 (Suricata eth1)
  -> wg0 (10.8.0.2)
  -> WireGuard 51820/UDP
  -> TheHive/automation VM (10.8.0.1) forwards
  -> VNet peering
  -> Wazuh VM private address, 1514/TCP
```

The hub must have IP forwarding enabled and a route to the Wazuh VM's private address. Agents are configured with the Wazuh VM's private address, or with a hub-side forwarder — whichever the build actually uses, record it here.

## Agents

| Agent | Host | Status |
|---|---|---|
| `TBD` | DVWA (`192.168.56.30`) | Not tested |
| `TBD` | Windows 10 (`192.168.56.20`) | Not tested |
| `TBD` | Domain Controller (`192.168.56.10`) | Not tested |
| `TBD` | Suricata gateway | Not tested |

## Detection content

Document:

- Enabled rule groups
- Custom rules and their IDs
- Custom decoders, especially for Suricata `eve.json`
- File integrity monitoring paths
- Active response configuration (if used)
- Alert level threshold used by thecustomhive
- Suppression and false-positive tuning

The rule catalogue and coverage analysis live in `03-Detection-Engineering/Wazuh/`. No rule in this lab is validated yet; see [03-Detection-Engineering/gaps.md](../../03-Detection-Engineering/gaps.md).

## Alert path

```text
Agent or Suricata -> Wazuh Manager -> rule match -> alerts.json
  -> Wazuh API 55000/TCP (private VNet)
     -> thecustomhive (TheHive/automation VM)
        -> TheHive API (local)
           -> analyst queue
```

## Firewall expectations

| Source | Destination | Port | Allowed |
|---|---|---|---|
| TheHive/automation VM | Wazuh VM | `1514`, `1515`, `55000`, `9200`, `443` | Yes |
| VPN client (`10.8.0.0/24`) | Wazuh VM | `443` (dashboard) | Yes, via the hub |
| Internet | Wazuh VM | Any | **No** |

Verify on the live build:

```bash
sudo ss -ltnp | grep -E '1514|1515|55000|9200|443'
# From the hub
nc -vz -w 3 <wazuh-vm-private-address> 55000
nc -vz -w 3 <wazuh-vm-private-address> 1514
```

## Verification

- [ ] All agents show as active
- [ ] A test event produces a Wazuh alert
- [ ] The alert appears in the dashboard over the VPN
- [ ] The alert reaches TheHive through thecustomhive
- [ ] The Wazuh VM accepts nothing from the internet
- [ ] The rule ID is recorded in `INDEX.md`

## Evidence

- [ ] Agent inventory
- [ ] Rule test output
- [ ] Dashboard alert screenshot (VPN session, no public IP visible)
- [ ] Redacted manager configuration

## Related documents

- [Wazuh detection content](../../03-Detection-Engineering/Wazuh/rules.md)
- [thecustomhive pipeline](../pipeline-thecustomhive.md)
- [WireGuard](wireguard.md)
