import * as React from "react";
import { PageProps } from "gatsby";
import styled from "styled-components";

import Navbar from "../components/Navbar/navbar";
import StyleWrapper from "../styles/StyleWrapper";

const Container = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;

  h1,
  h2,
  h3 {
    margin-top: 1.5rem;
  }

  pre {
    overflow: auto;
    padding: 1rem;
    border-radius: 8px;
  }

  code {
    word-break: break-word;
  }
`;

type Context = {
  html?: string;
  title?: string | null;
  slug?: string;
};

export default function MarkdownPage({ pageContext }: PageProps<unknown, Context>) {
  const html = pageContext.html ?? "<p>Docs not found.</p>";

  return (
    <StyleWrapper>
      <Navbar />
      <Container dangerouslySetInnerHTML={{ __html: html }} />
    </StyleWrapper>
  );
}
