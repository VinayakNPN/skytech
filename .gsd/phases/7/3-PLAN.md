---
phase: 7
plan: 3
wave: 2
---

# Plan 7.3: Macro Engine Runtime & Dispatcher Wiring

## Objective
Assemble the macro subsystem into a working whole:

1. **`engine.py`** — `MacroEngine` runs workspaces in a **background thread** with a `threading.Event` for cancellation. Per-step TTS announcements fire in real time. Three-tier safety: warn+allow unknowns, hard-deny blacklisted. Logs to `system_events`.
2. **`handlers/workspaces.py`** — handlers for `setup_workspace`, `list_workspaces`, `stop_workspace`, and `register_workspace_app` (voice registration via `register_app()`).
3. **Dispatcher wiring** — 4 new entries in `HANDLER_MAP` in `router.py`.

Depends on Plan 7.1 (safety + loader) and Plan 7.2 (steps) being complete.

## Context
- `.gsd/SPEC.md` — R3 (workspace_* → Macro Engine), R6 (Macro Engine)
- `.gsd/DECISIONS.md` — Phase 7: Threading, Safety, Voice Registration
- `zeno/macros/safety.py` — `assert_app_allowed()`, `SafetyResult`, `register_app()`
- `zeno/macros/loader.py` — `get_workspace()`, `load_workspaces()`, `MacroStep`
- `zeno/macros/steps.py` — `execute_step()`, `STEP_EXECUTORS`
- `zeno/dispatcher/router.py` — `HANDLER_MAP` to extend
- `zeno/tts/worker.py` — `TTSWorker.enqueue()`, `TTSWorker.flush()`
- `zeno/nlp/intent_schema.py` — `ParsedIntent`
- `zeno_schema.sql` — `system_events` table

## Tasks

