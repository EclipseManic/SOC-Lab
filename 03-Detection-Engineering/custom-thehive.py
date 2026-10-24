#!/var/ossec/framework/python/bin/python3
"""
Wazuh -> TheHive BATched integration — production-ready (final review pass).

Source of truth for detection/correlation/rendering: soc-lab-backup/custom-thehive.py.
Drop-in CLI (api_key/hook_url kept for Wazuh compat, now OPTIONAL):
  custom-thehive-batched.py <alert_file> [api_key] [hook_url]
  custom-thehive-batched.py --flush-daemon [--interval N]
  custom-thehive-batched.py --flush-once
  custom-thehive-batched.py --flush-single <group_type> <thehive_id>

FINAL ARCHITECTURE (fast durable ingest vs slow async sync):
  Wazuh --(fork/exec per alert)--> ingest_alert(): ONE small SQLite txn, ZERO HTTP,
    ZERO render, ZERO full-table scan, ZERO prune for normal alerts.
    Dedup (atomic) -> ONE correlation SELECT (same priority/semantics as original) ->
    O(1) stage counter -> INSERT 1 stage row -> correlation UPSERT ->
    pending_groups UPSERT (dirty=1, generation+1). Commit, exit 0.
  SQLite WAL = persistent queue. Independent --flush-daemon every ~5s:
    sweep stale claims -> atomically CLAIM a batch (short UPDATE, rowcount-checked) ->
    for each claim: load+render ONLY that group once -> single CREATE/PATCH outside
    any held write txn -> atomic compare-and-clear (only mark clean if generation
    unchanged, else requeue). Standalone outbox follows the same claim/send/complete
    pattern with stable sourceRef. Crash-safe via lease timeouts; retries via
    next_retry_at with real Retry-After support; fatal 4xx dead-lettered.

BUGS/RACES FIXED vs the first batched version:
  A. Dedup: INSERT OR IGNORE rowcount is now checked; duplicates ROLLBACK and stop.
  B. Dirty/version: pending_groups.generation + claimed_gen compare-and-clear; a group
     is marked clean ONLY if generation is unchanged since the claim, else it stays
     dirty for another cycle. No write txn is ever held across HTTP.
  C. Concurrency: per-group/per-item atomic claims (state + lease_until, rowcount=1
     wins); two flushers can no longer CREATE/PATCH/send the same item twice; global
     flush lock removed as authority (kept only for last_flush bookkeeping).
     Stale claims recovered by lease sweep after crash.
  D. Retry-After: actually parsed (delta-seconds AND HTTP-date via email.utils),
     applied as max(backoff, retry_after) for 429/503; permanent 4xx never retried.
  E. Async: normal ingest performs ZERO HTTP by default (inline flush default OFF);
     daemon is the primary sync path and drains the queue even with zero new alerts.
     Critical/watchlist still prioritized (is_critical first + optional single-item
     fast-lane AFTER durable persist, bounded to critical only, disabled via flag).
  F. O(1) ingest: SELECT MAX(stage_num) replaced by group_counters(next_stage) with
     indexed UPDATE-or-INSERT inside the ingest txn + MAX fallback/backfill only.
  G. Auth: hardcoded Bearer removed; token + URL from env (argv overrides for compat);
     token never logged. Session reuse + (connect,read) timeouts + truncated bodies.
  H. Logging: per-stage queued appends demoted to DEBUG; INFO reserved for new groups,
     flush cycles, retries, 429, dead-letters, backpressure, recovery, duplicates.
  I. CREATE-crash window: stable pending source_ref persisted at group creation and
     reused on every CREATE retry (at-least-once with idempotent reference; TheHive
     has no transactional idempotency so exact-once is documented as impossible).
  J. tool_campaign group type: recon/attack-tool fingerprinting, grouped by
     tool|src_ip|agent with a 30-min idle-close window (no stage-count cap);
     aggregate-only renderer keeps PATCH size ~constant (no per-stage transcript, 5+5
     labeled raw sample); severity forced High(3); checked before activity_burst but
     after logon/chain/fanout, and tool hits bypass suppression entirely by design.
     recent_tool_campaigns added to the promote/rekey rename loops (required: otherwise
     the first CREATE orphans campaign state); flush/claim/retry machinery untouched.
  K. Fingerprint table v2 (root-cause fix for the ffuf-vs-ET-SCAN campaign split):
     many-to-one alias map ({canonical:[aliases]}) in tool_fingerprints.json
     (THEHIVE_FINGERPRINTS_FILE overrides; baked-in fallback if missing/invalid),
     word-boundary regex on normalized text (fixes nmap-in-hostname false positives
     AND spelled-out-alias false negatives); ET SCAN/POLICY moved out of canonical
     names into a Tier-2 unknown-scanner bucket (Medium severity, INFO-logged with
     verbatim evidence) so gaps stay visible; Nmap explicit before ET catch-all.
     Split-canary warns on multi-label src_ip+agent; unknown-scanner gauges in
     metrics; tests/fingerprint_fixtures.json + --self-test gate new entries.
     SHIP tool_fingerprints.json next to the script on deploy.
     Nmap is an explicit fingerprint (checked before the ET SCAN/ET POLICY catch-all,
     so "ET SCAN Nmap ..." labels Nmap, not ET SCAN). Precedence is Option B: tool hits
     landing in logon/chain/fanout keep those groups AND carry a tool: tag on the stage
     (merged at precompute, deduped at flush); only unmatched remainder forms campaigns.

  L. Display timezone (operator request): human-readable alert timestamps render in
     THEHIVE_DISPLAY_TZ_OFFSET hours (e.g. 5.5 = IST, labeled UTC+05:30); default 0
     keeps UTC output byte-identical. Epoch fields (TheHive date/lastSyncDate,
     metrics) are absolute instants and are NEVER shifted; unparseable input renders
     raw rather than failing. Time spans use compact same-day form when zoned.

ENVIRONMENT (no secrets in source):
  THEHIVE_URL / THEHIVE_BASE_URL .... TheHive base URL (default http://10.122.0.4:9000/api/v1, warns)
  THEHIVE_API_TOKEN / THEHIVE_API_KEY / THEHIVE_TOKEN ... API bearer token (REQUIRED for flush; ingest works without)
  THEHIVE_CORRELATION_DB ............ SQLite path override (default /var/ossec/logs/correlation_state.db)
  THEHIVE_FLUSH_INTERVAL ............ daemon seconds (default 5.0)
  THEHIVE_FLUSH_BATCH ............... groups per cycle (default 50)
  THEHIVE_RETRY_BASE / _MAX ......... backoff base/max (defaults 2.0 / 300.0)
  THEHIVE_MAX_RETRIES ............... attempts before dead-letter (default 8)
  THEHIVE_CLAIM_LEASE ............... claim lease seconds (default 90.0)
  THEHIVE_METRICS_FILE .............. JSON snapshot path (default <db-dir>/thehive_flush_metrics.json)
  THEHIVE_BENCH_DB .................. bench SQLite path (default: temp file, NEVER prod)
  THEHIVE_SPOOL_DIR ................. raw-alert spool for DB-outage replay (default <db-dir>/thehive_spool;
                                      point to a DIFFERENT filesystem to survive a full queue disk)
  THEHIVE_SYNCHRONOUS ............... SQLite synchronous FULL/NORMAL/OFF (default NORMAL; FULL only if OS-crash loss unacceptable)
  THEHIVE_BACKPRESSURE_STAGES ....... queue-depth warn threshold (default 20000)
  THEHIVE_PRUNE_INTERVAL ............ correlation prune cadence (default 300.0)
  THEHIVE_TIMEOUT ................... HTTP read timeout (default 15.0; connect fixed 5s)
  THEHIVE_VERIFY_SSL ................ 1 to verify TLS certs (default 0 = preserve current LAN behavior)
  THEHIVE_INLINE_FLUSH .............. 1 to enable legacy inline fallback (default 0/OFF)
  THEHIVE_CRITICAL_INLINE ........... 1 to fast-lane critical singles after persist (default 1)
  THEHIVE_DISPLAY_TZ_OFFSET ......... display-zone shift in hours for rendered alert timestamps, e.g. 5.5 for IST (default 0 = UTC, current behavior)

COMMANDS:
  Normal Wazuh mode (zero HTTP for normal alerts):
    custom-thehive-batched.py /path/to/alert.json [api_key] [hook_url]
    Prefer env (THEHIVE_API_TOKEN/THEHIVE_URL): argv api_key is visible in ps output
    and values <12 chars are loudly ignored (never silently half-configured).
  Dedicated flush daemon (PRIMARY sync path, run as a service):
    /var/ossec/framework/python/bin/python3 custom-thehive-batched.py --flush-daemon
    /var/ossec/framework/python/bin/python3 custom-thehive-batched.py --flush-daemon --interval 5
  One-shot drain (cron/stop hook/manual):
    /var/ossec/framework/python/bin/python3 custom-thehive-batched.py --flush-once
  Ingest benchmark on the Wazuh host (temp DB by default; workers mimic fork/exec):
    /var/ossec/framework/python/bin/python3 custom-thehive-batched.py --bench 1000
    /var/ossec/framework/python/bin/python3 custom-thehive-batched.py --bench 10000 --bench-workers 4
  Objective burst timing: watch thehive_flush_metrics.json (queued_groups/stages,
    oldest_queued_age_s, creates/patches totals, avg_sync_op_ms) across the burst.
  Horizontal scale (only after TheHive-side benchmarks show headroom): run 2-4 daemon
    processes against the same DB — per-item atomic claims keep them safe. Default: 1.
  OPERABILITY: token/URL re-read every daemon cycle, but under systemd the process env
    is fixed at service start — so rotation still needs `systemctl restart thehive-flush`
    (fast: queue persists in SQLite, nothing is lost);
    VERIFY_SSL/TIMEOUT/batch/retry/lease/prune/DB-path need daemon restart. Dedup is
    at-most-once while the Wazuh ID is retained (seen_alerts capped at 50k newest):
    NOT exactly-once — replays after pruning reprocess (idempotent via stable refs).
    Files: DB/WAL/SHM + metrics tmp + spool are created 0600 best-effort (shared log
    file/dir intentionally untouched). Dead rows keep all stages; manual requeue:
    UPDATE pending_groups SET dirty=1,state='idle',retry_count=0,next_retry_at=0 WHERE state='dead';
    UPDATE standalone_outbox SET status='queued',state='idle',retry_count=0,next_retry_at=0 WHERE status='dead';

LATENCY MODEL (read carefully — "5 seconds" is a WAKE CADENCE, not a sync SLA):
  Tier 1 ingest SLO: each Wazuh invocation persists locally and exits; no network.
  Tier 2 wake cadence: the daemon wakes every FLUSH_INTERVAL_SECONDS (default 5.0).
  Tier 3 sync latency: time for a queued alert to appear/refresh in TheHive, which is a
    function of backlog, NOT of the wake interval:
      cycle_time ≈ min(dirty, batch) * (render + HTTP + 0.05s pacing)
    e.g. 50 dirty groups at ~150-300ms each ≈ 8-20s per cycle. Under sustained overload
    lag grows linearly and drains losslessly when load drops; the queue gauges in
    thehive_flush_metrics.json (queued_groups/stages, oldest_queued_age_s) plus the
    per-cycle log line report it objectively — never infer sync time from wake time.
  Throughput lever (benchmark-first, NO in-process threads): per-item atomic claims make
    K concurrent daemon processes SAFE today (default 1). If and only if TheHive-side
    benchmarks show headroom, run 2-4 daemon processes against the same DB and raise
    THEHIVE_FLUSH_BATCH. Do NOT add threads to a single process: requests.Session and
    SQLite connections are not safely shareable, and threads would only move the same
    blocking HTTP work without fixing server-side capacity.
10k-BURST BEHAVIOR: 10k ingests = 10k tiny O(1) txns (seconds, WAL-serialized, zero HTTP,
  zero render). Daemon then CREATEs each new logical group once and PATCHes dirty groups
  once per cycle with a single aggregate render each (e.g. one rule+agent burst capped at
  BURST_MAX_STAGES=200 => ~50 groups => ~50 CREATEs + periodic PATCHes, not CREATE+9999
  PATCHes). Burst-then-silence still drains because the daemon wakes on interval, not on
  new alerts. TheHive offline => backoff + dead-letter only for fatal 4xx; queue persists
  across crashes/reboots via SQLite + lease recovery.

PRODUCTION AUDIT NOTES (verified against actual code, not prior reports):
  * "Daemon wakes every 5s" != "synced within 5s": flushing is SEQUENTIAL (one HTTP per
    group + 0.05s pacing). A 50-group backlog needs ~50*(render+HTTP) ≈ 10-20s per cycle,
    so under sustained overload lag grows linearly; the queue absorbs it losslessly and
    drains when load drops. This is a deliberate no-threads design (spec forbids fanning
    out the old per-alert HTTP); scale by raising THEHIVE_FLUSH_BATCH, never by threads.
  * SERVER-SIDE DEDUP EXISTS and is USED (verified against TheHive docs, thehive4py
    source, and maintainer statements): alert identity = hash(type+source+sourceRef), so
    re-CREATE with identical type+source+sourceRef is REJECTED (400 ConflictError
    'document already exists' on older versions; 409 requested upstream) instead of
    duplicating. Our pending groups carry a STABLE source_ref (persisted at creation,
    reused on every retry; type/source are constants), and standalone alerts use the
    stable Wazuh-ID-based sourceRef — so crash-retry CREATEs collide server-side rather
    than duplicating. On 400/409-with-exists-hint this code reconciles by querying
    POST /api/v1/query (listAlert + Eq(sourceRef)) to recover the _id, promotes, and
    PATCHes current stages (self-healing, no dup). If the lookup fails, it dead-letters
    with the sourceRef for manual reconcile (stages retained) instead of re-CREATEing.
    2xx-without-_id is likewise dead-lettered, never blindly retried. Residual risk is
    therefore NOT silent duplication but a manual-reconcile dead-letter in the narrow
    window where CREATE succeeded yet neither _id nor query lookup is available.
    PATCHes remain idempotent full-state overwrites, safe to retry freely.
  * Leases (default 90s): worst legitimate flight is one bounded render plus, on the
    reconcile path, up to THREE sequential capped HTTP calls (CREATE + sourceRef lookup
    + PATCH, each capped by 5s connect / 15s read ≈ 60s + renders worst-case), so 90s
    keeps margin while bounding crashed-claim recovery. If a lease ever does expire
    mid-flight, the outcome is still safe (idempotent PATCH / server-rejected CREATE +
    reconcile), merely duplicate work — never loss or TheHive duplication.
  * Dedup is atomic: INSERT OR IGNORE + rowcount check inside the same BEGIN IMMEDIATE
    txn; duplicates COMMIT nothing and stop before any grouping write, safe under
    concurrent workers (loser gets rowcount 0).
  * Schema cost is one-time: migrations gated behind a single pragma_table_info check;
    steady-state ingest pays only PRAGMAs + CREATE-IF-NOT-EXISTS no-ops + the small txn.
  * Write-lock scope: expensive pure-CPU rendering (_precompute_stage) runs BEFORE
    BEGIN IMMEDIATE; the held txn contains only indexed O(1) SQL writes.
  * chain_depth stored as 1 (original passed len(stages)) is a verified no-op: the
    original never reads parent_depth afterwards. event_count/stage_count +1 increments
    are arithmetically identical to the original's len(stages) assignment.
"""
import sys, os, json, time, logging, re, random, signal, sqlite3, uuid
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime
try:
    import requests
except ImportError:
    requests = None

LOG_FILE = "/var/ossec/logs/integrations.log"
try:
    logging.basicConfig(filename=LOG_FILE, level=logging.INFO, format="%(asctime)s custom-thehive-batched: %(message)s")
except Exception:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s custom-thehive-batched: %(message)s")
class _SafeLogFilter(logging.Filter):
    """Strip CR/LF from every log record: alert-derived ids/names flow into log lines and
    a forged alert JSON (compromised agent/forged spool file) could otherwise inject fake
    log lines to hide real alerts. Single chokepoint covering all present and future call
    sites (same class as the earlier !r fix, but global). Best-effort; never drops records."""
    def filter(self, record):
        try:
            if isinstance(record.msg,str): record.msg=record.msg.replace("\r"," ").replace("\n"," ")
            if record.args:
                if isinstance(record.args,dict):
                    for k,v in record.args.items():
                        if isinstance(v,str): record.args[k]=v.replace("\r"," ").replace("\n"," ")
                else:
                    record.args=tuple((a.replace("\r"," ").replace("\n"," ") if isinstance(a,str) else a) for a in record.args)
        except Exception: pass
        return True
try: logging.getLogger().addFilter(_SafeLogFilter())
except Exception: pass

# ---------------- detection constants (VERBATIM semantics) ----------------
WAZUH_PROCESS_PATTERNS = [re.compile(r'\\ossec-agent\\wazuh-agent\.exe$', re.IGNORECASE), re.compile(r'/var/ossec/bin/wazuh-', re.IGNORECASE)]
WAZUH_CHAIN_TTL_SECONDS = 300
TLP = 2; PAP = 2; VERIFY_SSL = os.environ.get("THEHIVE_VERIFY_SSL","0")=="1"  # default False preserves current LAN deployment; set 1 with https://
FULL_LOG_FALLBACK_MAX_CHARS = 20000
CORRELATION_DB = "/var/ossec/logs/correlation_state.db"
CORRELATION_WINDOW_SECONDS = 15; LOGON_CORRELATION_WINDOW_SECONDS = 60
# Agent names whose alerts should never be sent to TheHive
SUPPRESSED_AGENT_NAMES = {
    "wazuh",
}


# Rule IDs to suppress entirely - never sent to TheHive, just logged and skipped
SUPPRESSED_RULE_IDS = {
    # --- Vulnerability Detector (CVE scanning) ---
    "23501",   # Base CVE match - parent rule, always silent
    "23503",   # CVE affects package - Low severity
    "23504",   # CVE affects package - Medium severity
    "23505",   # CVE affects package - High severity
    "23506",   # CVE affects package - Critical severity
    "23507",   # Could not verify whether Low-severity CVE affects package
    "23508",   # Could not verify whether Medium-severity CVE affects package
    "23509",   # Could not verify whether High-severity CVE affects package
    "23510",   # Could not verify whether Critical-severity CVE affects package

    # --- Security Configuration Assessment (SCA) ---
    "19000",   # Group of SCA rules - parent
    "19001",   # SCA summary: policy score reported
    "19002",   # SCA summary: score below 90%
    "19003",   # SCA summary: score below 80%
    "19004",   # SCA summary: CIS Ubuntu Linux 24.04 LTS Benchmark v1.0.0. (score below 50%)
    "19005",   # SCA summary: CIS Microsoft Windows 10 Enterprise Benchmark (score below 30%)
    "19006",   # SCA check event - parent
    "19007",   # SCA rule failed
    "19008",   # SCA rule passed
    "19009",   # SCA rule invalid / not applicable
    "19010",   # CIS Ubuntu Linux 24.04 LTS Benchmark v1.0.0 - status changed to passed
    "19011",   # CIS Ubuntu Linux 24.04 LTS Benchmark v1.0.0 - status changed to failed
    "19012",   # CIS Microsoft Windows 10 Enterprise Benchmark - status changed to not applicable
    "19013",   # CIS Microsoft Windows Server 2022 Bench - status changed to not applicable
    "19014",   # SCA check status changed: not applicable -> failed
    "19015",   # CIS Microsoft Windows Server 2022 Benchmark - status changed to passed

    # --- OSSEC/Wazuh internal & agent lifecycle ---
    "500",     # Grouping of ossec rules - parent
    "501",     # New agent connected
    "520",     # Duplicate IP when adding an agent

    # --- Rootcheck / scan lifecycle noise ---
    "509",     # Rootcheck event - parent
    "510",     # Host-based anomaly detection event - generic parent
    "511",     # Ignored common NTFS ADS entries (Thumbs.db, Zone.Identifier)
    "512",     # Windows Audit event
    "514",     # Windows application monitor: new application found
    "515",     # Ignoring scan start/end messages (rootcheck, syscheck, OpenSCAP, CIS-CAT, vuln scan, Azure-logs)
    "516",     # System Audit event
    "532",     # Ignoring external media (cdrom/usb/floppy/dvd) mount events
    "536",     # Ignore snap-disk 100% capacity (packaging false positive)

    # --- Process monitoring routine output ---
    "530",     # OSSEC process monitoring rules - parent
    "534",     # List of logged-in users ('w' command) - no_log by default already
    "535",     # List of last logged-in users ('last -n')

    # --- Log rotation / logcollector ---
    "591",     # Log file rotated - routine housekeeping
    "700",     # Logcollector messages grouped - parent
    "701",     # Ignore informational logcollector startup messages

    # --- Active response confirmations ---
    "600",     # Active response messages grouped - parent
    "601",     # Host blocked by firewall-drop.sh
    "602",     # Host unblocked by firewall-drop.sh
    "603",     # Host blocked by host-deny.sh
    "604",     # Host unblocked by host-deny.sh
    "605",     # Host blocked by route-null
    "606",     # Host unblocked by route-null
    "607",     # Generic active response confirmation

    # --- PAM / Linux auth sessions ---
    "5501",    # PAM: Login session opened
    "5502",    # PAM: Login session closed

    # --- Linux audit (auditd) routine visibility ---
    "80705",   # Auditd: Configuration changed
    "80730",   # Auditd: SELinux permission check
    "100180",  # Auditd Process creation
    "100215",  # Generic process execution visibility - too noisy for TheHive

    # --- Package management (dpkg) ---
    "2902",    # New dpkg (Debian Package) installed
    "2904",    # Dpkg (Debian Package) half configured

    # --- Windows service/system housekeeping ---
    "60132",   # System time changed
    "60608",   # Summary event of the report's signatures
    "60642",   # Software protection service scheduled successfully
    "60702",   # The VSS service is shutting down due to idle timeout
    "60775",   # WSearch was unavailable to handle a notification event
    "60776",   # Windows service unavailable to handle notification event (SessionEnv, WSearch, etc.) - routine service hiccup
    "60778",   # The shell stopped unexpectedly
    "61102",   # Windows System error event
    "92154",   # Process loaded taskschd.dll module. May be used to create delayed malware execution

    # --- Windows logon/privilege routine ---
    "67023",   # Non service account logged off
    "67028",   # Special privileges assigned to new logon
    # "67022", # Non network or service local logon -- kept OFF: real human logon/unlock activity

    # --- Web logs ---
    "31108",   # Http web log

    # --- Syscheck (FIM) - see conflict note below before enabling ---
    "550",     # Integrity check
    "100220", #noraml comamnds of dvwa like echo, pwd, cd




}

