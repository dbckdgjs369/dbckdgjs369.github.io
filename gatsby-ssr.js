/**
 * Implement Gatsby's SSR (Server Side Rendering) APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/ssr-apis/
 */

const React = require("react")

// 화면 깜빡임(FOUC) 없이 초기 테마를 지정하는 인라인 스크립트
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var theme = stored
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

exports.onRenderBody = ({ setHtmlAttributes, setPreBodyComponents }) => {
  setHtmlAttributes({ lang: `ko` })
  setPreBodyComponents([
    React.createElement("script", {
      key: "theme-script",
      dangerouslySetInnerHTML: { __html: themeScript },
    }),
  ])
}
