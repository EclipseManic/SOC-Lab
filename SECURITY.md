# Security Policy & Laboratory Disclosure

## 1. Project Scope & Author Attribution

This repository documents an isolated, authorized cybersecurity laboratory built for defensive research, detection engineering, and educational purposes. The laboratory architecture, configurations, and documentation are authored and maintained by **Manichand Gupta**.

All testing was conducted within private, isolated virtualized networks and dedicated cloud instances specifically provisioned for this project.

---

## 2. Laboratory Data Disclosure & Redaction Policy

To balance complete technical reproducibility with security best practices, this repository adheres to a strict disclosure boundary:

- **Lab-Only Simulation Artifacts (Published Intentionally):**  
  Credentials, password hashes, and directory paths documented in the attack write-ups (e.g., dictionary passwords in `/etc/shadow`, NTLMv2 challenge-response captures, and DVWA user tables) are **lab-only simulation fixtures**. They exist solely to demonstrate attack execution, hash cracking workflows, and SIEM detection logic in an isolated environment.
- **Production Secrets & Personal Identifiers (Strictly Redacted):**  
  No production private keys, production API tokens, corporate credentials, or third-party data exist in this repository. Personal hardware hostnames and private SSH keys are redacted and standardized to generic management identities (`soc-analyst@management`).

### Address & Telemetry Redaction Rules

| Range / Identifier | Infrastructure Role | Publication Policy |
|---|---|---|
| `192.168.232.0/24` | Local Attack / NAT Segment | **Publishable** — Isolated local laboratory segment (VMware VMnet8). |
| `192.168.56.0/24` | Local Victim Segment | **Publishable** — Isolated local laboratory segment (VMware VMnet2). |
| `10.8.0.0/24` | WireGuard VPN Tunnel | **Publishable** — Internal RFC 1918 tunnel network; zero external routing. |
| `10.122.0.0/16` | Cloud Private VNet | **Publishable** — RFC 1918 internal addresses (`10.122.0.4` TheHive VM, `10.122.1.4` Wazuh VM). |
| **Public Cloud IPs** | Azure Instance Egress | **Strictly Redacted** — Cloud public IPs are dynamic/ephemeral and omitted from documentation. |
| **Private Keys & Secrets** | WireGuard / SSH / Tokens | **Strictly Redacted** — All private keys, API secrets, and TLS private keys must be `<REDACTED>`. |

---

## 3. Secret Handling Guidelines for Contributors

Before committing any configuration, log export, or script to this repository:
- Remove all private keys (`id_rsa`, `id_ed25519`, WireGuard `PrivateKey`).
- Mask any cloud provider subscription IDs, tenant IDs, console URLs, and storage account access tokens.
- Replace external or third-party usernames and email addresses with generic laboratory roles.
- Ensure all cloud web consoles (TheHive, Wazuh Dashboard, Velociraptor) remain bound to private internal interfaces behind WireGuard or private reverse proxies.

---

## 4. Reporting Security Vulnerabilities

If you identify an unredacted credential, sensitive key, or security vulnerability in this repository, please report it responsibly:
- Open a private security advisory through the repository's **Security** tab on GitHub, or
- Contact the maintainer directly via GitHub.

Please do not open public GitHub issues containing unverified sensitive findings.

---

## 5. Educational Use & Safe Practice

All attack scripts, rulesets, and detection pipelines are published strictly for defensive education and security research. Run them only within an authorized, isolated environment that you own or have explicit written permission to test. See [DISCLAIMER.md](DISCLAIMER.md).
