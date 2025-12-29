// gatsby-node.js
const path = require('path');

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const metricTemplate = path.resolve(`./src/pages/Metric.tsx`);

  const result = await graphql(`
    {
      allMetricDefinition {
        nodes {
          id
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
      path: `/metrics/${metric.id}`, // e.g. /metrics/system.cpu.temp
      component: metricTemplate,
      context: {
        id: metric.id,
      },
    });
  });
};
