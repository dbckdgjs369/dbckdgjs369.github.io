import * as React from "react"
import styled from "@emotion/styled"

const ToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-subtle);
  color: var(--text);
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  transition: background var(--transition), border-color var(--transition),
    transform var(--transition);

  &:hover {
    border-color: var(--accent);
    transform: translateY(-1px);
  }
`

const ThemeToggle = () => {
  const [theme, setTheme] = React.useState("light")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const current =
      document.documentElement.getAttribute("data-theme") || "light"
    setTheme(current)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark"
    document.documentElement.setAttribute("data-theme", next)
    try {
      localStorage.setItem("theme", next)
    } catch (e) {}
    setTheme(next)
  }

  return (
    <ToggleButton
      onClick={toggle}
      aria-label="테마 전환"
      title={theme === "dark" ? "라이트 모드로" : "다크 모드로"}
    >
      {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌱"}
    </ToggleButton>
  )
}

export default ThemeToggle
