---
phase: 8
plan: 1
wave: 1
---

# Plan 8.1: Privacy Redaction Engine & Activity Monitor

## Objective
Build the two Python components of the passive activity monitor:

1. **Schema patch** — Remove `wpm_bucket` column from `activity_log` DDL in `zeno_schema.sql` (dead weight: idle-time proxy adds no value over `input_level`). Also add `psutil` to `requirements.txt`.
2. **`privacy.py`** — Loads `privacy_exclusions` from SQLite and exposes two functions: `is_excluded(app_name, window_title, db_path)` and `redact(sample, db_path)`. Called before every DB write — the monitor never writes raw titles for excluded apps.
3. **`activity.py`** — `ActivityMonitor` daemon thread: every 30 seconds samples the active window via `pywin32`+`psutil`, computes `input_level` (from `GetLastInputInfo()` idle time — no keyboard hooks), marks `is_off_task`. Redacts via `privacy.py`. Writes one row to `activity_log` per tick.

## Context
- `.gsd/SPEC.md` — R8: 30-second sampling, fields: `app_name`, `window_title`, `input_level`, `is_off_task`; privacy via `privacy_exclusions`
- `.gsd/DECISIONS.md` — Phase 8: drop `wpm_bucket`; context switches derived at query time; psutil approved
- `zeno_schema.sql` — `activity_log` DDL (remove `wpm_bucket`); `privacy_exclusions` (`exclusion_type`, `value`); `app_classifications` (`is_work_app`, `user_override`)
- `requirements.txt` — `pywin32` present; add `psutil`
- `zeno/db.py` — `db_session()` context manager pattern

## Tasks

<task type="auto">
  <name>Schema patch: remove wpm_bucket from activity_log DDL + add psutil to requirements</name>
  <files>
    zeno_schema.sql
    requirements.txt
  </files>
  <action>
    **1. `zeno_schema.sql`** — Remove the `wpm_bucket` column from the `activity_log` CREATE TABLE statement.

    Find the existing `activity_log` table definition. It currently contains:
    ```sql
        wpm_bucket      INTEGER,             -- 0, 10, 20, 30, 40, 50+ words-per-minute bucket
    ```
    Delete that entire line (column + comment). Leave all other columns (`id`, `sampled_at`, `app_name`, `window_title`, `project_id`, `task_id`, `input_level`, `is_off_task`) untouched.

    Also remove `wpm_bucket` from the `v_weekly_activity` view if it references it (check the view definition — remove only if present, leave other columns intact).

    **2. `requirements.txt`** — Add `psutil>=5.9` on a new line (sorted alphabetically with existing deps is fine, just add it).

    Avoid: altering any other table DDL. Avoid: changing index or trigger definitions. Only touch `activity_log` CREATE TABLE and `requirements.txt`.
  </action>
  <verify>python -c "import re, pathlib; s = pathlib.Path('zeno_schema.sql').read_text(); assert 'wpm_bucket' not in s, 'wpm_bucket still in schema'; r = pathlib.Path('requirements.txt').read_text(); assert 'psutil' in r, 'psutil missing from requirements'; print('Schema patch OK')"</verify>
  <done>
    - `wpm_bucket` does not appear anywhere in `zeno_schema.sql`.
    - `requirements.txt` contains `psutil`.
    - All other `activity_log` columns remain in the schema.
  </done>
</task>

