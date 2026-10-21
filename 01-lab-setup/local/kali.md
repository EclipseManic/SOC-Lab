# Kali Linux — Attacker Workstation

## Role

Kali is the adversary workstation. It runs reconnaissance, exploitation, credential access, lateral movement, and collection tooling against the victim network.

## Configuration

| Item | Value |
|---|---|
| Operating system | Kali Linux (`TBD` version) |
| IP address | `192.168.232.135` |
| Network | Attack network, routed through the Suricata gateway |
| Resources | `TBD` vCPU / `TBD` GB RAM / `TBD` GB disk |
| Snapshot | Clean baseline before each campaign |

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
- Keep tool output in per-stage folders so evidence maps cleanly to `02-attack-simulation/`.
- Do not store real credentials, public IPs, or API keys in this repository.
- Keep the attack host off the internet during the campaign.

## Evidence

- [ ] Redacted network configuration screenshot
- [ ] Tool version output
- [ ] Clean snapshot confirmation

## Related documents

- [Suricata gateway](suricata-gateway.md)
- [Attack chain overview](../../02-attack-simulation/README.md)
