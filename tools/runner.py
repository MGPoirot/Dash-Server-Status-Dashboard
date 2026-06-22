#!/usr/bin/env python3
"""
run_metrics.py

Runs metric scripts under content.scripts, prints points, and writes:
- content/latest/<metric_id>.json
- content/series/<metric_id>.json (append)

CLI:
  python3 run_metrics.py
  python3 run_metrics.py --metric foo_bar_baz

Import:
  from run_metrics import run_metric, run_metrics
  run_metric("foo_bar_baz")
"""
import argparse
import importlib
import json
import os
import pkgutil
import shutil
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import TypedDict, Union

import content.scripts


Scalar = Union[str, bool, float, int]


class PointBase(TypedDict):
    t: str


class StringPoint(PointBase, total=False):
    s: str
    ss: object
    meta: str


class NumericPoint(PointBase, total=False):
    v: float | int | bool
    vv: object
    meta: str


Point = Union[StringPoint, NumericPoint]


ROOT = Path(__file__).resolve().parents[1]

# Retry config — env-overridable so the scheduler can tune without code changes
_RUNNER_MAX_RETRIES = int(os.environ.get("DASH_RUNNER_MAX_RETRIES", "2"))
_RUNNER_RETRY_DELAY = float(os.environ.get("DASH_RUNNER_RETRY_DELAY", "30"))


def _utc_timestamp_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_latest(metric_id: str, point: Point, *, root: Path = ROOT) -> None:
    path = root / "content" / "latest" / f"{metric_id}.json"
    tmp = path.with_suffix(path.suffix + ".tmp")
    path.parent.mkdir(parents=True, exist_ok=True)

    obj = {
        "metric_id": metric_id,
        "points": [point],
    }

    with tmp.open("w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"), indent=2)
        f.flush()
        os.fsync(f.fileno())

    os.replace(tmp, path)


def append_series(metric_id: str, point: Point, *, root: Path = ROOT) -> None:
    path = root / "content" / "series" / f"{metric_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)

    if not path.is_file():
        shutil.copy(root / "content" / "latest" / f"{metric_id}.json", path)
        return

    tmp = path.with_suffix(path.suffix + ".tmp")

    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    points = data.setdefault("points", [])
    points.append(point)

    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"), indent=2)
        f.flush()
        os.fsync(f.fileno())

    os.replace(tmp, path)


def list_config_metric_ids(*, root: Path = ROOT) -> list[str]:
    return [p.stem for p in (root / "content" / "configs").glob("*.json")]


def list_script_metric_ids(*, package=content.scripts) -> list[str]:
    return [m for _, m, _ in pkgutil.iter_modules(package.__path__)]


def _validate_metric_id(metric_id: str) -> None:
    if len(metric_id.split("_")) != 3:
        raise ValueError(f"Invalid metric_id '{metric_id}': expected exactly 3 underscore-separated parts")


def resolve_covered_metrics(
    *,
    selected_metric: str | None,
    root: Path,
    package,
) -> tuple[list[str], list[str], list[str]]:
    configs = list_config_metric_ids(root=root)
    modules = list_script_metric_ids(package=package)

    if selected_metric:
        if selected_metric not in configs:
            raise FileNotFoundError(f'No config for metric "{selected_metric}"')
        if selected_metric not in modules:
            raise FileNotFoundError(f'No script for metric "{selected_metric}"')
        configs = [selected_metric]
        modules = [selected_metric]

    uncovered_configs = [c for c in configs if c not in modules]
    uncovered_modules = [m for m in modules if m not in configs]
    covered = [m for m in modules if m in configs]

    return covered, uncovered_configs, uncovered_modules


def _build_point(
    *,
    timestamp: str,
    value: Scalar,
    dictionary: object | None,
    meta: str | None,
) -> Point:
    if isinstance(value, str):
        point: StringPoint = {"t": timestamp, "s": value}
        if dictionary is not None:
            point["ss"] = dictionary
    else:
        point: NumericPoint = {"t": timestamp, "v": value}
        if dictionary is not None:
            point["vv"] = dictionary

    if meta is not None:
        point["meta"] = meta

    return point


_ERROR_SENTINEL = -404.0


def _is_error(value) -> bool:
    """Return True if value is the standard error sentinel (-404 / -404.0)."""
    try:
        return float(value) == _ERROR_SENTINEL
    except (TypeError, ValueError):
        return False


def _load_config(metric_id: str, *, root: Path = ROOT) -> dict:
    path = root / "content" / "configs" / f"{metric_id}.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _read_old_latest_value(metric_id: str, *, root: Path = ROOT) -> Scalar | None:
    path = root / "content" / "latest" / f"{metric_id}.json"
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        points = data.get("points", [])
        if not points:
            return None
        p = points[-1]
        return p.get("v", p.get("s"))
    except Exception:
        return None


