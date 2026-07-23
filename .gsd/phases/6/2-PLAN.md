---
phase: 6
plan: 2
wave: 1
---

# Plan 6.2: Scheduler — Registry, Runner & Job Definitions

## Objective
Implement APScheduler-based job management in three files:

1. **`scheduler_registry.py`** — all static job definitions (briefing, weekly analytics) with their misfire grace periods
2. **`runner.py`** — `ZenoScheduler` class: `BackgroundScheduler` setup, lifecycle, dynamic job API for reminders + Pomodoro
3. **`jobs.py`** — standalone job functions; each opens its own DB connection per-call via context manager

The daemon calls `ZenoScheduler.start()` at startup and `stop()` at shutdown. Reminders and Pomodoro timers are added dynamically at runtime via `scheduler.add_job()`.

## Context
- `.gsd/SPEC.md` — R11 (Scheduler), R7 (TTS Engine), R5 (Morning Briefing)
- `.gsd/DECISIONS.md` — Phase 6: Scheduler DB Access, Misfire Grace, Job Registry
- `zeno/ai/briefing.py` — `generate_morning_briefing(router, conn)` — called by briefing job
- `zeno/tts/worker.py` — `TTSWorker.enqueue(text)` — all jobs call this, never `speak_sync` directly
- `zeno/config.py` — `load_config()` — reads `morning_briefing_time`, `timezone`
- `zeno/db.py` — DB path helper for fresh per-job connections
- `requirements.txt` — `apscheduler>=3.10,<4` already present

## Tasks

