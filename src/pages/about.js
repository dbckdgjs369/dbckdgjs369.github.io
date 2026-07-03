import React from "react"
import styled from "@emotion/styled"
import Layout from "../components/layout"
import Seo from "../components/seo"

const Hero = styled.header`
  padding-bottom: 2rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--border);
`

const Emoji = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`

const Title = styled.h1`
  font-size: clamp(1.9rem, 4vw, 2.6rem);
  margin-bottom: 1rem;

  b {
    color: var(--accent);
  }
`

const Lead = styled.p`
  font-size: 1.15rem;
  color: var(--text-muted);
  line-height: 1.8;
`

const Section = styled.section`
  margin-bottom: 2.5rem;

  h2 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
  p {
    color: var(--text-muted);
    line-height: 1.85;
  }
`

const Links = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`

const LinkChip = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text);
  font-weight: 600;
  transition: all 0.25s ease;

  &:hover {
    color: var(--accent-strong);
    border-color: var(--accent);
    background: var(--accent-soft);
    transform: translateY(-1px);
  }
`

const AboutPage = () => (
  <Layout>
    <Seo title="About" />
    <Hero>
      <Emoji>🌱</Emoji>
      <Title>
        안녕하세요, <b>유창헌</b>입니다
      </Title>
      <Lead>
        일상에서 문제를 발견하고 해결하는 데서 즐거움을 느끼며, 이를 통해
        성장하는 개발자입니다. 생활 속 불편을 직접 만든 프로그램으로 풀어내고,
        그 과정에서 얻은 지식을 글로 남깁니다.
      </Lead>
    </Hero>

    <Section>
      <h2>이 블로그는요 🌳</h2>
      <p>
        생활 속에서 느낀 불편을 직접 만든 프로그램으로 해결한 이야기와, 그
        과정에서 마주친 문제를 파고들며 배운 것(알고리즘·자바스크립트·웹·React
        등)을 담습니다. 누군가에게 작은 그늘이 되길 바라며 씁니다.
      </p>
    </Section>

    <Section>
      <h2>관심사</h2>
      <p>
        JavaScript · TypeScript · React · 웹 표준과 브라우저 동작 원리 ·
        자료구조와 알고리즘 · 사용자 경험
      </p>
    </Section>

    <Section>
      <h2>연락처</h2>
      <Links>
        <LinkChip href="https://github.com/dbckdgjs369">🐙 GitHub</LinkChip>
        <LinkChip href="mailto:dbckdgjs1130@gmail.com">✉️ Email</LinkChip>
      </Links>
    </Section>
  </Layout>
)

export const Head = () => <Seo title="About" />

export default AboutPage
