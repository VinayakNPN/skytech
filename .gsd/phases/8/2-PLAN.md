---
phase: 8
plan: 2
wave: 1
---

# Plan 8.2: Browser Extension (manifest + background + content)

## Objective
Build the Manifest V3 browser extension that tracks active tabs and sends dwell-time events to the Python WebSocket daemon at `ws://localhost:8765`.

Three files:
- **`manifest.json`** — MV3 manifest. Chrome 88+, Edge 88+, Firefox 121+. MV3-only: no MV2 fallback.
- **`background.js`** — Service worker: tab state machine, dwell-time tracking, WebSocket manager with reconnect backoff, sends `tab_open` / `tab_close` / `ping`. Sends `page_title` (redaction happens server-side). Port hardcoded to `8765`.
- **`content.js`** — Minimal Page Visibility API listener → `page_hidden` / `page_visible` messages to background.

## Context
- `.gsd/SPEC.md` — R9: active tab tracking, domain dwell time, WebSocket to Python daemon
- `.gsd/DECISIONS.md` — Phase 8: MV3-only (no Firefox MV2 fallback); port 8765 hardcoded in both JS and Python; page_title sent, server-side redaction; Firefox < 121 not supported
- `zeno_schema.sql` — `browser_sessions`: `browser`, `domain`, `page_title`, `url_category`, `started_at`, `ended_at`, `dwell_seconds`

## Tasks

<task type="auto">
  <name>manifest.json — Manifest V3 extension descriptor</name>
  <files>
    zeno/extension/manifest.json
  </files>
  <action>
    Create `zeno/extension/manifest.json`:

    ```json
    {
      "manifest_version": 3,
      "name": "ZENO Activity Tracker",
      "version": "1.0.0",
      "description": "Tracks browser tab dwell time and sends data to the ZENO personal assistant daemon.",
      "_comment_browsers": "Minimum supported: Chrome 88+, Edge 88+, Firefox 121+ (MV3 service worker). Firefox < 121 not supported.",

      "permissions": [
        "tabs",
        "activeTab",
        "storage"
      ],

      "host_permissions": [
        "ws://localhost:8765/*"
      ],

      "background": {
        "service_worker": "background.js",
        "type": "module"
      },

      "content_scripts": [
        {
          "matches": ["<all_urls>"],
          "js": ["content.js"],
          "run_at": "document_start"
        }
      ],

      "action": {
        "default_title": "ZENO Activity Tracker"
      }
    }
    ```

    Note: `_comment_browsers` is a non-standard key — Chrome and Firefox ignore unknown keys. This is the canonical place to document browser support requirements.
  </action>
  <verify>python -c "import json; d = json.load(open('zeno/extension/manifest.json')); assert d['manifest_version'] == 3; assert 'tabs' in d['permissions']; assert d['background']['service_worker'] == 'background.js'; print('manifest.json valid')"</verify>
  <done>
    - `zeno/extension/manifest.json` is valid JSON.
    - `manifest_version` is 3.
    - `permissions` contains `tabs` and `activeTab`.
    - `background.service_worker` is `"background.js"`.
    - Browser support comment present.
  </done>
</task>

