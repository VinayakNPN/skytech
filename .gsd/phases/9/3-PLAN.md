---
phase: 9
plan: 3
wave: 2
---

# Plan 9.3: Sci-Fi HUD Components — Dashboard, Briefing, Overlay & Settings

## Objective
Build all React components using real FastAPI data and the sci-fi HUD design system from Plan 9.2.
Every panel shows live data — no placeholders.

1. **`SystemBar.tsx`** — top HUD bar with live system metrics (CPU, GPU, RAM, battery, network) polled every 3 seconds from `GET /system`.
2. **`ArcReactor.tsx`** — animated SVG arc ring (J.A.R.V.I.S. style) that pulses faster when ZENO is speaking (listens for `daemon_state` Tauri events + WebSocket `tts_active`).
3. **`Dashboard.tsx`** — main view: ArcReactor center-top, system gauge bars, 7-day analytics area/bar chart (Recharts), today's task list.
4. **`BriefingPanel.tsx`** — session file content in monospace with date header and refresh button.
5. **`Overlay.tsx`** — borderless quick-capture window; listens on WebSocket for `overlay_show` event to auto-focus.
6. **`Settings.tsx`** — read-only display of `user_profile` (observation-only per Phase 9 decisions).
7. **Update `App.tsx`** — wire all views, connect WebSocket for real-time events, handle `daemon_state` Tauri events.

## Context
- `.gsd/DECISIONS.md` — Phase 9: UI is observation-only; no forms; real system metrics; animated arc ring for voice state; WebSocket `overlay_show` from hotkeys
- `.gsd/phases/9/1-PLAN.md` — FastAPI routes and response shapes: `/system`, `/tasks`, `/briefing`, `/analytics`, `/settings`
- `.gsd/phases/9/2-PLAN.md` — CSS classes: `.panel`, `.panel-header`, `.panel-title`, `.hud-bar`, `.arc-reactor`, `.gauge-row`, `.task-item`, `.hud-btn`, all CSS custom properties
- `zeno/monitor/ws_server.py` — WebSocket broadcasts `{"type":"overlay_show"}` and (future) `{"type":"tts_active","active":bool}`

## Tasks

