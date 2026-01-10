export type PointValue = string | number;

export type NumberPoint = {
  t: string;
  v: number;
  vv?: Record<string, number>
  meta?: string;
};

export type StringPoint = {
  t: string;
  s: string;
  ss?: Record<string, string>
  meta?: string;
};

export type NumberSeriesNode = {
  metric_id: string;
  points: NumberPoint[];
};

export type StringSeriesNode = {
  metric_id: string;
  points: StringPoint[];
};

export type SeriesNode = NumberSeriesNode | StringSeriesNode;

export function latestValue(series: SeriesNode): number | string | null {
  const p0 = series.points?.[0];
  if (!p0) return null;

  if ("v" in p0) return p0.v; // NumberPoint
  if ("s" in p0) return p0.s; // StringPoint
  return null;
}