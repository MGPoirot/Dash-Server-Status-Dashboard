// gatsby-node.js
const path = require("path");
const fs = require("fs");
const { createFilePath } = require("gatsby-source-filesystem");

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  createTypes(`
    type MetricConfig implements Node {
      meaningMap: JSON
      display: MetricConfigDisplay
    }

    type MetricConfigDisplay {
      visual: MetricConfigVisual
    }

    type MetricConfigVisual {
      type: String
      min: Float
      max: Float
      invert_y: Boolean
      hideAlerts: Boolean
      nLatestPoints: Int
      colorMap: JSON
    }

    type MarkdownRemarkFields {
      slug: String
    }

    type MarkdownRemark implements Node {
      fields: MarkdownRemarkFields
    }
  `);
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type !== "MarkdownRemark") return;

  const parent = getNode(node.parent);
  if (!parent) return;

  // Existing behavior for markdown in /src/pages (if you still have it)
  if (parent.sourceInstanceName === "contentPages") {
    const slug = createFilePath({ node, getNode, basePath: "pages" });
    createNodeField({ node, name: "slug", value: slug });
    return;
  }

  // NEW: slugs for markdown in /content/prompts
  if (parent.sourceInstanceName === "prompts") {
    // Produces flat hierarchy e.g. /configs from configs.md 
    const slug = createFilePath({ node, getNode, basePath: "prompts" });
    createNodeField({ node, name: "slug", value: slug });
  }
};

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  const metricTemplate = path.resolve("./src/templates/metric-page.tsx");
  const markdownTemplate = path.resolve("./src/templates/markdown-page.tsx");
  const promptTemplate = path.resolve("./src/templates/prompt-page.tsx");

  const result = await graphql(`
    {
      allMetricConfig {
        nodes {
          metric_id
        }
      }

      allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/pages/.*\\\\.md$/" } }
      ) {
        nodes {
          id
          html
          fields { slug }
          frontmatter { title }
        }
      }

      allPromptMarkdown: allMarkdownRemark(
        filter: { fileAbsolutePath: { regex: "/content/prompts/.*\\\\.md$/" } }
      ) {
        nodes {
          id
          html
          fields { slug }
          parent {
            ... on File {
              absolutePath
              name
            }
          }
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panic("Error creating pages", result.errors);
    return;
  }

  // Metric pages
  result.data.allMetricConfig.nodes.forEach((metric) => {
    actions.createPage({
      path: `/${String(metric.metric_id).replace(/^\/+/, "")}`,
      component: metricTemplate,
      context: { metric_id: metric.metric_id },
    });
  });

  // Markdown pages (from /content/pages)
  result.data.allMarkdownRemark.nodes.forEach((node) => {
    const slug = node.fields?.slug;
    if (!slug) return;

    actions.createPage({
      path: slug,
      component: markdownTemplate,
      context: {
        html: node.html,
        title: node.frontmatter?.title ?? null,
        slug,
      },
    });
  });

  // Prompt pages (from /content/prompts)
  result.data.allPromptMarkdown.nodes.forEach((node) => {
    const slug = node.fields?.slug;
    const file = node.parent;

    if (!slug || !file?.absolutePath) return;

    // For /content/prompts/configs.md -> /content/prompts/configs.txt
    const txtPath = file.absolutePath.replace(/\.md$/i, ".txt");

    let txt = null;
    if (fs.existsSync(txtPath)) {
      txt = fs.readFileSync(txtPath, "utf8");
    }

    actions.createPage({
      path: slug,
      component: promptTemplate,
      context: {
        slug,
        name: file.name, // basename without extension
        markdownHtml: node.html,
        txt, // string or null
      },
    });
  });
};
