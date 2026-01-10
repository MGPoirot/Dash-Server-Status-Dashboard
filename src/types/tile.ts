import { MetricConfigBasic } from "./metric";
import { PointValue } from "./nodes";

export interface TileProps {
  to: string;
  metric: MetricConfigBasic;
  latestValue?: PointValue;
}
