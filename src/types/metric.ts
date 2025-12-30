import {Alert} from "./alerts";

type DisplayConfig = {
    tile_span?: number;
    chart_type?: string;
    invert_good_bad?: boolean;
}

export type MetricDefinitionNode = {
  label: string;
  description?: string;
  metric_id: string;                    // Gatsby node id
  type: string;
  parent: any;
  metric_type: string;
  unit?: string;
  mapping?: Record<string, string> | null;
  tags?: string[];
  expected_interval_sec?: number;
  alerts?: Alert[];
  display?: DisplayConfig;
};