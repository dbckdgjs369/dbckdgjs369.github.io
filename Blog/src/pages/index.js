import React from "react"
import { graphql, Link } from "gatsby"
import Layout from "../components/layout"
import styled from "@emotion/styled"
import Nav from "../components/nav"

const MainDiv = styled.div`
  display: flex;
  flex-direction: row;
`

const ContentDiv = styled.div`
  display: flex;
  flex-direction: column;
`

export default ({ data }) => {
  console.log(data)
  return (
    <Layout category={data.allMarkdownRemark.group}>
      <MainDiv>
        <ContentDiv>
          <h1>Home</h1>
          <h4>{data.allMarkdownRemark.totalCount} Posts</h4>
          {data.allMarkdownRemark.edges.map(({ node }) => (
            <div key={node.id}>
              <Link to={node.fields.slug}>{node.frontmatter.title}</Link>
            </div>
          ))}
        </ContentDiv>
      </MainDiv>
    </Layout>
  )
}

export const query = graphql`
  query {
    allMarkdownRemark(sort: { order: DESC, fields: frontmatter___date }) {
      totalCount
      group(field: frontmatter___category) {
        category: fieldValue
        totalCount
      }
      edges {
        node {
          id
          fields {
            slug
          }
          frontmatter {
            title
            date(formatString: "DD MMMM, YYYY")
            slug
          }
          excerpt
        }
      }
    }
  }
`
