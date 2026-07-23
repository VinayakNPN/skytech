---
phase: 9
plan: 1
wave: 1
---

# Plan 9.1: Toolchain Check, FastAPI Daemon Server & Logging Setup

## Objective
Lay the infrastructure foundation before any UI code is written:

1. **Prerequisite check** — verify `cargo`, `node`, `npm`, `rustup` are installed. Fail fast with install URLs if missing.
2. **FastAPI server** — add `fastapi` + `uvicorn` to `requirements.txt`; create `zeno/api/server.py` that starts a FastAPI app on `localhost:8766` in a background thread alongside the existing daemon. Exposes initial routes:
   - `GET /system` — CPU %, GPU %, RAM, battery, network (via `psutil`)
   - `GET /tasks` — today's tasks from `v_todays_tasks`
   - `GET /briefing` — today's session file content
   - `GET /analytics` — 7-day activity breakdown from `activity_log`
   - `GET /settings` — `user_profile` row
   - `POST /daemon/focus` — toggle `focus_mode` flag (in-memory state)
   - `POST /daemon/tts/mute` — toggle TTS mute flag (in-memory state)
   - `POST /daemon/shutdown` — flush DB, set stop event
3. **Logging setup** — `zeno/logging_setup.py` configures `RotatingFileHandler` (5MB × 3 backups) at `~/Zeno/logs/zeno.log`. Called once from `zeno/__main__.py` before anything else starts.
4. **WebSocket broadcast** — add `broadcast(payload: dict)` + `connected_clients` registry to `BrowserWebSocketServer`; update `HotkeyListener` to push `{"type":"overlay_show"}` on `Ctrl+Shift+Space`.

## Context
- `.gsd/SPEC.md` — R3, R7, R8, R11: action dispatcher, TTS, monitor, scheduler
- `.gsd/DECISIONS.md` — Phase 9: FastAPI port 8766, RotatingFileHandler 5MB×3, broadcast pattern, pythonw startup
- `zeno/monitor/ws_server.py` — `BrowserWebSocketServer` class to extend with `broadcast()` and `connected_clients`
- `zeno/voice/hotkeys.py` — `HotkeyListener._on_brain_dump()` needs WebSocket push
- `requirements.txt` — add `fastapi[standard]>=0.115`, `uvicorn[standard]>=0.30`
- `zeno/__main__.py` — entrypoint that starts all subsystems

## Tasks

