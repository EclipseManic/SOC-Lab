# Security Policy

## Scope

This repository documents an isolated, authorized security lab. It is not a production system and must not be used against systems you do not own or have explicit written permission to test.

## Reporting a problem

If you find a security issue in this repository, open a private security advisory or contact the repository owner through GitHub. Do not open a public issue containing live credentials, private keys, public IP addresses, or other sensitive data.

## Redaction policy

Before publishing screenshots, logs, configuration files, or scripts, remove or mask:

- Public IP addresses and cloud hostnames
- API keys, tokens, passwords, and license keys
- WireGuard private keys and VPN configuration secrets
- SSH keys, password hashes, and Kerberos tickets
- Email addresses, usernames tied to real identities, and hostnames outside the lab
- Any data belonging to third parties

Use the private lab ranges `192.168.56.0/24` and `192.168.232.0/24` in documentation. Replace real values with `<REDACTED>`.

## Secret handling

This repository must not contain:

- `.env` files or credentials
- Private keys or certificates
- VM images, disk snapshots, or ISO files
- Packet captures containing real network traffic
- TheHive, Wazuh, Cortex, or DigitalOcean API tokens

`.gitignore` covers the common cases. Enable GitHub secret scanning and push protection on the remote repository.

## Lab safety

The tools and commands documented here are for education and detection engineering. Run them only in an isolated environment you control. See [DISCLAIMER.md](DISCLAIMER.md).
