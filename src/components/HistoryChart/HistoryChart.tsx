import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { AlertType } from "../../types/alerts";
import { ISOToHuman, reduceByDecimals, spaceUnit, statusToThemeColor } from "../../methods/utils";
import type { Theme } from "../../styles/themes";
import {
  AxisLabels,
  HoverDot,
  HoverGuide,
  Line,
  MainSvg,
  OverviewLine,
  OverviewRow,
  OverviewSvg,
  Plot,
  Row,
  SelectionLabel,
  Tooltip,
  Wrap,
  YAxis,
} from "./HistoryChart.style";
import {
  MAIN_POINT_CAP,
  OVERVIEW_POINT_CAP,
  Sample,
  TimeSpan,
  bandGeometry,
  buildAlertBands,
  clampEdge,
  computeYDomain,
  downsample,
  fitRange,
  gapTimeSpans,
  isChartGap,
  nearestInRange,
  panWindow,
  parseSamples,
  polylinePoints,
  realRuns,
  sliceWindow,
} from "./series";

const PLOT_W = 1000;
const PLOT_H = 260;
const OVERVIEW_H = 72;
const HANDLE_HIT_PX = 22;
const OK_OPACITY = 0.35;
const ALERT_OPACITY = 0.5;

type HistoryChartProps = {
  points: readonly unknown[];
  alerts?: AlertType[];
  unit?: string;
  min?: number;
  max?: number;
  invert_y?: boolean;
  hideAlerts?: boolean;
};

type Range = { start: number; end: number };

type Drag =
  | { kind: "start"; pointerId: number }
  | { kind: "end"; pointerId: number }
  | {
      kind: "pan";
      pointerId: number;
      originT: number;
      originStart: number;
      originEnd: number;
    };

