# Plan 9.2 Summary: Tauri Rust Shell — Scaffold, Tray & Window Management

## Status: COMPLETE — cargo check PASSES (0 errors)

## Task Completed

### Task 1: Scaffold src-tauri/ Rust crate + frontend/ Vite/React/TS skeleton

**Commit 1:** `feat(phase-9-2): tauri-shell-and-frontend-scaffold` — ce235f5 (19 files, 5848 insertions)
**Commit 2:** `fix(phase-9-2): add Emitter import, proper PNG icons, clone AppHandle for thread` — 3fc8c28

---

## Files Created

### Rust / Tauri (src-tauri/)

| File | Description |
|------|-------------|
| `src-tauri/Cargo.toml` | Tauri 2 crate — tauri + reqwest(blocking,json) + serde. NO rusqlite. |
| `src-tauri/build.rs` | Standard `tauri_build::build()` build script |
| `src-tauri/tauri.conf.json` | Tauri 2 config — main (1200x780, visible:false) + overlay (540x170, borderless, alwaysOnTop) |
| `src-tauri/capabilities/default.json` | Default caps for main + overlay windows |
| `src-tauri/src/main.rs` | Minimal entry: `fn main() { zeno_lib::run() }` |
| `src-tauri/src/lib.rs` | Tray (4 items) + window close-to-tray + daemon HTTP POST helpers |
| `src-tauri/src/commands.rs` | 3 IPC commands: get_api_base, show_overlay_window, hide_overlay_window |
| `src-tauri/icons/32x32.png` | Proper 32x32 cyan PNG icon |
| `src-tauri/icons/128x128.png` | Proper 128x128 cyan PNG icon |
| `src-tauri/icons/icon.ico` | PNG-in-ICO format placeholder icon |

### Frontend (frontend/)

| File | Description |
|------|-------------|
| `frontend/package.json` | Vite + React 19 + @tauri-apps/api@^2 + recharts + lucide-react |
| `frontend/vite.config.ts` | Vite config — port 5173, chrome105 target, debug-aware sourcemaps |
| `frontend/tsconfig.json` | TS config — ESNext bundler mode, strict, react-jsx |
| `frontend/index.html` | HTML entry — loads Orbitron, Share Tech Mono, Rajdhani fonts |
| `frontend/src/main.tsx` | React root — mounts App in StrictMode |
| `frontend/src/App.tsx` | App shell — sidebar nav, overlay hash detection, get_api_base IPC call |
| `frontend/src/index.css` | Full sci-fi HUD design system |

---

## Key Design Decisions Implemented

### Rust Layer (Window Manager Only)
- `reqwest::blocking` for synchronous HTTP POSTs to daemon — no async runtime needed
- All tray actions relay to FastAPI on port 8766 then emit `daemon_state` event to React
- `app.exit(0)` fires 500ms after posting `/daemon/shutdown` (grace period for clean shutdown)
- Window close is intercepted: `prevent_close()` + `win.hide()` — process stays alive in tray

### Tray Menu (4 Items as Specified)
1. **Open Dashboard** — `win.show()` + `win.set_focus()`
2. **Toggle Focus Mode** — POST `/daemon/focus`, emits `daemon_state` to frontend
3. **Mute Voice** — POST `/daemon/tts/mute`, emits `daemon_state` to frontend
4. *(separator)*
5. **Quit ZENO** — POST `/daemon/shutdown`, then `app_handle.exit(0)` after 500ms

### CSS Design System (index.css)
All CSS custom properties implemented:
- `--bg-void: #050810`, `--bg-panel`, `--bg-glass`
- `--cyan: #00d4ff`, `--orange: #ff6b35`, `--purple: #7c3aed`, `--green: #00ff88`, `--red: #ff2b4a`
- `--font-hud` (Orbitron), `--font-mono` (Share Tech Mono), `--font-ui` (Rajdhani)

All visual components implemented:
- Scanline overlay (`body::after` repeating-linear-gradient)
- `.panel` corner brackets (CSS `::before`/`::after` with cyan borders)
- `.arc-ring` with `arc-spin` (8s linear) + `arc-pulse` (2s ease-in-out) keyframes
- `.arc-active` with faster `arc-active-pulse` (0.5s)
- `.nav-btn` with active indicator bar, hover glow, `.nav-indicator` dot
- `.gauge-row` / `.gauge-track` / `.gauge-fill` (with warn/crit variants)
- `.task-item` / `.task-dot` (p0-p3 priority) / `.task-badge` (pending/in_progress/done)
- `.hud-bar` / `.hud-stat` / `.hud-stat-value` (ok/warn/crit variants)
- `.hud-btn` / `.hud-btn.primary` / `.hud-loading` / `.hud-error`
- `.briefing-pre` / `.briefing-empty`
- Custom cyan scrollbars

---

## Verification

### cargo check — PASSED
```
Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.63s
```
0 errors. Rust toolchain: rustc 1.97.0 (2d8144b78 2026-07-07) stable

---

## Deviations Applied

| Rule | Deviation |
|------|-----------|
| Rule 1 | Added `src-tauri/target/`, `frontend/node_modules/`, `frontend/dist/` to `.gitignore` — build artifacts were being staged by git add |
| Rule 1 | Installed Rust stable toolchain (`rustup default stable`) — no active toolchain was configured |
| Rule 1 | Added `use tauri::Emitter;` import — required for `win.emit()` in Tauri 2 trait-based API |
| Rule 1 | Generated proper 32x32/128x128 PNG icons using System.Drawing — minimal 1x1 placeholder failed to parse in Tauri's ICO decoder |
| Rule 1 | Cloned `AppHandle` before `std::thread::spawn` in quit handler — `app` in `on_menu_event` is a `&AppHandle` reference, not owned |

---

## Success Criteria Checklist

- [x] `cargo check` exits 0 in `src-tauri/` — VERIFIED
- [x] `Cargo.toml` has `reqwest` but NOT `rusqlite`
- [x] Tray has 4 items: Open Dashboard, Toggle Focus Mode, Mute Voice, Quit ZENO
- [x] Quit handler POSTs `/daemon/shutdown` before `app.exit(0)` with 500ms delay
- [x] Focus/Mute handlers POST to daemon and emit `daemon_state` to main window
- [x] Main window `"visible": false`; overlay `decorations: false, alwaysOnTop: true`
- [x] `frontend/src/index.css` uses sci-fi color palette (--bg-void, --cyan, --orange, etc.)
- [x] `frontend/src/index.css` includes scanline overlay, `.panel` bracket corners, `.arc-ring` keyframes
- [x] `frontend/index.html` loads Orbitron, Share Tech Mono, Rajdhani fonts