def _eval_is_critical(value: Scalar | None, alerts: list) -> bool:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        return False
    for alert in alerts:
        if not isinstance(alert, dict) or alert.get("priority") != "critical":
            continue
        threshold = alert.get("threshold")
        direction = alert.get("direction")
        if not isinstance(threshold, (int, float)) or isinstance(threshold, bool):
            continue
        if direction == "above" and value > threshold:
            return True
        if direction == "below" and value < threshold:
            return True
    return False


def _format_critical_status(value: Scalar, config: dict) -> str:
    meaning_map = config.get("meaningMap", {})
    # try "1.0", then "1" for whole-number floats
    keys = [str(value)]
    if isinstance(value, float) and value == int(value):
        keys.append(str(int(value)))
    for k in keys:
        if k in meaning_map:
            return f"🔴 {meaning_map[k]}"
    return f"🔴 {value}"


def _maybe_notify_whatsapp(
    metric_id: str,
    new_point: Point,
    old_value: Scalar | None,
    *,
    root: Path = ROOT,
) -> None:
    config = _load_config(metric_id, root=root)
    if not config.get("notify_whatsapp"):
        return
    alerts = config.get("alerts", [])
    new_value = new_point.get("v", new_point.get("s"))
    if not _eval_is_critical(new_value, alerts):
        return
    if _eval_is_critical(old_value, alerts):
        return  # already critical — don't repeat
    label = config.get("label", metric_id)
    status_str = _format_critical_status(new_value, config)
    try:
        _wa_dir = str(root / "src" / "whatsapp_integration")
        if _wa_dir not in os.sys.path:
            os.sys.path.insert(0, _wa_dir)
        from whatsapp_notification import whatsapp_status_update  # noqa: PLC0415
        whatsapp_status_update(label, status_str)
        print(f"WhatsApp sent for {metric_id}: {label!r} → {status_str!r}")
    except Exception as exc:
        print(f"WhatsApp notification failed for {metric_id}: {exc}", file=os.sys.stderr)


def run_metric(
    metric_id: str,
    *,
    root: Path = ROOT,
    package_name: str = content.scripts.__name__,
    timestamp: str | None = None,
    dry_run: bool = False,
    print_points: bool = True,
) -> Point:
    _validate_metric_id(metric_id)

    ts = timestamp or _utc_timestamp_iso()
    module = importlib.import_module(f"{package_name}.{metric_id}")

    value, dictionary, meta = module.main()

    for attempt in range(_RUNNER_MAX_RETRIES):
        if not _is_error(value):
            break
        print(
            f"{metric_id} returned error on attempt {attempt + 1}, "
            f"retrying in {_RUNNER_RETRY_DELAY:.0f}s…",
            file=os.sys.stderr,
        )
        time.sleep(_RUNNER_RETRY_DELAY)
        value, dictionary, meta = module.main()

    point = _build_point(
        timestamp=ts,
        value=value,
        dictionary=dictionary,
        meta=meta,
    )

    if print_points:
        print(metric_id, json.dumps(point, indent=2))

    if not dry_run:
        old_value = _read_old_latest_value(metric_id, root=root)
        write_latest(metric_id, point, root=root)
        append_series(metric_id, point, root=root)
        _maybe_notify_whatsapp(metric_id, point, old_value, root=root)

    return point


def run_metrics(
    selected_metric: str | None = None,
    *,
    root: Path = ROOT,
    package=content.scripts,
    dry_run: bool = False,
    print_points: bool = True,
    timestamp: str | None = None,
) -> dict[str, Point]:
    covered, uncovered_configs, uncovered_modules = resolve_covered_metrics(
        selected_metric=selected_metric,
        root=root,
        package=package,
    )

    if uncovered_configs:
        print(
            f"Warning: {len(uncovered_configs)} configs had no script:\n - "
            + "\n - ".join(uncovered_configs)
        )
    if uncovered_modules:
        print(
            f"Warning: {len(uncovered_modules)} scripts had no config:\n - "
            + "\n - ".join(uncovered_modules)
        )

    results: dict[str, Point] = {}
    for metric_id in covered:
        try:
            results[metric_id] = run_metric(
                metric_id,
                root=root,
                package_name=package.__name__,
                timestamp=timestamp,
                dry_run=dry_run,
                print_points=print_points,
            )
        except Exception as e:
            print(f"Error: metric '{metric_id}' failed: {e}", file=os.sys.stderr)

    return results


def _build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser()
    ap.add_argument("--metric", help="Run only this metric_id.")
    ap.add_argument("--dry-run", action="store_true", help="Do not write latest/series files.")
    return ap


def main(argv: list[str] | None = None) -> int:
    args = _build_arg_parser().parse_args(argv)
    run_metrics(
        selected_metric=args.metric,
        root=ROOT,
        package=content.scripts,
        dry_run=args.dry_run,
        print_points=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
