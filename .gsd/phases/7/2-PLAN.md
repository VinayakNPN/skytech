---
phase: 7
plan: 2
wave: 1
---

# Plan 7.2: Macro Step Executors (All 7 Step Types)

## Objective
Implement `zeno/macros/steps.py` — concrete executor for each of the 7 macro step types. Key decisions baked in:
- `arrange_windows`: **`maximise_first` only** (v1 scope) — deterministic, no fragile HWND fuzzy matching
- `toggle_dnd`: attempt registry write, catch ALL failures silently, log and continue — never aborts macro
- `open_app`: `subprocess.Popen` without `shell=True`; Windows `start` fallback. No shell injection possible.
- `announce`: delegates to `tts_worker.enqueue()` — engine also pre-announces certain steps automatically
- All pywin32/pygetwindow imports guarded — graceful no-op on non-Windows

## Context
- `.gsd/SPEC.md` — R6: all 7 step types
- `.gsd/DECISIONS.md` — Phase 7: arrange_windows scope, toggle_dnd approach, execution threading
- `requirements.txt` — `pywin32`, `pygetwindow` present
- `zeno/tts/worker.py` — `TTSWorker.enqueue()` for `announce` step

## Tasks

<task type="auto">
  <name>steps.py — all 7 step executor functions + STEP_EXECUTORS registry</name>
  <files>
    zeno/macros/steps.py
  </files>
  <action>
    Create `zeno/macros/steps.py`. Structure:

    **Imports + availability flags**:
    ```python
    import subprocess, sys, time, webbrowser
    from typing import Callable

    try:
        import pygetwindow as gw
        _GW_AVAILABLE = True
    except ImportError:
        _GW_AVAILABLE = False

    try:
        import win32gui, win32con, win32api
        _WIN32_AVAILABLE = True
    except ImportError:
        _WIN32_AVAILABLE = False
    ```

    ---

    **`execute_open_app(params: dict, **ctx) -> None`**:
    - `app_name = params["app_name"]` — required.
    - `args = params.get("args", [])` — optional list.
    - Try: `subprocess.Popen([app_name] + args)` (`shell=False`).
    - `except FileNotFoundError`: try `subprocess.Popen(["cmd", "/c", "start", "", app_name])`.
    - Both use `shell=False`. Never use `shell=True`.
    - After launch: `time.sleep(params.get("wait_ms", 0) / 1000.0)` if > 0.

    **`execute_open_url(params: dict, **ctx) -> None`**:
    - `url = params["url"]` — required.
    - Validate: `if not (url.startswith("http://") or url.startswith("https://")): raise ValueError(f"URL must use http/https scheme: {url}")`.
    - `webbrowser.open(url)`.

    **`execute_focus_window(params: dict, **ctx) -> None`**:
    - `app_name = params["app_name"]` — required.
    - If not `_GW_AVAILABLE`: `print(f"[focus_window] pygetwindow not available, skipping", file=sys.stderr); return`.
    - `windows = gw.getWindowsWithTitle(app_name)`.
    - If empty: `raise RuntimeError(f"No window found for '{app_name}'")`.
    - `windows[0].activate()`.

    **`execute_arrange_windows(params: dict, **ctx) -> None`**:
    - **v1 scope: `maximise_first` ONLY.** All other layouts are no-ops with a log.
    - `layout = params.get("layout", "maximise_first")`.
    - `apps = params.get("apps", [])`.
    - If `layout != "maximise_first"`: `print(f"[arrange_windows] Layout '{layout}' not supported in v1, skipping", file=sys.stderr); return`.
    - If `apps` is empty or not `_GW_AVAILABLE` or not `_WIN32_AVAILABLE`: log and return (no-op).
    - Find first app's window via `gw.getWindowsWithTitle(apps[0])`.
    - If found: call `win32gui.ShowWindow(hwnd, win32con.SW_MAXIMIZE)`.
    - If window not found: log warning, no-op. Never raise.

    **`execute_toggle_dnd(params: dict, **ctx) -> None`**:
    - `enabled = params.get("enabled", True)`.
    - Attempt registry write via PowerShell:
      ```python
      # Registry key documented for future maintenance:
      # HKCU\Software\Microsoft\Windows\CurrentVersion\Notifications\Settings
      # NOC_GLOBAL_SETTING_TOASTS_ENABLED: 0 = DND on, 1 = DND off
      value = "0" if enabled else "1"
      cmd = [
          "powershell", "-NonInteractive", "-NoProfile", "-Command",
          f"Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings' "
          f"-Name 'NOC_GLOBAL_SETTING_TOASTS_ENABLED' -Value {value} -ErrorAction SilentlyContinue"
      ]
      subprocess.run(cmd, shell=False, capture_output=True, timeout=5)
      ```
    - Wrap the ENTIRE block in `try/except Exception as e: print(f"[toggle_dnd] Failed (non-fatal): {e}", file=sys.stderr)`.
    - DND failure **never** raises — macro continues regardless.

    **`execute_announce(params: dict, **ctx) -> None`**:
    - `message = params["message"]` — required.
    - `tts_worker = ctx.get("tts_worker")`.
    - If `tts_worker is not None`: `tts_worker.enqueue(message)`.
    - Else: `print(f"[Announce] {message}")`.

    **`execute_wait_ms(params: dict, **ctx) -> None`**:
    - `duration = params["duration"]` — required int (milliseconds).
    - Cap: `time.sleep(min(int(duration), 30_000) / 1000.0)`.

    ---

    **`STEP_EXECUTORS: dict[str, Callable]`**:
    ```python
    STEP_EXECUTORS = {
        "open_app":        execute_open_app,
        "open_url":        execute_open_url,
        "focus_window":    execute_focus_window,
        "arrange_windows": execute_arrange_windows,
        "toggle_dnd":      execute_toggle_dnd,
        "announce":        execute_announce,
        "wait_ms":         execute_wait_ms,
    }
    ```

    **`execute_step(step_type: str, params: dict, **ctx) -> None`**:
    - Look up in `STEP_EXECUTORS`.
    - If missing: `raise ValueError(f"Unknown step type: {step_type}")`.
    - Call executor with `params` and `**ctx`.

    Avoid: `shell=True` anywhere. Avoid: raising from `toggle_dnd` or `arrange_windows` (both are best-effort). Avoid: blocking more than `wait_ms` cap.
  </action>
  <verify>python -c "from zeno.macros.steps import STEP_EXECUTORS, execute_step, execute_announce, execute_wait_ms; assert len(STEP_EXECUTORS) == 7; execute_announce({'message': 'test'}); execute_wait_ms({'duration': 50}); print('steps.py OK, 7 executors')"</verify>
  <done>
    - `STEP_EXECUTORS` has exactly 7 keys matching SPEC step types.
    - `execute_announce({"message": "hi"})` prints `[Announce] hi` without error (no tts_worker).
    - `execute_wait_ms({"duration": 100})` completes in ~0.1s.
    - `execute_open_url` raises `ValueError` for non-http URL.
    - No `shell=True` in the file (`grep -n "shell=True" zeno/macros/steps.py` returns nothing).
    - `arrange_windows` with unsupported layout logs and returns — no exception.
  </done>
</task>

## Success Criteria
- [ ] `from zeno.macros.steps import STEP_EXECUTORS, execute_step` works cleanly
- [ ] `len(STEP_EXECUTORS) == 7`
- [ ] `execute_announce({"message": "test"})` — no error without tts_worker
- [ ] `execute_wait_ms({"duration": 100})` — completes without error
- [ ] `execute_open_url` rejects non-http/https with `ValueError`
- [ ] `execute_toggle_dnd` never raises, even if registry write fails
- [ ] `execute_arrange_windows` with `layout="side-by-side"` logs warning and returns (no-op)
- [ ] Zero instances of `shell=True` in the file
