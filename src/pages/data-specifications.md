Server Monitoring Metrics — Data Format Specification
=====================================================

This document describes the JSON data format used by the monitoring dashboard. All monitoring scripts generate metric data in this format, which Gatsby then ingests to build the UI.

The design supports:

*   Categorization of metrics by type, parent, and property.

*   Many types of metrics (gauge, state, version, text, counters)

*   Alert thresholds
    
*   Timestamps and metric history
    
*   Tile-based UI with filtering (tags, parent, type, priority)
    
*   Extensibility without schema changes
    

📁 File Layout
==============

Each metric has three files linked by a shared `id`. This `id` consists of a `[type].[parent].[property]`. The files are stored in the following folders:  
`/content/metrics/`  
├── `definitions/[type].[parent].[property].json`  
├── `series/[type].[parent].[property].json`  
└── `latest/[type].[parent].[property].json`    


📘 Metric Definition Format (metrics/definitions/\*.json)
==================================================

A **metric definition** describes what the metric _is_, how it should be displayed, and how alerts behave.

| Field | Required | Description |
|------|-------------|-------------|
| **label** | Yes |  Human-readable title for UI tiles. |
| **Description** | No | Human-readable description with HTML support. |
| **id** | Yes |Globally unique metric identifier (also used in data file) that consists of [type].[parent].[property]. |
| **type** | Yes |Category (e.g. storage, service, system, script). |
| **parent** | Yes |Resource identifier (disk name, service name, etc.). |
| **property** | Yes | Metric aspect on that resource (used, running, temp…). |
| **metric_type** | Yes | Rendering / semantic type. |
| **unit** |  No | GB, %, °C, s, etc. |
| **mapping** |  No | Maps values to words, 1 "Up", 0.5 "Stopped", 0 "Down" |
| **expected_interval_sec** | No | How often data should arrive before classed “stale”. |
| **tags** |  No | Optional tags for grouping / filtering. |
| **alerts** | No | Threshold-based alert rules. |
| **display** | No |UI layout: chart type, tile size, and if the y-axis should be flipped in case `invert_good_bad`, etc. |

Example:

```json
{
  "label": "Disk 1 Used Space",
  "description": "Tracks the amount of used storage space on Hard Disk 1 in terabytes (TB). This metric helps monitor disk usage and capacity planning.",
  "id": "storage.hard-disk-1.used",
  "type": "storage",
  "parent": "hard-disk-1",
  "property": "used",
  "metric_type": "gauge",
  "unit": "TB",
  "expected_interval_sec": 3600,
  "tags": ["nas", "local"],
  "alerts": [
    { "threshold": 9.5,  "direction": "above",  "priority": "info" },
    { "threshold": 10.5, "direction": "above",  "priority": "warning" },
    { "threshold": 11.5, "direction": "above", "priority": "critical"}
  ],
  "display": {
    "tile_span": 1,
    "chart_type": "line",
    "invert_good_bad": false  
  }
}
```

## Mapping
When storing values and configuring alerts it may be easier to store numeric values. To present human readable values the mapping field can be used. If the value is not present in the mapping, the raw value is returned.
```json
  "mapping": {
    "1": "Up",
    "0.5": "Stopped",
    "0": "Down"
  },
```

## Display
The display field is used to control visualization on the Metrics page.
`invert_good_bad` can be used to flip the y-axis of graphs on the Metrics page.
```json
 "display": {
    "tile_span": 1,
    "chart_type": "line",
    "invert_good_bad": false  
  }
```

Definition Fields
-----------------

📊 Metric Series Format (metrics/series/\*.json)
============================================

A **metric series file** contains the time series for a single metric.

| Field | Description |
|------|-------------|
| **metric_id** | Globally unique metric identifier (also used in data file) that consists of [type].[parent].[property]. |
| **points** | An array of point objects. |

Points object consist of:
* **t** Timestamp in ISO-8601 format.
* **v** Value (float, int, boolean, string depending on metric\_type).
* **meta** _(optional)_ Extra context such as error messages, durations, log paths, etc.

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

🧩 Examples of Common Metrics
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
        { "threshold": 1,
        "priority": 4 }
        ]  
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
    

✔ Design Goals
==============

*   **Human-friendly**: easy to write and debug from shell scripts.
    
*   **Machine-friendly**: predictable structure for Gatsby + GraphQL.
    
*   **Extensible**: new metric types, tags, and metadata without changing schema.
    
*   **Composable**: dashboard layout driven entirely by definitions.
    
*   **Time-series ready**: historic view + current tile summary.