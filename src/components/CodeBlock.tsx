import * as React from "react";
import styled from "styled-components";

const Wrap = styled.div`
  margin: 1rem 0;
`;

const Title = styled.a`
  display: inline-block;
  padding: 0.5rem 0.7rem;
  line-height: 1;
  font-size: 0.8em;
  background: #0d1021;
  color: #cbd5e1;
  border-radius: 8px 8px 0 0;
  font-family: monospace;
  &::after {
    font-family: sans-serif;
    font-weight: 700;
    content: ' (view raw)';
  } 
`;

const CodeShell = styled.div`
  /* This makes the title and code visually attach */
  border-radius: 0 8px 8px 8px;
  overflow: hidden;
  transform: translateY(-2px);

  /* Remove the component own outer spacing if it has any */
  deckgo-highlight-code {
    display: block;
  }
  box-shadow: 0 1em 2em rgba(0, 0, 0, .4);
`;

export default function CodeBlock({ code, lang, fname }: { code: string; lang: string | undefined; fname?: string }) {
  return (
    <Wrap>
      {fname ? <Title href={`/${fname}`}>{fname}</Title> : null}
      <CodeShell>
        <deckgo-highlight-code
            terminal="carbon"
            theme="blackboard"
            language={lang}
            line-numbers="true"
            style={
                {
                "--deckgo-highlight-code-carbon-margin": "0px",
                } as React.CSSProperties
            }
        >
              <code slot="code">{code}</code>
        </deckgo-highlight-code>
      </CodeShell>
    </Wrap>
  );
}
