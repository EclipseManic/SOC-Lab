# Suricata Log Samples — Structured JSON Evidence

## Overview

This document provides representative, redacted excerpts from `/var/log/suricata/eve-alert.json` captured during the 20-stage attack simulation. These events demonstrate the exact JSON schema ingested by the Wazuh agent on the gateway and forwarded to the SIEM.

## Sample Events

### 1. Stage 01 — Reconnaissance: Nmap OS Detection Probe

```json
{
  "timestamp": "2026-10-24T03:12:44.182901+0000",
  "flow_id": 1492048192048192,
  "in_iface": "ens33",
  "event_type": "alert",
  "src_ip": "192.168.232.135",
  "src_port": 54218,
  "dest_ip": "192.168.56.30",
  "dest_port": 80,
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 3400002,
    "rev": 1,
    "signature": "ET SCAN NMAP OS Detection Probe",
    "category": "Attempted Information Leak",
    "severity": 1
  },
  "tcp": {
    "tcp_flags": "00000002",
    "syn": true
  }
}
```

---

### 2. Stage 03 — Initial Access: SQL Injection Parameter Probe

```json
{
  "timestamp": "2026-10-24T03:28:11.904211+0000",
  "flow_id": 8920194829104921,
  "in_iface": "ens33",
  "event_type": "alert",
  "src_ip": "192.168.232.135",
  "src_port": 49182,
  "dest_ip": "192.168.56.30",
  "dest_port": 80,
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 2010937,
    "rev": 4,
    "signature": "ET WEB_SERVER SELECT USER SQL Injection Attempt in URI",
    "category": "Web Application Attack",
    "severity": 1
  },
  "http": {
    "hostname": "192.168.56.30",
    "url": "/vulnerabilities/sqli/?id=1%27+UNION+SELECT+user,password+FROM+users--+-&Submit=Submit",
    "http_user_agent": "Mozilla/5.0 (X11; Linux x86_64)",
    "http_method": "GET",
    "protocol": "HTTP/1.1",
    "status": 200
  }
}
```

---

### 3. Stage 05 — Persistence: PHP System Command Injection in Upload

```json
{
  "timestamp": "2026-10-24T03:42:05.109822+0000",
  "flow_id": 3049182940192847,
  "in_iface": "ens33",
  "event_type": "alert",
  "src_ip": "192.168.232.135",
  "src_port": 50124,
  "dest_ip": "192.168.56.30",
  "dest_port": 80,
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 2014726,
    "rev": 2,
    "signature": "ET WEB_SERVER PHP System Command in HTTP POST",
    "category": "Web Application Attack",
    "severity": 1
  },
  "http": {
    "hostname": "192.168.56.30",
    "url": "/vulnerabilities/upload/",
    "http_method": "POST",
    "http_content_type": "multipart/form-data; boundary=---------------------------3819204",
    "status": 200
  }
}
```

---

### 4. Stage 06 — Execution: Interactive Reverse Shell Connection

```json
{
  "timestamp": "2026-10-24T03:55:18.441902+0000",
  "flow_id": 9182049182049182,
  "in_iface": "ens37",
  "event_type": "alert",
  "src_ip": "192.168.56.30",
  "src_port": 44192,
  "dest_ip": "192.168.232.135",
  "dest_port": 4444,
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 2002752,
    "rev": 3,
    "signature": "ET POLICY Outbound Interactive Shell Spawned / Reverse Shell TCP",
    "category": "A Network Trojan was detected",
    "severity": 1
  }
}
```

---

### 5. Stage 10 — Credential Access: LLMNR / NBT-NS Poisoning Response

```json
{
  "timestamp": "2026-10-24T04:18:29.610294+0000",
  "flow_id": 5019284019284019,
  "in_iface": "ens37",
  "event_type": "alert",
  "src_ip": "192.168.56.30",
  "src_port": 5355,
  "dest_ip": "192.168.56.20",
  "dest_port": 5355,
  "proto": "UDP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 2013028,
    "rev": 2,
    "signature": "ET SCAN Potential LLMNR / NBT-NS Poisoning Response",
    "category": "Potential Corporate Privacy Violation",
    "severity": 1
  }
}
```

---

### 6. Stage 15 — Lateral Movement: Pass-the-Hash / GoldenPac

```json
{
  "timestamp": "2026-10-24T04:52:10.829104+0000",
  "flow_id": 7182940192840192,
  "in_iface": "ens37",
  "event_type": "alert",
  "src_ip": "192.168.56.30",
  "src_port": 33986,
  "dest_ip": "192.168.56.10",
  "dest_port": 88,
  "proto": "TCP",
  "alert": {
    "action": "allowed",
    "gid": 1,
    "signature_id": 2015862,
    "rev": 1,
    "signature": "ET EXPLOIT Possible GoldenPac Privilege Escalation in-use",
    "category": "Attempted Administrator Privilege Gain",
    "severity": 1
  }
}
```

---

## JSON Field Reference

| Top-Level Key | Child Field | Wazuh Extraction Path | Analyst Utility |
|---|---|---|---|
| `timestamp` | - | `timestamp` | Reconstruct event sequence across host and network layers |
| `event_type` | - | `event_type` | Differentiates `alert` records from flow, HTTP, or DNS logs |
| `src_ip` | - | `data.srcip` | Identifies attacker workstation or compromised pivot IP |
| `dest_ip` | - | `data.dstip` | Identifies target victim asset |
| `proto` | - | `data.proto` | Layer 4 transport protocol (`TCP`, `UDP`, `ICMP`) |
| `alert` | `signature` | `data.alert.signature` | Human-readable threat description used as alert header |
| `alert` | `signature_id` | `data.alert.signature_id` | ET SID for rule traceability and automated tuning |
| `alert` | `severity` | `data.alert.severity` | Numerical priority ($1=\text{High}$, $2=\text{Med}$, $3=\text{Low}$) |
| `http` | `url` | `data.url` | Web URI path containing SQLi, XSS, or webshell parameter |
| `http` | `status` | `data.id` / `status` | HTTP response code ($200=\text{Success}$, $404=\text{Not Found}$) |

## Related Documents

- [Suricata Signatures & Tuning Catalog](rules.md)
- [Wazuh Decoders for Suricata](../Wazuh/decoders.md)
- [Suricata Gateway Host Architecture](../../01-Lab-Setup/Local/suricata-gateway.md)