<task type="auto">
  <name>Prerequisite check script + logging setup + requirements update</name>
  <files>
    scripts/check_prereqs.py
    zeno/logging_setup.py
    requirements.txt
    zeno/__main__.py
  </files>
  <action>
    **`scripts/check_prereqs.py`** — run before any Tauri/npm work:
    ```python
    #!/usr/bin/env python3
    """
    Run this before /execute 9 to verify the full toolchain is present.
    Usage: python scripts/check_prereqs.py
    """
    import subprocess, sys

    CHECKS = [
        ("cargo",   ["cargo", "--version"],   "https://rustup.rs/"),
        ("rustup",  ["rustup", "--version"],  "https://rustup.rs/"),
        ("node",    ["node", "--version"],    "https://nodejs.org/"),
        ("npm",     ["npm", "--version"],     "https://nodejs.org/"),
    ]

    RUST_TARGET = "x86_64-pc-windows-msvc"

    def run(cmd: list[str]) -> str | None:
        try:
            return subprocess.check_output(cmd, stderr=subprocess.STDOUT, text=True).strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            return None

    ok = True
    print("ZENO Phase 9 — Toolchain Prerequisites\n" + "─" * 40)
    for name, cmd, url in CHECKS:
        result = run(cmd)
        if result:
            print(f"  ✓ {name:8s}  {result}")
        else:
            print(f"  ✗ {name:8s}  NOT FOUND  →  Install from: {url}")
            ok = False

    # Check Rust Windows target
    targets = run(["rustup", "target", "list", "--installed"]) or ""
    if RUST_TARGET in targets:
        print(f"  ✓ rust target  {RUST_TARGET}")
    else:
        print(f"  ✗ rust target  {RUST_TARGET} missing")
        print(f"    Fix: rustup target add {RUST_TARGET}")
        ok = False

    print()
    if ok:
        print("All prerequisites satisfied. Proceed with /execute 9.")
        sys.exit(0)
    else:
        print("Fix the above before executing Phase 9.")
        sys.exit(1)
    ```

    ---

    **`zeno/logging_setup.py`:**
    ```python
    """
    Configure rotating file logging for the ZENO daemon.

    Call configure_logging() once, before any other import in __main__.py.
    All modules then use logging.getLogger(__name__) as usual.
    """
    import logging
    import logging.handlers
    import os
    from pathlib import Path


    def configure_logging(debug: bool = False) -> None:
        """
        Sets up:
          - RotatingFileHandler → ~/Zeno/logs/zeno.log (5MB × 3 backups)
          - StreamHandler (stderr) for errors only when not using pythonw

        After calling this, monitor logs with:
          Get-Content -Path "$env:USERPROFILE\\Zeno\\logs\\zeno.log" -Wait
        """
        log_dir = Path.home() / "Zeno" / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / "zeno.log"

        level = logging.DEBUG if debug else logging.INFO

        file_handler = logging.handlers.RotatingFileHandler(
            log_path,
            maxBytes=5 * 1024 * 1024,   # 5 MB per file
            backupCount=3,
            encoding="utf-8",
        )
        file_handler.setFormatter(logging.Formatter(
            "%(asctime)s %(levelname)-8s %(name)s — %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        ))

        # Console handler: warnings+ (suppressed under pythonw since stderr is /dev/null)
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.WARNING)
        console_handler.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))

        root = logging.getLogger()
        root.setLevel(level)
        root.addHandler(file_handler)
        root.addHandler(console_handler)

        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)  # suppress noisy uvicorn access logs
        logging.info("ZENO daemon starting. Log: %s", log_path)
    ```

    ---

    **`requirements.txt`** — add FastAPI + uvicorn:
    Append to the existing file:
    ```
    fastapi[standard]>=0.115
    uvicorn[standard]>=0.30
    ```

    ---

    **`zeno/__main__.py`** — add `configure_logging()` as the very first call, before any other imports execute subsystem code:

    Read the existing `__main__.py`, then prepend the logging setup call:
    ```python
    # zeno/__main__.py — add at top, before other zeno imports
    from zeno.logging_setup import configure_logging
    import os
    configure_logging(debug=os.environ.get("ZENO_DEBUG", "").lower() in ("1", "true"))
    ```

    Do not restructure the rest of `__main__.py` — only prepend these 3 lines.

    Avoid: calling `configure_logging()` from any module other than `__main__.py`. Avoid: changing log levels in individual modules — use the root logger.
  </action>
  <verify>python scripts/check_prereqs.py</verify>
  <done>
    - `scripts/check_prereqs.py` exists and exits 0 when all tools present, exits 1 otherwise.
    - `zeno/logging_setup.py` exists with `configure_logging(debug=False)`.
    - `RotatingFileHandler` configured: 5MB max, 3 backups, path `~/Zeno/logs/zeno.log`.
    - `requirements.txt` contains `fastapi[standard]` and `uvicorn[standard]`.
    - `zeno/__main__.py` calls `configure_logging()` before any other subsystem import.
  </done>
</task>