<task type="auto">
  <name>SystemBar.tsx + ArcReactor.tsx — live system metrics and animated voice indicator</name>
  <files>
    frontend/src/components/SystemBar.tsx
    frontend/src/components/ArcReactor.tsx
    frontend/src/hooks/useApi.ts
    frontend/src/hooks/useDaemonWs.ts
  </files>
  <action>
    **`frontend/src/hooks/useApi.ts`** — generic polling hook:
    ```typescript
    import { useState, useEffect, useRef } from 'react';

    interface ApiState<T> {
      data: T | null;
      loading: boolean;
      error: string | null;
      refresh: () => void;
    }

    export function useApi<T>(url: string, intervalMs?: number): ApiState<T> {
      const [data, setData]       = useState<T | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError]     = useState<string | null>(null);
      const [tick, setTick]       = useState(0);

      const refresh = () => setTick(t => t + 1);

      useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(url)
          .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
          .then(d => { if (!cancelled) { setData(d); setError(null); } })
          .catch(e => { if (!cancelled) setError(String(e)); })
          .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
      }, [url, tick]);

      useEffect(() => {
        if (!intervalMs) return;
        const id = setInterval(refresh, intervalMs);
        return () => clearInterval(id);
      }, [intervalMs]);

      return { data, loading, error, refresh };
    }
    ```

    ---

    **`frontend/src/hooks/useDaemonWs.ts`** — WebSocket connection to `ws://localhost:8765`:
    ```typescript
    import { useEffect, useRef, useCallback } from 'react';

    type Handler = (msg: Record<string, unknown>) => void;

    export function useDaemonWs(onMessage: Handler) {
      const wsRef = useRef<WebSocket | null>(null);
      const handlerRef = useRef(onMessage);
      handlerRef.current = onMessage;

      const connect = useCallback(() => {
        // Don't connect in overlay window — it doesn't need the WS
        if (window.location.hash === '#/overlay') return;

        const ws = new WebSocket('ws://localhost:8765');
        wsRef.current = ws;

        ws.onopen = () => {
          // Send ping to register as a client
          ws.send(JSON.stringify({ type: 'ping' }));
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            handlerRef.current(msg);
          } catch { /* ignore malformed */ }
        };

        ws.onclose = () => {
          // Reconnect after 3s (daemon may not be running yet on startup)
          setTimeout(connect, 3000);
        };

        ws.onerror = () => ws.close();
      }, []);

      useEffect(() => {
        connect();
        return () => { wsRef.current?.close(); };
      }, [connect]);
    }
    ```

    ---

    **`frontend/src/components/SystemBar.tsx`:**
    ```tsx
    import { useApi } from '../hooks/useApi';

    interface SystemData {
      cpu_percent: number;
      ram_used_gb: number;
      ram_total_gb: number;
      ram_percent: number;
      battery_percent: number | null;
      battery_plugged: boolean | null;
      gpu_percent: number | null;
      net_bytes_sent: number;
      net_bytes_recv: number;
      focus_mode: boolean;
      tts_muted: boolean;
    }

    interface Props { apiBase: string; }

    function colorClass(pct: number): string {
      if (pct >= 85) return 'crit';
      if (pct >= 65) return 'warn';
      return 'ok';
    }

    function formatBytes(bytes: number): string {
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
      return `${bytes}B`;
    }

    export default function SystemBar({ apiBase }: Props) {
      const { data } = useApi<SystemData>(`${apiBase}/system`, 3000);

      if (!data) {
        return (
          <div className="hud-bar" id="hud-bar">
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 10 }}>
              CONNECTING TO DAEMON…
            </span>
          </div>
        );
      }

      const stats = [
        { label: 'CPU',     value: `${data.cpu_percent.toFixed(0)}%`,              cls: colorClass(data.cpu_percent) },
        { label: 'GPU',     value: data.gpu_percent != null ? `${data.gpu_percent}%` : 'N/A', cls: data.gpu_percent != null ? colorClass(data.gpu_percent) : '' },
        { label: 'RAM',     value: `${data.ram_used_gb}/${data.ram_total_gb}GB`,    cls: colorClass(data.ram_percent) },
        { label: 'BAT',     value: data.battery_percent != null ? `${data.battery_percent}%${data.battery_plugged ? '⚡' : ''}` : 'N/A', cls: data.battery_percent != null ? colorClass(100 - data.battery_percent) : '' },
        { label: '↑NET',    value: formatBytes(data.net_bytes_sent),                cls: '' },
        { label: '↓NET',    value: formatBytes(data.net_bytes_recv),                cls: 'ok' },
      ];

      return (
        <div className="hud-bar" id="hud-bar">
          {stats.map((s, i) => (
            <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <span className="hud-stat">
                <span style={{ color: 'var(--text-muted)', letterSpacing: 1 }}>{s.label}</span>
                <span className={`hud-stat-value ${s.cls}`} id={`sys-${s.label.toLowerCase().replace(/[^a-z]/g,'')}`}>
                  {s.value}
                </span>
              </span>
              {i < stats.length - 1 && <span className="hud-divider" />}
            </span>
          ))}
          {data.focus_mode && (
            <span style={{ marginLeft: 'auto', color: 'var(--orange)', fontFamily: 'var(--font-hud)',
              fontSize: 9, letterSpacing: 2, textShadow: 'var(--orange-glow)' }}>
              ◈ FOCUS MODE
            </span>
          )}
          {data.tts_muted && (
            <span style={{ marginLeft: data.focus_mode ? 12 : 'auto', color: 'var(--red)',
              fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 2 }}>
              ⊘ VOICE MUTED
            </span>
          )}
        </div>
      );
    }
    ```

    ---

    **`frontend/src/components/ArcReactor.tsx`:**
    ```tsx
    interface Props {
      active?: boolean;   // true when TTS is speaking
      size?: number;      // diameter in px (default 180)
    }

    export default function ArcReactor({ active = false, size = 180 }: Props) {
      const r = size / 2;
      const cx = r, cy = r;

      // Generate tick marks on the outer ring
      const ticks = Array.from({ length: 48 }, (_, i) => {
        const angle = (i * 360) / 48;
        const rad = (angle * Math.PI) / 180;
        const r1 = r - 4, r2 = i % 4 === 0 ? r - 14 : r - 8;
        return {
          x1: cx + r1 * Math.cos(rad), y1: cy + r1 * Math.sin(rad),
          x2: cx + r2 * Math.cos(rad), y2: cy + r2 * Math.sin(rad),
          major: i % 4 === 0,
        };
      });

      return (
        <div className={`arc-reactor ${active ? 'arc-active' : ''}`} id="arc-reactor">
          <div className="arc-ring" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Outer glow ring */}
              <circle cx={cx} cy={cy} r={r - 2} fill="none"
                stroke="rgba(0,212,255,0.08)" strokeWidth={1} />

              {/* Tick marks (static) */}
              {ticks.map((t, i) => (
                <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                  stroke={t.major ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.2)'}
                  strokeWidth={t.major ? 1.5 : 0.8} />
              ))}

              {/* Rotating dashed arc */}
              <g className="arc-ring-rotate">
                <circle cx={cx} cy={cy} r={r - 18} fill="none"
                  stroke="#00d4ff" strokeWidth={1.5} strokeOpacity={0.5}
                  strokeDasharray="12 6" />
              </g>

              {/* Pulsing middle ring */}
              <circle cx={cx} cy={cy} r={r - 32} fill="none"
                className="arc-ring-pulse"
                stroke="#00d4ff" strokeWidth={2} strokeOpacity={0.8}
                strokeDasharray="40 8" />

              {/* Counter-rotating inner arc */}
              <g style={{ transformOrigin: `${cx}px ${cy}px`,
                animation: 'arc-spin 5s linear infinite reverse' }}>
                <circle cx={cx} cy={cy} r={r - 48} fill="none"
                  stroke="rgba(124,58,237,0.7)" strokeWidth={1.5}
                  strokeDasharray="20 10" />
              </g>

              {/* Inner glow core */}
              <circle cx={cx} cy={cy} r={r - 62} fill="none"
                stroke="#00d4ff" strokeWidth={1} strokeOpacity={0.3} />

              {/* Core fill */}
              <circle cx={cx} cy={cy} r={r - 70}
                fill="rgba(0,212,255,0.08)" />
              <circle cx={cx} cy={cy} r={r - 76}
                fill="rgba(0,212,255,0.04)"
                className="arc-ring-pulse" />

              {/* Center dot */}
              <circle cx={cx} cy={cy} r={4}
                fill="#00d4ff"
                filter="url(#glow)" />

              {/* SVG glow filter */}
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>
          </div>

          <div className="arc-status" id="arc-status">
            {active ? '◉ PROCESSING' : '◈ ZENO ACTIVE'}
          </div>
        </div>
      );
    }
    ```

    Avoid: Canvas, WebGL. Avoid: any animation library — pure CSS keyframes only. Avoid: hardcoding any colours — use `var(--cyan)` etc.
  </action>
  <verify>python -c "
