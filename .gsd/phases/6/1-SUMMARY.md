# Phase 6 Plan 1 Summary: TTS Engine — Provider Interface, Worker Thread & Providers

## Tasks Completed

1. **TTSProvider ABC, TTSWorker thread, and Pyttsx3Provider**:
   - Created `zeno/tts/__init__.py`, `zeno/tts/engine.py`, `zeno/tts/worker.py`, `zeno/tts/providers/__init__.py`, and `zeno/tts/providers/pyttsx3_provider.py`.
   - Implemented `TTSProvider` ABC which provides the `speak_sync`, `is_available`, and `name` interfaces.
   - Built the `create_provider` factory in `engine.py` to instantiate the appropriate provider (`pyttsx3`, `elevenlabs`, `coqui`), logging a warning and falling back to `pyttsx3` on unrecognized engine names.
   - Implemented `Pyttsx3Provider` with correct error handling in case the `pyttsx3` library fails to load.
   - Implemented `TTSWorker` which runs in a daemon thread, serializes all speech requests, handles enqueuing texts efficiently, and allows flushing the queue.

2. **ElevenLabsProvider (cache + 4-failure-mode fallback) and CoquiProvider stub**:
   - Appended `elevenlabs` to `requirements.txt`.
   - Created `zeno/tts/providers/elevenlabs_provider.py` and implemented `ElevenLabsProvider`.
   - Handled multiple failure modes including missing key, package not installed, auth errors, and network errors gracefully. If ElevenLabs is unavailable, it uses `Pyttsx3Provider` as a fallback and announces the fallback once.
   - Designed a robust caching mechanism for static phrases in the `~/Zeno/tts_cache` directory, utilizing a SHA256 hashed filename based on the text. Caching avoids saving dates, digits, or tasks.
   - Enforced a 30-day TTL and a 50MB maximum limit on the cache size to avoid unbounded storage growth.
   - Created `zeno/tts/providers/coqui_provider.py` and implemented the `CoquiProvider` stub returning `NotImplementedError` for `speak_sync` and `False` for `is_available`.

## Verification
- Clean instantiation of `create_provider` for different providers (including invalid ones which fall back properly).
- `TTSWorker` starts correctly, queues work asynchronously, stops properly via a sentinel value, and allows flushing without raising exceptions.
- `ElevenLabsProvider` handles missing API keys smoothly by becoming unavailable and correctly setting its name attribute.
- Verification commands from the plan were executed and passed.