# Windows Event IDs to suppress regardless of which rule maps to them.
# More precise than SUPPRESSED_RULE_IDS - use this when a rule covers
# multiple event IDs and you only want to silence specific ones.
SUPPRESSED_EVENT_IDS = {
    "4634",   # An account was logged off - routine, high-volume, not actionable
}


# Rule IDs that ALWAYS go to TheHive, no matter what - bypasses suppression list
# and any severity threshold. Use for high-value, low-noise signals: defense
# evasion, credential access, log tampering, brute-force, privilege escalation.
ALWAYS_ESCALATE_RULE_IDS = {
    "504",     # Wazuh agent disconnected - possible defense evasion (T1562.001)
    "505",     # Wazuh agent removed
    "506",     # Wazuh agent stopped
    "592",     # Log file size reduced - log tampering (T1565.001)
    "593",     # Windows Event log cleared - anti-forensics (T1070)
    "5712",    # sshd brute force detected (correlated)
    "5758",    # Max auth attempts exceeded (correlated)
    "411",     # Wazuh API unauthorized
    "412",     # Wazuh API forbidden
    "428",     # Wazuh API brute-force (T1110)
    "92004",   # Powershell process spawned Windows command shell instance
    "100199",   #blacklisted commands
    "92032",   # Suspicious Windows cmd shell execution


}
BURST_EXCLUDE_RULE_IDS = set(ALWAYS_ESCALATE_RULE_IDS)
BURST_WINDOW_SECONDS = 120; BURST_MAX_STAGES = 200; PROCESS_FANOUT_WINDOW_SECONDS = 30
WATCHLIST_PATTERNS = ["shadow","passwd","curl","wget","base64 -d","base64 --decode","nc ","ncat","/dev/tcp/","chmod +s","chmod 4755","visudo","authorized_keys","history -c"," rm -rf /"]
_BUILTIN_FINGERPRINTS={"tools":{"Hydra":["hydra"],"sqlmap":["sqlmap"],"Nikto":["nikto"],"wfuzz":["wfuzz"],"ffuf":["ffuf","fuzz faster u fool"],"gobuster":["gobuster"],"dirbuster":["dirbuster"],"masscan":["masscan"],"Nmap":["nmap"],"Nuclei":["nuclei"],"WPScan":["wpscan","wp-scan"]},"umbrellas":["et scan","et policy","et web_specific_apps","generic protocol command decode"]}
TOOL_CAMPAIGN_IDLE_TIMEOUT_SECONDS=1800  # silence from a tool+IP+target closes the campaign; next hit starts fresh (no stage-count cap)
WATCHLIST_WINDOW_SECONDS=120  # same pattern+src_ip+agent within this window aggregates into one TheHive alert

# ---------------- runtime config (env, no secrets) ----------------
def _env_float(n,d):
    try: return float(os.environ.get(n,d))
    except (TypeError,ValueError): return d
def _env_int(n,d):
    try: return int(os.environ.get(n,d))
    except (TypeError,ValueError): return d
FLUSH_INTERVAL_SECONDS=_env_float("THEHIVE_FLUSH_INTERVAL",5.0); FLUSH_BATCH_GROUPS=_env_int("THEHIVE_FLUSH_BATCH",50)
RETRY_BASE_DELAY=_env_float("THEHIVE_RETRY_BASE",2.0); RETRY_MAX_DELAY=_env_float("THEHIVE_RETRY_MAX",300.0)
MAX_RETRIES=_env_int("THEHIVE_MAX_RETRIES",8); CLAIM_LEASE_SECONDS=_env_float("THEHIVE_CLAIM_LEASE",90.0)
# Worst legitimate flight: one bounded render plus, on the reconcile path, up to THREE
# sequential capped HTTP calls (CREATE + sourceRef lookup + PATCH ≈ 60s worst-case) +
# ms of SQLite. 90s covers that with margin while bounding crashed-claim recovery;
# expiry itself is safe anyway (idempotent PATCH / server-rejected CREATE + reconcile).
# NOTE: the CORRELATION_DB env override MUST stay above METRICS_FILE: the metrics default
# is defined as "<db-dir>/thehive_flush_metrics.json" and is baked once at import time.
if os.environ.get("THEHIVE_CORRELATION_DB"): CORRELATION_DB=os.environ["THEHIVE_CORRELATION_DB"]
METRICS_FILE=os.environ.get("THEHIVE_METRICS_FILE") or os.path.join(os.path.dirname(CORRELATION_DB) or ".","thehive_flush_metrics.json")
BACKPRESSURE_THRESHOLD=_env_int("THEHIVE_BACKPRESSURE_STAGES",20000)
PRUNE_INTERVAL_SECONDS=_env_float("THEHIVE_PRUNE_INTERVAL",300.0)
HTTP_READ_TIMEOUT=_env_float("THEHIVE_TIMEOUT",15.0); HTTP_TIMEOUT=(5.0, HTTP_READ_TIMEOUT)
INLINE_FLUSH_ENABLED=os.environ.get("THEHIVE_INLINE_FLUSH","0")=="1"
CRITICAL_INLINE_ENABLED=os.environ.get("THEHIVE_CRITICAL_INLINE","1")=="1"
DEFAULT_BASE_URL="http://10.122.0.4:9000/api/v1"
PENDING_PREFIX="PENDING-"; _SHUTDOWN=False
_RUNTIME_URL=None; _RUNTIME_TOKEN=None
def _handle_signal(s,f):
    global _SHUTDOWN; _SHUTDOWN=True; logging.info(f"Received signal {s}, graceful shutdown after current item")
try:
    signal.signal(signal.SIGTERM,_handle_signal); signal.signal(signal.SIGINT,_handle_signal)
except Exception: pass

def _looks_like_url(v): return isinstance(v,str) and v.startswith(("http://","https://"))
def _looks_like_token(v): return isinstance(v,str) and len(v)>=12 and not v.startswith("-") and " " not in v and not _looks_like_url(v) and not v.endswith(".json")
_WARNED_MEM={}
def _warn_marker_path(key):
    try: dd=os.path.dirname(CORRELATION_DB)
    except Exception: dd=""
    return os.path.join(dd or ".",".warned_"+key)
def _touch_marker(path):
    try:
        fd=os.open(path,os.O_WRONLY|os.O_CREAT,0o600)
        try: os.close(fd)
        except Exception: pass
    except Exception: pass
def _warn_once(key,msg):
    """Warn-once that survives the fork/exec model: module globals reset on EVERY Wazuh
    invocation (one process per alert), so in-memory flags only work for --flush-daemon.
    Steady state costs ONE os.path.exists stat (~microseconds, zero SQLite): the sentinel
    file short-circuits before any connection is opened, so the normal running mode pays
    no DB tax at all — not even for alerts dropped later by suppression rules. The DB
    marker in flush_meta remains the cross-process source of truth for the first
    occurrence. Ordering is deliberately log-then-record (at-least-once): a thundering
    herd on first-ever misconfiguration may log a handful of duplicates in a brief race
    window (SELECT/INSERT not atomic), which is harmless for a warning; the reverse order
    could lose the warning entirely on a crash. Fail-open: a marker failure must never
    silence a config warning."""
    try:
        if _WARNED_MEM.get(key): return
        _WARNED_MEM[key]=True
        marker=_warn_marker_path(key)
        try:
            if os.path.exists(marker): return
        except Exception: pass
        c=_connect()
        try:
            if c.execute("SELECT 1 FROM flush_meta WHERE key=?",(key,)).fetchone():
                _touch_marker(marker); return
            logging.error(msg)
            try:
                c.execute("INSERT INTO flush_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING",(key,"1")); c.commit()
            except Exception: pass
            _touch_marker(marker)
        finally:
            try: c.close()
            except Exception: pass
    except Exception:
        try: logging.error(msg)
        except Exception: pass
def resolve_runtime_config(argv):
    """Wire env config + optional Wazuh argv (alert_file [api_key] [hook_url]). Never logs the token."""
    global _RUNTIME_URL, _RUNTIME_TOKEN
    url=os.environ.get("THEHIVE_URL") or os.environ.get("THEHIVE_BASE_URL")
    tok=os.environ.get("THEHIVE_API_TOKEN") or os.environ.get("THEHIVE_API_KEY") or os.environ.get("THEHIVE_TOKEN")
    # Credential scan applies ONLY to Wazuh ingest mode (argv[1] = alert file). Daemon /
    # one-shot modes pass flags and values positionally (--interval 5, group ids) that
    # must never be mistaken for credentials: "5" would log-spam every daemon cycle,
    # and "activity_burst" actually looks token-like and would corrupt auth entirely.
    cands=argv[2:4] if len(argv)>2 and not str(argv[1]).startswith("--") else []
    for pos,a in enumerate(cands,start=2):
        if _looks_like_url(a) and not url: url=a
        elif _looks_like_token(a) and not tok: tok=a
        elif a and not str(a).startswith("-"):
            # Loud rejection (length/position only, NEVER the value): a short/malformed
            # token would otherwise fail silently into "token missing; deferred" later.
            # Prefer THEHIVE_API_TOKEN / THEHIVE_URL env vars over argv (also avoids
            # exposing the credential in the process list).
            logging.error(f"Ignoring unrecognized integration argument at position {pos} (len={len(str(a))}); expected a >=12-char API token or http(s) hook URL — value NOT logged.")
    if not url:
        url=DEFAULT_BASE_URL
        _warn_once("warned_default_url",f"No THEHIVE_URL configured; using built-in default {url}. Set THEHIVE_URL env.")
    if url.startswith("http://"):
        _warn_once("warned_http","TheHive URL is plain HTTP: the bearer token travels in cleartext. Prefer https:// with THEHIVE_VERIFY_SSL=1.")
    _RUNTIME_URL=url.rstrip("/"); _RUNTIME_TOKEN=tok
    return _RUNTIME_URL, _RUNTIME_TOKEN
def _auth_headers():
    if not _RUNTIME_TOKEN: return {"Content-Type":"application/json"}
    return {"Authorization":f"Bearer {_RUNTIME_TOKEN}","Content-Type":"application/json"}
def _thehive_configured():
    if _RUNTIME_URL is None or _RUNTIME_TOKEN is None: resolve_runtime_config(sys.argv)
    return bool(_RUNTIME_TOKEN)

# ---------------- pure helpers (VERBATIM) ----------------
def safe_get(d,path,default=None):
    cur=d
    for k in path.split("."):
        if isinstance(cur,dict) and k in cur: cur=cur[k]
        else: return default
    return cur
def flatten(v):
    if v is None: return []
    if isinstance(v,list): return [str(x) for x in v if x not in (None,"")]
    return [str(v)]
TIME_DISPLAY_TZ_OFFSET=_env_float("THEHIVE_DISPLAY_TZ_OFFSET",0.0)
try:
    if TIME_DISPLAY_TZ_OFFSET!=TIME_DISPLAY_TZ_OFFSET or abs(TIME_DISPLAY_TZ_OFFSET)>=24: TIME_DISPLAY_TZ_OFFSET=0.0  # NaN/out-of-range guard
except Exception: TIME_DISPLAY_TZ_OFFSET=0.0
def _tz_suffix():
    if not TIME_DISPLAY_TZ_OFFSET: return ""
    sign="+" if TIME_DISPLAY_TZ_OFFSET>=0 else "-"
    hh,mm=divmod(int(round(abs(TIME_DISPLAY_TZ_OFFSET)*60)),60)
    return f" (UTC{sign}{hh:02d}:{mm:02d})"
def _display_ts(ts):
    """Human-readable timestamp in the operator display zone (THEHIVE_DISPLAY_TZ_OFFSET
    hours, e.g. 5.5 for IST). Display ONLY: epoch fields (TheHive date/lastSyncDate,
    metrics) are absolute instants and are never shifted. Unparseable input returns the
    raw string unchanged (never now-fallback, never raises), so rendering can't break."""
    try:
        if TIME_DISPLAY_TZ_OFFSET and isinstance(ts,str) and ts and ts!="n/a":
            n=ts.replace("Z","+0000"); dt=None
            for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z","%Y-%m-%dT%H:%M:%S%z"):
                try: dt=datetime.strptime(n,fmt); break
                except ValueError: continue
            if dt is not None:
                if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
                loc=dt.astimezone(timezone.utc)+timedelta(seconds=int(round(TIME_DISPLAY_TZ_OFFSET*3600)))
                return loc.strftime("%Y-%m-%dT%H:%M:%S")+_tz_suffix()
    except Exception: pass
    return ts
def _display_span(first_ts,last_ts):
    """Compact Time-span line. Default (offset 0) returns the raw join byte-identical to
    before. With a display zone set: same-day spans collapse to one date, fractional
    seconds drop, zone labeled once. Any parse trouble falls back to the raw join."""
    if not TIME_DISPLAY_TZ_OFFSET: return f"{first_ts} → {last_ts}"
    try:
        fa=_display_ts(first_ts); la=_display_ts(last_ts)
        fdt,fz=fa.rsplit(" ",1); ldt,lz=la.rsplit(" ",1)
        fd,ft=fdt.split("T"); ld,lt=ldt.split("T")
        if fd==ld and fz==lz: return f"{fd} {ft} → {lt} ({fz.strip('()')})"
        return f"{fa} → {la}"
    except Exception: return f"{first_ts} → {last_ts}"
def parse_iso_to_epoch_ms(ts):
    # Coerce defensively: alert-derived timestamps can be non-strings (int/float/list)
    # on odd inputs; ts.replace would raise AttributeError and abort the whole flush
    # batch. Non-string/empty values fall through to now, same as before.
    if isinstance(ts,str) and ts and ts!="n/a":
        n=ts.replace("Z","+0000")
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z","%Y-%m-%dT%H:%M:%S%z"):
            try: return int(datetime.strptime(n,fmt).timestamp()*1000)
            except ValueError: continue
        # Audible fallback (not silent): a new Wazuh timestamp shape must leave a trace,
        # otherwise affected alerts silently carry ingestion time as event time in TheHive.
        # Fires only on actual parse failure (exceptional), with the value truncated.
        logging.warning(f"Unparseable Wazuh timestamp {str(ts)[:80]!r}; using now for TheHive date fields")
    elif ts and ts!="n/a":
        logging.warning(f"Non-string Wazuh timestamp {str(ts)[:80]!r}; using now for TheHive date fields")
    return int(time.time()*1000)
def extract_proctitle(a):
    raw=safe_get(a,"full_log","")
    if not raw: return None
    m=re.search(r"proctitle=([0-9A-Fa-f]+)",raw)
    if not m: return None
    try: d=bytes.fromhex(m.group(1)).decode("utf-8",errors="replace")
    except ValueError: return None
    return (d.replace("\x00"," ").strip() or None)
def build_audit_summary(a):
    audit=safe_get(a,"data.audit")
    if audit:
        def uq(v): return v.strip('"') if isinstance(v,str) else v
        cmd=uq(audit.get("command","")); exe=uq(audit.get("exe","")); key=audit.get("key",""); uid=audit.get("uid",""); euid=audit.get("euid",""); cwd=uq(audit.get("cwd","")); success=audit.get("success","")
        ex=audit.get("execve",{}); args=[uq(v) for k,v in sorted(ex.items()) if k.startswith("a") and k!="argc"]
        fn=uq(safe_get(audit,"file.name","")); pt=extract_proctitle(a)
        if args: fc=" ".join(args); cl="Command"
        elif pt: fc=pt; cl="Command"
        elif fn: fc=f"{cmd} ({fn})"; cl="File accessed"
        else: fc=cmd; cl="Command"
        L=[f"**{cl}**: `{fc}`"]
        if exe: L.append(f"**Executable**: {exe}")
        if key: L.append(f"**Audit key**: {key}")
        if cwd: L.append(f"**Working directory**: {cwd}")
        if uid: L.append(f"**UID / EUID**: {uid} / {euid}")
        if success: L.append(f"**Success**: {success}")
        return "\n".join(L)
    d=safe_get(a,"data")
    if isinstance(d,dict) and "command" in d:
        L=[f"**Command**: `{d.get('command','')}`"]
        if d.get("srcuser"): L.append(f"**Source user**: {d.get('srcuser')}")
        if d.get("dstuser"): L.append(f"**Target user**: {d.get('dstuser')}")
        if d.get("tty"): L.append(f"**TTY**: {d.get('tty')}")
        if d.get("pwd"): L.append(f"**Working directory**: {d.get('pwd')}")
        return "\n".join(L)
    return None
def build_suricata_summary(a):
    d=safe_get(a,"data")
    if not d or safe_get(d,"alert.signature") is None: return None
    L=[f"**Signature**: {safe_get(d,'alert.signature','n/a')}"]
    if safe_get(d,"alert.category",""): L.append(f"**Category**: {safe_get(d,'alert.category','')}")
    if safe_get(d,"alert.action",""): L.append(f"**Action**: {safe_get(d,'alert.action','')}")
    L.append(f"**Flow**: {safe_get(d,'src_ip','n/a')}:{safe_get(d,'src_port','')} -> {safe_get(d,'dest_ip','n/a')}:{safe_get(d,'dest_port','')} ({safe_get(d,'proto','')}/{safe_get(d,'app_proto','')})".strip())
    if safe_get(d,"alert.severity",""): L.append(f"**Severity (Suricata)**: {safe_get(d,'alert.severity','')}")
    h=safe_get(d,"http")
    if h:
        L.append(f"**HTTP**: {safe_get(h,'http_method','')} {safe_get(h,'hostname','')}{safe_get(h,'url','')}".strip())
        if safe_get(h,"status",""): L.append(f"**Status**: {safe_get(h,'status','')}")
        if safe_get(h,"redirect",""): L.append(f"**Redirect**: {safe_get(h,'redirect','')}")
        if safe_get(h,"http_user_agent",""): L.append(f"**User-Agent**: {safe_get(h,'http_user_agent','')}")
    dns=safe_get(d,"dns")
    if dns:
        rn=safe_get(dns,"rrname",""); rt=safe_get(dns,"rrtype","")
        if not rn:
            # Standard EVE JSON carries dns.queries as a LIST of query objects, which
            # dotted-path safe_get() cannot traverse (dict keys only) — the old
            # "queries.0.rrname" fallback could never succeed. Read [0] directly.
            qs=safe_get(dns,"queries")
            if isinstance(qs,list) and qs and isinstance(qs[0],dict):
                rn=qs[0].get("rrname","")
                if not rt: rt=qs[0].get("rrtype","")
        if rn: L.append(f"**DNS Query**: {rn} ({rt})")
    tls=safe_get(d,"tls")
    if tls:
        if safe_get(tls,"sni",""): L.append(f"**TLS SNI**: {safe_get(tls,'sni','')}")
        if safe_get(tls,"subject",""): L.append(f"**TLS Subject**: {safe_get(tls,'subject','')}")
    return "\n".join(x for x in L if x)
