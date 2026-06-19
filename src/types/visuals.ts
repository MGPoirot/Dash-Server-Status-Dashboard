import { ValueMapType } from "./metric";

export type GaugeProps = {
  type: "gauge",
  min: number;
  max: number;
  invert_y?: boolean;
  hideAlerts?: boolean;
}

export type NumberProps = {
  type: "number";
  min?: number;
  max?: number;
  nLatestPoints?: number;
  invert_y?: boolean;
  hideAlerts?: boolean;
}

export type CounterProps = {
  type: "counter";
  nLatestPoints?: number;
  hideAlerts?: boolean;
}

export type StateProps = {
  type: "state";
  colorMap?: ValueMapType;
}

export type VersionProps = {
  type: "version";
  nLatestPoints?: number;
}

export type TextProps = {
  type: "text";
}

export type VisualProps =
  | GaugeProps
  | NumberProps
  | CounterProps
  | StateProps
  | VersionProps
  | TextProps;

export type VisualType = VisualProps["type"];
