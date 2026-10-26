# Suricata Gateway — Router, Sensor, & WireGuard Client

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04 LTS (Noble Numbat) |
| **Role** | Dual-homed perimeter router · NIDS sensor · WireGuard VPN gateway |
| **Hostname** | `suricata-gateway` |
| **Resources** | 2–3 vCPU · 3 GB RAM |
| **Suricata Engine** | Version 8.0.6 (AF-PACKET passive IDS mode on dual interfaces: external `ens33` & internal `ens37`) |
| **Wazuh Agent** | `Suricata` |
| **SSH Management** | Dedicated administrative key (`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...<REDACTED_MANAGEMENT_KEY>... soc-analyst@management`) |

---

## 1. Role & Architectural Responsibilities

The Security Gateway serves as the **single physical and logical network chokepoint** between the adversary on the external NAT subnet and the victim hosts on the isolated internal network:

1. **Perimeter Layer 3 Router:** Forwards IP traffic between the external adversary segment (`192.168.232.0/24`, `ens33`) and the internal victim segment (`192.168.56.0/24`, `ens37`) using native Linux kernel forwarding.
2. **Passive Network IDS Sensor:** Runs Suricata 8.0.6 in AF-PACKET promiscuous mode across dual interfaces (`ens33` and `ens37`). It inspects all perimeter ingress packets arriving from the attacker on `ens33` as well as routed traffic and promiscuously sniffed intra-subnet frames on `ens37` without altering or delaying packet flow.
3. **Site-to-Cloud WireGuard Client:** Establishes a persistent encrypted UDP tunnel (`wg0: 10.8.0.2/32`) back to Cloud VM1 (`10.8.0.1`), routing all victim endpoint telemetry to the Cloud Wazuh SIEM (`10.122.1.4`) and TheHive (`10.122.0.4`).
4. **Log Telemetry Forwarder:** Runs a Wazuh Linux agent that monitors `/var/log/suricata/eve-alert.json` and forwards real-time network intrusion alerts to the cloud analysis engine.

---

## 2. Dual-NIC Network Configuration (`/etc/netplan/01-netcfg.yaml`)

| Interface | IP Address | Subnet / Segment | Connected Zone |
|-----------|------------|------------------|----------------|
| **`ens33`** | `192.168.232.162/24` | VMware VMnet8 (NAT) | External attacker segment (facing Kali `192.168.232.135`) & Internet uplink |
| **`ens37`** | `192.168.56.150/24` | VMware VMnet2 (Host-Only) | Isolated victim subnet (facing DC `.10`, Win10 `.20`, DVWA `.30`) |
| **`wg0`** | `10.8.0.2/32` | WireGuard Tunnel | Cloud transit network connecting to Hub `10.8.0.1` |

```yaml
network:
  version: 2
  ethernets:
    ens33:
      addresses:
        - 192.168.232.162/24
      routes:
        - to: default
          via: 192.168.232.2
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
    ens37:
      addresses:
        - 192.168.56.150/24
```

Apply and verify interface status:
```bash
sudo chmod 600 /etc/netplan/01-netcfg.yaml
sudo netplan apply
ip -br addr show
# ens33  UP  192.168.232.162/24
# ens37  UP  192.168.56.150/24
```

---

## 3. Persistent Kernel Routing & Firewall Forwarding

To route traffic between the adversary and victims without address distortion:

1. **IP Forwarding:** Enabled persistently via sysctl drop-in.
2. **No Masquerading (Zero NAT on Tunnel):** Standard NAT/SNAT is **not** applied to traffic leaving the victim network toward the cloud tunnel. This preserves authentic victim IP addresses (`192.168.56.10`, `.20`, `.30`) when communicating with the cloud Wazuh Manager.
3. **Persistent Forwarding Policy:** `iptables` FORWARD chain is set to ACCEPT and persisted.

```bash
# 1. Enable IPv4 forwarding persistently
sudo bash -c 'cat <<EOF > /etc/sysctl.d/99-ipforward.conf
net.ipv4.ip_forward = 1
EOF'
sudo sysctl -p /etc/sysctl.d/99-ipforward.conf

# 2. Configure iptables forwarding policy and save persistently
sudo apt-get install -y iptables-persistent netfilter-persistent
sudo iptables -P FORWARD ACCEPT
sudo netfilter-persistent save

# 3. Verify kernel routing table
ip route show
# default via 192.168.232.2 dev ens33 proto static
# 192.168.56.0/24 dev ens37 proto kernel scope link src 192.168.56.150
# 192.168.232.0/24 dev ens33 proto kernel scope link src 192.168.232.162
```

---

## 4. WireGuard Site-to-Cloud VPN Client (`/etc/wireguard/wg0.conf`)

Install WireGuard and establish the encrypted site-to-cloud tunnel connecting the local lab to the cloud infrastructure:

