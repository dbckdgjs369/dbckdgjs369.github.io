import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import styled from "@emotion/styled"

const MainDiv = styled.div`
  display: flex;
  flex-direction: row;
`

const ContentDiv = styled.div`
  display: flex;
  flex-direction: column;
`

export default ({ data }) => {
  const post = data.markdownRemark
  console.log(post)
  return (
    <Layout category={data.allMarkdownRemark.group}>
      <MainDiv>
        <ContentDiv>
          <h1>{post.frontmatter.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: post.html }} />
        </ContentDiv>
      </MainDiv>
    </Layout>
  )
}

export const query = graphql`
  query ($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      frontmatter {
        title
      }
    }
    allMarkdownRemark {
      group(field: frontmatter___category) {
        category: fieldValue
        totalCount
      }
    }
  }
`