<task type="auto">
  <name>privacy.py + activity.py — redaction engine and 30-second sampling daemon</name>
  <files>
    zeno/monitor/privacy.py
    zeno/monitor/activity.py
    zeno/monitor/__init__.py
  </files>
  <action>
    **`zeno/monitor/privacy.py`**:

    ```python
    import fnmatch, sqlite3, sys
    from typing import Any

    def _load_exclusions(db_path: str) -> dict[str, list[str]]:
        """Load privacy_exclusions from DB. Never raises — returns empty dict on error."""
        try:
            with sqlite3.connect(db_path) as conn:
                rows = conn.execute(
                    "SELECT exclusion_type, value FROM privacy_exclusions"
                ).fetchall()
        except sqlite3.Error as e:
            print(f"[privacy] DB error loading exclusions: {e}", file=sys.stderr)
            return {}
        result: dict[str, list[str]] = {"app_name": [], "window_title_pattern": [], "browser_domain": []}
        for exc_type, value in rows:
            if exc_type in result:
                result[exc_type].append(value)
        return result

    def is_excluded(app_name: str, window_title: str, db_path: str) -> bool:
        """Return True if this sample should be redacted."""
        exclusions = _load_exclusions(db_path)
        if not exclusions:
            return False
        # Exact app name match (case-insensitive)
        if any(app_name.lower() == ex.lower() for ex in exclusions["app_name"]):
            return True
        # Window title pattern match via fnmatch (% → * for LIKE-style patterns)
        for pattern in exclusions["window_title_pattern"]:
            py_pattern = pattern.replace("%", "*")
            if fnmatch.fnmatch(window_title.lower(), py_pattern.lower()):
                return True
        return False

    def is_domain_excluded(domain: str, db_path: str) -> bool:
        """Return True if a browser domain should be excluded."""
        exclusions = _load_exclusions(db_path)
        return any(domain.lower() == ex.lower() for ex in exclusions.get("browser_domain", []))

    def redact(sample: dict[str, Any], db_path: str) -> dict[str, Any]:
        """
        Return a copy of sample with app_name and window_title replaced by
        '[redacted]' if the sample matches any privacy exclusion.
        Never mutates the input dict.
        """
        if is_excluded(sample.get("app_name", ""), sample.get("window_title", ""), db_path):
            return {**sample, "app_name": "[redacted]", "window_title": "[redacted]"}
        return sample
    ```

    ---

    **`zeno/monitor/activity.py`**:

    ```python
    import sqlite3, sys, threading
    from zeno.monitor.privacy import redact

    try:
        import win32gui, win32process, win32api
        _WIN32_AVAILABLE = True
    except ImportError:
        _WIN32_AVAILABLE = False

    try:
        import psutil
        _PSUTIL_AVAILABLE = True
    except ImportError:
        _PSUTIL_AVAILABLE = False


    def _get_active_window() -> tuple[str, str]:
        """Returns (app_name, window_title). Falls back to ('unknown','unknown') on error."""
        if not (_WIN32_AVAILABLE and _PSUTIL_AVAILABLE):
            return ("unknown", "unknown")
        try:
            hwnd = win32gui.GetForegroundWindow()
            window_title = win32gui.GetWindowText(hwnd)
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            app_name = psutil.Process(pid).name().removesuffix(".exe")
            return (app_name, window_title)
        except Exception:
            return ("unknown", "unknown")


    def _compute_input_level() -> str:
        """
        Compute input level from GetLastInputInfo() idle time.
        No keyboard hooks — uses only time-since-last-input (mouse OR keyboard).
        Returns one of: 'idle', 'light', 'moderate', 'heavy'.
        """
        if not _WIN32_AVAILABLE:
            return "idle"
        try:
            last_input = win32api.GetLastInputInfo()  # returns dwTime (ms since boot)
            idle_ms = win32api.GetTickCount() - last_input
            if idle_ms > 60_000:  return "idle"
            if idle_ms > 10_000:  return "light"
            if idle_ms > 2_000:   return "moderate"
            return "heavy"
        except Exception:
            return "idle"


    def _is_off_task(app_name: str, db_path: str) -> int:
        """
        Returns 1 if app is explicitly classified non-work (is_work_app=0, user_override=0).
        Unknown apps return 0 — warn-and-allow philosophy from Phase 7.
        """
        try:
            with sqlite3.connect(db_path) as conn:
                row = conn.execute(
                    "SELECT is_work_app, user_override FROM app_classifications "
                    "WHERE app_name = ? COLLATE NOCASE LIMIT 1",
                    (app_name,)
                ).fetchone()
            if row and row[0] == 0 and row[1] == 0:
                return 1
            return 0
        except Exception:
            return 0


    class ActivityMonitor:
        """
        Daemon thread that samples the active window every 30 seconds.
        Writes one row to activity_log per tick after privacy redaction.
        Context switches are NOT written here — derive them at query time
        from consecutive rows with different app_name values.
        """
        INTERVAL = 30  # seconds

        def __init__(self, db_path: str) -> None:
            self._db_path = db_path
            self._stop_event = threading.Event()
            self._thread = threading.Thread(
                target=self._loop, daemon=True, name="ActivityMonitor"
            )

        def start(self) -> None:
            self._thread.start()

        def stop(self) -> None:
            self._stop_event.set()

        def _loop(self) -> None:
            # Wait first so we don't fire immediately on startup
            while not self._stop_event.wait(timeout=self.INTERVAL):
                self._tick()

        def _tick(self) -> None:
            app_name, window_title = _get_active_window()
            input_level = _compute_input_level()
            is_off_task = _is_off_task(app_name, self._db_path)

            sample = redact(
                {"app_name": app_name, "window_title": window_title},
                self._db_path
            )

            try:
                with sqlite3.connect(self._db_path) as conn:
                    conn.execute(
                        "INSERT INTO activity_log "
                        "(app_name, window_title, input_level, is_off_task) "
                        "VALUES (?, ?, ?, ?)",
                        (sample["app_name"], sample["window_title"],
                         input_level, is_off_task)
                    )
            except Exception as e:
                print(f"[ActivityMonitor] DB write error: {e}", file=sys.stderr)
            # Never raise — one failed tick must not kill the monitor
    ```

    **`zeno/monitor/__init__.py`**:
    ```python
    """Monitor module — window detection, app tracking, and distraction analytics."""
    from zeno.monitor.activity import ActivityMonitor
    __all__ = ["ActivityMonitor"]
    ```
    (Will be updated in Plan 8.3 to also export `BrowserWebSocketServer`.)

    Avoid: writing `wpm_bucket` (dropped). Avoid: OS keyboard hooks. Avoid: raising from `_tick()`. Avoid: holding DB connection open between ticks.
  </action>
  <verify>python -c "
