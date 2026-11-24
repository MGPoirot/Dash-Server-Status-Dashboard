Series Data
=================

Series data stores the **historical record of a single metric**.
It captures how a metric changes over time and is used for charts, trend analysis, and debugging.

Each time a monitoring script runs successfully, one new data point is added to the series.

## Series Structure

A series belongs to exactly one metric.

| Field         | Meaning                                          |
| ------------- | ------------------------------------------------ |
| **metric_id** | Identifies which metric this history belongs to. |
| **points**    | Time-ordered list of recorded measurements.      |

## Data Points

Each entry in `points` represents one execution of the monitoring script.

| Field         | Required | Meaning                                                     |
| ------------- | :------: | ----------------------------------------------------------- |
| **t**         |    Yes   | When the measurement was taken.                             |
| **v** / **s** |    Yes   | Primary measured value (numeric or string).                 |
| **d**         |    No    | Optional additional values related to the same measurement. |
| **meta**      |    No    | Optional diagnostic or explanatory information.             |

## Value Semantics

* The primary value is the main result of the measurement.
* Its interpretation is defined by the metric configuration, not by the series itself.
* Additional values provide context but do not change the meaning of the primary value.

## Metadata

The `meta` field is intended for humans.

Typical uses include:

* explaining partial failures
* noting unusual conditions
* pointing to logs or other diagnostics

Metadata is not used for alerting or visualization logic.

## Time and Ordering

* Points are stored in chronological order.
* Timestamps reflect when the script ran.
* Gaps or irregular spacing usually indicate scheduling or execution issues.

## Precision and Display

* Series data stores values exactly as produced by the script.
* Rounding and formatting are handled by the dashboard.
* Historical data is never retroactively modified for display purposes.

## Role in the System

Series data connects measurement to interpretation over time:

* Scripts produce values.
* Series data preserves them.
* Config files explain how to read them.
* Dashboards and alerts consume the result.

A series is the long-term memory of a metric.
