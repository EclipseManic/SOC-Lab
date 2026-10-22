# Response Actions

Document what was actually executed, not what should have been executed. If a phase was not performed, write `Not executed` and explain why.

## Containment

| Action | Executed | Tool / method | Evidence | Notes |
|---|---|---|---|---|
| Isolate DVWA | TBD | Velociraptor / network | TBD | TBD |
| Isolate Windows 10 | TBD | Velociraptor / network | TBD | TBD |
| Disable compromised accounts | TBD | Active Directory | TBD | TBD |
| Block attacker IP | TBD | Firewall | TBD | Private lab only |
| Preserve volatile evidence | TBD | Velociraptor | TBD | Before shutdown |

## Eradication

| Action | Executed | Tool / method | Evidence | Notes |
|---|---|---|---|---|
| Remove web shell | TBD | File system | TBD | Record hash first |
| Kill reverse shell process | TBD | Velociraptor | TBD | TBD |
| Remove SSH key | TBD | File system | TBD | TBD |
| Remove backdoor account | TBD | Active Directory | TBD | TBD |
| Reset KRBTGT | TBD | Active Directory | TBD | Twice if a Golden Ticket is confirmed |
| Patch the vulnerable component | TBD | Package manager | TBD | TBD |

## Recovery

| Action | Executed | Tool / method | Evidence | Notes |
|---|---|---|---|---|
| Restore DVWA from snapshot | TBD | Hypervisor | TBD | TBD |
| Restore Windows 10 from snapshot | TBD | Hypervisor | TBD | TBD |
| Restore Domain Controller | TBD | Hypervisor / backup | TBD | TBD |
| Verify Wazuh agents | TBD | Wazuh dashboard | TBD | TBD |
| Verify no persistence remains | TBD | Velociraptor | TBD | TBD |
| Monitor for recurrence | TBD | Wazuh / Suricata | TBD | TBD |

## Evidence preservation

Before deleting or restoring anything:

- [ ] Capture process list and network connections
- [ ] Hash the web shell and any dropped files
- [ ] Export relevant Wazuh alerts
- [ ] Export Suricata events
- [ ] Export TheHive case report
- [ ] Record the snapshot or backup used for recovery

## Statement

TBD — state whether response was executed in this iteration or only recommended. If only recommended, say so explicitly.
