# Kali Linux — Attacker Workstation

| Property | Value |
|----------|-------|
| **OS** | Kali Linux (Rolling Release) |
| **Role** | Primary adversary attack platform |
| **Address** | `192.168.232.135/24` (VMware VMnet8 — NAT) |
| **Resources** | 6 vCPU · 6 GB RAM |
| **Default Gateway** | `192.168.232.2` (VMware NAT Gateway) |
| **Static Route** | `192.168.56.0/24` via `192.168.232.162` (Suricata Gateway) |
| **SSH Management** | Host laptop key (`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFImUu819rU/dVwoUxcH2WnR10MGqK5tlNDMp7U4so68 manichand gupta@ManicLenovo`) |

---

## 1. Network Position & Permanent Static Routing

Kali sits strictly on the **isolated NAT segment** (`192.168.232.0/24`), completely segregated from the victim subnet (`192.168.56.0/24`). It reaches internal targets **only through the [Suricata Gateway](suricata-gateway.md)** (`192.168.232.162`), ensuring that all attack packets cross the NIDS sensor before touching victim endpoints.

Direct communication with the cloud SOC private network (`10.122.0.0/16`) is blocked by design—the WireGuard VPN tunnel terminates exclusively on the Security Gateway.

### Permanent Static Route Configuration (`/etc/network/interfaces`)

The static IP and kernel route to the victim subnet are configured permanently in `/etc/network/interfaces` to persist across reboots:

```text
# /etc/network/interfaces
source /etc/network/interfaces.d/*

# Loopback Interface
auto lo
iface lo inet loopback

# Primary Attack Interface (VMware VMnet8 NAT)
auto eth0
iface eth0 inet static
    address 192.168.232.135
    netmask 255.255.255.0
    up ip route add default via 192.168.232.2 dev eth0
    up ip route add 192.168.56.0/24 via 192.168.232.162 dev eth0
```

> [!NOTE]
> Any secondary interfaces (e.g. `eth1` configured via DHCP for outbound internet updates) are outside the lab attack boundary and omitted from simulation routing.

---

## 2. Installed Adversary Tooling & Wordlists

To execute the 20-stage attack simulation seamlessly, the following tools and wordlists are pre-installed and verified on Kali:

| Category | Tools & Binaries | Purpose in Campaign |
|----------|-----------------|---------------------|
| **Reconnaissance & Web Fuzzing** | `nmap`, `nikto`, `gobuster`, `whatweb`, `curl` | Inbound port scanning, web application directory enumeration, banner grabbing (Stages 01, 02) |
| **Interactive Proxy & Exploitation** | Burp Suite Community, `metasploit-framework` | Web vulnerability assessment, SQL injection payload crafting (Stage 03) |
| **Credential Attacks** | `hashcat`, `hydra`, `john` | Cracking captured MD5 hashes (Stage 04), NTLMv2 hashes (Stage 11), and Kerberoastable TGS tickets (Stage 13) |
| **Command & Control / Listeners** | `netcat` (`nc`), `python3`, `pip3` | Reverse shell listeners (`nc -lvnp 4444` in Stage 06), tool preparation scripts |
| **Active Directory Enumeration** | `bloodhound-start`, `neo4j`, `bloodhound-python` | Neo4j graph database backend and BloodHound Legacy 4.x GUI; Cypher attack path queries (Stage 12) |
| **Lateral Movement & Credential Access** | `impacket` (`wmiexec.py`, `psexec.py`, `secretsdump.py`, `GetUserSPNs.py`, `lookupsid.py`, `ticketer.py`) | AD DCSync, Kerberoasting, Golden Ticket generation, and remote WMI execution (Stages 13–20) |
| **Adversary-in-the-Middle** | `responder` (source at `/usr/share/responder/`) | LLMNR/NBT-NS poisoning tool (transferred to DVWA for internal execution in Stage 10) |
| **Remote Access & Staging** | `ssh`, `scp` | Interactive management, persistence verification (Stage 08), staging tools to DVWA |

### Wordlists Configuration

The standard penetration testing wordlists are prepared and uncompressed:
```bash
# Uncompress the rockyou wordlist
sudo gzip -d /usr/share/wordlists/rockyou.txt.gz

# Confirm directory discovery wordlists
ls -la /usr/share/wordlists/dirb/common.txt
```

---

## 3. BloodHound Legacy 4.x Architecture

Kali runs the **BloodHound Legacy 4.x GUI** backed by a local Neo4j graph database instance:

- **Launch Wrapper:** `bloodhound-start` (automatically initializes Neo4j on `http://localhost:7474` and launches the Electron GUI).
- **Collection Engine:** `bloodhound-python` is installed via pip on Kali and staged to the internal DVWA pivot host via SCP during [Stage 12 — BloodHound Enumeration](../../02-Attack-Simulation/Stages/stage-12-bloodhound.md).
- **Ingestion:** The generated JSON/ZIP archive is copied back to Kali and imported directly into the BloodHound GUI for Cypher graph queries.

```bash
# Start Neo4j backend and BloodHound GUI
bloodhound-start
```

---

## 4. Pre-Simulation Staging Artifacts

Certain high-impact attack artifacts are staged prior to simulation runs:
- **Defacement Wallpaper (`hacked.bmp`):** Generated on the analyst host laptop and placed at `/tmp/hacked.bmp` on Kali. During [Stage 20 — Impact & Defacement](../../02-Attack-Simulation/Stages/stage-20-impact.md), Kali transfers `hacked.bmp` to the DVWA pivot via SCP, from which it is pushed across domain endpoints over SMB.

---

## 5. Verification Commands

```bash
# 1. Confirm IP address and link status
ip -br addr show eth0
# Expected: eth0  UP  192.168.232.135/24

# 2. Verify complete routing table
ip route show
# default via 192.168.232.2 dev eth0
# 192.168.56.0/24 via 192.168.232.162 dev eth0
# 192.168.232.0/24 dev eth0 proto kernel scope link src 192.168.232.135

# 3. Test static route to internal victim target
ip route get 192.168.56.30
# Expected: 192.168.56.30 via 192.168.232.162 dev eth0

# 4. Verify cloud range is isolated and unreachable from Kali
ping -c 2 10.122.0.4
# Expected: 100% packet loss (tunnel terminates on gateway, not Kali)

# 5. Confirm wordlist availability
wc -l /usr/share/wordlists/rockyou.txt
# Expected: 14344391 /usr/share/wordlists/rockyou.txt
```

---

## Related Documentation

- [Suricata Gateway](suricata-gateway.md) — Perimeter router & IDS sensor bridging Kali to victims
- [DVWA Web Target & Pivot](dvwa.md) — Initial access web target and internal pivot host
- [Lab Setup & Architecture](../README.md) — Complete 8-machine network topology and routing
- [Attack Simulation Directory](../../02-Attack-Simulation/README.md) — 20-stage attack campaign
