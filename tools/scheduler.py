#!/usr/bin/env python3
"""
scheduler.py

A low-complexity scheduler daemon for Dash metric scripts.

- Reads configs from:   ROOT/content/configs/*.json
- Spawns runner:        python ROOT/runner.py --metric <metric_id>
- Stores schedule MD:   ROOT/content/prompts/orchestrator.md
- Stores logs TXT:      ROOT/content/prompts/orchestrator.txt

Key behavior:
- Each metric has its own cadence (weekly..minutely).
- Uses a min-heap on next_run (no expanded timetable).
- Runs jobs in background as subprocesses with bounded concurrency.
- Spreads process starts using:
  - alignment to schedule boundaries
  - stable per-metric jitter
  - a start-rate limiter (max starts per second)
- Coalesces overlaps: if a metric is still running when due again, it skips that run.

Important:
- This expects runner.py to support:  --metric <metric_id>
  If runner.py does not support it, jobs will fail with exit code 2 and the scheduler
  will log a clear error. (Minimal change: add argparse --metric and run only that module.)
"""
import hashlib
import heapq
import json
import os
import signal
import subprocess
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# -----------------------------
# Config
# -----------------------------

ROOT = Path(__file__).resolve().parents[1]

CONFIG_DIR = ROOT / "content" / "configs"
PROMPTS_DIR = ROOT / "content" / "prompts"
SCHEDULE_MD_PATH = PROMPTS_DIR / "scheduler.md"
LOG_TXT_PATH = PROMPTS_DIR / "scheduler.txt"
RUNNER_PATH = ROOT / "tools" / "runner.py"

# Concurrency controls
MAX_WORKERS = int(os.environ.get("DASH_SCHED_MAX_WORKERS", "4"))
MAX_STARTS_PER_SEC = int(os.environ.get("DASH_SCHED_MAX_STARTS_PER_SEC", "2"))
MAX_JITTER_SECONDS = int(os.environ.get("DASH_SCHED_MAX_JITTER_SECONDS", "10"))

# Reload / housekeeping
CONFIG_POLL_SECONDS = float(os.environ.get("DASH_SCHED_CONFIG_POLL_SECONDS", "30"))
SCHEDULE_MD_REFRESH_SECONDS = float(os.environ.get("DASH_SCHED_MD_REFRESH_SECONDS", "60"))
LOOP_TICK_SECONDS = float(os.environ.get("DASH_SCHED_LOOP_TICK_SECONDS", "1.0"))

# If true, never actually spawn subprocesses (still writes schedule + logs planned runs)
DRY_RUN = os.environ.get("DASH_SCHED_DRY_RUN", "0") == "1"

SCHEDULE_SECONDS: Dict[str, int] = {
    "weekly": 7 * 24 * 3600,
    "bi-daily": 2 * 24 * 3600,
    "daily": 24 * 3600,
    "twice-daily": 12 * 3600,
    "hourly": 3600,
    "half-hourly": 1800,
    "quarter-hourly": 900,
    "five-minutely": 300,
    "minutely": 60,
}

# -----------------------------
# Model
# -----------------------------


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: Optional[datetime]) -> str:
    if not dt:
        return "-"
    # Use Z format for readability
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def metric_label(metric_id: str) -> str:
    """
    Read label from ROOT/content/configs/<metric_id>.json.
    Fallback to metric_id if missing/unreadable (should be rare).
    """
    try:
        obj = load_json(CONFIG_DIR / f"{metric_id}.json")
        lab = obj.get("label")
        return lab if isinstance(lab, str) and lab.strip() else metric_id
    except Exception:
        return metric_id


def fmt_generated(dt: datetime) -> str:
    # DD-MM-YYYY HH:MM (UTC)
    u = dt.astimezone(timezone.utc)
    return u.strftime("%d-%m-%Y %H:%M")


