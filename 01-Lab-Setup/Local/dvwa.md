# DVWA — Web Application Target & Internal Pivot

| Property | Value |
|----------|-------|
| **OS** | Ubuntu 24.04 LTS (Noble Numbat) |
| **Role** | Vulnerable web application target · internal adversary pivot host · DMZ edge |
| **Hostname** | `dvwa` |
| **Network Interfaces** | Dual-homed: `ens33` (`192.168.56.30/24`, VMnet2) & `ens37` (`192.168.232.161/24`, VMnet8) |
| **Default gateway** | `192.168.56.150` (via `ens33`) |
| **Primary DNS** | `192.168.56.10` (`PC-DC.ad.lab`) |
| **Resources** | 2 vCPU · 4 GB RAM |
| **Wazuh agent** | `DVWA` |
| **Velociraptor** | Client v0.77.1 |
| **SSH Management** | Dedicated administrative key (`ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...<REDACTED_MANAGEMENT_KEY>... soc-analyst@management`) |

---

## 1. Network Configuration (`/etc/netplan/01-netcfg.yaml`)

DVWA functions as a dual-homed DMZ edge web server bridging the external management/attacker network (`192.168.232.0/24`, VMware VMnet8 NAT) and the isolated internal enterprise segment (`192.168.56.0/24`, VMware VMnet2 Host-Only):

- **`ens33` (`192.168.56.30/24`):** Connects to the internal enterprise segment (VMnet2). All outbound victim traffic is routed through the Security Gateway (`192.168.56.150`), and internal name resolution is handled by the Domain Controller (`192.168.56.10`).
- **`ens37` (`192.168.232.161/24`):** Connects to the external/NAT segment (VMnet8), allowing direct DMZ ingress and egress from the Kali Linux attacker machine (`192.168.232.135`) during initial exploitation (such as the Stage 06 reverse shell callback).

```yaml
network:
  version: 2
  ethernets:
    ens33:
      addresses:
        - 192.168.56.30/24
      routes:
        - to: default
          via: 192.168.56.150
      nameservers:
        addresses:
          - 192.168.56.10
    ens37:
      addresses:
        - 192.168.232.161/24
```

Apply and verify the network configuration:
```bash
sudo chmod 600 /etc/netplan/01-netcfg.yaml
sudo netplan apply
ip route show
# default via 192.168.56.150 dev ens33 proto static
# 192.168.56.0/24 dev ens33 proto kernel scope link src 192.168.56.30
# 192.168.232.0/24 dev ens37 proto kernel scope link src 192.168.232.161
```

---

## 2. Web Stack & Database Provisioning (LAMP)

Install the core web and database packages:
```bash
# Update repositories and install LAMP stack
sudo apt-get update
sudo apt-get install -y apache2 php php-mysqli php-gd mariadb-server git curl
```

### MariaDB Database Provisioning

Create the dedicated database and user credentials for DVWA:
```bash
# Configure MariaDB database and user
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS dvwa;
CREATE USER IF NOT EXISTS 'dvwa'@'localhost' IDENTIFIED BY '<REDACTED>';
GRANT ALL PRIVILEGES ON dvwa.* TO 'dvwa'@'localhost';
FLUSH PRIVILEGES;
EOF
```

### DVWA Application Installation & Hardening Adjustments

```bash
# Clone the official Damn Vulnerable Web Application repository
cd /var/www/html
sudo git clone https://github.com/digininja/DVWA.git dvwa

# Set proper ownership and permissions for the Apache web server user
sudo chown -R www-data:www-data /var/www/html/dvwa
sudo chmod -R 755 /var/www/html/dvwa
sudo chmod -R 777 /var/www/html/dvwa/hackable/uploads

# Deploy application configuration
sudo cp /var/www/html/dvwa/config/config.inc.php.dist /var/www/html/dvwa/config/config.inc.php
```

Configure `/var/www/html/dvwa/config/config.inc.php` to set the database credentials and force the security level to `low`:
```php
<?php
// /var/www/html/dvwa/config/config.inc.php
$_DVWA = array();
$_DVWA[ 'db_server' ]   = getenv('DB_SERVER') ?: '127.0.0.1';
$_DVWA[ 'db_database' ] = getenv('DB_DATABASE') ?: 'dvwa';
$_DVWA[ 'db_user' ]     = getenv('DB_USER') ?: 'dvwa';
$_DVWA[ 'db_password' ] = getenv('DB_PASSWORD') ?: 'p@ssw0rd';
$_DVWA[ 'db_port' ]     = getenv('DB_PORT') ?: '3306';

// Enforce LOW security level for detection engineering evaluation
$_DVWA[ 'default_security_level' ] = getenv('DEFAULT_SECURITY_LEVEL') ?: 'low';
$_DVWA[ 'default_phpids_level' ]   = 'disabled';
$_DVWA[ 'default_phpids_verbose' ] = 'false';
?>
```

