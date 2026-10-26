# Wazuh SIEM VM — Detection Engine & Ingestion Pipeline

> Private SIEM stack — receives real-time telemetry from all monitored endpoints, applies decoders and tuned detection rules, and feeds correlated security alerts into TheHive 5 case management pipeline.  
> Operating on an isolated private cloud subnet (`10.122.1.0/24`) with no public IP, reachable strictly across private VNet peering from TheHive VM.

---

## 1. VM Specifications

| Property | Value |
|----------|-------|
| **Hostname** | `wazuh-siem` |
| **OS** | Ubuntu 24.04.4 LTS (Noble Numbat) |
| **RAM** | 8 GB |
| **vCPU** | 2 |
| **Disk** | 64 GB SSD |
| **Cloud Subnet** | `10.122.1.0/24` (within private `10.122.0.0/16` VPC) |
| **Private IP** | `10.122.1.4` |
| **Public IP** | None (100% private) |
| **Public Listeners** | None |
| **Access Method** | VNet peering from TheHive VM (`10.122.0.4`); analyst HTTPS access via WireGuard + NPM (`https://wazuh.lab`) |
| **SSH Management** | Host laptop key (`analyst@soc-workstation`) |

---

## 2. Network Configuration & Return Routing (Zero-NAT IP Preservation)

### Netplan Configuration (`/etc/netplan/01-netcfg.yaml`)

The Wazuh VM connects to the private VPC subnet `10.122.1.0/24`. To ensure that responses to on-prem victim agents (`192.168.56.0/24`) are correctly routed back through TheHive transit gateway (`10.122.0.4`) rather than being dropped, a persistent static route is defined:

```yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 10.122.1.4/24
      routes:
        - to: default
          via: 10.122.1.1
        # Persistent return route for on-prem victim endpoints
        - to: 192.168.56.0/24
          via: 10.122.0.4
        # Persistent return route for on-prem attack segment
        - to: 192.168.232.0/24
          via: 10.122.0.4
      nameservers:
        addresses:
          - 1.1.1.1
          - 8.8.8.8
```

Apply and verify the routing table:
```bash
sudo chmod 600 /etc/netplan/01-netcfg.yaml
sudo netplan apply
ip route show
# default via 10.122.1.1 dev eth0 proto static
# 10.122.1.0/24 dev eth0 proto kernel scope link src 10.122.1.4
# 192.168.56.0/24 via 10.122.0.4 dev eth0 proto static
# 192.168.232.0/24 via 10.122.0.4 dev eth0 proto static
```

### Telemetry Forwarding Topology

[![On-Prem to Cloud Telemetry Flow](../../06-Resources/Diagrams/On-Prem%20to%20Cloud%20Telemetry%20Flow.png)](../../06-Resources/Diagrams/On-Prem%20to%20Cloud%20Telemetry%20Flow.png)
*Figure 1: On-prem agent telemetry transit through the Suricata Gateway, WireGuard tunnel, and private VNet peering into Wazuh Manager.*

```
Victim Host (192.168.56.x)
  → Default Gateway: 192.168.56.150 (Suricata eth1)
    → WireGuard Tunnel Interface: wg0 (10.8.0.2)
      → Encrypted UDP 51820 Tunnel → TheHive VM (10.8.0.1 / 10.122.0.4)
        → Private Cloud VNet Peering (Low Latency Transit)
          → Wazuh SIEM Manager (10.122.1.4:1514/TCP)
```

> [!IMPORTANT]
> **Why Zero-NAT is Essential:**  
> The Suricata Gateway forwards raw victim agent telemetry through `wg0` without NAT masquerading. TheHive VM routes the packets across VNet peering to `10.122.1.4`. Because of the static return route `192.168.56.0/24 via 10.122.0.4`, Wazuh communicates directly with the real IPs (`192.168.56.10`, `.20`, `.30`), preserving authentic forensic source provenance in all alert indices.

---

## 3. Wazuh Stack Installation & Service Setup

The Wazuh all-in-one architecture comprises the Wazuh Indexer (Elasticsearch-compatible search engine), Wazuh Manager (analysis engine and daemon coordinator), and Wazuh Dashboard (web management interface).

