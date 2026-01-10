# validate_python_script.py
import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


NUMERIC_VISUALS = {"gauge", "number", "counter", "state"}
STRING_VISUALS = {"text", "version"}

ROOT = Path(__file__).resolve().parents[1]


def _is_number(x: Any) -> bool:
    # bool is subclass of int; reject it
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def _is_str(x: Any) -> bool:
    return isinstance(x, str)


def validate_main_return(value: Any, visual_type: str | None) -> list[str]:
    errors: list[str] = []

    if not isinstance(value, (tuple, list)):
        return [f"main() must return a 3-tuple (value, additional, meta); got {type(value).__name__}"]

    if len(value) != 3:
        return [f"main() must return exactly 3 items (value, additional, meta); got {len(value)}"]

    primary, additional, meta = value

    # meta
    if meta is not None and not _is_str(meta):
        errors.append("3rd return value (meta) must be string or None")

    # additional
    if additional is not None and not isinstance(additional, dict):
        errors.append("2nd return value (additional) must be dict or None")

    # primary/additional typing depends on visual type (if provided)
    if visual_type:
        vt = visual_type.strip().lower()
        if vt in NUMERIC_VISUALS:
            if primary is None or not _is_number(primary):
                errors.append(f"1st return value (primary) must be number for visual '{vt}'")
            if isinstance(additional, dict):
                bad = [k for k, v in additional.items() if not isinstance(k, str) or not _is_number(v)]
                if bad:
                    errors.append(f"2nd return dict must be Dict[str, number] for visual '{vt}' (bad keys: {bad[:5]})")
        elif vt in STRING_VISUALS:
            if primary is None or not _is_str(primary):
                errors.append(f"1st return value (primary) must be string for visual '{vt}'")
            if isinstance(additional, dict):
                bad = [k for k, v in additional.items() if not isinstance(k, str) or not _is_str(v)]
                if bad:
                    errors.append(f"2nd return dict must be Dict[str, str] for visual '{vt}' (bad keys: {bad[:5]})")
        else:
            errors.append(f"Unknown visual type '{visual_type}'. Expected one of {sorted(NUMERIC_VISUALS | STRING_VISUALS)}")

    return errors


def validate_python_script_path(
    script_path: Path,
    *,
    visual_type: str | None = None,
    timeout_seconds: int = 15,
) -> tuple[list[str], str]:
    """
    Validates a generated metric script by executing a harness in a subprocess that:
      - imports the script by path
      - verifies it defines main()
      - calls main()
      - checks main() returns a tuple of 3 values with expected types
      - prints JSON describing the result (only used by this validator)

    Returns: (errors, debug_stdout)
    """
    script_path = Path(script_path)
    if not script_path.exists():
        return ([f"Script file does not exist: {script_path}"], "")

    harness = f"""
import json, importlib.util, sys, traceback
from pathlib import Path

p = Path(r"{str(script_path)}")
spec = importlib.util.spec_from_file_location("metric_script", p)
m = importlib.util.module_from_spec(spec)
try:
    spec.loader.exec_module(m)  # type: ignore[attr-defined]
except Exception as e:
    print(json.dumps({{"ok": False, "phase": "import", "error": str(e), "trace": traceback.format_exc()}}))
    raise SystemExit(0)

if not hasattr(m, "main") or not callable(m.main):
    print(json.dumps({{"ok": False, "phase": "shape", "error": "No callable main() found"}}))
    raise SystemExit(0)

try:
    ret = m.main()
except TypeError as e:
    # common: main expects args
    print(json.dumps({{"ok": False, "phase": "call", "error": "main() raised TypeError (likely expects args)", "detail": str(e)}}))
    raise SystemExit(0)
except Exception as e:
    print(json.dumps({{"ok": False, "phase": "call", "error": str(e), "trace": traceback.format_exc()}}))
    raise SystemExit(0)

# Print the return in a JSON-serializable way
def scrub(x):
    try:
        json.dumps(x)
        return x
    except Exception:
        return str(x)

print(json.dumps({{"ok": True, "phase": "ok", "ret": scrub(ret)}}))
""".strip()

    try:
        proc = subprocess.run(
            [sys.executable, "-c", harness],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
    except subprocess.TimeoutExpired:
        return ([f"Validation harness timed out after {timeout_seconds}s"], "")

    stdout = (proc.stdout or "").strip()
    stderr = (proc.stderr or "").strip()

    if not stdout:
        msg = "No stdout from validation harness"
        if stderr:
            msg += f"; stderr: {stderr[-500:]}"
        return ([msg], stdout)

    # Harness prints one JSON line
    try:
        payload = json.loads(stdout.splitlines()[-1])
    except Exception:
        return ([f"Validator output was not JSON. stdout tail: {stdout[-500:]}"], stdout)

    if not payload.get("ok"):
        err = payload.get("error") or "Unknown error"
        phase = payload.get("phase") or "unknown"
        detail = payload.get("detail")
        trace = payload.get("trace")
        errors = [f"Script failed during '{phase}': {err}"]
        if detail:
            errors.append(f"Detail: {detail}")
        if trace:
            errors.append(f"Trace:\n{trace}")
        if stderr:
            errors.append(f"Stderr:\n{stderr}")
        return (errors, stdout)

    ret = payload.get("ret")
    errors = validate_main_return(ret, visual_type)
    if stderr:
        # Not always fatal, but worth surfacing
        errors.append(f"Script emitted stderr during import/call:\n{stderr}")

    return (errors, stdout)


def validate_metric_id(metric_id: str) -> list[str]:
    """
    Validates ROOT/scripts/<metric_id>.py using validate_python_script_path.
    """
    if not metric_id or not metric_id.strip():
        return ["metric_id must be a non-empty string"]

    script_path = ROOT / "content" / "scripts" / f"{metric_id}.py"
    errors, _debug = validate_python_script_path(script_path)
    return errors


def _build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(description="Validate a metric python script by metric_id.")
    ap.add_argument("metric_id", help="Metric id; validates ROOT/scripts/<metric_id>.py")
    ap.add_argument("--visual-type", default=None, help="Optional visual type to enforce return typing.")
    ap.add_argument("--timeout", type=int, default=15, help="Subprocess timeout (seconds).")
    return ap


def main(argv: list[str] | None = None) -> int:
    args = _build_arg_parser().parse_args(argv)
    script_path = ROOT / "content" / "scripts" / f"{args.metric_id}.py"

    errors, debug_stdout = validate_python_script_path(
        script_path,
        visual_type=args.visual_type,
        timeout_seconds=args.timeout,
    )

    if errors:
        for e in errors:
            print(e, file=sys.stderr)
        # Optional: include harness stdout for debugging on failure
        if debug_stdout:
            print("\n--- harness stdout ---", file=sys.stderr)
            print(debug_stdout, file=sys.stderr)
        return 1

    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
