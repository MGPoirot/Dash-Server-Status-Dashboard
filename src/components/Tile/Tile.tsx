// src/components/Tile/Tile.tsx
import * as React from "react";
import { Meta, Title, TileWrapper, TileLink } from "./Tile.style";
import { TileProps } from "../../types/tile";
import { resolveMetricValue } from "../../methods/statusLogic";
import { metricStatus } from "../../types/alerts";
import { reduceByDecimals, extractLatestValue } from "../../methods/utils";
import { MetricConfigBasic } from "../../types/metric";
import { fetchConfig, fetchLatest } from "../../methods/fetch";


const Tile: React.FC<TileProps> = ({ to, metric, latestValue }) => {
  const metricId = metric?.metric_id;

  // Start with baked-in values, then replace with live values after load.
  const [liveMetric, setLiveMetric] = React.useState<MetricConfigBasic | undefined>(metric);
  const [liveLatestValue, setLiveLatestValue] = React.useState<any>(latestValue);

  React.useEffect(() => {
    if (!metricId) return;

    const controller = new AbortController();

    (async () => {
      try {
        const [m, latest] = await Promise.all([
          fetchConfig(metricId, controller.signal),
          fetchLatest(metricId, controller.signal),
        ]);

        if (m && m.metric_id !== undefined) {
          // Prevent overwriting built-in with fresh is fetch failed
          setLiveMetric(m);
        }
        
        if (latest && Array.isArray(latest.points)) {
          // Prevent overwriting built-in with fresh is fetch failed
          const v = extractLatestValue(latest);
          if (v !== null && typeof v !== "undefined") {
            setLiveLatestValue(v);
          }
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.debug("[Tile live fetch failed]", metricId, e);
        }
      }
    })();

    return () => controller.abort();
  }, [metricId]);

  const isEmpty = !liveMetric;
  const { interpretedLatestValue, status, emoji } = resolveMetricValue(
    liveMetric,
    liveLatestValue,
  );

  return (
    <TileLink to={to}>
      <TileWrapper size="md" status={status as metricStatus}>
        {isEmpty ? (
          <div style={{ fontSize: "3rem", textAlign: "center" }}>➕</div>
        ) : (
          <>
            <Title>{liveMetric?.label || liveMetric?.metric_id}</Title>
            <Meta>
              <span>
                {emoji}{" "}
                {typeof interpretedLatestValue === "number"
                  ? reduceByDecimals(interpretedLatestValue)
                  : interpretedLatestValue}{" "}
                {typeof interpretedLatestValue === "number"
                  ? liveMetric?.unit || ""
                  : ""}
              </span>
            </Meta>
          </>
        )}
      </TileWrapper>
    </TileLink>
  );
};

export default Tile;
