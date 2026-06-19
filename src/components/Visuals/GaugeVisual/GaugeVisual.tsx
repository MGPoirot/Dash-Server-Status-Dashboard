// GaugeVisual.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { GaugeProps } from "../../../types/visuals";
import { NumberPoint } from "../../../types/nodes";
import { AlertType, metricStatus, priorityRank } from "../../../types/alerts";
import { reduceByDecimals, spaceUnit, statusToThemeColor } from "../../../methods/utils";
import {
  Container,
  Svg,
  ArcPath,
  BaseArc,
  Needle,
  NeedlePivot,
  ValueText,
  RangeText,
} from "./GaugeVisual.style";
import type { Theme } from "../../../styles/themes";

type GaugeRuntimeProps = GaugeProps & {
  points: NumberPoint[];
  alerts?: AlertType[];
  unit?: string;
};

const SWEEP_DEG = 252;
const START_DEG = -90 - SWEEP_DEG / 2;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function uniqueSorted(nums: number[]) {
  const s = Array.from(new Set(nums.map((n) => Number(n.toFixed(10)))));
  s.sort((a, b) => a - b);
  return s;
}

function valueToAngleDeg(value: number, min: number, max: number, invert: boolean | undefined) {
  const denom = max - min;
  if (denom <= 0) return START_DEG;
  let r = (value - min) / denom;
  r = clamp(r, 0, 1);
  if (invert) r = 1 - r;
  return START_DEG + r * SWEEP_DEG;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (Math.PI / 180) * angleDeg;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const delta = Math.abs(endDeg - startDeg);
  const largeArcFlag = delta > 180 ? 1 : 0;

  // we normalize start/end, so always sweep forward
  const sweepFlag = 1;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
}

function getStatusForValue(value: number, alerts: AlertType[]): metricStatus {
  let best: metricStatus = "ok";

  for (const a of alerts) {
    if (!Number.isFinite(a.threshold)) continue;

    const match = a.direction === "above" ? value >= a.threshold : value <= a.threshold;
    if (!match) continue;

    if (priorityRank[a.priority] > priorityRank[best]) best = a.priority;
  }

  return best;
}

function easeOutElastic(t: number) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  const p = 0.35;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

const GaugeVisual = ({
  min,
  max,
  invert_y,
  hideAlerts,
  points,
  alerts = [],
  unit,
}: GaugeRuntimeProps) => {
  const theme = useTheme() as Theme;

  const valueNum = points.at(-1)?.v ?? null;

  const minV = Math.min(min ?? 0, max ?? 100);
  const maxV = Math.max(min ?? 0, max ?? 100);

  const value = valueNum === null ? null : clamp(valueNum, minV, maxV);

  const needleAngle = useMemo(() => {
    if (value === null) return START_DEG;
    return valueToAngleDeg(value, minV, maxV, invert_y);
  }, [value, minV, maxV, invert_y]);

  const segments = useMemo(() => {
    const range = maxV - minV;
    const eps = range > 0 ? range * 0.01 : 0.01;

    const cuts = [minV, maxV];

    if (!hideAlerts) {
      for (const a of alerts) {
        const t = clamp(a.threshold, minV, maxV);
        cuts.push(t);

        if (a.direction === "below" && t === minV) cuts.push(minV + eps);
        if (a.direction === "above" && t === maxV) cuts.push(maxV - eps);
      }
    }

    const sorted = uniqueSorted(cuts);
    const out: Array<{ a: number; b: number; status: metricStatus }> = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (b <= a) continue;

      const mid = (a + b) / 2;
      out.push({
        a,
        b,
        status: !hideAlerts ? getStatusForValue(mid, alerts) : "ok",
      });
    }

    return out;
  }, [alerts, minV, maxV, hideAlerts]);

  const view = 200;
  const boxHeight = 160;
  const cx = view / 2;
  const cy = view / 2;
  const r = 90;
  const needleLen = r - 8;

  const [angleAnim, setAngleAnim] = useState<number>(START_DEG);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setAngleAnim(needleAngle);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from = START_DEG;
    const to = needleAngle;
    const durMs = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const t = clamp((now - start) / durMs, 0, 1);
      const e = easeOutElastic(t);
      setAngleAnim(from + (to - from) * e);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    setAngleAnim(from);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [needleAngle]);

  const spacedUnit = spaceUnit(unit, value === 1);

  return (
    <Container>
      <Svg viewBox={`0 0 ${view} ${boxHeight}`}>
        <BaseArc d={describeArc(cx, cy, r, START_DEG, START_DEG + SWEEP_DEG)} />

        {segments.map((s, i) => {
          const aDegRaw = valueToAngleDeg(s.a, minV, maxV, invert_y);
          const bDegRaw = valueToAngleDeg(s.b, minV, maxV, invert_y);

          const startDeg = Math.min(aDegRaw, bDegRaw);
          const endDeg = Math.max(aDegRaw, bDegRaw);

          if (Math.abs(endDeg - startDeg) < 0.25) return null;

          return (
            <ArcPath
              key={i}
              d={describeArc(cx, cy, r, startDeg, endDeg)}
              $stroke={statusToThemeColor(theme, s.status)}
            />
          );
        })}

        <g transform={`rotate(${angleAnim} ${cx} ${cy})`}>
          <Needle x1={cx} y1={cy} x2={cx + needleLen} y2={cy} />
        </g>

        <NeedlePivot cx={cx} cy={cy} r={7} />
      </Svg>

      <ValueText>
        {value === null ? "—" : reduceByDecimals(value)}
        {spacedUnit}
      </ValueText>

      <RangeText>
        {minV} – {maxV}
        {spacedUnit}
      </RangeText>
    </Container>
  );
};

export default GaugeVisual;
