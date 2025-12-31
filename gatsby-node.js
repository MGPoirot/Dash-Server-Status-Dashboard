// gatsby-node.js
const path = require("path");
const { createFilePath } = require("gatsby-source-filesystem");

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
    type MetricDefinition implements Node {
      mapping: JSON
    }
  `);
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type !== "MarkdownRemark") return;

  const parent = getNode(node.parent);
  if (parent?.sourceInstanceName !== "pages") return;

  const slug = createFilePath({ node, getNode, basePath: "pages" });

  createNodeField({
    node,
    name: "slug",
    value: slug,
  });
};

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const metricTemplate = path.resolve("./src/containers/Metric/Metric.tsx");
  const markdownTemplate = path.resolve("./src/templates/markdown-page.tsx");

  const result = await graphql(`
    {
      allMetricDefinition {
        nodes {
          metric_id
        }
      }
      allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/src/pages/.*\\\\.md$/" } }
      ) {
        nodes {
          id
          html
          fields {
            slug
          }
          frontmatter {
            title
          }
          fileAbsolutePath
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panic("Error creating pages", result.errors);
    return;
  }

  // Metric pages
  result.data.allMetricDefinition.nodes.forEach((metric) => {
    createPage({
      path: `/${String(metric.metric_id).replace(/^\/+/, "")}`,
      component: metricTemplate,
      context: {
        metric_id: metric.metric_id,
      },
    });
  });

  // Markdown pages
  result.data.allMarkdownRemark.nodes.forEach((node) => {
    const slug = node.fields?.slug;
    if (!slug) return;

    createPage({
      path: slug,
      component: markdownTemplate,
      context: {
        html: node.html,
        title: node.frontmatter?.title ?? null,
        slug,
      },
    });
  });
};
