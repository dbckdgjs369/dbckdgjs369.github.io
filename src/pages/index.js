import React from "react"
import { graphql, Link } from "gatsby"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"
import Nav from "../components/nav"
import PostCard, { CardGrid } from "../components/post-card"
import ProjectCard, { ProjectGrid } from "../components/project-card"
import projects from "../data/projects"

const Hero = styled.section`
  position: relative;
  padding: 1rem 0 2.5rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border);

  &::before {
    content: "";
    position: absolute;
    inset: -3rem -3rem 0 -3rem;
    background: var(--hero-glow);
    z-index: -1;
    pointer-events: none;
  }
`

const Greeting = styled.p`
  font-size: 1.05rem;
  color: var(--accent-strong);
  font-weight: 600;
  margin-bottom: 0.75rem;
`

const HeroTitle = styled.h1`
  font-size: clamp(1.9rem, 5vw, 2.8rem);
  line-height: 1.2;
  margin-bottom: 1rem;

  b {
    color: var(--accent);
  }
`

const HeroDesc = styled.p`
  font-size: 1.1rem;
  color: var(--text-muted);
  max-width: 48rem;
  margin-bottom: 1.75rem;
  word-break: keep-all;
`

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 2.5rem 0 1.5rem;
`

const SectionTitle = styled.h2`
  font-size: 1.4rem;
`

const MoreLink = styled(Link)`
  font-size: 0.9rem;
  font-weight: 600;
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

const IndexPage = ({ data }) => {
  const posts = data.allMarkdownRemark.edges
  const groups = data.allMarkdownRemark.group
  const total = data.allMarkdownRemark.totalCount

  return (
    <Layout wide>
      <Seo title="Home" />
      <Hero>
        <Greeting>안녕하세요 🌱</Greeting>
        <HeroTitle>
          일상의 불편을 코드로 푸는 개발자 <b>유창헌</b>입니다
        </HeroTitle>
        <HeroDesc>
          일상에서 문제를 발견하고 해결하는 데서 즐거움을 느끼며, 이를 통해
          성장합니다.
          <br />
          직접 만든 프로그램과, 만드는 과정에서 배운 것들을 이곳에 기록해요.
        </HeroDesc>
        {groups.length > 0 ? <Nav data={groups} /> : null}
      </Hero>

      <SectionHeader>
        <SectionTitle>🛠️ 만든 것들</SectionTitle>
        <MoreLink to="/projects">전체 보기 →</MoreLink>
      </SectionHeader>
      <ProjectGrid>
        {projects.slice(0, 4).map(p => (
          <ProjectCard key={p.name} project={p} />
        ))}
      </ProjectGrid>

      <SectionHeader>
        <SectionTitle>✍️ 최근 글</SectionTitle>
        {total > 0 ? <MoreLink to="/page=1">전체 보기 →</MoreLink> : null}
      </SectionHeader>
      {posts.length > 0 ? (
        <CardGrid>
          {posts.slice(0, 9).map(({ node }) => (
            <PostCard key={node.id} node={node} />
          ))}
        </CardGrid>
      ) : (
        <Empty>아직 발행된 글이 없어요. 곧 첫 이야기를 심을게요 🌱</Empty>
      )}
    </Layout>
  )
}

export default IndexPage

export const query = graphql`
  query {
    allMarkdownRemark(
      sort: { order: DESC, fields: fields___date }
      filter: { frontmatter: { published: { ne: false } } }
    ) {
      totalCount
      group(field: frontmatter___category) {
        category: fieldValue
        totalCount
      }
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
