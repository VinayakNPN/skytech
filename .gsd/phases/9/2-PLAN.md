---
phase: 9
plan: 2
wave: 1
---

# Plan 9.2: Tauri Rust Shell — Scaffold, Tray & Window Management

## Objective
Stand up the Tauri 2 desktop application with:

1. **Project scaffold** — `src-tauri/` Rust crate + `frontend/` Vite/React/TS project. The Rust layer is intentionally thin: no `rusqlite`, no DB reads. It manages windows and relays tray commands to the Python FastAPI server.
2. **System tray** with 4 actionable menu items:
   - **Open Dashboard** — shows + focuses main window
   - **Toggle Focus Mode** — HTTP POST to `localhost:8766/daemon/focus`; menu label updates dynamically
   - **Mute/Unmute Voice** — HTTP POST to `localhost:8766/daemon/tts/mute`; menu label updates dynamically
   - **Quit ZENO** — HTTP POST to `localhost:8766/daemon/shutdown`, waits 500ms, then `app.exit(0)`
3. **Window behavior** — main window starts `visible: false`; close button hides to tray; overlay window defined as a second static window (borderless, always-on-top).
4. **Rust IPC commands** — 3 minimal commands:
   - `get_api_base() -> String` — returns `"http://127.0.0.1:8766"` (frontend uses this as base URL)
   - `show_overlay_window(app)` — shows the overlay window
   - `hide_overlay_window(app)` — hides the overlay window

## Context
- `.gsd/DECISIONS.md` — Phase 9: FastAPI port 8766, Rust is window-manager only, no rusqlite
- `.gsd/phases/9/RESEARCH.md` — Tauri 2 tray patterns, `TrayIconBuilder`, `on_menu_event`
- `.gsd/phases/9/1-PLAN.md` — FastAPI routes already built; frontend fetches from localhost:8766

## Tasks

