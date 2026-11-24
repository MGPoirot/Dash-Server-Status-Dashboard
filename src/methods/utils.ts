import { NumberPoint, PointValue, SeriesNode, StringPoint } from "../types/nodes";
import { metricStatus } from "../types/alerts";
import { Theme } from "../styles/themes";

export const valueToString = (value: PointValue | undefined): string =>
  value === undefined ? "NA" : String(value);

export function statusToThemeColor(theme: Theme, status?: metricStatus) {
  const c = theme.colors;

  switch (status) {
    case "critical":
      return c.critical ?? "#f15e53";
    case "warning":
      return c.warning ?? "#f6bc1b";
    case "info":
      return c.info ?? "#197cb9";
    case "stale":
      return c.stale ?? "#969696";
    case "ok":
    default:
      return c.ok ?? "#53c937";
  }
}

export const spaceUnit = (
  unit: string | undefined,
  singularize?: boolean
): string | undefined => {
  if (!unit) return undefined;

  let u = unit;

  if (
    singularize === true &&
    u.length > 3 &&
    u.endsWith("s")
  ) {
    u = u.slice(0, -1);
  }

  return u[0] !== "°" ? ` ${u}` : u;
};

export function reduceByDecimals(value: number, remove?: number) {
  if (!Number.isFinite(value)) return value;
  if ( remove === undefined ) { remove = 2 }
  if ( remove <= 0 ) return value;

  const s = String(value);
  const dotIndex = s.indexOf(".");

  // no decimals → nothing to reduce
  if (dotIndex === -1) {
    return value;
  }

  const int = s.slice(0, dotIndex);
  const dec = s.slice(dotIndex + 1);

  // remove all decimals if remove >= decimal length
  if (remove >= dec.length) {
    return Number(int);
  }

  return Number(`${int}.${dec.slice(0, dec.length - remove)}`);
}



/**
 * ISO to human
 * Takes N ISO timestamps and returns N human-readable labels.
 *
 * Rules:
 * - if first and last are within 24h => time only for all
 * - else if within 48h => "Yesterday HH:MM" for points on the day before the last point, otherwise time
 * - else if first and last are in same calendar year => "2 Oct"
 * - else => "Oct '25"
 */

// --- Helpers ---

function parseIsoSafe(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTimeOnly(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatMonthShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short" });
}

// --- Method ---
export function ISOToHuman(isos: string[]): string[] {
  if (!Array.isArray(isos) || isos.length === 0) return [];

  const ds = isos.map((s) => ({ iso: s, d: parseIsoSafe(s) }));

  const first = ds.find((x) => x.d)?.d ?? null;
  const last = [...ds].reverse().find((x) => x.d)?.d ?? null;

  // If we can't parse a span, just return originals (or empty for invalid).
  if (!first || !last) {
    return ds.map((x) => (x.d ? x.iso : x.iso));
  }

  const spanMs = Math.max(0, last.getTime() - first.getTime());
  const H24 = 24 * 60 * 60 * 1000;
  const H48 = 48 * 60 * 60 * 1000;

  // Precompute "yesterday" relative to the last datapoint (local calendar day).
  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);
  const yesterdayDay = new Date(lastDay);
  yesterdayDay.setDate(yesterdayDay.getDate() - 1);

  if (spanMs <= H24) {
    return ds.map((x) => (x.d ? formatTimeOnly(x.d) : x.iso));
  }

  if (spanMs <= H48) {
    return ds.map((x) => {
      if (!x.d) return x.iso;
      const t = formatTimeOnly(x.d);
      return isSameLocalDay(x.d, yesterdayDay) ? `Yesterday ${t}` : t;
    });
  }

  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameYear) {
    return ds.map((x) => {
      if (!x.d) return x.iso;
      const month = formatMonthShort(x.d);
      return `${x.d.getDate()} ${month}`;
    });
  }

  return ds.map((x) => {
    if (!x.d) return x.iso;
    const month = formatMonthShort(x.d);
    const yy = String(x.d.getFullYear()).slice(-2);
    return `${month} '${yy}`;
  });
}

export function extractLatestValue(
  latest: SeriesNode | StringPoint[] | NumberPoint[]
): PointValue {
  const points =
    latest &&
    typeof latest === "object" &&
    "points" in latest
      ? latest.points
      : latest;

  const p = points.at(-1);
  if (!p) return 404;

  // Prefer numeric v when it's actually set; otherwise use s
  const v =
    "v" in p && p.v !== null && typeof p.v !== "undefined"
      ? p.v
      : undefined;

  if (typeof v !== "undefined") return v;

  const s = "s" in p ? p.s : undefined;
  return typeof s !== "undefined" ? s : 404;
}
