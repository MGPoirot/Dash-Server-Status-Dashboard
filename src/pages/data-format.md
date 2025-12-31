Data Format Specification
=====================================================

This document describes the JSON data format used by this monitoring dashboard. All monitoring scripts generate metric data in this format, which Gatsby then ingests to build the UI.

The design supports:

*   Categorization of metrics by type, parent, and property.

*   Many types of metrics (gauge, state, version, text, counters)

*   Alert thresholds
    
*   Timestamps and metric history
    
*   Tile-based UI with filtering (tags, parent, type)
    
*   Extensibility without schema changes
    

📁 File Layout
==============

Each metric has three files linked by a shared `id`. This `id` consists of a `[type].[parent].[property]`. The files are stored in the following folders:  
`/content/`  
├── `definitions/[type].[parent].[property].json`  
├── `series/[type].[parent].[property].json`  
└── `latest/[type].[parent].[property].json`    


📘 1. Definition Format 
==================================================

A metric **definition** describes what the metric _is_, how it should be displayed, and how alerts behave. 

|    Field    | Required | Type | Description |
|-------------|:--------:|------|-------------|
| label       | Yes | string | Human-readable title for UI tiles. |
| description | No | html | Human-readable description with HTML support. |
| metric_id   | Yes | string | Globally unique metric identifier (also used in data file) that consists of [type].[parent].[property]. |
| type        | Yes | string | Category (e.g. storage, service, system, script). |
| parent      | Yes | string | Resource identifier (disk name, service name, etc.). |
| property    | Yes | string | Metric aspect on that resource (used, running, temp…). |
| unit         |  No | string | GB, %, °C, s, etc. |
| mapping     |  No | See §1.1 | Maps values to words, 1 "Up", 0.5 "Stopped", 0 "Down" |
| expected_interval_sec | No | number | How often data should arrive before classed “stale”. |
| tags        |  No | Array of strings | Optional tags for grouping / filtering. |
| alerts      | No | See §1.2 | Threshold-based alert rules. |
| display     | No | See §1.3 | UI layout: chart type, tile size, and if the y-axis should be flipped in case `invert_good_bad`, etc. |


## 1.1 Value Mapping
When storing values and configuring alerts it may be easier to store numeric values. To present human readable values the mapping field can be used. If the value is not present in the mapping, the raw value is returned.
```json
"mapping": {
  "1":   "Up",
  "0.5": "Stopped",
  "0":   "Down"
},
```

## 1.2 Alerts
Alerts is a list of alert objects. Each alert object is defined by three key-value pairs:

| Field | Required | Type | Description |
|-------|---------|-----|-------------|
| threshold | Yes  | number | Value to be passed to trigger the alert |
| direction | Yes  | "above" or "below" | Direction to be passed to trigger the alert |
| priority  | Yes  | "info" or "warning" or "critical" | Priority of the alarm raised | 

Example:

```json 
"alerts": [
  { "threshold": 70, "direction": "above", "priority": "info" },
  { "threshold": 80, "direction": "above", "priority": "warning" },
  { "threshold": 90, "direction": "above", "priority": "critical" }
],
``` 
## 1.3 Value Display
The display field is used to control visualization on the Metrics page. The display field contains three key items, `tile_span`, `visual`, and `charts`: 
*   **Tile span** controls the size of the tile on the home screen. 
*   **Visual** controls the type and properties of the visual on tile and on the top of the metrics page. 
*   **Charts** contains an array of chart types which are shown on the metrics page.

There are six types of visuals that can be specified in the "type" field. To improve visualization each visual can be provided with additional arguments.

|    Visual   |    Variable type    | Examples | Arguments |
|-------------|---------------------|----------|--------------|
| `gauge`       | Bound continous     | Storage use       | `min`, `max`, `invert_y`, `show_alerts` |
| `number`      | Unbound continuous  | Temperature       | `min`, `max`, `invert_y`, `show_alerts` |
| `counter`     | Increasing integers | Tracks downloaded | `time_period`                     |
| `state`       | Categoricals        | Container status  | `states`, `colors`                  |
| `version`     | Version number      | Current Plex version | `format`  |
| `text`        | Free text           | Command output    |                                 |

