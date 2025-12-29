// import React from "react";
// import { Link, graphql, PageProps } from "gatsby";

// type DataProps = {
//     markdownRemark: {
//         html: string;
//         frontmatter?: {
//             title?: string;
//         };
//     } | null;
// };

// const DataSpecificationsPage: React.FC<PageProps<DataProps>> = ({ data }) => {
//     const md = data?.markdownRemark;
//     const title = md?.frontmatter?.title ?? "Data Specifications";
//     const html = md?.html ?? "<p>No content found.</p>";

//     return (
//         <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
//             <div style={{ marginBottom: 16 }}>
//                 <Link to="/">
//                     <button type="button">← Back to homepage</button>
//                 </Link>
//             </div>

//             <h1>{title}</h1>

//             <article
//                 style={{ marginTop: 24 }}
//                 dangerouslySetInnerHTML={{ __html: html }}
//             />
//         </main>
//     );
// };

// export default DataSpecificationsPage;

// export const query = graphql`
//     query DataSpecificationsMarkdown {
//         markdownRemark(fileAbsolutePath: { regex: "/data-specifications.md$/" }) {
//             html
//             frontmatter {
//                 title
//             }
//         }
//     }
// `;