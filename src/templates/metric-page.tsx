// src/templates/metric-page.tsx
import * as React from "react";
import { graphql, Link, PageProps } from "gatsby";
import StyleWrapper from "../styles/StyleWrapper";
import Navbar from "../components/Navbar/navbar";
import { MetricConfigBasic } from "../types/metric";
import { SeriesNode } from "../types/nodes";
import { resolveMetricValue } from "../methods/statusLogic";
import TextContainer from "../styles/PageWrapper";
import CodeBlock from "../components/CodeBlock";
import Collapsible from "../components/Collapsible/Collapsible";
import VisualLoose from "../components/Visuals/Visuals";
import { fetchConfig, fetchSeries } from "../methods/fetch";
import { extractLatestValue } from "../methods/utils";

type ScriptFileNode = {
  name: string;
  publicURL: string | null;
};

type MetricPageData = {
  metric: {
    nodes: MetricConfigBasic[];
  };
  allMetricLatest: { nodes: SeriesNode[] };
  allMetricSeries: { nodes: SeriesNode[] };
  allScripts: { nodes: ScriptFileNode[] };
};

type MetricPageContext = {
  metric_id: string;
};

type SectionType = "config" | "script" | "latest";

const MetricPage: React.FC<PageProps<MetricPageData, MetricPageContext>> = ({ data }) => {
  const { metric, allMetricLatest, allMetricSeries, allScripts } = data;

  const metricNode = metric.nodes[0];
  if (!metricNode) return null;

  const fileName = metricNode.metric_id;

  const latestForMetric = allMetricLatest.nodes.find((l) => l.metric_id === fileName);
  const bakedLatestPoints = latestForMetric?.points ?? [];
  console.log(latestForMetric)

  const seriesForMetric = allMetricSeries.nodes.find((s) => s.metric_id === fileName);
  const bakedSeriesPoints = seriesForMetric?.points ?? [];

  // ---- Live overrides (start with baked build-time values) -----------------

  const [liveMetric, setLiveMetric] = React.useState<MetricConfigBasic>(metricNode);
  const [liveSeriesPoints, setLiveSeriesPoints] = React.useState(bakedSeriesPoints);

  React.useEffect(() => {
    const metricId = metricNode.metric_id;
    if (!metricId) return;

    const controller = new AbortController();

    (async () => {
      try {
        const [cfg, series] = await Promise.all([
          fetchConfig(metricId, controller.signal),
          fetchSeries(metricId, controller.signal),
        ]);

        // Update config (keep parent/name from baked node so existing joins keep working)
        setLiveMetric((prev) => ({
          ...(prev as any),
          ...(cfg as any)
        }));

        // Update series points
        const pts = (series as any)?.points;
        if (Array.isArray(pts)) {
          setLiveSeriesPoints(pts);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          // optional: console.debug("[MetricPage live fetch failed]", metricId, e);
        }
      }
    })();

    return () => controller.abort();
    // metricNode.metric_id is stable per page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricNode.metric_id]);

  // ---- Latest value (still derived from baked latest node for now) --------
  // You asked for fetchConfig + fetchSeries; keeping latest as-is.
  const latestValue = extractLatestValue(bakedLatestPoints);
  
  const { emoji } = resolveMetricValue(liveMetric, latestValue);

  const scriptFile = allScripts.nodes.find((f) => f.name === fileName);
  const scriptFileName = scriptFile?.publicURL?.split("/").pop() ?? null;
  const scriptFileExt = scriptFile?.publicURL?.split(".").pop() ?? null;

  const [visibleSection, setVisibleSection] = React.useState<SectionType | null>(null);
  const toggleVisibleSection = React.useCallback((sectionName: SectionType) => {
    setVisibleSection((prev) => (prev === sectionName ? null : sectionName));
  }, []);

  const [scriptText, setScriptText] = React.useState<string | null>(null);
  const [scriptError, setScriptError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setScriptText(null);
      setScriptError(null);

      if (visibleSection !== "script") return;
      if (!scriptFile?.publicURL) return;

      try {
        const res = await fetch(scriptFile.publicURL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const txt = await res.text();
        if (!cancelled) setScriptText(txt);
      } catch (e: any) {
        if (!cancelled) setScriptError(e?.message ?? "Failed to load script");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [visibleSection, scriptFile?.publicURL]);

  const visual = liveMetric.display?.visual;
  return (
    <StyleWrapper>
      <Navbar />
      <TextContainer>
        <h1>
          {emoji} {liveMetric.label || fileName || liveMetric.metric_id}
        </h1>

        {visual ? (
          <VisualLoose
            {...visual}
            points={liveSeriesPoints}
            alerts={liveMetric.alerts}
            unit={liveMetric?.unit}
            meaningMap={liveMetric?.meaningMap}
          />
        ) : (
          <p>No visual selected</p>
        )}

        <p
          dangerouslySetInnerHTML={{
            __html: liveMetric.description ? liveMetric.description : "<i>No description provided.</i>",
          }}
        />
      </TextContainer>
      <Collapsible
        id="section-config"
        title="Config"
        open={visibleSection === "config"}
        onToggle={() => toggleVisibleSection("config")}
      >
        <CodeBlock code={JSON.stringify(liveMetric, null, 2)} lang="json" fname={`configs/${fileName}.json`} />
      </Collapsible>

      <Collapsible
        id="section-script"
        title="Script"
        open={visibleSection === "script"}
        onToggle={() => toggleVisibleSection("script")}
      >
        {!scriptFile ? (
          <p>
            No script for this metric. <code>{`scripts/${fileName}.py`}</code> does not exist.
          </p>
        ) : scriptError ? (
          <p>Could not load script: {scriptError}</p>
        ) : scriptText == null ? (
          <p>Loading script…</p>
        ) : (
          <CodeBlock
            code={scriptText}
            lang={scriptFileExt === "py" ? "python" : scriptFileExt === "sh" ? "bash" : undefined}
            fname={`scripts/${scriptFileName ?? `${fileName}.py`}`}
          />
        )}
      </Collapsible>

      <Collapsible
        id="section-latest"
        title="Raw Latest"
        open={visibleSection === "latest"}
        onToggle={() => toggleVisibleSection("latest")}
      >
        {latestForMetric ? (
          <CodeBlock code={JSON.stringify(latestForMetric, null, 2)} lang="json" fname={`latest/${fileName}.json`} />
        ) : (
          <p>No latest data found for this metric.</p>
        )}
      </Collapsible>
    </StyleWrapper>
  );
};

export default MetricPage;

export const query = graphql`
  query MetricPage($metric_id: String!) {
    metric: allMetricConfig(filter: { metric_id: { eq: $metric_id } }) {
      nodes {
        label
        description
        metric_id
        type
        component
        unit
        tags
        alerts {
          threshold
          direction
          priority
        }
        meaningMap
        schedule
        display {
          visual {
            type
            min
            max
            hideAlerts
            invert_y
            nLatestPoints
            colorMap
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
          s
        }
      }
    }

    allMetricSeries {
      nodes {
        metric_id
        points {
          t
          v
          s
        }
      }
    }

    allScripts: allFile(filter: { sourceInstanceName: { eq: "scripts" }, extension: { eq: "py" } }) {
      nodes {
        name
        publicURL
      }
    }
  }
`;