from zeno.monitor.privacy import is_excluded, redact, is_domain_excluded
from zeno.monitor import ActivityMonitor
s = redact({'app_name': 'Code', 'window_title': 'main.py'}, ':memory:')
assert s == {'app_name': 'Code', 'window_title': 'main.py'}, 'redact mutated or changed clean sample'
m = ActivityMonitor(':memory:')
assert hasattr(m, 'start') and hasattr(m, 'stop')
import threading; assert isinstance(m._stop_event, threading.Event)
print('Plan 8.1 PASS')
"</verify>
  <done>
    - `from zeno.monitor.privacy import is_excluded, redact, is_domain_excluded` works.
    - `redact` returns a new dict — input unchanged — and does not alter clean samples.
    - `from zeno.monitor import ActivityMonitor` works.
    - `ActivityMonitor(":memory:")` constructs; has `start()`, `stop()`, `_stop_event`.
    - `activity.py` INSERT statement does NOT include `wpm_bucket`.
    - `privacy.py` has `is_domain_excluded()` (needed by Plan 8.3).
  </done>
</task>

## Success Criteria
- [ ] `wpm_bucket` removed from `zeno_schema.sql` `activity_log` DDL
- [ ] `psutil` added to `requirements.txt`
- [ ] `from zeno.monitor.privacy import is_excluded, redact, is_domain_excluded` works
- [ ] `redact` returns a new dict (does not mutate input)
- [ ] `redact` on clean sample (`:memory:` DB, no exclusions) returns unchanged dict
- [ ] `from zeno.monitor import ActivityMonitor` works
- [ ] `ActivityMonitor` has `start()`, `stop()`, `_stop_event: threading.Event`
- [ ] No `wpm_bucket` in `activity.py` INSERT statement
- [ ] No keyboard hooks anywhere in the module