<task type="auto">
  <name>background.js + content.js — tab state machine, WebSocket manager, visibility reporter</name>
  <files>
    zeno/extension/background.js
    zeno/extension/content.js
  </files>
  <action>
    **`zeno/extension/background.js`** — MV3 service worker:

    ```javascript
    // ZENO Browser Extension — background.js (Manifest V3 Service Worker)
    //
    // WebSocket server: ws://localhost:8765
    // PORT IS HARDCODED — if changed here, also change in zeno/monitor/ws_server.py (PORT constant).
    //
    // Message schema sent to Python server:
    // tab_open:  { type: "tab_open",  browser, domain, page_title, url_category, started_at }
    // tab_close: { type: "tab_close", domain, dwell_seconds }
    // ping:      { type: "ping" }
    //
    // page_title is sent; redaction happens server-side per privacy_exclusions.

    const WS_URL = "ws://localhost:8765";   // Must match zeno/monitor/ws_server.py PORT = 8765
    const PING_INTERVAL_MS   = 30_000;
    const RECONNECT_DELAY_MS = 5_000;
    const MAX_RECONNECT_ATTEMPTS = 10;

    function detectBrowser() {
      const ua = navigator.userAgent;
      if (ua.includes("Edg/"))     return "edge";
      if (ua.includes("Firefox/")) return "firefox";
      return "chrome";
    }

    // Domain → url_category mapping (server does final classification for unknowns)
    const CATEGORY_PATTERNS = {
      work:     ["github.com", "gitlab.com", "jira.", "confluence.", "notion.so",
                 "linear.app", "vercel.com", "figma.com"],
      research: ["stackoverflow.com", "docs.", "wikipedia.org", "developer.",
                 "mdn.", "arxiv.org", "npmjs.com"],
      social:   ["twitter.com", "x.com", "reddit.com", "instagram.com",
                 "facebook.com", "linkedin.com"],
      video:    ["youtube.com", "netflix.com", "twitch.tv", "vimeo.com"],
      news:     ["news.", "bbc.com", "cnn.com", "techcrunch.com"],
      email:    ["gmail.com", "outlook.", "mail.google.com", "proton.me"],
    };

    function categorize(domain) {
      const lower = domain.toLowerCase();
      for (const [cat, patterns] of Object.entries(CATEGORY_PATTERNS)) {
        if (patterns.some(p => lower.includes(p))) return cat;
      }
      return "unknown";
    }

    function extractDomain(url) {
      try { return new URL(url).hostname.replace(/^www\./, ""); }
      catch { return "unknown"; }
    }

    // ── WebSocket manager ──────────────────────────────────────────────────────

    let ws = null;
    let reconnectAttempts = 0;
    let pingTimer = null;

    function connect() {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn("[ZENO] Max reconnect attempts reached. Browser tracking paused.");
        return;
      }
      ws = new WebSocket(WS_URL);

      ws.addEventListener("open", () => {
        reconnectAttempts = 0;
        pingTimer = setInterval(() => send({ type: "ping" }), PING_INTERVAL_MS);
      });

      ws.addEventListener("close", () => {
        ws = null;
        clearInterval(pingTimer);
        pingTimer = null;
        reconnectAttempts++;
        setTimeout(connect, RECONNECT_DELAY_MS);
      });

      ws.addEventListener("error", () => { /* close event handles reconnect */ });
    }

    function send(data) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }

    // ── Tab state machine ──────────────────────────────────────────────────────

    // One active session at a time (the focused tab in the current window)
    let activeSession = null;  // { tabId, domain, pageTitle, startedAt }

    function openSession(tab) {
      if (!tab || !tab.url) return;
      // Skip browser internal pages
      if (tab.url.startsWith("chrome://") || tab.url.startsWith("about:") ||
          tab.url.startsWith("edge://")   || tab.url.startsWith("moz-extension://")) return;

      const domain = extractDomain(tab.url);
      activeSession = {
        tabId:     tab.id,
        domain,
        pageTitle: tab.title || "",
        startedAt: new Date().toISOString(),
      };
      send({
        type:         "tab_open",
        browser:      detectBrowser(),
        domain,
        page_title:   activeSession.pageTitle,
        url_category: categorize(domain),
        started_at:   activeSession.startedAt,
      });
    }

    function closeSession() {
      if (!activeSession) return;
      const dwellSeconds = Math.round(
        (Date.now() - new Date(activeSession.startedAt).getTime()) / 1000
      );
      send({ type: "tab_close", domain: activeSession.domain, dwell_seconds: dwellSeconds });
      activeSession = null;
    }

    // ── Chrome event listeners ─────────────────────────────────────────────────

    chrome.tabs.onActivated.addListener(({ tabId }) => {
      closeSession();
      chrome.tabs.get(tabId, tab => {
        if (!chrome.runtime.lastError) openSession(tab);
      });
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Only care about full-load completions on the active tab
      if (changeInfo.status === "complete" && tab.active) {
        closeSession();
        openSession(tab);
      }
    });

    chrome.tabs.onRemoved.addListener(tabId => {
      if (activeSession && activeSession.tabId === tabId) closeSession();
    });

    // Content script relay — visibility events
    chrome.runtime.onMessage.addListener(message => {
      if (message.type === "page_hidden") closeSession();
      if (message.type === "page_visible") {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs[0]) openSession(tabs[0]);
        });
      }
    });

    // ── Startup ────────────────────────────────────────────────────────────────
    connect();
    ```

    **`zeno/extension/content.js`**:

    ```javascript
    // ZENO Browser Extension — content.js
    // Reports page visibility changes to the background service worker.
    // Injected into every page (document_start). Minimal footprint — event listener only.

    document.addEventListener("visibilitychange", () => {
      chrome.runtime.sendMessage({
        type: document.hidden ? "page_hidden" : "page_visible"
      });
    });
    ```

    Avoid: sending full URL paths (only domain + title). Avoid: `eval()`. Avoid: blocking the page thread. Avoid: storing credentials or sensitive data in extension storage.
  </action>
  <verify>python -c "
import json, pathlib
m = json.load(open('zeno/extension/manifest.json'))
assert m['manifest_version'] == 3
bg = pathlib.Path('zeno/extension/background.js').read_text()
ct = pathlib.Path('zeno/extension/content.js').read_text()
assert 'tab_open'  in bg, 'missing tab_open'
assert 'tab_close' in bg, 'missing tab_close'
assert 'ping'      in bg, 'missing ping'
assert 'MAX_RECONNECT_ATTEMPTS' in bg, 'missing reconnect cap'
assert 'page_title' in bg, 'page_title not sent'
assert 'visibilitychange' in ct, 'missing visibility listener'
assert 'eval' not in bg and 'eval' not in ct, 'eval found — CSP violation'
print('Extension files OK')
"</verify>
  <done>
    - All three extension files exist (`manifest.json`, `background.js`, `content.js`).
    - `background.js` contains `tab_open`, `tab_close`, `ping`, `MAX_RECONNECT_ATTEMPTS`.
    - `background.js` sends `page_title` field on `tab_open`.
    - `content.js` uses `visibilitychange` event.
    - No `eval()` in any extension file.
    - Port `8765` is documented with cross-reference comment to `ws_server.py`.
  </done>
</task>

## Success Criteria
- [ ] `manifest.json` is valid MV3 JSON (`manifest_version: 3`)
- [ ] `background.js` sends `tab_open` with `page_title`, `tab_close`, `ping`
- [ ] `background.js` caps reconnect at `MAX_RECONNECT_ATTEMPTS = 10`
- [ ] `background.js` has cross-reference comment linking port 8765 to `ws_server.py`
- [ ] `content.js` reports `page_hidden` / `page_visible` via `visibilitychange`
- [ ] Extension sends only domain (not full URL path) — privacy by design
- [ ] No `eval()` in any extension file
