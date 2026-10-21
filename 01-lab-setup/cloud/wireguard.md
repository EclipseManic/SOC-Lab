# WireGuard — Local-to-Cloud Transport

## Role

WireGuard provides the encrypted tunnel between the local lab and the cloud SOC. Wazuh agents and management traffic use it; the cloud services are not exposed directly to the public internet.

## Topology

```text
Local gateway / Wazuh forwarder  <==== WireGuard ====>  Cloud VM 1 (Wazuh)
                                                           |
                                                           +--> Cloud VM 2 (TheHive, Velociraptor, Caldera)
```

Document the actual peer layout, but never publish private keys.

## Configuration

| Item | Value |
|---|---|
| Local peer address | `TBD` |
| Cloud peer address | `TBD` |
| Listen port | `TBD` |
| Allowed IPs | `TBD` (least privilege) |
| DNS | `TBD` |
| Persistent keepalive | `TBD` |

## Security rules

- Never commit `wg0.conf`, private keys, or preshared keys.
- Use a dedicated key pair for the lab.
- Restrict `AllowedIPs` to the cloud services that are actually needed.
- Firewall the WireGuard port to known source addresses where possible.
- Rotate keys if a screenshot or log exposes them.
- Redact endpoint addresses in screenshots.

## Verification

- [ ] `wg show` confirms a recent handshake on both peers
- [ ] The local host can reach the Wazuh manager over the tunnel
- [ ] The Wazuh agent is active
- [ ] TheHive is reachable only through the intended path
- [ ] No public IPs or keys appear in the repository

## Evidence

- [ ] Redacted `wg show` output
- [ ] Tunnel test
- [ ] Firewall rules

## Related documents

- [Network topology](../network-topology.md)
- [DigitalOcean layout](digitalocean.md)
