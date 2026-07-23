# Plan 6.2: Scheduler — Registry, Runner & Job Definitions (Summary)

## Work Completed

1. **Job Definitions (`zeno/scheduler/jobs.py`)**:
   - Created standalone functions for each job (`deliver_morning_briefing`, `fire_due_reminders`, `regenerate_weekly_analytics`, `pomodoro_midpoint`, `pomodoro_end`).
   - Ensured each job that requires database access opens its own fresh `sqlite3` connection using `with sqlite3.connect(db_path) as conn:` to avoid cross-thread connection sharing issues.
   - Handled `asyncio.run()` execution for async functions correctly within job functions without polluting the event loop.
   - Added appropriate try/except blocks to catch exceptions without crashing the scheduler.

2. **Scheduler Registry (`zeno/scheduler/scheduler_registry.py`)**:
   - Created `register_static_jobs()` to bind static jobs (`morning_briefing` and `weekly_analytics`) via `CronTrigger`.
   - Used `functools.partial` to bind arguments to avoid serialization/lambda pickling issues with APScheduler.
   - Set configured misfire grace times (3600s for briefing, skipped for weekly analytics).

3. **Scheduler Runner (`zeno/scheduler/runner.py`)**:
   - Implemented `ZenoScheduler` wrapping `BackgroundScheduler`.
   - Added dynamic job APIs: `start_pomodoro_timer()` and `add_reminder()`, which create one-shot `DateTrigger` tasks on the fly.
   - Ensured the scheduler starts the reminder polling job internally with a 5-minute misfire grace period on a `*/1` minute interval.
   - Provided lifecycle methods `start()` and `stop()`.

4. **Package Initialization (`zeno/scheduler/__init__.py`)**:
   - Exposed `ZenoScheduler` and `get_scheduler` function, acting as a singleton factory.

## Verification
- Verified all jobs are importable from `zeno.scheduler.jobs`.
- Verified `register_static_jobs` is importable.
- Verified `ZenoScheduler` and `get_scheduler` can be imported and expose the correct module scope.
- Verified `apscheduler` was properly installed and functional.
