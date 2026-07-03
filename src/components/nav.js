import * as React from "react"
import styled from "@emotion/styled"
import { Link } from "gatsby"
import { getCategoryMeta } from "../utils/category-meta"

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
`

const Chip = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  transition: color var(--transition), border-color var(--transition),
    background var(--transition), transform var(--transition);

  &:hover {
    color: var(--accent-strong);
    border-color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-1px);
  }

  span.count {
    color: var(--text-faint);
    font-size: 0.8rem;
  }
`

const Nav = ({ data }) => {
  if (!data) return null
  return (
    <ChipRow>
      {data.map((group, index) => (
        <Chip key={index} to={`/category/${group.category}`}>
          <span>{getCategoryMeta(group.category).emoji}</span>
          {group.category}
          <span className="count">{group.totalCount}</span>
        </Chip>
      ))}
    </ChipRow>
  )
}

export default Nav
