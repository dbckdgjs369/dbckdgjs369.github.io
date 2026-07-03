import * as React from "react"
import { Link } from "gatsby"
import styled from "@emotion/styled"

export const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  width: 100%;
`

const Card = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: transform var(--transition), box-shadow var(--transition),
    border-color var(--transition);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-hover);
    border-color: var(--accent);
  }
`

// 카드 전체를 관련 글 모음 페이지로 이동하게 하는 오버레이 (stretched-link 패턴)
const CardOverlay = styled(Link)`
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
`

const Banner = styled.div`
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.6rem;
  background: linear-gradient(
    135deg,
    hsl(${p => p.hue} 55% 92%) 0%,
    hsl(${p => p.hue + 30} 60% 84%) 100%
  );

  :root[data-theme="dark"] & {
    background: linear-gradient(
      135deg,
      hsl(${p => p.hue} 30% 16%) 0%,
      hsl(${p => p.hue + 30} 32% 22%) 100%
    );
  }
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  flex: 1;
`

const Name = styled.h3`
  font-size: 1.15rem;
  margin: 0;
`

const Tagline = styled.p`
  font-size: 0.92rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin: 0;
`

const TechRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const Tech = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-faint);
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
`

const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
  position: relative;
  z-index: 2;
`

const LinkBtn = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: 1px solid ${p => (p.primary ? "var(--accent)" : "var(--border)")};
  background: ${p => (p.primary ? "var(--accent)" : "var(--bg-subtle)")};
  color: ${p => (p.primary ? "#fff" : "var(--text-muted)")};
  transition: all var(--transition);

  &:hover {
    color: ${p => (p.primary ? "#fff" : "var(--accent-strong)")};
    background: ${p => (p.primary ? "var(--accent-strong)" : "var(--accent-soft)")};
    border-color: var(--accent);
  }
`

const LINK_META = {
  live: { label: "라이브", icon: "🔗", primary: true },
  chrome: { label: "크롬 스토어", icon: "🧩", primary: true },
  npm: { label: "npm", icon: "📦", primary: true },
  github: { label: "GitHub", icon: "🐙", primary: false },
}

const ProjectCard = ({ project }) => {
  const { name, slug, emoji, hue, tagline, tech = [], links = {} } = project
  const order = ["live", "chrome", "npm", "github"]

  return (
    <Card>
      {slug ? (
        <CardOverlay to={`/projects/${slug}`} aria-label={`${name} 관련 글 보기`} />
      ) : null}
      <Banner hue={hue}>{emoji}</Banner>
      <Body>
        <Name>{name}</Name>
        <Tagline>{tagline}</Tagline>
        {tech.length > 0 ? (
          <TechRow>
            {tech.map(t => (
              <Tech key={t}>{t}</Tech>
            ))}
          </TechRow>
        ) : null}
        <LinkRow>
          {order
            .filter(k => links[k])
            .map(k => {
              const m = LINK_META[k]
              return (
                <LinkBtn
                  key={k}
                  href={links[k]}
                  target="_blank"
                  rel="noopener noreferrer"
                  primary={m.primary ? 1 : undefined}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </LinkBtn>
              )
            })}
        </LinkRow>
      </Body>
    </Card>
  )
}

export default ProjectCard
