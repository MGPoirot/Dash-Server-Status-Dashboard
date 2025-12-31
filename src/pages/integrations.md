# Integrations

Integrations define how Dash reacts to metric state changes. They are evaluated whenever latest values are updated and may emit notifications, webhooks, or other side effects.

Each integration is configured via JSON and consists of:

* sender configuration,
* one or more receivers,
* one or more message templates.

---

## WhatsApp Integration

The WhatsApp integration uses the WhatsApp Business Cloud API to send notifications when metric states change.

**Location**

```
content/integrations/whatsapp.json
```

---

### Sender Configuration

Defines the WhatsApp Business account used to send messages.

```json
{
  "name": "My WhatsApp Business Account",
  "version": "21.0",
  "phone_number_id": "795740773632607",
  "token": "<ACCESS_TOKEN>",
  "messaging_product": "whatsapp"
}
```

Fields:

* `phone_number_id` and `token` are provided by Meta.
* Tokens should be treated as secrets and never committed publicly.

---

### Receivers

A list of recipients who may receive messages.

```json
{
  "name": "My Personal WhatsApp Number",
  "to": "31631515577"
}
```

The `to` field must be a full international phone number without separators.

---

### Messages

Messages define reusable templates that integrations can reference.

Supported message types:

* `template`
* `text`

Example template message:

```json
{
  "name": "Status Change Notification",
  "type": "template",
  "template": {
    "name": "status_of_your_order_has_changed",
    "language": { "code": "en" },
    "parameters": [
      { "type": "text", "text": null },
      { "type": "text", "text": null }
    ]
  }
}
```

The `null` values are populated at runtime with metric-specific information, such as:

* metric label,
* old value,
* new value,
* timestamp.

---

### Free Text Messages

```json
{
  "name": "Free Text Message",
  "type": "text",
  "text": {
    "body": null
  }
}
```

The body is dynamically generated at send time.

---

## Integration Evaluation Logic

An integration is triggered when:

* a metric’s evaluated status changes (e.g. `Up` → `Down`),
* or a threshold is crossed.

Future integrations are expected to follow the same structure, allowing Dash to support additional channels such as:

* Email (SMTP)
* Slack / Discord webhooks
* Generic HTTP webhooks

All integrations share the same event model and can be enabled or disabled independently.

---

If you want, I can next:

* align this exactly to your current folder structure,
* add JSON Schemas for validation,
* or tighten the API to match a specific runtime model (Node, Go, etc.).