def fmt_human_dt(dt: Optional[datetime], ref: datetime) -> str:
    """
    Human readable time formatting for schedule table:
    - if within 24 hours of ref: show HH:MM
    - elif within 365 days of ref: show 'Jan 9'
    - else: show "Jan 9 '26"
    """
    if not dt:
        return "-"

    dtu = dt.astimezone(timezone.utc)
    refu = ref.astimezone(timezone.utc)
    delta = abs((dtu - refu).total_seconds())

    if delta <= 24 * 3600:
        return dtu.strftime("%H:%M")

    # "within 365 days"
    if delta <= 365 * 24 * 3600:
        # Use day without leading zero in a portable way
        return f"{dtu.strftime('%b')} {dtu.day}"

    return f"{dtu.strftime('%b')} {dtu.day} '{dtu.strftime('%y')}"


def ensure_dirs() -> None:
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)


def append_log(line: str) -> None:
    """
    Plain text log file append, timestamped.
    Interleaving from subprocess output is acceptable; this is an ops log.
    """
    ensure_dirs()
    ts = iso(now_utc())
    LOG_TXT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_TXT_PATH.open("a", encoding="utf-8") as f:
        f.write(f"{ts} {line.rstrip()}\n")


def stable_jitter_seconds(metric_id: str, max_jitter: int) -> int:
    """
    Stable per-metric jitter: 0..max_jitter seconds.
    Deterministic across restarts (unlike Python's built-in hash()).
    """
    if max_jitter <= 0:
        return 0
    h = hashlib.sha1(metric_id.encode("utf-8")).digest()
    # Use first 2 bytes as integer
    n = int.from_bytes(h[:2], byteorder="big")
    return n % (max_jitter + 1)