<task type="auto">
  <name>scheduler_registry.py (static job specs) and jobs.py (job functions)</name>
  <files>
    zeno/scheduler/jobs.py
    zeno/scheduler/scheduler_registry.py
  </files>
  <action>
    **1. `zeno/scheduler/jobs.py`** — five standalone functions. All accept `db_path: str` (not a live connection). All open their own connection inside a `with` block. All wrap in `try/except` and print to stderr on error.

    ```python
    import asyncio, sys, sqlite3
    from datetime import date, datetime, timedelta
    from pathlib import Path

    # -- Job 1: Morning Briefing --
    def deliver_morning_briefing(db_path: str, ai_router, tts_worker) -> None:
        try:
            with sqlite3.connect(db_path) as conn:
                conn.row_factory = sqlite3.Row
                from zeno.ai.briefing import generate_morning_briefing
                text = asyncio.run(generate_morning_briefing(ai_router, conn))
            tts_worker.enqueue(text)
        except Exception as e:
            print(f"[Scheduler] Briefing error: {e}", file=sys.stderr)

    # -- Job 2: Reminder Firing --
    def fire_due_reminders(db_path: str, tts_worker) -> None:
        try:
            with sqlite3.connect(db_path) as conn:
                conn.row_factory = sqlite3.Row
                rows = conn.execute(
                    "SELECT id, message FROM reminders "
                    "WHERE trigger_at <= datetime('now') AND status = 'pending' LIMIT 10"
                ).fetchall()
                for row in rows:
                    tts_worker.enqueue(row["message"])
                    conn.execute("UPDATE reminders SET status='fired' WHERE id=?", (row["id"],))
                conn.commit()
        except Exception as e:
            print(f"[Scheduler] Reminder error: {e}", file=sys.stderr)

    # -- Job 3: Weekly Analytics --
    def regenerate_weekly_analytics(db_path: str) -> None:
        try:
            week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
            with sqlite3.connect(db_path) as conn:
                conn.row_factory = sqlite3.Row
                existing = conn.execute(
                    "SELECT 1 FROM analytics_weekly WHERE week_start = ?", (week_start,)
                ).fetchone()
                if existing:
                    return  # idempotent — already computed this week
                # Aggregate from activity_log
                row = conn.execute("""
                    SELECT
                        ROUND(SUM(CASE WHEN is_off_task=0 THEN 0.5/60.0 ELSE 0 END), 2) AS deep_work_hours
                    FROM activity_log
                    WHERE sampled_at >= ?
                """, (week_start,)).fetchone()
                tasks_done = conn.execute(
                    "SELECT COUNT(*) FROM tasks WHERE status='completed' AND updated_at >= ?",
                    (week_start,)
                ).fetchone()[0]
                conn.execute(
                    "INSERT OR REPLACE INTO analytics_weekly "
                    "(week_start, deep_work_hours, tasks_completed, generated_at) "
                    "VALUES (?, ?, ?, datetime('now'))",
                    (week_start, row["deep_work_hours"] or 0.0, tasks_done)
                )
                conn.commit()
        except Exception as e:
            print(f"[Scheduler] Analytics error: {e}", file=sys.stderr)

    # -- Jobs 4 & 5: Pomodoro --
    def pomodoro_midpoint(tts_worker, duration_minutes: int) -> None:
        tts_worker.enqueue(
            f"Halfway through your {duration_minutes}-minute focus session. Keep going!"
        )

    def pomodoro_end(tts_worker, duration_minutes: int) -> None:
        tts_worker.enqueue(
            f"Your {duration_minutes}-minute focus session is complete. Time for a break!"
        )
    ```

    Note: `asyncio.run()` inside `deliver_morning_briefing` is correct — APScheduler calls jobs in a thread pool (not inside an event loop). Do NOT use `await` here.

    **2. `zeno/scheduler/scheduler_registry.py`** — static job registry:

    ```python
    from apscheduler.triggers.cron import CronTrigger

    def register_static_jobs(scheduler, config: dict, db_path: str, ai_router, tts_worker) -> None:
        """Register all static (time-driven) jobs onto the scheduler instance."""
        zeno_cfg = config.get("zeno", {})

        # Parse morning_briefing_time "HH:MM"
        briefing_time = zeno_cfg.get("morning_briefing_time", "08:30")
        hour, minute = (int(x) for x in briefing_time.split(":"))

        from zeno.scheduler.jobs import (
            deliver_morning_briefing, regenerate_weekly_analytics
        )
        import functools

        # Briefing — 1 hour misfire grace
        scheduler.add_job(
            functools.partial(deliver_morning_briefing, db_path, ai_router, tts_worker),
            trigger=CronTrigger(hour=hour, minute=minute),
            id="morning_briefing",
            replace_existing=True,
            misfire_grace_time=3600,  # 1 hour
        )

        # Weekly analytics — Sunday 23:00, NO misfire grace (skip if missed)
        scheduler.add_job(
            functools.partial(regenerate_weekly_analytics, db_path),
            trigger=CronTrigger(day_of_week="sun", hour=23, minute=0),
            id="weekly_analytics",
            replace_existing=True,
            misfire_grace_time=None,  # skip if missed
        )
    ```

    Avoid: putting reminder polling here (it's dynamic). Avoid lambda in `functools.partial` (lambdas don't pickle — APScheduler may serialize jobs). Use `functools.partial` only.
  </action>
  <verify>python -c "from zeno.scheduler.jobs import deliver_morning_briefing, fire_due_reminders, regenerate_weekly_analytics, pomodoro_midpoint, pomodoro_end; from zeno.scheduler.scheduler_registry import register_static_jobs; print('All importable')"</verify>
  <done>
    - All 5 job functions import cleanly from `zeno.scheduler.jobs`.
    - `register_static_jobs` importable from `zeno.scheduler.scheduler_registry`.
    - `regenerate_weekly_analytics` is idempotent (safe to call twice in same week).
    - `deliver_morning_briefing` uses `asyncio.run()` — not `await`.
    - Job functions use `with sqlite3.connect(db_path) as conn:` — no shared connection.
  </done>
</task>

