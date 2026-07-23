---
phase: 7
plan: 1
wave: 1
---

# Plan 7.1: Macro Safety Enforcer & Workspace Loader

## Objective
Build the two foundational, side-effect-free components of the macro subsystem:

1. **`safety.py`** — three-tier whitelist logic against `app_classifications`:
   - Unknown (not in DB) → **warn + allow**, prompt user to register
   - In DB with `is_work_app=1` OR `user_override=1` → **allow silently**
   - In DB with `is_work_app=0` AND `user_override=0` → **hard deny** (raises `MacroSafetyError`)

2. **`loader.py`** — parses `workspaces.yaml` into typed dataclasses. Auto-creates `~/Zeno/workspaces.yaml` from the bundled template at first run (announces via TTS). Fails loudly only on malformed YAML (user error), never on a missing file.

## Context
- `.gsd/SPEC.md` — R6 (Macro Engine), safety constraint
- `.gsd/DECISIONS.md` — Phase 7: Safety Whitelist Strictness, workspaces.yaml Bootstrap
- `zeno_schema.sql` — Section 13: `app_classifications` (`app_name`, `is_work_app`, `user_override`)
- `zeno/db.py` — `db_session()` context manager

## Tasks

<task type="auto">
  <name>safety.py — three-tier whitelist enforcer</name>
  <files>
    zeno/macros/safety.py
  </files>
  <action>
    Create `zeno/macros/safety.py` with the following:

    **`MacroSafetyError(Exception)`** — raised only on hard-deny.

    **`SafetyResult`** as a named tuple or dataclass:
    ```python
    from typing import NamedTuple
    class SafetyResult(NamedTuple):
        allowed: bool
        reason: str   # "allowed", "warn_unknown", "denied"
        message: str  # human-readable for TTS prompt
    ```

    **`check_app_safety(app_name: str, db_path: str) -> SafetyResult`**:
    ```python
    with sqlite3.connect(db_path) as conn:
        row = conn.execute(
            "SELECT is_work_app, user_override FROM app_classifications "
            "WHERE app_name = ? COLLATE NOCASE LIMIT 1",
            (app_name,)
        ).fetchone()

    if row is None:
        # Unknown — warn and allow
        return SafetyResult(
            allowed=True,
            reason="warn_unknown",
            message=f"'{app_name}' isn't in my app registry. I'll open it anyway — say 'Allow {app_name} in macros' to register it."
        )
    is_work, override = row
    if override == 1 or is_work == 1:
        return SafetyResult(allowed=True, reason="allowed", message="")
    # Explicitly non-work, no override → hard deny
    return SafetyResult(
        allowed=False,
        reason="denied",
        message=f"'{app_name}' is classified as a non-work app and is blocked from macros. Say 'Allow {app_name} in macros' to override."
    )
    ```
    Wrap entire body in `try/except sqlite3.Error` → log to stderr, return `SafetyResult(True, "warn_unknown", "DB error, proceeding anyway")`.

    **`assert_app_allowed(app_name: str, db_path: str) -> SafetyResult`**:
    - Calls `check_app_safety`.
    - If `result.reason == "denied"`: raise `MacroSafetyError(result.message)`.
    - Always returns the `SafetyResult` (callers use `result.reason == "warn_unknown"` to decide whether to announce the warning).

    **`register_app(app_name: str, db_path: str, is_work_app: bool = True, user_override: bool = False) -> None`**:
    - `INSERT OR IGNORE INTO app_classifications (app_name, category, is_work_app, user_override) VALUES (?, 'utility', ?, ?)`
    - Then `UPDATE app_classifications SET is_work_app=?, user_override=?, confidence=1.0 WHERE app_name=? COLLATE NOCASE`
    - Commit. This makes voice registration (`user_override=True`) take immediate effect.

    Avoid: any shell execution. Avoid: in-memory caching of whitelist results.
  </action>
  <verify>python -c "from zeno.macros.safety import check_app_safety, assert_app_allowed, register_app, MacroSafetyError, SafetyResult; print('safety.py OK')"</verify>
  <done>
    - All names import cleanly.
    - `check_app_safety("NotInDB", ":memory:")` returns `SafetyResult(allowed=True, reason="warn_unknown", ...)`.
    - `MacroSafetyError` is a subclass of `Exception`.
    - `SafetyResult` is a NamedTuple with `allowed`, `reason`, `message` fields.
  </done>
</task>

