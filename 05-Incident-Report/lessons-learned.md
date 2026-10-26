# Lessons Learned & Engineering Backlog

Post-incident analysis of defensive posture, telemetry visibility, and strategic roadmap.

---

## 1. What Succeeded

- **Multi-Sensor Correlation:** Combining Suricata network intrusion signatures with Wazuh endpoint behavioral analytics provided multi-layered verification for 16 attack stages.
- **Custom Integration Pipeline:** The `thecustomhive` two-tier correlation architecture successfully intercepted high-severity alerts in real time directly from the raw 9,567 stream via the Wazuh Level >= 8 gate, clustering bursts and tool campaigns into 46 high-fidelity, actionable incident cases in TheHive 5 (preventing alert fatigue without requiring analyst pre-filtering).
- **High-Velocity Detection:** Host behavioral rules (Auditd `execve` tracking, PAM sudo alerts, Apache error floods, Pass-the-Hash Logon Type 3, process fan-outs) alerted with sub-15-second latency.
- **Promiscuous Sniffing Resilience:** AF-PACKET promiscuous capture on router interface `ens37` allowed Suricata to observe intra-subnet Layer 2 sweeps and Kerberos ticket requests that did not traverse the router's IP stack.

---

## 2. Defensive Gaps & Architectural Blind Spots

- **Inherent Offline Computation (DG-04 & DG-11):** Password hash cracking occurred entirely within the adversary's local GPU resources on Kali Linux. Cracking generates zero victim network traffic and zero target endpoint execution. SOC strategy must focus on preventing credential dumps and detecting post-crack authentication anomalies.
- **Intra-Subnet Layer 2 Visibility (DG-09):** Packets switched locally within VMware VMnet2 bypassed gateway IP routing. Mitigated through endpoint process monitoring and promiscuous NIDS sniffing.
- **Active Directory Diagnostic Logging (DG-12):** Mass LDAP enumeration via SharpHound did not generate high-severity alerts on the DC because Event ID 1644 requires an explicit registry diagnostic setting (`15 Field Engineering` = 5). Mitigated by pivot root SSH authentication telemetry (`Rule 5715`).
- **Encrypted Exfiltration Inspection (DG-19):** SCP over SSH encrypted file payloads on the wire, hiding archive contents from network IDS. Mitigated by host-level administrative logon rate anomaly correlation (6 sessions in 1 second).

---

## 3. Engineering Backlog & Remediation Roadmap

| Priority | Task Description | Target Component | Owner | Status |
|---|---|---|---|---|
| **P1** | Set registry key `15 Field Engineering` to `5` to enable Event ID 1644 LDAP logging | Active Directory (PC-DC) | AD Engineering | Backlog |
| **P1** | Add Domain Admins to `Protected Users` group to disable NTLM Pass-the-Hash | Active Directory (GPO) | Identity Team | Backlog |
| **P2** | Deploy File Integrity Monitoring (FIM) on web server upload and temporary directories | Wazuh Agent (`ossec.conf`) | SOC Engineering | Backlog |
| **P2** | Configure Windows Firewall dropped packet logging forwarding to Wazuh | Windows 10 & PC-DC | Endpoint Team | Backlog |
| **P3** | Migrate standalone service accounts to Group Managed Service Accounts (gMSA) | Active Directory Infrastructure | Systems Admin | Backlog |
