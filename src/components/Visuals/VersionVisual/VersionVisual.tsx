// VersionVisual.tsx
import React, { useMemo } from "react";
import { VersionProps } from "../../../types/visuals";
import { StringPoint } from "../../../types/nodes";
import { AlertType } from "../../../types/alerts";
import { DateBox, Row, VersionBox } from "./VersionVisual.style";
import { ISOToHuman } from "../../../methods/utils";

type VersionRuntimeProps = VersionProps & {
  points: StringPoint[];
  alerts?: AlertType[];
};

type VersionRow = {
  version: string;
  firstSeenIso: string;
  firstSeenHuman: string;
  // 0 = most recent (green), 1 = next, 2 = oldest
  recencyIndex: number;
};

function parseIsoSafe(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getLastNUniqueVersions(points: StringPoint[], N = 3): Array<{ version: string; firstSeenIso: string }> {
  const sorted = [...points].sort((a, b) => {
    const da = parseIsoSafe(a.t)?.getTime() ?? 0;
    const db = parseIsoSafe(b.t)?.getTime() ?? 0;
    return da - db;
  });

  const firstSeen = new Map<string, string>();
  for (const p of sorted) {
    const v = (p.s ?? "").trim();
    const t = p.t;
    if (!v || !t) continue;
    if (!firstSeen.has(v)) firstSeen.set(v, t);
  }

  // collect last N unique versions, newest first
  const out: Array<{ version: string; firstSeenIso: string }> = [];
  const seen = new Set<string>();

  for (let i = sorted.length - 1; i >= 0; i--) {
    const v = (sorted[i].s ?? "").trim();
    if (!v || seen.has(v)) continue;

    const firstIso = firstSeen.get(v);
    if (!firstIso) continue;

    out.push({ version: v, firstSeenIso: firstIso });
    seen.add(v);

    if (out.length >= N) break;
  }

  return out; // newest -> older
}

const VersionVisual: React.FC<VersionRuntimeProps> = ({ points, nLatestPoints = 3 }) => {
  const rows: VersionRow[] = useMemo(() => {
    const last = getLastNUniqueVersions(points, nLatestPoints);

    const spanFirst = points[0]?.t;
    const spanLast = points.at(-1)?.t;

    const isosForMode = [spanFirst, ...last.map((x) => x.firstSeenIso), spanLast].filter(Boolean) as string[];
    const humanAll = ISOToHuman(isosForMode);

    const offset = spanFirst ? 1 : 0;

    return last.map((x, i) => ({
      version: x.version,
      firstSeenIso: x.firstSeenIso,
      firstSeenHuman: humanAll[offset + i] ?? x.firstSeenIso,
      recencyIndex: i, // 0 newest
    }));
  }, [points, nLatestPoints]);

  // We want the newest version to animate LAST.
  // So render in newest->older order, but compute an animation index that reverses it.
  const BOX_STAGGER_MS = 180;
  const BOX_DUR_MS = 520;
  const DATE_FADE_MS = 320;

  const maxIdx = Math.max(0, rows.length - 1);
  const datesDelayMs = rows.length > 0 ? maxIdx * BOX_STAGGER_MS + BOX_DUR_MS : 0;

  return (
    <div>
      {rows.map((r) => {
        const animIndex = maxIdx - r.recencyIndex; // oldest first, newest last

        return (
          <Row key={`${r.version}-${r.firstSeenIso}`}>
            <VersionBox
              $status={r.recencyIndex === 0 ? "ok" : "stale"}
              $recencyIndex={r.recencyIndex}
              $animIndex={animIndex}
              $staggerMs={BOX_STAGGER_MS}
              $durMs={BOX_DUR_MS}
            >
              {r.version}
            </VersionBox>

            <DateBox $delayMs={datesDelayMs} $durMs={DATE_FADE_MS}>
              {r.firstSeenHuman}
            </DateBox>
          </Row>
        );
      })}
    </div>
  );
};

export default VersionVisual;
