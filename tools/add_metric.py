# add_metric.py (updated)
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from tools.utils import read_text
from tools.validate_config_json import validate_metric_json_path
from tools.validate_python_script import validate_python_script_path
from tools.llm_utils import claude

ROOT = Path(__file__).resolve().parents[1]
prompt_dir = ROOT / "content" / "prompts"
staging_dir = ROOT / "staging"
staging_dir.mkdir(parents=True, exist_ok=True)

# Files
PROMPT_TEMPLATE_PATH = prompt_dir / "prompt.txt"
SERVER_TXT_PATH = prompt_dir / "server.txt"
CONFIG_TXT_PATH = prompt_dir / "config.txt"
SCRIPT_TXT_PATH = prompt_dir / "script.txt"


def build_prompt(monitoring_proposal: str) -> str:
    template = read_text(PROMPT_TEMPLATE_PATH)
    server_profile = read_text(SERVER_TXT_PATH)
    config_prompt = read_text(CONFIG_TXT_PATH)
    script_prompt = read_text(SCRIPT_TXT_PATH)
    return (
        template.replace("{{SERVER_PROFILE}}", server_profile)
        .replace("{{CONFIG_PROMPT}}", config_prompt)
        .replace("{{SCRIPT_PROMPT}}", script_prompt)
        .replace("{{MONITORING_PROPOSAL}}", monitoring_proposal)
    )


def extract_fenced_blocks(text: str) -> tuple[str, str]:
    """
    Extracts the first ```json ...``` block and the first ```python ...``` block.
    Accepts ```py``` too.
    """
    json_match = re.search(r"```json\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
    py_match = re.search(r"```python\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE) or re.search(
        r"```py\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE
    )

    if not json_match:
        raise ValueError("No ```json``` block found in model output")
    if not py_match:
        raise ValueError("No ```python``` block found in model output")

    return json_match.group(1).strip(), py_match.group(1).strip()


def safe_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def run_generated_script(script_path: Path, timeout_seconds: int = 20) -> tuple[bool, str, str]:
    """
    Executes the script as a standalone program (python script.py) to check it runs at all.
    Returns: (ok, stdout, stderr)
    """
    try:
        proc = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True,
            timeout=timeout_seconds,
        )
        return (proc.returncode == 0, (proc.stdout or "").strip(), (proc.stderr or "").strip())
    except subprocess.TimeoutExpired:
        return (False, "", f"Timed out after {timeout_seconds}s")


def main() -> None:
    if len(sys.argv) > 1:
        monitoring_proposal = " ".join(sys.argv[1:]).strip()
    else:
        monitoring_proposal = input("Please provide a monitoring proposal: ").strip()

    if not monitoring_proposal:
        raise ValueError("Monitoring proposal is empty")

    prompt = build_prompt(monitoring_proposal)
    model_text = claude.invoke(prompt)

    config_json_text, script_text = extract_fenced_blocks(model_text)

    # Validate JSON parses
    try:
        config_obj = json.loads(config_json_text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Model returned invalid JSON: {e}")

    metric_id = config_obj.get("metric_id")
    if not isinstance(metric_id, str) or not metric_id.strip():
        raise RuntimeError("Config JSON missing required string field: metric_id")

    visual_type = None
    try:
        visual_type = (
            config_obj.get("display", {})
            .get("visual", {})
            .get("type", None)
        )
    except Exception:
        visual_type = None

    staging_config = staging_dir / f"{metric_id}.json"
    staging_script = staging_dir / f"{metric_id}.py"

    safe_write(staging_config, json.dumps(config_obj, ensure_ascii=False, indent=2))
    safe_write(staging_script, script_text)

    # Validate config JSON using your validator
    errors = validate_metric_json_path(staging_config)
    if errors:
        print("Config JSON validation errors:")
        for err in errors:
            print(f"- {err}")
        raise SystemExit(1)

    # Validate Python script structure (main() return signature/types)
    py_errors, py_debug = validate_python_script_path(staging_script, visual_type=visual_type)
    if py_errors:
        print("Python script validation errors:")
        for err in py_errors:
            print(f"- {err}")
        print("\nValidator debug output (tail):")
        print(py_debug[-1000:])
        raise SystemExit(1)

    # Show the generated script to the user
    print("\n================ GENERATED PYTHON SCRIPT ================\n")
    print(script_text)
    print("\n========================================================\n")

    answer = 'yes' # input('Are you sure you want to execute this script? yes/[No]: ').strip().lower()
    if answer != "yes":
        print("Aborted (not executing). Files remain in staging/")
        raise SystemExit(0)

    ok, out, err = run_generated_script(staging_script)
    print("\n================ EXECUTION RESULT ================\n")
    print("Exit OK:", ok)
    if out:
        print("\n--- stdout ---\n" + out)
    if err:
        print("\n--- stderr ---\n" + err)
    print("\n==================================================\n")

    if not ok:
        raise SystemExit(1)

    # Move into production locations
    configs_dir = ROOT / "content" / "configs"
    scripts_dir = ROOT / "content" / "scripts"
    configs_dir.mkdir(parents=True, exist_ok=True)
    scripts_dir.mkdir(parents=True, exist_ok=True)

    final_config = configs_dir / staging_config.name
    final_script = scripts_dir / staging_script.name

    shutil.move(str(staging_config), str(final_config))
    shutil.move(str(staging_script), str(final_script))

    print(f"Installed config -> {final_config}")
    print(f"Installed script -> {final_script}")

    # Run the metric immediately
    from tools.runner import run_metrics

    run_metrics(selected_metric=metric_id)


if __name__ == "__main__":
    main()