def build_windows_summary(a):
    ev=safe_get(a,"data.win.eventdata")
    if not ev: return None
    sy=safe_get(a,"data.win.system",{})
    L=[f"**Event ID**: {safe_get(sy,'eventID','n/a')}"+(f" ({safe_get(sy,'providerName','')})" if safe_get(sy,'providerName','') else "")]
    if safe_get(ev,"image"): L.append(f"**Image**: {safe_get(ev,'image')}")
    if safe_get(ev,"commandLine"): L.append(f"**Command Line**: `{safe_get(ev,'commandLine')}`")
    if safe_get(ev,"parentImage"): L.append(f"**Parent Image**: {safe_get(ev,'parentImage')}")
    u=safe_get(ev,"user") or safe_get(ev,"subjectUserName")
    if u: L.append(f"**User**: {u}")
    if safe_get(ev,"targetUserName"): L.append(f"**Target User**: {safe_get(ev,'targetUserName')}")
    if safe_get(ev,"destinationIp"): L.append(f"**Destination**: {safe_get(ev,'destinationIp')}:{safe_get(ev,'destinationPort')}".rstrip(":"))
    if safe_get(ev,"targetFilename"): L.append(f"**Target File**: {safe_get(ev,'targetFilename')}")
    if safe_get(ev,"logonType"): L.append(f"**Logon Type**: {safe_get(ev,'logonType')}")
    if safe_get(ev,"ipAddress"): L.append(f"**Source IP**: {safe_get(ev,'ipAddress')}")
    return "\n".join(L) if len(L)>1 else None
def build_generic_summary(a):
    d=safe_get(a,"data")
    if not isinstance(d,dict) or not d: return None
    L=[]
    for k,v in d.items():
        if isinstance(v,(dict,list)): continue
        if v in (None,""): continue
        L.append(f"**{k}**: {v}")
    return "\n".join(L[:15]) if L else None
SUMMARY_BUILDERS=[build_audit_summary,build_suricata_summary,build_windows_summary,build_generic_summary]
def build_key_details(a):
    for b in SUMMARY_BUILDERS:
        try: s=b(a)
        except Exception as e: logging.error(f"Summary builder {b.__name__} failed: {type(e).__name__}"); s=None
        if s: return s
    return None
def clean_audit_log(r):
    if not r or "type=" not in r: return r
    def dm(m):
        try: return "proctitle="+bytes.fromhex(m.group(1)).decode("utf-8",errors="replace").replace("\x00"," ").strip()
        except ValueError: return m.group(0)
    return re.sub(r"(?<!^)(type=)",r"\n\1",re.sub(r"proctitle=([0-9A-Fa-f]+)",dm,r)).strip()
def get_full_log_text(a):
    r=safe_get(a,"full_log")
    if r: return clean_audit_log(r)
    m=safe_get(a,"data.win.system.message")
    if m: return m.strip().strip('"')
    return json.dumps(a,indent=2)[:FULL_LOG_FALLBACK_MAX_CHARS]
def severity_from_level(l):
    try: l=int(l)
    except (TypeError,ValueError): return 2
    if l>=15: return 4
    if l>=12: return 3
    if l>=7: return 2
    return 1
def severity_label(n): return {1:"Low",2:"Medium",3:"High",4:"Critical"}.get(n,"Unknown")
def build_observables(a):
    obs=[]; seen=set()
    def add(dt,vals,tags=None):
        for v in flatten(vals):
            v=v.strip()
            if not v or (dt,v) in seen: continue
            seen.add((dt,v)); e={"dataType":dt,"data":v,"ioc":False}
            if tags: e["tags"]=tags
            obs.append(e)
    add("ip",safe_get(a,"data.srcip")); add("ip",safe_get(a,"data.dstip")); add("ip",safe_get(a,"data.src_ip")); add("ip",safe_get(a,"data.dest_ip"))
    add("ip",safe_get(a,"data.win.eventdata.destinationIp")); add("ip",safe_get(a,"data.win.eventdata.ipAddress"))
    add("other",safe_get(a,"data.srcuser"),tags=["type:username","field:srcuser"]); add("other",safe_get(a,"data.dstuser"),tags=["type:username","field:dstuser"])
    add("hash",safe_get(a,"syscheck.sha256_after")); add("hash",safe_get(a,"syscheck.md5_after")); add("filename",safe_get(a,"syscheck.path"))
    add("url",safe_get(a,"data.url")); add("url",safe_get(a,"data.http.url")); add("domain",safe_get(a,"data.hostname"))
    add("domain",safe_get(a,"data.http.hostname")); add("domain",safe_get(a,"data.tls.sni"))
    add("other",safe_get(a,"data.vulnerability.cve"),tags=["cve"])
    add("filename",safe_get(a,"data.win.eventdata.image"),tags=["type:process_image"])
    return obs
def build_tags(a):
    t=[]; t+=flatten(safe_get(a,"rule.groups")); t+=flatten(safe_get(a,"rule.mitre.id")); t+=[f"agent:{safe_get(a,'agent.name','unknown')}"]
    return list(dict.fromkeys(t))
def build_alert_payload(a):
    rid=str(safe_get(a,"rule.id","unknown")); rd=safe_get(a,"rule.description","Wazuh Alert"); lv=safe_get(a,"rule.level",0)
    ag=safe_get(a,"agent.name","unknown-agent"); ts=safe_get(a,"timestamp","n/a"); aid=safe_get(a,"id",str(time.time()))
    kd=build_key_details(a); fl=get_full_log_text(a)
    dl=[f"**Rule**: {rid} - {rd}",f"**Level**: {lv}",f"**Agent**: {ag}",f"**Timestamp**: {_display_ts(ts)}",""]
    if kd: dl+=["### Key Details",kd,""]
    dl+=["### Full Log",f"```\n{fl}\n```"]
    ms=parse_iso_to_epoch_ms(ts)
    return {"type":"wazuh_alert","source":"wazuh","sourceRef":f"{aid}-{rid}","title":f"[{ag}] {rd}"[:200],"description":"\n".join(dl),"severity":severity_from_level(lv),"tlp":TLP,"pap":PAP,"tags":build_tags(a),"observables":build_observables(a),"date":ms,"lastSyncDate":ms}
def extract_process_ids(a):
    p=safe_get(a,"data.win.eventdata.processId"); pp=safe_get(a,"data.win.eventdata.parentProcessId")
    if p or pp: return p,pp,"windows"
    p=safe_get(a,"data.audit.pid"); pp=safe_get(a,"data.audit.ppid")
    if p or pp: return p,pp,"audit"
    return None,None,None
def _is_wazuh_path_norm(p):
    if not p: return False
    return any(x.search(re.sub(r'\\{2,}',r'\\',p)) for x in WAZUH_PROCESS_PATTERNS)
def extract_process_images(a):
    o=safe_get(a,"data.win.eventdata.image"); q=safe_get(a,"data.win.eventdata.parentImage")
    if o or q: return o,q
    return safe_get(a,"data.audit.exe"),None
def extract_process_chain_fields(a):
    pid,ppid,_=extract_process_ids(a)
    return {"image":safe_get(a,"data.win.eventdata.image") or safe_get(a,"data.audit.exe") or "n/a","cmdline":safe_get(a,"data.win.eventdata.commandLine") or extract_proctitle(a) or safe_get(a,"data.audit.command") or "","user":safe_get(a,"data.win.eventdata.user") or safe_get(a,"data.audit.uid") or "n/a","pid":pid or "n/a","ppid":ppid or "n/a","agent_name":safe_get(a,"agent.name","unknown-agent")}
def _normalize_user(u): return u.split("@")[0].rstrip("$").upper() if u else u
def _normalize_source(s): return "127.0.0.1" if s=="::1" else s
def extract_logon_identity(a):
    u=safe_get(a,"data.win.eventdata.targetUserName")
    if u:
        s=safe_get(a,"data.win.eventdata.ipAddress") or safe_get(a,"data.win.eventdata.workstationName") or "local"
        lt=safe_get(a,"data.win.eventdata.logonType",""); k="logoff" if str(safe_get(a,"rule.id"))=="60137" else "logon"
        return _normalize_user(u),_normalize_source(s),f"windows(type {lt})" if lt else "windows",k
    u=safe_get(a,"data.srcuser") or safe_get(a,"data.dstuser"); ip=safe_get(a,"data.srcip")
    if u and ip: return _normalize_user(u),_normalize_source(ip),"linux_ssh","logon_failed" if str(safe_get(a,"rule.id"))=="5716" else "logon"
    return None,None,None,None
def extract_logon_fields(a):
    u,s,p,k=extract_logon_identity(a)
    return {"user":u,"source":s,"platform":p,"kind":k,"agent_name":safe_get(a,"agent.name","unknown-agent")}
def detect_burst_source_type(a):
    if safe_get(a,"data.win.eventdata"): return "windows"
    d=safe_get(a,"data")
    if isinstance(d,dict) and safe_get(d,"alert.signature") is not None: return "suricata"
    if safe_get(a,"data.audit"): return "audit_nested"
    if isinstance(d,dict) and "command" in d: return "audit_flat"
    return "generic"
def extract_burst_fields(a,st):
    if st=="windows":
        ev=safe_get(a,"data.win.eventdata",{}); sy=safe_get(a,"data.win.system",{})
        f={"Event ID":safe_get(sy,"eventID","n/a"),"Image":safe_get(ev,"image","n/a"),"User":safe_get(ev,"user") or safe_get(ev,"subjectUserName") or "n/a","Target / Command":safe_get(ev,"commandLine") or safe_get(ev,"targetFilename") or "n/a"}
    elif st=="suricata":
        d=safe_get(a,"data",{}); f={"Signature":safe_get(d,"alert.signature","n/a"),"Src":f"{safe_get(d,'src_ip','?')}:{safe_get(d,'src_port','')}","Dst":f"{safe_get(d,'dest_ip','?')}:{safe_get(d,'dest_port','')}","Proto":f"{safe_get(d,'proto','')}/{safe_get(d,'app_proto','')}".strip("/")}
    elif st=="audit_nested":
        au=safe_get(a,"data.audit",{}); uq=lambda v: v.strip('"') if isinstance(v,str) else v
        ex=au.get("execve",{}); ap=[uq(v) for k,v in sorted(ex.items()) if k.startswith("a") and k!="argc"]
        f={"Command":" ".join(ap) if ap else uq(au.get("command","")) or uq(au.get("exe","n/a")),"User":au.get("uid","n/a"),"CWD":uq(au.get("cwd","n/a"))}
    elif st=="audit_flat":
        d=safe_get(a,"data",{}); f={"Command":d.get("command","n/a"),"User":d.get("srcuser") or d.get("dstuser") or "n/a","TTY":d.get("tty","n/a"),"PWD":d.get("pwd","n/a")}
    else:
        d=safe_get(a,"data",{}); f={}
        if isinstance(d,dict):
            for k,v in [(k,v) for k,v in d.items() if not isinstance(v,(dict,list)) and v not in (None,"")][:4]: f[k]=v
        if not f: f={"Detail":"n/a"}
    f["_agent_name"]=safe_get(a,"agent.name","unknown-agent"); f["_source_type"]=st; return f
def watchlist_match(rf):
    h=" ".join(str(v) for k,v in rf.items() if not k.startswith("_")).lower()
    for p in WATCHLIST_PATTERNS:
        if p.lower() in h: return p
    return None
def _sequential_alert_blocks(stages,fn):
    L=[]
    for s in stages:
        L.append(f"**Alert {s['stage_num']}** — {_display_ts(s['timestamp'])} (rule {s['rule_id']}: {s['rule_description']})"); L.append("")
        for x in fn(s): L.append(x)
        L+=["","---",""]
    return "\n".join(L)
def _full_logs_block(stages):
    L=["### Full Logs",""]
    for s in stages: L+=[f"**Full log alert {s['stage_num']}:**",f"```\n{s['full_log']}\n```","","---",""]
    return "\n".join(L)
def _merge_observables(stages):
    seen=set(); m=[]
    for s in stages:
        for o in s["observables"]:
            k=(o.get("dataType"),o.get("data"))
            if k not in seen: seen.add(k); m.append(o)
    return m
def _merge_tags(stages,extra_tags=None):
    t=[]
    for s in stages: t+=s["tags"]
    if extra_tags: t+=extra_tags
    return list(dict.fromkeys(t))
def render_process_chain(stages):
    d=len(stages); f,l=stages[0],stages[-1]; ms=max(s["severity"] for s in stages); ag=f["raw_fields"].get("agent_name","unknown-agent")
    su="\n".join([x for x in [f"## Process Chain — {d} stage{'s' if d!=1 else ''}",f"**Agent**: {ag}",f"**Time span**: {_display_span(f['timestamp'],l['timestamp'])}",f"**Highest severity**: {severity_label(ms)} ({ms})",f"**Root process**: {f['raw_fields'].get('image','n/a')}",f"**Deepest process**: {l['raw_fields'].get('image','n/a')}" if d>1 else "",f"**Users involved**: {', '.join(sorted({s['raw_fields'].get('user','n/a') for s in stages}))}",f"**Distinct images**: {len(sorted({s['raw_fields'].get('image','n/a') for s in stages}))}",""] if x!=""])
    def fl(s):
        r=s["raw_fields"]; o=[f"Image: {r.get('image','n/a')}",f"PID → PPID: {r.get('pid','n/a')} → {r.get('ppid','n/a')}",f"User: {r.get('user','n/a')}"]
        if r.get("cmdline"): o.append(f"Command Line: `{r.get('cmdline')}`")
        return o
    b=_sequential_alert_blocks(stages,fl)
    t=f"[CHAIN x{d}] [{ag}] {l['rule_description']}" if d>1 else f"[{ag}] {f['rule_description']}"
    return t[:200],su+"\n---\n\n"+b+"\n"+_full_logs_block(stages)
def render_process_fanout(stages):
    t=len(stages); f,l=stages[0],stages[-1]; ag=f["raw_fields"].get("agent_name","unknown-agent"); ms=max(s["severity"] for s in stages)
    pp=f["raw_fields"].get("ppid","n/a"); op=f["raw_fields"].get("pid","n/a"); pk=bool(pp) and pp!="n/a"
    if pk: kd=f"{t} sibling event{'s' if t!=1 else ''} sharing untracked parent PID {pp}"; note="_Parent process never produced its own audit record (no execve logged for it), so these children can't attach to a process_chain group. Grouped here by shared parent PID instead._"; ts=f"parent PID {pp}"
    else: kd=f"{t} action{'s' if t!=1 else ''} performed by process PID {op}"; note="_This event type never carries a parent process ID (e.g. Sysmon registry, file, or image-load events only report their own PID), so individual actions can't chain to a parent. Grouped here by the acting process instead._"; ts=f"PID {op}"
    su="\n".join([f"## Process Fan-Out — {kd}",f"**Agent**: {ag}",f"**Time span**: {_display_span(f['timestamp'],l['timestamp'])}",f"**Highest severity**: {severity_label(ms)} ({ms})",f"**Users involved**: {', '.join(sorted({s['raw_fields'].get('user','n/a') for s in stages}))}",f"**Distinct images**: {', '.join(sorted({s['raw_fields'].get('image','n/a') for s in stages}))}","",note,""])
    def fl(s):
        r=s["raw_fields"]; o=[f"Image: {r.get('image','n/a')}",f"PID: {r.get('pid','n/a')}",f"User: {r.get('user','n/a')}"]
        if r.get("cmdline"): o.append(f"Command Line: `{r.get('cmdline')}`")
        return o
    return f"[FANOUT x{t}] [{ag}] {ts}"[:200],su+"\n---\n\n"+_sequential_alert_blocks(stages,fl)+"\n"+_full_logs_block(stages)
def render_logon_group(stages):
    t=len(stages); f,l=stages[0],stages[-1]; r0=f["raw_fields"]; u=r0.get("user","n/a"); so=r0.get("source","n/a"); pl=r0.get("platform","n/a"); ag=r0.get("agent_name","unknown-agent")
    ks=[s["raw_fields"].get("kind","") for s in stages]; fa=sum(1 for k in ks if "failed" in k); ok=t-fa; ms=max(s["severity"] for s in stages)
    en="\n**⚠️ Note**: failed attempt(s) followed by a successful logon — review this group.\n" if fa>0 and ks and "failed" not in ks[-1] else ""
    su="\n".join([f"## Logon Activity — {u} @ {so}",f"**Platform**: {pl}",f"**Agent**: {ag}",f"**Time span**: {_display_span(f['timestamp'],l['timestamp'])}",f"**Attempts**: {t} total ({ok} succeeded, {fa} failed)",f"**Highest severity**: {severity_label(ms)} ({ms})",en,""])
    def fl(s): return [s["key_details"]] if s.get("key_details") else [f"Event: {s['raw_fields'].get('kind','n/a')}"]
    return f"[{t}x] [{ag}] Logon activity: {u} @ {so}"[:200],su+"\n---\n\n"+_sequential_alert_blocks(stages,fl)+"\n"+_full_logs_block(stages)
def render_activity_burst(stages):
    t=len(stages); f,l=stages[0],stages[-1]; ag=f["raw_fields"].get("_agent_name","unknown-agent"); rid=f["rule_id"]; rd=f["rule_description"]; ms=max(s["severity"] for s in stages)
    su="\n".join([f"## Activity Burst — {rd}",f"**Rule**: {rid}",f"**Agent**: {ag}",f"**Occurrences**: {t}",f"**Time span**: {_display_span(f['timestamp'],l['timestamp'])}",f"**Highest severity**: {severity_label(ms)} ({ms})",""])
    def fl(s):
        if s.get("key_details"): return [s["key_details"]]
        return [f"{k}: {v}" for k,v in s["raw_fields"].items() if not k.startswith("_")]
    return f"[{t}x] [{ag}] {rd}"[:200],su+"\n---\n\n"+_sequential_alert_blocks(stages,fl)+"\n"+_full_logs_block(stages)
def render_tool_campaign(stages):
    t=len(stages); f,l=stages[0],stages[-1]; r0=f["raw_fields"]; tool=r0.get("tool","unknown"); sip=r0.get("src_ip","n/a"); ag=r0.get("_agent_name","unknown-agent"); ms2=max(s["severity"] for s in stages)
    ports=sorted({str(s["raw_fields"].get("dest_port","")) for s in stages if str(s["raw_fields"].get("dest_port","")).strip().lower() not in ("","n/a")})
    urls=sorted({str(s["raw_fields"].get("url_or_path","")) for s in stages if str(s["raw_fields"].get("url_or_path","")).strip().lower() not in ("","n/a")})
    rules=sorted({f"{s['rule_id']}: {s['rule_description']}" for s in stages})
    sp=ports[:50]; spm=f" (+{len(ports)-50} more)" if len(ports)>50 else ""
    su2=urls[:30]; sum2=f" (+{len(urls)-30} more)" if len(urls)>30 else ""
    sr=rules[:50]; srm=f" (+{len(rules)-50} more)" if len(rules)>50 else ""
    L=[f"## Tool Campaign — {tool} from {sip}",f"**Agent (target)**: {ag}",f"**Hits**: {t}",f"**Time span**: {_display_span(f['timestamp'],l['timestamp'])}",f"**Highest severity**: {severity_label(ms2)} ({ms2})",f"**Destination ports ({len(ports)})**: {', '.join(sp)}{spm}",f"**Signatures ({len(rules)})**: {'; '.join(sr)}{srm}",f"**URLs/paths ({len(urls)})**:"]
    L+=["- `"+u+"`" for u in su2]
    if sum2: L+=["- ..."+sum2]
    L+=["","### Sample raw logs (first 5 + last 5 — sample, not a complete transcript)",""]
    seen=set(); sample=[]
    for s in stages[:5]+stages[-5:]:
        if s["stage_num"] not in seen: seen.add(s["stage_num"]); sample.append(s)
    for s in sample: L+=[f"**Sample alert {s['stage_num']} ({_display_ts(s['timestamp'])}, rule {s['rule_id']}):**",f"```\n{s['full_log']}\n```",""]
    return f"[TOOL:{tool} x{t}] [{ag}] {sip}"[:200],"\n".join(L)
