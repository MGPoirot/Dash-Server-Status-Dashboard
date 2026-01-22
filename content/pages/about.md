# Dash — Server Status Dashboard

Dash is a lightweight, file-driven dashboard for monitoring the status and health of services, hosts, and integrations. It is designed to be simple to operate, transparent in how data is represented, and easy to extend without requiring a database or complex backend.

## File layout
Each metric is identified by `[type]_[component]_[property]`.
This identifier is referred to as metric_id and is used consistently across all files:
*   **script**: the script that executes the monitoring
*   **configs**: static metadata and UI configuration
*   **series**: full historical time series
*   **latest**: most recent point only

<pre>
content/  
├── scripts/  
│   └── [type]_[component]_[property].py  
├── configs/  
│   └── [type]_[component]_[property].json  
├── series/  
│   └── [type]_[component]_[property].json  
└── latest/  
    └── [type]_[component]_[property].json  
</pre>

## Tools
Three tools are available to manage the dashboard. They can all be used with `conda activate DashPy`. The prompts used by the LLM components of these scripts can be found in [prompts](/prompt)
* `add_metric`: Invokes Claude to generate a new config and script file based on a user provided monitor request.
* `delete_metric`: Deletes a metric across the file system.
* `harmonize_configs`: Updates descriptions, labels, and tags using Claude.