<task type="auto">
  <name>runner.py (ZenoScheduler lifecycle + dynamic job API)</name>
  <files>
    zeno/scheduler/runner.py
    zeno/scheduler/__init__.py
  </files>
  <action>
    **1. `zeno/scheduler/runner.py`** — `ZenoScheduler` class:

    ```python
    import functools
    from datetime import datetime, timedelta
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.date import DateTrigger
    from apscheduler.triggers.cron import CronTrigger

    class ZenoScheduler:
        def __init__(self, config: dict, db_path: str, ai_router, tts_worker) -> None:
            self._config = config
            self._db_path = db_path
            self._ai_router = ai_router
            self._tts_worker = tts_worker
            tz = config.get("zeno", {}).get("timezone", "UTC")
            self._scheduler = BackgroundScheduler(timezone=tz)
            self._running = False

        def start(self) -> None:
            from zeno.scheduler.scheduler_registry import register_static_jobs
            register_static_jobs(
                self._scheduler, self._config,
                self._db_path, self._ai_router, self._tts_worker
            )
            # Reminder polling — every minute, 5-minute misfire grace
            from zeno.scheduler.jobs import fire_due_reminders
            self._scheduler.add_job(
                functools.partial(fire_due_reminders, self._db_path, self._tts_worker),
                trigger=CronTrigger(minute="*/1"),
                id="reminder_poll",
                replace_existing=True,
                misfire_grace_time=300,  # 5 minutes
            )
            self._scheduler.start()
            self._running = True

        def stop(self) -> None:
            if self._running:
                self._scheduler.shutdown(wait=False)
                self._running = False

        def start_pomodoro_timer(self, duration_minutes: int = 25) -> str:
            """Add one-shot midpoint + end jobs. Returns base job_id prefix."""
            from zeno.scheduler.jobs import pomodoro_midpoint, pomodoro_end
            now = datetime.now()
            mid = now + timedelta(minutes=duration_minutes / 2)
            end = now + timedelta(minutes=duration_minutes)
            job_id = f"pomodoro_{int(now.timestamp())}"

            self._scheduler.add_job(
                functools.partial(pomodoro_midpoint, self._tts_worker, duration_minutes),
                trigger=DateTrigger(run_date=mid),
                id=f"{job_id}_mid",
            )
            self._scheduler.add_job(
                functools.partial(pomodoro_end, self._tts_worker, duration_minutes),
                trigger=DateTrigger(run_date=end),
                id=f"{job_id}_end",
            )
            return job_id

        def add_reminder(self, reminder_id: int, message: str, run_at: datetime) -> None:
            """Add a single dynamic reminder job (called when a reminder is created)."""
            from zeno.scheduler.jobs import fire_due_reminders
            # Fire a targeted one-shot rather than waiting for polling
            self._scheduler.add_job(
                functools.partial(fire_due_reminders, self._db_path, self._tts_worker),
                trigger=DateTrigger(run_date=run_at),
                id=f"reminder_{reminder_id}",
                misfire_grace_time=300,
                replace_existing=True,
            )

        @property
        def running(self) -> bool:
            return self._running
    ```

    **2. `zeno/scheduler/__init__.py`**:
    ```python
    """Scheduler module — APScheduler integration."""
    from zeno.scheduler.runner import ZenoScheduler

    _scheduler: ZenoScheduler | None = None

    def get_scheduler(config: dict, db_path: str, ai_router, tts_worker) -> ZenoScheduler:
        global _scheduler
        if _scheduler is None:
            _scheduler = ZenoScheduler(config, db_path, ai_router, tts_worker)
        return _scheduler

    __all__ = ["ZenoScheduler", "get_scheduler"]
    ```

    Avoid: `BlockingScheduler` (daemon must stay alive). Avoid sharing `tts_worker` or `ai_router` state across job threads — they are already thread-safe by design (`queue.Queue` in worker; `ProviderRouter` is stateless). Avoid storing the scheduler instance as a module-level mutable before `start()` is confirmed.
  </action>
  <verify>python -c "from zeno.scheduler import ZenoScheduler, get_scheduler; print(ZenoScheduler.__module__)"</verify>
  <done>
    - `from zeno.scheduler import ZenoScheduler, get_scheduler` works cleanly.
    - `ZenoScheduler` has `start()`, `stop()`, `start_pomodoro_timer()`, `add_reminder()`, `running` property.
    - `start_pomodoro_timer(25)` returns a non-empty string job_id (without a running scheduler — add_job should work even before `start()` if scheduler is not started; if it raises, note this and wrap in try/except with a warning).
    - `get_scheduler(...)` returns the same singleton on repeated calls.
    - Reminder poll job has `misfire_grace_time=300`; briefing has 3600; weekly analytics has None.
  </done>
</task>

## Success Criteria
- [ ] `from zeno.scheduler import ZenoScheduler, get_scheduler` works cleanly
- [ ] `from zeno.scheduler.jobs import deliver_morning_briefing, fire_due_reminders, regenerate_weekly_analytics, pomodoro_midpoint, pomodoro_end` — all 5 import cleanly
- [ ] `from zeno.scheduler.scheduler_registry import register_static_jobs` works cleanly
- [ ] All job functions use fresh `sqlite3.connect()` per call (no shared connections)
- [ ] Misfire grace: briefing=3600s, reminder_poll=300s, weekly_analytics=None
- [ ] `start_pomodoro_timer(25)` returns a string job_id
- [ ] `asyncio.run()` used in `deliver_morning_briefing` (not `await`)
- [ ] `functools.partial` used for all job registrations (no lambdas)