def render_watchlist_group(stages):
    t=len(stages); f,l=stages[0],stages[-1]; ag=f["raw_fields"].get("_agent_name","unknown-agent"); pat=f["raw_fields"].get("_pattern","n/a"); sip=f["raw_fields"].get("_src_ip","n/a"); ms=max(s["severity"] for s in stages)
    su="\n".join([f"## Watchlist Match — {pat}",f"**Source IP**: {sip}",f"**Agent**: {ag}",f"**Occurrences**: {t}",f"**Time span**: {_display_span(f['timestamp'],l['timestamp'])}",f"**Highest severity**: {severity_label(ms)} ({ms})",""])
    def fl(s):
        if s.get("key_details"): return [s["key_details"]]
        return [f"{k}: {v}" for k,v in s["raw_fields"].items() if not k.startswith("_")]
    return f"[WATCHLIST x{t}: {pat}] [{ag}] {sip}"[:200],su+"\n---\n\n"+_sequential_alert_blocks(stages,fl)+"\n"+_full_logs_block(stages)
GROUP_RENDERERS={"process_chain":render_process_chain,"logon_group":render_logon_group,"activity_burst":render_activity_burst,"process_fanout":render_process_fanout,"tool_campaign":render_tool_campaign,"watchlist_group":render_watchlist_group}

# ---------------- persistence (queue/state, crash-safe) ----------------
SCHEMA_SQL="""CREATE TABLE IF NOT EXISTS recent_processes (agent_id TEXT, process_id TEXT, thehive_alert_id TEXT, chain_depth INTEGER DEFAULT 1, created_at REAL);
CREATE INDEX IF NOT EXISTS idx_recent_processes_lookup ON recent_processes(agent_id, process_id, created_at);
CREATE TABLE IF NOT EXISTS recent_logons (identity_key TEXT PRIMARY KEY, thehive_alert_id TEXT, event_count INTEGER DEFAULT 1, last_seen REAL);
CREATE TABLE IF NOT EXISTS group_stages (group_type TEXT, thehive_alert_id TEXT, stage_num INTEGER, timestamp TEXT, rule_id TEXT, rule_description TEXT, severity INTEGER, raw_fields TEXT, key_details TEXT, full_log TEXT, observables TEXT, tags TEXT, created_at REAL);
CREATE INDEX IF NOT EXISTS idx_group_stages_alert ON group_stages (group_type, thehive_alert_id);
CREATE INDEX IF NOT EXISTS idx_group_stages_num ON group_stages (group_type, thehive_alert_id, stage_num);
CREATE TABLE IF NOT EXISTS recent_bursts (burst_key TEXT PRIMARY KEY, thehive_alert_id TEXT, stage_count INTEGER DEFAULT 1, last_seen REAL);
CREATE TABLE IF NOT EXISTS recent_fanouts (burst_key TEXT PRIMARY KEY, thehive_alert_id TEXT, stage_count INTEGER DEFAULT 1, last_seen REAL);
CREATE TABLE IF NOT EXISTS recent_tool_campaigns (campaign_key TEXT PRIMARY KEY, thehive_alert_id TEXT, stage_count INTEGER DEFAULT 1, last_seen REAL);
CREATE TABLE IF NOT EXISTS recent_watchlist (watchlist_key TEXT PRIMARY KEY, thehive_alert_id TEXT, stage_count INTEGER DEFAULT 1, last_seen REAL);
CREATE TABLE IF NOT EXISTS wazuh_rooted_pids (agent_id TEXT, pid TEXT, created_at REAL, PRIMARY KEY (agent_id, pid));
CREATE TABLE IF NOT EXISTS pending_groups (group_type TEXT NOT NULL, thehive_alert_id TEXT NOT NULL, group_key TEXT DEFAULT '', dirty INTEGER DEFAULT 1, is_critical INTEGER DEFAULT 0, pending_stages INTEGER DEFAULT 0, total_stages INTEGER DEFAULT 0, generation INTEGER DEFAULT 0, state TEXT DEFAULT 'idle', claimed_at REAL DEFAULT 0, claimed_gen INTEGER DEFAULT 0, lease_until REAL DEFAULT 0, source_ref TEXT DEFAULT '', retry_count INTEGER DEFAULT 0, next_retry_at REAL DEFAULT 0, last_update REAL DEFAULT 0, created_at REAL DEFAULT 0, PRIMARY KEY (group_type, thehive_alert_id));
CREATE INDEX IF NOT EXISTS idx_pending_dirty ON pending_groups(dirty, next_retry_at, is_critical, last_update);
CREATE INDEX IF NOT EXISTS idx_pending_state ON pending_groups(state, lease_until);
CREATE TABLE IF NOT EXISTS standalone_outbox (source_ref TEXT PRIMARY KEY, payload TEXT NOT NULL, retry_count INTEGER DEFAULT 0, next_retry_at REAL DEFAULT 0, status TEXT DEFAULT 'queued', state TEXT DEFAULT 'idle', claimed_at REAL DEFAULT 0, lease_until REAL DEFAULT 0, created_at REAL DEFAULT 0);
CREATE INDEX IF NOT EXISTS idx_outbox_claim ON standalone_outbox(status, state, next_retry_at, lease_until);
CREATE TABLE IF NOT EXISTS seen_alerts (wazuh_id TEXT PRIMARY KEY, first_seen REAL);
CREATE TABLE IF NOT EXISTS group_counters (group_type TEXT NOT NULL, thehive_alert_id TEXT NOT NULL, next_stage INTEGER DEFAULT 0, PRIMARY KEY (group_type, thehive_alert_id));
CREATE TABLE IF NOT EXISTS flush_meta (key TEXT PRIMARY KEY, value TEXT);"""
_MIGRATIONS=("ALTER TABLE pending_groups ADD COLUMN generation INTEGER DEFAULT 0","ALTER TABLE pending_groups ADD COLUMN state TEXT DEFAULT 'idle'","ALTER TABLE pending_groups ADD COLUMN claimed_at REAL DEFAULT 0","ALTER TABLE pending_groups ADD COLUMN claimed_gen INTEGER DEFAULT 0","ALTER TABLE pending_groups ADD COLUMN lease_until REAL DEFAULT 0","ALTER TABLE pending_groups ADD COLUMN source_ref TEXT DEFAULT ''","ALTER TABLE standalone_outbox ADD COLUMN state TEXT DEFAULT 'idle'","ALTER TABLE standalone_outbox ADD COLUMN claimed_at REAL DEFAULT 0","ALTER TABLE standalone_outbox ADD COLUMN lease_until REAL DEFAULT 0")
_session=None
def _connect():
    dd=os.path.dirname(CORRELATION_DB)
    if dd and not os.path.exists(dd):
        try: os.makedirs(dd,exist_ok=True)
        except Exception: pass
    c=sqlite3.connect(CORRELATION_DB,timeout=10,isolation_level=None)
    try: c.execute("PRAGMA journal_mode=WAL;")
    except Exception: pass
    # THEHIVE_SYNCHRONOUS=FULL trades per-commit fsync latency for OS-crash durability
    # (default NORMAL is application-crash-safe; raw Wazuh alerts are unaffected either way).
    try:
        _syncmode=os.environ.get("THEHIVE_SYNCHRONOUS","NORMAL").upper()
        if _syncmode not in ("FULL","NORMAL","OFF"): _syncmode="NORMAL"
        c.execute(f"PRAGMA synchronous={_syncmode};")
    except Exception: pass
    try: c.execute("PRAGMA busy_timeout=5000;")
    except Exception: pass
    # Least-privilege at rest: full alert bodies live in this DB (+WAL/SHM sidecars).
    # Best-effort 0600 — same-uid daemon and forked ingest workers are unaffected.
    # The shared log directory itself is intentionally left alone (Wazuh-owned).
    for _sfx in ("","-wal","-shm"):
        try: os.chmod(CORRELATION_DB+_sfx,0o600)
        except Exception: pass
    c.executescript(SCHEMA_SQL)
    # Gate one-time ALTER migrations behind a single catalog check: without this,
    # EVERY Wazuh invocation pays for 9 failing ALTERs (parse + raise + catch).
    # Gate on the LAST migration's column (not the first): a crash between ALTERs
    # would otherwise leave the gate satisfied while later columns are still missing,
    # permanently bricking the new state machine until manual DDL. Re-running all 9
    # after such a crash is safe (applied ones raise duplicate-column, swallowed).
    try:
        _migrated=c.execute("SELECT COUNT(*) FROM pragma_table_info('standalone_outbox') WHERE name='lease_until'").fetchone()[0]
    except Exception:
        _migrated=0
    if not _migrated:
        for m in _MIGRATIONS:
            try: c.execute(m)
            except sqlite3.OperationalError as e:
                if "duplicate column" not in str(e).lower(): raise
            except Exception: pass
    return c
def _is_pending_id(t): return isinstance(t,str) and t.startswith(PENDING_PREFIX)
def _new_pending_id(): return f"{PENDING_PREFIX}{uuid.uuid4().hex[:12]}"
def _find_parent_conn(c,aid,ppid):
    if not aid or not ppid: return None,0
    r=c.execute("SELECT thehive_alert_id, chain_depth FROM recent_processes WHERE agent_id=? AND process_id=? AND created_at>=? ORDER BY created_at DESC LIMIT 1",(aid,str(ppid),time.time()-CORRELATION_WINDOW_SECONDS)).fetchone()
    return (r[0],r[1]) if r else (None,0)
def _find_logon_conn(c,k):
    r=c.execute("SELECT thehive_alert_id, event_count FROM recent_logons WHERE identity_key=? AND last_seen>=?",(k,time.time()-LOGON_CORRELATION_WINDOW_SECONDS)).fetchone()
    return (r[0],r[1]) if r else (None,0)
def _find_burst_conn(c,rid,aid):
    r=c.execute("SELECT thehive_alert_id, stage_count FROM recent_bursts WHERE burst_key=? AND last_seen>=?",(f"{rid}|{aid}",time.time()-BURST_WINDOW_SECONDS)).fetchone()
    return (r[0],r[1]) if r else (None,0)
def _find_fanout_conn(c,aid,pv,kt):
    if not aid or not pv: return None,0
    r=c.execute("SELECT thehive_alert_id, stage_count FROM recent_fanouts WHERE burst_key=? AND last_seen>=?",(f"{aid}|{kt}|{pv}",time.time()-PROCESS_FANOUT_WINDOW_SECONDS)).fetchone()
    return (r[0],r[1]) if r else (None,0)
def _find_tool_campaign_conn(c,ck):
    if not ck: return None,0
    r=c.execute("SELECT thehive_alert_id, stage_count FROM recent_tool_campaigns WHERE campaign_key=? AND last_seen>=?",(ck,time.time()-TOOL_CAMPAIGN_IDLE_TIMEOUT_SECONDS)).fetchone()
    return (r[0],r[1]) if r else (None,0)
def _find_watchlist_conn(c,wk):
    if not wk: return None,0
    r=c.execute("SELECT thehive_alert_id, stage_count FROM recent_watchlist WHERE watchlist_key=? AND last_seen>=?",(wk,time.time()-WATCHLIST_WINDOW_SECONDS)).fetchone()
    return (r[0],r[1]) if r else (None,0)
def _norm_fp_text(s):
    return " ".join(str(s).lower().split())
def _compile_fp(cfg):
    compiled=[]
    for canon,aliases in cfg["tools"].items():
        for al in aliases:
            try: compiled.append((re.compile(r"\b"+re.escape(_norm_fp_text(al))+r"\b"),canon))
            except Exception: pass
    umb=[]
    for u in cfg["umbrellas"]:
        try: umb.append(re.compile(r"\b"+re.escape(_norm_fp_text(u))+r"\b"))
        except Exception: pass
    return compiled,umb
def _fingerprint_config_path():
    return os.environ.get("THEHIVE_FINGERPRINTS_FILE") or os.path.join(os.path.dirname(os.path.abspath(__file__)),"tool_fingerprints.json")
def _load_fingerprint_config():
    """Load {tools:{canonical:[aliases]},umbrellas:[...]} from the operator-owned JSON
    file shipped next to this script (THEHIVE_FINGERPRINTS_FILE overrides). Per-process
    load (~KB file, sub-ms): Wazuh fork/exec cannot share caches; the daemon naturally
    loads once per process lifetime. Missing DEFAULT file -> silent builtin defaults
    (legacy deploy); explicitly-set-but-missing or present-but-invalid file -> loud
    error + builtin fallback, so detection NEVER silently dies from a bad deploy.
    Returns (compiled_patterns, umbrella_patterns, source_label)."""
    envset=bool(os.environ.get("THEHIVE_FINGERPRINTS_FILE"))
    path=_fingerprint_config_path()
    if not os.path.exists(path):
        if envset: logging.error(f"Fingerprint config {path} from THEHIVE_FINGERPRINTS_FILE missing; using baked-in defaults")
        compiled,umb=_compile_fp(_BUILTIN_FINGERPRINTS); return compiled,umb,"builtin"
    try:
        with open(path) as f: file_cfg=json.load(f)
        if not isinstance(file_cfg,dict) or not isinstance(file_cfg.get("tools"),dict) or not file_cfg["tools"]: raise ValueError("bad shape: need non-empty tools{}")
        tools={}
        for k,v in file_cfg["tools"].items():
            al=[str(x) for x in v if isinstance(x,str) and x.strip()] if isinstance(v,list) else []
            if not isinstance(k,str) or not k.strip() or not al: raise ValueError("bad tool entry")
            tools[str(k)]=al
        umb=[str(x) for x in file_cfg.get("umbrellas",[]) if isinstance(x,str) and x.strip()]
        compiled,umbr=_compile_fp({"tools":tools,"umbrellas":umb}); return compiled,umbr,path
    except Exception as e:
        logging.error(f"Fingerprint config {path} invalid, using baked-in defaults: {type(e).__name__}")
        compiled,umb=_compile_fp(_BUILTIN_FINGERPRINTS); return compiled,umb,"builtin (fallback)"
def detect_recon_tool(a,fp=None):
    """Return canonical tool name or None. Word-boundary regex over normalized text fixes
    BOTH directions of raw-substring bugs: 'nmap'-in-hostname false positives AND
    spelled-out-alias ('Fuzz Faster U Fool') false negatives. File order = precedence."""
    if fp is None:
        try: fp=_load_fingerprint_config()
        except Exception: return None
    compiled,_,_=fp
    cands=[]
    for p in ("data.http.http_user_agent","data.http_user_agent","data.useragent","data.http.user_agent"):
        v=safe_get(a,p)
        if isinstance(v,list): cands+= [_norm_fp_text(x) for x in v]
        elif v not in (None,""): cands.append(_norm_fp_text(v))
    v=safe_get(a,"data.alert.signature")
    if isinstance(v,list): cands+= [_norm_fp_text(x) for x in v]
    elif v not in (None,""): cands.append(_norm_fp_text(v))
    hay=" | ".join([c for c in cands if c])
    if not hay: return None
    for rx,name in compiled:
        try:
            if rx.search(hay): return name
        except Exception: pass
    return None
def detect_scanner_umbrella(a,fp=None):
    """True when the alert sits under a known scanner/attack umbrella (signature text,
    rule description, or rule groups) WITHOUT naming a canonical tool. Drives the
    Tier-2 unknown-scanner bucket so the gap stays visible instead of dissolving
    into generic activity_burst noise."""
    if fp is None:
        try: fp=_load_fingerprint_config()
        except Exception: return False
    _,umb,_=fp
    if not umb: return False
    parts=[]
    for p in ("data.alert.signature","rule.description"):
        v=safe_get(a,p)
        if isinstance(v,list): parts+= [_norm_fp_text(x) for x in v]
        elif v not in (None,""): parts.append(_norm_fp_text(v))
    g=safe_get(a,"rule.groups")
    if isinstance(g,list): parts+= [_norm_fp_text(x) for x in g]
    elif g not in (None,""): parts.append(_norm_fp_text(g))
    hay=" | ".join([c for c in parts if c])
    if not hay: return False
    for rx in umb:
        try:
            if rx.search(hay): return True
        except Exception: pass
    return False
def extract_tool_campaign_fields(a,tool,sip,tagt):
    dp=safe_get(a,"data.dest_port") or safe_get(a,"data.dst_port") or safe_get(a,"data.dpt") or "n/a"
    if isinstance(dp,list): dp=dp[0] if dp else "n/a"
    up=safe_get(a,"data.http.url") or safe_get(a,"data.url") or "n/a"
    if isinstance(up,list): up=up[0] if up else "n/a"
    return {"tool":tool,"src_ip":sip,"target_agent":tagt,"dest_port":str(dp),"url_or_path":str(up),"rule_id":str(safe_get(a,"rule.id","unknown")),"rule_description":safe_get(a,"rule.description","Wazuh Alert"),"_agent_name":safe_get(a,"agent.name","unknown-agent")}
def _is_wazuh_rooted_conn(c,aid,pid):
    if not aid or not pid: return False
    return c.execute("SELECT 1 FROM wazuh_rooted_pids WHERE agent_id=? AND pid=? AND created_at>=?",(aid,str(pid),time.time()-WAZUH_CHAIN_TTL_SECONDS)).fetchone() is not None
def _is_wazuh_descendant_conn(c,aid,op,pp,oi,pi):
    if _is_wazuh_path_norm(oi) or _is_wazuh_path_norm(pi):
        if op: c.execute("INSERT INTO wazuh_rooted_pids(agent_id,pid,created_at) VALUES(?,?,?) ON CONFLICT(agent_id,pid) DO UPDATE SET created_at=excluded.created_at",(aid,str(op),time.time()))
        return True
    if pp and _is_wazuh_rooted_conn(c,aid,str(pp)):
        if op: c.execute("INSERT INTO wazuh_rooted_pids(agent_id,pid,created_at) VALUES(?,?,?) ON CONFLICT(agent_id,pid) DO UPDATE SET created_at=excluded.created_at",(aid,str(op),time.time()))
        return True
    return False
