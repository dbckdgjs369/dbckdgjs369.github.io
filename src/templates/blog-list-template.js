import React from "react"
import { graphql } from "gatsby"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"
import Pagination from "../components/pagination"
import PostCard, { CardGrid } from "../components/post-card"

const PageHeader = styled.header`
  margin-bottom: 2.5rem;
`

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
`

const Count = styled.p`
  color: var(--text-muted);
  margin-top: 0.75rem;
`

const Empty = styled.div`
  border: 1px dashed var(--border-strong);
  border-radius: var(--border-radius);
  background: var(--bg-subtle);
  padding: 3rem 1.5rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 1rem;
`

const BlogList = ({ data, pageContext }) => {
  const posts = data.allMarkdownRemark.edges
  const { currentPage } = pageContext

  return (
    <Layout wide>
      <Seo title={`Posts (${currentPage} 페이지)`} />
      <PageHeader>
        <Title>전체 글</Title>
        <Count>총 {data.allMarkdownRemark.totalCount}개의 글</Count>
      </PageHeader>
      {posts.length > 0 ? (
        <>
          <CardGrid>
            {posts.map(({ node }) => (
              <PostCard key={node.id} node={node} />
            ))}
          </CardGrid>
          <Pagination currentPage={currentPage} />
        </>
      ) : (
        <Empty>아직 발행된 글이 없어요. 곧 첫 이야기를 심을게요 🌱</Empty>
      )}
    </Layout>
  )
}

export const blogListQuery = graphql`
  query blogListQuery($skip: Int!, $limit: Int!) {
    allMarkdownRemark(
      sort: { order: DESC, fields: fields___date }
      filter: { frontmatter: { published: { ne: false } } }
      limit: $limit
      skip: $skip
    ) {
      totalCount
      edges {
        node {
          id
          excerpt(pruneLength: 100)
          timeToRead
          fields {
            slug
            date
          }
          frontmatter {
            title
            category
          }
        }
      }
    }
  }
`

export default BlogList
