import React from "react"
import { graphql, Link, navigate } from "gatsby"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"
import { getCategoryMeta, getCategoryName } from "../utils/category-meta"

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-faint);
  background: none;
  border: none;
  padding: 0;
  margin-bottom: 1.5rem;
  cursor: pointer;

  &:hover {
    color: var(--accent-strong);
  }
`

const PostHeader = styled.header`
  padding-bottom: 1.75rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border);
`

const Chip = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-strong);
  background: var(--accent-soft);
  padding: 0.3rem 0.75rem;
  border-radius: 999px;
  margin-bottom: 1.25rem;
`

const Title = styled.h1`
  font-size: clamp(1.8rem, 4vw, 2.4rem);
  line-height: 1.25;
  margin-bottom: 1rem;
`

const Meta = styled.div`
  font-size: 0.9rem;
  color: var(--text-faint);
  display: flex;
  gap: 0.5rem;
`

const Content = styled.div`
  font-size: 1.05rem;
  line-height: var(--line-height-loose);

  h2 {
    font-size: 1.5rem;
    margin: 2.5rem 0 1rem;
  }
  h3 {
    font-size: 1.2rem;
    margin: 2rem 0 0.75rem;
  }
`

const BackLink = styled(Link)`
  display: inline-block;
  margin-top: 3.5rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
  font-weight: 600;
  width: 100%;
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

const BlogPost = ({ data }) => {
  const post = data.markdownRemark
  const { title, category } = post.frontmatter
  const meta = getCategoryMeta(category)
  const categoryName = getCategoryName(category)
  const date = formatDate(post.fields && post.fields.date)

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate("/")
    }
  }

  return (
    <Layout>
      <Seo title={title || "글"} description={post.excerpt} />
      <BackButton type="button" onClick={goBack}>
        ← 뒤로가기
      </BackButton>
      <article>
        <PostHeader>
          {category ? (
            <Chip to={`/category/${categoryName}`}>
              <span>{meta.emoji}</span>
              {categoryName}
            </Chip>
          ) : null}
          <Title>{title}</Title>
          <Meta>
            {date ? <span>{date}</span> : null}
            {date && post.timeToRead ? <span>·</span> : null}
            {post.timeToRead ? <span>{post.timeToRead}분 읽기</span> : null}
          </Meta>
        </PostHeader>
        <Content dangerouslySetInnerHTML={{ __html: post.html }} />
      </article>
      <BackLink to="/">← 목록으로 돌아가기</BackLink>
    </Layout>
  )
}

export default BlogPost

export const query = graphql`
  query ($slug: String!) {
    markdownRemark(fields: { slug: { eq: $slug } }) {
      html
      excerpt(pruneLength: 140)
      timeToRead
      fields {
        date
      }
      frontmatter {
        title
        category
      }
    }
  }
`