def _next_stage_num(c,gt,tid):
    """O(1) indexed counter; falls back to MAX+seed only for legacy rows. Caller holds BEGIN IMMEDIATE."""
    cur=c.execute("UPDATE group_counters SET next_stage=next_stage+1 WHERE group_type=? AND thehive_alert_id=?",(gt,tid))
    if cur.rowcount:
        r=c.execute("SELECT next_stage FROM group_counters WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
        return int(r[0])
    try:
        # Seed from existing stages: pre-counter DBs (original script era) may already
        # hold stage rows for this group; blindly starting at 1 would duplicate stage_num.
        r=c.execute("SELECT COALESCE(MAX(stage_num),0) FROM group_stages WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
        nx=int(r[0] or 0)+1
        c.execute("INSERT INTO group_counters(group_type,thehive_alert_id,next_stage) VALUES(?,?,?)",(gt,tid,nx))
        return nx
    except sqlite3.IntegrityError:
        c.execute("UPDATE group_counters SET next_stage=next_stage+1 WHERE group_type=? AND thehive_alert_id=?",(gt,tid))
        r=c.execute("SELECT next_stage FROM group_counters WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
        if r: return int(r[0])
    r=c.execute("SELECT COALESCE(MAX(stage_num),0) FROM group_stages WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
    nx=int(r[0] or 0)+1
    c.execute("INSERT INTO group_counters(group_type,thehive_alert_id,next_stage) VALUES(?,?,?) ON CONFLICT(group_type,thehive_alert_id) DO UPDATE SET next_stage=max(next_stage,excluded.next_stage)",(gt,tid,nx))
    return nx
def _precompute_stage(a):
    """Pure-CPU stage rendering (regex/hex-decode/full-alert JSON dump). MUST be called
    BEFORE BEGIN IMMEDIATE: holding the SQLite RESERVED write lock across this work
    serializes concurrent Wazuh workers for no reason. Pure function of the alert dict."""
    rid=str(safe_get(a,"rule.id","unknown")); rd=safe_get(a,"rule.description","Wazuh Alert"); sv=severity_from_level(safe_get(a,"rule.level",0)); ts=safe_get(a,"timestamp","n/a")
    kd=build_key_details(a) or ""; fl=get_full_log_text(a); ob=build_observables(a); tg=build_tags(a)
    return (rid,rd,sv,ts,kd,fl,ob,tg)
def _insert_stage_light(c,gt,tid,a,rf,pre=None):
    rid,rd,sv,ts,kd,fl,ob,tg=pre if pre is not None else _precompute_stage(a)
    nx=_next_stage_num(c,gt,tid)
    c.execute("INSERT INTO group_stages(group_type,thehive_alert_id,stage_num,timestamp,rule_id,rule_description,severity,raw_fields,key_details,full_log,observables,tags,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(gt,tid,nx,ts,rid,rd,sv,json.dumps(rf),kd,fl,json.dumps(ob),json.dumps(tg),time.time()))
    return nx
def _mark_dirty(c,gt,tid,gk,crit=False,source_ref=""):
    n=time.time(); sref=source_ref or f"wzb-{uuid.uuid4().hex[:10]}"
    # A row revived from state='dead' by genuinely new stages gets a fresh claim/retry
    # lifecycle; live backoff rows are deliberately left untouched (never reset an
    # in-progress backoff, or retry accounting would never reach MAX_RETRIES).
    c.execute("INSERT INTO pending_groups(group_type,thehive_alert_id,group_key,dirty,is_critical,pending_stages,total_stages,generation,state,claimed_at,claimed_gen,lease_until,source_ref,retry_count,next_retry_at,last_update,created_at) VALUES(?,?,?,?,?,1,1,1,'idle',0,0,0,?,0,0,?,?) ON CONFLICT(group_type,thehive_alert_id) DO UPDATE SET dirty=1, pending_stages=pending_groups.pending_stages+1, total_stages=pending_groups.total_stages+1, generation=pending_groups.generation+1, last_update=excluded.last_update, is_critical=CASE WHEN excluded.is_critical=1 THEN 1 ELSE pending_groups.is_critical END, state=CASE WHEN pending_groups.state='dead' THEN 'idle' ELSE pending_groups.state END, lease_until=CASE WHEN pending_groups.state='dead' THEN 0 ELSE pending_groups.lease_until END, retry_count=CASE WHEN pending_groups.state='dead' THEN 0 ELSE pending_groups.retry_count END, next_retry_at=CASE WHEN pending_groups.state='dead' THEN 0 ELSE pending_groups.next_retry_at END",(gt,tid,gk or "",1,1 if crit else 0,sref,n,n))
def _load_stages(c,gt,tid):
    R=c.execute("SELECT stage_num,timestamp,rule_id,rule_description,severity,raw_fields,key_details,full_log,observables,tags FROM group_stages WHERE group_type=? AND thehive_alert_id=? ORDER BY stage_num ASC",(gt,tid)).fetchall()
    return [{"stage_num":r[0],"timestamp":r[1],"rule_id":r[2],"rule_description":r[3],"severity":r[4],"raw_fields":json.loads(r[5]) if r[5] else {},"key_details":r[6] or "","full_log":r[7],"observables":json.loads(r[8]) if r[8] else [],"tags":json.loads(r[9]) if r[9] else []} for r in R]
def _promote_pending(c,gt,pend,real):
    c.execute("UPDATE group_stages SET thehive_alert_id=? WHERE group_type=? AND thehive_alert_id=?",(real,gt,pend))
    for t in ("recent_processes","recent_logons","recent_bursts","recent_fanouts","recent_tool_campaigns","recent_watchlist"): c.execute(f"UPDATE {t} SET thehive_alert_id=? WHERE thehive_alert_id=?",(real,pend))
    c.execute("UPDATE group_counters SET thehive_alert_id=? WHERE group_type=? AND thehive_alert_id=?",(real,gt,pend))
    c.execute("UPDATE pending_groups SET thehive_alert_id=? WHERE group_type=? AND thehive_alert_id=?",(real,gt,pend))
def _rekey_group_to_pending(c,gt,tid):
    """Re-key a group whose TheHive alert is gone (PATCH 404) to a fresh PENDING-*
    identity so the next flush cycle CREATEs it. Retains ALL stages, correlation rows
    and the stage counter; resets retry state; marks dirty with a bumped generation.
    Caller must hold BEGIN IMMEDIATE and COMMIT/ROLLBACK. Returns the new id."""
    newp=_new_pending_id()
    c.execute("UPDATE group_stages SET thehive_alert_id=? WHERE group_type=? AND thehive_alert_id=?",(newp,gt,tid))
    for t in ("recent_processes","recent_logons","recent_bursts","recent_fanouts","recent_tool_campaigns","recent_watchlist"): c.execute(f"UPDATE {t} SET thehive_alert_id=? WHERE thehive_alert_id=?",(newp,tid))
    c.execute("UPDATE group_counters SET thehive_alert_id=? WHERE group_type=? AND thehive_alert_id=?",(newp,gt,tid))
    row=c.execute("SELECT group_key,is_critical,total_stages FROM pending_groups WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
    if row:
        c.execute("UPDATE pending_groups SET thehive_alert_id=?, dirty=1, pending_stages=?, retry_count=0, next_retry_at=0, state='idle', claimed_gen=0, lease_until=0, source_ref=?, generation=generation+1, last_update=? WHERE group_type=? AND thehive_alert_id=?",(newp,int(row[2] or 0),f"wzb-{uuid.uuid4().hex[:10]}",time.time(),gt,tid))
    return newp

# ---------------- HTTP (session reuse, real Retry-After) ----------------
def _get_session():
    global _session
    if _session is None and requests is not None:
        _session=requests.Session()
        try: _session.headers.update({"Content-Type":"application/json"})
        except Exception: pass
    return _session
def parse_retry_after(resp):
    """Return Retry-After delay in seconds (delta or HTTP-date) or None. Never raises."""
    try:
        if resp is None: return None
        hdrs=getattr(resp,"headers",None) or {}
        val=None
        for k in ("Retry-After","retry-after","RETRY-AFTER"):
            if k in hdrs: val=hdrs[k]; break
        if val is None:
            try:
                for k,v in dict(hdrs).items():
                    if str(k).lower()=="retry-after": val=v; break
            except Exception: return None
        if val is None: return None
        val=str(val).strip()
        if val.isdigit(): return min(float(val),RETRY_MAX_DELAY)
        try:
            dt=parsedate_to_datetime(val)
            if dt is None: return None
            if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone.utc)
            return max(0.0,min((dt.timestamp()-time.time()),RETRY_MAX_DELAY))
        except Exception: return None
    except Exception: return None
def _backoff(rc,resp=None):
    base=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**max(0,rc-1)))+random.uniform(0,1.0)
    ra=parse_retry_after(resp)
    return max(base,ra) if ra is not None else base
# KNOWN LIMITATION, stated explicitly (not implicit): the DoS guard below keys on the
# DECLARED Content-Length header, so a chunked response (no Content-Length) bypasses
# the size check and is fully buffered by requests. Accepted: TheHive sits on a trusted
# LAN segment and returns small JSON bodies in practice; a hostile/compromised server
# able to stream unbounded chunked bodies is outside this integration's threat model.
# If that assumption ever changes, replace body inspection with stream=True +
# iter_content byte caps at all four request sites (create/patch/query/confirm-get).
_MAX_LOGGED_BODY=1000000
def _short_body(resp,limit=300):
    """Truncate response bodies for logs WITHOUT buffering huge payloads first: refuse
    to touch bodies declaring >1MB (compromised-proxy DoS shape). Callers already treat
    the placeholder as opaque log text only."""
    try:
        try: declared=int((resp.headers or {}).get("Content-Length",0) or 0)
        except (TypeError,ValueError): declared=0
        if declared>_MAX_LOGGED_BODY: return "<body too large, skipped>"
        return (resp.text or "")[:limit]
    except Exception: return ""
def _json_capped(resp):
    """Parse response JSON only for sanely-sized bodies (same DoS guard); None otherwise.
    Callers already treat None as missing/failed parse."""
    try:
        try: dl=int((resp.headers or {}).get("Content-Length",0) or 0)
        except (TypeError,ValueError): dl=0
        if dl>_MAX_LOGGED_BODY: return None
        return resp.json()
    except Exception: return None
# 401/403 are retryable (not instantly fatal): a token rotation window or transient
# auth outage must back off through MAX_RETRIES via the normal retry machinery instead
# of dead-lettering the whole flushable backlog on the first cycle. Permanently bad
# credentials still dead-letter after MAX_RETRIES attempts.
# Unlisted 5xx (501/505-511) are retryable: 5xx means server-side trouble that is often
# transient (507/508/511), and even for permanent ones (501/505) the bounded
# MAX_RETRIES backoff ends in the same dead-letter — just later and automatically.
# Rare 4xx stay fatal (true client errors that retry can never fix; anything not in
# RETRYABLE_STATUS takes the generic fatal branch in both helpers — no separate set).
RETRYABLE_STATUS={401,403,408,425,429,500,501,502,503,504,505,506,507,508,510,511}
def create_thehive_alert_sync(p):
    t0=time.perf_counter()
    try: return _create_thehive_alert_inner(p)
    finally:
        try: _record_sync_latency((time.perf_counter()-t0)*1000.0)
        except Exception: pass
def _create_thehive_alert_inner(p):
    if requests is None: return (False,True,None,None,None)
    if not _thehive_configured():
        logging.error("TheHive API token missing (set THEHIVE_API_TOKEN); CREATE deferred")
        return (False,True,None,None,None)
    try:
        s=_get_session(); url=f"{_RUNTIME_URL}/alert"
        r=s.post(url,headers=_auth_headers(),json=p,verify=VERIFY_SSL,timeout=HTTP_TIMEOUT) if s else requests.post(url,headers=_auth_headers(),json=p,verify=VERIFY_SSL,timeout=HTTP_TIMEOUT)
        if r.status_code in (200,201,204):
            # 2xx WITHOUT an _id must NEVER be retried as a fresh CREATE: the alert
            # most likely exists in TheHive already, and a retry would duplicate it.
            # Dead-letter instead (stages retained in SQLite for manual reconcile).
            _jd=_json_capped(r); _cid=_jd.get("_id") if isinstance(_jd,dict) else None
            if not _cid:
                logging.error(f"TheHive CREATE {r.status_code} without parseable _id; NOT retrying (would duplicate); manual reconcile, stages retained")
                return (False,False,None,r,None)
            return (True,False,_cid,r,None)
        if r.status_code in RETRYABLE_STATUS:
            ra=parse_retry_after(r); logging.error(f"TheHive CREATE retryable {r.status_code} retry_after={ra}: {_short_body(r)}")
            return (False,True,None,r,ra)
        if r.status_code==409:
            logging.error(f"TheHive CREATE 409 (possible duplicate, e.g. crash-retry with stable sourceRef); dead-lettered, stages retained for reconcile: {_short_body(r,500)}")
        else:
            logging.error(f"TheHive CREATE fatal {r.status_code}: {_short_body(r,500)}")
        return (False,False,None,r,None)
    except Exception as e:
        logging.error(f"TheHive CREATE exception (retryable): {type(e).__name__}")
        return (False,True,None,None,None)
def patch_thehive_alert_sync(tid,ti,de,ta,ob,sv,ms):
    t0=time.perf_counter()
    try: return _patch_thehive_alert_inner(tid,ti,de,ta,ob,sv,ms)
    finally:
        try: _record_sync_latency((time.perf_counter()-t0)*1000.0)
        except Exception: pass
def _patch_thehive_alert_inner(tid,ti,de,ta,ob,sv,ms):
    if requests is None: return (False,True,None)
    if not _thehive_configured():
        logging.error("TheHive API token missing (set THEHIVE_API_TOKEN); PATCH deferred")
        return (False,True,None)
    try:
        s=_get_session(); b={"title":ti,"description":de,"tags":ta,"observables":ob,"severity":sv,"lastSyncDate":ms}
        url=f"{_RUNTIME_URL}/alert/{tid}"
        r=s.patch(url,headers=_auth_headers(),json=b,verify=VERIFY_SSL,timeout=HTTP_TIMEOUT) if s else requests.patch(url,headers=_auth_headers(),json=b,verify=VERIFY_SSL,timeout=HTTP_TIMEOUT)
        if r.status_code in (200,201,204): return (True,False,None)
        if r.status_code in RETRYABLE_STATUS:
            ra=parse_retry_after(r); logging.error(f"TheHive PATCH retryable {tid}: {r.status_code} retry_after={ra}: {_short_body(r)}")
            return (False,True,ra)
        if r.status_code==404:
            # Alert gone server-side (deleted in TheHive): NOT a dead end. The "recreate"
            # signal tells flush_claimed_group to re-key the group to a fresh PENDING-*
            # identity so the next cycle CREATEs it (all stages retained).
            logging.error(f"PATCH {tid} 404 (alert missing in TheHive); will re-key and re-CREATE")
            return (False,"recreate",None)
        if r.status_code==409:
            logging.error(f"PATCH {tid} 409 (target state conflict); dead-lettered, stages retained for reconcile: {_short_body(r,500)}")
        else:
            logging.error(f"PATCH {tid} fatal {r.status_code}: {_short_body(r,500)}")
        return (False,False,None)
    except Exception as e:
        logging.error(f"PATCH {tid} failed (retryable): {type(e).__name__}")
        return (False,True,None)
def _looks_like_exists_conflict(resp):
    """True when a 4xx body says the document already exists (NOT a validation error).
    Same DoS guard as _short_body/_json_capped: refuse to buffer bodies declaring >1MB
    (only reached for non-400/409/422 statuses; those short-circuit on status code)."""
    try:
        try: declared=int((resp.headers or {}).get("Content-Length",0) or 0)
        except (TypeError,ValueError): declared=0
        if declared>_MAX_LOGGED_BODY: return False
        body=(resp.text or "").lower()
    except Exception: return False
    return any(h in body for h in ("already exists","conflict","duplicate","version_conflict","version conflict"))
def _create_needs_reconcile(resp):
    """Gate for sourceRef reconciliation after a failed CREATE. Fires on 400/409/422
    REGARDLESS of body text (duplicate type+source+sourceRef is rejected server-side,
    and bare 400/409/422 bodies must not bypass healing), or on any other 4xx whose
    body hints at an exists/conflict outcome. NEVER fires for 401/403 (auth
    misconfiguration: a lookup would fail identically, so retry machinery owns it)."""
    try: status=int(getattr(resp,"status_code",0) or 0)
    except (TypeError,ValueError): return False
    if status in (401,403): return False
    if status in (400,409,422): return True
    return _looks_like_exists_conflict(resp)
def find_thehive_alert_id_by_sourceref(sref):
    """Recover a TheHive _id for our stable sourceRef via the documented Query API
    (POST /api/v1/query?name=alerts, listAlert + Eq(sourceRef)); mirrors thehive4py
    alert.find(). Returns _id or None. Never raises; lookup failure != fatal."""
    if requests is None or not sref: return None
    if not _thehive_configured(): return None
    try:
        s=_get_session()
        q={"query":[{"_name":"listAlert"},{"_name":"filter","_eq":{"_field":"sourceRef","_value":sref}}]}
        url=f"{_RUNTIME_URL}/query"; hdrs=_auth_headers(); params={"name":"alerts"}
        r=s.post(url,headers=hdrs,params=params,json=q,verify=VERIFY_SSL,timeout=HTTP_TIMEOUT) if s else requests.post(url,headers=hdrs,params=params,json=q,verify=VERIFY_SSL,timeout=HTTP_TIMEOUT)
        if r.status_code not in (200,201): return None
        items=_json_capped(r)
        if items is None: return None
        if isinstance(items,dict): items=items.get("data",items.get("results",[]))
        if not isinstance(items,list) or not items: return None
        return items[0].get("_id")
    except Exception:
        return None
def confirm_thehive_alert_gone(tid):
    """Distinguish real deletion (404 twice) from a transient 404 (proxy/replication blip).
    True => alert is gone, caller may safely re-key + re-CREATE. False => present OR
    lookup inconclusive (non-404/network error) => caller must RETRY, never re-key
    (re-keying on a transient would CREATE a duplicate of a live alert). Never raises."""
    if requests is None or not tid: return False
    if not _thehive_configured(): return False
    try:
        s=_get_session(); url=f"{_RUNTIME_URL}/alert/{tid}"
        r=s.get(url,headers=_auth_headers(),verify=VERIFY_SSL,timeout=HTTP_TIMEOUT) if s else requests.get(url,headers=_auth_headers(),verify=VERIFY_SSL,timeout=HTTP_TIMEOUT)
        return r.status_code==404
    except Exception:
        return False
def render_and_push_sync(gt,tid,stages):
    ti,de=GROUP_RENDERERS[gt](stages)
    ok,rt,ra=patch_thehive_alert_sync(tid,ti,de,_merge_tags(stages,extra_tags=[gt,f"stages:{len(stages)}"]),_merge_observables(stages),max(s["severity"] for s in stages),parse_iso_to_epoch_ms(stages[-1]["timestamp"]))
    return (ok,rt,ra)

# ---------------- ingest: ZERO HTTP, O(1), atomic dedup ----------------
def _ingest_txn(a):
    """Single attempt of the ingest txn. Returns result dict. Raises OperationalError(locked) for retry."""
    rid=str(safe_get(a,"rule.id","")); agr=str(safe_get(a,"agent.name","")); ag=agr.strip().lower(); aid=safe_get(a,"agent.id"); wid=str(safe_get(a,"id",f"noid-{time.time()}-{uuid.uuid4().hex[:6]}"))
    # Pure suppression FIRST (same order as the original): dropped alerts touch NEITHER
    # the database NOR the CPU-heavy rendering NOR the write lock.
    tu=str(safe_get(a,"data.win.eventdata.targetUserName","")); ma=bool(re.match(r".*\$(@|$)",tu)) or tu.upper() in {"SYSTEM","LOCAL SERVICE","NETWORK SERVICE"}
    eid=str(safe_get(a,"data.win.system.eventID","")); fe=(rid in ALWAYS_ESCALATE_RULE_IDS) and not ma
    tool=detect_recon_tool(a)
    if not tool and detect_scanner_umbrella(a):
        # Tier-2: known scanner/attack umbrella, no canonical tool — visible bucket instead
        # of silent fallthrough to generic burst noise. Verbatim evidence truncated.
        tool="unknown-scanner"
        logging.info(f"Unmatched scanner umbrella (Tier-2 unknown-scanner bucket) id={a.get('id')} ua={str(safe_get(a,'data.http.http_user_agent',safe_get(a,'data.http_user_agent','')))[:120]!r} sig={str(safe_get(a,'data.alert.signature',''))[:120]!r}")
    if not tool and ag in {n.lower() for n in SUPPRESSED_AGENT_NAMES}: logging.info(f"Suppressed alert id={a.get('id')} agent={agr} rule={rid}"); return {"action":"suppressed"}
    if not tool and not fe and rid in SUPPRESSED_RULE_IDS: logging.info(f"Suppressed alert id={a.get('id')} rule={rid}"); return {"action":"suppressed"}
    if not tool and not fe and eid in SUPPRESSED_EVENT_IDS: logging.info(f"Suppressed alert id={a.get('id')} event {eid}"); return {"action":"suppressed"}
    if fe: logging.info(f"Force-escalated id={a.get('id')} rule={rid}")
    # Expensive pure-CPU rendering happens OUTSIDE the write txn (see _precompute_stage):
    # the txn below must contain only O(1) indexed SQL writes.
    pre=_precompute_stage(a)
    if tool:
        # Option B (precedence decision): a tool fingerprint landing in logon/chain/
        # fanout keeps that group's semantics (NOT fragmented into a campaign), but the
        # tool signal still rides along as a stage tag. The tool_campaign branch below
        # re-adds it idempotently via dict.fromkeys, so no duplicates either way.
        _pt=list(pre); _pt[7]=list(dict.fromkeys(list(_pt[7])+[f"tool:{tool}"])); pre=tuple(_pt)
    c=_connect()
    try:
        c.execute("BEGIN IMMEDIATE")
        cur=c.execute("INSERT OR IGNORE INTO seen_alerts(wazuh_id,first_seen) VALUES(?,?)",(wid,time.time()))
        if cur.rowcount==0:
            c.execute("COMMIT"); logging.info(f"Duplicate alert id={a.get('id')} ignored (already processed)")
            return {"action":"duplicate"}
        op,pp,_=extract_process_ids(a); oi,pi=extract_process_images(a)
        if not tool and not fe and _is_wazuh_descendant_conn(c,aid,op,pp,oi,pi): c.execute("COMMIT"); logging.info(f"Suppressed wazuh-lineage id={a.get('id')}"); return {"action":"suppressed"}
        lu,ls,_,_=extract_logon_identity(a)
        if lu and ls:
            ik=f"{lu}|{ls}"; mid,_=_find_logon_conn(c,ik); rf=extract_logon_fields(a)
            if mid:
                _insert_stage_light(c,"logon_group",mid,a,rf,pre); c.execute("UPDATE recent_logons SET event_count=event_count+1, last_seen=? WHERE identity_key=?",(time.time(),ik)); _mark_dirty(c,"logon_group",mid,ik,crit=fe); c.execute("COMMIT")
                logging.debug(f"Queued logon stage id={a.get('id')} -> {mid}"); return {"action":"queued","group_type":"logon_group","thehive_id":mid,"is_critical":fe}
            pid=_new_pending_id(); _insert_stage_light(c,"logon_group",pid,a,rf,pre)
            c.execute("INSERT INTO recent_logons(identity_key,thehive_alert_id,event_count,last_seen) VALUES(?,?,?,?) ON CONFLICT(identity_key) DO UPDATE SET thehive_alert_id=excluded.thehive_alert_id, event_count=excluded.event_count, last_seen=excluded.last_seen",(ik,pid,1,time.time()))
            _mark_dirty(c,"logon_group",pid,ik,crit=fe); c.execute("COMMIT"); logging.info(f"New logon group {pid} queued id={a.get('id')}")
            return {"action":"queued","group_type":"logon_group","thehive_id":pid,"is_critical":fe}
        op,pp,_=extract_process_ids(a)
        if op or pp:
            mid,_=_find_parent_conn(c,aid,str(pp) if pp else None); rf=extract_process_chain_fields(a)
            if mid:
                _insert_stage_light(c,"process_chain",mid,a,rf,pre)
                if op: c.execute("INSERT INTO recent_processes(agent_id,process_id,thehive_alert_id,chain_depth,created_at) VALUES(?,?,?,?,?)",(aid,str(op),mid,1,time.time()))
                _mark_dirty(c,"process_chain",mid,str(mid),crit=fe); c.execute("COMMIT")
                logging.debug(f"Queued chain stage id={a.get('id')} -> {mid}"); return {"action":"queued","group_type":"process_chain","thehive_id":mid,"is_critical":fe}
            fv,ft=(str(pp),"ppid") if pp else (str(op),"pid") if op else (None,None)
            if fv:
                fid,_=_find_fanout_conn(c,aid,fv,ft)
                if fid:
                    _insert_stage_light(c,"process_fanout",fid,a,rf,pre); fk=f"{aid}|{ft}|{fv}"
                    c.execute("UPDATE recent_fanouts SET stage_count=stage_count+1, last_seen=? WHERE burst_key=?",(time.time(),fk)); _mark_dirty(c,"process_fanout",fid,fk,crit=fe); c.execute("COMMIT")
                    logging.debug(f"Queued fanout stage id={a.get('id')} -> {fid}"); return {"action":"queued","group_type":"process_fanout","thehive_id":fid,"is_critical":fe}
                pid=_new_pending_id(); _insert_stage_light(c,"process_fanout",pid,a,rf,pre); fk=f"{aid}|{ft}|{fv}"
                c.execute("INSERT INTO recent_fanouts(burst_key,thehive_alert_id,stage_count,last_seen) VALUES(?,?,?,?) ON CONFLICT(burst_key) DO UPDATE SET thehive_alert_id=excluded.thehive_alert_id, stage_count=excluded.stage_count, last_seen=excluded.last_seen",(fk,pid,1,time.time()))
                _mark_dirty(c,"process_fanout",pid,fk,crit=fe); c.execute("COMMIT"); logging.info(f"New fanout group {pid} queued id={a.get('id')}")
                return {"action":"queued","group_type":"process_fanout","thehive_id":pid,"is_critical":fe}
        if tool:
            tip=""
            for _p in ("data.src_ip","data.srcip"):
                for _v in flatten(safe_get(a,_p)):
                    if _v.strip(): tip=_v.strip(); break
                if tip: break
            tip=tip or "n/a"; tagt=str(aid) if aid not in (None,"") else str(safe_get(a,"agent.name","unknown")); tck=f"{tool}|{tip}|{tagt}"
            rf=extract_tool_campaign_fields(a,tool,tip,tagt)
            mid,_=_find_tool_campaign_conn(c,tck)
            pre2=list(pre); pre2[2]=3 if tool!="unknown-scanner" else 2; pre2[7]=list(dict.fromkeys(list(pre2[7])+["tool_campaign",f"tool:{tool}",f"src_ip:{tip}"])); pre2=tuple(pre2)
            if mid:
                _insert_stage_light(c,"tool_campaign",mid,a,rf,pre2)
                c.execute("UPDATE recent_tool_campaigns SET stage_count=stage_count+1, last_seen=? WHERE campaign_key=?",(time.time(),tck)); _mark_dirty(c,"tool_campaign",mid,tck); c.execute("COMMIT")
                logging.debug(f"Queued tool-campaign stage id={a.get('id')} -> {mid} ({tck})"); return {"action":"queued","group_type":"tool_campaign","thehive_id":mid,"is_critical":False}
            pid=_new_pending_id(); _insert_stage_light(c,"tool_campaign",pid,a,rf,pre2)
            c.execute("INSERT INTO recent_tool_campaigns(campaign_key,thehive_alert_id,stage_count,last_seen) VALUES(?,?,?,?) ON CONFLICT(campaign_key) DO UPDATE SET thehive_alert_id=excluded.thehive_alert_id, stage_count=excluded.stage_count, last_seen=excluded.last_seen",(tck,pid,1,time.time()))
            _mark_dirty(c,"tool_campaign",pid,tck); c.execute("COMMIT"); logging.info(f"New tool campaign {pid} queued id={a.get('id')} ({tck})")
            return {"action":"queued","group_type":"tool_campaign","thehive_id":pid,"is_critical":False}
        if rid not in BURST_EXCLUDE_RULE_IDS:
            st=detect_burst_source_type(a); rf=extract_burst_fields(a,st); pat=watchlist_match(rf)
            if pat:
                wip=""
                for _p in ("data.srcip","data.src_ip"):
                    for _v in flatten(safe_get(a,_p)):
                        if _v.strip(): wip=_v.strip(); break
                    if wip: break
                wip=wip or "n/a"; wk=f"{pat}|{wip}|{aid}"
                rf["_pattern"]=pat; rf["_src_ip"]=wip; rf["_agent_name"]=safe_get(a,"agent.name","unknown-agent")
                mid,sc=_find_watchlist_conn(c,wk)
                if mid:
                    _insert_stage_light(c,"watchlist_group",mid,a,rf,pre)
                    c.execute("UPDATE recent_watchlist SET stage_count=stage_count+1, last_seen=? WHERE watchlist_key=?",(time.time(),wk)); _mark_dirty(c,"watchlist_group",mid,wk,crit=True); c.execute("COMMIT")
                    logging.debug(f"Queued watchlist stage id={a.get('id')} -> {mid} ({wk})"); return {"action":"queued","group_type":"watchlist_group","thehive_id":mid,"is_critical":True}
                pid=_new_pending_id(); _insert_stage_light(c,"watchlist_group",pid,a,rf,pre)
                c.execute("INSERT INTO recent_watchlist(watchlist_key,thehive_alert_id,stage_count,last_seen) VALUES(?,?,?,?) ON CONFLICT(watchlist_key) DO UPDATE SET thehive_alert_id=excluded.thehive_alert_id, stage_count=excluded.stage_count, last_seen=excluded.last_seen",(wk,pid,1,time.time()))
                _mark_dirty(c,"watchlist_group",pid,wk,crit=True); c.execute("COMMIT"); logging.info(f"New watchlist group {pid} queued id={a.get('id')} ({wk})")
                return {"action":"queued","group_type":"watchlist_group","thehive_id":pid,"is_critical":True}
            mid,sc=_find_burst_conn(c,rid,aid)
            if mid and sc<BURST_MAX_STAGES:
                _insert_stage_light(c,"activity_burst",mid,a,rf,pre); bk=f"{rid}|{aid}"
                c.execute("UPDATE recent_bursts SET stage_count=stage_count+1, last_seen=? WHERE burst_key=?",(time.time(),bk)); _mark_dirty(c,"activity_burst",mid,bk,crit=fe); c.execute("COMMIT")
                logging.debug(f"Queued burst stage id={a.get('id')} -> {mid}"); return {"action":"queued","group_type":"activity_burst","thehive_id":mid,"is_critical":fe}
            pid=_new_pending_id(); _insert_stage_light(c,"activity_burst",pid,a,rf,pre); bk=f"{rid}|{aid}"
            c.execute("INSERT INTO recent_bursts(burst_key,thehive_alert_id,stage_count,last_seen) VALUES(?,?,?,?) ON CONFLICT(burst_key) DO UPDATE SET thehive_alert_id=excluded.thehive_alert_id, stage_count=excluded.stage_count, last_seen=excluded.last_seen",(bk,pid,1,time.time()))
            _mark_dirty(c,"activity_burst",pid,bk,crit=fe); c.execute("COMMIT"); logging.info(f"New burst group {pid} queued id={a.get('id')}")
            return {"action":"queued","group_type":"activity_burst","thehive_id":pid,"is_critical":fe}
        # Same lock discipline as the watchlist branch above: render lock-free, then a
        # short idempotent outbox txn (dedup already recorded; DO NOTHING is replay-safe).
        try: c.execute("ROLLBACK")
        except Exception: pass
        try: p=build_alert_payload(a)
        except Exception as e:
            logging.error(f"payload fail id={a.get('id')}: {type(e).__name__}"); return {"action":"error"}
        sref=p.get("sourceRef",f"noref-{uuid.uuid4().hex[:8]}")
        c.execute("BEGIN IMMEDIATE")
        c.execute("INSERT INTO standalone_outbox(source_ref,payload,retry_count,next_retry_at,status,state,claimed_at,lease_until,created_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(source_ref) DO NOTHING",(sref,json.dumps(p),0,0,"queued","idle",0,0,time.time()))
        c.execute("COMMIT"); logging.debug(f"Standalone {sref} persisted")
        return {"action":"standalone_queued","payload":p,"is_critical":fe,"source_ref":sref}
    except sqlite3.Error:
        # Covers OperationalError (FULL/locked) AND DatabaseError (CORRUPT/NOTADB):
        # roll back, propagate to ingest_alert for lock-retry or spool fallback.
        try: c.execute("ROLLBACK")
        except Exception: pass
        raise
    except Exception as e:
        try: c.execute("ROLLBACK")
        except Exception: pass
        logging.error(f"Ingest txn failed: {type(e).__name__}"); return {"action":"error"}
    finally:
        try: c.close()
        except Exception: pass
def ingest_alert(a):
    last=None
    for attempt in range(4):
        try: return _ingest_txn(a)
        except sqlite3.Error as e:
            last=e
            if "locked" in str(e).lower() or "busy" in str(e).lower():
                time.sleep(0.05*(2**attempt)+random.uniform(0,0.02)); continue
            # DB-level failure (FULL/CORRUPT/CANTOPEN/...): txn already rolled back, so
            # NOTHING was queued — spool the raw alert for daemon replay (lossless).
            _spool_raw_alert(a)
            logging.error(f"Ingest sqlite error: {type(e).__name__} (spooled for replay)"); return {"action":"error"}
    _spool_raw_alert(a)
    logging.error("Ingest gave up after lock retries (spooled for replay)"); return {"action":"error"}

# ---------------- flush: atomic claims, HTTP outside txns ----------------
def _sweep_stale_claims(c):
    now=time.time(); recovered=0
    try:
        cur=c.execute("UPDATE pending_groups SET state='idle', lease_until=0 WHERE state='flushing' AND lease_until<?",(now,)); recovered+=cur.rowcount or 0
        cur=c.execute("UPDATE standalone_outbox SET state='idle', lease_until=0 WHERE state='sending' AND status='queued' AND lease_until<?",(now,)); recovered+=cur.rowcount or 0
    except Exception: pass
    if recovered: logging.info(f"Recovered {recovered} stale claim(s)")
    return recovered
def _claim_groups(c,limit):
    now=time.time()
    # Priority/FIFO order is intentional: criticals first, oldest first. Accepted tradeoff:
    # a sustained critical flood (>batch/cycle indefinitely) can starve normal groups;
    # they persist durably and drain when the flood eases. Raise FLUSH_BATCH_GROUPS for
    # throughput — never weaken the critical-first guarantee to fix starvation.
    rows=c.execute("SELECT group_type, thehive_alert_id, generation FROM pending_groups WHERE dirty=1 AND next_retry_at<=? AND (state='idle' OR lease_until<?) ORDER BY is_critical DESC, last_update ASC LIMIT ?",(now,now,limit)).fetchall()
    claimed=[]
    for gt,tid,gen in rows:
        cur=c.execute("UPDATE pending_groups SET state='flushing', claimed_at=?, claimed_gen=generation, lease_until=? WHERE group_type=? AND thehive_alert_id=? AND dirty=1 AND next_retry_at<=? AND (state='idle' OR lease_until<?)",(now,now+CLAIM_LEASE_SECONDS,gt,tid,now,now))
        # NOTE: gen is read pre-claim and may be stale-OLDER if a stage landed between
        # SELECT and UPDATE. It is used ONLY as the crash-fallback generation in the
        # flush loop: stale-older can only refuse a dead-letter (safe requeue), never
        # force one — the authoritative claimed_gen lives in the row for normal flow.
        if cur.rowcount==1: claimed.append((gt,tid,int(gen or 0)))
    try: c.commit()
    except Exception: pass
    return claimed
def _complete_group_success(c,gt,tid,claimed_gen,real_id=None):
    """Promote if needed, then clean ONLY if generation unchanged. Returns True if fully clean."""
    eff=real_id or tid
    if real_id and real_id!=tid: _promote_pending(c,gt,tid,real_id)
    row=c.execute("SELECT generation FROM pending_groups WHERE group_type=? AND thehive_alert_id=?",(gt,eff)).fetchone()
    if row and int(row[0])==int(claimed_gen):
        c.execute("UPDATE pending_groups SET dirty=0, pending_stages=0, retry_count=0, next_retry_at=0, state='idle', claimed_gen=0, lease_until=0, last_update=? WHERE group_type=? AND thehive_alert_id=?",(time.time(),gt,eff))
        return True
    c.execute("UPDATE pending_groups SET state='idle', lease_until=0, last_update=? WHERE group_type=? AND thehive_alert_id=?",(time.time(),gt,eff))
    return False
def _complete_group_retry(c,gt,tid,claimed_gen,retryable,retry_after=None):
    row=c.execute("SELECT retry_count FROM pending_groups WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
    rc=int(row[0] or 0)+1 if row else 1
    if not retryable or rc>MAX_RETRIES:
        # Generation-guarded clear: new stages may have arrived while the HTTP flush was
        # in flight (claimed_gen < current generation). Clearing dirty=0 then would orphan
        # those stages (claim predicate only revisits dirty=1). Only the claim owner whose
        # generation is still current may dead-letter; otherwise requeue for another cycle.
        cur=c.execute("UPDATE pending_groups SET dirty=0, pending_stages=0, retry_count=?, next_retry_at=0, state='dead', lease_until=0 WHERE group_type=? AND thehive_alert_id=? AND generation=?",(rc,gt,tid,claimed_gen))
        if cur.rowcount==1:
            _bump_in_txn(c,"m_dead"); logging.error(f"Group {gt}/{tid} dead-lettered after {rc} attempts; stages retained in SQLite"); return "dead"
        # Persist rc even though the group stays dirty: this flush attempt DID happen and
        # must count toward MAX_RETRIES, otherwise a permanently-failing group that keeps
        # receiving new stages would retry forever without ever dead-lettering. Back off
        # like a normal retry (there IS new work worth attempting); once stages stop
        # arriving the generation stabilizes and the guarded dead-letter above fires.
        delay=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**(rc-1)))+random.uniform(0,1.0)
        c.execute("UPDATE pending_groups SET retry_count=?, next_retry_at=?, state='idle', lease_until=0, last_update=? WHERE group_type=? AND thehive_alert_id=?",(rc,time.time()+delay,time.time(),gt,tid))
        logging.error(f"Group {gt}/{tid} NOT dead-lettered: new stages arrived during flush; stays dirty, retry {rc} in {delay:.1f}s")
        return "retry"
    base=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**(rc-1)))+random.uniform(0,1.0)
    delay=max(base,retry_after) if retry_after is not None else base
    c.execute("UPDATE pending_groups SET retry_count=?, next_retry_at=?, last_update=?, state='idle', lease_until=0 WHERE group_type=? AND thehive_alert_id=?",(rc,time.time()+delay,time.time(),gt,tid))
    _bump_in_txn(c,"m_retries"); logging.info(f"Group {gt}/{tid} retry {rc} in {delay:.1f}s"); return "retry"
