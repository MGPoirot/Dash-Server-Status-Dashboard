import React from "react";
import type { GatsbySSR } from "gatsby";

const SITE_URL = "https://dash.maartenpoirot.com";

export const onRenderBody: GatsbySSR["onRenderBody"] = ({ setHeadComponents }) => {
  setHeadComponents([
    <link key="favicon" rel="icon" type="image/x-icon" href="/favicon.ico" />,
    <meta key="og:type" property="og:type" content="website" />,
    <meta key="og:site_name" property="og:site_name" content="Dash" />,
    <meta key="og:title" property="og:title" content="Dash" />,
    <meta key="og:description" property="og:description" content="A simple, lightweight dashboard for my home server." />,
    <meta key="og:image" property="og:image" content={`${SITE_URL}/preview.png`} />,
    <meta key="og:url" property="og:url" content={SITE_URL} />,
  ]);
};