<task type="auto">
  <name>Scaffold src-tauri/ Rust crate + frontend/ Vite/React/TS skeleton</name>
  <files>
    src-tauri/Cargo.toml
    src-tauri/tauri.conf.json
    src-tauri/capabilities/default.json
    src-tauri/src/main.rs
    src-tauri/src/lib.rs
    src-tauri/src/commands.rs
    frontend/package.json
    frontend/vite.config.ts
    frontend/tsconfig.json
    frontend/index.html
    frontend/src/main.tsx
    frontend/src/App.tsx
    frontend/src/index.css
  </files>
  <action>
    **`src-tauri/Cargo.toml`** — no rusqlite; uses reqwest for HTTP POST to daemon:
    ```toml
    [package]
    name = "zeno"
    version = "0.1.0"
    edition = "2021"

    [lib]
    name = "zeno_lib"
    crate-type = ["staticlib", "cdylib", "rlib"]

    [build-dependencies]
    tauri-build = { version = "2", features = [] }

    [dependencies]
    tauri = { version = "2", features = ["tray-icon"] }
    tauri-plugin-shell = "2"
    serde = { version = "1", features = ["derive"] }
    serde_json = "1"
    reqwest = { version = "0.12", features = ["blocking", "json"] }

    [profile.release]
    panic = "abort"
    codegen-units = 1
    lto = true
    opt-level = "s"
    strip = true
    ```

    **`src-tauri/src/main.rs`:**
    ```rust
    #![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
    fn main() { zeno_lib::run() }
    ```

    **`src-tauri/src/commands.rs`:**
    ```rust
    use tauri::AppHandle;

    /// Returns the base URL of the Python FastAPI daemon.
    /// The React frontend uses this as its API root.
    #[tauri::command]
    pub fn get_api_base() -> String {
        "http://127.0.0.1:8766".to_string()
    }

    /// Shows the overlay quick-capture window.
    #[tauri::command]
    pub fn show_overlay_window(app: AppHandle) -> Result<(), String> {
        use tauri::Manager;
        if let Some(win) = app.get_webview_window("overlay") {
            win.show().map_err(|e| e.to_string())?;
            win.set_focus().map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    /// Hides the overlay quick-capture window.
    #[tauri::command]
    pub fn hide_overlay_window(app: AppHandle) -> Result<(), String> {
        use tauri::Manager;
        if let Some(win) = app.get_webview_window("overlay") {
            win.hide().map_err(|e| e.to_string())?;
        }
        Ok(())
    }
    ```

    **`src-tauri/src/lib.rs`** — tray with 4 menu items + dynamic label update:
    ```rust
    use tauri::{
        menu::{MenuBuilder, MenuItemBuilder},
        tray::TrayIconBuilder,
        Manager, WindowEvent,
    };

    mod commands;

    const API_BASE: &str = "http://127.0.0.1:8766";

    fn post_daemon(path: &str) -> Option<serde_json::Value> {
        let url = format!("{API_BASE}{path}");
        reqwest::blocking::Client::new()
            .post(&url)
            .send()
            .ok()
            .and_then(|r| r.json().ok())
    }

    #[cfg_attr(mobile, tauri::mobile_entry_point)]
    pub fn run() {
        tauri::Builder::default()
            .plugin(tauri_plugin_shell::init())
            .invoke_handler(tauri::generate_handler![
                commands::get_api_base,
                commands::show_overlay_window,
                commands::hide_overlay_window,
            ])
            .setup(|app| {
                // Build tray menu
                let open_i    = MenuItemBuilder::with_id("open",     "Open Dashboard").build(app)?;
                let focus_i   = MenuItemBuilder::with_id("focus",    "Toggle Focus Mode").build(app)?;
                let mute_i    = MenuItemBuilder::with_id("mute",     "Mute Voice").build(app)?;
                let sep1      = tauri::menu::PredefinedMenuItem::separator(app)?;
                let quit_i    = MenuItemBuilder::with_id("quit",     "Quit ZENO").build(app)?;

                let menu = MenuBuilder::new(app)
                    .items(&[&open_i, &focus_i, &mute_i, &sep1, &quit_i])
                    .build()?;

                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .tooltip("ZENO — Your Personal AI Assistant")
                    .show_menu_on_left_click(false)
                    .on_tray_icon_event(|tray, event| {
                        // Left click: toggle main window
                        if let tauri::tray::TrayIconEvent::Click { .. } = event {
                            let app = tray.app_handle();
                            if let Some(win) = app.get_webview_window("main") {
                                if win.is_visible().unwrap_or(false) {
                                    let _ = win.hide();
                                } else {
                                    let _ = win.show();
                                    let _ = win.set_focus();
                                }
                            }
                        }
                    })
                    .on_menu_event(move |app, event| match event.id().as_ref() {
                        "open" => {
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                        "focus" => {
                            if let Some(resp) = post_daemon("/daemon/focus") {
                                // Update menu label dynamically
                                let label = resp["label"].as_str().unwrap_or("Toggle Focus Mode");
                                if let Some(win) = app.get_webview_window("main") {
                                    let _ = win.emit("daemon_state", &resp);
                                }
                                // Note: Tauri 2 does not support dynamic menu item label updates
                                // via MenuItem.set_text() in the on_menu_event closure due to
                                // ownership constraints. State is pushed to frontend via emit() instead.
                                let _ = label; // suppress unused warning
                            }
                        }
                        "mute" => {
                            if let Some(resp) = post_daemon("/daemon/tts/mute") {
                                if let Some(win) = app.get_webview_window("main") {
                                    let _ = win.emit("daemon_state", &resp);
                                }
                            }
                        }
                        "quit" => {
                            // Tell daemon to shut down cleanly, then exit after grace period
                            post_daemon("/daemon/shutdown");
                            std::thread::spawn(move || {
                                std::thread::sleep(std::time::Duration::from_millis(500));
                                app.exit(0);
                            });
                        }
                        _ => {}
                    })
                    .build(app)?;

                Ok(())
            })
            .on_window_event(|window, event| {
                // All windows hide on close (never quit the process)
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let _ = window.hide();
                    api.prevent_close();
                }
            })
            .run(tauri::generate_context!())
            .expect("error running ZENO");
    }
    ```

    **`src-tauri/tauri.conf.json`:**
    ```json
    {
      "$schema": "https://schema.tauri.app/config/2",
      "identifier": "com.zeno.app",
      "productName": "ZENO",
      "version": "0.1.0",
      "bundle": {
        "active": true,
        "targets": "all",
        "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"]
      },
      "app": {
        "withGlobalTauri": true,
        "windows": [
          {
            "label": "main",
            "title": "ZENO",
            "width": 1200,
            "height": 780,
            "minWidth": 900,
            "minHeight": 560,
            "visible": false,
            "decorations": true,
            "resizable": true,
            "center": true
          },
          {
            "label": "overlay",
            "title": "ZENO — Quick Capture",
            "width": 540,
            "height": 170,
            "visible": false,
            "decorations": false,
            "alwaysOnTop": true,
            "resizable": false,
            "center": true,
            "url": "index.html#/overlay"
          }
        ],
        "security": { "csp": null }
      },
      "build": {
        "beforeDevCommand": "npm run dev --prefix ../frontend",
        "beforeBuildCommand": "npm run build --prefix ../frontend",
        "devUrl": "http://localhost:5173",
        "frontendDist": "../frontend/dist"
      }
    }
    ```

    **`src-tauri/capabilities/default.json`:**
    ```json
    {
      "$schema": "https://schema.tauri.app/mobile/2",
      "identifier": "default",
      "description": "Default capabilities for ZENO",
      "windows": ["main", "overlay"],
      "permissions": [
        "core:default",
        "shell:allow-open"
      ]
    }
    ```

    **`frontend/package.json`:**
    ```json
    {
      "name": "zeno-frontend",
      "private": true,
      "version": "0.1.0",
      "type": "module",
      "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
      },
      "dependencies": {
        "@tauri-apps/api": "^2",
        "react": "^19",
        "react-dom": "^19",
        "recharts": "^2.12",
        "lucide-react": "^0.400.0"
      },
      "devDependencies": {
        "@types/react": "^19",
        "@types/react-dom": "^19",
        "@vitejs/plugin-react": "^4",
        "typescript": "^5",
        "vite": "^6"
      }
    }
    ```

    **`frontend/vite.config.ts`:**
    ```typescript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      clearScreen: false,
      server: { port: 5173, strictPort: true },
      envPrefix: ['VITE_', 'TAURI_'],
      build: {
        target: 'chrome105',
        minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
        sourcemap: !!process.env.TAURI_DEBUG,
      },
    });
    ```

    **`frontend/tsconfig.json`:**
    ```json
    {
      "compilerOptions": {
        "target": "ES2021",
        "useDefineForClassFields": true,
        "lib": ["ES2021", "DOM", "DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": false,
        "noUnusedParameters": false
      },
      "include": ["src"]
    }
    ```

    **`frontend/index.html`:**
    ```html
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet" />
        <title>ZENO</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/main.tsx"></script>
      </body>
    </html>
    ```

    **`frontend/src/main.tsx`:**
    ```tsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import App from './App';
    import './index.css';
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode><App /></React.StrictMode>
    );
    ```

    **`frontend/src/App.tsx`** — minimal shell, components wired in Plan 9.3:
    ```tsx
    import { useState, useEffect } from 'react';
    import { invoke } from '@tauri-apps/api/core';
    import './index.css';

    type View = 'dashboard' | 'briefing' | 'tasks' | 'settings';
    const isOverlay = window.location.hash === '#/overlay';

    export default function App() {
      const [view, setView] = useState<View>('dashboard');
      const [apiBase, setApiBase] = useState('http://127.0.0.1:8766');

      useEffect(() => {
        if (!isOverlay) {
          invoke<string>('get_api_base').then(setApiBase).catch(() => {});
        }
      }, []);

      if (isOverlay) {
        return (
          <div style={{padding:16,background:'#050810',height:'100vh',
            border:'1px solid #00d4ff',borderRadius:8,boxSizing:'border-box'}}>
            <p style={{color:'#00d4ff',fontFamily:'Share Tech Mono, monospace',fontSize:13}}>
              ⚡ ZENO — Quick Capture (Plan 9.3)
            </p>
          </div>
        );
      }

      const navItems = [
        {id:'dashboard' as View, label:'DASHBOARD'},
        {id:'briefing'  as View, label:'BRIEFING'},
        {id:'tasks'     as View, label:'TASKS'},
        {id:'settings'  as View, label:'SETTINGS'},
      ];

      return (
        <div className="app-shell">
          <nav className="sidebar">
            <div className="logo">ZENO</div>
            <div className="logo-sub">J.A.R.V.I.S. v1.0</div>
            {navItems.map(({id, label}) => (
              <button key={id} id={`nav-${id}`}
                className={`nav-btn ${view===id?'active':''}`}
                onClick={() => setView(id)}>
                <span className="nav-indicator" />
                {label}
              </button>
            ))}
          </nav>
          <main className="main-content">
            <div style={{color:'#00d4ff',fontFamily:'Share Tech Mono',padding:32}}>
              {view.toUpperCase()} view — components wired in Plan 9.3
              <br/>API: {apiBase}
            </div>
          </main>
        </div>
      );
    }
    ```

    **`frontend/src/index.css`** — full sci-fi HUD design system:
    ```css
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      /* Palette */
      --bg-void:      #050810;
      --bg-panel:     #080d18;
      --bg-glass:     rgba(0, 20, 40, 0.7);
      --border-glow:  rgba(0, 212, 255, 0.3);
      --border-dim:   rgba(0, 212, 255, 0.12);

      --cyan:         #00d4ff;
      --cyan-dim:     rgba(0, 212, 255, 0.15);
      --cyan-glow:    0 0 12px rgba(0, 212, 255, 0.5);
      --orange:       #ff6b35;
      --orange-dim:   rgba(255, 107, 53, 0.15);
      --orange-glow:  0 0 8px rgba(255, 107, 53, 0.5);
      --purple:       #7c3aed;
      --green:        #00ff88;
      --red:          #ff2b4a;
      --amber:        #ffc107;

      --text-primary: #c8e6ff;
      --text-dim:     rgba(200, 230, 255, 0.5);
      --text-muted:   rgba(200, 230, 255, 0.25);

      /* Typography */
      --font-hud:     'Orbitron', 'Rajdhani', monospace;
      --font-mono:    'Share Tech Mono', 'Fira Code', monospace;
      --font-ui:      'Rajdhani', system-ui, sans-serif;

      /* Geometry */
      --radius-sm:    4px;
      --radius-md:    8px;
      --radius-lg:    16px;
      --transition:   200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    html, body, #root {
      height: 100%;
      background: var(--bg-void);
      color: var(--text-primary);
      font-family: var(--font-ui);
      font-size: 13px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }

    /* Scanline overlay */
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 212, 255, 0.015) 2px,
        rgba(0, 212, 255, 0.015) 4px
      );
      pointer-events: none;
      z-index: 9999;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-glow); border-radius: 2px; }

    /* ─── APP SHELL ─────────────────────────────────────────────────── */
    .app-shell {
      display: grid;
      grid-template-columns: 180px 1fr;
      height: 100vh;
      overflow: hidden;
    }

    /* ─── SIDEBAR ───────────────────────────────────────────────────── */
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 24px 12px;
      background: var(--bg-panel);
      border-right: 1px solid var(--border-glow);
      position: relative;
    }

    .sidebar::after {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 1px; height: 100%;
      background: linear-gradient(to bottom, transparent, var(--cyan), transparent);
      opacity: 0.4;
    }

    .logo {
      font-family: var(--font-hud);
      font-size: 22px;
      font-weight: 900;
      letter-spacing: 4px;
      color: var(--cyan);
      text-shadow: var(--cyan-glow);
      padding: 0 8px 4px;
    }

    .logo-sub {
      font-family: var(--font-mono);
      font-size: 9px;
      letter-spacing: 2px;
      color: var(--text-muted);
      padding: 0 8px 24px;
      text-transform: uppercase;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: var(--radius-sm);
      color: var(--text-dim);
      font-family: var(--font-hud);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 2px;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: var(--transition);
      position: relative;
      overflow: hidden;
    }

    .nav-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: var(--cyan-dim);
      opacity: 0;
      transition: var(--transition);
    }

    .nav-btn:hover::before, .nav-btn.active::before { opacity: 1; }
    .nav-btn:hover { color: var(--cyan); }
    .nav-btn.active { color: var(--cyan); text-shadow: var(--cyan-glow); }

    .nav-btn.active::after {
      content: '';
      position: absolute;
      right: 0; top: 20%; bottom: 20%;
      width: 2px;
      background: var(--cyan);
      box-shadow: var(--cyan-glow);
      border-radius: 2px;
    }

    .nav-indicator {
      width: 5px; height: 5px;
      border-radius: 50%;
      border: 1px solid var(--text-muted);
      flex-shrink: 0;
      transition: var(--transition);
    }

    .nav-btn.active .nav-indicator, .nav-btn:hover .nav-indicator {
      background: var(--cyan);
      border-color: var(--cyan);
      box-shadow: var(--cyan-glow);
    }

    /* ─── MAIN CONTENT ──────────────────────────────────────────────── */
    .main-content {
      overflow-y: auto;
      background: var(--bg-void);
    }

    /* ─── HUD TOP BAR ───────────────────────────────────────────────── */
    .hud-bar {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 8px 24px;
      background: rgba(0, 10, 20, 0.9);
      border-bottom: 1px solid var(--border-glow);
      font-family: var(--font-mono);
      font-size: 11px;
      letter-spacing: 0.5px;
    }

    .hud-stat {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-dim);
    }

    .hud-stat-value {
      color: var(--orange);
      font-weight: 700;
      text-shadow: var(--orange-glow);
    }

    .hud-stat-value.ok  { color: var(--green); text-shadow: 0 0 6px rgba(0,255,136,0.4); }
    .hud-stat-value.warn { color: var(--amber); }
    .hud-stat-value.crit { color: var(--red); text-shadow: 0 0 6px rgba(255,43,74,0.4); }

    .hud-divider {
      width: 1px; height: 14px;
      background: var(--border-glow);
    }

    /* ─── PANELS ────────────────────────────────────────────────────── */
    .panel-grid {
      display: grid;
      gap: 16px;
      padding: 16px 20px;
    }

    .panel {
      background: var(--bg-glass);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-md);
      backdrop-filter: blur(8px);
      position: relative;
      overflow: hidden;
    }

    /* Corner bracket decorations */
    .panel::before, .panel::after {
      content: '';
      position: absolute;
      width: 12px; height: 12px;
    }
    .panel::before {
      top: -1px; left: -1px;
      border-top: 2px solid var(--cyan);
      border-left: 2px solid var(--cyan);
    }
    .panel::after {
      bottom: -1px; right: -1px;
      border-bottom: 2px solid var(--cyan);
      border-right: 2px solid var(--cyan);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-dim);
    }

    .panel-title {
      font-family: var(--font-hud);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 3px;
      color: var(--cyan);
      text-transform: uppercase;
      text-shadow: var(--cyan-glow);
    }

    .panel-body {
      padding: 16px;
    }

    /* ─── ARC REACTOR / VOICE PULSE ─────────────────────────────────── */
    .arc-reactor {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px;
    }

    .arc-ring {
      position: relative;
      width: 180px; height: 180px;
    }

    .arc-ring svg { position: absolute; inset: 0; }

    .arc-ring-rotate {
      animation: arc-spin 8s linear infinite;
      transform-origin: center;
    }

    .arc-ring-pulse {
      animation: arc-pulse 2s ease-in-out infinite;
    }

    @keyframes arc-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    @keyframes arc-pulse {
      0%, 100% { opacity: 0.6; }
      50%       { opacity: 1; filter: drop-shadow(0 0 16px #00d4ff); }
    }

    .arc-active .arc-ring-pulse {
      animation: arc-active-pulse 0.5s ease-in-out infinite;
    }

    @keyframes arc-active-pulse {
      0%, 100% { opacity: 0.8; }
      50%       { opacity: 1; filter: drop-shadow(0 0 24px #00d4ff) drop-shadow(0 0 48px #00d4ff); }
    }

    .arc-status {
      font-family: var(--font-hud);
      font-size: 10px;
      letter-spacing: 4px;
      color: var(--cyan);
      text-shadow: var(--cyan-glow);
      text-transform: uppercase;
    }

    /* ─── GAUGE BARS ─────────────────────────────────────────────────── */
    .gauge-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .gauge-label {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--text-muted);
      width: 32px;
      flex-shrink: 0;
      letter-spacing: 1px;
    }

    .gauge-track {
      flex: 1;
      height: 4px;
      background: rgba(0, 212, 255, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .gauge-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, var(--cyan), var(--purple));
      box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
      transition: width 1s ease;
    }

    .gauge-fill.warn  { background: linear-gradient(90deg, var(--amber), var(--orange)); }
    .gauge-fill.crit  { background: linear-gradient(90deg, var(--orange), var(--red)); box-shadow: 0 0 8px rgba(255,43,74,0.4); }

    .gauge-val {
      font-family: var(--font-mono);
      font-size: 10px;
      color: var(--orange);
      width: 48px;
      text-align: right;
      flex-shrink: 0;
    }

    /* ─── TASK LIST ──────────────────────────────────────────────────── */
    .task-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: rgba(0, 212, 255, 0.04);
      border: 1px solid var(--border-dim);
      border-radius: var(--radius-sm);
      transition: var(--transition);
    }

    .task-item:hover {
      border-color: var(--border-glow);
      background: var(--cyan-dim);
    }

    .task-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .task-dot.p3 { background: var(--red);    box-shadow: 0 0 6px var(--red); }
    .task-dot.p2 { background: var(--orange); box-shadow: 0 0 6px var(--orange); }
    .task-dot.p1 { background: var(--green);  box-shadow: 0 0 4px var(--green); }
    .task-dot.p0 { background: var(--text-muted); }

    .task-title {
      flex: 1;
      font-family: var(--font-ui);
      font-size: 12px;
      color: var(--text-primary);
    }

    .task-badge {
      font-family: var(--font-mono);
      font-size: 9px;
      padding: 2px 7px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .task-badge.pending     { border: 1px solid var(--cyan);   color: var(--cyan); }
    .task-badge.in_progress { border: 1px solid var(--orange); color: var(--orange); }
    .task-badge.done        { border: 1px solid var(--green);  color: var(--green); }

    /* ─── BRIEFING ───────────────────────────────────────────────────── */
    .briefing-pre {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-primary);
      white-space: pre-wrap;
      line-height: 1.8;
      padding: 16px;
    }

    .briefing-empty {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-muted);
      padding: 40px;
      text-align: center;
      letter-spacing: 1px;
    }

    /* ─── LOADING / ERROR ────────────────────────────────────────────── */
    .hud-loading {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 2px;
      padding: 24px;
      text-align: center;
    }

    .hud-error {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--red);
      background: rgba(255,43,74,0.08);
      border: 1px solid rgba(255,43,74,0.3);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      margin: 12px 16px;
    }

    /* ─── BUTTONS ────────────────────────────────────────────────────── */
    .hud-btn {
      font-family: var(--font-hud);
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 5px 14px;
      background: transparent;
      border: 1px solid var(--border-glow);
      border-radius: var(--radius-sm);
      color: var(--cyan);
      cursor: pointer;
      transition: var(--transition);
    }

    .hud-btn:hover {
      background: var(--cyan-dim);
      box-shadow: var(--cyan-glow);
    }

    .hud-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .hud-btn.primary {
      background: var(--cyan-dim);
      border-color: var(--cyan);
    }
    ```

    For the placeholder icon files: copy any small image in the repo as `src-tauri/icons/32x32.png` and `src-tauri/icons/128x128.png` — real icon art is not a compilation blocker.

    Avoid: any Tailwind class. Avoid: CSS-in-JS. Avoid: `rusqlite` in `Cargo.toml`. Avoid: importing any router library.
  </action>
  <verify>cd src-tauri && cargo check 2>&1 | Select-String "^error" | Measure-Object -Line | Select-Object -ExpandProperty Lines</verify>
  <done>
    - `src-tauri/Cargo.toml` has `tauri`, `reqwest`, `serde_json` but NOT `rusqlite`.
    - `src-tauri/src/commands.rs` has 3 commands: `get_api_base`, `show_overlay_window`, `hide_overlay_window`.
    - `src-tauri/src/lib.rs` has tray with 4 menu items: open, focus, mute, quit.
    - `quit` handler POSTs to `/daemon/shutdown` then calls `app.exit(0)` after 500ms.
    - `focus` and `mute` handlers POST to daemon and emit `daemon_state` event to main window.
    - `tauri.conf.json` has `"visible": false` on main window + overlay window with `decorations: false, alwaysOnTop: true`.
    - `cargo check` in `src-tauri/` returns 0 errors.
    - `frontend/index.html` loads Orbitron + Share Tech Mono + Rajdhani fonts.
    - `frontend/src/index.css` defines all CSS custom properties: `--bg-void`, `--cyan`, `--orange`, etc.
    - `frontend/src/index.css` includes scanline body overlay, `.panel` bracket corners, `.arc-ring` animation.
    - `frontend/src/App.tsx` calls `get_api_base` on mount; renders `<Overlay>` for `#/overlay` hash.
  </done>
</task>

## Success Criteria
- [ ] `cargo check` exits 0 in `src-tauri/`
- [ ] `Cargo.toml` has `reqwest` but NOT `rusqlite`
- [ ] Tray has 4 items: Open Dashboard, Toggle Focus Mode, Mute Voice, Quit ZENO
- [ ] Quit handler POSTs `/daemon/shutdown` before `app.exit(0)` with 500ms delay
- [ ] Focus/Mute handlers POST to daemon and emit `daemon_state` to main window
- [ ] Main window `"visible": false`; overlay `decorations: false, alwaysOnTop: true`
- [ ] `frontend/src/index.css` uses sci-fi color palette (--bg-void, --cyan, --orange, etc.)
- [ ] `frontend/src/index.css` includes scanline overlay, `.panel` bracket corners, `.arc-ring` keyframes
- [ ] `frontend/index.html` loads Orbitron, Share Tech Mono, Rajdhani fonts
