const path = require(`path`)
const { createFilePath } = require(`gatsby-source-filesystem`)
const projects = require(`./src/data/projects`)

// `project` 는 아직 어떤 글에도 없을 수 있는 선택 필드라, 명시적으로 스키마에 등록해
// 쿼리 시 "Cannot query field project" 로 빌드가 깨지지 않게 한다. @infer 로 나머지 필드는 유지.
exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type MarkdownRemarkFrontmatter @infer {
      project: String
    }
    type MarkdownRemark implements Node @infer {
      frontmatter: MarkdownRemarkFrontmatter
    }
  `)
}

exports.onCreateNode = ({ node, getNode, actions }) => {
  const { createNodeField } = actions
  if (node.internal.type === `MarkdownRemark`) {
    const slug = createFilePath({ node, getNode, basePath: `pages` })
    createNodeField({
      node,
      name: `slug`,
      value: slug,
    })

    // 날짜: frontmatter.date가 있으면 우선, 없으면 파일명(YYYY-MM-DD-...)에서 추출
    let date = node.frontmatter && node.frontmatter.date
    if (!date) {
      const parent = getNode(node.parent)
      const match = parent && /(\d{4}-\d{2}-\d{2})/.exec(parent.name || "")
      if (match) date = match[1]
    }
    createNodeField({
      node,
      name: `date`,
      value: date ? new Date(date).toISOString() : null,
    })
  }
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const categoriesTemplate = path.resolve("src/templates/category.js")
  const result = await graphql(`
    query {
      allMarkdownRemark(
        filter: { frontmatter: { published: { ne: false } } }
      ) {
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

  // 프로젝트별 "관련 글 모음" 페이지 (/projects/<slug>)
  const projectDetailTemplate = path.resolve("src/templates/project-detail.js")
  projects.forEach(project => {
    createPage({
      path: `/projects/${project.slug}`,
      component: projectDetailTemplate,
      context: {
        slug: project.slug,
      },
    })
  })

  const posts = result.data.allMarkdownRemark.edges
  const postsPerPage = 10
  // 공개 글이 없어도 /page=1 은 항상 생성 (Posts 링크가 살아있도록)
  const numPages = Math.max(1, Math.ceil(posts.length / postsPerPage))
  Array.from({ length: numPages }).forEach((_, i) => {
    createPage({
      path: i === 0 ? `/page=${i + 1}` : `/page=${i + 1}`,
      component: path.resolve("./src/templates/blog-list-template.js"),
      context: {
        limit: postsPerPage,
        skip: i * postsPerPage,
        numPages,
        currentPage: i + 1,
      },
    })
  })
}
