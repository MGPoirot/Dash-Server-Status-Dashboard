import type { GatsbyConfig } from "gatsby";
import path from "path";

const config: GatsbyConfig = {
  siteMetadata: {
    title: "Dash",
    siteUrl: "https://dash.maartenpoirot.com",
    description: "A simple, lightweight dashboard for my home server powered by Gatsby.",
  },

  graphqlTypegen: true,

  plugins: [
    "gatsby-plugin-styled-components",
    "gatsby-plugin-mdx",
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-highlight-code`,
            options: {
              terminal: "carbon",
              theme: "blackboard",
            },
          },
        ],
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "contentPages",
        path: "./content/pages/",
      },
      __key: "contentPages",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "prompts",
        path: "./content/prompts/",
      },
      __key: "prompts",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "configs",
        path: path.resolve(__dirname, "content/configs"),
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "series",
        path: path.resolve(__dirname, "content/series"),
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "latest",
        path: path.resolve(__dirname, "content/latest"),
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "scripts",
        path: path.resolve(__dirname, "content/scripts"),
      },
    },
    {
      resolve: "gatsby-transformer-json",
      options: {
        typeName: ({ node }) => {
          switch (node.sourceInstanceName) {
            case "configs":
            case "metrics":
              return "MetricConfig";
            case "series":
              return "MetricSeries";
            case "latest":
              return "MetricLatest";
            default:
              return "Json";
          }
        },
      },
    },
  ],
};

export default config;
