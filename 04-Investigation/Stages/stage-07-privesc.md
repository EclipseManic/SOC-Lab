# Investigation — Stage 07 — Privilege Escalation

> **Status:** Completed  
> **Attack stage:** [Stage 07](../../02-Attack-Simulation/Stages/stage-07-privesc.md)  
> **TheHive case:** [Web Application Compromise](../Cases/case-01-web-compromise.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | Logged in CSV (12x Rule `5402`) |
| **Rule ID** | Wazuh `5402` (PAM - Successful sudo to ROOT) / Auditd `web_process_creation` |
| **Source** | Linux Auth PAM / Auditd |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary abused a misconfigured SUID `/usr/bin/find` binary and executed commands escalating to `root`. Linux Auditd recorded the command execution under uid 33, and Wazuh PAM authentication logs captured successful root elevation (Rule 5402, 12 instances).

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Abuse of SUID misconfiguration on find binary allowing unprivileged www-data user to spawn a root shell and access sensitive system files. |

---

## Investigation steps

1. Verified Auditd execve events for /usr/bin/find with euid=0.
2. Analyzed command line arguments: find . -exec /bin/sh -p \;.
3. Confirmed subsequent file access event on /etc/shadow with key cat_sensitive_file.
4. Correlated with Wazuh Rule 100603 elevated alert in TheHive.
5. Marked Case 01 scope as fully escalated to local root.

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/17.png`](../../02-Attack-Simulation/Attack-Screenshots/17.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/6.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/6.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Binary | `/usr/bin/find` | SUID binary abused for escalation |
| File | `/etc/shadow` | Sensitive credential store accessed |
| EUID | `0 (root)` | Escalated effective user ID |

---

## Detection assessment

- **Status:** Detected (Host Alerted)
- **Gap ID:** None
- **Engineering Assessment:** Rule 100603 elevated to Level 8 ensured immediate transmission to TheHive 5 queue.

---

## Verdict

Confirmed True Positive local root privilege escalation via SUID find abuse.

---

## MITRE ATT&CK

- **Tactic:** Privilege Escalation
- **Technique:** Abuse Elevation Control Mechanism: Setuid and Setgid (T1548.001)