import os
for f in [
    'frontend/src/hooks/useApi.ts',
    'frontend/src/hooks/useDaemonWs.ts',
    'frontend/src/components/SystemBar.tsx',
    'frontend/src/components/ArcReactor.tsx',
]:
    assert os.path.exists(f) and os.path.getsize(f) > 100, f'Missing or empty: {f}'

sb = open('frontend/src/components/SystemBar.tsx').read()
assert 'cpu_percent' in sb, 'SystemBar must use cpu_percent'
assert 'hud-bar' in sb, 'SystemBar must have id=hud-bar'
assert 'sys-' in sb, 'SystemBar must have id=sys-{stat} elements'
assert '3000' in sb or 'intervalMs' in open('frontend/src/hooks/useApi.ts').read(), 'Polling must be 3s'

arc = open('frontend/src/components/ArcReactor.tsx').read()
assert 'arc-reactor' in arc, 'ArcReactor must have id=arc-reactor'
assert 'arc-active' in arc, 'ArcReactor must toggle arc-active class'
assert 'arc-status' in arc, 'ArcReactor must have id=arc-status'

ws = open('frontend/src/hooks/useDaemonWs.ts').read()
assert '8765' in ws, 'useDaemonWs must connect to port 8765'
assert 'overlay_show' in ws or 'onMessage' in ws, 'useDaemonWs must handle messages'
print('Plan 9.3 task 1 OK')
"</verify>
  <done>
    - `frontend/src/hooks/useApi.ts` exports `useApi<T>()` with optional polling interval.
    - `frontend/src/hooks/useDaemonWs.ts` connects to `ws://localhost:8765`, reconnects on close.
    - `SystemBar.tsx` polls `/system` every 3 seconds; displays CPU, GPU, RAM, battery, net up/down.
    - `SystemBar.tsx` has `id="hud-bar"` and `id="sys-{stat}"` IDs on each value span.
    - `SystemBar.tsx` shows "FOCUS MODE" banner when `focus_mode: true`, "VOICE MUTED" when `tts_muted: true`.
    - `ArcReactor.tsx` renders SVG arc with tick marks, rotating dashed arc, pulsing middle ring, counter-rotating inner arc.
    - `ArcReactor.tsx` toggles `arc-active` class (faster pulse animation) when `active` prop is `true`.
    - `ArcReactor.tsx` has `id="arc-reactor"` and `id="arc-status"`.
  </done>
