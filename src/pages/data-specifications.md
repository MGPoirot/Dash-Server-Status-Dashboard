Server Monitoring Metrics — Data Format Specification
=====================================================

This document describes the JSON data format used by the monitoring dashboard.All monitoring scripts generate metric data in this format, which Gatsby then ingests to build the UI.

The design supports:

*   Many types of metrics (gauge, boolean, version, text, counters)
    
*   Multiple categories (storage, services, system, scripts, network, etc.)
    
*   Alert thresholds
    
*   Timestamps and metric history
    
*   Tile-based UI with filtering (tags, parent, type, priority)
    
*   Extensibility without schema changes
    

📁 File Layout
==============

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   metrics/    defs/        # Metric definitions (metadata + alert rules)    data/        # Metric data (time-series)   `

Each metric has:

*   One **definition file** in metrics/defs/
    
*   One **data file** in metrics/data/
    

They are linked by a shared id / metric\_id.

📘 Metric Definition Format (metrics/defs/\*.json)
==================================================

A **metric definition** describes what the metric _is_, how it should be displayed, and how alerts behave.

Example:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "id": "storage.hard-disk-1.used_gb",    "label": "Disk 1 Used Space",    "type": "storage",    "parent": "hard-disk-1",    "property": "used",    "metric_type": "gauge",     // gauge | counter | boolean | version | text    "unit": "GB",    "default_priority": 2,    "expected_interval_sec": 3600,    "tags": ["nas", "local"],    "alerts": [      {        "threshold": 80,        "direction": "above",        "priority": 3,        "unit": "%"      },      {        "threshold": 90,        "direction": "above",        "priority": 4,        "unit": "%"      }    ],    "display": {      "tile_span": 1,      "chart_type": "line",      "invert_good_bad": false    }  }   `

Definition Fields
-----------------

FieldDescription**id**Globally unique metric identifier (also used in data file).**label**Human-readable title for UI tiles.**type**Category (e.g. storage, service, system, script).**parent**Resource identifier (disk name, service name, etc.).**property**Metric aspect on that resource (used, running, temp…).**metric\_type**Rendering/semantic type.**unit**GB, %, °C, s, etc.**default\_priority**Importance for sorting/filtering.**expected\_interval\_sec**How often data should arrive before classed “stale”.**tags**Optional tags for grouping/filtering.**alerts**Threshold-based alert rules.**display**UI layout: chart type, tile size, etc.

### Supported metric\_type values

TypeMeaningTypical UI**gauge**Numeric value sampled over timeLine chart / sparkline**counter**Monotonic increasing valueRate graph**boolean**True/false statusGreen/red tile**version**Version stringsSimple text tile**text**Free-text or log-like messagesLast value shown

📊 Metric Data Format (metrics/data/\*.json)
============================================

A **metric data file** contains the time series for a single metric.

Example:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "metric_id": "storage.hard-disk-1.used_gb",    "points": [      { "t": "2025-01-01T19:03:00Z", "v": 12.4 },      { "t": "2025-01-02T19:01:00Z", "v": 15.6 }    ]  }   `

Data Point Fields
-----------------

FieldDescription**t**Timestamp in ISO-8601 format.**v**Value (float, int, boolean, string depending on metric\_type).**meta** _(optional)_Extra context such as error messages, durations, log paths, etc.

Example with metadata:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "t": "2025-01-03T01:00:00Z",    "v": false,    "meta": {      "error": "Backup target not mounted",      "exit_code": 1    }  }   `

meta is intentionally flexible so scripts can add useful details without modifying the schema.

🧩 Examples of Common Metrics
=============================

### Storage Percentage

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "id": "storage.hard-disk-1.used_pct",    "label": "Disk 1 Usage %",    "type": "storage",    "parent": "hard-disk-1",    "property": "used_pct",    "metric_type": "gauge",    "unit": "%",    "alerts": [      { "threshold": 80, "direction": "above", "priority": 3 },      { "threshold": 90, "direction": "above", "priority": 4 }    ]  }   `

### CPU Temperature

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "id": "system.cpu.temp",    "label": "CPU Temperature",    "type": "system",    "parent": "cpu",    "property": "temp",    "metric_type": "gauge",    "unit": "°C"  }   `

### Service Running Status

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "id": "service.plex.running",    "label": "Plex Status",    "type": "service",    "parent": "plex",    "property": "running",    "metric_type": "boolean"  }   `

### Script Success Indicator

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   {    "id": "script.backup.success",    "label": "Backup Success",    "type": "script",    "parent": "backup_photos",    "property": "success",    "metric_type": "boolean",    "alerts": [      { "threshold": 1, "direction": "below", "priority": 4 }    ]  }   `

🔧 Adding a New Metric
======================

1.  metrics/defs/.json
    
2.  metrics/data/.json
    
3.  Your script should append or overwrite the points array.
    
4.  Gatsby rebuilds and the dashboard updates accordingly.
    

✔ Design Goals
==============

*   **Human-friendly**: easy to write and debug from shell scripts.
    
*   **Machine-friendly**: predictable structure for Gatsby + GraphQL.
    
*   **Extensible**: new metric types, tags, and metadata without changing schema.
    
*   **Composable**: dashboard layout driven entirely by definitions.
    
*   **Time-series ready**: historic view + current tile summary.