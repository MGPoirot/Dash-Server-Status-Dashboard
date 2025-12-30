// src/components/Tile/Tile.tsx
import * as React from "react";
import {Meta, Title, TileWrapper, TileLink} from "./Tile.style";
import { TileProps } from "../../types/tile";
import { AlertLogic, resolveMetricValue } from "../../methods/statusLogic";
import { StatusToEmoji, definitionStatus } from "../../types/alerts";
import { kMaxLength } from "buffer";

const Tile: React.FC<TileProps> = ({ to, metric, latestValue }) => {
  const isEmpty = !metric;
  const { latestValueString, status, statusEmoji } =  resolveMetricValue(metric, latestValue);
  return (
    <TileLink to={to}>
      <TileWrapper
        size="md"
        status={status as definitionStatus}
      >
        {isEmpty ? (
          // 👉 When NOTHING is passed → show plus emoji
          <div style={{ fontSize: "3rem", textAlign: "center" }}>➕</div>
        ) : (
          <>
            <Title>{metric.label || metric.metric_id}</Title>
            <Meta>
              <div>
                {latestValueString}{" "}
                {metric.unit || ""}{" "}
                {statusEmoji}
              </div>
            </Meta>
          </>
        )}
      </TileWrapper>
    </TileLink>
  );
};

export default Tile;
