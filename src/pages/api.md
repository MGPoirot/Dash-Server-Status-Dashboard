# API

Dash exposes a simple HTTP API intended for automation, CI jobs, cron tasks, and external integrations. The API is file-oriented and mirrors the underlying data model.

All endpoints assume JSON request and response bodies.

Base URL:

```
/api/v1
```

---

## Definitions

### Create or Update a Definition

```
PUT /definitions/{metric_id}
```

Request body must conform to the definition format.

On success, the definition file is created or replaced.

### Retrieve a Definition

```
GET /definitions/{metric_id}
```

Returns the parsed definition JSON.

### Delete a Definition

```
DELETE /definitions/{metric_id}
```

Removes the definition and associated series and latest files.

---

## Series

### Append a Data Point

```
POST /series/{metric_id}
```

Request body:

```json
{
  "timestamp": "2025-12-31T12:00:00Z",
  "value": 42
}
```

The data point is appended to the existing series file.

### Retrieve Series

```
GET /series/{metric_id}
```

Returns the full time series.

---

## Latest

### Update Latest Value

```
PUT /latest/{metric_id}
```

Request body:

```json
{
  "timestamp": "2025-12-31T12:00:00Z",
  "value": 42
}
```

This endpoint is optimized for frequent updates.

### Retrieve Latest Value

```
GET /latest/{metric_id}
```

Returns the most recent value.

---

## Integrations

### Trigger Integrations

```
POST /integrations/trigger
```

Triggers all configured integrations for metrics whose state changed since the previous evaluation cycle.

Request body may optionally scope execution:

```json
{
  "metric_ids": ["watchtower_status"]
}
```

---

## Error Handling

* `400` — invalid JSON or schema violation
* `404` — unknown metric or resource
* `409` — inconsistent metric type
* `500` — internal processing error
