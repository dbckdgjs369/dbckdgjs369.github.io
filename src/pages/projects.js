import React from "react"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"
import ProjectCard, { ProjectGrid } from "../components/project-card"
import projects from "../data/projects"

const PageHeader = styled.header`
  margin-bottom: 2.5rem;
`

const Title = styled.h1`
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  margin-bottom: 1rem;

  b {
    color: var(--accent);
  }
`

const Lead = styled.p`
  font-size: 1.1rem;
  color: var(--text-muted);
  line-height: 1.8;
  max-width: 40rem;
`

const ProjectsPage = () => (
  <Layout wide>
    <Seo title="Projects" />
    <PageHeader>
      <Title>
        🛠️ 만든 <b>것들</b>
      </Title>
      <Lead>
        일상에서 느낀 불편을 직접 코드로 풀어낸 프로젝트들입니다. 실제로 쓰려고
        만들었고, 지금도 쓰고 있어요.
      </Lead>
    </PageHeader>
    <ProjectGrid>
      {projects.map(p => (
        <ProjectCard key={p.name} project={p} />
      ))}
    </ProjectGrid>
  </Layout>
)

export const Head = () => <Seo title="Projects" />

export default ProjectsPage
