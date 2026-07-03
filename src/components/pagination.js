import React from "react"
import styled from "@emotion/styled"
import { Link } from "gatsby"
import { usePostData } from "../hooks/use-post-data"

const Wrapper = styled.nav`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 4rem;
  gap: 0.5rem;
`

const pageStyle = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.4rem;
  height: 2.4rem;
  padding: 0 0.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  border: 1px solid var(--border);
  transition: all 0.25s ease;
`

const PageNumber = styled(Link)`
  ${pageStyle}
  color: var(--text-muted);
  background: var(--bg-subtle);

  &:hover {
    color: var(--accent-strong);
    border-color: var(--accent);
    background: var(--accent-soft);
  }
`

const CurrentPageNumber = styled(Link)`
  ${pageStyle}
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
  font-weight: 700;

  &:hover {
    color: #fff;
    background: var(--accent-strong);
  }
`

const Pagination = ({ currentPage = 1 }) => {
  const data = usePostData()
  const pageCount = Math.ceil(data.allMarkdownRemark.totalCount / 10)

  if (pageCount <= 1) return null

  return (
    <Wrapper aria-label="페이지 네비게이션">
      {Array.from(Array(pageCount), (_, i) =>
        currentPage === i + 1 ? (
          <CurrentPageNumber key={i + 1} to={`/page=${i + 1}`}>
            {i + 1}
          </CurrentPageNumber>
        ) : (
          <PageNumber key={i + 1} to={`/page=${i + 1}`}>
            {i + 1}
          </PageNumber>
        )
      )}
    </Wrapper>
  )
}

export default Pagination
