// src/pages/404.tsx
import * as React from "react";
import { Link, HeadFC, PageProps } from "gatsby";
import StyleWrapper from "../styles/StyleWrapper";
import Navbar from "../components/Navbar/navbar";
import TextContainer from "../styles/PageWrapper";
import { StatusIcon } from "../components/status-icons";
import CounterVisual from "../components/Visuals/CounterVisual/CounterVisual";

const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <StyleWrapper>
      <Navbar />
      <TextContainer>
        <h1>
          <StatusIcon status="critical" /> Page Not Found
        </h1>
        <CounterVisual
          type="counter"
          points={[{ t: "", v: 404 }]}
          alerts={[{ threshold: -1, direction: "above", priority: "critical" }]}
        />
        <p>
          The page you were looking for does not exist.{" "}
          <Link to="/">Return to the homepage</Link>.
        </p>
      </TextContainer>
    </StyleWrapper>
  );
};

export default NotFoundPage;

export const Head: HeadFC = () => <title>404 – Not Found | Dash</title>;
