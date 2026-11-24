import type { GatsbyConfig } from "gatsby";
import path from "path";

// Scheduler and metric runners write path.json.tmp, then rename it into place.
// Gatsby's watcher stats the temp path after it is already gone.
const ignoreTempWrites = ["**/*.tmp"];

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
        ignore: ignoreTempWrites,
      },
      __key: "contentPages",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "prompts",
        path: "./content/prompts/",
        ignore: ignoreTempWrites,
      },
      __key: "prompts",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "configs",
        path: path.resolve(__dirname, "content/configs"),
        ignore: ignoreTempWrites,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "series",
        path: path.resolve(__dirname, "content/series"),
        ignore: ignoreTempWrites,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "latest",
        path: path.resolve(__dirname, "content/latest"),
        ignore: ignoreTempWrites,
      },
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "scripts",
        path: path.resolve(__dirname, "content/scripts"),
        ignore: ignoreTempWrites,
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
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Dash - Server Status Dashboard`,
        short_name: `Dash`,
        start_url: `/`,
        background_color: `#071025`,
        theme_color: `#071025`,
        display: `standalone`,
        icons: [
          {
            src: `/android-chrome-192x192.png`,
            sizes: `192x192`,
            type: `image/png`,
          },
          {
            src: `/android-chrome-512x512.png`,
            sizes: `512x512`,
            type: `image/png`,
            purpose: `any maskable`,
          },
        ],
        cache_busting_mode: `none`,
        include_favicon: false,
      },
    },
    `gatsby-plugin-offline`,
  ],
};

export default config;
