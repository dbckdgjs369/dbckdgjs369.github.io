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
import UpperArrow from "../images/arrow.png"
import Nav from "./nav"
import Pagination from "./pagination"
import { usePostData } from "../hooks/use-post-data"

const Article = styled.article`
  //여기에서 본문 markdown 스타일 수정
  width: 45rem;
`
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
`
const StyledFooter = styled.footer`
  text-align: center;
  font-size: 1rem;
  bottom: 0;
  margin: 2rem 0;
`

const Main = styled.main`
  display: flex;
  line-height: 2.4rem;
  width: 70rem;
  font-size: 1.2rem;
  justify-content: center;
  color: black;
  a {
    color: gray;
    text-decoration: none;
  }
  a:hover {
    color: rgb(75, 74, 74);
  }
`
const TopBtn = styled.button`
  position: fixed;
  bottom: 5rem;
  right: 5rem;
  width: 5rem;
  height: 5rem;
  border-radius: 100%;
  font-size: 1.3rem;
  border: none;
  box-shadow: 1px 1px 1px 1px gray;
`

const Layout = ({ children }) => {
  const data = usePostData()
  console.log(data)

  return (
    <div>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <Wrapper>
        <Main>
          <Nav data={data.allMarkdownRemark.group} />
          <Article>{children}</Article>
        </Main>
      </Wrapper>
      <StyledFooter>
        © {new Date().getFullYear()} &middot; Groot Inc. All rights reserved.
      </StyledFooter>
    </div>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