</task>

<task type="auto">
  <name>Dashboard.tsx, BriefingPanel.tsx, Overlay.tsx, Settings.tsx + wire App.tsx</name>
  <files>
    frontend/src/components/Dashboard.tsx
    frontend/src/components/BriefingPanel.tsx
    frontend/src/components/Overlay.tsx
    frontend/src/components/Settings.tsx
    frontend/src/App.tsx
  </files>
  <action>
    **`frontend/src/components/Dashboard.tsx`:**
    ```tsx
    import { useState } from 'react';
    import {
      AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
      CartesianGrid, ResponsiveContainer, Legend,
    } from 'recharts';
    import ArcReactor from './ArcReactor';
    import { useApi } from '../hooks/useApi';

    interface AnalyticsRow {
      day: string;
      deep_work_minutes: number;
      distraction_minutes: number;
      idle_minutes: number;
    }

    interface TaskRow {
      id: number; title: string; priority: number;
      status: string; due_date: string | null;
    }

    interface SystemData {
      cpu_percent: number; ram_used_gb: number; ram_total_gb: number;
      ram_percent: number; battery_percent: number | null;
      gpu_percent: number | null;
    }

    interface Props { apiBase: string; ttsActive: boolean; }

    const TOOLTIP_STYLE = {
      background: '#080d18', border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 6, color: '#c8e6ff', fontSize: 11,
      fontFamily: 'Share Tech Mono, monospace',
    };

    export default function Dashboard({ apiBase, ttsActive }: Props) {
      const { data: analytics } = useApi<{ analytics: AnalyticsRow[] }>(`${apiBase}/analytics`, 60000);
      const { data: tasksData }  = useApi<{ tasks: TaskRow[] }>(`${apiBase}/tasks`, 30000);
      const { data: sysData }    = useApi<SystemData>(`${apiBase}/system`, 5000);

      const rows = analytics?.analytics ?? [];
      const tasks = tasksData?.tasks ?? [];

      // System gauge data
      const gauges = [
        { label: 'CPU', pct: sysData?.cpu_percent ?? 0 },
        { label: 'RAM', pct: sysData?.ram_percent ?? 0 },
        { label: 'GPU', pct: sysData?.gpu_percent ?? 0 },
      ].filter(g => g.pct > 0 || g.label !== 'GPU');

      const gaugeClass = (pct: number) => pct >= 85 ? 'crit' : pct >= 65 ? 'warn' : '';

      const priorityClass = (p: number) => p >= 3 ? 'p3' : p === 2 ? 'p2' : p === 1 ? 'p1' : 'p0';

      return (
        <div id="dashboard-view" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Top section: Arc reactor + System gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, padding: '16px 20px 0' }}>

            {/* Arc Reactor */}
            <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                <span className="panel-title">CORE STATUS</span>
              </div>
              <ArcReactor active={ttsActive} size={160} />
            </div>

            {/* System gauges */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">SYSTEM METRICS</span>
              </div>
              <div className="panel-body">
                {sysData ? (
                  <>
                    {gauges.map(g => (
                      <div key={g.label} className="gauge-row">
                        <span className="gauge-label">{g.label}</span>
                        <div className="gauge-track">
                          <div className={`gauge-fill ${gaugeClass(g.pct)}`}
                            style={{ width: `${g.pct}%` }} />
                        </div>
                        <span className="gauge-val">{g.pct.toFixed(0)}%</span>
                      </div>
                    ))}
                    {sysData.battery_percent != null && (
                      <div className="gauge-row">
                        <span className="gauge-label">BAT</span>
                        <div className="gauge-track">
                          <div className={`gauge-fill ${gaugeClass(100 - sysData.battery_percent)}`}
                            style={{ width: `${sysData.battery_percent}%` }} />
                        </div>
                        <span className="gauge-val">{sysData.battery_percent}%</span>
                      </div>
                    )}
                    <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10,
                      color: 'var(--text-muted)', letterSpacing: 1 }}>
                      RAM: {sysData.ram_used_gb}GB / {sysData.ram_total_gb}GB
                    </div>
                  </>
                ) : (
                  <div className="hud-loading">AWAITING DAEMON…</div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom section: Chart + Tasks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16,
            padding: '16px 20px', flex: 1, overflow: 'hidden' }}>

            {/* 7-day analytics chart */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">7-DAY ACTIVITY</span>
              </div>
              <div className="panel-body" style={{ height: 'calc(100% - 44px)' }}>
                {rows.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" id="analytics-chart">
                    <AreaChart data={rows} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="deepGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="distGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#ff6b35" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.07)" />
                      <XAxis dataKey="day" tick={{ fill: 'rgba(200,230,255,0.4)', fontSize: 10,
                        fontFamily: 'Share Tech Mono' }}
                        tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fill: 'rgba(200,230,255,0.4)', fontSize: 10,
                        fontFamily: 'Share Tech Mono' }} unit="h" />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Share Tech Mono',
                        color: 'rgba(200,230,255,0.5)' }} />
                      <Area type="monotone" dataKey="deep_work_minutes" name="Deep Work"
                        stroke="#00d4ff" strokeWidth={2} fill="url(#deepGrad)" />
                      <Area type="monotone" dataKey="distraction_minutes" name="Distraction"
                        stroke="#ff6b35" strokeWidth={1.5} fill="url(#distGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="hud-loading">NO ACTIVITY DATA</div>
                )}
              </div>
            </div>

            {/* Today's tasks */}
            <div className="panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div className="panel-header">
                <span className="panel-title">TODAY'S TASKS</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: 'var(--text-muted)' }}>{tasks.length} ITEMS</span>
              </div>
              <div className="panel-body" style={{ overflowY: 'auto', flex: 1 }} id="task-list">
                {tasks.length === 0 ? (
                  <div className="hud-loading">NO TASKS TODAY</div>
                ) : (
                  tasks.map(t => (
                    <div key={t.id} className="task-item">
                      <span className={`task-dot ${priorityClass(t.priority)}`} />
                      <span className="task-title">{t.title}</span>
                      <span className={`task-badge ${t.status}`}>{t.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    ```

    ---

    **`frontend/src/components/BriefingPanel.tsx`:**
    ```tsx
    import { useApi } from '../hooks/useApi';

    interface BriefingData { date: string; content: string; path: string; }
    interface Props { apiBase: string; }

    export default function BriefingPanel({ apiBase }: Props) {
      const { data, loading, error, refresh } = useApi<BriefingData>(`${apiBase}/briefing`);

      return (
        <div id="briefing-view" style={{ padding: '16px 20px', height: '100%',
          display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span className="panel-title" style={{ flex: 1 }}>MORNING BRIEFING</span>
            {data && (
              <span id="briefing-date" style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--text-muted)', letterSpacing: 2 }}>{data.date}</span>
            )}
            <button id="briefing-refresh-btn" className="hud-btn" onClick={refresh} disabled={loading}>
              {loading ? 'LOADING' : 'REFRESH'}
            </button>
          </div>

          {error && <div className="hud-error">{error}</div>}

          <div className="panel" style={{ flex: 1, overflow: 'hidden', display: 'flex',
            flexDirection: 'column' }}>
            <div className="panel-body" style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div className="hud-loading">DECRYPTING BRIEFING…</div>
              ) : data?.content ? (
                <pre className="briefing-pre" id="briefing-content">{data.content}</pre>
              ) : (
                <div className="briefing-empty" id="briefing-empty">
                  NO BRIEFING AVAILABLE<br />
                  <span style={{ fontSize: 10, marginTop: 8, display: 'block' }}>
                    SAY: "HEY ZENO, GENERATE MY MORNING BRIEFING"
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    ```

    ---

    **`frontend/src/components/Overlay.tsx`:**
    ```tsx
    import { useState, useRef, useEffect } from 'react';
    import { invoke } from '@tauri-apps/api/core';
    import { getCurrentWindow } from '@tauri-apps/api/window';

    export default function Overlay() {
      const [text, setText]     = useState('');
      const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
      const inputRef = useRef<HTMLTextAreaElement>(null);

      useEffect(() => { inputRef.current?.focus(); }, []);

      const save = async () => {
        if (!text.trim() || status === 'saving') return;
        setStatus('saving');
        try {
          const apiBase = await invoke<string>('get_api_base');
          const r = await fetch(`${apiBase}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text.trim(), source: 'overlay' }),
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          setStatus('saved');
          setText('');
          setTimeout(() => getCurrentWindow().hide(), 500);
        } catch (e) {
          setStatus('error');
          console.error(e);
        }
      };

      const onKey = (e: React.KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') save();
        if (e.key === 'Escape') getCurrentWindow().hide();
      };

      return (
        <div id="overlay-root" style={{
          height: '100vh', padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
          background: '#080d18', border: '1px solid rgba(0,212,255,0.5)',
          borderRadius: 8, boxSizing: 'border-box',
          boxShadow: '0 0 32px rgba(0,212,255,0.15)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 3,
              color: '#00d4ff', textShadow: '0 0 8px #00d4ff' }}>⚡ QUICK CAPTURE</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'rgba(200,230,255,0.3)' }}>CTRL+ENTER SAVE · ESC CLOSE</span>
          </div>

          <textarea
            ref={inputRef}
            id="overlay-input"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Capture a thought, task, or note…"
            style={{
              flex: 1, resize: 'none', outline: 'none',
              background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 4, padding: '8px 10px',
              fontFamily: 'Share Tech Mono, monospace', fontSize: 12,
              color: '#c8e6ff', lineHeight: 1.6,
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            {status === 'saved' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--green)' }}>✓ CAPTURED</span>}
            {status === 'error' && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--red)' }}>✗ FAILED</span>}
            <button
              id="overlay-save-btn"
              className="hud-btn primary"
              onClick={save}
              disabled={!text.trim() || status === 'saving'}
            >
              {status === 'saving' ? 'SAVING…' : 'SAVE'}
            </button>
          </div>
        </div>
      );
    }
    ```

    ---

    **`frontend/src/components/Settings.tsx`** — read-only observation view:
    ```tsx
    import { useApi } from '../hooks/useApi';

    interface SettingsData {
      user_name: string|null; wake_word: string|null; tts_engine: string|null;
      stt_model: string|null; claude_model: string|null;
      working_hours_start: string|null; working_hours_end: string|null; timezone: string|null;
    }

    interface Props { apiBase: string; }

    const LABELS: Record<keyof SettingsData, string> = {
      user_name: 'OPERATOR', wake_word: 'WAKE WORD', tts_engine: 'TTS ENGINE',
      stt_model: 'STT MODEL', claude_model: 'LLM MODEL',
      working_hours_start: 'SHIFT START', working_hours_end: 'SHIFT END', timezone: 'TIMEZONE',
    };

    export default function Settings({ apiBase }: Props) {
      const { data, loading, error } = useApi<{ settings: SettingsData }>(`${apiBase}/settings`);

      return (
        <div id="settings-view" style={{ padding: '16px 20px' }}>
          <div className="panel-title" style={{ marginBottom: 20 }}>SYSTEM CONFIGURATION</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
            marginBottom: 20, letterSpacing: 1 }}>
            READ-ONLY — USE VOICE COMMANDS TO MODIFY SETTINGS
          </p>

          {error && <div className="hud-error">{error}</div>}
          {loading && <div className="hud-loading">LOADING CONFIG…</div>}

          {data && (
            <div className="panel" style={{ maxWidth: 480 }}>
              <div className="panel-body">
                {(Object.keys(LABELS) as (keyof SettingsData)[]).map(key => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '8px 0',
                    borderBottom: '1px solid var(--border-dim)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
                      color: 'var(--text-muted)', letterSpacing: 2 }}>{LABELS[key]}</span>
                    <span id={`setting-${key}`} style={{ fontFamily: 'var(--font-mono)',
                      fontSize: 11, color: 'var(--cyan)' }}>
                      {data.settings[key] ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    ```

    ---

    **Updated `frontend/src/App.tsx`** — full wiring with WebSocket and Tauri event listener:
    ```tsx
    import { useState, useEffect } from 'react';
    import { invoke } from '@tauri-apps/api/core';
    import { listen } from '@tauri-apps/api/event';
    import SystemBar from './components/SystemBar';
    import Dashboard from './components/Dashboard';
    import BriefingPanel from './components/BriefingPanel';
    import Settings from './components/Settings';
    import Overlay from './components/Overlay';
    import { useDaemonWs } from './hooks/useDaemonWs';
    import './index.css';

    type View = 'dashboard' | 'briefing' | 'tasks' | 'settings';
    const isOverlay = window.location.hash === '#/overlay';

    export default function App() {
      const [view, setView]         = useState<View>('dashboard');
      const [apiBase, setApiBase]   = useState('http://127.0.0.1:8766');
      const [ttsActive, setTtsActive] = useState(false);

      // Resolve API base from Tauri
      useEffect(() => {
        if (!isOverlay) {
          invoke<string>('get_api_base').then(setApiBase).catch(() => {});
        }
      }, []);

      // Listen for daemon_state events from Tauri tray actions (focus/mute toggles)
      useEffect(() => {
        if (isOverlay) return;
        const unlisten = listen<Record<string, unknown>>('daemon_state', (ev) => {
          // Re-poll /system automatically; nothing specific needed here
          console.log('[ZENO] daemon_state:', ev.payload);
        });
        return () => { unlisten.then(f => f()); };
      }, []);

      // WebSocket real-time events from Python daemon
      useDaemonWs((msg) => {
        if (msg.type === 'overlay_show') {
          // Python daemon sent overlay trigger — show overlay window via Tauri
          invoke('show_overlay_window').catch(console.error);
        }
        if (msg.type === 'tts_active') {
          setTtsActive(Boolean(msg.active));
        }
      });

      if (isOverlay) return <Overlay />;

      const navItems = [
        { id: 'dashboard' as View, label: 'DASHBOARD' },
        { id: 'briefing'  as View, label: 'BRIEFING' },
        { id: 'tasks'     as View, label: 'TASKS' },
        { id: 'settings'  as View, label: 'SETTINGS' },
      ];

      return (
        <div className="app-shell">
          <nav className="sidebar">
            <div className="logo">ZENO</div>
            <div className="logo-sub">J.A.R.V.I.S. v1.0</div>
            {navItems.map(({ id, label }) => (
              <button key={id} id={`nav-${id}`}
                className={`nav-btn ${view === id ? 'active' : ''}`}
                onClick={() => setView(id)}>
                <span className="nav-indicator" />
                {label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
            <SystemBar apiBase={apiBase} />
            <main className="main-content" style={{ flex: 1, overflow: 'hidden' }}>
              {view === 'dashboard' && <Dashboard apiBase={apiBase} ttsActive={ttsActive} />}
              {view === 'briefing'  && <BriefingPanel apiBase={apiBase} />}
              {view === 'tasks'     && (
                <div id="tasks-view" style={{ padding: '16px 20px' }}>
                  <div className="panel-title" style={{ marginBottom: 16 }}>FULL TASK LIST</div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-muted)', letterSpacing: 1 }}>
                    USE VOICE: "HEY ZENO, SHOW MY TASKS"
                  </p>
                </div>
              )}
              {view === 'settings'  && <Settings apiBase={apiBase} />}
            </main>
          </div>
        </div>
      );
    }
    ```

    Avoid: any data mutation (forms, inputs) outside the Overlay. Avoid: import of any routing library. Avoid: inline styles where a CSS class already covers the need.
  </action>
  <verify>python -c "
import os
files = {
    'frontend/src/components/Dashboard.tsx':   ['dashboard-view', 'ArcReactor', 'analytics-chart', 'task-list', 'gauge-row'],
    'frontend/src/components/BriefingPanel.tsx': ['briefing-view', 'briefing-content', 'briefing-empty', 'briefing-refresh-btn'],
    'frontend/src/components/Overlay.tsx':      ['overlay-root', 'overlay-input', 'overlay-save-btn'],
    'frontend/src/components/Settings.tsx':     ['settings-view', 'READ-ONLY', 'setting-'],
    'frontend/src/App.tsx':                     ['useDaemonWs', 'overlay_show', 'SystemBar', 'ttsActive', 'daemon_state'],
}
for path, keywords in files.items():
    assert os.path.exists(path), f'Missing: {path}'
    content = open(path).read()
    for kw in keywords:
        assert kw in content, f'{path} missing keyword: {kw}'
print('Plan 9.3 task 2 OK — all files and keywords present')
"</verify>
  <done>
    - `Dashboard.tsx` has `id="dashboard-view"`, `id="analytics-chart"`, `id="task-list"`.
    - `Dashboard.tsx` renders `<ArcReactor active={ttsActive} />` and system gauge bars.
    - `Dashboard.tsx` uses Recharts `AreaChart` with gradient fills for deep work and distraction.
    - `BriefingPanel.tsx` has `id="briefing-content"`, `id="briefing-empty"`, `id="briefing-refresh-btn"`, `id="briefing-date"`.
    - `Overlay.tsx` has `id="overlay-root"`, `id="overlay-input"`, `id="overlay-save-btn"`.
    - `Overlay.tsx` handles Esc (hide window) and Ctrl+Enter (save + hide).
    - `Settings.tsx` has `id="settings-view"` and `id="setting-{key}"` spans — read-only, no inputs.
    - `App.tsx` imports and uses `useDaemonWs`; handles `overlay_show` message via `invoke('show_overlay_window')`.
    - `App.tsx` imports `listen` from `@tauri-apps/api/event` and listens for `daemon_state` events.
    - `App.tsx` passes `ttsActive` state to `<Dashboard>`.
    - Nav has 4 buttons with `id="nav-{view}"`.
  </done>
</task>

## Success Criteria
- [ ] `SystemBar.tsx` polls `/system` every 3s; shows CPU, GPU, RAM, battery, net stats with `id="sys-{stat}"` IDs
- [ ] `SystemBar.tsx` shows "FOCUS MODE" / "VOICE MUTED" banners when daemon flags are set
- [ ] `ArcReactor.tsx` renders SVG with rotating dashed arc, pulsing ring, counter-rotating inner arc
- [ ] `ArcReactor.tsx` toggles `arc-active` class (faster animation) when `active` prop is true
- [ ] `Dashboard.tsx` shows ArcReactor + gauge bars + Recharts AreaChart + task list
- [ ] `Dashboard.tsx` uses gradient fills on chart (`url(#deepGrad)`, `url(#distGrad)`)
- [ ] `BriefingPanel.tsx` has Refresh button + empty state text + date display
- [ ] `Overlay.tsx` saves via `POST /tasks` fetch, hides on success after 500ms
- [ ] `Overlay.tsx` Esc → hide window; Ctrl+Enter → save
- [ ] `Settings.tsx` is read-only — no `<input>` or `<select>` elements
- [ ] `App.tsx` handles `overlay_show` WebSocket message → `invoke('show_overlay_window')`
- [ ] `App.tsx` handles `tts_active` WebSocket message → sets `ttsActive` state → ArcReactor pulses faster
