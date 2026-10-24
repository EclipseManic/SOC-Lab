# Detection Gap Register — Blind Spots & Architectural Visibility

## Overview

A core engineering principle of this SOC lab is: **document the blind spot**. A detection engineering portfolio that claims 100% coverage across every phase is unrealistic. 

In this lab, 16 of the 20 stages produced verified alerts in TheHive. The remaining stages fall into two legitimate engineering categories:
1. **Inherent Offline Gaps:** Actions performed locally on the attacker's system where victim endpoints and sensors produce zero telemetry by definition.
2. **Architectural / Logging Gaps:** Intra-subnet Layer 2 switching blind spots or encrypted channel limitations where host telemetry was relied upon.

---

## Gap Register

| Gap ID | Stage | ATT&CK | Classification | What Was Missed / Limited | Detection Mechanism Observed | Recommended Engineering Fix | Status |
|---|---|---|---|---|---|---|---|
| **DG-04** | 04 (Hash Crack) | `T1110.002` | **Inherent Offline Gap** | Local GPU password cracking generating zero host/network packets | *None* (Hashcat ran locally on Kali) | Enforce strong password complexity; replace MD5 with Argon2/bcrypt | **Documented** (Inherent) |
| **DG-09** | 09 (Internal Disc) | `T1018` | **Architectural Visibility** | Intra-subnet port scans between victim hosts do not cross Suricata | Suricata detected gateway probes; host telemetry caught process execution | Enable local Windows Firewall logging (Dropped packets) via Wazuh agent | **Closed** (Host Covered) |
| **DG-11** | 11 (NTLMv2 Crack) | `T1110.002` | **Inherent Offline Gap** | Offline cracking of intercepted NetNTLMv2 hash on Kali | *None* (Cracking executed offline on attacker GPU) | Disable LLMNR/NBT-NS globally via GPO to prevent Stage 10 capture | **Documented** (Inherent) |
| **DG-12** | 12 (BloodHound) | `T1087.002` | **Logging Gap** | High-volume LDAP enumeration queries not alerted as a specific AD rule | Detected via root SSH logon activity (`Rule 5715`) on pivot host | Enable Windows Event ID 1644 (Active Directory LDAP Search Query Logging) | **Remediated** (Pivot Alerted) |
| **DG-19** | 19 (Exfiltration) | `T1041` | **Encrypted Transport Gap** | Exfiltrated archive contents invisible to network IDS due to SSH/SCP encryption | Detected via SSH rapid session anomaly (`Rule 5715` - 6 logons in 1s) | Deploy endpoint File Integrity Monitoring (FIM) on staging directories | **Remediated** (Pivot Alerted) |

---

## In-Depth Gap Analysis

### DG-04 & DG-11 — Offline Cryptographic Cracking (Stages 04 & 11)

- **Root Cause:** When an adversary extracts password hashes (from a database dump in Stage 03 or an LLMNR poison capture in Stage 10), cracking occurs entirely within the adversary's local GPU resources. No packets are transmitted to the victim network, and no processes spawn on target endpoints.
- **SOC Posture:** These stages cannot be detected at execution time. The SOC's defensive focus must shift to **prevention** (preventing the database dump, enforcing GPO restrictions against LLMNR/NetBIOS) and **post-crack detection** (alerting on the subsequent use of cracked credentials).

### DG-09 — Intra-Subnet Layer 2 Visibility (Stage 09)

- **Root Cause:** Suricata is deployed as an inline gateway router between `192.168.232.0/24` and `192.168.56.0/24`. When Kali attacks DVWA, all traffic crosses the gateway and is fully inspected. However, once the attacker pivots to DVWA (`192.168.56.30`) and scans Windows 10 (`192.168.56.20`), packets are switched locally at Layer 2 within VMware VMnet2 and never traverse the gateway router interfaces (`ens33`/`ens37`).
- **Resolution:** Rather than deploying artificial SPAN taps, the lab addresses this via **endpoint telemetry**: Wazuh agents running on DVWA and Windows 10 monitor process creation, network sockets, and command-line arguments directly.

### DG-12 — Active Directory LDAP Query Volume (Stage 12)

- **Root Cause:** SharpHound and BloodHound execute high-volume LDAP queries to map AD trust relationships. While the inbound SSH session used to stage SharpHound was immediately flagged (`Rule 5715`), the Domain Controller did not generate an explicit LDAP anomaly alert because Event ID 1644 (LDAP Query Logging) was not enabled by default.
- **Resolution:** Configured Advanced Audit Policy on `PC-DC` for Directory Service Access and recommended enabling NTDS diagnostic logging for LDAP search filters.

### DG-19 — Encrypted Exfiltration Inspection (Stage 19)

- **Root Cause:** The attacker used SCP over SSH (`22/TCP`) to exfiltrate collected sensitive files from the DVWA pivot back to Kali. The transport layer encryption prevented Suricata deep-packet inspection from identifying file names or content keywords.
- **Resolution:** Wazuh's correlation engine flagged the burst of administrative SSH sessions (6 consecutive root authentications in under 1 second), providing behavioral detection even when packet payload inspection was blind.

---

## Remediation Workflow

```text
Identify Gap during Simulation
       │
       ▼
Classify: Inherent Offline vs. Telemetry Logging Gap vs. Rule Failure
       │
       ├── Inherent Offline ──► Document preventative control & focus on downstream TTPs
       │
       └── Logging/Rule Gap  ──► 1. Enable audit policy or agent module
                                 2. Author smallest effective Sigma / Wazuh rule
                                 3. Validate using wazuh-logtest
                                 4. Update coverage matrix & close gap
```

## Related Documents

- [Detection Coverage Matrix](coverage-matrix.md)
- [Wazuh Rules Catalog](Wazuh/rules.md)
- [Suricata Signatures](Suricata/rules.md)
- [Attack Simulation Overview](../../02-Attack-Simulation/README.md)
