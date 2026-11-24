const ALERT_STATUSES = [
  "info",
  "warning",
  "critical",
] as const;

export type alertPriority = typeof ALERT_STATUSES[number];

type alertDirection = "above" | "below";

export const METRIC_STATUSES = [
  "ok",
  "stale",
  ...ALERT_STATUSES,
] as const;

export const priorityRank: Record<metricStatus, number> = {
  ok: 0,
  stale: 1,
  info: 2,
  warning: 3,
  critical: 4,
};

export type metricStatus = typeof METRIC_STATUSES[number];

export type AlertType = {
  threshold: number;
  direction: alertDirection;
  priority: alertPriority;
};

export const isMetricStatus = (value: string): value is metricStatus =>
  METRIC_STATUSES.includes(value as metricStatus);
