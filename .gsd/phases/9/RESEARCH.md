# Phase 9 Research — Tauri UI Shell & Analytics Dashboard

> Researched: 2026-07-09 | Updated after discussion: 2026-07-10

## Decision Summary (FINAL after /discuss-phase)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tauri version | 2.x | Current stable, `on_tray_icon_event` API available |
| Frontend framework | React 19 + Vite | ROADMAP specifies React/TypeScript; Vite is standard Tauri scaffold |
| Chart library | Recharts (AreaChart) | React-native, composable, well-typed; gradient fills for HUD aesthetic |
| Styling | Sci-fi HUD — Vanilla CSS | Orbitron/Share Tech Mono fonts; cyan+orange+purple palette; scanline overlay; arc reactor animations |
| Python IPC | **FastAPI on localhost:8766** | Single source of truth; Python owns all DB logic; React fetches directly |
| Tray icon | `TrayIconBuilder` with **4 actionable items** | Open Dashboard, Toggle Focus Mode, Mute Voice, Quit ZENO |
| UI scope | **Observation-only** | Voice-first philosophy; no data entry forms |
| Startup | **Both processes hidden** | pythonw.exe + shell:startup shortcuts; no visible windows on boot |
| System metrics | **Real psutil data** | CPU, GPU, RAM, battery, network — no fake placeholders |
| WebSocket | **Extended with broadcast()** | `ws_server.py` gains `connected_clients` + `broadcast()` for overlay trigger |
| Logging | **RotatingFileHandler** | 5MB × 3 backups at ~/Zeno/logs/zeno.log |

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tauri version | 2.x | Current stable, `on_tray_icon_event` API available |
| Frontend framework | React 19 + Vite | ROADMAP specifies React/TypeScript; Vite is standard Tauri scaffold |
| Chart library | Recharts | React-native, composable, well-typed, no extra runtime |
| Styling | Vanilla CSS (CSS custom properties) | Per project guidelines; avoids Tailwind complexity |
| Python IPC | WebSocket on `localhost:8765` | Already used by Browser Extension (Phase 8); reuse same port |
| Tray icon | `tauri::tray::TrayIconBuilder` | Native Tauri 2 API; left-click shows/hides main window |

---

## Tauri 2 Key Patterns

### System Tray
```rust
// src-tauri/src/lib.rs
use tauri::{tray::TrayIconBuilder, Manager, WindowEvent};

TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .show_menu_on_left_click(false)
    .on_tray_icon_event(|tray, event| {
        if let tauri::tray::TrayIconEvent::Click { .. } = event {
            let app = tray.app_handle();
            if let Some(win) = app.get_webview_window("main") {
                if win.is_visible().unwrap_or(false) { win.hide().unwrap(); }
                else { win.show().unwrap(); win.set_focus().unwrap(); }
            }
        }
    })
    .build(app)?;
```

### Hide-to-tray on close
```rust
.on_window_event(|window, event| {
    if let WindowEvent::CloseRequested { api, .. } = event {
        window.hide().unwrap();
        api.prevent_close();
    }
})
```

### IPC Command (Rust side)
```rust
#[tauri::command]
fn get_analytics(db_path: String) -> Result<serde_json::Value, String> { ... }

.invoke_handler(tauri::generate_handler![get_analytics, quick_capture, get_briefing])
```

### Frontend invoke (TypeScript)
```typescript
import { invoke } from '@tauri-apps/api/core';
const data = await invoke<AnalyticsData>('get_analytics', { dbPath });
```

---

## Python ↔ Tauri IPC Architecture

The ZENO Python daemon already runs a WebSocket server on `localhost:8765` (Phase 8, browser extension). The Tauri frontend will connect to **the same WebSocket** for real-time data push (e.g., new morning briefing ready, voice command complete).

For **query-style** data (analytics charts, task list, settings), the Rust layer will:
1. Accept an IPC `invoke` from the frontend
2. Query `~/Zeno/Zeno.db` directly via `rusqlite` 
3. Return JSON

This avoids an extra HTTP server and keeps reads fast.

---

## Scaffold Commands

```bash
# In project root — Tauri 2 + React/TS scaffold
npm create tauri-app@latest -- --template react-ts --manager npm --identifier com.zeno.app --name "ZENO" frontend
# Then move src-tauri + frontend to project root structure
```

Or the standard:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install @tauri-apps/api recharts lucide-react
```

---

## Component Plan

| Component | Route/Trigger | Data Source |
|-----------|--------------|-------------|
| `Dashboard.tsx` | `/dashboard` | `invoke('get_analytics')` → SQLite views |
| `BriefingPanel.tsx` | `/briefing` | `invoke('get_briefing')` → reads `sessions/YYYY-MM-DD.md` |
| `Overlay.tsx` | `Ctrl+Shift+Space` hotkey → dedicated window | WebSocket push / `invoke('quick_capture')` |
| `TaskList.tsx` | `/tasks` | `invoke('get_tasks')` |
| `Settings.tsx` | `/settings` | `invoke('get_settings')` / `invoke('save_settings')` |

---

## Cargo.toml Dependencies
```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-shell = "2"
rusqlite = { version = "0.31", features = ["bundled"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

---

## Discovery Level: 2 — Standard Research
- Tauri 2.x is well-established; IPC patterns are stable
- WebSocket reuse from Phase 8 avoids new infrastructure
- Recharts is the clear React chart choice (typed, composable)