<task type="auto">
  <name>FastAPI server (zeno/api/server.py) + WebSocket broadcast + hotkeys overlay bridge</name>
  <files>
    zeno/api/__init__.py
    zeno/api/server.py
    zeno/monitor/ws_server.py
    zeno/voice/hotkeys.py
  </files>
  <action>
    **`zeno/api/__init__.py`:**
    ```python
    """ZENO FastAPI HTTP server — dashboard data and daemon control endpoints."""
    from zeno.api.server import ZenoDaemonAPI
    __all__ = ["ZenoDaemonAPI"]
    ```

    ---

    **`zeno/api/server.py`:**
    ```python
    """
    FastAPI server running on http://localhost:8766.
    Started in a daemon thread alongside the Python voice/NLP pipeline.

    React frontend fetches all dashboard data from this server.
    Rust (Tauri) IPC is limited to window management — no DB reads in Rust.

    Live monitoring:
        Get-Content -Path "$env:USERPROFILE\\Zeno\\logs\\zeno.log" -Wait
    """
    import logging
    import sqlite3
    import threading
    from pathlib import Path

    import psutil
    import uvicorn
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware

    logger = logging.getLogger(__name__)

    HOST = "127.0.0.1"
    PORT = 8766  # HTTP API port. WebSocket browser-extension is on 8765.

    app = FastAPI(title="ZENO Daemon API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],         # Tauri webview origin is app://localhost or http://localhost:*
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---------------------------------------------------------------------------
    # In-memory daemon state flags (toggled by tray menu)
    # ---------------------------------------------------------------------------
    _state: dict = {
        "focus_mode": False,
        "tts_muted": False,
        "db_path": "",
        "stop_event": None,        # set by ZenoDaemonAPI.start(); checked by /daemon/shutdown
    }


    def _db(db_path: str) -> sqlite3.Connection:
        conn = sqlite3.connect(db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn


    # ---------------------------------------------------------------------------
    # /system — real-time Windows metrics via psutil
    # ---------------------------------------------------------------------------
    @app.get("/system")
    def get_system():
        cpu = psutil.cpu_percent(interval=0.2)

        mem = psutil.virtual_memory()
        ram_used_gb = round(mem.used / (1024 ** 3), 1)
        ram_total_gb = round(mem.total / (1024 ** 3), 1)

        battery = psutil.sensors_battery()
        battery_pct = round(battery.percent) if battery else None
        battery_plugged = battery.power_plugged if battery else None

        net = psutil.net_io_counters()
        # Single snapshot — caller can diff against previous call for speed
        net_bytes_sent = net.bytes_sent
        net_bytes_recv = net.bytes_recv

        # GPU: psutil doesn't support GPU natively; attempt via WMI on Windows
        gpu_pct = None
        try:
            import subprocess
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=1
            )
            if result.returncode == 0:
                gpu_pct = int(result.stdout.strip().split()[0])
        except Exception:
            pass  # No GPU or nvidia-smi not present — returns null in response

        return {
            "cpu_percent": cpu,
            "ram_used_gb": ram_used_gb,
            "ram_total_gb": ram_total_gb,
            "ram_percent": round(mem.percent),
            "battery_percent": battery_pct,
            "battery_plugged": battery_plugged,
            "gpu_percent": gpu_pct,
            "net_bytes_sent": net_bytes_sent,
            "net_bytes_recv": net_bytes_recv,
            "focus_mode": _state["focus_mode"],
            "tts_muted": _state["tts_muted"],
        }


    # ---------------------------------------------------------------------------
    # /tasks — today's tasks
    # ---------------------------------------------------------------------------
    @app.get("/tasks")
    def get_tasks():
        db_path = _state["db_path"]
        if not db_path:
            return {"tasks": []}
        try:
            with _db(db_path) as conn:
                rows = conn.execute(
                    "SELECT id, title, priority, status, due_date FROM v_todays_tasks "
                    "ORDER BY priority DESC, due_date ASC"
                ).fetchall()
            return {"tasks": [dict(r) for r in rows]}
        except Exception as e:
            logger.error("get_tasks error: %s", e)
            return {"tasks": [], "error": str(e)}


    # ---------------------------------------------------------------------------
    # /briefing — today's session file
    # ---------------------------------------------------------------------------
    @app.get("/briefing")
    def get_briefing():
        db_path = _state["db_path"]
        zeno_dir = Path(db_path).parent if db_path else Path.home() / "Zeno"
        from datetime import date
        today = date.today().isoformat()
        session_path = zeno_dir / "sessions" / f"{today}.md"
        content = session_path.read_text(encoding="utf-8") if session_path.exists() else ""
        return {"date": today, "content": content, "path": str(session_path)}


    # ---------------------------------------------------------------------------
    # /analytics — 7-day activity breakdown
    # ---------------------------------------------------------------------------
    @app.get("/analytics")
    def get_analytics():
        db_path = _state["db_path"]
        if not db_path:
            return {"analytics": []}
        try:
            with _db(db_path) as conn:
                rows = conn.execute("""
                    SELECT
                        date(sampled_at) AS day,
                        COUNT(*) * 30 / 60      AS total_minutes,
                        SUM(CASE WHEN input_level IN ('heavy','moderate') AND is_off_task=0
                            THEN 30 ELSE 0 END) / 60 AS deep_work_minutes,
                        SUM(CASE WHEN is_off_task=1 THEN 30 ELSE 0 END) / 60 AS distraction_minutes,
                        SUM(CASE WHEN input_level='idle' THEN 30 ELSE 0 END) / 60 AS idle_minutes
                    FROM activity_log
                    WHERE sampled_at >= date('now','-7 days')
                    GROUP BY day
                    ORDER BY day ASC
                """).fetchall()
            return {"analytics": [dict(r) for r in rows]}
        except Exception as e:
            logger.error("get_analytics error: %s", e)
            return {"analytics": [], "error": str(e)}


    # ---------------------------------------------------------------------------
    # /settings — user_profile row
    # ---------------------------------------------------------------------------
    @app.get("/settings")
    def get_settings():
        db_path = _state["db_path"]
        if not db_path:
            return {"settings": {}}
        try:
            with _db(db_path) as conn:
                row = conn.execute(
                    "SELECT user_name, wake_word, tts_engine, stt_model, claude_model, "
                    "working_hours_start, working_hours_end, timezone FROM user_profile LIMIT 1"
                ).fetchone()
            return {"settings": dict(row) if row else {}}
        except Exception as e:
            logger.error("get_settings error: %s", e)
            return {"settings": {}, "error": str(e)}


    # ---------------------------------------------------------------------------
    # Daemon control endpoints (called by Tauri tray menu via HTTP POST)
    # ---------------------------------------------------------------------------
    @app.post("/daemon/focus")
    def toggle_focus():
        _state["focus_mode"] = not _state["focus_mode"]
        mode = "ON" if _state["focus_mode"] else "OFF"
        logger.info("Focus mode toggled: %s", mode)
        return {"focus_mode": _state["focus_mode"], "label": f"Focus Mode: {mode}"}


    @app.post("/daemon/tts/mute")
    def toggle_tts_mute():
        _state["tts_muted"] = not _state["tts_muted"]
        state = "MUTED" if _state["tts_muted"] else "ACTIVE"
        logger.info("TTS %s", state)
        return {"tts_muted": _state["tts_muted"], "label": f"Voice: {state}"}


    @app.post("/daemon/shutdown")
    def shutdown_daemon():
        logger.info("Shutdown requested via API.")
        stop_event = _state.get("stop_event")
        if stop_event is not None:
            stop_event.set()
        return {"status": "shutting_down"}


    # ---------------------------------------------------------------------------
    # ZenoDaemonAPI — thread wrapper called from __main__.py
    # ---------------------------------------------------------------------------
    class ZenoDaemonAPI:
        """
        Wraps the FastAPI/uvicorn server in a daemon thread.

        Usage in __main__.py:
            api = ZenoDaemonAPI(db_path=db_path, stop_event=stop_event)
            api.start()
        """

        def __init__(self, db_path: str, stop_event: threading.Event) -> None:
            _state["db_path"] = db_path
            _state["stop_event"] = stop_event
            self._thread = threading.Thread(
                target=self._run, daemon=True, name="ZenoDaemonAPI"
            )

        def start(self) -> None:
            self._thread.start()
            logger.info("ZENO API server starting on http://%s:%d", HOST, PORT)

        def _run(self) -> None:
            config = uvicorn.Config(
                app,
                host=HOST,
                port=PORT,
                log_level="warning",   # suppress uvicorn access spam; use zeno logger for app logs
                loop="asyncio",
            )
            server = uvicorn.Server(config)
            server.run()
    ```

    ---

    **`zeno/monitor/ws_server.py`** — add `connected_clients` registry + `broadcast()` method:

    In the existing file, make these targeted additions:

    1. Add `connected_clients: set` to `__init__`:
    ```python
    self._pending: dict[str, dict] = {}
    self.connected_clients: set = set()  # ADD: tracks all active WebSocket connections
    ```

    2. Update `_handle()` to register/deregister connections:
    ```python
    async def _handle(self, ws) -> None:
        """Handle one WebSocket connection (browser extension OR React frontend)."""
        self.connected_clients.add(ws)       # ADD
        try:                                 # ADD
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
        finally:                             # ADD
            self.connected_clients.discard(ws)  # ADD
    ```

    3. Add `broadcast()` method after `_handle()`:
    ```python
    async def broadcast(self, payload: dict) -> None:
        """
        Push a JSON message to ALL connected WebSocket clients
        (browser extension connections + React frontend connections).

        Called from non-async context via:
            asyncio.run_coroutine_threadsafe(ws_server.broadcast(payload), loop)
        """
        if not self.connected_clients:
            return
        message = json.dumps(payload)
        # Iterate over a snapshot to avoid mutation during iteration
        for ws in list(self.connected_clients):
            try:
                await ws.send(message)
            except Exception:
                self.connected_clients.discard(ws)
    ```

    ---

    **`zeno/voice/hotkeys.py`** — add overlay broadcast on `Ctrl+Shift+Space`:

    Update `__init__` signature and `_on_brain_dump`:
    ```python
    import asyncio                      # ADD at top
    # ...existing imports...

    class HotkeyListener:
        def __init__(
            self,
            state: HotkeyState | None = None,
            ws_server=None,             # ADD: optional BrowserWebSocketServer reference
            event_loop=None,            # ADD: asyncio loop running the WS server
        ):
            self.state = state if state is not None else HotkeyState()
            self._ws_server = ws_server         # ADD
            self._event_loop = event_loop       # ADD
            self._listener: pynput.keyboard.GlobalHotKeys | None = None
            self._stop_event = threading.Event()

        def _on_brain_dump(self) -> None:
            try:
                self.state.brain_dump_triggered.set()
                def clear_flag():
                    time.sleep(0.1)
                    self.state.brain_dump_triggered.clear()
                threading.Thread(target=clear_flag, daemon=True).start()

                # ADD: broadcast overlay_show to React frontend via WebSocket
                if self._ws_server is not None and self._event_loop is not None:
                    asyncio.run_coroutine_threadsafe(
                        self._ws_server.broadcast({"type": "overlay_show"}),
                        self._event_loop,
                    )
            except Exception as e:
                print(f"Error in brain dump hotkey: {e}", file=sys.stderr)
    ```

    Update `create_listener()` factory to accept the new params:
    ```python
    def create_listener(
        state: HotkeyState | None = None,
        ws_server=None,
        event_loop=None,
    ) -> HotkeyListener:
        return HotkeyListener(state=state, ws_server=ws_server, event_loop=event_loop)
    ```

    Avoid: importing `BrowserWebSocketServer` in `hotkeys.py` (circular import risk — accept it as a plain object). Avoid: blocking on the broadcast inside `_on_brain_dump`.
  </action>
  <verify>python -c "
