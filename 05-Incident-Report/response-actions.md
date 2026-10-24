# Response Actions & Incident Containment

Procedures executed during the incident response lifecycle to contain, eradicate, and recover from the enterprise compromise.

---

## 1. Phase 1 — Immediate Containment

| Step | Action | Target Asset | Operational Command / Method | Verification |
|---|---|---|---|---|
| **1.1** | Network Isolation | DVWA (`192.168.56.30`) | Disable VMnet2 network interface (`ip link set ens37 down`) | Confirmed zero subsequent traffic on gateway. |
| **1.2** | Network Isolation | DomainWin10 (`192.168.56.20`) | Disconnect virtual NIC via hypervisor control | Verified host unreachable from pivot. |
| **1.3** | Process Termination | DVWA (`192.168.56.30`) | Kill interactive Python reverse shell: `pkill -9 -f "socket.socket"` | Verified netstat table clear on port 4444. |
| **1.4** | Session Invalidation | Active Directory | Terminate active SMB and WMI sessions originating from `192.168.56.30` | Checked open sessions via `net session`. |

---

## 2. Phase 2 — Eradication

| Step | Action | Target Asset | Operational Command / Method | Verification |
|---|---|---|---|---|
| **2.1** | Web Shell Quarantine | DVWA (`192.168.56.30`) | Remove `/var/www/html/hackable/uploads/shell.php` | Verified file deletion and directory clean. |
| **2.2** | SUID Bit Removal | DVWA (`192.168.56.30`) | `chmod u-s /usr/bin/find` | Verified permissions revert to `0755`. |
| **2.3** | Persistence Clean | DVWA (`192.168.56.30`) | Clear unauthorized keys from `/root/.ssh/authorized_keys` | Verified authorized_keys contains only management key. |
| **2.4** | Backdoor User Purge | PC-DC (`192.168.56.10`) | `Remove-ADUser -Identity backdoor_admin -Confirm:$false` | Confirmed account removed from Active Directory. |
| **2.5** | Staged Data Purge | DVWA / Windows | Delete `/tmp/data.tar.gz`, `/tmp/hank.hash`, `C:\Windows\Temp\hacked.bmp` | Verified disk clean on all staging paths. |
| **2.6** | Dual KRBTGT Reset | Active Directory | Reset `krbtgt` password twice with 10-hour delay between resets | Invalidated all forged Kerberos Golden Tickets. |

---

## 3. Phase 3 — Recovery & Restoration

| Step | Action | Target Asset | Description |
|---|---|---|---|
| **3.1** | Domain Re-authentication | Enterprise | Enforce domain-wide password reset across all user and service accounts. |
| **3.2** | SPN Sanitization | Active Directory | Remove SPN assignments from privileged administrative identities (`HANK_SHERMAN`). |
| **3.3** | Desktop Restoration | Win10 / PC-DC | Revert tampered desktop wallpaper registry keys via GPO refresh (`gpupdate /force`). |
| **3.4** | System Re-imaging | DVWA Server | Re-deploy web tier from hardened container baselines with read-only file systems. |

---

## 4. Phase 4 — Post-Incident Hardening

1. **GPO Hardening:** Enforce domain-wide GPO to disable LLMNR and NetBIOS over TCP/IP (`HKLM\Software\Policies\Microsoft\Windows NT\DNSClient\EnableMulticast` = 0).
2. **Tiered Administration:** Add all Domain Admins to the `Protected Users` security group to block NTLM and legacy Kerberos encryption.
3. **Advanced Auditing:** Enable NTDS diagnostic logging (`15 Field Engineering` = 5) on Domain Controllers to surface Event ID 1644 LDAP query anomalies.
