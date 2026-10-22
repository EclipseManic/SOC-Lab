# Kali Linux — Attacker Workstation

## Role

Kali is the adversary workstation. It runs reconnaissance, exploitation, credential access, lateral movement, and collection tooling against the victim network.

## Configuration

| Item | Value |
|---|---|
| OS | Kali Linux (`TBD` version) |
| Address | `192.168.232.135/24` |
| Network | VMware VMnet8 (NAT) |
| Route to victims | `192.168.232.162` (Suricata `eth0`) |
| Route to cloud | No working path — the VMnet8 NAT gateway has no route to `10.122.0.0/16` |
| Resources | `TBD` vCPU / `TBD` GB RAM / `TBD` GB disk |
| Snapshot | Clean baseline before each campaign |

## Addressing

Kali is deliberately **not** on the victim subnet. It lives on the NAT segment and reaches `192.168.56.0/24` only through the gateway:

```bash
ip -br addr show
ip route show
# default via <vmnet8-nat-gateway> dev eth0
# 192.168.56.0/24 via 192.168.232.162 dev eth0
ip route get 192.168.56.30   # expect: via 192.168.232.162
ping -c 1 -W 1 <cloud-private-address>   # expect: timeout / unreachable
```

That last check matters. If Kali can reach the cloud private range directly, the lab is misconfigured and the sensor's view of the campaign is no longer trustworthy.

Add the route explicitly if the OS does not derive it:

```bash
sudo ip route add 192.168.56.0/24 via 192.168.232.162 dev eth0
```

## Tooling

| Category | Tools |
|---|---|
| Reconnaissance | `nmap`, `nikto`, `gobuster` |
| Web exploitation | `sqlmap`, Burp Suite |
| Credential attacks | `hydra`, `hashcat`, Responder |
| Active Directory | BloodHound, Impacket, NetExec/CrackMapExec |
| C2 / shells | `netcat`, `msfvenom`, custom listeners |
| Exfiltration | `scp`, `curl`, SMB |

Record the exact tool versions used for the campaign; they belong in the attack stage notes.

## Setup notes

- Take a clean snapshot before the campaign.
- Keep tool output in per-stage folders so evidence maps cleanly to `02-Attack-Simulation/`.
- Do not store real credentials, public IPs, or API keys in this repository.
- Keep the attack host off the internet during the campaign.
- LLMNR/NBT-NS poisoning is link-local and does not cross a router. Stage 10 (Responder) therefore runs from the DVWA pivot inside `192.168.56.0/24`, not from Kali. Traffic it generates stays on the victim subnet and is not visible to Suricata; Stage 10 is documented as a host-telemetry stage.

## Evidence

- [ ] Redacted network configuration screenshot
- [ ] `ip route get` output for a victim and a ping to a cloud private address (expect timeout)
- [ ] Tool version output
- [ ] Clean snapshot confirmation

## Related documents

- [Suricata gateway](suricata-gateway.md)
- [Network topology](../network-topology.md)
- [Attack chain overview](../../02-Attack-Simulation/README.md)
