// CounterVisual.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CounterProps } from "../../../types/visuals";
import { NumberPoint } from "../../../types/nodes";
import { AlertType, metricStatus } from "../../../types/alerts";
import { AlertLogic } from "../../../methods/statusLogic";
import {
  Container,
  DigitsRow,
  DigitCell,
  DigitWindow,
  DigitReel,
  DigitGlyph,
  Divider,
  InfoNote,
} from "./CounterVisual.style";
import { spaceUnit } from "../../../methods/utils";

type CounterRuntimeProps = CounterProps & {
  points: NumberPoint[];
  alerts?: AlertType[];
  nLatestPoints?: number;
  unit?: string;
};

function statusToCssVar(status: metricStatus) {
  switch (status) {
    case "critical":
      return "var(--critical, #f15e53)";
    case "warning":
      return "var(--warning, #f6bc1b)";
    case "info":
      return "var(--info, #2563eb)";
    case "stale":
    case "ok":
    default:
      return "var(--ok, #53c937)";
  }
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function safeParseISO(iso: string | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function diffWholeDaysLocal(a: Date, b: Date) {
  const ms = startOfLocalDay(a).getTime() - startOfLocalDay(b).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

function formatSince(pastISO: string | undefined, nowISO: string | undefined) {
  const past = safeParseISO(pastISO);
  const now = safeParseISO(nowISO) ?? new Date();
  if (!past) return "—";

  const diffMs = now.getTime() - past.getTime();
  const diffDays = diffWholeDaysLocal(now, past);

  const fmtTime = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const fmtWeekday = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
  });

  const fmtMonthDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });

  const fmtMonthDayYear2 = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "2-digit",
  });

  if (diffMs < 24 * 60 * 60 * 1000) return fmtTime.format(past);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return fmtWeekday.format(past);
  if (diffDays < 365) return fmtMonthDay.format(past);

  // Convert "May 3, 24" -> "May 3 '24" (locale-dependent punctuation)
  const raw = fmtMonthDayYear2.format(past);
  const m = raw.match(/(\d{2})\s*$/);
  return m ? raw.replace(m[1], `'${m[1]}`) : raw;
}

type DigitProps = {
  digit: number; // 0..9
  color: string;
};

const Digit = ({ digit, color }: DigitProps) => {
  return (
    <DigitCell>
      <DigitWindow>
        <DigitReel $digit={digit}>
          {Array.from({ length: 10 }).map((_, i) => (
            <DigitGlyph key={i} $color={color}>
              {i}
            </DigitGlyph>
          ))}
        </DigitReel>
      </DigitWindow>
      <Divider />
    </DigitCell>
  );
};

const CounterVisual = ({
  hideAlerts = true,
  points,
  alerts = [],
  nLatestPoints,
  unit,
}: CounterRuntimeProps) => {
  const pointNow = points.at(-1);
  const pointPast = points.at(nLatestPoints ? -nLatestPoints : -2);

  const vNowRaw = pointNow?.v;
  const tNow = pointNow?.t;

  const vPastRaw = pointPast?.v;
  const tPast = pointPast?.t;

  const status: metricStatus = useMemo(() => {
    if (hideAlerts === false) return "ok";
    return AlertLogic(alerts, vNowRaw);
  }, [hideAlerts, alerts, vNowRaw]);

  const digitColor = statusToCssVar(status);

  const targetNow = useMemo(() => {
    if (typeof vNowRaw !== "number" || !Number.isFinite(vNowRaw)) return null;
    return Math.trunc(vNowRaw);
  }, [vNowRaw]);

  const targetPast = useMemo(() => {
    if (typeof vPastRaw !== "number" || !Number.isFinite(vPastRaw)) return null;
    return Math.trunc(vPastRaw);
  }, [vPastRaw]);

  const vDiff = useMemo(() => {
    if (targetNow === null || targetPast === null) return 0;
    return targetNow - targetPast;
  }, [targetNow, targetPast]);

  const tDiffMs = useMemo(() => {
    const nowD = safeParseISO(tNow);
    const pastD = safeParseISO(tPast);
    if (!nowD || !pastD) return 0;
    return nowD.getTime() - pastD.getTime();
  }, [tNow, tPast]);

  const timeSince = useMemo(() => {
    // Prefer describing the past point relative to the *current* point time.
    // If tNow is missing/invalid, fall back to "now".
    return formatSince(tPast, tNow);
  }, [tPast, tNow]);

  const [current, setCurrent] = useState<number>(0);
  const [noteVisible, setNoteVisible] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setNoteVisible(false);

    if (targetNow === null) {
      setCurrent(0);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const from = 0;
    const to = targetNow;
    const durationMs = 900;
    const start = performance.now();

    const tick = (now: number) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const eased = easeOutCubic(t);
      const next = Math.trunc(from + (to - from) * eased);
      setCurrent(next);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // show info note only after the counting animation completes
        setNoteVisible(true);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [targetNow]);

  const rendered = useMemo(() => {
    if (targetNow === null) return { sign: "", digits: ["—"] as string[] };

    const sign = current < 0 ? "-" : "";
    const absCurrent = Math.abs(current);

    // Pad to the number of digits of the TARGET (so DigitCells don't "pop in" at the end)
    const absTarget = Math.abs(targetNow);
    const width = String(absTarget).length || 1;
    const padded = String(absCurrent).padStart(width, "0");

    return { sign, digits: padded.split("") };
  }, [current, targetNow]);

  const isPlaceholder = rendered.digits.length === 1 && rendered.digits[0] === "—";

  const noteText = useMemo(() => {
    const sign = vDiff > 0 ? "+" : vDiff < 0 ? "−" : "";
    const abs = Math.abs(vDiff);
    const unitStr = unit ? spaceUnit(unit, vDiff === 1) : "";
    const valueStr = `${sign}${abs}${unitStr}`;
    const sinceStr = timeSince !== "—" ? ` since ${timeSince}` : "";
    return `${valueStr}${sinceStr}`;
  }, [vDiff, unit, timeSince]);

  return (
    <Container aria-label="Counter">
      <DigitsRow>
        {rendered.sign ? (
          <DigitCell>
            <DigitWindow>
              <DigitGlyph $color={digitColor}>{rendered.sign}</DigitGlyph>
            </DigitWindow>
            <Divider />
          </DigitCell>
        ) : null}

        {isPlaceholder ? (
          <DigitCell>
            <DigitWindow>
              <DigitGlyph $color={digitColor}>—</DigitGlyph>
            </DigitWindow>
            <Divider />
          </DigitCell>
        ) : (
          rendered.digits.map((ch, idx) => (
            <Digit key={idx} digit={Number(ch)} color={digitColor} />
          ))
        )}
      </DigitsRow>

      {vDiff !== 0 && <InfoNote
        $show={noteVisible && !isPlaceholder}
        $tone={status === "critical" ? "critical" : status === "warning" ? "warning" : "info"}
        aria-label="Counter change info"
        title={tDiffMs ? `Δt = ${Math.round(tDiffMs / 1000)}s` : undefined}
      >
        {noteText}
      </InfoNote>}
    </Container>
  );
};

export default CounterVisual;
