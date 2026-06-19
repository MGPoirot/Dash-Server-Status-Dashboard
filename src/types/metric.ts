import {AlertType} from "./alerts";
import { VisualProps } from "./visuals";
import { PointValue } from "./nodes";

type ScheduleType = 
  "weekly" | "bi-daily" | "daily" | "twice-daily" | "hourly" | 
  "half-hourly" | "quarter-hourly" | "five-minutely" | "minutely"

type DisplayConfig = {
    tile_span?: number;
    charts?: string[];
    visual?: VisualProps;
    invert_y?: boolean;
}

export type ValueMapType = Record<PointValue, string> | null

export type MetricConfigBasic = {
  label: string;
  description?: string;
  metric_id: string;
  unit?: string;
  meaningMap?: ValueMapType;
  alerts?: AlertType[];
  display?: DisplayConfig;
  tags?: string[];
};

export  type MetricConfig = MetricConfigBasic & {
  type: string;
  component: string;
  property: string;
  schedule: ScheduleType;
}

