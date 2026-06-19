// Visuals.tsx
import * as React from "react";
import GaugeVisual from "./GaugeVisual/GaugeVisual";
import NumberVisual from "./NumberVisual/NumberVisual";
import CounterVisual from "./CounterVisual/CounterVisual";
import StateVisual from "./StateVisual/StateVisual";
import VersionVisual from "./VersionVisual/VersionVisual";
import TextVisual from "./TextVisual/TextVisual";

import { VisualProps } from "../../types/visuals";
import { StringPoint, NumberPoint } from "../../types/nodes";
import { AlertType } from "../../types/alerts";
import { ValueMapType } from "../../types/metric";

export type NumericVisualType = "gauge" | "number" | "counter" | "state";
export type StringVisualType = "text" | "version";

type CommonRuntimeProps = {
  alerts?: AlertType[];
  unit?: string;
  meaningMap?: ValueMapType;
};

type VisualRuntimeProps =
  | (Extract<VisualProps, { type: NumericVisualType }> &
      CommonRuntimeProps & {
        points: NumberPoint[];
      })
  | (Extract<VisualProps, { type: StringVisualType }> &
      CommonRuntimeProps & {
        points: StringPoint[];
      });

/**
 * Loose runtime entrypoint (useful when the caller has SeriesNode.points typed as unknown/mixed).
 * This keeps the "double switch" out of page templates.
 */
type VisualRuntimeLooseProps = VisualProps &
  CommonRuntimeProps & {
    points: NumberPoint[] | StringPoint[];
  };

const Visual = (visual: VisualRuntimeProps) => {
  switch (visual.type) {
    case "gauge":
      return <GaugeVisual {...visual} />;
    case "number":
      return <NumberVisual {...visual} />;
    case "counter":
      return <CounterVisual {...visual} />;
    case "state":
      return <StateVisual {...visual} />;
    case "version":
      return <VersionVisual {...visual} />;
    case "text":
      return <TextVisual {...visual} />;
  }
};

/**
 * Wrapper that accepts (NumberPoint[] | StringPoint[]) and routes to the strict Visual().
 * It performs the minimal, centralized assertions needed due to GraphQL typings.
 */
const VisualLoose = (visual: VisualRuntimeLooseProps) => {
  switch (visual.type) {
    case "gauge":
    case "number":
    case "counter":
    case "state":
      return (
        <Visual
          {...(visual as Extract<VisualProps, { type: NumericVisualType }> & CommonRuntimeProps)}
          points={visual.points as unknown as NumberPoint[]}
        />
      );

    case "text":
    case "version":
      return (
        <Visual
          {...(visual as Extract<VisualProps, { type: StringVisualType }> & CommonRuntimeProps)}
          points={visual.points as unknown as StringPoint[]}
        />
      );
  }
};

export default VisualLoose;
