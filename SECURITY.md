# Security Policy & Simulation Data Notice

## 1. Scope & Isolated Environment Declaration

This repository documents an entirely isolated, authorized, and controlled cybersecurity research laboratory. All activities, configurations, and simulations were performed within private virtualized networks and dedicated cloud test environments specifically built for education, detection engineering, and threat analysis.

> [!IMPORTANT]
> **Synthetic & Simulated Data Notice:**  
> All credentials, passwords, hashes, SSH public keys, usernames, machine hostnames, API tokens, and command outputs documented across this repository are **simulated testing artifacts generated intentionally for this lab environment**. While syntax and formatting reflect authentic enterprise systems, **no data in this repository represents real production credentials, live corporate networks, private personal identities, or third-party infrastructure**. Everything shown is safe, simulated, and intended solely for reproducibility and educational study.

---

## 2. Permitted Network Addressing Scope

To preserve reproducibility while maintaining strict boundaries, all documentation adheres to the following RFC 1918 and private networking allocations:

| Network Segment | Subnet / Range | Architectural Role | Scope & Policy |
|---|---|---|---|
| **Local Attack Segment** | `192.168.232.0/24` | Kali Linux adversary subnet (VMware VMnet8 NAT) | **Publishable** — Strictly isolated local laboratory range. |
| **Local Victim Segment** | `192.168.56.0/24` | Victim servers and Active Directory domain (VMnet2 Host-Only) | **Publishable** — Strictly isolated local laboratory range. |
| **WireGuard Transport** | `10.8.0.0/24` | Encrypted site-to-cloud transport tunnel | **Publishable** — Private RFC 1918 tunnel transit with zero external exposure. |
| **Cloud Private VNet** | `10.122.0.0/16` | Cloud SOC instances (`10.122.0.4` TheHive VM, `10.122.1.4` Wazuh VM) | **Publishable** — Private RFC 1918 internal virtual network; carried over peered cloud VNet. |

### Cloud Address Privacy
- **Public Cloud IPs:** Dynamic public IP addresses associated with cloud instances during deployment are strictly ephemeral and are intentionally omitted from all repository files, diagrams, and commit histories.
- **Single-Ingress Architecture:** Cloud management consoles (TheHive, Wazuh, Velociraptor) do not listen on public interfaces; all remote administrative access requires authentication across the encrypted WireGuard UDP 51820 tunnel.

---

## 3. Secret Handling & Production Protections

This repository adheres to the following safeguards:
- **No Production Secrets:** No production private keys, production API tokens, live database credentials, or third-party proprietary data are contained in this repository.
- **Simulation Secrets Only:** Passwords (e.g., `Secur3Lab!`, `Password123`, `admindvwa`), hashes, and Kerberos tickets present in write-ups are intentionally crafted dictionary entries used to demonstrate cracking workflows and detection logic.
- **Git Hygiene:** Git tracking filters ignore live `.env` files, ephemeral memory dumps, binary disk images (`.vmdk`, `.iso`), and raw external packet captures.

---

## 4. Reporting a Vulnerability

If you identify a genuine security concern, accidentally unscrubbed production reference, or policy discrepancy within this repository, please report it privately:
- Open a private security advisory through the repository's **Security** tab on GitHub, or
- Contact the maintainer directly via GitHub communications.

Do not open public GitHub issues containing unverified sensitive data.

---

## 5. Educational Use & Safe Practice

The attack techniques, detection rules, and automation scripts published here are provided exclusively for defensive research, academic training, and detection engineering. Run them only within an authorized, isolated environment that you own or have explicit written permission to test. See [DISCLAIMER.md](DISCLAIMER.md).
