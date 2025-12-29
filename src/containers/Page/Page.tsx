// import React from "react";
// import { Link, graphql, PageProps } from "gatsby";

// type MarkdownData = {
//   markdownRemark: {
//     html: string;
//     frontmatter?: {
//       title?: string;
//       slug?: string;
//     };
//   };
// };

// const MarkdownPageTemplate: React.FC<PageProps<MarkdownData>> = ({ data }) => {
//   const md = data.markdownRemark;
//   const title = md.frontmatter?.title ?? "Untitled page";
//   const html = md.html ?? "<p>No content found.</p>";

//   return (
//     <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
//       <div style={{ marginBottom: 16 }}>
//         <Link to="/">
//           <button type="button">← Back to homepage</button>
//         </Link>
//       </div>

//       <h1>{title}</h1>

//       <article
//         style={{ marginTop: 24 }}
//         dangerouslySetInnerHTML={{ __html: html }}
//       />
//     </main>
//   );
// };

// export default MarkdownPageTemplate;

// // Note the $id variable – it'll come from createPage context
// export const query = graphql`
//   query MarkdownPageById($id: String!) {
//     markdownRemark(id: { eq: $id }) {
//       html
//       frontmatter {
//         title
//         slug
//       }
//     }
//   }
// `;
