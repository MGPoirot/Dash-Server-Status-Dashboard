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

const MAX_LEN = 25000;

export default function PromptPage({ pageContext }: PageProps<unknown, PromptPageContext>) {
  const { name, markdownHtml, txt } = pageContext;

  const truncatedTxt = React.useMemo(() => {
    if (!txt) return null;
    if (txt.length <= MAX_LEN) return txt;
    return txt.slice(-MAX_LEN); // last 5000 chars
  }, [txt]);

  const wasTruncated = !!txt && txt.length > MAX_LEN;

  return (
    <StyleWrapper>
      <Navbar />
      <TextContainer dangerouslySetInnerHTML={{ __html: markdownHtml }} />
      <TextContainer>
        {truncatedTxt ? (
          <>
            {wasTruncated && (
              <i style={{ opacity: 0.7 }}>
                Log truncated: showing last {MAX_LEN} characters (of {txt!.length}).
              </i>
            )}
            <CodeBlock code={truncatedTxt} lang="html" fname={`prompts/${name}.txt`} />
          </>
        ) : (
          <p>No prompt found.</p>
        )}
      </TextContainer>
    </StyleWrapper>
  );
}
