Metric Configuration
===================

This document describes what a metric configuration file represents and explains the meaning of each property at a conceptual level. It is intended for readers who want to understand *what* is being defined and *why*, without needing to understand implementation details.  For more details see [config](/config).

A metric configuration describes **one metric**: what it represents, how often it is measured, how it is shown, and how its values should be interpreted.

## Metric Definition Fields

| Field           | Required | Short explanation                                                                |
| --------------- | :------: | -------------------------------------------------------------------------------- |
| **label**       |    Yes   | Short, human-readable name shown in the UI.                                      |
| **description** |    No    | Optional explanation of what is measured and how to interpret it.                |
| **metric_id**   |    Yes   | Unique identifier tying the config, script output, history, and alerts together. |
| **type**        |    Yes   | High-level category the metric belongs to (e.g. system, storage, service).       |
| **component**   |    Yes   | The specific thing being measured (service name, disk, container, etc.).         |
| **property**    |    Yes   | The aspect of the component that is measured (usage, state, temperature, etc.).  |
| **schedule**    |    Yes   | How often the measurement should be updated.                                     |
| **display**     |    Yes   | Defines how the metric is presented in the dashboard.                            |
| **unit**        |    No    | Unit of measurement, when it adds clarity (%, °C, GB, days, etc.).               |
| **tags**        |    No    | Labels used for grouping and filtering metrics in the UI.                        |
| **meaningMap**  |    No    | Maps raw values to human-readable states or meanings.                            |
| **alerts**      |    No    | Rules that define when the value becomes noteworthy or urgent.                   |

## Conceptual Notes on Key Properties

**label**
This is the name a human sees. It should be short and immediately understandable without additional context.

**metric_id**
This is the canonical identity of the metric. It is how the system knows that values collected over time belong to the same concept.

**type, component, property**
Together, these describe *what is being measured* in a structured way:

* *type* answers “what general area does this belong to?”
* *component* answers “which specific thing?”
* *property* answers “which aspect of that thing?”

**schedule**
Defines the rhythm of measurement. The frequency should match how quickly the underlying value can meaningfully change.

**display**
Controls how the value is shown to humans. The chosen visual should match the nature of the data (bounded, unbounded, categorical, textual).

**unit**
Clarifies scale and meaning. It should only be included when it improves interpretation.

**meaningMap**
Translates internal values into human language. Especially useful for state-like metrics where numbers represent categories rather than quantities.

**alerts**
Describe when a value crosses from “interesting” into “actionable”. Alerts encode operational significance, not measurement logic.

**tags**
Help organize and navigate metrics. They are purely descriptive and do not affect behavior.

---

At a high level, a good configuration answers four questions clearly:

1. What is this metric about?
2. How often should it be checked?
3. How should a human understand it at a glance?
4. When does it require attention?

If those answers are clear, the configuration is serving its purpose.
