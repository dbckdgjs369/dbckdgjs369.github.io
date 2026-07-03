import * as React from "react"
import { Link } from "gatsby"
import styled from "@emotion/styled"
import { getCategoryMeta, getCategoryName } from "../utils/category-meta"

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
  width: 100%;
`

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  overflow: hidden;
  text-decoration: none;
  color: var(--text);
  font-weight: 400;
  box-shadow: var(--shadow);
  transition: transform var(--transition), box-shadow var(--transition),
    border-color var(--transition);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-hover);
    border-color: var(--accent);
    color: var(--text);
  }
`

const Banner = styled.div`
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  background: linear-gradient(
    135deg,
    hsl(${p => p.hue} 55% 92%) 0%,
    hsl(${p => p.hue + 25} 60% 84%) 100%
  );

  :root[data-theme="dark"] & {
    background: linear-gradient(
      135deg,
      hsl(${p => p.hue} 30% 16%) 0%,
      hsl(${p => p.hue + 25} 32% 22%) 100%
    );
  }
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem 1.25rem 1.25rem;
  flex: 1;
`

const Chip = styled.span`
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--accent-strong);
  background: var(--accent-soft);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
`

const Title = styled.h3`
  font-size: 1.08rem;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Excerpt = styled.p`
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Meta = styled.div`
  margin-top: auto;
  padding-top: 0.5rem;
  font-size: 0.78rem;
  color: var(--text-faint);
  display: flex;
  align-items: center;
  gap: 0.4rem;
`

const formatDate = iso => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d)) return null
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(d.getDate()).padStart(2, "0")}`
}

const PostCard = ({ node }) => {
  const { title, category } = node.frontmatter
  const meta = getCategoryMeta(category)
  const date = formatDate(node.fields && node.fields.date)
  const readTime = node.timeToRead

  return (
    <Card to={node.fields.slug}>
      <Banner hue={meta.hue}>{meta.emoji}</Banner>
      <Body>
        <Chip>{getCategoryName(category)}</Chip>
        <Title>{title || "제목 없음"}</Title>
        {node.excerpt ? <Excerpt>{node.excerpt}</Excerpt> : null}
        <Meta>
          {date ? <span>{date}</span> : null}
          {date && readTime ? <span>·</span> : null}
          {readTime ? <span>{readTime}분 읽기</span> : null}
        </Meta>
      </Body>
    </Card>
  )
}

export default PostCard
