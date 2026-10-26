# Investigation — Stage 08 — SSH Persistence

> **Status:** In Progress  
> **Attack stage:** [Stage 08](../../02-Attack-Simulation/Stages/stage-08-ssh-persistence.md)  
> **TheHive case:** [Lateral Movement and Credential Access](../Cases/case-02-lateral-movement.md)  

---

## Alert details

| Field | Value |
|---|---|
| **Alert ID** | `wzb-1208f0ea54` |
| **Rule ID** | Wazuh `5715` (Elevated Level 8) / Wazuh `550` (Syscheck FIM) |
| **Source** | Linux SSHD / Wazuh Syscheck |
| **Severity** | High |
| **TLP / PAP** | `TLP:AMBER / PAP:AMBER` |

---

## What was detected

Adversary appended an SSH public key to `/root/.ssh/authorized_keys` and initiated direct root SSH logons from Kali (`192.168.232.135`). Wazuh Syscheck flagged the authorized_keys modification, and Wazuh Rule 5715 (elevated to Level 8) alerted on the interactive root SSH session.

---

## Triage

| Question | Answer |
|---|---|
| **Verdict** | True Positive |
| **Confidence** | High |
| **Rationale** | Unauthorized addition of an external SSH public key to root authorized_keys followed by interactive SSH login. |

---

## Investigation steps

1. Inspected Auditd file watch events on /root/.ssh/authorized_keys.
2. Verified sshd authlog (/var/log/auth.log) for Accepted publickey for root from 192.168.232.135.
3. Confirmed Wazuh Rule 5715 raised to Level 8 for TheHive forwarding.
4. Identified attacker SSH session as the active pivot channel for domain lateral movement.
5. Linked alert to Case 02 (Lateral Movement).

---

## Evidence

- **Attack Evidence:** [`../../02-Attack-Simulation/Attack-Screenshots/18.png`](../../02-Attack-Simulation/Attack-Screenshots/18.png)
- **Alert Evidence:** [`../../03-Detection-Engineering/TheHive_Alert-ScreenShot/7.png`](../../03-Detection-Engineering/TheHive_Alert-ScreenShot/7.png)
- **Raw Telemetry:** Exported in [`06-Resources/Alerts/wazuh_alerts.csv`](../../06-Resources/Alerts/wazuh_alerts.csv), [`Wazuh-Raw-Alerts.csv`](../../06-Resources/Alerts/Wazuh-Raw-Alerts.csv), and [`thehive_alerts.json`](../../06-Resources/Alerts/thehive_alerts.json)

---

## Indicators of Compromise (IOCs)

| Type | Value | Context |
|---|---|---|
| Path | `/root/.ssh/authorized_keys` | Modified SSH persistence target |
| User | `root` | Compromised administrative account |
| IP | `192.168.232.135` | Attacker connection origin |

---

## Detection assessment

- **Status:** Detected
- **Gap ID:** None
- **Engineering Assessment:** Both the file persistence modification and the subsequent interactive logon generated immediate alerts.

---

## Verdict

Confirmed True Positive SSH persistence established by adversary.

---

## MITRE ATT&CK

- **Tactic:** Persistence
- **Technique:** Account Manipulation: SSH Authorized Keys (T1098.004)
