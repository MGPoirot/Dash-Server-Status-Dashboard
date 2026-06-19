Monitoring Scripts
=================

This document explains, at a high level, what a “monitoring script” is, why it exists, and how it fits into the overall monitoring system. It is written for readers who are new to the system and do not yet need to understand implementation details. For more details see [script](/script).

## What Is a Monitoring Script?

A monitoring script is a small program whose only responsibility is to answer a single question about a system.

Examples of such questions are:

* How full is this disk?
* Is this service running?
* How many items exist in this library?
* What version of a service is currently deployed?

Each script measures exactly one thing and reports the result in a standard format so that the monitoring system can display it, store it, and evaluate alerts.

## How the Monitoring System Uses Scripts

The monitoring system runs these scripts on a schedule. It does not interact with them while they are running and does not pass them any arguments.

From the system’s perspective, a script is a black box:

* It starts the script
* It waits for it to finish
* It reads a single JSON result from standard output
* It checks the exit code

If the script follows the agreed contract, the system can treat all scripts the same, regardless of what they measure internally.

## What a Script Is Expected to Produce

Every script produces one **primary value**. This is the main thing being monitored.

Depending on what the dashboard wants to show, this primary value can be:

* A number (for counters, gauges, or states)
* A string (for text labels or version information)

In addition to the primary value, a script may also produce:

* A small set of additional named values that give context
* A short human-readable explanation or diagnostic message

These extra pieces are optional, but the primary value is always required.

## Success, Failure, and Meaning

A key idea in this system is the difference between *measurement success* and *measurement meaning*.

A script can succeed even if the measured value is “bad”.

For example:

* A disk being 98% full is a valid measurement
* A service being stopped is a valid measurement

In both cases, the script ran correctly and should report success.

A script should only be considered to have failed if it cannot measure anything at all. Examples include:

* Required system information is missing
* A necessary interface does not exist
* The environment is fundamentally incompatible

This distinction allows alerting and interpretation to happen in the dashboard, not inside the script.

## How Scripts Communicate Results

Scripts do not talk directly to the monitoring system. They communicate in a very simple way:

* They print a single JSON object to standard output
* They exit with a numeric exit code

The JSON contains:

* When the measurement was taken
* The primary value
* Any optional additional values
* Optional explanatory text

Because all scripts follow the same structure, the monitoring system can process them uniformly.

## Why There Are Strict Rules

The strict rules around script structure, output, and dependencies exist for a reason.

They ensure that:

* Scripts behave predictably
* Scripts are easy to reason about
* Scripts can be executed safely and repeatedly
* Failures are understandable and diagnosable
* The monitoring system remains stable as it grows

Without these constraints, small one-off scripts would gradually become complex, fragile programs that are hard to maintain.

## What Scripts Are Allowed to Rely On

Scripts run in a controlled environment:

* A specific Python version
* A limited set of approved libraries
* A known set of environment variables for configuration

This keeps scripts portable and prevents hidden dependencies on system state that may change over time.

Scripts are expected to read information from reliable system sources (for example the operating system, service managers, or well-defined APIs) rather than relying on brittle assumptions.

## What Scripts Are *Not*

Monitoring scripts are intentionally simple.

They are not:

* Long-running services
* General-purpose automation tools
* Alerting engines
* Data processing pipelines

They should not:

* Store state across runs
* Modify the system they are observing
* Contain business logic about what is “good” or “bad”

Their job is to observe and report, nothing more.

## How to Read a Monitoring Script

When reading a monitoring script, it helps to ask three questions:

1. What single thing is this script measuring?
2. Where does it get that information from?
3. What value does it report as the primary result?

Everything else in the script exists to support those three points.

Once you understand that, the rest of the monitoring system becomes much easier to reason about.
