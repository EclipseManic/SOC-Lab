# Indicators of Compromise

All values are from the private lab. Public IPs, credentials, and live hashes must be redacted before publication.

## Network

| Type | Value | Context | Stage | Confidence |
|---|---|---|---|---|
| IP | `192.168.232.135` | Kali attacker | All | High |
| Domain | `ad.lab` | Lab Active Directory domain | 12–17 | High |
| Host | `PC-DC.ad.lab` | Domain Controller | 13–17 | High |

## Files

| Type | Value | Context | Stage | Confidence |
|---|---|---|---|---|
| File | `shell.php` | Web shell | 05 | High (verify path/hash) |
| File | `hacked.bmp` | Impact artifact | 20 | Medium (verify path) |
| File | `README_HACKED.txt` | Impact artifact | 20 | Medium (verify path) |

## Accounts

| Type | Value | Context | Stage | Confidence |
|---|---|---|---|---|
| User | `backdoor` | Persistence account | 17 | Medium (verify) |
| User | `HANK_SHERMAN` | Kerberoasting target | 13 | Medium (verify) |

## Hashes

| Type | Value | Context | Stage | Confidence |
|---|---|---|---|---|
| Hash | TBD | DVWA password hash | 04 | TBD |
| Hash | TBD | Administrator NT hash | 14 | TBD |
| Hash | TBD | Web shell SHA-256 | 05 | TBD |

Do not publish live password hashes or Kerberos secrets. Record them in the private case notes and publish only the type and context.

## Detection queries

Document the Wazuh, Suricata, or TheHive queries that find each IOC. Example fields:

```text
data.srcip: "192.168.232.135"
data.url: "*shell.php*"
rule.id: TBD
```

## Review checklist

- [ ] Every IOC has a source stage
- [ ] Every IOC has a confidence level
- [ ] Hashes are redacted or marked non-reusable
- [ ] Public IPs and keys are removed
- [ ] The list is consistent with `INDEX.md` and the case files