```bash
sudo apt-get install -y wireguard
```

Deploy `/etc/wireguard/wg0.conf`:
```ini
[Interface]
Address    = 10.8.0.2/32
PrivateKey = <REDACTED>
MTU        = 1420

[Peer]
PublicKey           = <REDACTED>
Endpoint            = <Cloud-VM1-Public-IP>:51820
AllowedIPs          = 10.8.0.0/24, 10.122.0.0/16
PersistentKeepalive = 25
```

Enable and start the WireGuard client tunnel:
```bash
sudo chmod 600 /etc/wireguard/wg0.conf
sudo systemctl enable --now wg-quick@wg0

# Verify tunnel connectivity and active handshake
sudo wg show
# interface: wg0
#   public key: ...
#   peer: ...
#     endpoint: <Cloud-VM1-Public-IP>:51820
#     allowed ips: 10.8.0.0/24, 10.122.0.0/16
#     latest handshake: 12 seconds ago
#     transfer: 4.21 MiB received, 8.15 MiB sent
```

Test reachability to Cloud SOC services:
```bash
ping -c 3 10.122.0.4  # TheHive / Hub VM
ping -c 3 10.122.1.4  # Wazuh SIEM VM
```

---

## 5. Suricata 8.0.6 Installation & Rule Configuration

Install the latest stable Suricata NIDS from the official Open Information Security Foundation (OISF) PPA:

```bash
# Add official OISF stable repository and install Suricata
sudo add-apt-repository ppa:oisf/suricata-stable -y
sudo apt-get update
sudo apt-get install -y suricata jq

# Update rule sources (ET Open and Nmap ruleset)
sudo suricata-update enable-source aleksibovellan/nmap
sudo suricata-update
```

### Signature Provisioning & Thresholding

The production rule baseline pulls from two active rule sources:
1. **`et/open`** — Emerging Threats Open ruleset.
2. **`aleksibovellan/nmap`** — Targeted Nmap scanning and OS probe detection rules.

Tuning and suppression files deployed:
- Custom detection rules: [`custom.rules`](../../03-Detection-Engineering/Suricata/custom.rules) $\rightarrow$ `/etc/suricata/rules/custom.rules`
- Alert rate-limiting & suppression: [`threshold.config`](../../03-Detection-Engineering/Suricata/threshold.config) $\rightarrow$ `/etc/suricata/rules/threshold.config`
- Class suppression (`disable.conf`): Suppresses noisy `protocol-command-decode` classtype events.
- Signature modification (`modify.conf`): Modifies SID 3400004 to monitor port 1514 (Wazuh event transport) alongside 51820 (WireGuard).

### Sensor Configuration (`/etc/suricata/suricata.yaml`)

```yaml
%YAML 1.1
---
vars:
  address-groups:
    HOME_NET: "[192.168.56.0/24]"
    EXTERNAL_NET: "[192.168.232.0/24,10.8.0.0/24]"
    HTTP_SERVERS: "[192.168.56.30]"
    SQL_SERVERS: "[192.168.56.30]"

default-rule-path: /etc/suricata/rules
rule-files:
  - suricata.rules
  - custom.rules

threshold-file: /etc/suricata/rules/threshold.config

# AF-PACKET Dual-Interface Promiscuous Sniffing (Perimeter Ingress & Victim Segment)
af-packet:
  - interface: ens33
    cluster-id: 99
    cluster-type: cluster_flow
    defrag: yes
    use-mmsg: yes
    ring-size: 2048
  - interface: ens37
    cluster-id: 98
    cluster-type: cluster_flow
    defrag: yes
    use-mmsg: yes
    ring-size: 2048

# Structured EVE JSON Outputs
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert:
            payload: yes
            payload-buffer-size: 4kb
            packet: yes
            metadata: yes
        - http:
            extended: yes
        - dns
        - tls
        - drop

  # Dedicated Filtered Alert File for Wazuh Ingestion
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve-alert.json
      types:
        - alert:
            payload: no
            metadata: yes
```

Validate configuration syntax and start the service:
```bash
# Verify Suricata configuration and rule syntax
sudo suricata -T -c /etc/suricata/suricata.yaml -v

# Restart and enable Suricata systemd service
sudo systemctl restart suricata
sudo systemctl enable suricata
```

---

## 6. Capture Scope & Dual-Interface Visibility

