import * as React from "react"
import PropTypes from "prop-types"
import { Link } from "gatsby"
import styled from "@emotion/styled"
import ThemeToggle from "./theme-toggle"

const StyledHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
`

const Inner = styled.div`
  max-width: var(--max-wide);
  margin: 0 auto;
  padding: 0.9rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`

const Logo = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  font-family: var(--font-mono);

  &:hover {
    color: var(--text);
  }

  span.bracket {
    color: var(--accent);
  }
`

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.35rem;

  @media (max-width: 520px) {
    gap: 0.1rem;
  }
`

const NavLink = styled(Link)`
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.95rem;
  padding: 0.4rem 0.7rem;
  border-radius: 8px;
  transition: color var(--transition), background var(--transition);

  &:hover {
    color: var(--accent);
    background: var(--accent-soft);
  }

  @media (max-width: 520px) {
    padding: 0.4rem 0.45rem;
    font-size: 0.88rem;
  }
`

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`

const Header = ({ siteTitle }) => (
  <StyledHeader>
    <Inner>
      <Logo to="/">
        🌱 <span className="bracket">&lt;</span>groot
        <span className="bracket">/&gt;</span>
      </Logo>
      <Right>
        <Nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/page=1">Posts</NavLink>
          <NavLink to="/about">About</NavLink>
        </Nav>
        <ThemeToggle />
      </Right>
    </Inner>
  </StyledHeader>
)

Header.propTypes = {
  siteTitle: PropTypes.string,
}

Header.defaultProps = {
  siteTitle: ``,
}

export default Header
