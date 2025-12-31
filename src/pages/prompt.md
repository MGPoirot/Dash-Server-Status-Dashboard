Prompt
=====================================================

The prompt below can be used to generate a new metric definition. It is basically the [docs](/docs) page for LLMs.

```text
You are generating EXACTLY ONE metric DEFINITION file for a server monitoring dashboard.

OUTPUT RULES (STRICT – MUST FOLLOW):
- Output MUST be a single JSON object.
- Output MUST start with "{" and end with "}".
- Output MUST be valid JSON (double quotes only, no trailing commas).
- Output MUST be parseable by json.loads().
- DO NOT include markdown, comments, explanations, code fences, or any text outside the JSON object.

TOP-LEVEL JSON STRUCTURE:

The root object MAY ONLY contain the following keys.
No other keys are allowed.

REQUIRED keys (MUST be present):
- "label"
- "metric_id"
- "type"
- "parent"
- "property"
- "metric_type"

OPTIONAL keys (MAY be present):
- "description"
- "unit"
- "expected_interval_sec"
- "tags"
- "mapping"
- "alerts"
- "display"

FIELD DEFINITIONS AND CONSTRAINTS:

1. "label"
- REQUIRED
- Type: string
- Short, human-readable title for the UI.

2. "description"
- OPTIONAL
- Type: string
- Human-readable description. HTML is allowed but not required.

3. "metric_id"
- REQUIRED
- Type: string
- Format: "[type].[parent].[property]"
- Must be lowercase.
- Must match the values used in "type", "parent", and "property".

4. "type"
- REQUIRED
- Type: string
- Category of the metric.
- Use a short lowercase noun (e.g. "system", "storage", "services", "script").

5. "parent"
- REQUIRED
- Type: string
- Resource identifier (service name, disk name, component, etc.).
- Lowercase, no spaces.

6. "property"
- REQUIRED
- Type: string
- The measured aspect of the parent (e.g. "up", "temp", "used_pct").
- Lowercase, no spaces.

7. "metric_type"
- REQUIRED
- Type: string
- MUST be exactly one of:
  - "gauge"
  - "number"
  - "counter"
  - "state"
  - "version"
  - "text"

8. "unit"
- OPTIONAL
- Type: string
- Examples: "%", "°C", "GB", "s"
- Only include when meaningful.

9. "expected_interval_sec"
- OPTIONAL
- Type: number
- Expected reporting interval in seconds (e.g. 60, 300, 3600).

10. "tags"
- OPTIONAL
- Type: array of strings
- Used for filtering/grouping.
- Example: ["service", "docker"]

11. "mapping"
- OPTIONAL
- Type: object
- Keys MUST be strings representing numeric values.
- Values MUST be strings.
- Used primarily with metric_type "state".
- Example:
  {
    "1": "Up",
    "0.5": "Stopped",
    "0": "Down"
  }

12. "alerts"
- OPTIONAL
- Type: array of objects
- Each object MUST contain ALL of the following keys:
  - "threshold": number
  - "direction": string, MUST be either "above" or "below"
  - "priority": string, MUST be one of "info", "warning", "critical"

13. "display"
- OPTIONAL
- Type: object
- MAY ONLY contain the following keys:
  - "tile_span"
  - "visual"
  - "charts"

13a. "display.tile_span"
- OPTIONAL
- Type: number
- Typical value: 1

13b. "display.visual"
- OPTIONAL
- Type: object
- MUST contain:
  - "type": string
- "type" MUST be one of:
  - "gauge"
  - "number"
  - "counter"
  - "state"
  - "version"
  - "text"
- MAY contain additional visualization parameters such as:
  - "min": number
  - "max": number or string "max"
  - "invert_y": boolean
  - "show_alerts": boolean

13c. "display.charts"
- OPTIONAL
- Type: array of strings
- Each entry MUST be one of:
  - "line"
  - "area"
  - "bar"
  - "pie"

ADDITIONAL RULES:
- Do NOT include fields with null values.
- Do NOT invent new field names.
- Prefer minimal but complete definitions.
- If the metric represents a service or boolean-like state, prefer:
  - metric_type = "state"
  - include "mapping"
  - include at least one "critical" alert when the state indicates failure.

TASK DESCRIPTION (what this metric should represent):
{}
```