<task type="auto">
  <name>loader.py — workspace YAML parser with auto-create bootstrap and TTS announce</name>
  <files>
    zeno/macros/loader.py
    workspaces.yaml
  </files>
  <action>
    **1. Create `workspaces.yaml`** at project root (bundled template):

    ```yaml
    # ZENO Workspace Definitions
    # Each workspace is a named sequence of steps executed by the Macro Engine.
    # Supported step types: open_app, open_url, focus_window, arrange_windows,
    #                        toggle_dnd, announce, wait_ms

    workspaces:
      coding:
        name: "Coding Setup"
        description: "Open VS Code, terminal, and browser for development"
        steps:
          - type: announce
            message: "Setting up your coding workspace."
          - type: open_app
            app_name: "Code"
          - type: wait_ms
            duration: 1500
          - type: open_url
            url: "https://github.com"
          - type: toggle_dnd
            enabled: true
          - type: arrange_windows
            layout: "maximise_first"
            apps: ["Code"]

      writing:
        name: "Writing Setup"
        description: "Open Notion and enable DND for focused writing"
        steps:
          - type: announce
            message: "Setting up your writing workspace."
          - type: open_app
            app_name: "Notion"
          - type: toggle_dnd
            enabled: true
    ```

    **2. Create `zeno/macros/loader.py`**:

    ```python
    from __future__ import annotations
    from dataclasses import dataclass, field
    from pathlib import Path
    from typing import Any
    import shutil, sys
    import yaml

    VALID_STEP_TYPES = frozenset({
        "open_app", "open_url", "focus_window",
        "arrange_windows", "toggle_dnd", "announce", "wait_ms",
    })

    # Path to the bundled template (same directory as this module's package root)
    _TEMPLATE_PATH = Path(__file__).parent.parent.parent / "workspaces.yaml"

    @dataclass
    class MacroStep:
        type: str
        params: dict[str, Any] = field(default_factory=dict)

    @dataclass
    class Workspace:
        id: str
        name: str
        description: str
        steps: list[MacroStep]

    def _default_yaml_path() -> Path:
        return Path.home() / "Zeno" / "workspaces.yaml"

    def load_workspaces(
        yaml_path: str | None = None,
        tts_worker=None,
    ) -> dict[str, Workspace]:
        """
        Parse workspaces.yaml into a dict of Workspace objects.

        Bootstrap behaviour:
        - If file missing: auto-create from bundled template, announce via TTS.
        - If file exists but is malformed YAML: raise ValueError (user error).
        - Never raises on missing file.
        """
        path = Path(yaml_path) if yaml_path else _default_yaml_path()

        if not path.exists():
            # First-run bootstrap
            path.parent.mkdir(parents=True, exist_ok=True)
            if _TEMPLATE_PATH.exists():
                shutil.copy(_TEMPLATE_PATH, path)
            else:
                # Fallback: write minimal template inline
                path.write_text(_MINIMAL_TEMPLATE, encoding="utf-8")
            msg = f"I've created a default workspaces file at {path} — you can customise it anytime."
            if tts_worker is not None:
                tts_worker.enqueue(msg)
            else:
                print(f"[Loader] {msg}")

        try:
            raw = path.read_text(encoding="utf-8")
            data = yaml.safe_load(raw) or {}
        except yaml.YAMLError as e:
            raise ValueError(f"workspaces.yaml is malformed: {e}") from e

        workspaces: dict[str, Workspace] = {}
        for ws_id, ws_data in (data.get("workspaces") or {}).items():
            steps = []
            for raw_step in (ws_data.get("steps") or []):
                step_type = raw_step.get("type", "")
                if step_type not in VALID_STEP_TYPES:
                    raise ValueError(f"Unknown step type '{step_type}' in workspace '{ws_id}'")
                params = {k: v for k, v in raw_step.items() if k != "type"}
                steps.append(MacroStep(type=step_type, params=params))
            workspaces[ws_id] = Workspace(
                id=ws_id,
                name=ws_data.get("name", ws_id),
                description=ws_data.get("description", ""),
                steps=steps,
            )
        return workspaces

    def get_workspace(name: str, yaml_path: str | None = None, tts_worker=None) -> Workspace:
        workspaces = load_workspaces(yaml_path, tts_worker=tts_worker)
        if name not in workspaces:
            raise KeyError(f"Workspace '{name}' not found. Available: {list(workspaces.keys())}")
        return workspaces[name]

    _MINIMAL_TEMPLATE = """workspaces:
      coding:
        name: "Coding Setup"
        description: "Default coding workspace"
        steps:
          - type: announce
            message: "Setting up your coding workspace."
    """
    ```

    Avoid: storing `load_workspaces` result as a module-level cache (file may be edited at runtime).
  </action>
  <verify>python -c "from zeno.macros.loader import load_workspaces, get_workspace, MacroStep, Workspace, VALID_STEP_TYPES; print(len(VALID_STEP_TYPES), 'step types registered')"</verify>
  <done>
    - All names import cleanly.
    - `VALID_STEP_TYPES` has exactly 7 members.
    - `workspaces.yaml` exists at project root with `coding` and `writing` workspaces.
    - Invalid step type raises `ValueError`. Malformed YAML raises `ValueError`.
    - Missing file auto-creates without raising.
  </done>
</task>

## Success Criteria
- [ ] `from zeno.macros.safety import check_app_safety, assert_app_allowed, register_app, MacroSafetyError` works
- [ ] `check_app_safety("NotInDB", ":memory:")` → `SafetyResult(allowed=True, reason="warn_unknown")`
- [ ] `assert_app_allowed` raises `MacroSafetyError` only for hard-denied (non-work, no override)
- [ ] `from zeno.macros.loader import load_workspaces, get_workspace, VALID_STEP_TYPES` works
- [ ] `VALID_STEP_TYPES` has exactly 7 entries
- [ ] Invalid step type in YAML → `ValueError` at load time
- [ ] Missing `workspaces.yaml` → auto-created, no exception raised
