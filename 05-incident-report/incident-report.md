# Incident Report — SOC Lab Attack Simulation

## Report metadata

| Field | Value |
|---|---|
| Incident ID | `SOC-LAB-2026-01` |
| Report status | Draft |
| Classification | Lab simulation |
| Severity | TBD |
| TLP / PAP | TBD |
| Analysis period | TBD |
| Analyst | TBD |
| Related cases | Case 01, Case 02, Case 03 |
| Related ATT&CK mapping | [mitre-attack-mapping.md](mitre-attack-mapping.md) |

## 1. Executive summary

TBD — three to five sentences covering what happened, how it was detected, how far the attacker got, what was affected, and the overall risk.

## 2. Scope and affected assets

| Asset | Role | Impact | Evidence |
|---|---|---|---|
| DVWA (`192.168.56.30`) | Web application | TBD | TBD |
| Windows 10 (`192.168.56.20`) | Workstation | TBD | TBD |
| Domain Controller (`192.168.56.10`) | AD DS / DNS | TBD | TBD |
| Cloud SOC | Wazuh, TheHive, Velociraptor, Caldera | TBD | TBD |

## 3. Detection and analysis

### 3.1 Detection sources

| Source | Contribution |
|---|---|
| Suricata | TBD |
| Wazuh | TBD |
| TheHive | TBD |
| Velociraptor | TBD |

### 3.2 Timeline summary

See [timeline.md](timeline.md).

### 3.3 Attack chain

| Phase | Stages | Summary |
|---|---|---|
| Initial access | 01–07 | TBD |
| Credential access and lateral movement | 08–14 | TBD |
| Domain compromise and impact | 15–20 | TBD |

### 3.4 Detection performance

| Metric | Value |
|---|---|
| Stages with a verified alert | TBD / 20 |
| Logging gaps | TBD |
| Detection gaps | TBD |
| Rule failures | TBD |
| Mean time to detect | TBD |
| False positives reviewed | TBD |

## 4. Indicators of compromise

See [iocs.md](iocs.md) for the full list. Summary:

| Type | Value | Context |
|---|---|---|
| IP | `192.168.232.135` | Kali attacker (private lab range) |
| File | `shell.php` | Web shell |
| User | `backdoor` | Persistence account |
| User | `HANK_SHERMAN` | Kerberoasting target |

## 5. Containment, eradication, and recovery

See [response-actions.md](response-actions.md).

| Phase | Status | Summary |
|---|---|---|
| Containment | TBD | TBD |
| Eradication | TBD | TBD |
| Recovery | TBD | TBD |

## 6. Impact assessment

| Dimension | Assessment |
|---|---|
| Confidentiality | TBD |
| Integrity | TBD |
| Availability | TBD |
| Data affected | TBD |
| Business impact | TBD (lab context) |

## 7. Root cause and control gaps

| Gap | Evidence | Impact | Recommendation |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## 8. Recommendations

Prioritized and mapped to the stage that would have been prevented or detected:

| Priority | Recommendation | Addresses |
|---|---|---|
| High | TBD | TBD |
| Medium | TBD | TBD |
| Low | TBD | TBD |

## 9. Lessons learned

See [lessons-learned.md](lessons-learned.md).

## 10. Appendices

- [Timeline](timeline.md)
- [IOCs](iocs.md)
- [ATT&CK mapping](mitre-attack-mapping.md)
- [Response actions](response-actions.md)
