
export type alertPriority = "info" | "warning" | "critical";

export type alertEmoji = "ℹ️" | "⚠️" | "🚨"

export type definitionStatus = "ok" | "stale" | alertPriority;

export type statusEmoji =  "✅" | "❓" | alertEmoji;

type alertDirection = "above" | "below";

export type statusAlt = "OK" | "Stale" | "Info" | "Warning" | "Critical";

export const StatusToEmoji: Record<definitionStatus, statusEmoji> = {
  ok: "✅",
  stale: "❓",
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

export interface Alert {
  threshold: number;
  direction: alertDirection;
  priority: alertPriority;
}