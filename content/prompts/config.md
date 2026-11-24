🗃️ Config Prompt
==================

This prompt specifies the requirements and guidelines for generating a `/content/configs/*.json` file. It is used by `python -m tools.add_metric`.

## notify_whatsapp (optional, boolean)

When set to `true`, the runner sends a WhatsApp message the first time this metric transitions into a **critical** alert state (it was not critical on the previous run, and it is critical now). Later runs that stay critical do not send again.

If the stored value is an IPv4 address, a change from the last stored address also sends a message. The status text is the new address. The first address observed does not send a message, and a failed lookup does not either.

```json
"notify_whatsapp": true
```

**Constraint:** `notify_whatsapp: true` requires at least one alert with `priority: "critical"` to be defined. `validate_config_json.py` will reject the config otherwise.