```bash
# 1. Update system packages and install prerequisites
sudo apt-get update && sudo apt-get install -y curl apt-transport-https gnupg lsb-release

# 2. Add Wazuh GPG repository key and repository list
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee /etc/apt/sources.list.d/wazuh.list

# 3. Install Wazuh Manager, Indexer, and Dashboard (v4.14.8 stack)
sudo apt-get update
sudo apt-get install -y wazuh-manager wazuh-indexer wazuh-dashboard sqlite3 python3 python3-pip

# 4. Enable and start core stack services
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-indexer
sudo systemctl enable --now wazuh-manager
sudo systemctl enable --now wazuh-dashboard
```

---

## 4. Wazuh Manager Configuration (`/var/ossec/etc/ossec.conf`)

The core configuration file at `/var/ossec/etc/ossec.conf` dictates how the Wazuh engine receives events, handles authentication, evaluates detection rules, and triggers integrations.

The definitive production configuration file is archived at [`06-Resources/Configs/ossec.conf`](../../06-Resources/Configs/ossec.conf). Key configuration stanzas implemented during setup include:

### 1. Global Logging & Queue Buffering
```xml
<ossec_config>
  <global>
    <jsonout_output>yes</jsonout_output>
    <alerts_log>yes</alerts_log>
    <!-- logall_json: yes preserves 100% of raw events in /var/ossec/logs/archives/archives.json for forensic analysis -->
    <logall_json>yes</logall_json>
    <email_notification>no</email_notification>
    <agents_disconnection_time>15m</agents_disconnection_time>
    <agents_disconnection_alert_time>0</agents_disconnection_alert_time>
  </global>

  <alerts>
    <log_alert_level>3</log_alert_level>
    <email_alert_level>12</email_alert_level>
  </alerts>

  <!-- High-throughput agent telemetry ingestion listener -->
  <remote>
    <connection>secure</connection>
    <port>1514</port>
    <protocol>tcp</protocol>
    <queue_size>131072</queue_size>
  </remote>

  <!-- Authd agent automatic enrollment service -->
  <auth>
    <disabled>no</disabled>
    <port>1515</port>
    <use_source_ip>no</use_source_ip>
    <purge_infra>no</purge_infra>
    <use_password>no</use_password>
    <ssl_verify_host>no</ssl_verify_host>
    <ssl_auto_negotiate>yes</ssl_auto_negotiate>
  </auth>
```

### 2. TheHive Integration Block
```xml
  <!-- Tier 1 Synchronous Integration: Wazuh forks this script on every alert >= Level 8 -->
  <integration>
    <name>custom-thehive</name>
    <hook_url>http://10.122.0.4:9000/api/v1</hook_url>
    <api_key>[REDACTED]</api_key>
    <level>8</level>
    <alert_format>json</alert_format>
  </integration>
```

### 3. Ruleset, Custom Decoders, and CDB Lists
```xml
  <ruleset>
    <!-- Default ruleset directories -->
    <decoder_dir>ruleset/decoders</decoder_dir>
    <rule_dir>ruleset/rules</rule_dir>
    <!-- Suppress noisy default policy rule checks -->
    <rule_exclude>0215-policy_rules.xml</rule_exclude>

    <!-- Constant Database (CDB) lookup lists -->
    <list>etc/lists/audit-keys</list>
    <list>etc/lists/amazon/aws-eventnames</list>
    <list>etc/lists/security-eventchannel</list>
    <list>etc/lists/malicious-ioc/malware-hashes</list>
    <list>etc/lists/malicious-ioc/malicious-ip</list>
    <list>etc/lists/malicious-ioc/malicious-domains</list>
    <list>etc/lists/wazuh-internal-bins</list>

    <!-- Custom rules and decoders paths -->
    <decoder_dir>etc/decoders</decoder_dir>
    <rule_dir>etc/rules</rule_dir>
  </ruleset>
</ossec_config>
```

---

## 5. Constant Database (CDB) Lists Setup (`/var/ossec/etc/lists/`)

