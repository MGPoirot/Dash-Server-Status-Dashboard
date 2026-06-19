// StateVisual.tsx
import React, { useMemo } from "react";
import { StateProps } from "../../../types/visuals";
import { NumberPoint, PointValue } from "../../../types/nodes";
import { AlertType } from "../../../types/alerts";
import { ValueMapType } from "../../../types/metric";
import { interpretValue, AlertLogic } from "../../../methods/statusLogic";
import { StyledColorBox, Boxes } from "./StateVisual.style";
import { valueToString } from "../../../methods/utils";

type StateRuntimeProps = StateProps & {
  points: NumberPoint[];
  alerts?: AlertType[];
  meaningMap?: ValueMapType;
};

type Row = {
  key: string;
  value: PointValue;
  label: string;
  colorToken: string;
  isActive: boolean;
};

function parseValueKey(key: string): PointValue {
  if (key.trim() !== "" && !Number.isNaN(Number(key))) return Number(key);
  return key;
}

const StateVisual = ({ colorMap, points, alerts = [], meaningMap }: StateRuntimeProps) => {
  const value = points.at(-1)?.v;

  const rows: Row[] = useMemo(() => {
    if (colorMap) {
      return Object.entries(colorMap).map(([valueKey, colorToken]) => {
        const v = parseValueKey(valueKey);
        return {
          key: valueKey,
          value: v,
          label: meaningMap
            ? valueToString(interpretValue(v, meaningMap))
            : valueToString(v),
          colorToken,
          isActive: value !== undefined && v === value,
        };
      });
    }

    if (meaningMap) {
      return Object.entries(meaningMap).map(([valueKey]) => {
        const v = parseValueKey(valueKey);
        return {
          key: valueKey,
          value: v,
          label: valueToString(interpretValue(v, meaningMap)),
          colorToken: AlertLogic(alerts, v),
          isActive: value !== undefined && v === value,
        };
      });
    }

    // nothing to show if there is no value
    if (value === undefined) return [];

    return [
      {
        key: String(value),
        value,
        label: valueToString(value),
        colorToken: AlertLogic(alerts, value),
        isActive: true,
      },
    ];
  }, [colorMap, meaningMap, alerts, value]);

  return (
    <Boxes>
      {rows.map((r) => (
        <StyledColorBox key={r.key} $color={r.colorToken} $active={r.isActive}>
          {r.label}
        </StyledColorBox>
      ))}
    </Boxes>
  );
};

export default StateVisual;
