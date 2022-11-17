import React from "react"
import styled from "@emotion/styled"
import { graphql, Link } from "gatsby"
import { usePostData } from "../hooks/use-post-data"

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 3rem;
  gap: 2rem;
`

const PageNumber = styled(Link)``
const CurrentPageNumber = styled(Link)`
  color: black;
  font-size: 1.5rem;
  color: black !important;
  text-decoration: none;
`

const Pagination = ({ currentPage = 1 }) => {
  const data = usePostData()
  console.log(currentPage)
  console.log(data)
  return (
    <Wrapper>
      {Array.from(
        Array(Math.ceil(data.allMarkdownRemark.totalCount / 10)),
        (_, i) =>
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