def flush_claimed_group(gt,tid):
    """Flush one already-claimed group. Reads+HTTP outside write txns; completion is a short txn."""
    rc=_connect()
    try: claimed=rc.execute("SELECT claimed_gen, source_ref FROM pending_groups WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone()
    finally: rc.close()
    if not claimed: return False
    claimed_gen=int(claimed[0] or 0); stored_ref=claimed[1] or ""
    rc=_connect()
    try: stages=_load_stages(rc,gt,tid)
    finally: rc.close()
    if not stages:
        wc=_connect()
        try: wc.execute("BEGIN IMMEDIATE"); _complete_group_success(wc,gt,tid,claimed_gen); wc.execute("COMMIT")
        except Exception:
            try: wc.execute("ROLLBACK")
            except Exception: pass
        finally: wc.close()
        return True
    if len(stages)>1000: logging.error(f"Group {gt}/{tid} very large ({len(stages)} stages); rendering full aggregate once")
    if _is_pending_id(tid):
        ti,de=GROUP_RENDERERS[gt](stages); ms=max(s["severity"] for s in stages); f=stages[0]; em=parse_iso_to_epoch_ms(f["timestamp"])
        sref=stored_ref or f"wzb-{uuid.uuid4().hex[:10]}"
        if not stored_ref:
            wc=_connect()
            try: wc.execute("UPDATE pending_groups SET source_ref=? WHERE group_type=? AND thehive_alert_id=?",(sref,gt,tid)); wc.commit()
            except Exception: pass
            finally: wc.close()
        p={"type":"wazuh_alert","source":"wazuh","sourceRef":sref,"title":ti,"description":de,"severity":ms,"tlp":TLP,"pap":PAP,"tags":_merge_tags(stages,extra_tags=[gt,f"stages:{len(stages)}"]),"observables":_merge_observables(stages),"date":em,"lastSyncDate":parse_iso_to_epoch_ms(stages[-1]["timestamp"])}
        ok,rt,real,resp,ra=create_thehive_alert_sync(p)
        if not ok and not rt and _create_needs_reconcile(resp):
            # Server-side dedup fired (type+source+sourceRef already exists): NO duplicate
            # was created. Recover the existing _id by stable sourceRef and heal via PATCH.
            # Lookup + promote happen OUTSIDE any held write txn.
            found=find_thehive_alert_id_by_sourceref(sref)
            if found:
                logging.info(f"[reconcile] {gt}/{tid} already exists as TheHive {found} (sourceRef {sref}); promoting + PATCHing current aggregate")
                wc0=_connect()
                try:
                    wc0.execute("BEGIN IMMEDIATE"); _promote_pending(wc0,gt,tid,found); wc0.execute("COMMIT")
                except Exception:
                    try: wc0.execute("ROLLBACK")
                    except Exception: pass
                    found=None
                finally:
                    try: wc0.close()
                    except Exception: pass
                if found:
                    tid=found
                    ok2,rt2,ra2=render_and_push_sync(gt,tid,stages)
                    rekey_ok2=(rt2=="recreate" and confirm_thehive_alert_gone(tid))
                    wc=_connect()
                    try:
                        wc.execute("BEGIN IMMEDIATE")
                        if rt2=="recreate" and not rekey_ok2:
                            st=_complete_group_retry(wc,gt,tid,claimed_gen,True); wc.execute("COMMIT")
                            logging.error(f"[reconcile] PATCH {tid} 404 not confirmed (transient?); backing off, will retry (no re-key, no duplicate)")
                            try: wc.close()
                            except Exception: pass
                            return False
                        if rt2=="recreate":
                            newp=_rekey_group_to_pending(wc,gt,tid); wc.execute("COMMIT")
                            logging.error(f"[reconcile] PATCH {tid} 404 confirmed gone; re-keyed to {newp}, will CREATE next cycle ({len(stages)} stages retained)")
                            try: wc.close()
                            except Exception: pass
                            return False
                        if ok2:
                            clean=_complete_group_success(wc,gt,tid,claimed_gen); _bump_in_txn(wc,"m_patches"); _bump_in_txn(wc,"m_reconciled"); wc.execute("COMMIT")
                            logging.info(f"[reconcile] PATCHed {tid} ({len(stages)} stages){'' if clean else ' (+new stages arrived; stays dirty)'}")
                            try: wc.close()
                            except Exception: pass
                            return True
                        st=_complete_group_retry(wc,gt,tid,claimed_gen,rt2,retry_after=ra2); wc.execute("COMMIT")
                        try: wc.close()
                        except Exception: pass
                        return False
                    except Exception:
                        try: wc.execute("ROLLBACK")
                        except Exception: pass
                        try: wc.close()
                        except Exception: pass
                        return False
            # Lookup-transient (503/timeout/401 on the query call) must NOT dead-letter:
            # the alert most likely exists server-side, so back off and let a later cycle
            # reconcile it. Only genuinely persistent lookup failure dead-letters, via the
            # normal retry machinery (which carries the A1 generation guard above).
            logging.error(f"[reconcile] CREATE exists-conflict for {gt}/{tid} but _id lookup failed; will retry (no duplicate created)")
            wc=_connect()
            try:
                wc.execute("BEGIN IMMEDIATE")
                st=_complete_group_retry(wc,gt,tid,claimed_gen,True); wc.execute("COMMIT")
            except Exception:
                try: wc.execute("ROLLBACK")
                except Exception: pass
            finally:
                try: wc.close()
                except Exception: pass
            return False
        wc=_connect()
        try:
            wc.execute("BEGIN IMMEDIATE")
            if ok and real:
                clean=_complete_group_success(wc,gt,tid,claimed_gen,real_id=real); _bump_in_txn(wc,"m_creates"); wc.execute("COMMIT")
                logging.info(f"Flushed new group {gt}/{real} ({len(stages)} stages){'' if clean else ' (+new stages arrived; will PATCH next cycle)'}")
                return True
            st=_complete_group_retry(wc,gt,tid,claimed_gen,rt,retry_after=ra); wc.execute("COMMIT"); return False
        except Exception:
            try: wc.execute("ROLLBACK")
            except Exception: pass
            return False
        finally: wc.close()
    ok,rt,ra=render_and_push_sync(gt,tid,stages)
    # GET-confirm BEFORE any state change and OUTSIDE any txn: re-keying on a transient
    # 404 would CREATE a duplicate of a live alert; on inconclusive lookup we back off.
    rekey_ok=(rt=="recreate" and confirm_thehive_alert_gone(tid))
    wc=_connect()
    try:
        wc.execute("BEGIN IMMEDIATE")
        if rt=="recreate" and not rekey_ok:
            st=_complete_group_retry(wc,gt,tid,claimed_gen,True); wc.execute("COMMIT")
            logging.error(f"PATCH {tid} 404 not confirmed (transient/proxy?); backing off, will retry (no re-key, no duplicate)")
            try: wc.close()
            except Exception: pass
            return False
        if rt=="recreate":
            newp=_rekey_group_to_pending(wc,gt,tid); wc.execute("COMMIT")
            logging.error(f"PATCH {tid} 404 confirmed gone; re-keyed to {newp}, will CREATE next cycle ({len(stages)} stages retained)")
            try: wc.close()
            except Exception: pass
            return False
        if ok:
            clean=_complete_group_success(wc,gt,tid,claimed_gen); _bump_in_txn(wc,"m_patches"); wc.execute("COMMIT")
            logging.info(f"Re-rendered {tid} ({len(stages)} stages){'' if clean else ' (+new stages arrived; stays dirty)'}")
            return True
        st=_complete_group_retry(wc,gt,tid,claimed_gen,rt,retry_after=ra); wc.execute("COMMIT"); return False
    except Exception:
        try: wc.execute("ROLLBACK")
        except Exception: pass
        return False
    finally: wc.close()
def _claim_outbox(c,limit):
    now=time.time()
    rows=c.execute("SELECT source_ref FROM standalone_outbox WHERE status='queued' AND next_retry_at<=? AND (state='idle' OR lease_until<?) ORDER BY created_at ASC LIMIT ?",(now,now,limit)).fetchall()
    out=[]
    for (sref,) in rows:
        cur=c.execute("UPDATE standalone_outbox SET state='sending', claimed_at=?, lease_until=? WHERE source_ref=? AND status='queued' AND next_retry_at<=? AND (state='idle' OR lease_until<?)",(now,now+CLAIM_LEASE_SECONDS,sref,now,now))
        if cur.rowcount==1: out.append(sref)
    try: c.commit()
    except Exception: pass
    return out
# ---------------- health/queue metrics (flusher-only aggregates; never on ingest) ----------------
def _bump_in_txn(c,key,delta=1):
    """Cumulative counter UPSERT inside an already-open write txn (no extra connection)."""
    try:
        r=c.execute("SELECT value FROM flush_meta WHERE key=?",(key,)).fetchone()
        v=float(r[0]) if r and r[0] is not None else 0.0
    except (TypeError,ValueError): v=0.0
    except Exception: v=0.0
    c.execute("INSERT INTO flush_meta(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(key,str(v+delta)))
def _meta_float(c,key,default=0.0):
    try:
        r=c.execute("SELECT value FROM flush_meta WHERE key=?",(key,)).fetchone()
        return float(r[0]) if r and r[0] is not None else default
    except (TypeError,ValueError): return default
    except Exception: return default
def _record_sync_latency(ms):
    """Best-effort HTTP-attempt latency sample (own short connection; flusher paths only
    in practice — fast-lane included, where ~3ms is noise next to the HTTP call itself)."""
    try:
        c=_connect()
        try:
            # Single BEGIN IMMEDIATE so concurrent flushers cannot interleave the
            # read-modify-write pair and lost-update each other's latency samples.
            c.execute("BEGIN IMMEDIATE")
            tot=_meta_float(c,"m_sync_ms_total"); n=_meta_float(c,"m_sync_ops")
            c.execute("INSERT INTO flush_meta(key,value) VALUES('m_sync_ms_total',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(str(tot+ms),))
            c.execute("INSERT INTO flush_meta(key,value) VALUES('m_sync_ops',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(str(n+1),))
            c.execute("COMMIT")
        except Exception:
            try: wc.execute("ROLLBACK")
            except Exception: pass
        finally: c.close()
    except Exception: pass
def collect_metrics():
    """Point-in-time gauges + cumulative counters. Aggregate queries only — call from
    flusher/CLI, never from ingest. Answers objectively when a burst finished syncing."""
    now=time.time(); d={"ts":int(now)}
    try:
        c=_connect()
        try:
            g=c.execute("SELECT COUNT(*), COALESCE(SUM(pending_stages),0), COALESCE(SUM(retry_count),0), MIN(created_at) FROM pending_groups WHERE dirty=1").fetchone()
            d["queued_groups"]=int(g[0] or 0); d["queued_stages"]=int(g[1] or 0); d["retries_pending"]=int(g[2] or 0)
            d["oldest_queued_age_s"]=round(now-float(g[3]),1) if g[3] else 0.0
            d["max_queue_age_s"]=d["oldest_queued_age_s"]
            d["dead_groups"]=int(c.execute("SELECT COUNT(*) FROM pending_groups WHERE state='dead'").fetchone()[0] or 0)
            o=c.execute("SELECT COUNT(*), COALESCE(SUM(retry_count),0) FROM standalone_outbox WHERE status='queued'").fetchone()
            d["outbox_queued"]=int(o[0] or 0); d["outbox_retries_pending"]=int(o[1] or 0)
            d["outbox_dead"]=int(c.execute("SELECT COUNT(*) FROM standalone_outbox WHERE status='dead'").fetchone()[0] or 0)
            u=c.execute("SELECT COUNT(*), COALESCE(SUM(pending_stages),0) FROM pending_groups WHERE group_type='tool_campaign' AND group_key LIKE 'unknown-scanner|%' AND dirty=1").fetchone()
            d["unknown_scanner_groups"]=int(u[0] or 0); d["unknown_scanner_stages"]=int(u[1] or 0)
            d["creates_total"]=int(_meta_float(c,"m_creates")); d["patches_total"]=int(_meta_float(c,"m_patches"))
            d["reconciled_total"]=int(_meta_float(c,"m_reconciled")); d["retries_total"]=int(_meta_float(c,"m_retries"))
            d["dead_total"]=int(_meta_float(c,"m_dead")); d["standalone_sent_total"]=int(_meta_float(c,"m_standalone_sent"))
            tot=_meta_float(c,"m_sync_ms_total"); n=_meta_float(c,"m_sync_ops")
            d["sync_ops"]=int(n); d["avg_sync_op_ms"]=round(tot/max(1.0,n),1)
            try: d["last_flush_ts"]=float((c.execute("SELECT value FROM flush_meta WHERE key='last_flush'").fetchone() or [0.0])[0])
            except (TypeError,ValueError): d["last_flush_ts"]=0.0
        finally: c.close()
    except Exception as e:
        d["error"]=type(e).__name__
    return d
def write_metrics_snapshot(doc):
    """Atomic JSON snapshot for external monitoring + objective burst measurement."""
    try:
        tmp=METRICS_FILE+".tmp"
        fd=os.open(tmp,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
        try:
            with os.fdopen(fd,"w") as f: json.dump(doc,f)
        except Exception:
            try: os.close(fd)
            except Exception: pass
            raise
        os.replace(tmp,METRICS_FILE)
    except Exception as e:
        logging.error(f"metrics snapshot failed: {type(e).__name__}")
_SPLIT_WARNED=set()
def _warn_campaign_split(c):
    """Fragmentation canary: >1 open tool_campaign label for the same src_ip+agent means
    the fingerprint table is splitting one attacker session (the ffuf-vs-ET-SCAN incident
    class). Warn once per distinct split per process; flusher-only, one indexed scan."""
    try:
        rows=c.execute("SELECT group_key FROM pending_groups WHERE group_type='tool_campaign' AND dirty=1").fetchall()
    except Exception: return
    by_src={}
    for (gk,) in rows:
        try: tool,sip,tagt=(str(gk).split("|")+["?","?","?"])[:3]
        except Exception: continue
        by_src.setdefault((sip,tagt),set()).add(tool)
    for (sip,tagt),tools in sorted(by_src.items(),key=str):
        if len(tools)>1:
            sig=(sip,tagt,tuple(sorted(tools)))
            if sig not in _SPLIT_WARNED:
                _SPLIT_WARNED.add(sig)
                logging.error(f"Possible fingerprint split: src_ip={sip} agent={tagt} has {len(tools)} open tool_campaign labels {sorted(tools)} — one attacker session may be fragmented; reconcile tool aliases")
def flush_dirty_groups(batch_limit=None):
    t00=time.perf_counter()
    batch_limit=batch_limit or FLUSH_BATCH_GROUPS
    c=_connect()
    try:
        _sweep_stale_claims(c); c.commit()
        targets=_claim_groups(c,batch_limit)
        try: c.commit()
        except Exception: pass
    finally:
        try: c.close()
        except Exception: pass
    ok=fr=dd=0
    for gt,tid,cgen in targets:
        if _SHUTDOWN: break
        try:
            flushed=flush_claimed_group(gt,tid)
        except Exception as e:
            # Bulkhead: an unexpected crash (poison data, render bug) must neither abort
            # the whole batch (previous behavior: rest of batch skipped, metrics skipped)
            # nor leak the claim. Route through the normal retry machinery with the
            # claim-time generation so the guarded dead-letter still applies; the group
            # stays dirty and terminates via MAX_RETRIES like any other failure.
            logging.error(f"Flush of {gt}/{tid} crashed ({type(e).__name__}); released for backoff retry")
            try:
                wc=_connect()
                try:
                    wc.execute("BEGIN IMMEDIATE")
                    _complete_group_retry(wc,gt,tid,cgen,True); wc.execute("COMMIT")
                except Exception:
                    try: wc.execute("ROLLBACK")
                    except Exception: pass
                finally: wc.close()
            except Exception: pass
            flushed=False
        if flushed: ok+=1
        else:
            if _is_group_dead(gt,tid): dd+=1
            else: fr+=1
        time.sleep(0.05)
    c2=_connect()
    try:
        c2.execute("INSERT INTO flush_meta(key,value) VALUES('last_flush',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(str(time.time()),))
        doc=collect_metrics()
        doc["last_cycle_s"]=round(time.perf_counter()-t00,2)
        doc["last_cycle"]={"ok":ok,"retry":fr,"dead":dd}
        write_metrics_snapshot(doc)
        qg=doc.get("queued_groups",0); qs=doc.get("queued_stages",0); age=doc.get("oldest_queued_age_s",0.0)
        avg=doc.get("avg_sync_op_ms",0.0); rt=doc.get("retries_total",0); dt=doc.get("dead_total",0)
        logging.info(f"Flush cycle {doc['last_cycle_s']}s: ok={ok} retry={fr} dead={dd} | queued groups={qg} stages={qs} oldest_age={age}s | totals creates={doc.get('creates_total',0)} patches={doc.get('patches_total',0)} reconciled={doc.get('reconciled_total',0)} retries={rt} dead={dt} | avg_sync_op={avg}ms | metrics={METRICS_FILE}")
        if qs>BACKPRESSURE_THRESHOLD: logging.error(f"BACKPRESSURE: {qs} pending stages across {qg} groups; preserving all data, TheHive catching up")
        _warn_campaign_split(c2)
        _prune_if_due(c2); c2.commit()
    except Exception as e: logging.error(f"flush bookkeeping failed: {type(e).__name__}")
    finally:
        try: c2.close()
        except Exception: pass
    return (ok,fr,dd)
def _is_group_dead(gt,tid):
    try:
        c=_connect()
        try: r=c.execute("SELECT state FROM pending_groups WHERE group_type=? AND thehive_alert_id=?",(gt,tid)).fetchone(); return bool(r and r[0]=="dead")
        finally: c.close()
    except Exception: return False
def flush_standalone_outbox(batch_limit=50):
    c=_connect()
    try:
        _sweep_stale_claims(c); c.commit(); targets=_claim_outbox(c,batch_limit)
        try: c.commit()
        except Exception: pass
    finally: c.close()
    sent=0
    for sref in targets:
        if _SHUTDOWN: break
        # Bulkhead (mirrors the group loop): the payload SELECT below runs outside any
        # txn and could raise (locked DB); without this guard one bad read would abort
        # the whole outbox batch. Release with backoff, never dead-letter from here
        # (no generation concept exists for immutable outbox rows; normal paths still
        # terminate via MAX_RETRIES).
        try:
            rc=_connect()
            try: row=rc.execute("SELECT payload, retry_count FROM standalone_outbox WHERE source_ref=?",(sref,)).fetchone()
            finally: rc.close()
        except Exception as e:
            logging.error(f"Outbox read of {sref} crashed ({type(e).__name__}); released for retry")
            try:
                wc=_connect()
                try: wc.execute("UPDATE standalone_outbox SET next_retry_at=?, state='idle', lease_until=0 WHERE source_ref=? AND status='queued'",(time.time()+60.0,sref)); wc.commit()
                except Exception: pass
                finally: wc.close()
            except Exception: pass
            continue
        if not row: continue
        try: p=json.loads(row[0])
        except Exception:
            wc=_connect()
            try: wc.execute("UPDATE standalone_outbox SET status='dead', state='idle' WHERE source_ref=?",(sref,)); wc.commit()
            except Exception: pass
            finally: wc.close()
            continue
        ok,rt,nid,resp,ra=create_thehive_alert_sync(p)
        if not ok and not rt and _create_needs_reconcile(resp):
            # Server-side dedup fired: the alert already exists, so delivery is
            # effectively complete — confirm via lookup, never re-CREATE.
            found=find_thehive_alert_id_by_sourceref(sref)
            wc=_connect()
            try:
                if found:
                    wc.execute("DELETE FROM standalone_outbox WHERE source_ref=?",(sref,)); wc.commit()
                    logging.info(f"[reconcile] outbox {sref} already in TheHive as {found}; marked delivered (no duplicate created)"); sent+=1
                else:
                    rcnt=int(row[1] or 0)+1
                    if rcnt>MAX_RETRIES:
                        wc.execute("UPDATE standalone_outbox SET status='dead', state='idle', retry_count=? WHERE source_ref=?",(rcnt,sref)); wc.commit()
                        logging.error(f"[reconcile] outbox {sref} lookup failed persistently; dead-lettered, reconcile manually by sourceRef (no duplicate created)")
                    else:
                        delay=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**(rcnt-1)))+random.uniform(0,1.0)
                        wc.execute("UPDATE standalone_outbox SET retry_count=?, next_retry_at=?, state='idle', lease_until=0 WHERE source_ref=?",(rcnt,time.time()+delay,sref)); wc.commit()
                        logging.error(f"[reconcile] outbox {sref} lookup failed transiently; retry {rcnt} in {delay:.1f}s (no duplicate created)")
            except Exception: pass
            finally:
                try: wc.close()
                except Exception: pass
            continue
        wc=_connect()
        try:
            wc.execute("BEGIN IMMEDIATE")
            if ok:
                wc.execute("DELETE FROM standalone_outbox WHERE source_ref=?",(sref,)); _bump_in_txn(wc,"m_standalone_sent"); wc.execute("COMMIT"); logging.info(f"OK outbox {sref} -> TheHive"); sent+=1
            else:
                rcnt=int(row[1] or 0)+1
                if not rt or rcnt>MAX_RETRIES:
                    wc.execute("UPDATE standalone_outbox SET status='dead', state='idle', retry_count=? WHERE source_ref=?",(rcnt,sref)); _bump_in_txn(wc,"m_dead"); wc.execute("COMMIT"); logging.error(f"Outbox {sref} dead-lettered after {rcnt} attempts")
                else:
                    base=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**(rcnt-1)))+random.uniform(0,1.0); delay=max(base,ra) if ra is not None else base
                    wc.execute("UPDATE standalone_outbox SET retry_count=?, next_retry_at=?, state='idle', lease_until=0 WHERE source_ref=?",(rcnt,time.time()+delay,sref)); _bump_in_txn(wc,"m_retries"); wc.execute("COMMIT"); logging.info(f"Outbox {sref} retry {rcnt} in {delay:.1f}s")
        except Exception:
            try: wc.execute("ROLLBACK")
            except Exception: pass
        finally: wc.close()
    return sent
def _get_last_flush(c):
    r=c.execute("SELECT value FROM flush_meta WHERE key='last_flush'").fetchone()
    try: return float(r[0]) if r else 0
    except (TypeError,ValueError): return 0
def _prune_if_due(c,force=False):
    n=time.time(); r=c.execute("SELECT value FROM flush_meta WHERE key='last_prune'").fetchone()
    last=0
    if r:
        try: last=float(r[0])
        except (TypeError,ValueError): last=0
    if not force and n-last<PRUNE_INTERVAL_SECONDS: return
    c.execute("DELETE FROM recent_processes WHERE created_at < ?",(n-CORRELATION_WINDOW_SECONDS,)); c.execute("DELETE FROM wazuh_rooted_pids WHERE created_at < ?",(n-WAZUH_CHAIN_TTL_SECONDS,))
    c.execute("DELETE FROM recent_logons WHERE last_seen < ?",(n-max(LOGON_CORRELATION_WINDOW_SECONDS*4,3600),)); c.execute("DELETE FROM recent_bursts WHERE last_seen < ?",(n-max(BURST_WINDOW_SECONDS*4,3600),)); c.execute("DELETE FROM recent_fanouts WHERE last_seen < ?",(n-max(PROCESS_FANOUT_WINDOW_SECONDS*4,3600),)); c.execute("DELETE FROM recent_tool_campaigns WHERE last_seen < ?",(n-max(TOOL_CAMPAIGN_IDLE_TIMEOUT_SECONDS*4,3600),))
    c.execute("DELETE FROM seen_alerts WHERE wazuh_id NOT IN (SELECT wazuh_id FROM seen_alerts ORDER BY first_seen DESC LIMIT 50000)")
    c.execute("INSERT INTO flush_meta(key,value) VALUES('last_prune',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",(str(n),))
def maybe_inline_flush():
    if not INLINE_FLUSH_ENABLED: return
    try:
        c=_connect()
        try: last=_get_last_flush(c)
        finally: c.close()
    except Exception: return
    if time.time()-last<FLUSH_INTERVAL_SECONDS: return
    try: flush_dirty_groups(); flush_standalone_outbox()
    except Exception as e: logging.error(f"Inline flush failed: {type(e).__name__}")
def fast_lane_single(gt,tid):
    """CRITICAL fast-lane (separate from normal batching): persists FIRST via the normal
    ingest txn, then claims+flushes JUST this one group immediately instead of waiting
    for the next 5s daemon cycle. Bounded to is_critical groups only; normal alerts
    NEVER take this path. Disable with THEHIVE_CRITICAL_INLINE=0."""
    c=_connect()
    try:
        now=time.time()
        cur=c.execute("UPDATE pending_groups SET state='flushing', claimed_at=?, claimed_gen=generation, lease_until=? WHERE group_type=? AND thehive_alert_id=? AND dirty=1 AND next_retry_at<=? AND (state='idle' OR lease_until<?)",(now,now+CLAIM_LEASE_SECONDS,gt,tid,now,now))
        claimed=(cur.rowcount==1)
        try: c.commit()
        except Exception: pass
    finally:
        try: c.close()
        except Exception: pass
    if claimed:
        logging.info(f"[fast-lane] critical group {gt}/{tid} claimed for immediate flush (bypasses batch window)")
        return flush_claimed_group(gt,tid)
    return False
def fast_lane_outbox_single(sref):
    c=_connect()
    try:
        now=time.time()
        cur=c.execute("UPDATE standalone_outbox SET state='sending', claimed_at=?, lease_until=? WHERE source_ref=? AND status='queued' AND next_retry_at<=? AND (state='idle' OR lease_until<?)",(now,now+CLAIM_LEASE_SECONDS,sref,now,now))
        claimed=(cur.rowcount==1)
        try: c.commit()
        except Exception: pass
    finally:
        try: c.close()
        except Exception: pass
    if not claimed: return False
    rc=_connect()
    try: row=rc.execute("SELECT payload, retry_count FROM standalone_outbox WHERE source_ref=?",(sref,)).fetchone()
    finally: rc.close()
    if not row: return True
    try: p=json.loads(row[0])
    except Exception:
        wc=_connect()
        try: wc.execute("UPDATE standalone_outbox SET status='dead', state='idle' WHERE source_ref=?",(sref,)); wc.commit()
        except Exception: pass
        finally: wc.close()
        return False
    ok,rt,nid,resp,ra=create_thehive_alert_sync(p)
    if not ok and not rt and _create_needs_reconcile(resp):
        found=find_thehive_alert_id_by_sourceref(sref)
        wc=_connect()
        try:
            if found:
                wc.execute("DELETE FROM standalone_outbox WHERE source_ref=?",(sref,)); wc.commit()
                logging.info(f"[fast-lane][reconcile] outbox {sref} already in TheHive as {found}; marked delivered"); return True
            rcnt=int(row[1] or 0)+1
            if rcnt>MAX_RETRIES:
                wc.execute("UPDATE standalone_outbox SET status='dead', state='idle', retry_count=? WHERE source_ref=?",(rcnt,sref)); wc.commit()
                logging.error(f"[fast-lane][reconcile] outbox {sref} lookup failed persistently; dead-lettered, reconcile manually")
            else:
                delay=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**(rcnt-1)))+random.uniform(0,1.0)
                wc.execute("UPDATE standalone_outbox SET retry_count=?, next_retry_at=?, state='idle', lease_until=0 WHERE source_ref=?",(rcnt,time.time()+delay,sref)); wc.commit()
                logging.error(f"[fast-lane][reconcile] outbox {sref} lookup failed transiently; retry {rcnt} in {delay:.1f}s")
            return False
        except Exception: return False
        finally:
            try: wc.close()
            except Exception: pass
    wc=_connect()
    try:
        wc.execute("BEGIN IMMEDIATE")
        if ok: wc.execute("DELETE FROM standalone_outbox WHERE source_ref=?",(sref,)); _bump_in_txn(wc,"m_standalone_sent"); wc.execute("COMMIT"); logging.info(f"[fast-lane] OK outbox {sref}"); return True
        rcnt=int(row[1] or 0)+1
        if not rt or rcnt>MAX_RETRIES: wc.execute("UPDATE standalone_outbox SET status='dead', state='idle', retry_count=? WHERE source_ref=?",(rcnt,sref)); _bump_in_txn(wc,"m_dead"); wc.execute("COMMIT")
        else:
            base=min(RETRY_MAX_DELAY,RETRY_BASE_DELAY*(2**(rcnt-1)))+random.uniform(0,1.0); delay=max(base,ra) if ra is not None else base
            wc.execute("UPDATE standalone_outbox SET retry_count=?, next_retry_at=?, state='idle', lease_until=0 WHERE source_ref=?",(rcnt,time.time()+delay,sref)); _bump_in_txn(wc,"m_retries"); wc.execute("COMMIT")
        return False
    except Exception:
        try: wc.execute("ROLLBACK")
        except Exception: pass
        return False
    finally: wc.close()
