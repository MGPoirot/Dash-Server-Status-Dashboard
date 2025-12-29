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

    // Existing pages source
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    // --- NEW ---
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "definitions",
        path: path.resolve(__dirname, "content/definitions"),
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
      resolve: "gatsby-transformer-json",
      options: {
        typeName: ({ node }) => {
          switch (node.sourceInstanceName) {
            case "definitions":
              return "MetricDefinition";
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
