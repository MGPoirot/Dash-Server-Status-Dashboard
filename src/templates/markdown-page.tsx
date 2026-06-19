import * as React from "react";
import { PageProps } from "gatsby";
import Navbar from "../components/Navbar/navbar";
import StyleWrapper from "../styles/StyleWrapper";
import TextContainer from "../styles/PageWrapper";

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
      <TextContainer dangerouslySetInnerHTML={{ __html: html }} />
    </StyleWrapper>
  );
}
