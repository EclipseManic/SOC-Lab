# SOC Lab — 20-Stage Active Directory Attack & Detection

I built a small company network in a hybrid cloud lab, attacked it in 20 steps the way a real ransomware crew would, and recorded which steps my security tools caught.

**Live interactive report:** <https://soc-lab.eclipsemanic.me/>

---

## Result at a Glance

| Metric | Result | Plain-English Summary |
|---|:---:|---|
| **Attack stages run** | **20** | Full kill chain from external port scan to domain administrator defacement |
| **Stages caught** | **16 (80%)** | Actionable alerts raised in TheHive 5 via Suricata NIDS, Linux Auditd, and Windows Sysmon |
| **Stages missed** | **4 (20%)** | **2 offline:** Password cracking ran locally on the attacker's GPU (zero victim telemetry by definition).<br>**2 logging gaps:** Internal discovery and BloodHound LDAP scans were visible on the pivot or wire, but lacked target-side detection rules. |

---

## How It Works

```
                     ┌──────────────────────────────────────────────┐
                     │            Victim Company Network            │
                     │                                              │
┌──────────────┐     │  ┌───────────┐    ┌───────────────────────┐  │      ┌─────────────────────────┐
│              │     │  │  Gateway  │    │  Internal Targets     │  │      │        Cloud SOC        │
│   Attacker   │────▶│  │  Router   │───▶│  • Web Server (DVWA)  │  │─────▶│  • Wazuh SIEM           │
│ (Kali Linux) │     │  │ (Suricata)│    │  • Windows 10 Client  │  │(VPN) │  • TheHive 5 Cases      │
│              │     │  └───────────┘    │  • Domain Controller  │  │      │  • DFIR / Velociraptor  │
└──────────────┘     │                   └───────────────────────┘  │      └─────────────────────────┘
                     └──────────────────────────────────────────────┘
```

The attacker starts outside the network on an isolated subnet. Every perimeter probe crosses a Linux router running a **Suricata** network intrusion detection system (NIDS). Inside the victim network, endpoints run **Wazuh** agents, **Sysmon**, and **Auditd**. All telemetry is forwarded over an encrypted WireGuard VPN to a cloud-hosted SOC stack running **Wazuh SIEM** and **TheHive 5** case management.

> [!TIP]
> Looking for detailed network addressing, routing tables, and interface diagrams? See [01-Lab-Setup/architecture.md](01-Lab-Setup/architecture.md).

---

## The Attack Story in Three Acts

### 1. Break into the Web Server (Initial Access)
The attacker scans the perimeter, finds a vulnerable web application (DVWA), and exploits an SQL injection vulnerability to dump database credentials. After cracking an administrative password, the attacker uploads a PHP web shell through an unrestricted file upload form, elevates privileges using a misconfigured SUID binary, and establishes persistent SSH access as root.

### 2. Pivot & Take Over the Internal Network (Lateral Movement)
Now inside the company network, the attacker turns the compromised web server into an internal pivot. Operating from this pivot, the attacker runs Responder to poison local name resolution (LLMNR/NBT-NS), intercepting a domain user's password hash from a Windows 10 workstation. After cracking the hash offline, the attacker launches BloodHound to map Active Directory trust relationships and identify domain attack paths.

### 3. Take Over the Active Directory Domain (Full Compromise)
Using the mapped path, the attacker requests a Kerberos service ticket for a privileged service account (Kerberoasting) and cracks it to gain Domain Admin credentials. With domain admin rights, the attacker performs a DCSync attack against the Domain Controller to extract all Active Directory password hashes, forges an unrestricted Golden Ticket for indefinite persistence, creates a rogue domain administrator account, and pushes an unauthorized wallpaper defacement across the domain to demonstrate complete control.

---

## 20-Stage Attack & Detection Summary

