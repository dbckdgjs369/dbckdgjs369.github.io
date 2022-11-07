const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const categoriesTemplate = path.resolve("src/templates/category.js")
  const result = await graphql(`
    query {
      allMarkdownRemark {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              category
            }
          }
        }
        group(field: frontmatter___category) {
          fieldValue
          totalCount
        }
      }
    }
  `)

  result.data.allMarkdownRemark.group.forEach(category => {
    createPage({
      // 생성할 페이지들의 slug는 카테고리 이름을 kebab base로 변환한 것이다.
      path: `/category/${category.fieldValue}/`,
      // 페이지를 생성하기 위해서 사용하는 template component
      component: categoriesTemplate,
      // 페이지에 전달하고 싶은 값이 있으면 context에 추가한다. 여기서는 카테고리 이름을 넣었다.
      context: {
        category: category.fieldValue,
      },
    })
  })
  result.data.allMarkdownRemark.edges.forEach(({ node }) => {
    createPage({
      path: node.fields.slug,
      component: path.resolve(`./src/templates/blog-post.js`),
      context: {
        // Data passed to context is available
        // in page queries as GraphQL variables.
        slug: node.fields.slug,
      },
    })
  })
}