def _spool_dir():
    base=os.environ.get("THEHIVE_SPOOL_DIR")
    if base: return base
    dd=os.path.dirname(CORRELATION_DB)
    return os.path.join(dd or ".","thehive_spool")
def _spool_raw_alert(alert):
    """Last-resort lossless fallback when SQLite itself is unusable (disk FULL, CORRUPT,
    CANTOPEN): persist the raw alert JSON to a spool dir (0700/0600). NEVER touches Wazuh
    files (raw retention is untouched). Best-effort; the daemon replays spool files
    through the normal ingest path (dedup applies), so replay is idempotent."""
    try:
        d=_spool_dir()
        try: os.makedirs(d,mode=0o700,exist_ok=True)
        except Exception: pass
        wid=str((alert.get("id") if isinstance(alert,dict) else "") or f"noid-{time.time()}-{uuid.uuid4().hex[:6]}")
        safe="".join(ch if (ch.isalnum() or ch in "-_") else "_" for ch in wid)[:64] or uuid.uuid4().hex[:8]
        tmp=os.path.join(d,f".{safe}-{uuid.uuid4().hex[:6]}.tmp")
        fd=os.open(tmp,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
        try:
            with os.fdopen(fd,"w") as f: json.dump(alert,f)
        except Exception:
            try: os.close(fd)
            except Exception: pass
            raise
        dest=os.path.join(d,f"{safe}.json")
        if os.path.exists(dest):
            # Same Wazuh id spooled twice (replay during an outage): keep BOTH files so
            # no raw alert is ever replaced; replay dedups via seen_alerts (the second
            # returns duplicate and is unlinked). TOCTOU here only repeats old behavior.
            dest=os.path.join(d,f"{safe}-{uuid.uuid4().hex[:6]}.json")
        os.replace(tmp,dest)
        try: os.chmod(dest,0o600)
        except Exception: pass
        logging.error(f"Ingest DB unavailable; raw alert spooled for replay (id={wid})")
        return True
    except Exception as e:
        logging.error(f"Spool write failed (alert NOT queued): {type(e).__name__}")
        return False
def _drain_spool(maxn=500):
    """Replay spooled raw alerts through ingest_alert (dedup-guarded). Deletes a spool
    file only on non-error ingest. Leaves failures for the next cycle with a single
    summary line (no hot loop: capped count, daemon-cadence only)."""
    try: files=sorted(f for f in os.listdir(_spool_dir()) if f.endswith(".json"))
    except Exception: return (0,0)
    if not files: return (0,0)
    done=fail=0
    for fn in files[:maxn]:
        if _SHUTDOWN: break
        fp=os.path.join(_spool_dir(),fn)
        try:
            with open(fp) as f: alert=json.load(f)
        except Exception:
            try: os.rename(fp,fp+".bad")
            except OSError: pass
            fail+=1; continue
        try: r=ingest_alert(alert)
        except Exception: r={"action":"error"}
        if r.get("action")=="error":
            # Quarantine deterministically-failing files so they neither loop forever nor
            # head-block newer spool files behind the maxn cap: attempts ride in the
            # filename (x.json -> x.r1.json ...), give up to .bad (excluded from scans)
            # after 5 failures. Transient DB errors heal on their own before that.
            m=re.match(r"^(.*)\.r(\d+)\.json$",fn); stem,n=(m.group(1),int(m.group(2))+1) if m else (fn[:-5],1)
            try:
                if n>5: os.rename(fp,stem+".bad"); logging.error(f"Spool file quarantined after 5 failed replays: {fn}")
                else: os.rename(fp,stem+f".r{n}.json")
            except OSError: pass
            fail+=1; continue
        try: os.unlink(fp); done+=1
        except OSError: fail+=1
    if done or fail: logging.info(f"Spool drain: replayed={done} still-queued={fail}")
    return (done,fail)
def run_flush_daemon(interval=None):
    resolve_runtime_config(sys.argv)
    interval=interval or FLUSH_INTERVAL_SECONDS; logging.info(f"Starting flush daemon interval={interval}s batch={FLUSH_BATCH_GROUPS} lease={CLAIM_LEASE_SECONDS}s")
    x=_connect()
    try: _sweep_stale_claims(x); x.commit()
    except Exception: pass
    finally: x.close()
    while not _SHUTDOWN:
        s=time.time()
        try:
            # Re-read env config every cycle (cheap env reads; never raises). NOTE: under
            # systemd the process environment is fixed at service start, so a rotation
            # still requires `systemctl restart thehive-flush` to take effect — the
            # re-read only helps exotic launchers that mutate env at runtime.
            # (argv overrides from startup are kept either way.)
            try: resolve_runtime_config(sys.argv)
            except Exception: pass
            sd,sf=_drain_spool()
            ok,fr,dd=flush_dirty_groups(); sent=flush_standalone_outbox()
            dur=time.time()-s
            if ok or fr or dd or sent or sd or sf: logging.info(f"Flush cycle {dur:.2f}s: groups ok={ok} retry={fr} dead={dd} standalone_sent={sent} spool_replayed={sd} spool_queued={sf}")
        except Exception as e: logging.error(f"Flush cycle: {type(e).__name__}")
        sl=max(0.5,interval-(time.time()-s)); end=time.time()+sl
        while time.time()<end and not _SHUTDOWN: time.sleep(min(0.5,end-time.time()))
    logging.info("Flush daemon clean shutdown")
def _bench_base(i,rid="100200",level=7,desc="bench burst"):
    return {"id":f"bench-{i}","timestamp":"2026-09-05T06:20:00.000Z","rule":{"id":rid,"level":level,"description":desc,"groups":["bench"]},"agent":{"id":"001","name":"bench-agent"},"full_log":"bench event","data":{"audit":{"command":"bench","exe":"/bin/bench","uid":"0","cwd":"/","success":"yes"}}}
def _bench_alert(i):
    if i%50==49:
        return _bench_base("dup")  # identical id every time -> duplicate path after the first
    if i%25==24:
        a=_bench_base(i); a["rule"]={"id":"23504","level":5,"description":"suppressed CVE","groups":[]}; return a
    if i%77==38:
        a=_bench_base(i); a["data"]["audit"]["command"]="curl http://example.invalid/x"; return a  # watchlist break-out
    if i%131==65:
        return _bench_base(i,rid="504",level=3,desc="bench agent event")  # force-escalated standalone
    r=i%20
    if r in (5,6):
        # Process lineage: pid chains into the same-r alert 20 back (ms apart, inside the
        # 15s window once the parent has been seen; fanout-keyed before that).
        a=_bench_base(i); au=a["data"]["audit"]; au["pid"]=str(9000+i)
        if i>=20: au["ppid"]=str(9000+i-20)
        return a
    if r<14: return _bench_base(i)
    if r<17:
        a=_bench_base(i,rid="100201",level=5,desc="bench ssh"); a["data"]={"srcuser":"benchuser","srcip":"10.0.0.9"}; return a
    return _bench_base(i,rid=f"1002{r}",level=7,desc=f"bench unique {r}")
def _bench_child_init(db):
    global CORRELATION_DB; CORRELATION_DB=db
def _bench_one(alert):
    t0=time.perf_counter(); res=ingest_alert(alert); return (res.get("action"),(time.perf_counter()-t0)*1000.0)
def run_self_test(fx_path=None):
    """Pre-deploy gate for the fingerprint table: each fixture asserts detect output.
    Prints PASS/FAIL per fixture; returns True iff all pass. No DB, no network —
    safe to run anywhere before deploying a table change."""
    path=fx_path or os.path.join(os.path.dirname(os.path.abspath(__file__)),"tests","fingerprint_fixtures.json")
    try:
        with open(path) as f: fixtures=json.load(f)
    except Exception as e:
        print(f"self-test: cannot load fixtures {path}: {type(e).__name__}"); return False
    if not isinstance(fixtures,list) or not fixtures:
        print(f"self-test: no fixtures in {path}"); return False
    passed=failed=0
    for fx in fixtures:
        if not isinstance(fx,dict): print("self-test: SKIP non-dict fixture"); failed+=1; continue
        a={"id":fx.get("id","selftest"),"rule":{"id":"100200","level":7,"description":"selftest","groups":[]},"agent":{"id":"001","name":"selftest"},"timestamp":"2026-09-06T00:00:00.000Z","full_log":"","data":{"http":{"http_user_agent":fx.get("ua")},"alert":{"signature":fx.get("signature")},"src_ip":fx.get("src_ip","10.9.9.9")}}
        try: got=detect_recon_tool(a)
        except Exception as e: got=f"EXC:{type(e).__name__}"
        want=fx.get("expected")
        if got==want:
            if want is None:
                try: um=detect_scanner_umbrella(a)
                except Exception: um="EXC"
                if um==bool(fx.get("expect_umbrella",False)): print(f"self-test: PASS {fx.get('name','?')} (no tool, umbrella={um})"); passed+=1
                else: print(f"self-test: FAIL {fx.get('name','?')} umbrella got={um} want={bool(fx.get('expect_umbrella',False))}"); failed+=1
            else: print(f"self-test: PASS {fx.get('name','?')} -> {got}"); passed+=1
        else: print(f"self-test: FAIL {fx.get('name','?')} got={got!r} want={want!r}"); failed+=1
    print(f"self-test: {passed} passed, {failed} failed ({path})")
    return failed==0
def run_bench(n,workers=1):
    """Ingest-path benchmark: N synthetic alerts (burst/logon/unique/suppressed/dup mix).
    Uses a TEMP SQLite file by default (THEHIVE_BENCH_DB to override) — NEVER prod DB.
    Exercises only ingest_alert() (the Wazuh fork/exec path); no TheHive traffic."""
    global CORRELATION_DB  # first statement: this function both reads and writes it
    import tempfile
    db=os.environ.get("THEHIVE_BENCH_DB")
    if db and os.path.realpath(db)==os.path.realpath(CORRELATION_DB):
        print(f"bench: REFUSED — THEHIVE_BENCH_DB resolves to the production database ({db}); unset it to use a temp DB"); sys.exit(2)
    tmp=False
    if not db:
        fd,db=tempfile.mkstemp(prefix="thehive-bench-",suffix=".db"); os.close(fd); tmp=True
    print(f"bench: n={n} workers={workers} db={db}")
    alerts=[_bench_alert(i) for i in range(n)]
    lat=[]; acts={}
    t0=time.perf_counter()
    if workers>1:
        try:
            from concurrent.futures import ProcessPoolExecutor
            with ProcessPoolExecutor(max_workers=workers,initializer=_bench_child_init,initargs=(db,)) as ex:
                for act,dt in ex.map(_bench_one,alerts,chunksize=50):
                    acts[act]=acts.get(act,0)+1; lat.append(dt)
        except Exception as e:
            print(f"bench: process pool unavailable ({type(e).__name__}), serial fallback"); workers=1
    if workers<=1:
        old=CORRELATION_DB; CORRELATION_DB=db
        try:
            for a in alerts:
                s=time.perf_counter(); r=ingest_alert(a); lat.append((time.perf_counter()-s)*1000.0)
                acts[r.get("action")]=acts.get(r.get("action"),0)+1
        finally: CORRELATION_DB=old
    total=time.perf_counter()-t0
    lat.sort(); q=(lambda f: lat[min(len(lat)-1,int(len(lat)*f))]) if lat else (lambda f: 0.0)
    maxms=lat[-1] if lat else 0.0
    dg=(0,0); st=(0,)
    old=CORRELATION_DB; CORRELATION_DB=db
    try:
        c=_connect()
        try:
            dg=c.execute("SELECT COUNT(*), COALESCE(SUM(pending_stages),0) FROM pending_groups WHERE dirty=1").fetchone()
            st=c.execute("SELECT COUNT(*) FROM group_stages").fetchone()
        finally: c.close()
    except Exception as e:
        print(f"bench: gauge read failed ({type(e).__name__})")
    finally: CORRELATION_DB=old
    try: size=os.path.getsize(db)
    except OSError: size=-1
    print(f"bench: total={total:.2f}s avg={total/max(1,n)*1000:.2f}ms p50={q(0.5):.2f}ms p95={q(0.95):.2f}ms max={maxms:.2f}ms actions={acts} dirty_groups={dg[0]} queued_stages={dg[1]} stored_stages={st[0]} db_bytes={size}")
    if tmp:
        try: os.unlink(db)
        except OSError: pass
def main():
    a=sys.argv[1:]
    if "--flush-daemon" in a:
        iv=FLUSH_INTERVAL_SECONDS
        for i,x in enumerate(a):
            if x=="--interval" and i+1<len(a):
                try:
                    cand=float(a[i+1])
                    # cand==cand rejects NaN without importing math; inf/<=0 fall back too.
                    if cand>0 and cand==cand and cand<float("inf"): iv=cand
                    else: print(f"warning: ignoring invalid --interval {a[i+1]!r}, using default {iv}")
                except ValueError: print(f"warning: ignoring invalid --interval {a[i+1]!r}, using default {iv}")
        run_flush_daemon(interval=iv); return
    if "--flush-once" in a:
        resolve_runtime_config(sys.argv)
        sd,sf=_drain_spool(); ok,fr,dd=flush_dirty_groups(); sent=flush_standalone_outbox(); print(f"flush-once: spool_replayed={sd} spool_queued={sf} ok={ok} retry={fr} dead={dd} standalone_sent={sent} metrics={METRICS_FILE}"); return
    if "--self-test" in a:
        fxp=None
        if "--fixtures" in a:
            try: fxp=a[a.index("--fixtures")+1]
            except (ValueError,IndexError): print("Usage: --self-test [--fixtures PATH]"); sys.exit(2)
        sys.exit(0 if run_self_test(fxp) else 1)
    if "--bench" in a:
        try: bn=int(a[a.index("--bench")+1])
        except (ValueError,IndexError): print("Usage: --bench N [--bench-workers K]"); sys.exit(2)
        bw=1
        if "--bench-workers" in a:
            try: bw=max(1,int(a[a.index("--bench-workers")+1]))
            except (ValueError,IndexError): bw=1
        run_bench(bn,workers=bw); return
    if "--flush-single" in a:
        try: gi=a.index("--flush-single"); gt=a[gi+1]; tid=a[gi+2]
        except (ValueError,IndexError): print("Usage: --flush-single <group_type> <thehive_id>"); sys.exit(2)
        # NOTE: flush_claimed_group() requires a prior atomic claim; the claiming
        # fast_lane_single() path is the only correct entry point here, otherwise two
        # operators/workers could flush the same group concurrently.
        resolve_runtime_config(sys.argv); print("flushed" if fast_lane_single(gt,tid) else "pending"); return
    if len(a)<1 or a[0].startswith("--"): logging.error("Missing alert file. Usage: script.py <alert_file> [api_key] [hook_url]"); sys.exit(2)
    resolve_runtime_config(sys.argv)
    global INLINE_FLUSH_ENABLED
    if "--no-inline-flush" in a: INLINE_FLUSH_ENABLED=False
    try:
        with open(a[0]) as f: alert=json.load(f)
    except Exception as e: logging.error(f"Failed read {a[0]}: {type(e).__name__}"); sys.exit(1)
    try: r=ingest_alert(alert)
    except Exception as e:
        # Truly unexpected (non-sqlite) crash inside ingest: spool before exiting so the
        # daemon can replay it; the raw Wazuh file itself is never touched.
        _spool_raw_alert(alert)
        logging.error(f"Ingest crashed unexpectedly, spooled: {type(e).__name__}"); sys.exit(1)
    act=r.get("action")
    if act in ("suppressed","duplicate","error"): sys.exit(0 if act in ("suppressed","duplicate") else 1)
    if act=="standalone_queued":
        if r.get("is_critical") and CRITICAL_INLINE_ENABLED:
            try: fast_lane_outbox_single(r.get("source_ref",""))
            except Exception as e: logging.error(f"Fast-lane outbox failed, daemon will retry: {type(e).__name__}")
        else: maybe_inline_flush()
        sys.exit(0)
    if act=="queued":
        if r.get("is_critical") and CRITICAL_INLINE_ENABLED:
            try: fast_lane_single(r["group_type"],r["thehive_id"])
            except Exception as e: logging.error(f"Fast-lane group flush failed, daemon will retry: {type(e).__name__}")
        else: maybe_inline_flush()
        sys.exit(0)
    sys.exit(0)
if __name__=="__main__": main()
