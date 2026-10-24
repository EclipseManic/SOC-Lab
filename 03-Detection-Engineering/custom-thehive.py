#!/usr/bin/env python3
"""
custom-thehive.py — Wazuh to TheHive Alert Ingestion & Pipeline Bridge
Author: Manichand Gupta (SOC Lab)
Description:
    Polls Wazuh API for high-severity alerts (level >= 8), normalizes event fields,
    enriches with MITRE ATT&CK and endpoint context, extracts observables,
    deduplicates against a sliding window, and posts alerts to TheHive API v1.
    Maintains a disk-backed cursor to guarantee zero data loss and avoid duplicate alerts.
"""

import os
import sys
import json
import time
import logging
import hashlib
import requests
import urllib3

# Suppress self-signed certificate warnings for private VNet traffic
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# --- Configuration & Environment Variables ---
WAZUH_API_URL = os.getenv("WAZUH_API_URL", "https://10.122.1.4:55000")
WAZUH_USER = os.getenv("WAZUH_API_USER", "wazuh-wui")
WAZUH_PASSWORD = os.getenv("WAZUH_API_PASSWORD", "<REDACTED>")

THEHIVE_API_URL = os.getenv("THEHIVE_API_URL", "http://127.0.0.1:9000")
THEHIVE_API_KEY = os.getenv("THEHIVE_API_KEY", "<REDACTED>")

MIN_RULE_LEVEL = int(os.getenv("MIN_RULE_LEVEL", "8"))
CURSOR_FILE = os.getenv("CURSOR_FILE", "/var/lib/thecustomhive/alert.cursor")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "15"))  # seconds
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "50"))

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("thecustomhive")


