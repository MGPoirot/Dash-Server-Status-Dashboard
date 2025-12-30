import { Point, MetricFileParent } from "./latest";

export type SeriesNode = {
  metric_id: string;
  points: Point[];
  parent: MetricFileParent;
};
