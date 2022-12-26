import * as React from "react"
import PropTypes from "prop-types"
import { Link } from "gatsby"
import styled from "@emotion/styled"
import Groot from "../images/Groot.png"

const StyledHeader = styled.div`
  margin: 0 auto;
  padding: 4rem 8rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StyledLink = styled(Link)`
  font-size: 2rem;
  color: greenyellow;
  text-decoration: none;
`
const StyledImage = styled.img`
  height: 3rem;
  margin: 0;
  border-radius: 100%;
`
const Header = ({ siteTitle }) => (
  <StyledHeader>
    <StyledLink to="/">{siteTitle}</StyledLink>
    <Link to="https://github.com/dbckdgjs369">
      <StyledImage alt="Groot logo" src={Groot} />
    </Link>
  </StyledHeader>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
