// src/components/Tile/Tile.tsx
import * as React from "react";
import {Meta, Title, TileWrapper, TileLink} from "./Tile.style";
import { TileProps } from "../../types/tile";
import { resolveMetricValue } from "../../methods/statusLogic";
import { definitionStatus } from "../../types/alerts";

const Tile: React.FC<TileProps> = ({ to, metric, latestValue }) => {
  const isEmpty = !metric;
  const isCollapsed = React.useState(false);
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