Charts has not been implemented yet, but I am considering implementing the following chart types: `line`, `area`, `bar` and `pie`. I'd also like to make them stacked.

```json
"display": {
  "tile_span": 1,
  "visual": {
    "type": "gauge", 
    "min": 0,
    "max": "max",
    "invert_y": false
    "show_alerts": true
  },
  "charts": ["line"]
}
```

📊 Series Format 
============================================

A **metric series file** contains the time series for a single metric.

| Field | Description |
|------|-------------|
| `metric_id` | Globally unique metric identifier (also used in data file) that consists of [type].[parent].[property]. |
| `points` | An array of point objects. |

Point objects are defined as follows:

| Field | Required | Type | Description |
|------|-----------|------| -------------|
| `t` |     Yes    | string | Timestamp in ISO-8601 format. |
| `v` |     Yes    | boolean, string, number | Key value | 
| `a` |     No     | Array of `v` | Array of additional values |
| `meta` |  No     | Map | Flexible context such as error messages, durations, log paths, etc.

Example with metadata:

```json
{
  "metric_id": "storage.hard-disk-1.used",
  "points": [
    { "t": "2025-01-01T19:03:00Z", "v": true },
    { "t": "2025-01-02T19:01:00Z", "v": true },
    { "t": "2025-01-03T01:00:00Z", "v": false, "meta": {
        "error": "Backup target not mounted",  "exit_code": 1
    }}
  ]
}
```

meta is intentionally flexible so scripts can add useful details without modifying the schema.

🧩 More Examples of Common Metrics
=============================

### Storage Percentage

```
{
  "id": "storage.hard-disk-1.used_pct",
  "label": "Disk 1 Used %",
  "type": "storage",
  "parent": "hard-disk-1",
  "property": "used_pct",
  "metric_type": "gauge",
  "description": "Part of Seagate drive that is in use",
  "unit": "%",
  "expected_interval_sec": 3600,
  "tags": ["nas", "local"],
  "alerts": [
    {
      "threshold": 80,
      "priority": "info",
    },
    {
      "threshold": 90,
      "priority": "warning",
    },
    {
      "threshold": 95,
      "priority": "critical",
    }
  ],
  "display": {
    "tile_span": 1,
    "chart_type": "line",
    "invert_good_bad": false
  }
}
```

### CPU Temperature
```json
{    
    "id": "system.cpu.temp",    
    "label": "CPU Temperature",    
    "type": "system",    
    "parent": "cpu",    
    "property": "temp",
    "metric_type": "gauge",    
    "unit": "°C"  
}
```

### Service Running Status

```json
 {    
    "id": "service.plex.running",    
    "label": "Plex Status",    
    "type": "service",    
    "parent": "plex",    
    "property": "running",    
    "metric_type": "boolean"  
}
```

### Script Success Indicator

```json
{
    "id": "script.backup_photos.success",
    "label": "Backup Success",
    "type": "script",
    "parent": "backup_photos",
    "property": "success",
    "metric_type": "boolean",
    "alerts": [
        { "threshold": 1, "direction": "below", "priority": "critical" }
    ],  
    "display": {
        "tile_span": 1,
        "chart_type": "line",
        "invert_good_bad": false
    }
}
```  

🔧 Adding a New Metric
======================

1.  You create `metrics/definitions/.json`.
    
2.  Your script creates `metrics/series/.json`.
    
3.  A daemon takes care of creating `metrics/latest.json`.
    
4.  Gatsby rebuilds and the dashboard updates accordingly.
    
In the future, I am planning on an LLM-based metric generation system.

✔ Design Goals
==============

*   **Human-friendly**: easy to write and debug from shell scripts.
    
*   **Machine-friendly**: predictable structure for Gatsby + GraphQL.
    
*   **Extensible**: new metric types, tags, and metadata without changing schema.
    
*   **Composable**: dashboard layout driven entirely by definitions.
    
*   **Time-series ready**: historic view + current tile summary.