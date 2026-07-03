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
        allMarkdownRemark(
          filter: { frontmatter: { published: { ne: false } } }
        ) {
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