from zeno.api.server import ZenoDaemonAPI, app, _state
from zeno.logging_setup import configure_logging
from zeno.monitor.ws_server import BrowserWebSocketServer
from zeno.voice.hotkeys import HotkeyListener, create_listener
import inspect

# FastAPI routes
routes = {r.path for r in app.routes}
for required in ['/system', '/tasks', '/briefing', '/analytics', '/settings',
                 '/daemon/focus', '/daemon/tts/mute', '/daemon/shutdown']:
    assert required in routes, f'Missing route: {required}'

# broadcast exists
assert hasattr(BrowserWebSocketServer(':memory:', True), 'broadcast'), 'broadcast missing'
assert hasattr(BrowserWebSocketServer(':memory:', True), 'connected_clients'), 'connected_clients missing'

# HotkeyListener accepts ws_server param
sig = inspect.signature(HotkeyListener.__init__)
assert 'ws_server' in sig.parameters, 'ws_server param missing from HotkeyListener'
assert 'event_loop' in sig.parameters, 'event_loop param missing from HotkeyListener'

print('Plan 9.1 PASS')
"</verify>
  <done>
    - `scripts/check_prereqs.py` exits 0 when toolchain present, exits 1 with install URLs otherwise.
    - `zeno/logging_setup.py` has `configure_logging(debug)` with `RotatingFileHandler(maxBytes=5*1024*1024, backupCount=3)`.
    - `requirements.txt` contains `fastapi[standard]` and `uvicorn[standard]`.
    - `zeno/api/server.py` has `ZenoDaemonAPI` class and all 8 FastAPI routes.
    - All 8 routes: `/system`, `/tasks`, `/briefing`, `/analytics`, `/settings`, `/daemon/focus`, `/daemon/tts/mute`, `/daemon/shutdown`.
    - `/system` returns real `psutil` data: `cpu_percent`, `ram_used_gb`, `ram_total_gb`, `battery_percent`, `gpu_percent`, `net_bytes_sent`, `net_bytes_recv`.
    - `BrowserWebSocketServer` has `connected_clients: set` attribute and `broadcast(payload)` coroutine.
    - `HotkeyListener.__init__` accepts `ws_server` and `event_loop` parameters.
    - `_on_brain_dump()` calls `asyncio.run_coroutine_threadsafe(ws_server.broadcast({"type":"overlay_show"}), loop)`.
  </done>
</task>

## Success Criteria
- [ ] `python scripts/check_prereqs.py` exits 0 on a complete toolchain, exits 1 with URLs otherwise
- [ ] `~/Zeno/logs/zeno.log` created on daemon start; rotates at 5MB with 3 backups
- [ ] `requirements.txt` contains `fastapi[standard]` and `uvicorn[standard]`
- [ ] `GET http://localhost:8766/system` returns `cpu_percent`, `ram_used_gb`, `battery_percent`, `net_bytes_sent`
- [ ] `GET http://localhost:8766/tasks` returns `{"tasks": [...]}`
- [ ] `GET http://localhost:8766/analytics` returns `{"analytics": [...]}`
- [ ] `POST http://localhost:8766/daemon/focus` toggles focus mode and returns updated label
- [ ] `POST http://localhost:8766/daemon/tts/mute` toggles TTS mute and returns updated label
- [ ] `POST http://localhost:8766/daemon/shutdown` sets the daemon stop event
- [ ] `BrowserWebSocketServer` has `connected_clients` set and `broadcast()` coroutine
- [ ] `Ctrl+Shift+Space` triggers `{"type":"overlay_show"}` broadcast to all WebSocket clients
