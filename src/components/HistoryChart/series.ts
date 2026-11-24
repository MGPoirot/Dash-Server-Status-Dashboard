import { AlertType, metricStatus, priorityRank } from "../../types/alerts";

export type Sample = {
  t: number;
  v: number;
  iso: string;
};

export type YDomain = {
  min: number;
  max: number;
};

export type AlertBand = {
  y1: number;
  y2: number;
  status: metricStatus;
};

export const MAIN_POINT_CAP = 800;
export const OVERVIEW_POINT_CAP = 300;
/** Same sentinel as tools/runner.py. Never a real measurement. */
export const ERROR_SENTINEL = -404;

const PAD_RATIO = 0.08;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function parseSamples(points: readonly unknown[] | null | undefined): Sample[] {
  if (!points?.length) return [];

  const out: Sample[] = [];
  for (const point of points) {
    if (!point || typeof point !== "object") continue;
    const rec = point as { t?: unknown; v?: unknown };
    if (typeof rec.t !== "string" || typeof rec.v !== "number" || !Number.isFinite(rec.v)) continue;
    const t = Date.parse(rec.t);
    if (!Number.isFinite(t)) continue;
    out.push({ t, v: rec.v, iso: rec.t });
  }

  out.sort((a, b) => a.t - b.t);
  return out;
}

/**
 * Error sentinel, or a critical below-alert on a non-positive value.
 * Those points are omitted from the line and from the automatic Y domain.
 * hideAlerts skips the alert test. The sentinel is always a gap.
 */
export function isChartGap(
  value: number,
  alerts: readonly AlertType[] | undefined,
  hideAlerts: boolean | undefined
): boolean {
  if (value === ERROR_SENTINEL) return true;
  if (hideAlerts || !alerts?.length || !(value <= 0)) return false;

  for (const alert of alerts) {
    if (!usableAlert(alert) || alert.priority !== "critical" || alert.direction !== "below") continue;
    if (value < alert.threshold) return true;
  }
  return false;
}

/**
 * Fixed Y domain. Configured min and max win so a gauge's history matches its scale.
 * Otherwise the domain is the real series extent, padded, and it keeps any alert
 * threshold that already sits inside that extent on the plot. Gap samples are ignored.
 */
export function computeYDomain(
  samples: readonly Sample[],
  configuredMin: number | undefined,
  configuredMax: number | undefined,
  alerts: readonly AlertType[] | undefined,
  hideAlerts: boolean | undefined
): YDomain {
  const hasMin = typeof configuredMin === "number" && Number.isFinite(configuredMin);
  const hasMax = typeof configuredMax === "number" && Number.isFinite(configuredMax);

  if (hasMin && hasMax) {
    let lo = Math.min(configuredMin, configuredMax);
    let hi = Math.max(configuredMin, configuredMax);
    if (hi === lo) {
      lo -= 1;
      hi += 1;
    }
    return { min: lo, max: hi };
  }

  let dataMin = Infinity;
  let dataMax = -Infinity;
  for (const sample of samples) {
    if (isChartGap(sample.v, alerts, hideAlerts)) continue;
    if (sample.v < dataMin) dataMin = sample.v;
    if (sample.v > dataMax) dataMax = sample.v;
  }
  if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
    return { min: 0, max: 1 };
  }

  let lo = dataMin;
  let hi = dataMax;
  if (!hideAlerts && alerts?.length) {
    for (const alert of alerts) {
      if (!usableAlert(alert)) continue;
      if (alert.threshold >= dataMin && alert.threshold <= dataMax) {
        if (alert.threshold < lo) lo = alert.threshold;
        if (alert.threshold > hi) hi = alert.threshold;
      }
    }
  }

  if (hi === lo) {
    const bump = Math.abs(lo) > 0 ? Math.abs(lo) * 0.05 : 1;
    return { min: lo - bump, max: hi + bump };
  }

  const pad = (hi - lo) * PAD_RATIO;
  return { min: lo - pad, max: hi + pad };
}