<task type="auto">
  <name>engine.py — MacroEngine with background thread, per-step TTS, cancellation</name>
  <files>
    zeno/macros/engine.py
    zeno/macros/__init__.py
  </files>
  <action>
    **`zeno/macros/engine.py`**:

    ```python
    import sqlite3, sys, threading
    from zeno.macros.loader import load_workspaces, get_workspace
    from zeno.macros.safety import assert_app_allowed, check_app_safety, MacroSafetyError
    from zeno.macros.steps import execute_step

    # Steps that target an app and need safety + pre-announce
    _APP_STEPS = {"open_app", "focus_window"}
    # Natural-language pre-announce templates per step type
    _STEP_ANNOUNCEMENTS = {
        "open_app":     lambda p: f"Opening {p.get('app_name', 'app')}…",
        "open_url":     lambda p: f"Loading {p.get('url', 'page')} in your browser…",
        "focus_window": lambda p: f"Switching to {p.get('app_name', 'window')}…",
    }

    class MacroEngine:
        def __init__(self, db_path: str, tts_worker=None, yaml_path: str | None = None) -> None:
            self._db_path = db_path
            self._tts_worker = tts_worker
            self._yaml_path = yaml_path
            self._cancel_event = threading.Event()
            self._active_thread: threading.Thread | None = None

        # ------------------------------------------------------------------
        # Public API
        # ------------------------------------------------------------------

        def run_workspace(self, workspace_name: str) -> str:
            """
            Start macro execution in a background thread.
            Returns immediately with a status message.
            """
            try:
                workspace = get_workspace(workspace_name, self._yaml_path, self._tts_worker)
            except KeyError as e:
                return str(e)

            if self._active_thread and self._active_thread.is_alive():
                return "A macro is already running. Say 'stop' to cancel it first."

            self._cancel_event.clear()
            self._active_thread = threading.Thread(
                target=self._run_steps,
                args=(workspace,),
                daemon=True,
                name=f"Macro-{workspace_name}",
            )
            self._active_thread.start()
            return f"Starting workspace '{workspace.name}'."

        def stop_workspace(self) -> str:
            """Cancel the running macro. Flushes pending TTS."""
            if not (self._active_thread and self._active_thread.is_alive()):
                return "No macro is currently running."
            self._cancel_event.set()
            if self._tts_worker:
                self._tts_worker.flush()
            return "Macro cancelled."

        def list_workspaces(self) -> list[str]:
            try:
                return list(load_workspaces(self._yaml_path, self._tts_worker).keys())
            except Exception as e:
                print(f"[MacroEngine] Error listing workspaces: {e}", file=sys.stderr)
                return []

        # ------------------------------------------------------------------
        # Background worker
        # ------------------------------------------------------------------

        def _run_steps(self, workspace) -> None:
            self._log_event("macro_started", f"Starting: {workspace.name}")
            ctx = {"tts_worker": self._tts_worker}

            for i, step in enumerate(workspace.steps):
                if self._cancel_event.is_set():
                    self._log_event("macro_cancelled", f"Cancelled at step {i+1}")
                    if self._tts_worker:
                        self._tts_worker.enqueue("Workspace setup cancelled.")
                    return

                # Three-tier safety for app-targeting steps
                if step.type in _APP_STEPS:
                    app_name = step.params.get("app_name", "")
                    if app_name:
                        result = check_app_safety(app_name, self._db_path)
                        if result.reason == "denied":
                            msg = f"Step {i+1} blocked: {result.message}"
                            self._log_event("macro_blocked", msg, severity="warning")
                            if self._tts_worker:
                                self._tts_worker.enqueue(result.message)
                            continue  # skip this step, continue macro
                        elif result.reason == "warn_unknown":
                            self._log_event("macro_warn_unknown", result.message, severity="warning")
                            if self._tts_worker:
                                self._tts_worker.enqueue(result.message)
                            # ALLOW — fall through to execution

                # Pre-step TTS announcement for navigating steps
                if step.type in _STEP_ANNOUNCEMENTS and self._tts_worker:
                    self._tts_worker.enqueue(_STEP_ANNOUNCEMENTS[step.type](step.params))

                # Execute step
                try:
                    execute_step(step.type, step.params, **ctx)
                except Exception as e:
                    msg = f"Step {i+1} ({step.type}) error: {e}"
                    print(f"[MacroEngine] {msg}", file=sys.stderr)
                    self._log_event("macro_error", msg, severity="error")
                    # Continue remaining steps — one failure does not abort

            self._log_event("macro_complete", f"Done: {workspace.name}")
            if self._tts_worker:
                self._tts_worker.enqueue(f"Workspace '{workspace.name}' is ready.")

        def _log_event(self, event_type: str, message: str, severity: str = "info") -> None:
            try:
                with sqlite3.connect(self._db_path) as conn:
                    conn.execute(
                        "INSERT INTO system_events (event_type, severity, component, message) "
                        "VALUES (?, ?, 'macro_engine', ?)",
                        (event_type, severity, message)
                    )
            except Exception:
                pass  # logging failures are non-fatal
    ```

    **`zeno/macros/__init__.py`**:
    ```python
    """Macros module — workspace macro definitions and execution engine."""
    from zeno.macros.engine import MacroEngine
    __all__ = ["MacroEngine"]
    ```

    Avoid: calling `get_workspace()` inside `_run_steps()` (do it before starting thread so bad workspace names fail immediately). Avoid: joining the thread in `run_workspace()` — it must return immediately.
  </action>
  <verify>python -c "from zeno.macros import MacroEngine; e = MacroEngine(db_path=':memory:'); print(e.list_workspaces()); print('engine.py OK')"</verify>
  <done>
    - `from zeno.macros import MacroEngine` works.
    - `MacroEngine` has `run_workspace()`, `stop_workspace()`, `list_workspaces()`.
    - `run_workspace("nonexistent")` returns a `str` error message immediately (no exception).
    - `stop_workspace()` with no running macro returns `"No macro is currently running."`.
    - `_cancel_event` is a `threading.Event`.
  </done>
</task>

