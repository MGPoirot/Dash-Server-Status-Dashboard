import styled from "styled-components";

const TextContainer = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 0;

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

export default TextContainer;