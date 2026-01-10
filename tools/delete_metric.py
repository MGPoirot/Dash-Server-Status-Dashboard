#!/usr/bin/env python3
import json
import sys
from pathlib import Path
from typing import Any


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def safe_unlink(path: Path) -> bool:
    try:
        if path.exists():
            path.unlink()
            return True
        return False
    except Exception as e:
        print(f"ERROR: Failed to delete {path}: {e}")
        return False


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python delete_metric.py <metric_id>")
        raise SystemExit(2)

    metric_id = sys.argv[1].strip()
    if not metric_id:
        print("ERROR: metric_id is empty")
        raise SystemExit(2)

    ROOT = Path(__file__).resolve().parents[1]
    
    scripts_path = ROOT / "content" / "scripts" / f"{metric_id}.py"
    configs_path = ROOT / "content" / "configs" / f"{metric_id}.json"
    latest_path = ROOT / "content" / "latest" / f"{metric_id}.json"
    series_path = ROOT / "content" / "series" / f"{metric_id}.json"

    # Load series first (if present) and confirm deletion if it has > 1 point
    if series_path.exists():
        try:
            series_obj = read_json(series_path)
            points = series_obj.get("points", [])
            if isinstance(points, list) and len(points) > 1:
                print("\n================ SERIES (will be deleted) ================\n")
                print(series_path)
                print(json.dumps(series_obj, ensure_ascii=False, indent=2))

                if configs_path.exists():
                    try:
                        cfg_obj = read_json(configs_path)
                        print("\n================ CONFIG (will be deleted) ================\n")
                        print(configs_path)
                        print(json.dumps(cfg_obj, ensure_ascii=False, indent=2))
                    except Exception as e:
                        print(f"\nWARN: Failed to read config JSON at {configs_path}: {e}")
                else:
                    print(f"\nWARN: Config file not found at {configs_path}")

                ans = input(
                    f"\nAre you sure you want to delete '{metric_id}' and all of its associated files? yes/[No]: "
                ).strip().lower()
                if ans != "yes":
                    print("Aborted.")
                    raise SystemExit(0)

        except json.JSONDecodeError as e:
            print(f"WARN: Series file exists but is not valid JSON ({series_path}): {e}")
            ans = input(
                f"Series file looks corrupted. Delete '{metric_id}' files anyway? yes/[No]: "
            ).strip().lower()
            if ans != "yes":
                print("Aborted.")
                raise SystemExit(0)
        except Exception as e:
            print(f"WARN: Failed to inspect series file {series_path}: {e}")
            ans = input(
                f"Proceed to delete '{metric_id}' files anyway? yes/[No]: "
            ).strip().lower()
            if ans != "yes":
                print("Aborted.")
                raise SystemExit(0)

    # If no series file, or series has <= 1 point, proceed without interactive confirmation
    targets = [scripts_path, configs_path, latest_path, series_path]

    print("\nDeleting files:")
    for p in targets:
        print(f"- {p}")

    deleted_any = False
    ok = True
    for p in targets:
        if p.exists():
            deleted = safe_unlink(p)
            deleted_any = deleted_any or deleted
            ok = ok and deleted
        else:
            print(f"  (not found) {p}")

    if ok:
        if deleted_any:
            print("\nDone.")
        else:
            print("\nNothing included to delete (all files missing).")
        raise SystemExit(0)
    else:
        print("\nFinished with errors.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
