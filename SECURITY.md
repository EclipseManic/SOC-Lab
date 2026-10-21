# Security Policy

## Scope

This repository documents an isolated, authorized security lab. It is not a production system and must not be used against systems you do not own or have explicit written permission to test.

## Reporting a problem

If you find a security issue in this repository — including an accidentally committed secret or an unredacted public IP — open a private security advisory or contact the repository owner through GitHub. Do not open a public issue containing live credentials, private keys, public IP addresses, or other sensitive data.

## Redaction policy

Before publishing screenshots, logs, configuration files, or scripts, remove or mask:

- **Public IP addresses** — cloud VM public IPs are dynamic and are never published
- Cloud provider hostnames, instance IDs, metadata endpoints, and console URLs
- API keys, tokens, passwords, and license keys
- WireGuard private keys, preshared keys, and peer configuration secrets
- SSH keys, password hashes, and Kerberos tickets
- Email addresses, usernames tied to real identities, and hostnames outside the lab
- Any data belonging to third parties

The following ranges are the only addresses allowed in documentation:

| Range | Use | Policy |
|---|---|---|
| `192.168.232.0/24` | Local attack/NAT segment | Publishable — lab-only |
| `192.168.56.0/24` | Local victim segment | Publishable — lab-only |
| `10.8.0.0/24` | WireGuard VPN subnet | Publishable — private, no public exposure |
| `10.122.0.0/16` | Cloud private plan | Publishable as a **plan only** — no per-VNet/per-subnet CIDRs, no host addresses |

Replace real values with `<REDACTED>`.

## Cloud addresses

- Public IPs of the cloud VMs are dynamic. They are not recorded anywhere in this repository, including commit history.
- The cloud private plan is documented at `10.122.0.0/16` only. Exact per-VNet and per-subnet CIDRs vary by provider build and are intentionally omitted.
- Never commit firewall exports containing public addresses, provider-generated DNS names, or full security-group dumps.

## Secret handling

This repository must not contain:

- `.env` files or credentials
- Private keys or certificates
- VM images, disk snapshots, or ISO files
- Packet captures containing real network traffic
- TheHive, Wazuh, Cortex, or cloud provider API tokens

`.gitignore` covers the common cases. Enable GitHub secret scanning and push protection on the remote repository, and rotate any key that reaches a commit — even if the commit is later rewritten.

## Lab safety

The tools and commands documented here are for education and detection engineering. Run them only in an isolated environment you control. See [DISCLAIMER.md](DISCLAIMER.md).
