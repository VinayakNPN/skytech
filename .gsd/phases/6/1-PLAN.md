---
phase: 6
plan: 1
wave: 1
---

# Plan 6.1: TTS Engine — Provider Interface, Worker Thread & Providers

## Objective
Build the text-to-speech subsystem with three components:

1. **`TTSProvider` ABC** — contract: `speak_sync()`, `is_available()`, `name`
2. **`TTSWorker` thread** — owns a `queue.Queue`, serialises all speech, exposes `enqueue()` + `flush()`
3. **Concrete providers** — `Pyttsx3Provider` (default), `ElevenLabsProvider` (with cache + 4-failure-mode fallback), `CoquiProvider` (stub only)

The daemon never calls a provider directly — it calls `TTSWorker.enqueue(text)`. The worker holds the provider interface, never the concrete class. Factory reads `user_profile.tts_engine` from the DB.

## Context
- `.gsd/SPEC.md` — R7 (TTS Engine)
- `.gsd/DECISIONS.md` — Phase 6: TTS Provider Interface, TTS Threading Model, ElevenLabs Caching, ElevenLabs Fallback
- `zeno/ai/providers.py` — provider ABC + lazy singleton factory pattern to mirror
- `zeno/config.py` — `get_env_key()` for `ELEVENLABS_API_KEY`
- `zeno/db.py` — `get_connection()` — used by factory to read `user_profile.tts_engine`
- `requirements.txt` — `pyttsx3` already present; `elevenlabs` to be added

## Tasks

