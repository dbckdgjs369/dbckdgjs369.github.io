import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import styled from "@emotion/styled"

const Wrapper = styled.div`
  background-color: aliceblue;
`

export default ({ data }) => {
  const post = data.markdownRemark
  console.log(post)
  return (
    <Layout>
      <Wrapper>
        <h1>{post.frontmatter.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: post.html }} />
      </Wrapper>
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
  }
`
