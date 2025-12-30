import * as React from "react";
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

type Props = {
  children: React.ReactNode;
};

const DocsTemplate = ({ children }: Props) => {
  return (
    <StyleWrapper>
      <Navbar />
      <Container>{children}</Container>
    </StyleWrapper>
  );
};

export default DocsTemplate;