| # | What the Attacker Did | Caught? | Details & Evidence |
|:---:|---|:---:|---|
| **01** | Port scan and OS fingerprinting against the perimeter router | **Yes** (Network IDS) | [Stage 01 — Recon](02-Attack-Simulation/Stages/stage-01-recon.md) · [Investigation](04-Investigation/Stages/stage-01-recon.md) |
| **02** | Automated login brute-force attack against the web application | **Yes** (Web 4xx burst) | [Stage 02 — Brute Force](02-Attack-Simulation/Stages/stage-02-bruteforce.md) · [Investigation](04-Investigation/Stages/stage-02-bruteforce.md) |
| **03** | SQL injection to extract user accounts and password hashes | **Yes** (Network & Web log) | [Stage 03 — SQLi](02-Attack-Simulation/Stages/stage-03-sqli.md) · [Investigation](04-Investigation/Stages/stage-03-sqli.md) |
| **04** | Offline cracking of extracted MD5 password hashes | **No** (Offline on GPU) | [Stage 04 — Hash Cracking](02-Attack-Simulation/Stages/stage-04-hash-crack.md) · [Investigation](04-Investigation/Stages/stage-04-hash-crack.md) |
| **05** | Uploaded a PHP web shell through an unrestricted file upload form | **Yes** (IDS & Auditd execve) | [Stage 05 — Web Shell](02-Attack-Simulation/Stages/stage-05-webshell.md) · [Investigation](04-Investigation/Stages/stage-05-webshell.md) |
| **06** | Interactive reverse shell connection back to the attacker | **Yes** (IDS & Host shell spawn) | [Stage 06 — Reverse Shell](02-Attack-Simulation/Stages/stage-06-reverse-shell.md) · [Investigation](04-Investigation/Stages/stage-06-reverse-shell.md) |
| **07** | Linux privilege escalation via SUID binary to gain root | **Yes** (Host PAM & Auditd) | [Stage 07 — PrivEsc](02-Attack-Simulation/Stages/stage-07-privesc.md) · [Investigation](04-Investigation/Stages/stage-07-privesc.md) |
| **08** | Injected attacker SSH public key into root authorized_keys | **Yes** (FIM & SSH logon alert) | [Stage 08 — Persistence](02-Attack-Simulation/Stages/stage-08-ssh-persistence.md) · [Investigation](04-Investigation/Stages/stage-08-ssh-persistence.md) |
| **09** | Internal network sweep from the compromised pivot host | **Partial** (Caught on wire; missed by target) | [Stage 09 — Discovery](02-Attack-Simulation/Stages/stage-09-internal-discovery.md) · [Investigation](04-Investigation/Stages/stage-09-internal-discovery.md) |
| **10** | LLMNR/NBT-NS poisoning (Responder) to capture workstation hash | **Yes** (Logged on pivot host) | [Stage 10 — Responder](02-Attack-Simulation/Stages/stage-10-responder.md) · [Investigation](04-Investigation/Stages/stage-10-responder.md) |
| **11** | Offline cracking of intercepted workstation NetNTLMv2 hash | **No** (Offline on GPU) | [Stage 11 — NTLM Crack](02-Attack-Simulation/Stages/stage-11-ntlmv2-crack.md) · [Investigation](04-Investigation/Stages/stage-11-ntlmv2-crack.md) |
| **12** | BloodHound / SharpHound Active Directory reconnaissance | **Partial** (Pivot logon alerted; DC logging gap) | [Stage 12 — BloodHound](02-Attack-Simulation/Stages/stage-12-bloodhound.md) · [Investigation](04-Investigation/Stages/stage-12-bloodhound.md) |
| **13** | Kerberoasting request for a Domain Admin service account ticket | **Yes** (Wire Kerberos TGS-REQ alert) | [Stage 13 — Kerberoasting](02-Attack-Simulation/Stages/stage-13-kerberoasting.md) · [Investigation](04-Investigation/Stages/stage-13-kerberoasting.md) |
| **14** | DCSync attack dumping all password hashes from Domain Controller | **Yes** (Pivot logon alerted) | [Stage 14 — DCSync](02-Attack-Simulation/Stages/stage-14-dcsync.md) · [Investigation](04-Investigation/Stages/stage-14-dcsync.md) |
| **15** | Pass-the-Hash remote command execution to Windows 10 | **Yes** (NTLM Type 3 & WMI fan-out) | [Stage 15 — Pass-the-Hash](02-Attack-Simulation/Stages/stage-15-pass-the-hash.md) · [Investigation](04-Investigation/Stages/stage-15-pass-the-hash.md) |
| **16** | Forged Kerberos Golden Ticket for unrestricted domain access | **Yes** (Pivot logon alerted) | [Stage 16 — Golden Ticket](02-Attack-Simulation/Stages/stage-16-golden-ticket.md) · [Investigation](04-Investigation/Stages/stage-16-golden-ticket.md) |
| **17** | Created a backdoor domain user and added it to Domain Admins | **Yes** (WMI fan-out & AD event) | [Stage 17 — DC Persistence](02-Attack-Simulation/Stages/stage-17-dc-persistence.md) · [Investigation](04-Investigation/Stages/stage-17-dc-persistence.md) |
| **18** | Automated collection of confidential domain files and user lists | **Yes** (Sysmon process fan-out) | [Stage 18 — Collection](02-Attack-Simulation/Stages/stage-18-collection.md) · [Investigation](04-Investigation/Stages/stage-18-collection.md) |
| **19** | Exfiltrated stolen data archive to the attacker over encrypted SCP | **Yes** (Rapid SSH session burst) | [Stage 19 — Exfiltration](02-Attack-Simulation/Stages/stage-19-exfiltration.md) · [Investigation](04-Investigation/Stages/stage-19-exfiltration.md) |
| **20** | Remote desktop wallpaper defacement across domain endpoints | **Yes** (WMI fan-out & Sysmon registry) | [Stage 20 — Impact](02-Attack-Simulation/Stages/stage-20-impact.md) · [Investigation](04-Investigation/Stages/stage-20-impact.md) |

