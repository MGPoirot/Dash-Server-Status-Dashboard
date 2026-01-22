import json
import os
import inspect
from pathlib import Path
from typing import Any
from tools.utils import read_text, write_text
from tools.llm_utils import claude
import re

ROOT = Path(__file__).resolve().parents[1]

TMP_ROOT = ROOT / 'staging'

SCRIPT_PATH = str(ROOT / 'content' / 'scripts' / '{}.py')

prompt_dir = ROOT / 'content' / 'prompts'

server_profile = read_text(prompt_dir / 'server.txt')

improve_description_prompt_template = read_text(prompt_dir / 'harmonize.txt')

improve_labels_and_tags_prompt_template = read_text(prompt_dir / 'relabel.txt')

def json_in(path: str | Path) -> Any:
    path = Path(path)
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def json_out(path: str | Path, obj: Any) -> None:
    path = Path(path)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)


def improve_description():
    tmp_dir = TMP_ROOT / inspect.stack()[0][3]
    os.makedirs(tmp_dir, exist_ok=True)
    configs = ROOT.glob("content/configs/*.json")
    for config in configs:
        data = json_in(config)
        tmp_file = tmp_dir / f"{data['metric_id']}.txt"
        if not tmp_file.exists():
            script_file = Path(SCRIPT_PATH.format(data['metric_id']))
            if not script_file.exists():
                continue
            script = read_text(script_file)
            prompt = improve_description_prompt_template.format(
                data['label'], 
                data['description'], 
                script,
                server_profile
            )
            claude_response = claude.invoke(prompt)
            write_text(tmp_file, claude_response)
            data['description'] = claude_response
            json_out(config, data)
        else:
            claude_response = read_text(tmp_file)
        print(data['label'])
        print(data['description'])


def interpret_response(claude_response: str, identity_map: dict[str, str]) -> dict[str, Any]:
    if '```json' in claude_response:
        claude_response = re.search(r"```json\s*(.*?)\s*```", claude_response, flags=re.DOTALL | re.IGNORECASE).group(1).strip()
    try: 
        parsed_response = json.loads(claude_response)
        identified_response = {identity_map[k]: v for k, v in parsed_response.items()}
    except ValueError as e:
        print(f'The response could not be parsed:\n{e}\n{claude_response}')
    except KeyError as e:
        print(f'Missing keys: {", ".join([k for k in parsed_response if k not in identity_map])}')
    return identified_response


def improve_tagging_and_naming():
    # Set up directory structure
    tmp_dir = TMP_ROOT / inspect.stack()[0][3]
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_file = tmp_dir / 'claude_response.json'
    # Load config files
    configs = list(ROOT.glob("content/configs/*.json"))
    # Map anonymous descriptions to metric IDs
    identity_map = {f'description_{i}': c.stem for i, c in enumerate(configs)}
    # Load the descriptions of each config
    descriptions = {f'description_{i}': json_in(c)['description'] for i, c in enumerate(configs)}
    # Check if we have already called Claude
    if tmp_file.exists():
        idd_response = json_in(tmp_file)
        if all([ids in idd_response for ids in identity_map.values()]):
            print("No need to call Claude again; all descriptions present.")
            return
    # Call Claude to improve labels and tags
    descriptions = json.dumps(descriptions, indent=2)
    prompt = improve_labels_and_tags_prompt_template.format(descriptions, server_profile)
    txt_response = claude.invoke(prompt)
    # Interpret the response
    idd_response = interpret_response(txt_response, identity_map)
    json_out(tmp_file, idd_response)
    # Apply the changes
    for metric_id, new_fields in idd_response.items():
        # Load data
        config_file = ROOT / 'content' / 'configs' / f'{metric_id}.json'
        old_fields = json_in(config_file)
        new_fields = idd_response[metric_id]
        # Print changes
        print(metric_id + ':')
        print(' -', old_fields['label'], '->', new_fields['label'])
        print(' -', old_fields['tags'],  "->", new_fields['tags'])
        old_fields['label'] = new_fields['label']
        old_fields['tags']  = new_fields['tags']
        json_out(config_file, old_fields)

if __name__ == "__main__":
    improve_description()
    improve_tagging_and_naming()
