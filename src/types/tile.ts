import { MetricDefinitionNode } from "./metric";

export interface TileProps {
  to: string;
  metric: MetricDefinitionNode;
  latestValue?: number;
}
