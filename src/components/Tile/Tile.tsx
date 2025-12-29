// src/components/Tile/Tile.tsx
import * as React from "react";
import styled from "styled-components";
import {Meta, Title, TileWrapper} from "./Tile.style";
import { Link } from "gatsby";

type MetricDefinitionNode = {
  id: string;
  label?: string | null;
  type?: string | null;
  metric_type?: string | null;
  unit?: string | null;
};

interface TileProps {
  to: string;
  metric?: {
    id?: string;
    label?: string;
    type?: string;
    metric_type?: string;
    unit?: string;
  };
  latestValue?: number | null;
}


const Tile: React.FC<TileProps> = ({ to, metric, latestValue }) => {
  const isEmpty = !metric;

  return (
    <Link to={to}>
      <TileWrapper>
        {isEmpty ? (
          // 👉 When NOTHING is passed → show plus emoji
          <div style={{ fontSize: "3rem", textAlign: "center" }}>➕</div>
        ) : (
          <>
            <Title>{metric.label || metric.id}</Title>
            <Meta>
              <div>
                Latest: {latestValue !== null ? latestValue : "—"}{" "}
                {metric.unit || ""}
              </div>
              <div>Type: {metric.type || "—"}</div>
              <div>Metric type: {metric.metric_type || "—"}</div>
              <div>Unit: {metric.unit || "—"}</div>
            </Meta>
          </>
        )}
      </TileWrapper>
    </Link>
  );
};

export default Tile;
