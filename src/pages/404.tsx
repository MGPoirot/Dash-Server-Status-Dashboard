import * as React from "react"
import { Link, HeadFC, PageProps } from "gatsby"
import StyleWrapper from "../styles/StyleWrapper"
import Navbar from "../components/Navbar/navbar"
import TextContainer from "../styles/PageWrapper" 

const pageStyles = {
  color: "#232129",
  padding: "96px",
  fontFamily: "-apple-system, Roboto, sans-serif, serif",
}
const NotFoundPage: React.FC<PageProps> = () => {
  return (
    <StyleWrapper>
      <Navbar />
      <TextContainer>
        <h1>Page not found</h1>
        <p>Sorry 😔, we could not find what you were looking for.</p>
        <p><Link to="/">Go home</Link>
          {process.env.NODE_ENV === "development" ? ( 
            <>
              {" "} or try creating a page in <code>src/pages/</code>.
            </>
          ) : null}
        </p>
        </TextContainer>
    </StyleWrapper>
  )
}

export default NotFoundPage

export const Head: HeadFC = () => <title>Not found</title>