Wazuh uses Constant Database (CDB) binary files for ultra-fast $O(1)$ in-memory lookups during real-time event parsing. These lists allow detection rules to cross-reference command executables, file paths, and audit keys against defined catalogs without complex regex overhead.

### The `wazuh-internal-bins` Noise Suppression List

#### The Problem:
On Linux endpoints running Auditd (such as DVWA, `192.168.56.30`), the Wazuh agent's built-in `syscollector` module periodically executes system utilities (`dpkg-query`, `uname`, `ps`, `netstat`, `ip`) to gather software inventory, open ports, and running processes. Because Linux Auditd records all `execve` system calls, these routine inventory scans trigger an avalanche of Wazuh Rule `80792` ("Auditd: Command executed") events every hour, flooding the manager with thousands of false alerts.

#### The Solution:
We deploy a dedicated CDB list at `/var/ossec/etc/lists/wazuh-internal-bins` and reference it in custom rule `100280`:

```xml
<group name="audit,">
  <rule id="100280" level="0">
    <if_sid>80792</if_sid>
    <list field="audit.exe" lookup="match_key">etc/lists/wazuh-internal-bins</list>
    <description>Suppress Wazuh's own internal inventory scan noise</description>
  </rule>
</group>
```

#### List Entries (`/var/ossec/etc/lists/wazuh-internal-bins`):
The list is stored in standard CDB text format (`key:value` or `key:`):

```text
/usr/bin/dpkg-query:
/usr/bin/rpm:
/bin/uname:
/bin/ps:
/usr/bin/netstat:
/usr/sbin/ip:
/usr/bin/which:
/usr/bin/find:
/usr/bin/grep:
/usr/bin/sed:
/usr/bin/awk:
/usr/bin/cat:
/usr/bin/ls:
/usr/bin/basename:
/usr/bin/dirname:
/usr/bin/head:
/usr/bin/tail:
/usr/bin/wc:
/usr/bin/cut:
/usr/bin/tr:
/var/ossec/bin/wazuh-modulesd:
/var/ossec/bin/wazuh-syscheckd:
/var/ossec/bin/wazuh-execd:
/var/ossec/bin/wazuh-logcollector:
/var/ossec/bin/wazuh-agentd:
```

### Additional Configured CDB Lists

| List Path | Purpose | Key Usage |
|-----------|---------|-----------|
| `etc/lists/wazuh-internal-bins` | Suppress agent inventory scan loop noise | Matched by Rule `100280` (`level="0"`) on `audit.exe` |
| `etc/lists/audit-keys` | Maps audit rule tags to categories | Key lookups on `audit.key` (`ssh_key_access`, `cat_sensitive_file`) |
| `etc/lists/security-eventchannel` | Windows event channel classification | Maps Windows event IDs to security impact levels |
| `etc/lists/malicious-ioc/*` | Known bad hashes, IPs, and domains | Cross-checks incoming telemetry against local threat intel feeds |

### List Compilation & Permissions

Before Wazuh can load CDB lists, they must be compiled into `.cdb` binary format using `wazuh-makelists`:

```bash
# 1. Create the wazuh-internal-bins list file
sudo tee /var/ossec/etc/lists/wazuh-internal-bins << 'EOF'
/usr/bin/dpkg-query:
/usr/bin/rpm:
/bin/uname:
/bin/ps:
/usr/bin/netstat:
/usr/sbin/ip:
/usr/bin/which:
/usr/bin/find:
/usr/bin/grep:
/usr/bin/sed:
/usr/bin/awk:
/usr/bin/cat:
/usr/bin/ls:
/usr/bin/basename:
/usr/bin/dirname:
/usr/bin/head:
/usr/bin/tail:
/usr/bin/wc:
/usr/bin/cut:
/usr/bin/tr:
/var/ossec/bin/wazuh-modulesd:
/var/ossec/bin/wazuh-syscheckd:
/var/ossec/bin/wazuh-execd:
/var/ossec/bin/wazuh-logcollector:
/var/ossec/bin/wazuh-agentd:
EOF

# 2. Compile all lists in /var/ossec/etc/lists/ into .cdb binary tables
sudo /var/ossec/bin/wazuh-makelists

# 3. Set strict ownership and permissions
sudo chown -R root:wazuh /var/ossec/etc/lists
sudo chmod 750 /var/ossec/etc/lists
sudo chmod 660 /var/ossec/etc/lists/*

# 4. Verify compiled binary files exist
ls -la /var/ossec/etc/lists/wazuh-internal-bins*
# -rw-rw---- 1 root wazuh  512 Oct 24 14:00 wazuh-internal-bins
# -rw-rw---- 1 root wazuh 2048 Oct 24 14:00 wazuh-internal-bins.cdb
```

