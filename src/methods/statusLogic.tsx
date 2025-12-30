import { Alert, StatusToEmoji, definitionStatus } from "../types/alerts";
import {MetricDefinitionNode } from "../types/metric";

export const AlertLogic = (alerts: Alert[], latestValue: number | undefined): definitionStatus => {
    if (alerts.length === 0 || latestValue === undefined) {
      return "stale";
    }
    // Check which alerts have been triggered based on latestValue
    const triggeredAlerts = alerts.filter((alert) => {
      if (
        (alert.direction === "above" && latestValue > alert.threshold) ||
        (alert.direction === "below" && latestValue < alert.threshold)
      ) {
        return alert;
      }
      return null;
    });
    // Return the highest priority alert or "—"
    if (triggeredAlerts.length === 0) {
      return "ok";
    }
    const highestPriorityAlert = triggeredAlerts.reduce((prev, current) => {
      const priorityOrder = { critical: 3, warning: 2, info: 1 };
      return priorityOrder[prev.priority] > priorityOrder[current.priority] ? prev : current;
    });
    return highestPriorityAlert.priority;
  };

type TileValueResult = {
  latestValueString: string;
  status: definitionStatus;
  statusEmoji: string;
};

export const resolveMetricValue = (
  metric: MetricDefinitionNode | undefined,
  latestValue: number | undefined
): TileValueResult => {
  // defaults
  let latestValueString = "";
  let status: definitionStatus = "stale";
  let statusEmoji = "❓";

  if (!metric || latestValue === undefined) {
    return { latestValueString, status, statusEmoji };
  }

  const key = String(latestValue);

  // value → label mapping
  latestValueString = metric.mapping?.[key] ?? key;

  // alert → status → emoji
  if (metric.alerts) {
    status = AlertLogic(metric.alerts, latestValue);
    statusEmoji = StatusToEmoji[status];
  }

  return { latestValueString, status, statusEmoji };
};
