// NumberVisual.tsx
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { NumberProps } from "../../../types/visuals";
import { NumberPoint } from "../../../types/nodes";
import { AlertType, metricStatus } from "../../../types/alerts";
import { AlertLogic } from "../../../methods/statusLogic";
import { spaceUnit, statusToThemeColor } from "../../../methods/utils";
import { reduceByDecimals, ISOToHuman } from "../../../methods/utils";
import {
  Container,
  Svg,
  LinePath,
  AlertBand,
  XLabelText,
  ChartTextDim,
  StyledRect,
  EndDot,
  EndDotText,
} from "./NumberVisual.style";

type NumberRuntimeProps = NumberProps & {
  points: NumberPoint[];
  alerts?: AlertType[];
  nLatestPoints?: number;
  unit?: string;
};

type Band = {
  y1: number;
  y2: number;
  status: metricStatus;
};

type PointValue = number | string | Record<string, number> | Record<string, string> | null;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Build non-overlapping, contiguous alert bands.
 */
function buildAlertBands(minV: number, maxV: number, alerts: AlertType[]): Band[] {
  if (!alerts?.length) return [];

  const below = alerts
    .filter((a) => a.direction === "below")
    .map((a) => ({ ...a, threshold: clamp(a.threshold, minV, maxV) }))
    .sort((a, b) => a.threshold - b.threshold);

  const above = alerts
    .filter((a) => a.direction === "above")
    .map((a) => ({ ...a, threshold: clamp(a.threshold, minV, maxV) }))
    .sort((a, b) => a.threshold - b.threshold);

  const bands: Band[] = [];

  let prev = minV;
  for (const a of below) {
    const t = a.threshold;
    if (t > prev) {
      bands.push({ y1: prev, y2: t, status: a.priority });
      prev = t;
    }
  }

  for (let i = 0; i < above.length; i++) {
    const a = above[i];
    const t1 = a.threshold;
    const t2 = i < above.length - 1 ? above[i + 1].threshold : maxV;
    if (t2 > t1) {
      bands.push({ y1: t1, y2: t2, status: a.priority });
    }
  }

  return bands
    .map((b) => ({ ...b, y1: Math.min(b.y1, b.y2), y2: Math.max(b.y1, b.y2) }))
    .filter((b) => b.y2 - b.y1 > 0);
}

