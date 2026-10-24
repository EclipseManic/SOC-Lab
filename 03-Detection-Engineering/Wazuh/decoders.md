# Wazuh Decoders — Custom & Built-in Log Parsing

> **Production Decoders:** The complete XML definition ready for Wazuh Manager deployment is located in [`local_decoder.xml`](local_decoder.xml).

## Overview

Wazuh decoders extract structured fields from raw textual and JSON log sources prior to evaluation by the rules engine. This document details the custom decoders developed for the lab—most notably the **`bashcmd`** decoder—as well as built-in parsers for Suricata and Windows event channels.

## Custom Decoder: `bashcmd` (`local_decoder.xml`)

Standard Linux PAM and audit logs do not always provide straightforward, human-readable command-line arguments in real time without heavy system overhead. To achieve precise, low-overhead command visibility on the DVWA pivot host, a shell hook appends every executed bash command to `/var/log/bashcmd.log`.

The custom `bashcmd` decoder extracts the user ID, username, working directory, and executed command string into first-class Wazuh alert fields.

### XML Definition

```xml
<!-- /var/ossec/etc/decoders/local_decoder.xml -->
<decoder name="bashcmd">
  <prematch>^bashcmd </prematch>
</decoder>

<decoder name="bashcmd-fields">
  <parent>bashcmd</parent>
  <regex>uid=(\d+)\s+user=(\S+)\s+pwd=(\S+)\s+command=(.+)$</regex>
  <order>uid, user, pwd, command</order>
</decoder>
```

### Log Format Examples

Raw log entries generated on the DVWA host (`/var/log/bashcmd.log`):

```text
bashcmd uid=33 user=www-data pwd=/var/www/html/vulnerabilities/upload command=python3 -c 'import pty;pty.spawn("/bin/bash")'
bashcmd uid=0 user=root pwd=/root command=chmod +s /tmp/bash
bashcmd uid=0 user=root pwd=/root/.ssh command=echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...' >> authorized_keys
```

### Extracted Dynamic Fields

| Regex Token | Dynamic Field Name | Sample Extracted Value | Usage in Rules |
|---|---|---|---|
| `(\d+)` | `uid` | `0` (root), `33` (www-data) | Match non-root executing privileged commands |
| `(\S+)` | `user` | `www-data` | Scope detection to specific compromised accounts |
| `(\S+)` | `pwd` | `/var/www/html` | Directory context (e.g., executing inside webroot) |
| `(.+)` | `command` | `cat /etc/shadow` | Pattern matching against malicious binaries/arguments |

---

## Built-in Decoders Catalog

| Decoder Name | Log Source | Ingestion Protocol | Extracted Key Fields |
|---|---|---|---|
| `json` | Suricata `eve-alert.json` | Log collector (JSON) | `timestamp`, `src_ip`, `dest_ip`, `alert.signature`, `alert.signature_id`, `http.url` |
| `sshd` | Linux `/var/log/auth.log` | Syslog collector | `srcip`, `dstuser`, `logon_status`, `port` |
| `apache-access` | Apache `/var/log/apache2/access.log` | Web log collector | `srcip`, `url`, `id` (HTTP status), `protocol` |
| `windows-eventlog` | Windows Security (`Security.evtx`) | Wazuh agent eventchannel | `win.system.eventID`, `win.eventdata.targetUserName`, `win.eventdata.ipAddress` |
| `sysmon` | Windows Sysmon (`Microsoft-Windows-Sysmon/Operational`) | Wazuh agent eventchannel | `win.eventdata.image`, `win.eventdata.commandLine`, `win.eventdata.parentImage`, `win.eventdata.parentCommandLine` |

---

## Suricata JSON Field Mapping

Suricata outputs structured JSON events directly to `eve-alert.json`. Wazuh's native JSON decoder maps these into nested `data.*` fields:

```text
Suricata eve-alert.json Field               Wazuh Internal Field
──────────────────────────────              ────────────────────
"timestamp"                    ──►          timestamp
"src_ip"                       ──►          data.srcip
"dest_ip"                      ──►          data.dstip
"proto"                        ──►          data.proto
"alert"."signature"            ──►          data.alert.signature
"alert"."signature_id"         ──►          data.alert.signature_id
"alert"."severity"             ──►          data.alert.severity
"http"."url"                   ──►          data.url
"http"."http_method"           ──►          data.http_method
```

---

## Validation via `wazuh-logtest`

To verify decoder parsing accuracy on the Wazuh Manager:

```bash
/var/ossec/bin/wazuh-logtest
```

**Input:**
```text
bashcmd uid=0 user=root pwd=/root command=python3 /opt/impacket/examples/secretsdump.py ad.lab/administrator@192.168.56.10
```

**Output:**
```text
**Phase 1: Completed pre-decoding.
       full event: 'bashcmd uid=0 user=root pwd=/root command=python3 /opt/impacket/examples/secretsdump.py ad.lab/administrator@192.168.56.10'

**Phase 2: Completed decoding.
       name: 'bashcmd'
       parent: 'bashcmd'
       command: 'python3 /opt/impacket/examples/secretsdump.py ad.lab/administrator@192.168.56.10'
       pwd: '/root'
       uid: '0'
       user: 'root'

**Phase 3: Completed filtering (rules).
       id: '100615'
       level: '12'
       description: 'Administrative credential extraction tool executed on pivot host'
```

## Related Documents

- [Wazuh Custom & Built-in Rules](rules.md)
- [DVWA Pivot Host Setup](../../01-Lab-Setup/Local/dvwa.md)
- [thecustomhive Alert Pipeline](../pipeline-thecustomhive.md)
