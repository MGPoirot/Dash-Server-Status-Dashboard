🗃️ Config Prompt
==================

This prompt specifies the requirements and guidelines for generating a `/content/configs/*.json` file. It is used by `python -m tools.add_metric`.

## notify_whatsapp (optional, boolean)

When set to `true`, the runner will send a WhatsApp message the first time this metric transitions into a **critical** alert state (i.e. was not critical on the previous run, is critical now). Subsequent runs that stay critical do NOT resend — only the transition triggers a message.

```json
"notify_whatsapp": true
```

**Constraint:** `notify_whatsapp: true` requires at least one alert with `priority: "critical"` to be defined. `validate_config_json.py` will reject the config otherwise.