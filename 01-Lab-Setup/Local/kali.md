# Kali Linux — Attacker Workstation

| Property | Value |
|----------|-------|
| **OS** | Kali Linux (rolling) |
| **Role** | Primary attack platform |
| **Address** | `192.168.232.135/24` (VMware VMnet8 — NAT) |
| **Resources** | 6 vCPU · 6 GB RAM |
| **Default gateway** | `192.168.232.2` (VMnet8 NAT gateway) |
| **SSH key** | `analyst@soc-workstation` |

## Network Position

Kali sits on the **NAT segment** (`192.168.232.0/24`), *not* on the victim subnet.
It reaches `192.168.56.0/24` **only** through the [Suricata gateway](suricata-gateway.md), which means every packet crosses the IDS sensor before touching a target.

Direct access to the cloud private range (`10.122.0.0/16`) is **blocked by design** — the WireGuard tunnel terminates on the gateway, not on Kali.

### Static Route to Victims

```
auto eth0
iface eth0 inet dhcp
  post-up ip route add 192.168.56.0/24 via 192.168.232.162 dev eth0
```

The `post-up` directive ensures the route survives reboots without manual intervention.

## Installed Tooling

| Category | Tools |
|----------|-------|
| Reconnaissance | nmap, nikto, gobuster, WhatWeb |
| Web exploitation | sqlmap, Burp Suite |
| Credential attacks | hydra, hashcat, Responder, john |
| Active Directory | BloodHound Legacy 4.x, Impacket (secretsdump, wmiexec, getTGT, getST, psexec, smbexec), NetExec/CrackMapExec |
| C2 / shells | netcat, msfvenom, custom python listeners |
| Exfiltration | scp, curl, SMB |

### BloodHound Legacy 4.x

The `bloodhound-start` wrapper launches the Neo4j graph database on `localhost:7474` and opens the BloodHound GUI.
BloodHound is used during AD enumeration (Stage 12) to map attack paths through the `ad.lab` domain.

## Verification Commands

```bash
# Confirm IP address
ip -br addr show
# eth0  UP  192.168.232.135/24

# Full routing table
ip route show
# default via 192.168.232.2 dev eth0
# 192.168.56.0/24 via 192.168.232.162 dev eth0

# Trace path to a victim host (should route through the gateway)
ip route get 192.168.56.30
# 192.168.56.30 via 192.168.232.162 dev eth0

# Confirm cloud range is unreachable (expected timeout)
ping -c 1 10.122.0.4
# PING 10.122.0.4 (10.122.0.4) ... 100% packet loss
```

## Related Documentation

- [Suricata Gateway](suricata-gateway.md) — the router/IDS that bridges Kali to the victim subnet
- [Lab Architecture](../architecture.md) — full network topology
- [Attack Simulation](../../02-Attack-Simulation/README.md) — attack stages executed from this host
