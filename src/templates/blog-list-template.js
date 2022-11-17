import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import Pagination from "../components/pagination"

const BlogList = ({ data, pageContext }) => {
  const posts = data.allMarkdownRemark.edges
  const { currentPage } = pageContext

  console.log(posts)
  return (
    <Layout>
      <h1>Page {currentPage}</h1>
      <h4>{data.allMarkdownRemark.totalCount} Posts</h4>
      {posts.map(({ node }) => (
        <div key={node.id}>
          <Link to={node.fields.slug}>{node.frontmatter.title}</Link>
        </div>
      ))}
      <Pagination currentPage={currentPage} />
    </Layout>
  )
}

export const blogListQuery = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(limit: $limit, skip: $skip) {
      totalCount
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
          }
        }
      }
    }
  }
`

export default BlogList