Enable required PHP configurations in `/var/www/html/dvwa/php.ini` and `/etc/php/8.3/apache2/php.ini`:
```ini
magic_quotes_gpc = Off
allow_url_fopen = on
allow_url_include = on
display_errors = Off
```

### Pre-Installed Core System Utilities

To support simulation monitoring and initial pivot staging, the following permanent packages are confirmed on the base image:
- **`nmap`** (`/usr/bin/nmap`) — used during internal segment sweeps (Stage 09).
- **`python3`** (`Python 3.13.15`) — used for interactive pty shell invocation (Stage 07).
- **`pip3`** (`pip 24.0`) — used for offline package dependency resolution.

> [!NOTE]
> Attack-specific tools (such as Impacket, BloodHound-python, and Responder) are **not** permanently pre-installed in the clean base image; they are transferred dynamically from Kali via SCP during active attack execution.

Restart Apache to activate changes:
```bash
sudo systemctl restart apache2
```

---

## 3. Administrative Misconfiguration (Sudoers Privilege Escalation)

To evaluate host-level privilege escalation detection (Stage 07) under authentic conditions, a real-world administrative misconfiguration is provisioned via `/etc/sudoers.d/dvwa`:

```bash
# Allow www-data to execute python3 as root without a password prompt
echo 'www-data ALL=(ALL) NOPASSWD: /usr/bin/python3' | sudo tee /etc/sudoers.d/dvwa
sudo chmod 0440 /etc/sudoers.d/dvwa

# Validate sudoers syntax
sudo visudo -c
```

> [!IMPORTANT]
> **Lab Baseline Scope:** Only the vulnerable web application, database, and sudoers entry are created during lab setup. Red-team artifacts—such as the uploaded web shell (`shell.php`), netcat reverse shells, or modified SSH persistence keys—are **never** pre-configured. They are created dynamically by the adversary tradecraft during campaign execution.

---

## 4. Linux Auditd Deployment & Rule Enforcement

A tailored 58-line audit ruleset ([`audit.rules`](../../03-Detection-Engineering/Auditd/audit.rules)) is deployed to `/etc/audit/rules.d/audit.rules`. Instead of generating millions of noisy syscall events that thrash VM disk I/O, the rules specifically target high-signal adversary techniques:

- **Web Server Child Execution:** Audits all `execve` calls spawned under the `www-data` service account (`uid=33`) under key `web_process_creation`.
- **Staging Directory Execution:** Traces executable execution originating from `/tmp` and `/opt`.
- **SUID Backdoors & Privilege Escalation:** Audits `chmod`/`fchmod` invocations setting the SUID bit (`a2&04000`), and `setuid`/`setgid` syscalls.
- **Identity & Persistence File Watches:** Monitors write and attribute changes (`-p wa`) to `/etc/passwd`, `/etc/shadow`, `/etc/sudoers`, and `/root/.ssh`.
- **Kernel Immutability (`-e 2`):** Locks the audit configuration into kernel memory until the next system reboot, preventing adversary tampering.

