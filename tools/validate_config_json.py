#!/usr/bin/env python3
"""
validate_metric_json.py

CLI:
  python3 validate_metric_json.py /path/to/metric.json
Exit codes:
  0 = valid
  1 = invalid (errors printed to stderr)

Import:
  from validate_metric_json import validate_metric_json_path, validate_metric_definition
  errors = validate_metric_json_path(Path("metric.json"))
"""
import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, List, Tuple


ALLOWED_TOP_KEYS = {
    "label",
    "metric_id",
    "type",
    "component",
    "property",
    "schedule",
    "description",
    "unit",
    "tags",
    "meaningMap",
    "alerts",
    "display",
}

REQUIRED_TOP_KEYS = {
    "label",
    "metric_id",
    "type",
    "component",
    "property",
    "schedule",
}

SCHEDULE_ENUM = {
    "weekly",
    "bi-daily",
    "daily",
    "twice-daily",
    "hourly",
    "half-hourly",
    "quarter-hourly",
    "five-minutely",
    "minutely",
}

ALERT_PRIORITY_ENUM = {"info", "warning", "critical"}
ALERT_DIRECTION_ENUM = {"above", "below"}

DISPLAY_ALLOWED_KEYS = {"tile_span", "visual", "charts"}
VISUAL_TYPE_ENUM = {"gauge", "number", "counter", "state", "version", "text"}
CHART_ENUM = {"line", "area", "bar", "pie"}

# Constraints
LOWER_SIMPLE_RE = re.compile(r"^[a-z0-9]+$")  # conservative
LOWER_NO_SPACE_NO_UNDERSCORE_RE = re.compile(r"^[a-z0-9-]+$")  # allow hyphen, forbid underscore/space
NUMERIC_STRING_RE = re.compile(r"^-?(?:\d+(?:\.\d+)?|\.\d+)$")  # "1", "0.5", "-2", ".5"


