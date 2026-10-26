# Investigation — Stage 07 — Privilege Escalation

> **Status:** Draft, not yet validated  
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

Adversary exploited an insecure sudoers misconfiguration permitting passwordless execution of `/usr/bin/python3` (GTFOBins) from unprivileged account `www-data`. Linux Auditd recorded the command execution under uid 33, and Wazuh PAM authentication logs captured successful root elevation (Rule 5402, 12 instances).

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Abuse of passwordless sudoers misconfiguration on `/usr/bin/python3` allowing unprivileged www-data user to spawn a root bash shell. |

---

## Investigation steps

1. Verified Auditd execve events for `/usr/bin/python3` with euid=0.
2. Analyzed command line arguments: `sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'`.
3. Confirmed Wazuh Rule 5402 (PAM: Successful sudo to ROOT) triggered 12 times.
4. Correlated with bash process creation under root context.
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
| Binary | `/usr/bin/python3` | Sudoers NOPASSWD binary abused for root escalation |
| Command | `sudo /usr/bin/python3 -c 'import os; os.system("/bin/bash")'` | GTFOBins root escape execution |
| EUID | `0 (root)` | Escalated effective user ID |

---

## Detection assessment

- **Status:** Detected (Host Alerted)
- **Gap ID:** None
- **Engineering Assessment:** PAM Rule 5402 and Auditd execve logging captured the sudo transition and child bash shell with zero latency.

---

## Verdict

Confirmed True Positive local root privilege escalation via passwordless sudo Python GTFOBins execution.

---

## MITRE ATT&CK

- **Tactic:** Privilege Escalation
- **Technique:** Abuse Elevation Control Mechanism: Setuid and Setgid (T1548.001)