---

## 6. Custom Decoders & Detection Rules Deployment

Custom decoders parse unstructured log streams into indexed fields, while custom rules detect attacker techniques across the 20 attack simulation stages.

### 1. Deploying Custom Decoders (`/var/ossec/etc/decoders/local_decoder.xml`)
Deployed directly from [`03-Detection-Engineering/Wazuh/local_decoder.xml`](../../03-Detection-Engineering/Wazuh/local_decoder.xml) to handle Suricata JSON payloads, Auditd fields, and Windows command-line extraction:

```bash
sudo cp /path/to/SOC-Lab/03-Detection-Engineering/Wazuh/local_decoder.xml /var/ossec/etc/decoders/local_decoder.xml
sudo chown root:wazuh /var/ossec/etc/decoders/local_decoder.xml
sudo chmod 660 /var/ossec/etc/decoders/local_decoder.xml
```

### 2. Deploying Custom Detection Rules (`/var/ossec/etc/rules/local_rules.xml`)
Deployed directly from [`03-Detection-Engineering/Wazuh/local_rules.xml`](../../03-Detection-Engineering/Wazuh/local_rules.xml) (over 1,300 lines of custom rules covering MITRE ATT&CK techniques, LOLBins, web shells, Kerberoasting, DCSync, pass-the-hash, and 87 noise suppression rules):

```bash
sudo cp /path/to/SOC-Lab/03-Detection-Engineering/Wazuh/local_rules.xml /var/ossec/etc/rules/local_rules.xml
sudo chown root:wazuh /var/ossec/etc/rules/local_rules.xml
sudo chmod 660 /var/ossec/etc/rules/local_rules.xml
```

### 3. Syntax Validation & Rule Testing
Before restarting the manager, validate the ruleset integrity:

```bash
# Test rule configuration syntax
sudo /var/ossec/bin/wazuh-analysisd -t
# Output must return: "Configuration OK."

# Interactive log test to verify rule matching (e.g. testing Impacket wmiexec rule 100613)
sudo /var/ossec/bin/wazuh-logtest
```

---

## 7. Two-Tier Asynchronous TheHive Integration (`thecustomhive`)

[![Wazuh-TheHive Neon Alert Pipeline](../../06-Resources/Diagrams/Wazuh-TheHive%20Neon%20Alert%20Pipeline.png)](../../06-Resources/Diagrams/Wazuh-TheHive%20Neon%20Alert%20Pipeline.png)
*Figure 2: Two-tier asynchronous alert correlation pipeline from Wazuh Manager Level ≥ 8 trigger into TheHive 5 case management.*

```
Agent / Suricata Event
  → Wazuh Manager Analysis Engine (local_rules.xml evaluation)
    → Alert Level >= 8 Triggered
      → /var/ossec/integrations/custom-thehive (Tier 1: O(1) SQLite WAL queue - ZERO HTTP)
        → thehive-flush.service (Tier 2: Async Correlation Daemon on 5s loop)
          → HTTP POST over VNet peering (http://10.122.0.4:9000/api/v1)
            → TheHive 5 Case Management (46 Grouped Cases)
              → Analyst Triage Queue
```

To eliminate latency and prevent dropped alerts under high burst volumes, the integration operates in two distinct tiers:

### Tier 1: Synchronous POSIX Ingestion Wrapper
When an alert with `level >= 8` fires, Wazuh executes `/var/ossec/integrations/custom-thehive` synchronously. To ensure zero blocking on the analysis engine, this script reads the JSON alert file and immediately inserts it into an SQLite WAL database (`/var/ossec/logs/correlation_state.db`) with zero network I/O:

```bash
# 1. Install the wrapper script from repository resources
sudo cp /path/to/SOC-Lab/06-Resources/Scripts/custom-thehive /var/ossec/integrations/custom-thehive
sudo chmod 750 /var/ossec/integrations/custom-thehive
sudo chown root:wazuh /var/ossec/integrations/custom-thehive

# 2. Initialize the SQLite correlation database
sudo sqlite3 /var/ossec/logs/correlation_state.db "
CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_json TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
);
PRAGMA journal_mode=WAL;
"
sudo chown root:wazuh /var/ossec/logs/correlation_state.db*
sudo chmod 660 /var/ossec/logs/correlation_state.db*
```

### Tier 2: Asynchronous Correlation Daemon (`thehive-flush.service`)
The daemon script [`custom-thehive.py`](../../06-Resources/Scripts/custom-thehive.py) runs as a background systemd service on a 5-second polling loop. It reads queued events, groups bursts, deduplicates identical alerts, applies the tool catalog [`tool_fingerprints.json`](../../06-Resources/Scripts/tool_fingerprints.json), and delivers correlated alert batches to TheHive REST API across private VNet peering:

```bash
# 1. Copy the correlation engine script and fingerprint catalog
sudo cp /path/to/SOC-Lab/06-Resources/Scripts/custom-thehive.py /var/ossec/integrations/custom-thehive.py
sudo cp /path/to/SOC-Lab/06-Resources/Scripts/tool_fingerprints.json /var/ossec/integrations/tool_fingerprints.json
sudo chmod 750 /var/ossec/integrations/custom-thehive.py
sudo chown root:wazuh /var/ossec/integrations/custom-thehive.py /var/ossec/integrations/tool_fingerprints.json

# 2. Deploy the systemd service unit
sudo tee /etc/systemd/system/thehive-flush.service << 'EOF'
[Unit]
Description=TheHive Alert Flush Daemon
After=network.target wazuh-manager.service

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /var/ossec/integrations/custom-thehive.py --flush-daemon
Restart=always
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF

# 3. Enable and start the flush service
sudo systemctl daemon-reload
sudo systemctl enable --now thehive-flush.service
```

---

## 8. Enrolled Agents & Management

Four agents forward telemetry to this Wazuh Manager over `1514/TCP`:

| Agent ID | Agent Name | Host Machine | IP Address | Operating System | Primary Log Sources |
|:---:|------------|--------------|------------|------------------|---------------------|
| `001` | **Suricata** | Suricata Gateway | `192.168.56.150` | Ubuntu 24.04 LTS | Suricata `eve.json` NIDS alerts |
| `002` | **DVWA** | DVWA Web Server | `192.168.56.30` | Ubuntu 24.04 LTS | Apache access/error logs, Linux Auditd, PAM |
| `003` | **Win10User** | Windows 10 Workstation | `192.168.56.20` | Windows 10 Pro N (22H2) | Sysmon (EID 1, 3, 7, 11), Security EID 4688, PowerShell EID 4104 |
| `004` | **DomainWin10** | Domain Controller (PC-DC) | `192.168.56.10` | Windows Server 2022 | Active Directory DS Access, Kerberos EID 4769/4768, Sysmon, Directory Changes |

### Enrolling Agents via `wazuh-authd`

Endpoints enroll dynamically using `wazuh-agent-auth` or environment variables on agent install:

```bash
# Example agent enrollment executed on Linux victim endpoints (DVWA / Suricata):
WAZUH_MANAGER="10.122.1.4" sudo -E apt-get install wazuh-agent
sudo systemctl enable --now wazuh-agent

# Example agent enrollment executed on Windows endpoints (PowerShell Administrator):
Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.14.8-1.msi -OutFile ${env:TEMP}\wazuh-agent.msi
msiexec.exe /i ${env:TEMP}\wazuh-agent.msi /q WAZUH_MANAGER='10.122.1.4' WAZUH_AGENT_NAME='DomainWin10'
Start-Service -Name "Wazuh"
```