type Hover = {
  sample: Sample;
  x: number;
  y: number;
  xView: number;
  alignEnd: boolean;
  below: boolean;
  gap: boolean;
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function formatValue(value: number, unit: string | undefined) {
  return `${reduceByDecimals(value)}${spaceUnit(unit, value === 1) ?? ""}`;
}

function formatInstant(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function axisLabels(start: number, end: number) {
  return ISOToHuman([new Date(start).toISOString(), new Date(end).toISOString()]);
}

function clientXToTime(clientX: number, svg: SVGSVGElement, t0: number, t1: number) {
  const rect = svg.getBoundingClientRect();
  const width = rect.width || 1;
  const ratio = clamp01((clientX - rect.left) / width);
  return t0 + ratio * (t1 - t0);
}

function timeToClientX(t: number, svg: SVGSVGElement, t0: number, t1: number) {
  const rect = svg.getBoundingClientRect();
  const ratio = t1 === t0 ? 0 : clamp01((t - t0) / (t1 - t0));
  return rect.left + ratio * rect.width;
}

function mapY(value: number, y0: number, y1: number, height: number, invertY: boolean) {
  const span = y1 - y0;
  if (!(span > 0)) return height / 2;
  const ratio = (value - y0) / span;
  return (invertY ? ratio : 1 - ratio) * height;
}

function spanRects(spans: readonly TimeSpan[], x0: number, x1: number, width: number) {
  const spanX = x1 - x0;
  if (!(spanX > 0) || width <= 0) return [];

  const vis0 = Math.min(x0, x1);
  const vis1 = Math.max(x0, x1);
  const rects: { x: number; width: number }[] = [];

  for (const span of spans) {
    const lo = Math.max(Math.min(span.t0, span.t1), vis0);
    const hi = Math.min(Math.max(span.t0, span.t1), vis1);
    if (!(hi > lo)) continue;
    const x = ((lo - x0) / spanX) * width;
    const bandWidth = ((hi - lo) / spanX) * width;
    if (bandWidth <= 0) continue;
    rects.push({ x, width: bandWidth });
  }

  return rects;
}

function lineRuns(
  samples: readonly Sample[],
  alerts: HistoryChartProps["alerts"],
  hideAlerts: boolean,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  width: number,
  height: number,
  invertY: boolean,
  cap: number
) {
  return realRuns(samples, alerts, hideAlerts)
    .map((run) => polylinePoints(downsample(run, cap), x0, x1, y0, y1, width, height, invertY))
    .filter((points) => points.length > 0);
}

const HistoryChart = ({
  points,
  alerts,
  unit,
  min,
  max,
  invert_y = false,
  hideAlerts = false,
}: HistoryChartProps) => {
  const theme = useTheme() as Theme;
  const clipId = useId().replace(/:/g, "");
  const overviewRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const rangeRef = useRef<Range | null>(null);
  const samplesRef = useRef<Sample[]>([]);
  const rafRef = useRef<number | null>(null);

  const samples = useMemo(() => parseSamples(points), [points]);
  samplesRef.current = samples;

  const [range, setRange] = useState<Range | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const domain = useMemo(
    () => computeYDomain(samples, min, max, alerts, hideAlerts),
    [samples, min, max, alerts, hideAlerts]
  );

  const bands = useMemo(
    () =>
      bandGeometry(
        buildAlertBands(domain.min, domain.max, alerts, hideAlerts),
        domain.min,
        domain.max,
        PLOT_H,
        invert_y
      ),
    [domain.min, domain.max, alerts, hideAlerts, invert_y]
  );

  const fullStart = samples[0]?.t ?? 0;
  const fullEnd = samples[samples.length - 1]?.t ?? 0;
  const selected = useMemo(() => {
    if (samples.length < 2) return { start: fullStart, end: fullEnd };
    if (!range) return { start: fullStart, end: fullEnd };
    return fitRange(range.start, range.end, samples);
  }, [samples, range, fullStart, fullEnd]);

  const gapSpans = useMemo(
    () => gapTimeSpans(samples, alerts, hideAlerts),
    [samples, alerts, hideAlerts]
  );

  const overviewLines = useMemo(() => {
    if (samples.length < 2) return [];
    return lineRuns(
      samples,
      alerts,
      hideAlerts,
      samples[0].t,
      samples[samples.length - 1].t,
      domain.min,
      domain.max,
      PLOT_W,
      OVERVIEW_H,
      invert_y,
      OVERVIEW_POINT_CAP
    );
  }, [samples, alerts, hideAlerts, domain.min, domain.max, invert_y]);

  const mainLines = useMemo(() => {
    if (samples.length < 2) return [];
    return lineRuns(
      sliceWindow(samples, selected.start, selected.end),
      alerts,
      hideAlerts,
      selected.start,
      selected.end,
      domain.min,
      domain.max,
      PLOT_W,
      PLOT_H,
      invert_y,
      MAIN_POINT_CAP
    );
  }, [samples, alerts, hideAlerts, selected.start, selected.end, domain.min, domain.max, invert_y]);

  const mainGapRects = useMemo(
    () => spanRects(gapSpans, selected.start, selected.end, PLOT_W),
    [gapSpans, selected.start, selected.end]
  );

  const overviewGapRects = useMemo(
    () => spanRects(gapSpans, fullStart, fullEnd, PLOT_W),
    [gapSpans, fullStart, fullEnd]
  );

  if (samples.length < 2) return null;

  const span = fullEnd - fullStart || 1;
  const selX = ((selected.start - fullStart) / span) * PLOT_W;
  const selW = Math.max(0, ((selected.end - selected.start) / span) * PLOT_W);
  const topValue = invert_y ? domain.min : domain.max;
  const bottomValue = invert_y ? domain.max : domain.min;
  const mainAxis = axisLabels(selected.start, selected.end);
  const fullAxis = axisLabels(fullStart, fullEnd);
  const okColor = statusToThemeColor(theme, "ok");
  const criticalColor = statusToThemeColor(theme, "critical");
  const yLabels = (
    <>
      <span>{formatValue(topValue, unit)}</span>
      <span>{formatValue(bottomValue, unit)}</span>
    </>
  );

  const commitRange = (next: Range) => {
    rangeRef.current = fitRange(next.start, next.end, samplesRef.current);
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const pending = rangeRef.current;
      if (!pending) return;
      setRange((prev) =>
        prev && prev.start === pending.start && prev.end === pending.end ? prev : pending
      );
    });
  };

  const activeRange = (): Range => {
    const list = samplesRef.current;
    if (rangeRef.current && list.length >= 2) return fitRange(rangeRef.current.start, rangeRef.current.end, list);
    return { start: list[0]?.t ?? 0, end: list[list.length - 1]?.t ?? 0 };
  };

  const onOverviewPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = overviewRef.current;
    const list = samplesRef.current;
    if (!svg || list.length < 2) return;

    const full0 = list[0].t;
    const full1 = list[list.length - 1].t;
    const active = activeRange();
    const startX = timeToClientX(active.start, svg, full0, full1);
    const endX = timeToClientX(active.end, svg, full0, full1);
    const distStart = Math.abs(event.clientX - startX);
    const distEnd = Math.abs(event.clientX - endX);
    const time = clientXToTime(event.clientX, svg, full0, full1);

    let drag: Drag | null = null;
    if (distStart <= HANDLE_HIT_PX && distStart <= distEnd) {
      drag = { kind: "start", pointerId: event.pointerId };
    } else if (distEnd <= HANDLE_HIT_PX) {
      drag = { kind: "end", pointerId: event.pointerId };
    } else if (event.clientX >= Math.min(startX, endX) && event.clientX <= Math.max(startX, endX)) {
      drag = {
        kind: "pan",
        pointerId: event.pointerId,
        originT: time,
        originStart: active.start,
        originEnd: active.end,
      };
    }
    if (!drag) return;

    dragRef.current = drag;
    svg.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onOverviewPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = overviewRef.current;
    const list = samplesRef.current;
    if (!svg || list.length < 2) return;

    const full0 = list[0].t;
    const full1 = list[list.length - 1].t;
    const active = activeRange();
    const startX = timeToClientX(active.start, svg, full0, full1);
    const endX = timeToClientX(active.end, svg, full0, full1);
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      const distStart = Math.abs(event.clientX - startX);
      const distEnd = Math.abs(event.clientX - endX);
      const inside = event.clientX >= Math.min(startX, endX) && event.clientX <= Math.max(startX, endX);
      svg.style.cursor =
        (distStart <= HANDLE_HIT_PX && distStart <= distEnd) || distEnd <= HANDLE_HIT_PX
          ? "ew-resize"
          : inside
            ? "grab"
            : "default";
      return;
    }

    const time = clientXToTime(event.clientX, svg, full0, full1);
    if (drag.kind === "start") commitRange(clampEdge(time, active.end, list, "start"));
    else if (drag.kind === "end") commitRange(clampEdge(active.start, time, list, "end"));
    else {
      svg.style.cursor = "grabbing";
      commitRange(panWindow(drag.originStart, drag.originEnd, time - drag.originT, list));
    }
  };

  const endDrag = (event: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onMainPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    const ratio = clamp01((event.clientX - rect.left) / width);
    const time = selected.start + ratio * (selected.end - selected.start);
    const sample = nearestInRange(samples, selected.start, selected.end, time);
    if (!sample) {
      setHover(null);
      return;
    }

    const xRatio =
      selected.end === selected.start ? 0.5 : clamp01((sample.t - selected.start) / (selected.end - selected.start));
    const gap = isChartGap(sample.v, alerts, hideAlerts);
    const yView = gap ? 24 : mapY(sample.v, domain.min, domain.max, PLOT_H, invert_y);
    const yClamped = gap ? 24 : Math.min(PLOT_H, Math.max(0, yView));
    const next: Hover = {
      sample,
      x: xRatio * width,
      y: (yClamped / PLOT_H) * height,
      xView: xRatio * PLOT_W,
      alignEnd: xRatio > 0.62,
      below: yClamped < 48,
      gap,
    };

    setHover((prev) =>
      prev &&
      prev.sample.t === next.sample.t &&
      prev.sample.v === next.sample.v &&
      prev.alignEnd === next.alignEnd &&
      prev.below === next.below &&
      prev.gap === next.gap
        ? prev
        : next
    );
  };

  return (
    <Wrap aria-label="History">
      <Row>
        <YAxis>{yLabels}</YAxis>
        <Plot>
          <MainSvg
            viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`History from ${mainAxis[0]} to ${mainAxis[1]}`}
            onPointerMove={onMainPointerMove}
            onPointerLeave={() => setHover(null)}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x={0} y={0} width={PLOT_W} height={PLOT_H} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              <rect x={0} y={0} width={PLOT_W} height={PLOT_H} fill={okColor} fillOpacity={OK_OPACITY} />
              {bands.map((band, index) => (
                <rect
                  key={`${band.status}-${index}`}
                  x={0}
                  y={band.y}
                  width={PLOT_W}
                  height={band.height}
                  fill={statusToThemeColor(theme, band.status)}
                  fillOpacity={ALERT_OPACITY}
                />
              ))}
              {mainGapRects.map((rect, index) => (
                <rect
                  key={`gap-${index}`}
                  x={rect.x}
                  y={0}
                  width={rect.width}
                  height={PLOT_H}
                  fill={criticalColor}
                  fillOpacity={ALERT_OPACITY}
                />
              ))}
              {mainLines.map((points, index) => (
                <Line key={`line-${index}`} points={points} />
              ))}
            </g>
            {hover && <HoverGuide x1={hover.xView} y1={0} x2={hover.xView} y2={PLOT_H} />}
          </MainSvg>
          {hover && !hover.gap && <HoverDot style={{ left: hover.x, top: hover.y }} />}
          {hover && (
            <Tooltip $alignEnd={hover.alignEnd} $below={hover.below} style={{ left: hover.x, top: hover.y }}>
              <strong>{formatValue(hover.sample.v, unit)}</strong>
              <span>{formatInstant(hover.sample.t)}</span>
            </Tooltip>
          )}
          <AxisLabels>
            <span>{mainAxis[0]}</span>
            <span>{mainAxis[1]}</span>
          </AxisLabels>
        </Plot>
      </Row>

      <OverviewRow>
        <YAxis aria-hidden="true" style={{ visibility: "hidden" }}>
          {yLabels}
        </YAxis>
        <Plot>
          <SelectionLabel>
            {mainAxis[0]} – {mainAxis[1]}
          </SelectionLabel>
          <OverviewSvg
            ref={overviewRef}
            viewBox={`0 0 ${PLOT_W} ${OVERVIEW_H}`}
            preserveAspectRatio="none"
            role="group"
            aria-label="Time range"
            onPointerDown={onOverviewPointerDown}
            onPointerMove={onOverviewPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {overviewGapRects.map((rect, index) => (
              <rect
                key={`overview-gap-${index}`}
                x={rect.x}
                y={0}
                width={rect.width}
                height={OVERVIEW_H}
                fill={criticalColor}
                fillOpacity={ALERT_OPACITY}
              />
            ))}
            {overviewLines.map((points, index) => (
              <OverviewLine key={`overview-line-${index}`} points={points} />
            ))}
            <rect x={0} y={0} width={Math.max(0, selX)} height={OVERVIEW_H} fill={theme.colors.background} fillOpacity={0.62} />
            <rect
              x={selX + selW}
              y={0}
              width={Math.max(0, PLOT_W - (selX + selW))}
              height={OVERVIEW_H}
              fill={theme.colors.background}
              fillOpacity={0.62}
            />
            <rect
              x={selX}
              y={1}
              width={Math.max(selW, 1)}
              height={OVERVIEW_H - 2}
              fill={theme.colors.primary}
              fillOpacity={0.12}
              stroke={theme.colors.primary}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={selX}
              y1={0}
              x2={selX}
              y2={OVERVIEW_H}
              stroke={theme.colors.primary}
              strokeWidth={8}
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={selX + selW}
              y1={0}
              x2={selX + selW}
              y2={OVERVIEW_H}
              stroke={theme.colors.primary}
              strokeWidth={8}
              vectorEffect="non-scaling-stroke"
            />
          </OverviewSvg>
          <AxisLabels>
            <span>{fullAxis[0]}</span>
            <span>{fullAxis[1]}</span>
          </AxisLabels>
        </Plot>
      </OverviewRow>
    </Wrap>
  );
};

export default HistoryChart;