export type TimeSpan = {
  t0: number;
  t1: number;
};

/**
 * Contiguous real samples. The line is drawn per run so it does not bridge a gap.
 */
export function realRuns(
  samples: readonly Sample[],
  alerts: readonly AlertType[] | undefined,
  hideAlerts: boolean | undefined
): Sample[][] {
  const runs: Sample[][] = [];
  let current: Sample[] = [];

  for (const sample of samples) {
    if (isChartGap(sample.v, alerts, hideAlerts)) {
      if (current.length) {
        runs.push(current);
        current = [];
      }
      continue;
    }
    current.push(sample);
  }

  if (current.length) runs.push(current);
  return runs;
}

/**
 * Each run of gap samples spans the midpoint before the run to the midpoint
 * after it. A run at the start or end uses the gap timestamp as that outer edge.
 */
export function gapTimeSpans(
  samples: readonly Sample[],
  alerts: readonly AlertType[] | undefined,
  hideAlerts: boolean | undefined
): TimeSpan[] {
  const spans: TimeSpan[] = [];
  const n = samples.length;
  let i = 0;

  while (i < n) {
    if (!isChartGap(samples[i].v, alerts, hideAlerts)) {
      i += 1;
      continue;
    }

    const startIdx = i;
    while (i < n && isChartGap(samples[i].v, alerts, hideAlerts)) i += 1;

    const firstT = samples[startIdx].t;
    const lastT = samples[i - 1].t;
    const prevT = startIdx > 0 ? samples[startIdx - 1].t : null;
    const nextT = i < n ? samples[i].t : null;
    const t0 = prevT == null ? firstT : (prevT + firstT) / 2;
    const t1 = nextT == null ? lastT : (lastT + nextT) / 2;
    if (t1 > t0) spans.push({ t0, t1 });
  }

  return spans;
}

function usableAlert(alert: AlertType | null | undefined): alert is AlertType {
  return (
    !!alert &&
    typeof alert.threshold === "number" &&
    Number.isFinite(alert.threshold) &&
    (alert.direction === "above" || alert.direction === "below")
  );
}

function statusForValue(value: number, alerts: readonly AlertType[]): metricStatus {
  let best: metricStatus = "ok";
  for (const alert of alerts) {
    if (!usableAlert(alert)) continue;
    const match = alert.direction === "above" ? value >= alert.threshold : value <= alert.threshold;
    if (!match) continue;
    if (priorityRank[alert.priority] > priorityRank[best]) best = alert.priority;
  }
  return best;
}

/**
 * Split the Y range at alert thresholds and color each slice by the highest
 * priority that matches its midpoint. Same rule as the gauge arc.
 */
export function buildAlertBands(
  minV: number,
  maxV: number,
  alerts: readonly AlertType[] | undefined,
  hideAlerts: boolean | undefined
): AlertBand[] {
  if (hideAlerts || !alerts?.length || !(maxV > minV)) return [];

  const range = maxV - minV;
  const eps = range * 0.01;
  const cuts = [minV, maxV];

  for (const alert of alerts) {
    if (!usableAlert(alert)) continue;
    const t = clamp(alert.threshold, minV, maxV);
    cuts.push(t);
    if (alert.direction === "below" && t === minV) cuts.push(minV + eps);
    if (alert.direction === "above" && t === maxV) cuts.push(maxV - eps);
  }

  const sorted = Array.from(new Set(cuts.map((n) => Number(n.toFixed(10))))).sort((a, b) => a - b);
  const bands: AlertBand[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const y1 = sorted[i];
    const y2 = sorted[i + 1];
    if (y2 <= y1) continue;
    bands.push({
      y1,
      y2,
      status: statusForValue((y1 + y2) / 2, alerts),
    });
  }

  return bands;
}

/**
 * Largest-Triangle-Three-Buckets. Keeps the first and last sample and the
 * point in each bucket that best preserves peaks.
 */
