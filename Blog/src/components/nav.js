import * as React from "react"
import "./layout.css"
import styled from "@emotion/styled"
import { Link } from "gatsby"

const StyledNav = styled.nav`
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 10rem;
  top: 20rem;
`

const Nav = ({ data }) => {
  return (
    <StyledNav>
      <div>
        {data.map((group, index) => (
          <div key={index}>
            <Link to={group.category}>
              {group.category}({group.totalCount})
            </Link>
          </div>
        ))}
      </div>
    </StyledNav>
  )
}

export default Nav