def is_number(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def walk_no_nulls(value: Any, path: str, errors: List[str]) -> None:
    if value is None:
        errors.append(f"{path}: null values are not allowed")
        return
    if isinstance(value, dict):
        for k, v in value.items():
            walk_no_nulls(v, f"{path}.{k}" if path else str(k), errors)
    elif isinstance(value, list):
        for i, v in enumerate(value):
            walk_no_nulls(v, f"{path}[{i}]", errors)


def validate_top_level(obj: Any, errors: List[str]) -> None:
    if not isinstance(obj, dict):
        errors.append("root: must be a JSON object")
        return

    extra = set(obj.keys()) - ALLOWED_TOP_KEYS
    missing = REQUIRED_TOP_KEYS - set(obj.keys())

    if extra:
        errors.append(f"root: contains unsupported keys: {sorted(extra)}")
    if missing:
        errors.append(f"root: missing required keys: {sorted(missing)}")

    for key in REQUIRED_TOP_KEYS:
        if key not in obj:
            continue
        if not isinstance(obj[key], str):
            errors.append(f"root.{key}: must be a string")

    # label
    if "label" in obj and not isinstance(obj["label"], str):
        errors.append("root.label: must be a string")

    # description
    if "description" in obj and not isinstance(obj["description"], str):
        errors.append("root.description: must be a string")

    # unit
    if "unit" in obj and not isinstance(obj["unit"], str):
        errors.append("root.unit: must be a string")

    # type/component/property specifics
    t = obj.get("type")
    c = obj.get("component")
    p = obj.get("property")

    if isinstance(t, str):
        if t.lower() != t:
            errors.append("root.type: must be lowercase")
        if not LOWER_SIMPLE_RE.match(t):
            errors.append("root.type: must match /^[a-z0-9]+$/ (short lowercase noun)")
    if isinstance(c, str):
        if c.lower() != c:
            errors.append("root.component: must be lowercase")
        if " " in c or "_" in c:
            errors.append("root.component: must not contain spaces or underscores")
        if not LOWER_NO_SPACE_NO_UNDERSCORE_RE.match(c):
            errors.append("root.component: must match /^[a-z0-9-]+$/ (lowercase, no spaces/underscores)")
    if isinstance(p, str):
        if p.lower() != p:
            errors.append("root.property: must be lowercase")
        if " " in p or "_" in p:
            errors.append("root.property: must not contain spaces or underscores")
        if not LOWER_NO_SPACE_NO_UNDERSCORE_RE.match(p):
            errors.append("root.property: must match /^[a-z0-9-]+$/ (lowercase, no spaces/underscores)")

    # schedule
    if "schedule" in obj:
        if not isinstance(obj["schedule"], str):
            errors.append("root.schedule: must be a string")
        elif obj["schedule"] not in SCHEDULE_ENUM:
            errors.append(f"root.schedule: must be one of {sorted(SCHEDULE_ENUM)}")

    # metric_id format and consistency
    if "metric_id" in obj:
        mid = obj["metric_id"]
        if not isinstance(mid, str):
            errors.append("root.metric_id: must be a string")
        else:
            if mid.lower() != mid:
                errors.append("root.metric_id: must be lowercase")
            if isinstance(t, str) and isinstance(c, str) and isinstance(p, str):
                expected = f"{t}_{c}_{p}"
                if mid != expected:
                    errors.append(f"root.metric_id: must equal '{expected}' to match type/component/property")
            if not re.fullmatch(r"[a-z0-9]+_[a-z0-9-]+_[a-z0-9-]+", mid):
                errors.append(
                    "root.metric_id: must match '[type]_[component]_[property]' with lowercase parts "
                    "(component/property may include hyphens)"
                )

    # tags
    if "tags" in obj:
        tags = obj["tags"]
        if not isinstance(tags, list):
            errors.append("root.tags: must be an array of strings")
        else:
            for i, tag in enumerate(tags):
                if not isinstance(tag, str):
                    errors.append(f"root.tags[{i}]: must be a string")

    # meaningMap
    if "meaningMap" in obj:
        mm = obj["meaningMap"]
        if not isinstance(mm, dict):
            errors.append("root.meaningMap: must be an object")
        else:
            for k, v in mm.items():
                if not isinstance(k, str):
                    errors.append("root.meaningMap: keys must be strings")
                elif not NUMERIC_STRING_RE.match(k):
                    errors.append(f"root.meaningMap['{k}']: key must be a numeric string")
                if not isinstance(v, str):
                    errors.append(f"root.meaningMap['{k}']: value must be a string")

    # alerts
    if "alerts" in obj:
        alerts = obj["alerts"]
        if not isinstance(alerts, list):
            errors.append("root.alerts: must be an array of objects")
        else:
            for i, a in enumerate(alerts):
                path = f"root.alerts[{i}]"
                if not isinstance(a, dict):
                    errors.append(f"{path}: must be an object")
                    continue
                required = {"threshold", "direction", "priority"}
                extra = set(a.keys()) - required
                missing = required - set(a.keys())
                if extra:
                    errors.append(f"{path}: unsupported keys: {sorted(extra)}")
                if missing:
                    errors.append(f"{path}: missing required keys: {sorted(missing)}")

                if "threshold" in a and not is_number(a["threshold"]):
                    errors.append(f"{path}.threshold: must be a number")
                if "direction" in a:
                    if not isinstance(a["direction"], str):
                        errors.append(f"{path}.direction: must be a string")
                    elif a["direction"] not in ALERT_DIRECTION_ENUM:
                        errors.append(f"{path}.direction: must be one of {sorted(ALERT_DIRECTION_ENUM)}")
                if "priority" in a:
                    if not isinstance(a["priority"], str):
                        errors.append(f"{path}.priority: must be a string")
                    elif a["priority"] not in ALERT_PRIORITY_ENUM:
                        errors.append(f"{path}.priority: must be one of {sorted(ALERT_PRIORITY_ENUM)}")

    # display
    if "display" in obj:
        display = obj["display"]
        if not isinstance(display, dict):
            errors.append("root.display: must be an object")
        else:
            extra = set(display.keys()) - DISPLAY_ALLOWED_KEYS
            if extra:
                errors.append(f"root.display: contains unsupported keys: {sorted(extra)}")

            if "tile_span" in display and not is_number(display["tile_span"]):
                errors.append("root.display.tile_span: must be a number")

            # visual is REQUIRED if display is present
            if "visual" not in display:
                errors.append("root.display.visual: is required when display is provided")
            else:
                validate_visual(display["visual"], errors)

            if "charts" in display:
                charts = display["charts"]
                if not isinstance(charts, list):
                    errors.append("root.display.charts: must be an array of strings")
                else:
                    for i, ch in enumerate(charts):
                        if not isinstance(ch, str):
                            errors.append(f"root.display.charts[{i}]: must be a string")
                        elif ch not in CHART_ENUM:
                            errors.append(f"root.display.charts[{i}]: must be one of {sorted(CHART_ENUM)}")


def validate_visual(visual: Any, errors: List[str]) -> None:
    if not isinstance(visual, dict):
        errors.append("root.display.visual: must be an object")
        return
    if "type" not in visual:
        errors.append("root.display.visual.type: is required")
        return
    if not isinstance(visual["type"], str):
        errors.append("root.display.visual.type: must be a string")
        return
    vtype = visual["type"]
    if vtype not in VISUAL_TYPE_ENUM:
        errors.append(f"root.display.visual.type: must be one of {sorted(VISUAL_TYPE_ENUM)}")
        return

    def opt_bool(key: str) -> None:
        if key in visual and not isinstance(visual[key], bool):
            errors.append(f"root.display.visual.{key}: must be boolean")

    def opt_num(key: str) -> None:
        if key in visual and not is_number(visual[key]):
            errors.append(f"root.display.visual.{key}: must be a number")

    opt_bool("hideAlerts")
    opt_bool("invert_y")
    opt_num("nLatestPoints")
    opt_num("min")
    opt_num("max")

    allowed_keys = {"type"}
    if vtype == "gauge":
        allowed_keys |= {"min", "max", "hideAlerts", "invert_y"}
        if "min" not in visual or not is_number(visual.get("min")):
            errors.append("root.display.visual.min: required as number for gauge")
        if "max" not in visual or not is_number(visual.get("max")):
            errors.append("root.display.visual.max: required as number for gauge")
    elif vtype == "number":
        allowed_keys |= {"min", "max", "hideAlerts", "invert_y", "nLatestPoints"}
    elif vtype == "counter":
        allowed_keys |= {"hideAlerts", "nLatestPoints"}
    elif vtype == "state":
        allowed_keys |= {"colorMap"}
        if "colorMap" in visual:
            cm = visual["colorMap"]
            if not isinstance(cm, dict):
                errors.append("root.display.visual.colorMap: must be an object")
            else:
                for k, v in cm.items():
                    if not isinstance(k, str) or not isinstance(v, str):
                        errors.append("root.display.visual.colorMap: must be a string-to-string map")
    elif vtype == "version":
        allowed_keys |= {"nLatestPoints"}
    elif vtype == "text":
        allowed_keys |= set()

    extra = set(visual.keys()) - allowed_keys
    if extra:
        errors.append(f"root.display.visual: contains unsupported keys for type '{vtype}': {sorted(extra)}")


# ----------------------------
# Core "importable" API
# ----------------------------

def parse_metric_json_text(raw: str) -> Tuple[Any, List[str]]:
    errors: List[str] = []

    if raw is None or raw == "":
        errors.append("file: empty")
        return None, errors

    stripped = raw.strip()
    if not (stripped.startswith("{") and stripped.endswith("}")):
        errors.append('file: output must start with "{" and end with "}"')

    try:
        data = json.loads(stripped)
    except json.JSONDecodeError as e:
        errors.append(f"file: invalid JSON ({e})")
        return None, errors

    return data, errors


def validate_metric_definition(data: Any) -> List[str]:
    errors: List[str] = []
    if data is None:
        errors.append("root: missing data")
        return errors

    walk_no_nulls(data, "root", errors)
    validate_top_level(data, errors)
    return errors


def validate_metric_json_path(path: Path) -> List[str]:
    errors: List[str] = []

    if not path.exists():
        return [f"file: not found: {path}"]
    if not path.is_file():
        return [f"file: not a file: {path}"]

    raw = path.read_text(encoding="utf-8")
    data, parse_errors = parse_metric_json_text(raw)
    errors.extend(parse_errors)

    if data is not None:
        errors.extend(validate_metric_definition(data))

    return errors


# ----------------------------
# CLI wrapper
# ----------------------------

def _build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Validate a metric definition JSON file.")
    p.add_argument("json_path", type=Path, help="Path to metric.json")
    return p


def main(argv: List[str] | None = None) -> int:
    args = _build_arg_parser().parse_args(argv)
    errors = validate_metric_json_path(args.json_path)

    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        return 1

    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
