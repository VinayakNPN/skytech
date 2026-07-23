---
phase: 8
plan: 3
wave: 2
---

# Plan 8.3: WebSocket Server (Browser Extension → Python Daemon Bridge)

## Objective
Build the Python `asyncio` WebSocket server that receives browser extension messages and writes `browser_sessions` rows to SQLite.

- **`zeno/monitor/ws_server.py`** — `BrowserWebSocketServer` on `ws://localhost:8765`. Handles `tab_open`, `tab_close`, `ping`. Applies server-side privacy redaction (domain exclusion + page title redaction). Supports `browser_extension.send_page_title: false` config toggle to strip titles before storage. DB writes run in executor (non-blocking event loop). Port hardcoded to 8765 with cross-reference comment to `background.js`.
- **`zeno/monitor/__init__.py`** update — exports both `ActivityMonitor` and `BrowserWebSocketServer`.

Depends on Plan 8.1 (`privacy.py`, `is_domain_excluded()`) and Plan 8.2 (message schema).

## Context
- `.gsd/DECISIONS.md` — Phase 8: page_title sent from extension, redacted server-side; `browser_extension.send_page_title` config toggle; port 8765 hardcoded; psutil approved
- `zeno_schema.sql` — `browser_sessions`: `browser`, `domain`, `page_title`, `url_category`, `started_at`, `ended_at`, `dwell_seconds`; `privacy_exclusions`
- `zeno/extension/background.js` — message schema: `{type, browser, domain, page_title, url_category, started_at}` for `tab_open`; `{type, domain, dwell_seconds}` for `tab_close`; `{type}` for `ping`
- `zeno/monitor/privacy.py` — `is_domain_excluded(domain, db_path)`, `is_excluded(app_name, window_title, db_path)`
- `requirements.txt` — `websockets` present
- `zeno/config.py` — `load_config()` returns dict from `config.yaml`

## Tasks

<task type="auto">
  <name>ws_server.py — asyncio WebSocket server with privacy redaction and config toggle</name>
  <files>
    zeno/monitor/ws_server.py
  </files>
  <action>
    Create `zeno/monitor/ws_server.py`:

    ```python
    import asyncio, json, sqlite3, sys
    from datetime import datetime, timezone
    from zeno.monitor.privacy import is_domain_excluded

    try:
        import websockets
        _WS_AVAILABLE = True
    except ImportError:
        _WS_AVAILABLE = False

    # PORT IS HARDCODED — if changed here, also change WS_URL in zeno/extension/background.js.
    # These two constants must always match. Search for "8765" to find both locations.
    HOST = "localhost"
    PORT = 8765


    class BrowserWebSocketServer:
        """
        Listens on ws://localhost:8765 for browser extension events.

        Message types (defined in zeno/extension/background.js):
          tab_open  → {type, browser, domain, page_title, url_category, started_at}
          tab_close → {type, domain, dwell_seconds}
          ping      → {type}   (keepalive — no-op)

        Privacy:
          - Excluded domains (browser_domain in privacy_exclusions) → dropped silently.
          - page_title → stored as-is unless matched by window_title_pattern exclusion,
            or unless send_page_title=False in config, in which case stored as ''.
        """

        def __init__(self, db_path: str, send_page_title: bool = True) -> None:
            self._db_path = db_path
            self._send_page_title = send_page_title   # from config.yaml browser_extension.send_page_title
            self._server = None
            # In-flight sessions: domain → session dict
            # Last open wins per domain (handles rapid tab switches gracefully)
            self._pending: dict[str, dict] = {}

        async def start(self) -> None:
            """Start the WebSocket server. Returns when server is ready to accept connections."""
            if not _WS_AVAILABLE:
                print("[WSServer] 'websockets' not installed — browser tracking disabled.", file=sys.stderr)
                return
            self._server = await websockets.serve(self._handle, HOST, PORT)
            print(f"[WSServer] Listening on ws://{HOST}:{PORT}")

        async def stop(self) -> None:
            if self._server:
                self._server.close()
                await self._server.wait_closed()
                self._server = None

        async def _handle(self, ws) -> None:
            """Handle one browser extension WebSocket connection."""
            async for raw in ws:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                msg_type = msg.get("type")
                if msg_type == "tab_open":
                    await self._on_tab_open(msg)
                elif msg_type == "tab_close":
                    await self._on_tab_close(msg)
                # ping: intentional no-op

        async def _on_tab_open(self, msg: dict) -> None:
            domain = msg.get("domain", "unknown")
            # Privacy: drop excluded domains entirely — no DB write, no log
            if is_domain_excluded(domain, self._db_path):
                return

            # Privacy: strip page_title if domain-only mode enabled in config
            page_title = msg.get("page_title", "") if self._send_page_title else ""

            # Privacy: redact page_title if it matches window_title_pattern exclusions
            # Reuse the window_title matching path by passing page_title as window_title
            from zeno.monitor.privacy import is_excluded
            if page_title and is_excluded("", page_title, self._db_path):
                page_title = "[redacted]"

            self._pending[domain] = {
                "browser":      msg.get("browser", "chrome"),
                "domain":       domain,
                "page_title":   page_title,
                "url_category": msg.get("url_category", "unknown"),
                "started_at":   msg.get("started_at", datetime.now(timezone.utc).isoformat()),
            }

        async def _on_tab_close(self, msg: dict) -> None:
            domain = msg.get("domain", "")
            session = self._pending.pop(domain, None)
            if session is None:
                return  # no matching open session — ignore orphan close

            ended_at = datetime.now(timezone.utc).isoformat()
            dwell_seconds = int(msg.get("dwell_seconds", 0))

            try:
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(
                    None, self._write_session, session, ended_at, dwell_seconds
                )
            except Exception as e:
                print(f"[WSServer] DB write error: {e}", file=sys.stderr)

        def _write_session(self, session: dict, ended_at: str, dwell_seconds: int) -> None:
            """Blocking DB write — called via run_in_executor, not on event loop."""
            with sqlite3.connect(self._db_path) as conn:
                conn.execute(
                    "INSERT INTO browser_sessions "
                    "(browser, domain, page_title, url_category, started_at, ended_at, dwell_seconds) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (
                        session["browser"],
                        session["domain"],
                        session["page_title"],
                        session["url_category"],
                        session["started_at"],
                        ended_at,
                        dwell_seconds,
                    )
                )
    ```

    Key design choices documented in code:
    - Port constant comment cross-references `background.js` — changing 8765 requires a deliberate two-file edit.
    - `_pending` dict keyed by domain — last open wins (handles rapid tab switching).
    - `_write_session` is a plain sync method called via `run_in_executor` — keeps event loop unblocked.
    - `send_page_title=False` strips titles before any redaction check — domain-only mode.

    Avoid: holding SQLite connection across messages. Avoid: calling `_write_session` directly on the event loop (always `run_in_executor`). Avoid: logging full URLs — only domain is stored.
  </action>
  <verify>python -c "
