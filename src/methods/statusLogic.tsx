import { AlertType, metricStatus } from "../types/alerts";
import { MetricConfigBasic, ValueMapType } from "../types/metric";
import { PointValue } from "../types/nodes";

export const AlertLogic = (alerts: AlertType[], latestValue: PointValue | undefined): metricStatus => {
  if ( !alerts  || alerts.length === 0) {
    return "ok"      
  }
  if (latestValue === undefined) {
    return "stale";
  }
  if (typeof latestValue !== 'number') {
      return "ok"
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
  interpretedLatestValue: PointValue;
  status: metricStatus;
};


export const colorValue = (
  value: PointValue | undefined,
  mapping: ValueMapType,
  fallback = "#ff0000"
): string => {
  if (value === undefined) return fallback;

  const key = String(value);
  return mapping?.[key] ?? fallback;
};

export const interpretValue = (
  value: PointValue | undefined,
  mapping: ValueMapType,
  fallback = "NA"
): PointValue => {
  if (value === undefined) return fallback;
  return mapping?.[String(value)] ?? value;
};

export const resolveMetricValue = (
  metric: MetricConfigBasic | undefined,
  latestValue: PointValue
): TileValueResult => {
  if (metric === undefined || latestValue === undefined) {
    return { interpretedLatestValue: "NA", status: "stale" };
  }

  const interpretedLatestValue = metric.meaningMap ? interpretValue(latestValue, metric.meaningMap) : latestValue;

  let status: metricStatus = "ok";

  if (metric.alerts) {
    status = AlertLogic(metric.alerts, latestValue);
  }

  return { interpretedLatestValue, status };
};