export function lttb(samples: readonly Sample[], threshold: number): Sample[] {
  const n = samples.length;
  const target = Math.floor(threshold);
  if (n <= 2 || target >= n) return samples.slice();
  if (target < 3) return [samples[0], samples[n - 1]];

  const sampled: Sample[] = [samples[0]];
  const bucketSize = (n - 2) / (target - 2);
  let a = 0;

  for (let i = 0; i < target - 2; i++) {
    const avgStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    const avgLen = avgEnd - avgStart;

    let avgT = 0;
    let avgV = 0;
    if (avgLen <= 0) {
      const fallback = samples[Math.min(avgStart, n - 1)];
      avgT = fallback.t;
      avgV = fallback.v;
    } else {
      for (let j = avgStart; j < avgEnd; j++) {
        avgT += samples[j].t;
        avgV += samples[j].v;
      }
      avgT /= avgLen;
      avgV /= avgLen;
    }

    const rangeStart = Math.floor(i * bucketSize) + 1;
    const rangeEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, n - 1);

    let nextA = Math.min(Math.max(rangeStart, a + 1), n - 2);
    if (rangeEnd > rangeStart) {
      const pointA = samples[a];
      let maxArea = -1;
      for (let j = rangeStart; j < rangeEnd; j++) {
        const area = Math.abs(
          (pointA.t - avgT) * (samples[j].v - pointA.v) -
            (pointA.t - samples[j].t) * (avgV - pointA.v)
        );
        if (area > maxArea) {
          maxArea = area;
          nextA = j;
        }
      }
    }

    if (nextA <= a) nextA = Math.min(a + 1, n - 2);
    sampled.push(samples[nextA]);
    a = nextA;
  }

  sampled.push(samples[n - 1]);
  return sampled;
}

export function downsample(samples: readonly Sample[], cap: number): Sample[] {
  if (samples.length <= cap) return samples.slice();
  return lttb(samples, cap);
}

export function lowerBound(samples: readonly Sample[], t: number): number {
  let lo = 0;
  let hi = samples.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t < t) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function lastIndexAtOrBefore(samples: readonly Sample[], t: number): number {
  const i = lowerBound(samples, t);
  if (i < samples.length && samples[i].t === t) return i;
  return i - 1;
}

export function sliceWindow(samples: readonly Sample[], start: number, end: number): Sample[] {
  if (!samples.length) return [];
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const i0 = lowerBound(samples, lo);
  const i1 = lastIndexAtOrBefore(samples, hi);
  if (i1 < i0 || i0 >= samples.length || i1 < 0) return [];
  return samples.slice(i0, i1 + 1);
}

export function nearestInRange(
  samples: readonly Sample[],
  start: number,
  end: number,
  t: number
): Sample | null {
  if (!samples.length) return null;
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  const i0 = lowerBound(samples, lo);
  const i1 = lastIndexAtOrBefore(samples, hi);
  if (i1 < i0 || i0 >= samples.length || i1 < 0) return null;

  const target = clamp(t, lo, hi);
  let left = i0;
  let right = i1;
  while (left < right) {
    const mid = (left + right) >> 1;
    if (samples[mid].t < target) left = mid + 1;
    else right = mid;
  }

  const earlier = samples[Math.max(i0, left - 1)];
  const later = samples[Math.min(i1, left)];
  return Math.abs(earlier.t - target) <= Math.abs(later.t - target) ? earlier : later;
}