from zeno.monitor.ws_server import BrowserWebSocketServer, HOST, PORT
assert HOST == 'localhost'
assert PORT == 8765
s = BrowserWebSocketServer(':memory:')
assert hasattr(s, 'start') and hasattr(s, 'stop')
assert isinstance(s._pending, dict)
s2 = BrowserWebSocketServer(':memory:', send_page_title=False)
assert s2._send_page_title == False
print('ws_server.py OK')
"</verify>
  <done>
    - `from zeno.monitor.ws_server import BrowserWebSocketServer, HOST, PORT` works.
    - `HOST == "localhost"` and `PORT == 8765`.
    - `BrowserWebSocketServer(":memory:")` constructs without error.
    - `BrowserWebSocketServer` has `start()` and `stop()` methods.
    - `send_page_title=False` constructor arg sets `_send_page_title = False`.
    - `_pending` is a `dict`.
    - Port constant has cross-reference comment to `background.js`.
  </done>
</task>

<task type="auto">
  <name>zeno/monitor/__init__.py — export ActivityMonitor and BrowserWebSocketServer</name>
  <files>
    zeno/monitor/__init__.py
  </files>
  <action>
    Update `zeno/monitor/__init__.py` to export both public classes:

    ```python
    """Monitor module — window detection, app tracking, and distraction analytics."""
    from zeno.monitor.activity import ActivityMonitor
    from zeno.monitor.ws_server import BrowserWebSocketServer

    __all__ = ["ActivityMonitor", "BrowserWebSocketServer"]
    ```

    This allows the daemon (Phase 9) to do a single import:
    ```python
    from zeno.monitor import ActivityMonitor, BrowserWebSocketServer
    ```
  </action>
  <verify>python -c "from zeno.monitor import ActivityMonitor, BrowserWebSocketServer; print('monitor __init__ OK — both classes exported')"</verify>
  <done>
    - `from zeno.monitor import ActivityMonitor, BrowserWebSocketServer` works without error.
    - Both names in `__all__`.
  </done>
</task>

## Success Criteria
- [ ] `from zeno.monitor.ws_server import BrowserWebSocketServer, HOST, PORT` works
- [ ] `PORT == 8765` and `HOST == "localhost"`
- [ ] Port constant has cross-reference comment to `zeno/extension/background.js`
- [ ] `BrowserWebSocketServer(":memory:")` constructs without error
- [ ] `BrowserWebSocketServer` has `start()` and `stop()` async methods
- [ ] `send_page_title=False` strips page titles before storage (domain-only mode)
- [ ] Excluded domains drop silently — no DB write
- [ ] `_write_session` runs via `run_in_executor` (non-blocking event loop)
- [ ] `from zeno.monitor import ActivityMonitor, BrowserWebSocketServer` works
