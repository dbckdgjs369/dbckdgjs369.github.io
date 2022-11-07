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

const Article = styled.article`
  //여기에서 본문 markdown 스타일 수정
  width: 70%;
`
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  max-width: 80rem;
  margin: 3rem;
`
const StyledFooter = styled.footer`
  text-align: center;
  font-size: 1rem;
  bottom: 0;
  margin: 2rem 0;
`

const Main = styled.main`
  display: flex;
  flex-wrap: wrap;
  padding: 3rem;
  line-height: 2.4rem;
  justify-content: space-around;
  font-size: 1.2rem;
  color: black;
  gap: 3rem;

  display: flex;
  a {
    color: gray !important;
    text-decoration: none !important;
  }
  a:hover {
    color: rgb(75, 74, 74) !important;
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

const Arrow = styled.img`
  height: 2.2rem;
  margin: 0;
`

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
        }
      }

      allMarkdownRemark {
        totalCount
        group(field: frontmatter___category) {
          category: fieldValue
          totalCount
        }
      }
    }
  `)
  console.log(data)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />
      <Wrapper>
        <Main>
          <Nav data={data.allMarkdownRemark.group} />
          <Article>{children}</Article>
          <TopBtn>
            <Arrow src={UpperArrow} />
            Top
          </TopBtn>
        </Main>
      </Wrapper>
      <StyledFooter>
        © {new Date().getFullYear()} &middot; Groot Inc. All rights reserved.
      </StyledFooter>
    </>
  )
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
