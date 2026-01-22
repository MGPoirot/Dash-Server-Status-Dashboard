// src/pages/index.tsx
import * as React from "react";
import { graphql, PageProps } from "gatsby";
import styled from "styled-components";
import Tile from "../components/Tile/Tile";
import Navbar from "../components/Navbar/navbar";
import StyleWrapper from "../styles/StyleWrapper";
import { MetricConfigBasic } from "../types/metric";
import { SeriesNode } from "../types/nodes";
import { extractLatestValue } from "../methods/utils";
import { AlertLogic } from "../methods/statusLogic";
import { priorityRank } from "../types/alerts";

type IndexPageData = {
  allMetricConfig: {
    nodes: MetricConfigBasic[];
  };
  allMetricLatest: {
    nodes: SeriesNode[];
  };
};

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  padding: 1rem;
`;

const TagBar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.2rem 1rem;
  overflow: hidden; 
  white-space: nowrap;
`;

const TagToggle = styled.button<{ active: boolean }>`
  appearance: none;
  background: transparent;
  border: 1px solid
    ${({ active }) =>
      active ? "var(--primary)" : "rgba(var(--border-rgb), 0.5)"};
  border-color: ${({ active }) =>
    active ? "var(--primary)" : "var(--border)"};
  color: var(--text);
  opacity: ${({ active }) => (active ? 1 : 0.5)};
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`;

function normTag(tag: string): string {
  return tag.trim().toLowerCase();
}

const IndexPage: React.FC<PageProps<IndexPageData>> = ({ data }) => {
  const metrics = data?.allMetricConfig?.nodes ?? [];
  const latest = data?.allMetricLatest?.nodes ?? [];

  // Build a quick lookup table: metric_id -> latest value
  const latestByName = new Map(
    latest.map((l) => [l.metric_id, extractLatestValue(l)])
  );

  // Collect tag prevalence across all metrics (normalized)
  const tagCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of metrics) {
      const tags = (m?.tags ?? []).map(normTag).filter(Boolean);
      // count each tag once per metric
      for (const t of new Set(tags)) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return counts;
  }, [metrics]);

  const sortedTags = React.useMemo(() => {
    return Array.from(tagCounts.entries())
      .sort((a, b) => {
        // prevalence desc, then alpha
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
      })
      .map(([t]) => t);
  }, [tagCounts]);

  const [activeTags, setActiveTags] = React.useState<Set<string>>(
    () => new Set()
  );

  const toggleTag = React.useCallback((tag: string) => {
    const t = normTag(tag);
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }, []);

  const visibleMetrics = React.useMemo(() => {
    // Filtering: when no tags selected all tiles are visible
    if (activeTags.size === 0) return metrics;

    // When tags selected: only show metrics that contain ANY selected tag
    return metrics.filter((m) => {
      const tags = (m?.tags ?? []).map(normTag).filter(Boolean);
      for (const t of tags) {
        if (activeTags.has(t)) return true;
      }
      return false;
    });
  }, [metrics, activeTags]);

  const sortedMetrics = React.useMemo(() => {
    const withPriority = visibleMetrics.map((metric) => {
      const fileName = metric.metric_id;
      const lv = fileName ? latestByName.get(fileName) : undefined;
      const pr =
        metric.alerts && metric.alerts.length > 0
          ? priorityRank[AlertLogic(metric.alerts, lv)]
          : 0;

      return { metric, pr };
    });

    withPriority.sort((a, b) => {
      // alert priority first (higher first), then label (ascending)
      if (b.pr !== a.pr) return b.pr - a.pr;
      const al = (a.metric.label ?? "").toString();
      const bl = (b.metric.label ?? "").toString();
      const lc = al.localeCompare(bl);
      if (lc !== 0) return lc;
      return (a.metric.metric_id ?? "").localeCompare(b.metric.metric_id ?? "");
    });

    return withPriority;
  }, [visibleMetrics, latestByName]);

  return (
    <StyleWrapper>
      <Navbar />
      {/* 
      Layout
      a horizontal bar with a single line of tag toggles should be shown here 
      tag toggles are sorted by prevalence with most used tags first (left)
      no more tag toggles are shown than fit on a single line

      # Styling
      by default inactive tags use var(--text) and var(--border) but are 50% transparent
      active tags are colored with var(--text) and var(--primary) border and not transparent
      
      # Filtering
      when no tags are selected all tiles are visible
      when a tag toggle is clicked it toggles a filter to only show tiles of metrics that contain this tag  
      when a tag toggle is clicked again, it turns the toggle back off and fildering is updated accordingly*/}

      <TagBar>
        {sortedTags.map((tag) => (
          <TagToggle
            key={tag}
            type="button"
            active={activeTags.has(tag)}
            onClick={() => toggleTag(tag)}
            title={`${tag} (${tagCounts.get(tag) ?? 0})`}
          >
            {tag}
          </TagToggle>
        ))}
      </TagBar>

      <Grid>
        {sortedMetrics.map(({ metric }) => {
          const fileName = metric.metric_id;
          const latestValue = fileName ? latestByName.get(fileName) : undefined;

          return (
            <Tile
              key={metric.metric_id}
              to={`/${metric.metric_id}`}
              metric={metric}
              latestValue={latestValue}
            />
          );
        })}
        {/* <Tile to={""}/> */}{" "}
        {/* Empty tile for adding new metrics will be implemented later*/}
      </Grid>
    </StyleWrapper>
  );
};

export default IndexPage;

export const query = graphql`
  query IndexPage {
    allMetricConfig {
      nodes {
        label
        metric_id
        unit
        meaningMap
        tags
        alerts {
          threshold
          direction
          priority
        }
      }
    }
    allMetricLatest {
      nodes {
        metric_id
        points {
          v
          t
          s
        }
      }
    }
  }
`;