/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import PropTypes from "prop-types"
import Header from "./header"
import "./layout.css"
import styled from "@emotion/styled"

const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${p => (p.wide ? "var(--max-wide)" : "var(--max-content)")};
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  line-height: var(--line-height-normal);
`

const StyledFooter = styled.footer`
  border-top: 1px solid var(--border);
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-faint);
  padding: 2rem 1.5rem;
`

const TopBtn = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  font-size: 1.2rem;
  color: #fff;
  background: var(--accent);
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-hover);
  opacity: ${p => (p.visible ? 1 : 0)};
  pointer-events: ${p => (p.visible ? "auto" : "none")};
  transition: opacity var(--transition), transform var(--transition),
    background var(--transition);

  &:hover {
    background: var(--accent-strong);
    transform: translateY(-2px);
  }
`

const Layout = ({ children, wide = false }) => {
  const [showTop, setShowTop] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener("scroll", onScroll)
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <Page>
      <Header />
      <Main wide={wide}>{children}</Main>
      <StyledFooter>
        © {new Date().getFullYear()} · Groot's Tech Blog. Built with Gatsby 🌱
      </StyledFooter>
      <TopBtn
        visible={showTop}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="맨 위로"
      >
        ↑
      </TopBtn>
    </Page>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  wide: PropTypes.bool,
}

export default Layout
