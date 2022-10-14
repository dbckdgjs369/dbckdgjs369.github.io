// import * as React from "react"
// import { Link } from "gatsby"

// import Layout from "../components/layout"
// import Seo from "../components/seo"

// const UsingDSG = () => (
//   <Layout>
//     <h1>
//       Hello from a <b>DSG Page</b>
//     </h1>
//     <p>This page is not created until requested by a user.</p>
//     <p>
//       To learn more, head over to our{" "}
//       <a href="https://www.gatsbyjs.com/docs/reference/rendering-options/deferred-static-generation/">
//         documentation about Deferred Static Generation
//       </a>
//       .
//     </p>
//     <Link to="/">Go back to the homepage</Link>
//   </Layout>
// )

// export const Head = () => <Seo title="Using DSG" />

// export default UsingDSG

import React from "react"
import { graphql } from "gatsby"

export default function Template({
  data, // this prop will be injected by the GraphQL query below.
}) {
  const { markdownRemark } = data // data.markdownRemark holds our post data
  const { frontmatter, html } = markdownRemark
  return (
    <div className="blog-post-container">
      <div className="blog-post">
        <h1>{frontmatter.title}</h1>
        <h2>{frontmatter.date}</h2>
        <div
          className="blog-post-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}

export const pageQuery = graphql`
  query ($slug: String!) {
    markdownRemark(frontmatter: { slug: { eq: $slug } }) {
      html
      frontmatter {
        date(formatString: "MMMM DD, YYYY")
        slug
        title
      }
    }
  }
`