```bash
# 1. Install auditd and plugins
sudo apt-get install -y auditd audispd-plugins

# 2. Deploy project audit ruleset
sudo bash -c 'cat <<EOF > /etc/audit/rules.d/audit.rules
## Buffer Size & Failure Flags
-D
-b 8192
-f 1

## Web Service Child Process Execution Tracking (uid=33 www-data)
-a always,exit -F arch=b64 -S execve -F uid=33 -k web_process_creation
-a always,exit -F arch=b32 -S execve -F uid=33 -k web_process_creation

## Untrusted Staging Execution Tracking (/tmp and /opt)
-a always,exit -F arch=b64 -S execve -F dir=/tmp -k staging_exec
-a always,exit -F arch=b32 -S execve -F dir=/tmp -k staging_exec
-a always,exit -F arch=b64 -S execve -F dir=/opt -k staging_exec
-a always,exit -F arch=b32 -S execve -F dir=/opt -k staging_exec

## SUID Modification & Privilege Escalation
-a always,exit -F arch=b64 -S chmod,fchmod,fchmodat -F a2&04000 -k suid_modification
-a always,exit -F arch=b32 -S chmod,fchmod,fchmodat -F a2&04000 -k suid_modification
-a always,exit -F arch=b64 -S setuid,setgid,setreuid,setregid -k priv_escalation
-a always,exit -F arch=b32 -S setuid,setgid,setreuid,setregid -k priv_escalation

## System Identity & Persistence Watches
-w /etc/passwd -p wa -k identity_modification
-w /etc/shadow -p wa -k identity_modification
-w /etc/sudoers -p wa -k identity_modification
-w /etc/sudoers.d/ -p wa -k identity_modification
-w /root/.ssh -p wa -k ssh_key_modification

## Make Configuration Immutable Until Next Reboot
-e 2
EOF'

# 3. Compile and load audit rules into kernel
sudo augenrules --load
sudo auditctl -s
```

---

## 5. Custom Bash Command Auditing Pipeline (`bashcmd`)

Standard Linux auditd records `execve` system calls, but does not capture built-in shell commands (e.g., `cd`, `echo`, `export`) or structured interactive context without massive overhead. A customized logging pipeline captures every shell command executed by `root`, `www-data`, or standard users to `/var/log/bashcmd.log`.

### 1. Shell Hook Deployment

Add the audit hook to global shell configuration files (`/etc/bash.bashrc` and `/etc/profile`):

```bash
# Append command logging hook to global bashrc and profile
sudo bash -c 'cat <<EOF >> /etc/bash.bashrc

# Enterprise Bash Command Telemetry Hook
export PROMPT_COMMAND='\''logger -p local0.notice -t bashcmd "uid:\$(id -u) user:\$(id -un) pwd:\$(pwd) cmd:\$(history 1 | sed "s/^[ ]*[0-9]*[ ]*//")"'\''
EOF'

sudo bash -c 'cat <<EOF >> /etc/profile

# Enterprise Bash Command Telemetry Hook
export PROMPT_COMMAND='\''logger -p local0.notice -t bashcmd "uid:\$(id -u) user:\$(id -un) pwd:\$(pwd) cmd:\$(history 1 | sed "s/^[ ]*[0-9]*[ ]*//")"'\''
EOF'
```

### 2. Rsyslog Channel Configuration (`/etc/rsyslog.d/50-bashcmd.conf`)

Route all `local0.notice` events tagged with `bashcmd` into a dedicated log file:

```bash
# Configure dedicated rsyslog file drop-in
sudo bash -c 'cat <<EOF > /etc/rsyslog.d/50-bashcmd.conf
if \$programname == "bashcmd" then /var/log/bashcmd.log
& stop
EOF'

# Create log file with secure ownership and restart rsyslog
sudo touch /var/log/bashcmd.log
sudo chown syslog:adm /var/log/bashcmd.log
sudo chmod 640 /var/log/bashcmd.log
sudo systemctl restart rsyslog
```

This generates clean, structured records parsed directly by Wazuh's custom decoder:
```text
uid:0 user:root pwd:/root cmd:whoami
uid:33 user:www-data pwd:/var/www/html cmd:python3 -c "import pty; pty.spawn('/bin/bash')"
```

---

## 6. Wazuh Agent Enrollment & Configuration

Install and register the Wazuh Linux Agent to forward all system and application logs to the cloud Wazuh Manager (`10.122.1.4`):

```bash
# 1. Add Wazuh repository key and package source
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | sudo gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import
sudo chmod 644 /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | sudo tee /etc/apt/sources.list.d/wazuh.list

# 2. Install Wazuh Agent with Manager IP and Agent Name
sudo apt-get update
sudo WAZUH_MANAGER="10.122.1.4" WAZUH_AGENT_NAME="DVWA" apt-get install -y wazuh-agent
```

### Agent Configuration (`/var/ossec/etc/ossec.conf`)

Configure the local log file collectors to monitor Apache, Linux Auditd, custom bashcmd, and authentication logs:

```xml
<ossec_config>
  <client>
    <server>
      <address>10.122.1.4</address>
      <port>1514</port>
      <protocol>tcp</protocol>
    </server>
    <config-profile>ubuntu, ubuntu24, ubuntu24.04</config-profile>
  </client>

  <!-- Apache Access Log -->
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/apache2/access.log</location>
  </localfile>

  <!-- Apache Error Log -->
  <localfile>
    <log_format>apache</log_format>
    <location>/var/log/apache2/error.log</location>
  </localfile>

  <!-- Linux Auditd System Log -->
  <localfile>
    <log_format>audit</log_format>
    <location>/var/log/audit/audit.log</location>
  </localfile>

  <!-- Custom Bash Command Execution Log -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/bashcmd.log</location>
  </localfile>

  <!-- Linux Authentication & Authorization Log -->
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>
</ossec_config>
```

Start and enable the agent daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now wazuh-agent
```

---

## 7. Velociraptor DFIR Client Installation

The Velociraptor Linux client connects to the cloud server (`https://10.122.0.4:8000/`) through the WireGuard tunnel for incident triage and live memory/disk forensics:

```bash
# Install and register Velociraptor client as a systemd service
sudo /usr/local/bin/velociraptor_client --config /etc/velociraptor/client.config.yaml service install

# Verify service status and enrolled client ID
sudo systemctl status velociraptor_client
# Active: active (running); Enrolled Client ID: C.34fd07e6c2ec0623
```

- **Client Binary:** `/usr/local/bin/velociraptor_client` (v0.77.1 amd64)
- **Configuration:** `/etc/velociraptor/client.config.yaml`
- **Writeback State:** `/etc/velociraptor.writeback.yaml` (contains local RSA client identity)

---

## 8. Verification & Diagnostics Commands

```bash
# 1. Test Apache web server and DVWA access
curl -I http://localhost/dvwa/login.php
# Expected: HTTP/1.1 200 OK

# 2. Verify auditd status and loaded rules
sudo auditctl -s
sudo auditctl -l | grep -E "web_process_creation|suid_modification"

# 3. Test bashcmd logging pipeline
logger -p local0.notice -t bashcmd "uid:0 user:root pwd:/root cmd:id"
tail -n 1 /var/log/bashcmd.log
# Expected: uid:0 user:root pwd:/root cmd:id

# 4. Confirm Wazuh Agent connectivity to cloud manager (10.122.1.4:1514)
sudo /var/ossec/bin/wazuh-control status
nc -zv 10.122.1.4 1514
# Expected: Connection to 10.122.1.4 1514 port [tcp/*] succeeded!

# 5. Verify sudoers execution permissions for www-data
sudo -u www-data sudo -l
# Expected: (ALL) NOPASSWD: /usr/bin/python3
```

---

## 9. Telemetry Sources Summary

| Source | File / Channel | What it captures |
|--------|----------------|-----------------|
| **Apache Access / Error** | `/var/log/apache2/*.log` | Inbound HTTP scans (Nikto), Python brute force (`dvwa_bruteforce.py`), SQL injection, webshell requests |
| **Auditd Syscall Log** | `/var/log/audit/audit.log` | `execve` calls by `www-data` (Rule 100199), SUID changes, `/etc/passwd` modifications |
| **Bashcmd Log** | `/var/log/bashcmd.log` | Interactive command executions (`whoami`, `Responder.py`, `impacket`) via custom decoder |
| **Auth Log** | `/var/log/auth.log` | SSH key logins, sudo elevation (`sudo python3`), PAM authentication failures |
| **Wazuh Agent (`DVWA`)** | TCP `1514` | Real-time security telemetry forwarder to cloud manager (`10.122.1.4`) |
| **Velociraptor Client** | TCP `8000` via WireGuard | Live process inspection, timeline artifact dumps, forensic disk collections |

---

## Related Documentation

- [Stage 03 — SQL Injection](../../02-Attack-Simulation/Stages/stage-03-sqli.md)
- [Stage 05 — Webshell Upload](../../02-Attack-Simulation/Stages/stage-05-webshell.md)
- [Stage 06 — Reverse Shell](../../02-Attack-Simulation/Stages/stage-06-reverse-shell.md)
- [Stage 07 — Privilege Escalation](../../02-Attack-Simulation/Stages/stage-07-privesc.md)
- [Stage 08 — SSH Persistence](../../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md)
- [Stage 10 — Responder Poisoning](../../02-Attack-Simulation/Stages/stage-10-responder.md)
- [Detection Engineering — Auditd Baseline](../../03-Detection-Engineering/Auditd/README.md)
- [Detection Engineering — Wazuh README](../../03-Detection-Engineering/Wazuh/README.md#3-decoders-catalog-local_decoderxml)
