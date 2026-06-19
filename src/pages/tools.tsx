import * as React from "react";
import Navbar from "../components/Navbar/navbar";
import StyleWrapper from "../styles/StyleWrapper";
import TextContainer from "../styles/PageWrapper";

const tools = [
  {
    name: "runner.py",
    cmd: "python -m tools.runner --metric <metric_id>",
    description:
      "Runs a single metric script and writes the result to <code>content/latest/</code> and <code>content/series/</code>. Use this to test a metric or force a one-off refresh.",
    example: "python -m tools.runner --metric services_plex-music_days-since-last-add",
    runIt: true,
  },
  {
    name: "add_metric.py",
    cmd: "python -m tools.add_metric",
    description:
      "Interactively creates a new metric: prompts for a description, uses an LLM to generate the config JSON and Python script, validates both, and immediately runs the new metric. Requires AWS credentials for Bedrock.",
    runIt: true,
  },
  {
    name: "delete_metric.py",
    cmd: "python -m tools.delete_metric --metric <metric_id>",
    description:
      "Removes a metric and all its data (script, config, latest, series). Asks for confirmation if the metric has more than one data point.",
    runIt: true,
  },
  {
    name: "harmonize_configs.py",
    cmd: "python -m tools.harmonize_configs",
    description:
      "One-off cleanup tool. Uses an LLM to improve descriptions and harmonize labels and tags across all metrics. Only needed occasionally.",
    runIt: true,
  },
];

const autoTools = [
  {
    name: "scheduler.py",
    description:
      "Background daemon that reads all metric configs and runs <code>python -m tools.runner</code> on each metric according to its configured schedule. Managed by the process supervisor — you don't run this manually.",
  },
];

export default function ToolsPage() {
  return (
    <StyleWrapper>
      <Navbar />
      <TextContainer>
        <h1>Tools</h1>
        <p>
          All tools run from the project root with the <code>DashPy</code> conda
          environment active:
        </p>
        <pre>
          <code>conda activate DashPy</code>
        </pre>

        <h2>Run yourself</h2>
        {tools.map((t) => (
          <section key={t.name} style={{ marginBottom: "2rem" }}>
            <h3>
              <a href={`/tools/${t.name}`} target="_blank" rel="noopener noreferrer">
                {t.name}
              </a>
            </h3>
            <p dangerouslySetInnerHTML={{ __html: t.description }} />
            <pre>
              <code>{t.cmd}</code>
            </pre>
            {t.example && (
              <pre>
                <code style={{ opacity: 0.6 }}># example{"\n"}{t.example}</code>
              </pre>
            )}
          </section>
        ))}

        <h2>Runs automatically</h2>
        {autoTools.map((t) => (
          <section key={t.name} style={{ marginBottom: "2rem" }}>
            <h3>
              <a href={`/tools/${t.name}`} target="_blank" rel="noopener noreferrer">
                {t.name}
              </a>
            </h3>
            <p dangerouslySetInnerHTML={{ __html: t.description }} />
          </section>
        ))}
      </TextContainer>
    </StyleWrapper>
  );
}
