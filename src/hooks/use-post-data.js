import { useStaticQuery, graphql } from "gatsby"

export const usePostData = () => {
  const data = useStaticQuery(
    graphql`
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
    `
  )
  return data
}