---

## How to Read This Repo

- **5 minutes:** Read this page, review the result numbers, and scan the 20-stage attack table above.
- **30 minutes:** Read three standout stage investigations comparing attack tradecraft against the raw telemetry:
  - [Stage 03 — SQL Injection](04-Investigation/Stages/stage-03-sqli.md) (Perimeter web exploit detected on wire and web server access logs)
  - [Stage 10 — Responder Poisoning](04-Investigation/Stages/stage-10-responder.md) (Link-local credential capture executed from pivot)
  - [Stage 13 — Kerberoasting](04-Investigation/Stages/stage-13-kerberoasting.md) (Wire Kerberos TGS-REQ alert vs. target-side logging)
- **Deep dive:**
  - **[01-Lab-Setup](01-Lab-Setup/README.md) & [architecture.md](01-Lab-Setup/architecture.md)** — Complete network topology, addressing tables, WireGuard VPN configuration, and host profiles.
  - **[03-Detection-Engineering](03-Detection-Engineering/README.md)** — Custom Wazuh XML rules, Suricata signatures, Sysmon/Auditd baselines, noise-reduction suppressions, and the `thecustomhive` SOAR automation pipeline.
  - **[04-Investigation](04-Investigation/README.md)** — Analyst investigation records and the 3 multi-stage TheHive cases.
  - **[05-Incident-Report](05-Incident-Report/README.md)** — Executive incident report, unified chronological timeline, full IOC inventory, and defensive recommendations.
  - **[INDEX.md](INDEX.md)** — Master traceability matrix cross-referencing every stage, MITRE ATT&CK technique, rule ID, alert ID, and raw evidence file.

---

## Disclaimer & License

> **Authorized Educational Research Only:** All attack simulations and defensive telemetry in this project were executed against dedicated, isolated virtual machines in a private lab environment owned by the author. No production systems or unauthorized networks were targeted. See [DISCLAIMER.md](DISCLAIMER.md).

This project is licensed under the [MIT License](LICENSE).
