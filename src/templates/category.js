import { graphql } from "gatsby"
import React from "react"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"
import PostCard, { CardGrid } from "../components/post-card"
import { getCategoryMeta } from "../utils/category-meta"

const PageHeader = styled.header`
  margin-bottom: 2.5rem;
`

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  display: flex;
  align-items: center;
  gap: 0.6rem;
`

const Count = styled.p`
  color: var(--text-muted);
  margin-top: 0.75rem;
`

const Category = ({ data, location, pageContext }) => {
  const { category } = pageContext
  const { edges, totalCount } = data.allMarkdownRemark
  const meta = getCategoryMeta(category)

  return (
    <Layout wide location={location}>
      <Seo title={category} />
      <PageHeader>
        <Title>
          <span>{meta.emoji}</span>
          {category}
        </Title>
        <Count>
          "{category}" 카테고리의 글 {totalCount}개
        </Count>
      </PageHeader>
      <CardGrid>
        {edges.map(({ node }) => (
          <PostCard key={node.id} node={node} />
        ))}
      </CardGrid>
    </Layout>
  )
}

export default Category

export const pageQuery = graphql`
  query Category($category: String) {
    allMarkdownRemark(
      limit: 2000
      sort: { fields: [fields___date], order: DESC }
      filter: {
        frontmatter: { category: { in: [$category] }, published: { ne: false } }
      }
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