def align_next_boundary(after: datetime, interval_s: int) -> datetime:
    """
    Align to the next interval boundary relative to Unix epoch.
    This avoids drift and keeps 'five-minutely' etc. on clean boundaries.
    """
    if interval_s <= 0:
        return after
    epoch = int(after.timestamp())
    next_epoch = ((epoch // interval_s) + 1) * interval_s
    return datetime.fromtimestamp(next_epoch, tz=timezone.utc)


def human_interval(interval_s: int) -> str:
    if interval_s % (7 * 24 * 3600) == 0:
        return f"{interval_s // (7 * 24 * 3600)}w"
    if interval_s % (24 * 3600) == 0:
        return f"{interval_s // (24 * 3600)}d"
    if interval_s % 3600 == 0:
        return f"{interval_s // 3600}h"
    if interval_s % 60 == 0:
        return f"{interval_s // 60}m"
    return f"{interval_s}s"


@dataclass
class Job:
    metric_id: str
    schedule: str
    interval_s: int
    next_run: datetime = field(default_factory=lambda: now_utc())

    # Runtime state
    last_run: Optional[datetime] = None
    last_exit: Optional[int] = None
    last_duration_ms: Optional[int] = None

    # Process tracking
    running: bool = False
    pid: Optional[int] = None
    started_at: Optional[datetime] = None


# Heap items are (next_run_ts, metric_id)
HeapItem = Tuple[float, str]


class Scheduler:
    def __init__(self) -> None:
        self.jobs: Dict[str, Job] = {}
        self.heap: List[HeapItem] = []
        self.running_procs: Dict[str, subprocess.Popen] = {}

        self._stop = False

        self._config_sig: Dict[str, float] = {}  # metric_id -> mtime
        self._last_config_scan_at = 0.0
        self._last_md_write_at = 0.0

        # start-rate limiter window
        self._starts_in_window = 0
        self._window_start = time.time()

    def stop(self) -> None:
        self._stop = True

    def install_signal_handlers(self) -> None:
        def _handle(sig: int, frame) -> None:
            append_log(f"[scheduler] received signal {sig}, shutting down")
            self.stop()

        signal.signal(signal.SIGINT, _handle)
        signal.signal(signal.SIGTERM, _handle)

    # -----------------------------
    # Config loading / reloading
    # -----------------------------

    def _scan_configs(self) -> Dict[str, Tuple[str, float]]:
        """
        Return map: metric_id -> (schedule_str, mtime)
        Invalid configs are logged and skipped.
        """
        found: Dict[str, Tuple[str, float]] = {}
        if not CONFIG_DIR.exists():
            append_log(f"[scheduler] config dir missing: {CONFIG_DIR}")
            return found

        for p in sorted(CONFIG_DIR.glob("*.json")):
            metric_id = p.stem
            try:
                st = p.stat()
                mtime = st.st_mtime
                with p.open("r", encoding="utf-8") as f:
                    obj = json.load(f)
                sched = obj.get("schedule")
                if sched not in SCHEDULE_SECONDS:
                    append_log(f"[scheduler] invalid schedule '{sched}' in {p.name}, skipping")
                    continue
                found[metric_id] = (sched, mtime)
            except Exception as e:
                append_log(f"[scheduler] failed to read {p.name}: {e}")
        return found

    def reload_configs_if_needed(self, force: bool = False) -> None:
        now = time.time()
        if not force and (now - self._last_config_scan_at) < CONFIG_POLL_SECONDS:
            return

        self._last_config_scan_at = now
        found = self._scan_configs()

        # Detect changes/adds/removes
        changed = False

        # removed
        for metric_id in list(self.jobs.keys()):
            if metric_id not in found:
                changed = True
                append_log(f"[scheduler] removed job: {metric_id}")
                self.jobs.pop(metric_id, None)
                # if running, let it finish, but we won't reschedule it

        # add/change
        for metric_id, (sched, mtime) in found.items():
            prev = self._config_sig.get(metric_id)
            if prev is None or prev != mtime:
                self._config_sig[metric_id] = mtime
                interval_s = SCHEDULE_SECONDS[sched]

                if metric_id in self.jobs:
                    job = self.jobs[metric_id]
                    if job.schedule != sched or job.interval_s != interval_s:
                        changed = True
                        append_log(f"[scheduler] updated job: {metric_id} schedule {job.schedule}->{sched}")
                        job.schedule = sched
                        job.interval_s = interval_s
                        # recompute next_run aligned from now
                        job.next_run = self._compute_next_run(metric_id, now_utc())
                    # else: mtime changed but schedule same; no scheduling change
                else:
                    changed = True
                    job = Job(metric_id=metric_id, schedule=sched, interval_s=interval_s)
                    job.next_run = self._compute_next_run(metric_id, now_utc())
                    self.jobs[metric_id] = job
                    append_log(f"[scheduler] added job: {metric_id} schedule={sched}")

        if changed or force:
            self._rebuild_heap()

    def _rebuild_heap(self) -> None:
        self.heap.clear()
        for metric_id, job in self.jobs.items():
            # Keep next_run as-is if it is in the future; otherwise re-align
            if job.next_run <= now_utc():
                job.next_run = self._compute_next_run(metric_id, now_utc())
            heapq.heappush(self.heap, (job.next_run.timestamp(), metric_id))
        append_log(f"[scheduler] heap rebuilt with {len(self.heap)} jobs")
        self.write_schedule_md(force=True)

    def _compute_next_run(self, metric_id: str, ref: datetime) -> datetime:
        interval_s = self.jobs[metric_id].interval_s if metric_id in self.jobs else 60
        base = align_next_boundary(ref, interval_s)
        jitter = stable_jitter_seconds(metric_id, MAX_JITTER_SECONDS)
        return base + timedelta(seconds=jitter)

    # -----------------------------
    # Process control
    # -----------------------------

    def _rate_limit_allows_start(self) -> bool:
        now = time.time()
        if now - self._window_start >= 1.0:
            self._window_start = now
            self._starts_in_window = 0
        return self._starts_in_window < MAX_STARTS_PER_SEC

    def _note_start(self) -> None:
        self._starts_in_window += 1

    def _spawn_metric(self, metric_id: str) -> Optional[subprocess.Popen]:
        """
        Spawn tools.runner --metric <metric_id>. Output goes to scheduler.txt.
        """
        if not RUNNER_PATH.is_file():
            append_log(f"[scheduler] ERROR runner not found: {RUNNER_PATH}")
            return None

        cmd = [
            sys.executable,
            "-m",
            "tools.runner",
            "--metric",
            metric_id,
        ]

        if DRY_RUN:
            append_log(f"[scheduler] DRY_RUN would start: {' '.join(cmd)}")
            return None

        ensure_dirs()
        log_f = LOG_TXT_PATH.open("a", encoding="utf-8")

        try:
            p = subprocess.Popen(
                cmd,
                cwd=str(ROOT),   # critical: repo root must be on sys.path
                stdout=log_f,
                stderr=log_f,
                close_fds=True,
            )
            return p
        except Exception as e:
            append_log(f"[scheduler] ERROR failed to spawn {metric_id}: {e}")
            try:
                log_f.close()
            except Exception:
                pass
            return None

    def _reap_finished(self) -> None:
        """
        Check for completed subprocesses and update job state.
        """
        for metric_id, proc in list(self.running_procs.items()):
            rc = proc.poll()
            if rc is None:
                continue

            self.running_procs.pop(metric_id, None)
            job = self.jobs.get(metric_id)
            finished_at = now_utc()

            if job:
                job.running = False
                job.pid = None
                job.last_exit = rc
                if job.started_at:
                    dur_ms = int((finished_at - job.started_at).total_seconds() * 1000)
                    job.last_duration_ms = dur_ms
                job.started_at = None

            append_log(f"[scheduler] finished {metric_id} exit={rc}")

            # Common failure if runner.py doesn't support --metric: exit code 2 from argparse.
            if rc == 2:
                append_log(
                    f"[scheduler] NOTE {metric_id} exited with code 2; "
                    f"runner.py may not support '--metric'. Add argparse handling in runner.py."
                )

    # -----------------------------
    # Scheduling loop
    # -----------------------------

    def _pop_due_jobs(self, ref: datetime) -> List[Job]:
        due: List[Job] = []
        ref_ts = ref.timestamp()

        while self.heap and self.heap[0][0] <= ref_ts:
            _, metric_id = heapq.heappop(self.heap)
            job = self.jobs.get(metric_id)
            if job is None:
                continue
            due.append(job)

        return due

    def _push_job(self, job: Job) -> None:
        heapq.heappush(self.heap, (job.next_run.timestamp(), job.metric_id))

    def _schedule_next(self, job: Job, ref: datetime) -> None:
        # Align from "ref" rather than last_run to avoid drift.
        base = align_next_boundary(ref, job.interval_s)
        jitter = stable_jitter_seconds(job.metric_id, MAX_JITTER_SECONDS)
        job.next_run = base + timedelta(seconds=jitter)

    def run_forever(self) -> None:
        append_log(f"[scheduler] starting (max_workers={MAX_WORKERS}, max_starts_per_sec={MAX_STARTS_PER_SEC})")
        append_log(f"[scheduler] configs={CONFIG_DIR} runner={RUNNER_PATH}")
        append_log(f"[scheduler] md={SCHEDULE_MD_PATH} log={LOG_TXT_PATH}")

        self.reload_configs_if_needed(force=True)

        while not self._stop:
            # Reload configs periodically
            self.reload_configs_if_needed(force=False)

            # Reap finished subprocesses
            self._reap_finished()

            # Decide sleep based on next due job
            now_dt = now_utc()
            next_ts = self.heap[0][0] if self.heap else None
            if next_ts is None:
                time.sleep(LOOP_TICK_SECONDS)
                self.write_schedule_md(force=False)
                continue

            # Sleep a bit, but stay responsive
            sleep_s = max(0.0, next_ts - now_dt.timestamp())
            time.sleep(min(sleep_s, LOOP_TICK_SECONDS))

            now_dt = now_utc()

            # Pull due jobs
            due_jobs = self._pop_due_jobs(now_dt)
            if not due_jobs:
                self.write_schedule_md(force=False)
                continue

            # Start due jobs, respecting concurrency and start rate limit
            for job in due_jobs:
                # If removed between pop and now
                if job.metric_id not in self.jobs:
                    continue

                # Coalesce overlaps: if running, skip this run.
                if job.metric_id in self.running_procs or job.running:
                    append_log(f"[scheduler] coalesce (still running): {job.metric_id}")
                    self._schedule_next(job, now_dt)
                    self._push_job(job)
                    continue

                # Concurrency cap: if too many running, nudge by 1s and retry soon
                if len(self.running_procs) >= MAX_WORKERS:
                    job.next_run = now_dt + timedelta(seconds=1)
                    self._push_job(job)
                    continue

                # Start-rate cap
                if not self._rate_limit_allows_start():
                    job.next_run = now_dt + timedelta(seconds=1)
                    self._push_job(job)
                    continue

                # Launch
                self._note_start()
                append_log(f"[scheduler] starting {job.metric_id} ({job.schedule})")

                job.last_run = now_dt
                job.running = True
                job.started_at = now_dt

                proc = self._spawn_metric(job.metric_id)
                if proc is not None:
                    self.running_procs[job.metric_id] = proc
                    job.pid = proc.pid
                else:
                    # Spawn failed; mark not running and record as exit=-1
                    job.running = False
                    job.pid = None
                    job.last_exit = -1
                    job.started_at = None

                # Schedule next run
                self._schedule_next(job, now_dt)
                self._push_job(job)

            self.write_schedule_md(force=False)

        # Shutdown: do not kill children by default; log and exit.
        if self.running_procs:
            append_log(f"[scheduler] exiting with {len(self.running_procs)} running processes still active")
        append_log("[scheduler] stopped")

    # -----------------------------
    # Markdown schedule
    # -----------------------------

    def write_schedule_md(self, force: bool = False) -> None:
        now = time.time()
        if not force and (now - self._last_md_write_at) < SCHEDULE_MD_REFRESH_SECONDS:
            return
        self._last_md_write_at = now

        ensure_dirs()

        now_dt = now_utc()

        lines: List[str] = []
        lines.append("# Schedule")
        lines.append("")
        lines.append(f"Generated: {fmt_generated(now_dt)}")
        lines.append("")
        lines.append(f"- Configs: `{CONFIG_DIR}`")
        lines.append(f"- Runner: `{RUNNER_PATH}`")
        lines.append(f"- Max workers: `{MAX_WORKERS}`")
        lines.append(f"- Max starts/sec: `{MAX_STARTS_PER_SEC}`")
        lines.append(f"- Jitter (stable): `0..{MAX_JITTER_SECONDS}s`")
        lines.append(f"- Overlap policy: `coalesce` (skip if still running)")
        lines.append("")

        # Updated table schema (remove interval/running/pid; use label link instead of metric_id)
        lines.append("| metric | schedule | next run | last run | last_exit | last_dur_ms |")
        lines.append("|---|---|---|---|---:|---:|")

        for metric_id in sorted(self.jobs.keys()):
            job = self.jobs[metric_id]

            label = metric_label(metric_id)
            metric_cell = f'<a href="/{metric_id}">{label}</a>'

            lines.append(
                f"| {metric_cell} | {job.schedule} | "
                f"{fmt_human_dt(job.next_run, now_dt)} | {fmt_human_dt(job.last_run, now_dt)} | "
                f"{job.last_exit if job.last_exit is not None else '-'} | "
                f"{job.last_duration_ms if job.last_duration_ms is not None else '-'} |"
            )

        tmp = SCHEDULE_MD_PATH.with_suffix(SCHEDULE_MD_PATH.suffix + ".tmp")
        with tmp.open("w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, SCHEDULE_MD_PATH)


def main() -> int:
    ensure_dirs()

    s = Scheduler()
    s.install_signal_handlers()

    # Basic sanity log
    if not CONFIG_DIR.exists():
        append_log(f"[scheduler] WARNING config dir does not exist: {CONFIG_DIR}")
    if not RUNNER_PATH.exists():
        append_log(f"[scheduler] WARNING runner.py does not exist: {RUNNER_PATH}")

    try:
        s.run_forever()
        return 0
    except Exception as e:
        append_log(f"[scheduler] FATAL {e}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
