// gatsby-node.js
const path = require('path');

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
    type MetricDefinition implements Node {
      mapping: JSON
    }
  `);
};

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const metricTemplate = path.resolve(`./src/pages/Metric.tsx`);

  const result = await graphql(`
    {
      allMetricDefinition {
        nodes {
          metric_id
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panic('Error loading metric definitions', result.errors);
    return;
  }

  const metrics = result.data.allMetricDefinition.nodes;

  metrics.forEach((metric) => {
    createPage({
      path: `/${metric.metric_id}`, // e.g. /system.cpu.temp
      component: metricTemplate,
      context: {
        // Matches the page query variable name in src/pages/Metric.tsx
        metric_id: metric.metric_id,
      },
    });
  });
};
