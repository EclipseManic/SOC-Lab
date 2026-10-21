# Network Topology

## Address plan

All addresses below are private lab ranges. Public cloud addresses and VPN keys are intentionally excluded.

| Host | Operating system | IP address | Role | Telemetry |
|---|---|---|---|---|
| Kali | Kali Linux | `192.168.232.135` | Attacker workstation | None |
| Security Gateway | Linux + Suricata | `TBD` | Inline network detection | EVE JSON -> Wazuh |
| DVWA | Ubuntu | `192.168.56.30` | Web application target | Wazuh agent |
| Windows 10 | Windows 10 | `192.168.56.20` | Workstation target | Wazuh agent |
| Domain Controller | Windows Server | `192.168.56.10` | AD DS, DNS, domain controller | Wazuh agent |
| Wazuh VM | Ubuntu (cloud) | `TBD` (VPN) | SIEM | Wazuh Manager |
| Automation VM | Ubuntu (cloud) | `TBD` (VPN) | TheHive, Velociraptor, Caldera, Nginx Proxy Manager | TheHive API |

## Segments

| Segment | Range | Purpose |
|---|---|---|
| Attack network | `192.168.232.0/24` | Kali and the external side of the gateway |
| Victim network | `192.168.56.0/24` | DVWA, Windows 10, Domain Controller |
| VPN network | `TBD` | Local-to-cloud transport |

## Domain information

| Field | Value |
|---|---|
| Domain | `ad.lab` |
| Domain Controller | `PC-DC.ad.lab` |
| DC address | `192.168.56.10` |
| DNS | Domain Controller |
| Domain functional level | `TBD` |

## Traffic flows

| Source | Destination | Purpose | Inspected by Suricata |
|---|---|---|---|
| Kali | DVWA | Web attacks | Yes |
| Kali | Windows 10 / DC | SMB, LDAP, Kerberos, RPC | Yes |
| DVWA | Windows 10 / DC | Pivot and lateral movement | Yes |
| Wazuh agents | Wazuh Manager | Log shipping | Via WireGuard |
| thecustomhive | TheHive API | Alert creation | Internal cloud |
| Analyst | TheHive / Wazuh / Velociraptor | Investigation | Via VPN or proxy |

## Diagram

Add the redacted network diagram here:

```markdown
![Network topology](../resources/diagrams/network-topology.png)
```

## Verification

- [ ] Confirm each host address with `ip addr` or `ipconfig`
- [ ] Confirm the gateway has two interfaces and forwarding enabled
- [ ] Confirm agents appear in the Wazuh dashboard
- [ ] Confirm the WireGuard tunnel is up in both directions
- [ ] Confirm public cloud IPs are not present in this file
