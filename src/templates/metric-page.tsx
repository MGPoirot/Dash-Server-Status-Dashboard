// src/templates/metric-page.tsx
import * as React from "react";
import { graphql, PageProps, Link } from "gatsby";
import styled from "styled-components";
import StyleWrapper from "../styles/StyleWrapper";
import Navbar from "../components/Navbar/navbar";
import {MetricDefinitionNode} from "../types/metric";
import {LatestNode} from "../types/latest";
import {SeriesNode} from "../types/series";
import { resolveMetricValue } from "../methods/statusLogic";

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
  metric_id: string; // passed from gatsby-node (MetricDefinition.metric_id)
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

  const latestValue = latestForMetric?.points[0]?.v ?? null;  

  const { latestValueString, status, statusEmoji } =  resolveMetricValue(metric, latestValue);

  return (
    <StyleWrapper>
      <Navbar />
      <h1> {statusEmoji} {metric.label || fileName || metric.metric_id} - {latestValueString}{metric.unit ? ` ${metric.unit}` : ""}</h1>
      <p dangerouslySetInnerHTML={{__html: metric.description ? metric.description : "<i>No description provided.</i>"}}></p>
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

// Page query variable comes from createPage context in gatsby-node.js
export const query = graphql`
  query MetricPage($metric_id: String!) {
    metric: metricDefinition(metric_id: { eq: $metric_id }) {
      label
      description
      metric_id
      type
      metric_type
      unit
      tags
      alerts {
        threshold
        direction
        priority
      }
      mapping
      expected_interval_sec

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