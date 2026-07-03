// 프로젝트 쇼케이스 데이터.
// 새 프로젝트는 이 배열에 추가하면 홈/프로젝트 페이지에 자동 반영됩니다.
// - slug: 카드 클릭 시 이동할 글 모음 페이지 경로 (/projects/<slug>).
//   글을 쓸 때 frontmatter에 `project: <slug>` 를 넣으면 이 페이지에 모입니다.
// - links: 있는 것만 넣으면 됩니다 (live | chrome | npm | github)
// gatsby-node.js 에서도 require 하므로 CommonJS(module.exports) 로 둡니다.

const projects = [
  {
    name: "React Code Locator",
    slug: "react-code-locator",
    emoji: "🔎",
    hue: 200,
    tagline:
      "브라우저에서 컴포넌트를 클릭하면 소스 코드 위치로 바로 이동. 개발 중 '이 UI가 대체 어느 파일이지?'를 없앤 빌드 플러그인.",
    tech: ["TypeScript", "Vite", "Webpack", "Rollup"],
    links: {
      npm: "https://www.npmjs.com/package/react-code-locator",
      github: "https://github.com/dbckdgjs369/web-element-code-locator",
    },
  },
  {
    name: "YouTube Playlist Generator",
    slug: "youtube-playlist-generator",
    emoji: "🎵",
    hue: 0,
    tagline:
      "영상 댓글의 타임라인을 붙여넣으면, 원하는 곡만 골라 내 유튜브 재생목록으로 자동 생성. 일일이 검색·추가하던 수고를 없앴어요.",
    tech: ["TypeScript", "React", "YouTube API"],
    links: {
      live: "https://youtube-playlist-generator.vercel.app",
      github: "https://github.com/dbckdgjs369/Youtube_Playlist_Generator",
    },
  },
  {
    name: "Stock Price Widget",
    slug: "stock-price-widget",
    emoji: "📈",
    hue: 145,
    tagline:
      "탭 전환 없이 어떤 웹페이지 위에든 실시간 주식·코인 시세를 띄우는 크롬 확장. 클릭은 아래 페이지로 그대로 통과.",
    tech: ["JavaScript", "Chrome Extension"],
    links: {
      chrome:
        "https://chromewebstore.google.com/detail/stock-price-widget/niofpnhhdeaneajeemfpnclammllkhfg",
      github: "https://github.com/dbckdgjs369/stock-price-extension-support",
    },
  },
  {
    name: "Custom Tunnel",
    slug: "custom-tunnel",
    emoji: "🚇",
    hue: 265,
    tagline:
      "로컬 개발 서버를 공개 URL로 즉시 공유하는 VSCode 확장. QR 코드·원격 콘솔 로그·HTTPS까지 지원해, 모바일 확인과 협업 공유의 번거로움을 없앴어요.",
    tech: ["JavaScript", "VSCode Extension"],
    links: {
      github: "https://github.com/dbckdgjs369/debug_tool",
    },
  },
]

module.exports = projects
