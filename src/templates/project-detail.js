import React from "react"
import { graphql, Link } from "gatsby"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"
import PostCard, { CardGrid } from "../components/post-card"
import projects from "../data/projects"

const BackLink = styled(Link)`
  display: inline-block;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
`

const Header = styled.header`
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  padding-bottom: 2rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border);
`

const Badge = styled.div`
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  background: linear-gradient(
    135deg,
    hsl(${p => p.hue} 55% 92%) 0%,
    hsl(${p => p.hue + 30} 60% 84%) 100%
  );

  :root[data-theme="dark"] & {
    background: linear-gradient(
      135deg,
      hsl(${p => p.hue} 30% 16%) 0%,
      hsl(${p => p.hue + 30} 32% 22%) 100%
    );
  }
`

const Title = styled.h1`
  font-size: clamp(1.7rem, 4vw, 2.3rem);
  margin-bottom: 0.6rem;
`

const Tagline = styled.p`
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 1rem;
`

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`

const Tech = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-faint);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
`

const LinkBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text-muted);
  transition: all var(--transition);

  &:hover {
    color: var(--accent-strong);
    background: var(--accent-soft);
    border-color: var(--accent);
  }
`

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
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

const LINK_META = {
  live: { label: "라이브", icon: "🔗" },
  chrome: { label: "크롬 스토어", icon: "🧩" },
  npm: { label: "npm", icon: "📦" },
  github: { label: "GitHub", icon: "🐙" },
}

const ProjectDetail = ({ data, pageContext }) => {
  const project = projects.find(p => p.slug === pageContext.slug) || {}
  const posts = data.allMarkdownRemark.edges
  const order = ["live", "chrome", "npm", "github"]
  const links = project.links || {}

  return (
    <Layout wide>
      <Seo title={project.name || "Project"} description={project.tagline} />
      <BackLink to="/projects">← 프로젝트 목록</BackLink>
      <Header>
        <Badge hue={project.hue || 145}>{project.emoji}</Badge>
        <div>
          <Title>{project.name}</Title>
          <Tagline>{project.tagline}</Tagline>
          <Row>
            {(project.tech || []).map(t => (
              <Tech key={t}>{t}</Tech>
            ))}
          </Row>
          <Row style={{ marginTop: "0.75rem" }}>
            {order
              .filter(k => links[k])
              .map(k => (
                <LinkBtn
                  key={k}
                  href={links[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{LINK_META[k].icon}</span>
                  {LINK_META[k].label}
                </LinkBtn>
              ))}
          </Row>
        </div>
      </Header>

      <SectionTitle>📝 관련 글</SectionTitle>
      {posts.length > 0 ? (
        <CardGrid>
          {posts.map(({ node }) => (
            <PostCard key={node.id} node={node} />
          ))}
        </CardGrid>
      ) : (
        <Empty>
          아직 이 프로젝트에 대한 글이 없어요. 만든 이야기를 곧 풀어낼게요 🌱
        </Empty>
      )}
    </Layout>
  )
}

export default ProjectDetail

export const query = graphql`
  query ProjectDetail($slug: String!) {
    allMarkdownRemark(
      sort: { order: DESC, fields: fields___date }
      filter: {
        frontmatter: { project: { eq: $slug }, published: { ne: false } }
      }
    ) {
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
