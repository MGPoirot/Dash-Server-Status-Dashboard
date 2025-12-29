// src/pages/metric.tsx
import * as React from "react";
import { graphql, PageProps, Link } from "gatsby";
import styled from "styled-components";
import StyleWrapper from "../styles/StyleWrapper";
import Navbar from "../components/Navbar/navbar";

type Point = {
  t: string;
  v: any;
};

type MetricFileParent = {
  name: string; // e.g. "system.cpu.temp"
};

type MetricDefinitionNode = {
  id: string; // Gatsby node ID
  label?: string | null;
  type?: string | null;
  metric_type?: string | null;
  unit?: string | null;
  parent?: MetricFileParent | null;
};

type LatestNode = {
  metric_id: string;
  points: Point[];
  parent: MetricFileParent;
};

type SeriesNode = {
  metric_id: string;
  points: Point[];
  parent: MetricFileParent;
};

type MetricPageData = {
  metric: MetricDefinitionNode;
  allMetricLatest: {
    nodes: LatestNode[];
  };
  allMetricSeries: {
    nodes: SeriesNode[];
  };
};

type MetricPageContext = {
  id: string; // passed from gatsby-node (metricDefinition.id)
};

const Pre = styled.pre`
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #eee;
  overflow: auto;
  font-size: 0.85rem;
`;

const MetricPage: React.FC<PageProps<MetricPageData, MetricPageContext>> = ({
  data,
}) => {
  const { metric, allMetricLatest, allMetricSeries } = data;

  const fileName = metric.parent?.name; // e.g. "system.cpu.temp"

  // Join latest/series by filename, same trick as on the index page
  const latestForMetric = allMetricLatest.nodes.find(
    (l) => l.parent.name === fileName
  );
  const seriesForMetric = allMetricSeries.nodes.find(
    (s) => s.parent.name === fileName
  );

  return (
    <StyleWrapper>
      <Navbar />
      <h1>{metric.label || fileName || metric.id}</h1>

      <h2>Definition</h2>
      <Pre>{JSON.stringify(metric, null, 2)}</Pre>

      <h2>Latest</h2>
      {latestForMetric ? (
        <Pre>{JSON.stringify(latestForMetric, null, 2)}</Pre>
      ) : (
        <p>No latest data found for this metric.</p>
      )}

      <h2>Series</h2>
      {seriesForMetric ? (
        <Pre>{JSON.stringify(seriesForMetric, null, 2)}</Pre>
      ) : (
        <p>No series data found for this metric.</p>
      )}
    </StyleWrapper>
  );
};

export default MetricPage;

// ✅ Valid GraphQL syntax, using $id from page context
export const query = graphql`
  query MetricPage($id: String!) {
    metric: metricDefinition(id: { eq: $id }) {
      id
      label
      type
      metric_type
      unit
      parent {
        ... on File {
          name
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

    allMetricSeries {
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