<task type="auto">
  <name>handlers/workspaces.py + dispatcher wiring (4 workspace_* intents)</name>
  <files>
    zeno/handlers/workspaces.py
    zeno/dispatcher/router.py
  </files>
  <action>
    **1. `zeno/handlers/workspaces.py`** — four handler functions.

    All handlers follow existing signature: `handler(intent: ParsedIntent, conn: sqlite3.Connection) -> str`.

    Helper to get db_path and build engine:
    ```python
    def _get_db_path(conn: sqlite3.Connection) -> str:
        row = conn.execute("PRAGMA database_list").fetchone()
        return row[2] if row else ":memory:"
    ```
    Note: do NOT pass `tts_worker` into `MacroEngine` here — the handler has no access to the daemon-level `tts_worker`. The engine will run without TTS announce in this path. TTS announce is available when the engine is constructed by the daemon directly. This is acceptable for Phase 7 — daemon integration is Phase 9.

    ```python
    import sqlite3
    from zeno.nlp.intent_schema import ParsedIntent
    from zeno.macros.engine import MacroEngine
    from zeno.macros.safety import register_app

    def _get_db_path(conn: sqlite3.Connection) -> str:
        row = conn.execute("PRAGMA database_list").fetchone()
        return row[2] if row else ":memory:"

    def handle_setup_workspace(intent: ParsedIntent, conn: sqlite3.Connection) -> str:
        """Intent: setup_workspace — slot: workspace_name"""
        name = intent.slots.get("workspace_name")
        if not name:
            return "Which workspace? Say 'set up coding' or 'list workspaces' to see options."
        engine = MacroEngine(db_path=_get_db_path(conn))
        return engine.run_workspace(str(name))

    def handle_list_workspaces(intent: ParsedIntent, conn: sqlite3.Connection) -> str:
        """Intent: list_workspaces — no slots needed"""
        engine = MacroEngine(db_path=_get_db_path(conn))
        names = engine.list_workspaces()
        if not names:
            return "No workspaces configured. Edit ~/Zeno/workspaces.yaml to add some."
        return "Available workspaces: " + ", ".join(names) + "."

    def handle_stop_workspace(intent: ParsedIntent, conn: sqlite3.Connection) -> str:
        """Intent: stop_workspace — cancels running macro"""
        # MacroEngine holds _cancel_event per-instance; daemon must pass its singleton engine.
        # Via dispatcher, we can't reach the running instance — acknowledge limitation.
        return "To stop a macro, I need to be running it from my main session. This will be fully wired in Phase 9."

    def handle_register_workspace_app(intent: ParsedIntent, conn: sqlite3.Connection) -> str:
        """Intent: register_workspace_app — slot: app_name"""
        app_name = intent.slots.get("app_name")
        if not app_name:
            return "Which app would you like to allow in macros?"
        db_path = _get_db_path(conn)
        try:
            register_app(str(app_name), db_path, is_work_app=True, user_override=True)
            return f"Done. '{app_name}' is now allowed in workspace macros."
        except Exception as e:
            return f"I couldn't register '{app_name}': {e}"
    ```

    **2. `zeno/dispatcher/router.py`** — add 4 entries to `HANDLER_MAP`.

    Add import alongside existing handler imports:
    ```python
    from zeno.handlers import workspaces
    ```

    Add to `HANDLER_MAP` dict (append only — do NOT modify existing entries):
    ```python
    "setup_workspace":          workspaces.handle_setup_workspace,
    "list_workspaces":          workspaces.handle_list_workspaces,
    "stop_workspace":           workspaces.handle_stop_workspace,
    "register_workspace_app":   workspaces.handle_register_workspace_app,
    ```

    Avoid: constructing `MacroEngine` at module import time.
  </action>
  <verify>python -c "from zeno.dispatcher.router import HANDLER_MAP; assert all(k in HANDLER_MAP for k in ['setup_workspace','list_workspaces','stop_workspace','register_workspace_app']); print('Dispatcher wired OK, 4 workspace intents')"</verify>
  <done>
    - `from zeno.handlers.workspaces import handle_setup_workspace, handle_list_workspaces, handle_stop_workspace, handle_register_workspace_app` works.
    - All 4 intent keys present in `HANDLER_MAP`.
    - Existing `HANDLER_MAP` entries (add_task, complete_task, etc.) are unchanged.
    - `from zeno.dispatcher.router import dispatch` works without error.
  </done>
</task>

## Success Criteria
- [ ] `from zeno.macros import MacroEngine` works cleanly
- [ ] `MacroEngine` has `run_workspace()`, `stop_workspace()`, `list_workspaces()`
- [ ] `run_workspace("bad_name")` returns a string (no exception)
- [ ] `MacroEngine._cancel_event` is a `threading.Event`
- [ ] Per-step TTS announcements for `open_app`, `open_url`, `focus_window`
- [ ] Unknown app: warn + allow (log), hard-denied app: skip step + announce, macro continues
- [ ] All 4 intent keys in `HANDLER_MAP`: `setup_workspace`, `list_workspaces`, `stop_workspace`, `register_workspace_app`
- [ ] Existing dispatcher entries unchanged
- [ ] `handle_register_workspace_app` calls `register_app()` with `user_override=True`
