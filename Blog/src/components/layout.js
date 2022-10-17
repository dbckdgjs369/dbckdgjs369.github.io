/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import PropTypes from "prop-types"
import { useStaticQuery, graphql } from "gatsby"
import Header from "./header"
import "./layout.css"
import styled from "@emotion/styled"

const Wrapper = styled.div`
  margin: 0 auto;
  max-width: 54rem;
  padding: 32px;
`
const Footer = styled.footer`
  margin-top: 32px;
  font-size: 14px;
  position: fixed;
  bottom: 0;
  margin-bottom: 5rem;
`

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <Wrapper>
        <main>{children}</main>
        <Footer>
          © {new Date().getFullYear()} &middot; Groot Inc. All rights reserved.
        </Footer>
      </Wrapper>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