Suricata listens on dual interfaces—**`ens33`** (external perimeter ingress) and **`ens37`** (internal victim segment)—using AF-PACKET promiscuous capture:
- **Perimeter Ingress (`ens33`):** Captures incoming scans, exploits, and brute-force probes arriving from Kali (`192.168.232.135`), logging alerts with `in_iface: ens33` (e.g., Nmap SYN scans and OS detection probes in Stage 01).
- **Cross-Segment & Intra-Subnet (`ens37`):** All routed traffic delivered into the victim network (`192.168.56.0/24`) is inspected. Furthermore, promiscuous mode on VMware VMnet2 allows broadcast, multicast, and segment-level traffic directed toward or traversing the gateway interface to be observed (e.g., Kerberos TGS-REQ wire frames between DVWA and the Domain Controller in Stage 13).
- **Unicast Layer 2 Blind Spot:** Direct Layer 2 host-to-host unicast traffic that does not touch the gateway interface cannot be guaranteed on the wire, making endpoint agents (Wazuh & Sysmon) the authoritative detection layer for lateral movement.
- **Dual-Interface Inspection Accounting:** Because both `ens33` and `ens37` are monitored, routed packets crossing the gateway are evaluated upon ingress and again upon egress, producing separate alert records in raw logs (`in_iface: ens33` and `in_iface: ens37`). Operational incident metrics in TheHive are de-duplicated by the correlation pipeline (`custom-thehive`) to ensure cases represent discrete attack actions rather than double-counted packets.

---

## 7. Wazuh Agent Enrollment & Alert Forwarding

The Wazuh Linux agent is deployed on the gateway to ship filtered alerts (`eve-alert.json`) directly to the cloud Wazuh Manager:

```bash
# 1. Install Wazuh repository and agent
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import
sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee /etc/apt/sources.list.d/wazuh.list

sudo apt-get update
sudo WAZUH_MANAGER="10.122.1.4" WAZUH_AGENT_NAME="Suricata" apt-get install -y wazuh-agent
```

### Agent Configuration (`/var/ossec/etc/ossec.conf`)

Configure the localfile block to read Suricata's `eve-alert.json`:

```xml
<ossec_config>
  <client>
    <server>
      <address>10.122.1.4</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
  </client>

  <!-- Suricata EVE Alert JSON Stream -->
  <localfile>
    <log_format>json</log_format>
    <location>/var/log/suricata/eve-alert.json</location>
  </localfile>

  <!-- Gateway Authentication Logs -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>

  <!-- Gateway System Logs -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/syslog</location>
  </localfile>
</ossec_config>
```

Enable and start the agent:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent
```

---

## 8. Verification & Diagnostics Commands

```bash
# 1. Verify interface statuses and active IP addresses
ip -br addr show
# Expected: ens33 (192.168.232.162), ens37 (192.168.56.150), wg0 (10.8.0.2)

# 2. Check active WireGuard tunnel handshake
sudo wg show wg0
# Expected: latest handshake < 2 minutes ago

# 3. Test IP forwarding between segments
cat /proc/sys/net/ipv4/ip_forward
# Expected: 1

# 4. Verify Suricata service status and rule loading
sudo systemctl status suricata --no-pager
sudo suricata -T -c /etc/suricata/suricata.yaml -v

# 5. Tail live Suricata alert stream with jq
sudo tail -f /var/log/suricata/eve-alert.json | jq '{timestamp, src_ip, dest_ip, signature: .alert.signature}'

# 6. Verify Wazuh Agent connectivity to cloud manager (10.122.1.4:1514)
sudo /var/ossec/bin/wazuh-control status
nc -zv 10.122.1.4 1514
# Expected: Connection to 10.122.1.4 1514 port [tcp/*] succeeded!
```

---

## 9. Telemetry Sources Summary

| Source | File / Channel | What it captures |
|--------|----------------|-----------------|
| **Suricata EVE Full** | `/var/log/suricata/eve.json` | Complete flow metadata, HTTP/DNS/TLS protocol transactions, packet payloads |
| **Suricata EVE Alerts** | `/var/log/suricata/eve-alert.json` | High-confidence signature hits (port scans, exploits, web shells, reverse shells) |
| **Gateway Auth Log** | `/var/log/auth.log` | Administrative SSH logins, sudo activity on the gateway host |
| **Wazuh Agent (`Suricata`)** | TCP `1514` | Ingestion pipeline shipping EVE alerts to Wazuh Manager (`Rule 86601` / `100600`) |

---

## Related Documentation

- [Stage 01 — Reconnaissance](../../02-Attack-Simulation/Stages/stage-01-recon.md)
- [Stage 02 — Web Brute Force](../../02-Attack-Simulation/Stages/stage-02-bruteforce.md)
- [Stage 03 — SQL Injection](../../02-Attack-Simulation/Stages/stage-03-sqli.md)
- [Stage 05 — Webshell Upload](../../02-Attack-Simulation/Stages/stage-05-webshell.md)
- [Stage 06 — Reverse Shell](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md)
- [Stage 09 — Internal Discovery](../../02-Attack-Simulation/Stages/stage-09-internal-discovery.md)
- [Detection Engineering — Suricata Baseline](../../03-Detection-Engineering/Suricata/README.md)
- [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md)