/** Keep a dragged edge from leaving fewer than two samples in the window. */
export function clampEdge(
  start: number,
  end: number,
  samples: readonly Sample[],
  edge: "start" | "end"
): { start: number; end: number } {
  if (samples.length < 2) {
    const t = samples[0]?.t ?? 0;
    return { start: t, end: t };
  }

  const fullStart = samples[0].t;
  const fullEnd = samples[samples.length - 1].t;

  if (edge === "start") {
    let nextStart = clamp(start, fullStart, fullEnd);
    const nextEnd = clamp(end, fullStart, fullEnd);
    const last = lastIndexAtOrBefore(samples, nextEnd);
    if (last < 1) return { start: samples[0].t, end: samples[1].t };
    const maxStart = samples[last - 1].t;
    if (nextStart > maxStart) nextStart = maxStart;
    return { start: nextStart, end: nextEnd };
  }

  const nextStart = clamp(start, fullStart, fullEnd);
  let nextEnd = clamp(end, fullStart, fullEnd);
  const first = lowerBound(samples, nextStart);
  if (first >= samples.length - 1) {
    return {
      start: samples[samples.length - 2].t,
      end: samples[samples.length - 1].t,
    };
  }
  const minEnd = samples[first + 1].t;
  if (nextEnd < minEnd) nextEnd = minEnd;
  return { start: nextStart, end: nextEnd };
}

/** Pull a window inside the series and keep at least two samples inside it. */
export function fitRange(
  start: number,
  end: number,
  samples: readonly Sample[]
): { start: number; end: number } {
  if (samples.length < 2) {
    const t = samples[0]?.t ?? 0;
    return { start: t, end: t };
  }

  const fullStart = samples[0].t;
  const fullEnd = samples[samples.length - 1].t;
  const lo = clamp(Math.min(start, end), fullStart, fullEnd);
  const hi = clamp(Math.max(start, end), fullStart, fullEnd);
  const withEnd = clampEdge(lo, hi, samples, "end");
  return clampEdge(withEnd.start, withEnd.end, samples, "start");
}

export function panWindow(
  start: number,
  end: number,
  delta: number,
  samples: readonly Sample[]
): { start: number; end: number } {
  if (samples.length < 2) {
    const t = samples[0]?.t ?? 0;
    return { start: t, end: t };
  }

  const fullStart = samples[0].t;
  const fullEnd = samples[samples.length - 1].t;
  const span = Math.max(0, end - start);
  let nextStart = start + delta;
  let nextEnd = end + delta;

  if (nextStart < fullStart) {
    nextStart = fullStart;
    nextEnd = Math.min(fullEnd, fullStart + span);
  }
  if (nextEnd > fullEnd) {
    nextEnd = fullEnd;
    nextStart = Math.max(fullStart, fullEnd - span);
  }

  return { start: nextStart, end: nextEnd };
}

export function polylinePoints(
  samples: readonly Sample[],
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  width: number,
  height: number,
  invertY: boolean
): string {
  if (!samples.length || !(y1 > y0) || width <= 0 || height <= 0) return "";

  const spanX = x1 - x0;
  const spanY = y1 - y0;
  let out = "";

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    const xRatio = spanX === 0 ? 0.5 : (sample.t - x0) / spanX;
    const yRatio = (sample.v - y0) / spanY;
    const yNorm = invertY ? yRatio : 1 - yRatio;
    if (i) out += " ";
    out += (xRatio * width).toFixed(2);
    out += ",";
    out += (yNorm * height).toFixed(2);
  }

  return out;
}

export function bandGeometry(
  bands: readonly AlertBand[],
  y0: number,
  y1: number,
  height: number,
  invertY: boolean
): { y: number; height: number; status: metricStatus }[] {
  if (!(y1 > y0) || height <= 0) return [];
  const span = y1 - y0;

  const mapY = (value: number) => {
    const yRatio = (value - y0) / span;
    const yNorm = invertY ? yRatio : 1 - yRatio;
    return yNorm * height;
  };

  const rects: { y: number; height: number; status: metricStatus }[] = [];
  for (const band of bands) {
    if (band.status === "ok") continue;
    const yA = mapY(band.y1);
    const yB = mapY(band.y2);
    const top = Math.min(yA, yB);
    const bandHeight = Math.abs(yB - yA);
    if (bandHeight <= 0) continue;
    rects.push({ y: top, height: bandHeight, status: band.status });
  }
  return rects;
}