const NumberVisual = ({
  min,
  max,
  invert_y = false,
  hideAlerts,
  points,
  alerts = [],
  unit,
  nLatestPoints = 30,
}: NumberRuntimeProps) => {
  const latest = points.slice(Math.max(0, points.length - nLatestPoints));

  const derived = useMemo(() => {
    const vs = latest.map((p) => p.v).filter((v) => typeof v === "number" && Number.isFinite(v));
    const minFallback = vs.length ? Math.min(...vs) : 0;
    const maxFallback = vs.length ? Math.max(...vs) : 1;

    const span = maxFallback - minFallback;
    const safeMin = span === 0 ? minFallback - 1 : minFallback;
    const safeMax = span === 0 ? maxFallback + 1 : maxFallback;

    return {
      minV: typeof min === "number" ? min : safeMin,
      maxV: typeof max === "number" ? max : safeMax,
    };
  }, [latest, min, max]);

  const v = latest.at(-1)?.v ?? null;
  const status: metricStatus = v != null ? (AlertLogic(alerts, v) as metricStatus) : "stale";

  const width = 200;
  const height = 220;

  const padL = 52;
  const padR = 14;
  const padT = 12;
  const padB = 36;

  const minV = derived.minV;
  const maxV = derived.maxV;

  const availW = width - padL - padR;
  const availH = height - padT - padB;

  const side = Math.min(availW, availH);
  const innerW = side;
  const innerH = side;

  const chartX = padL + (availW - side) / 2;
  const chartY = padT + (availH - side) / 2;
  const chartBottom = chartY + innerH;

  const mapX = (i: number) =>
    chartX + (latest.length <= 1 ? innerW / 2 : (i / (latest.length - 1)) * innerW);

  const mapY = (val: number) => {
    const r = (val - minV) / (maxV - minV);
    const rr = invert_y ? r : 1 - r;
    return chartY + rr * innerH;
  };

  const polylinePoints = latest
    .map((p, i) => `${mapX(i)},${mapY(clamp(p.v, minV, maxV))}`)
    .join(" ");

  const bands = !hideAlerts ? buildAlertBands(minV, maxV, alerts) : [];

  const minLabel = `${reduceByDecimals(minV)}${spaceUnit(unit, minV === 1)}`;
  const maxLabel = `${reduceByDecimals(maxV)}${spaceUnit(unit, maxV === 1)}`;

  const lastIdx = Math.max(0, latest.length - 1);
  const lastX = latest.length ? mapX(lastIdx) : chartX + innerW;
  const lastY = latest.length ? mapY(clamp(latest[lastIdx].v, minV, maxV)) : chartY + innerH / 2;

  const xLabels = useMemo(() => {
    const n = latest.length;
    if (n === 0) return [];

    const firstIso = latest[0]?.t;
    const lastIso = latest[n - 1]?.t;
    if (!firstIso || !lastIso) return [];

    const [firstLabel, lastLabel] = ISOToHuman([firstIso, lastIso]);

    return [
      { i: 0, x: mapX(0), label: firstLabel },
      { i: n - 1, x: mapX(n - 1), label: lastLabel },
    ];
  }, [latest]);

  const xLabelY = chartBottom + 18;
  const vbPad = 2;
  const vbExtraRight = 24;
  const vbExtraBottom = 24;

  const vbX = Math.floor(chartX - vbPad);
  const vbW = Math.ceil(innerW + vbPad * 2 + vbExtraRight);

  const vbYOffset = 18;

  const vbY = Math.floor(chartY - vbPad - vbYOffset);
  const vbH = Math.ceil(xLabelY - chartY + vbPad * 2 + vbExtraBottom + vbYOffset);

  const lineRef = useRef<SVGPolylineElement | null>(null);
  useLayoutEffect(() => {
    const el = lineRef.current;
    if (!el) return;

    const len = el.getTotalLength();
    el.style.setProperty("--path-len", `${len}`);

    el.classList.remove("is-drawing");
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.getBoundingClientRect();
    el.classList.add("is-drawing");
  }, [polylinePoints]);

  const dotDelayMs = 800;

  const endDotText = `${v ? reduceByDecimals(v) : "–"}${spaceUnit(unit, v === 1)}`;

  return (
    <Container
      $chartBg={(theme) => statusToThemeColor(theme, "ok")}
      $endOrigin={`${lastX}px ${lastY}px`}
      $endDelayMs={dotDelayMs}
    >
      <Svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        role="img"
        aria-label="Number line chart"
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <clipPath id="chartClip">
            <StyledRect x={chartX} y={chartY} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        <StyledRect x={chartX} y={chartY} width={innerW} height={innerH} fill="var(--chart-bg)" />

        <g clipPath="url(#chartClip)">
          {bands.map((b, idx) => {
            const yTop = Math.min(mapY(b.y1), mapY(b.y2));
            const yBot = Math.max(mapY(b.y1), mapY(b.y2));
            const h = Math.max(0, yBot - yTop);

            return (
              <AlertBand
                key={`${b.status}-${idx}`}
                x={chartX}
                y={yTop}
                width={innerW}
                height={h}
                $fill={(theme) => statusToThemeColor(theme, b.status)}
              />
            );
          })}

          <LinePath ref={lineRef} points={polylinePoints} $stroke={(theme) => theme?.colors?.text ?? "#111827"} />
        </g>

        <ChartTextDim x={chartX + 8} y={chartY + 8} textAnchor="start" dominantBaseline="hanging">
          {maxLabel}
        </ChartTextDim>

        <ChartTextDim x={chartX + 8} y={chartY + innerH - 8} textAnchor="start" dominantBaseline="auto">
          {minLabel}
        </ChartTextDim>

        {latest.length > 0 && v != null && (
          <g className="end-dot-pop">
            <EndDot cx={lastX} cy={lastY} r={18} $fill={(theme) => statusToThemeColor(theme, status)} />
            <EndDotText x={lastX} y={lastY} textAnchor="middle" dominantBaseline="middle" dy="0.12em" dx="0.01em">
              {endDotText}
            </EndDotText>
          </g>
        )}

        {xLabels.map((xl) => (
          <XLabelText
            key={`xl-${xl.i}`}
            x={xl.x}
            y={xLabelY}
            textAnchor={xl.i === 0 ? "start" : xl.i === latest.length - 1 ? "end" : "middle"}
            dominantBaseline="middle"
          >
            {xl.label}
          </XLabelText>
        ))}
      </Svg>
    </Container>
  );
};

export default NumberVisual;
