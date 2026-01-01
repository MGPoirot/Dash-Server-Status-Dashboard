// src/pages/index.tsx
import * as React from "react";
import { graphql, PageProps, Link } from "gatsby";
import styled from "styled-components";
import Tile from "../components/Tile/Tile";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import Navbar from "../components/Navbar/navbar";
import StyleWrapper from "../styles/StyleWrapper";
import { MetricDefinitionNode } from "../types/metric";
import { LatestNode } from "../types/latest";


type IndexPageData = {
  allMetricDefinition: {
    nodes: MetricDefinitionNode[];
  };
  allMetricLatest: {
    nodes: LatestNode[];
  };
};


const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1rem;
`;

const IndexPage: React.FC<PageProps<IndexPageData>> = ({ data }) => {
  const metrics = data?.allMetricDefinition?.nodes ?? [];
  const latest = data?.allMetricLatest?.nodes ?? [];

  // Build a quick lookup table: filename -> latest value
  const latestByName = new Map(
    latest.map((l) => [l.parent.name, l.points?.[0]?.v ?? null])
  );

  return (
    <StyleWrapper>
      <Navbar />
      <Grid>
        {metrics.map((metric) => {
          const fileName = metric.parent?.name;
          const latestValue = fileName ? latestByName.get(fileName) : null;

          return (
            <Tile
              key={metric.metric_id}
              to={`/${metric.metric_id}`}
              metric={metric}
              latestValue={latestValue}
            />
          );
        })}
        {/* <Tile to={""}/> */} {/* Empty tile for adding new metrics will be implemented later*/}
      </Grid>
    </StyleWrapper>
  );
};

export default IndexPage;

export const query = graphql`
  query IndexPage {
    allMetricDefinition {
      nodes {
        label
        metric_id
        type
        metric_type
        unit
        tags
        expected_interval_sec
        alerts {
          threshold
          direction
          priority
        }
        mapping
        # Needed to join filename with latest data
        parent {
          ... on File {
            name
          }
        }
      }
    }

    allMetricLatest {
      nodes {
        metric_id
        points {
          t
          v
        }

        parent {
          ... on File {
            name
          }
        }
      }
    }
  }
`;