Verify active agent registrations from the Wazuh Manager:
```bash
sudo /var/ossec/bin/agent_control -l
# Wazuh agent_control output:
# ID: 001, Name: Suricata, IP: 192.168.56.150, Active
# ID: 002, Name: DVWA, IP: 192.168.56.30, Active
# ID: 003, Name: Win10User, IP: 192.168.56.20, Active
# ID: 004, Name: DomainWin10, IP: 192.168.56.10, Active
```

---

## 9. Firewall & Network Access Control

All traffic enters exclusively across private VNet peering from TheHive VM (`10.122.0.4`) or the WireGuard tunnel pool (`10.8.0.0/24`). No ports are exposed to the public internet:

| Port | Protocol | Source | Purpose |
|------|----------|--------|---------|
| `1514` | TCP | On-prem agents (`192.168.56.0/24` via WireGuard) | Encrypted event ingestion |
| `1515` | TCP | On-prem agents (`192.168.56.0/24` via WireGuard) | Agent auto-enrollment (`wazuh-authd`) |
| `443` | TCP | Analyst Workstation (via WireGuard + NPM) | Wazuh Dashboard Web UI (`https://wazuh.lab`) |
| `9200` | TCP | TheHive VM / Localhost | Wazuh Indexer REST API |
| `9000` | TCP (Egress) | Wazuh VM to TheHive VM (`10.122.0.4`) | Pushing correlated alert batches via `thehive-flush.service` |

---

## 10. Verification & Diagnostics Commands

Run the following checks to confirm complete system operational readiness:

```bash
# 1. Verify active listening ports on Wazuh SIEM
sudo ss -ltnp | grep -E '1514|1515|9200|443'
# LISTEN  0  128  0.0.0.0:1514  0.0.0.0:*  users:(("wazuh-remoted",pid=...))
# LISTEN  0  128  0.0.0.0:1515  0.0.0.0:*  users:(("wazuh-authd",pid=...))
# LISTEN  0  128  127.0.0.1:9200 0.0.0.0:*  users:(("java",pid=...))

# 2. Check service status for core components
sudo systemctl status wazuh-manager --no-pager
sudo systemctl status wazuh-indexer --no-pager
sudo systemctl status wazuh-dashboard --no-pager
sudo systemctl status thehive-flush.service --no-pager

# 3. Verify CDB list compilation and integrity
ls -lh /var/ossec/etc/lists/*.cdb

# 4. Check SQLite WAL queue depth and pending status
sudo sqlite3 /var/ossec/logs/correlation_state.db "SELECT status, count(*) FROM queue GROUP BY status;"

# 5. Check real-time integration daemon activity
sudo journalctl -u thehive-flush.service -n 50 --no-pager

# 6. Verify network reachability to TheHive API over private VNet peering
nc -zv 10.122.0.4 9000
# Connection to 10.122.0.4 9000 port [tcp/*] succeeded!
```

---

## Related Documentation

| Reference | Category | Description |
|-----------|----------|-------------|
| [thehive.md](thehive.md) | Cloud Setup | TheHive VM — WireGuard, routing, and case management |
| [Wazuh Detection Rules](../../03-Detection-Engineering/Wazuh/README.md) | Detection Engineering | Complete documentation of `local_rules.xml` and rule architecture |
| [Wazuh Decoders Catalog](../../03-Detection-Engineering/Wazuh/README.md#3-decoders-catalog-local_decoderxml) | Detection Engineering | Custom decoders catalog in `local_decoder.xml` |
| [Wazuh Manager Config](../../06-Resources/Configs/ossec.conf) | Server Config | Full production `ossec.conf` file |
| [CDB Internal Bins List](../../06-Resources/Configs/lists/wazuh-internal-bins) | CDB List | Binary lookup table suppressing syscollector auditd loop |
| [custom-thehive Pipeline](../../03-Detection-Engineering/README.md#5-telemetry-architecture-live-soar-ingestion-vs-analyst-dashboard-triage) | Pipeline Architecture | Two-tier correlation engine and alert grouping design |
