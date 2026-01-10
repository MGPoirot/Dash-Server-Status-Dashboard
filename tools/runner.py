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

    point = _build_point(
        timestamp=ts,
        value=value,
        dictionary=dictionary,
        meta=meta,
    )

    if print_points:
        print(metric_id, json.dumps(point, indent=2))

    if not dry_run:
        write_latest(metric_id, point, root=root)
        append_series(metric_id, point, root=root)

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
