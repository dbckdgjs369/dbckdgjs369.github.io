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

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  max-width: 54rem;
  padding: 2rem;
  margin: 3rem;
`
const Footer = styled.footer`
  margin: 0 auto;
  margin-top: 32px;
  font-size: 14px;
  bottom: 0;
  margin-top: 5rem;
`

const Main = styled.main`
  line-height: 2.4rem;
  justify-content: space-around;
  //여기에서 본문 markdown 스타일 수정
  font-size: 1.2rem;
  color: black;
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

const MainDiv = styled.div`
  display: flex;
  flex-direction: row;
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
      {/* <Header siteTitle={title ? title : `Title`} /> */}
      <Wrapper>
        {/* <MainDiv> */}
        <Main>
          <Nav data={data.allMarkdownRemark.group} />
          <content>{children}</content>
          <TopBtn>
            <Arrow src={UpperArrow} />
            Top
          </TopBtn>
        </Main>
        <Footer>
          © {new Date().getFullYear()} &middot; Groot Inc. All rights reserved.
        </Footer>
      </Wrapper>
    </>
  )
}

// export const query = graphql`
//   query LayoutQuery {
//     metadata: site {
//       siteMetadata {
//         title
//       }
//     }
//     categorydata: allMarkdownRemark {
//       totalCount
//       group(field: frontmatter___category) {
//         category: fieldValue
//         totalCount
//       }
//     }
//   }
// `

Layout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default Layout