class WazuhClient:
    """Client for querying the Wazuh REST API."""
    def __init__(self, base_url, user, password):
        self.base_url = base_url.rstrip("/")
        self.user = user
        self.password = password
        self.token = None
        self.token_expiry = 0

    def authenticate(self):
        """Authenticate to Wazuh API and acquire JWT bearer token."""
        auth_url = f"{self.base_url}/security/user/authenticate"
        try:
            response = requests.get(
                auth_url,
                auth=(self.user, self.password),
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("data", {}).get("token")
                # Tokens typically valid for 900 seconds; refresh at 800s
                self.token_expiry = time.time() + 800
                logger.info("Successfully authenticated to Wazuh API")
                return True
            else:
                logger.error(f"Wazuh auth failed with status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Connection error to Wazuh API ({auth_url}): {e}")
            return False

    def get_token(self):
        """Retrieve valid token, refreshing if necessary."""
        if not self.token or time.time() >= self.token_expiry:
            if not self.authenticate():
                raise ConnectionError("Failed to authenticate to Wazuh API")
        return self.token

    def get_alerts(self, min_level, last_timestamp, limit=50):
        """Fetch alerts from Wazuh with level >= min_level newer than last_timestamp."""
        token = self.get_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        # Query Wazuh alerts endpoint
        query_url = f"{self.base_url}/alerts"
        params = {
            "level": f">={min_level}",
            "limit": limit,
            "sort": "+timestamp"
        }
        if last_timestamp:
            params["q"] = f"timestamp>{last_timestamp}"

        try:
            response = requests.get(
                query_url,
                headers=headers,
                params=params,
                verify=False,
                timeout=15
            )
            if response.status_code == 200:
                return response.json().get("data", {}).get("affected_items", [])
            elif response.status_code == 401:
                logger.warning("Wazuh token expired, re-authenticating...")
                self.token = None
                return []
            else:
                logger.error(f"Error querying Wazuh alerts ({response.status_code}): {response.text}")
                return []
        except Exception as e:
            logger.error(f"Failed to fetch alerts from Wazuh: {e}")
            return []


class TheHiveClient:
    """Client for creating alerts in TheHive v1 API."""
    def __init__(self, base_url, api_key):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key

    def create_alert(self, alert_payload):
        """Post an alert to TheHive v1 API."""
        url = f"{self.base_url}/api/v1/alert"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        try:
            response = requests.post(url, headers=headers, json=alert_payload, timeout=10)
            if response.status_code in (200, 201):
                res_data = response.json()
                alert_id = res_data.get("_id") or res_data.get("id")
                return alert_id
            elif response.status_code == 400 and "already exists" in response.text.lower():
                logger.info(f"Alert already exists in TheHive: {alert_payload.get('sourceRef')}")
                return "DUPLICATE"
            else:
                logger.error(f"TheHive API returned {response.status_code}: {response.text}")
                return None
        except Exception as e:
            logger.error(f"Failed to post alert to TheHive ({url}): {e}")
            return None


def map_severity(wazuh_level):
    """
    Map Wazuh rule level (1-16) to TheHive severity:
    - Levels 1-7: Informational / Low (1)
    - Levels 8-9: Medium (2)
    - Levels 10-11: High (3)
    - Levels 12+: Critical (4)
    """
    if wazuh_level >= 12:
        return 4  # Critical
    elif wazuh_level >= 10:
        return 3  # High
    elif wazuh_level >= 8:
        return 2  # Medium
    return 1      # Low


def transform_alert(wazuh_alert):
    """Transform a raw Wazuh alert JSON into a structured TheHive alert payload."""
    rule = wazuh_alert.get("rule", {})
    agent = wazuh_alert.get("agent", {})
    data = wazuh_alert.get("data", {})
    timestamp = wazuh_alert.get("timestamp")

    rule_id = str(rule.get("id", "0000"))
    rule_level = rule.get("level", 0)
    rule_desc = rule.get("description", "Wazuh Alert")
    agent_name = agent.get("name", "Unknown-Agent")
    agent_ip = agent.get("ip", "")

    # Build unique sourceRef
    alert_raw_id = wazuh_alert.get("id", str(int(time.time() * 1000)))
    source_ref = f"wzb-{rule_id}-{alert_raw_id}"

    title = f"[{agent_name}] {rule_desc}"
    severity = map_severity(rule_level)

    # Base Tags
    tags = [
        "source:wazuh",
        f"agent:{agent_name}",
        f"rule:{rule_id}",
        f"level:{rule_level}"
    ]

    # MITRE ATT&CK Mapping
    mitre_data = rule.get("mitre", {})
    mitre_ids = mitre_data.get("id", [])
    if isinstance(mitre_ids, str):
        mitre_ids = [mitre_ids]
    for m_id in mitre_ids:
        tags.append(f"attack:{m_id}")

    # Build Observables
    observables = []

    # IP Observables
    src_ip = data.get("srcip") or data.get("src_ip")
    if src_ip and src_ip not in ("127.0.0.1", "::1"):
        observables.append({
            "dataType": "ip",
            "data": src_ip,
            "message": "Source IP address involved in alert",
            "tags": ["src-ip"]
        })

    dst_ip = data.get("dstip") or data.get("dest_ip")
    if dst_ip and dst_ip != src_ip:
        observables.append({
            "dataType": "ip",
            "data": dst_ip,
            "message": "Destination / target IP address",
            "tags": ["dst-ip"]
        })

    # Web URL / URI Path
    url = data.get("url") or data.get("http", {}).get("url")
    if url:
        observables.append({
            "dataType": "uri_path",
            "data": url,
            "message": "HTTP URI payload / requested endpoint",
            "tags": ["web-attack"]
        })

    # File & Hash Observables (FIM / Syscheck)
    syscheck = wazuh_alert.get("syscheck", {})
    file_path = syscheck.get("path") or data.get("win", {}).get("eventdata", {}).get("targetFilename")
    if file_path:
        observables.append({
            "dataType": "filename",
            "data": file_path,
            "message": "Modified or created file path",
            "tags": ["file-system"]
        })

    sha256 = syscheck.get("sha256_after")
    if sha256:
        observables.append({
            "dataType": "hash",
            "data": sha256,
            "message": "SHA-256 hash of modified file",
            "tags": ["sha256"]
        })

    # Process / Command Line (Sysmon / Auditd bashcmd)
    win_event = data.get("win", {}).get("eventdata", {})
    cmdline = win_event.get("commandLine") or data.get("command")
    if cmdline:
        observables.append({
            "dataType": "other",
            "data": cmdline,
            "message": "Executed command line / payload",
            "tags": ["process-execution"]
        })

    description = f"""### Wazuh Alert Details
- **Rule ID:** `{rule_id}` (Level {rule_level})
- **Description:** {rule_desc}
- **Agent:** `{agent_name}` ({agent_ip})
- **Timestamp:** `{timestamp}`
- **MITRE Techniques:** {", ".join(mitre_ids) if mitre_ids else "None"}

```json
{json.dumps(wazuh_alert, indent=2)}
```
"""

    return {
        "type": "Wazuh-Alert",
        "source": "Wazuh-SIEM",
        "sourceRef": source_ref,
        "title": title,
        "description": description,
        "severity": severity,
        "tlp": 2,  # TLP:AMBER
        "pap": 2,  # PAP:AMBER
        "tags": tags,
        "observables": observables
    }


def load_cursor():
    """Load the last processed alert timestamp from disk cursor."""
    if os.path.exists(CURSOR_FILE):
        try:
            with open(CURSOR_FILE, "r") as f:
                return f.read().strip()
        except Exception as e:
            logger.warning(f"Could not read cursor file: {e}")
    return None


def save_cursor(timestamp):
    """Save the last processed alert timestamp to disk cursor."""
    try:
        os.makedirs(os.path.dirname(CURSOR_FILE), exist_ok=True)
        with open(CURSOR_FILE, "w") as f:
            f.write(str(timestamp))
    except Exception as e:
        logger.error(f"Failed to write cursor file: {e}")


def main():
    logger.info("Starting thecustomhive Alert Pipeline Bridge")
    logger.info(f"Target Wazuh: {WAZUH_API_URL} | Target TheHive: {THEHIVE_API_URL}")
    logger.info(f"Rule Level Threshold: >= {MIN_RULE_LEVEL}")

    wazuh = WazuhClient(WAZUH_API_URL, WAZUH_USER, WAZUH_PASSWORD)
    thehive = TheHiveClient(THEHIVE_API_URL, THEHIVE_API_KEY)

    last_timestamp = load_cursor()
    if last_timestamp:
        logger.info(f"Resuming from cursor timestamp: {last_timestamp}")
    else:
        logger.info("No cursor found. Starting from current point.")

    dedup_cache = set()

    while True:
        try:
            alerts = wazuh.get_alerts(
                min_level=MIN_RULE_LEVEL,
                last_timestamp=last_timestamp,
                limit=BATCH_SIZE
            )

            if alerts:
                logger.info(f"Retrieved {len(alerts)} alerts (level >= {MIN_RULE_LEVEL})")
                for alert in alerts:
                    alert_ts = alert.get("timestamp")
                    alert_id = alert.get("id")

                    # Deduplication key based on rule and timestamp
                    dedup_key = f"{alert.get('rule', {}).get('id')}-{alert_ts}-{alert_id}"
                    if dedup_key in dedup_cache:
                        continue

                    # Transform to TheHive format
                    payload = transform_alert(alert)

                    # Post to TheHive
                    res = thehive.create_alert(payload)
                    if res:
                        logger.info(f"Forwarded alert to TheHive: {payload['title']} (Ref: {payload['sourceRef']})")
                        dedup_cache.add(dedup_key)
                        if len(dedup_cache) > 2000:
                            dedup_cache.clear()

                        # Advance cursor after successful delivery
                        last_timestamp = alert_ts
                        save_cursor(last_timestamp)
                    else:
                        logger.warning(f"Failed to forward alert {alert_id}, will retry on next cycle")
                        break

            time.sleep(POLL_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Shutting down thecustomhive service...")
            break
        except Exception as e:
            logger.error(f"Unexpected pipeline error: {e}", exc_info=True)
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
