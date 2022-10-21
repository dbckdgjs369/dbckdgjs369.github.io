import React from "react"
import { graphql } from "gatsby"

const CategoryList = ({ data }) => {
  return (
    <div>
      {data.allMarkdownRemark.group.map(g => (
        <div>
          {g.category}({g.totalCount})
        </div>
      ))}
    </div>
  )
}

export const query = graphql`
  query {
    allMarkdownRemark {
      group(field: frontmatter___category) {
        category: fieldValue
        totalCount
      }
    }
  }
`

export default CategoryList
