// src/templates/prompt-page.tsx
import * as React from "react";
import type { PageProps } from "gatsby";
import StyleWrapper from "../styles/StyleWrapper";
import Navbar from "../components/Navbar/navbar";
import TextContainer from "../styles/PageWrapper";
import CodeBlock from "../components/CodeBlock";

type PromptPageContext = {
  slug: string;
  name: string;
  relativeDirectory: string;
  markdownHtml: string;
  txt: string | null;
};

export default function PromptPage({ pageContext }: PageProps<unknown, PromptPageContext>) {
  const { name, relativeDirectory, markdownHtml, txt } = pageContext;

  return (
    <StyleWrapper>
      <Navbar />
      <TextContainer dangerouslySetInnerHTML={{ __html: markdownHtml }} />
      <TextContainer>
          {txt ? ( 
            <CodeBlock 
              code={txt}
              lang='html'
              fname={`prompts/${name}.txt`}
            />
          ) : (
            <p>No prompt found.</p>
          )}
      </TextContainer>
    </StyleWrapper>
  );
}