<task type="auto">
  <name>TTSProvider ABC, TTSWorker thread, and Pyttsx3Provider</name>
  <files>
    zeno/tts/__init__.py
    zeno/tts/engine.py
    zeno/tts/worker.py
    zeno/tts/providers/__init__.py
    zeno/tts/providers/pyttsx3_provider.py
  </files>
  <action>
    **1. `zeno/tts/providers/__init__.py`** — empty module marker.

    **2. `zeno/tts/engine.py`** — Define the `TTSProvider` ABC:
    ```python
    from abc import ABC, abstractmethod

    class TTSProvider(ABC):
        @abstractmethod
        def speak_sync(self, text: str) -> None: ...
        @abstractmethod
        def is_available(self) -> bool: ...
        @property
        @abstractmethod
        def name(self) -> str: ...
    ```
    Also define `create_provider(engine_name: str, **kwargs) -> TTSProvider` factory:
    - `"pyttsx3"` → `Pyttsx3Provider()`
    - `"elevenlabs"` → `ElevenLabsProvider(api_key=kwargs.get("elevenlabs_api_key"))`
    - `"coqui"` → `CoquiProvider()` (stub)
    - Unknown → log warning, return `Pyttsx3Provider()` as fallback.
    Import providers inside the factory branches (never at module top-level).

    **3. `zeno/tts/providers/pyttsx3_provider.py`** — `Pyttsx3Provider(TTSProvider)`:
    - `__init__(self, rate: int = 175, volume: float = 1.0)`:
      - `try: import pyttsx3; self._engine = pyttsx3.init(); self._available = True`
      - `except ImportError: self._available = False; self._engine = None`
      - Set rate/volume on `self._engine` if available.
    - `speak_sync(self, text: str) -> None`:
      - If not available: `return` silently.
      - `self._engine.say(text); self._engine.runAndWait()`
    - `is_available(self) -> bool` → `self._available`
    - `name` property → `"pyttsx3"`

    **4. `zeno/tts/worker.py`** — `TTSWorker`:
    ```python
    import queue, threading, sys
    from zeno.tts.engine import TTSProvider

    _SENTINEL = None  # signals worker to stop

    class TTSWorker:
        def __init__(self, provider: TTSProvider) -> None:
            self._provider = provider
            self._queue: queue.Queue[str | None] = queue.Queue()
            self._thread = threading.Thread(target=self._run, daemon=True, name="TTSWorker")
            self._thread.start()

        def enqueue(self, text: str) -> None:
            """Non-blocking. Called from any thread (asyncio, APScheduler, etc.)."""
            self._queue.put(text)

        def flush(self) -> None:
            """Drain the queue immediately. Used for interrupt ('stop speaking')."""
            try:
                while True:
                    self._queue.get_nowait()
            except queue.Empty:
                pass

        def stop(self) -> None:
            """Signal the worker thread to exit cleanly."""
            self._queue.put(_SENTINEL)
            self._thread.join(timeout=5)

        def _run(self) -> None:
            while True:
                item = self._queue.get()
                if item is _SENTINEL:
                    break
                try:
                    self._provider.speak_sync(item)
                except Exception as e:
                    print(f"[TTSWorker] speak error: {e}", file=sys.stderr)
    ```

    **5. `zeno/tts/__init__.py`** — export:
    ```python
    from zeno.tts.engine import TTSProvider, create_provider
    from zeno.tts.worker import TTSWorker
    __all__ = ["TTSProvider", "TTSWorker", "create_provider"]
    ```

    Avoid: calling `pyttsx3.init()` more than once (it's a global singleton — one `Pyttsx3Provider` instance per process). Avoid putting the worker thread in `TTSProvider` — the worker is a separate layer.
  </action>
  <verify>python -c "from zeno.tts import TTSWorker, create_provider; p = create_provider('pyttsx3'); w = TTSWorker(p); w.stop(); print('OK')"</verify>
  <done>
    - `from zeno.tts import TTSWorker, create_provider, TTSProvider` works cleanly.
    - `create_provider('pyttsx3').is_available()` → True.
    - `TTSWorker` starts a daemon thread; `stop()` joins it within 5s.
    - `flush()` does not raise when queue is empty.
    - `create_provider('unknown_engine')` returns a `Pyttsx3Provider` (with warning to stderr) — no exception.
  </done>
</task>

<task type="auto">
  <name>ElevenLabsProvider (cache + 4-failure-mode fallback) and CoquiProvider stub</name>
  <files>
    zeno/tts/providers/elevenlabs_provider.py
    zeno/tts/providers/coqui_provider.py
    requirements.txt
  </files>
  <action>
    **1. Add `elevenlabs` to `requirements.txt`** (new line, unpinned).

    **2. `zeno/tts/providers/elevenlabs_provider.py`** — `ElevenLabsProvider(TTSProvider)`:

    **Cache logic** (`_load_cache`, `_save_cache`, `_cache_path`):
    - Cache dir: `Path.home() / "Zeno" / "tts_cache"` — create if missing.
    - `_cache_path(text: str) -> Path`: `hashlib.sha256(text.encode()).hexdigest() + ".mp3"`.
    - `_load_cache(path: Path) -> bytes | None`:
      - If file doesn't exist → None.
      - If `(now - mtime).days > 30` → delete file, return None (TTL expired).
      - Else: return `path.read_bytes()`.
    - After loading a file: check total cache size. If `sum(f.stat().st_size for f in cache_dir.iterdir()) > 50 * 1024 * 1024`: evict oldest file(s) until under cap.
    - `_save_cache(path: Path, audio_bytes: bytes) -> None`: write bytes; then enforce 50MB cap.

    **Static phrase detection** `_is_static(text: str) -> bool`:
    - Return True only if text contains NONE of: any digit, any date word (`today|tomorrow|monday|...`), any task-like pattern.
    - Simplest implementation: `bool(re.fullmatch(r"[A-Za-z ,.'!?-]+", text))` — all alphabetic/punctuation, no digits.

    **Fallback mechanism** (`_fallback`, `_announced_fallback`):
    ```python
    self._announced_fallback: bool = False
    self._fallback_provider: Pyttsx3Provider = Pyttsx3Provider()

    def _fallback(self, text: str, reason: str) -> None:
        if not self._announced_fallback:
            self._announced_fallback = True
            self._fallback_provider.speak_sync(
                "Switched to offline voice. ElevenLabs unavailable."
            )
        self._fallback_provider.speak_sync(text)
    ```

    **`__init__(self, api_key: str | None)`**:
    - If `api_key is None` → `self._available = False` (failure mode 2: key missing). Return early.
    - `try: from elevenlabs import ElevenLabs, play; self._client = ElevenLabs(api_key=api_key); self._play = play; self._available = True`
    - `except ImportError: self._available = False` (failure mode 1: package not installed). Return early.

    **`speak_sync(self, text: str) -> None`**:
    ```
    if not self._available:
        return self._fallback(text, "unavailable")
    if _is_static(text):
        path = _cache_path(text)
        cached = _load_cache(path)
        if cached:
            # play from cache (write to temp file + playsound, or use play() on bytes)
            import tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
                f.write(cached); tmp = f.name
            try: self._play(open(tmp, "rb"))
            finally: os.unlink(tmp)
            return
    try:
        audio = self._client.text_to_speech.convert(
            voice_id="Rachel", model_id="eleven_monolingual_v1", text=text
        )
        # audio is a generator — collect bytes
        audio_bytes = b"".join(audio)
        self._play(audio_bytes)
        if _is_static(text):
            _save_cache(_cache_path(text), audio_bytes)
    except Exception as e:  # failure modes 3 & 4: auth error, network error
        self._fallback(text, str(e))
    ```

    **`is_available(self) -> bool`** → `self._available`
    **`name` property** → `"elevenlabs"`

    **3. `zeno/tts/providers/coqui_provider.py`** — `CoquiProvider(TTSProvider)` stub:
    ```python
    class CoquiProvider(TTSProvider):
        def speak_sync(self, text: str) -> None:
            raise NotImplementedError("Coqui provider not yet implemented")
        def is_available(self) -> bool:
            return False
        @property
        def name(self) -> str:
            return "coqui"
    ```

    Avoid: caching dynamic text (anything with digits or dates). Avoid importing `elevenlabs` at module top-level. Avoid keeping temp files on disk if speak fails.
  </action>
  <verify>python -c "from zeno.tts.providers.elevenlabs_provider import ElevenLabsProvider; p = ElevenLabsProvider(api_key=None); print(p.is_available(), p.name)"</verify>
  <done>
    - `ElevenLabsProvider(api_key=None).is_available()` → False, `name` → "elevenlabs" — no exception.
    - `ElevenLabsProvider(api_key=None)` sets `_announced_fallback = False` initially.
    - `CoquiProvider().is_available()` → False.
    - `from zeno.tts.providers.coqui_provider import CoquiProvider` works cleanly.
    - `elevenlabs` present in `requirements.txt`.
    - `~/Zeno/tts_cache/` directory created on first ElevenLabs instantiation (or first cache write).
  </done>
</task>

## Success Criteria
- [ ] `from zeno.tts import TTSWorker, create_provider, TTSProvider` works cleanly
- [ ] `create_provider('pyttsx3')` → available `Pyttsx3Provider`
- [ ] `create_provider('elevenlabs', elevenlabs_api_key=None)` → returns `ElevenLabsProvider` with `is_available() == False` (no crash)
- [ ] `create_provider('coqui')` → stub with `is_available() == False`
- [ ] `create_provider('bogus')` → falls back to pyttsx3 with stderr warning
- [ ] `TTSWorker.enqueue()` is non-blocking; `flush()` safe on empty queue
- [ ] ElevenLabsProvider: `_announced_fallback` starts False; `_fallback()` announces once then goes silent
- [ ] Static phrase detection excludes any text containing digits
- [ ] Cache honours 30-day TTL and 50MB cap
