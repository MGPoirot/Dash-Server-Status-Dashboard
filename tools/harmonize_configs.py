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
server_profile = read_text(ROOT / 'content' / 'prompts' / 'server.txt')


IMPROVE_DESCRIPTION_PROMPT_TEMPLATE = """
You are improving the documentation of a metric measurement function.

The goal of the description is NOT to be catchy or high-level, but to clearly document:
- what *quality or property* of the system is being measured
- what *underlying mechanism, data source, or system interaction* is used to measure it
- what *outputs and states* the function can produce (including edge cases, error states, or sentinel values)
- based on the canonical server profile: what realistic and crucial *failure modes or ambiguities* might affect interpretation for this specific server

The description should read like concise technical documentation for someone maintaining or validating the metric.
Assume the reader is technically competent and already understands the metric title; do not restate it unnecessarily.

Target length: approximately 3 to 5 sentences.

Use the following implicit paragraph structure:
1. WHAT: What system quality or property is being measured.
2. HOW: How this is measured (data source, APIs, commands, or internal logic).
3. RETURNS: What values or states the function can return and how they should be interpreted.
4. LIMITATIONS: Any relevant failure modes, limitations, or ambiguity in the measurement.
Regarding these formatting of these paragraphs:
- Markdown is not supported.
- HTML is supported.
- Do not add headings.
- Do add HTML paragraphs (<p></p>) around each paragraph.
- Start each paragraph with the capitalized key word in bold (e.g., <b>WHAT:</b>).

Use short, precise sentences.
Avoid marketing language.
Avoid repeating details already implied by the title.
Focus on behavior and interpretation.

Metric Title:
=============
{}

Current Description:
====================
{}

Current Script:
===============
```python
{}

Server Profile:
===============
{}
```

Return the revised description only.
Do not include explanations, commentary, or any text other than the revised description itself.
"""

IMPROVE_LABELS_AND_TAGS_PROMPT_TEMPLATE = """
You are creating JSON objects containing the "label" and "tags" fields for a list of server monitoring metrics based on a list of their descriptions.

Goal
- Create consistent labels and tags based metric descriptions, using the Server Profile as the source of truth for hardware/component naming.

Rules for "label"
- Purpose: Short and quick interpretation on a dashboard homepage.
- Keep labels short, clear, and consistent in meaning across metrics.
- Prefer calling hard drives by their nickname if available.
- Use Standard Title Case (e.g., "Swap Used %", "OS Version", "Lil Nas X Lifetime").
- Use the same component name everywhere it refers to the same thing (e.g., the same disk must have the same disk name in every label).
- Prefer stable, human-friendly names from the Server Profile (device role/name/capacity) over volatile identifiers (UUIDs, mount IDs, serials).
- If the metric key encodes a component (disk, NIC, filesystem), reflect that component in the label.
- Preserve important units/symbols in a compact form where applicable (%, °C, ms, GB), without adding extra words.

Rules for "tags"
- Purpose: filtering.
- Tags must be all lower case.
- Tags must be consistent across metrics (use the same tag for the same concept).
- Include all relevant tags implied by the description context.
- Mention relevant container or service name in tags.
- Avoid duplicates; output tags as a de-duplicated list.

Input: Metric descriptions
======================================
{}

Input: Server Profile
===============================
{}

Output requirements (strict)
- Return ONE valid JSON object.
- For each description object:
  - DO copy the top level key "description_<number>"
  - DO provide key-value-pairs "label" as string and "tags" as array of strings.
  - DO NOT include units in labels such as GB, TB, Days, or °C.
  -
- Do NOT include "description" or any other fields.
- Do NOT include markdown, code fences, comments, or any extra text.
"""

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
            prompt = IMPROVE_DESCRIPTION_PROMPT_TEMPLATE.format(
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


def improve_tagging_and_naming():
    tmp_dir = TMP_ROOT / inspect.stack()[0][3]
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_file = tmp_dir / 'claude_response.txt'
    configs = list(ROOT.glob("content/configs/*.json"))
    descriptions = {f'description_{i}': json_in(c)['description'] for i, c in enumerate(configs)}
    identity_map = {f'description_{i}': c.stem for i, c in enumerate(configs)}
    if not tmp_file.exists():
        json_data = json.dumps(descriptions, indent=2)
        prompt = IMPROVE_LABELS_AND_TAGS_PROMPT_TEMPLATE.format(json_data, server_profile)
        claude_response = claude.invoke(prompt)
        write_text(tmp_file, claude_response)
    else:
        claude_response = read_text(tmp_file)
    
    if '```json' in claude_response:
        claude_response = re.search(r"```json\s*(.*?)\s*```", claude_response, flags=re.DOTALL | re.IGNORECASE).group(1).strip()
    try: 
        parsed_response = json.loads(claude_response)
        identified_response = {identity_map[k]: v for k, v in parsed_response.items()}
    except ValueError as e:
        print(f'The response could not be parsed:\n{e}\n{claude_response}')
    except KeyError as e:
        print(f'Missing keys: {", ".join([k for k in parsed_response if k not in identity_map])}')
    for k, v in identified_response.items():
        file = ROOT / 'content' / 'configs' / f'{k}.json'
        data = json_in(file)
        print(data['label'], '->', v['label'])
        print(data['tags'], "->", v['tags'])
        data['label'] = v['label']
        data['tags'] = v['tags']
        json_out(file, data)

if __name__ == "__main__":
    # improve_description()
    improve_tagging_and_naming()
