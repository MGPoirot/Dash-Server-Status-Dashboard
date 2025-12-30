export type Point = {
  t: string;
  v: any;
};

type LatestPoint = Point & {
  meta?: string;
};

export type MetricFileParent = {
  name: string; // e.g. "system.cpu.temp"
};

export type LatestNode = {
  metric_id: string;
  points: LatestPoint[];
  parent: MetricFileParent;
};
