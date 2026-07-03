---
layout: post
title: "AI가 '이 버튼 고쳐줘'를 알아듣게 하기 — 코드 로케이터를 MCP로 열다"
category: [Web]
project: react-code-locator
date: 2026-07-02
---

[react-code-locator](/category/React/2026-07-02-react-code-locator/) 시리즈의
마지막 글. 지금까지는 *사람이* 화면에서 우클릭해 소스로 점프하는 이야기였다.
그런데 요즘은 코드를 고치는 주체가 사람만이 아니다. **AI 에이전트**도 고친다.
그렇다면 AI에게도 "이 화면 요소 → 이 소스 파일"을 알려줄 수 있지 않을까?
이 질문에서 MCP 확장이 시작됐다.

## AI가 못 푸는 문제

AI 에이전트는 브라우저에서 요소를 **찾는** 건 꽤 잘한다.

- 텍스트로, CSS 셀렉터로, 역할(role)로, 접근성 트리로, 화면 좌표로…

그런데 여기서 막힌다.

- "이 버튼"이 **어느 파일**에 있지?
- 고쳐야 할 곳이 **내가 쓴 자리(화면)**야, 아니면 **공유 컴포넌트 정의**야?
- `styled()`, `memo`, `forwardRef`, 디자인 시스템 래퍼에 안 빠지고 진짜
  편집 지점을 어떻게 찾지?

즉 AI에게 부족한 건 "요소 찾기"가 아니라 **"요소 → 올바른 소스 위치 매핑"**
이다. 이건 정확히 react-code-locator가 하는 일이다. 이 도구는 요소를 찾는
엔진이 아니라 **코드 매핑 엔진**에 가깝다.

## MCP가 뭔가, 그리고 왜 여기에 맞나

**MCP(Model Context Protocol)** 는 AI 에이전트가 외부 도구를 **구조화된
방식으로 호출**하게 해주는 표준이다. 서버가 "이런 도구가 있고, 입력은 이런
모양이야"를 선언하면, AI가 그 도구를 필요할 때 호출한다.

MCP는 로케이터를 **대체하지 않는다.** 로케이터를 AI가 쓸 수 있는 **도구로
노출**할 뿐이다. 흐름은 이렇다.

1. 사용자가 AI에게 "체크아웃 페이지의 제출 버튼 고쳐줘"라고 한다
2. AI가 대상 요소를 식별한다
3. MCP 도구를 호출해 그 요소의 소스 위치를 얻는다
4. AI가 그 파일을 열어 편집한다

## 두 가지 접근: 런타임 vs 정적 인덱스

로케이터를 AI에 태우는 길은 두 가지였다.

**A. 런타임(브라우저 + Fiber)** — 앞선 글들에서 만든 그 방식.
Playwright로 페이지를 띄우고, 실제 렌더된 Fiber에서 소스를 뽑는다.
i18n 텍스트나 조건부 렌더처럼 **실행돼야만 알 수 있는 것**에 강하다.
대신 개발 서버·브라우저가 필요하다.

**B. 정적 AST 인덱스** — 새로 만든 `react-code-locator-mcp`.
브라우저도 개발 서버도 없이, 프로젝트의 JSX를 **빌드 없이 AST로 인덱싱**해
질의한다. 밀리초 단위로 빠르고, 구조적 질의에 강하다.

이번 MCP 프로토타입은 **B**로 갔다. AI 워크플로엔 "브라우저 안 띄우고 바로
답이 나오는" 정적 인덱스가 훨씬 잘 맞았기 때문이다.

## "grep으로 하면 되지 않나?"

가장 먼저 나온 반문이다. 하지만 grep은 텍스트 기반이라 한계가 뚜렷하다.

- 같은 텍스트가 여러 컴포넌트에 있으면 **구분을 못 한다**
- "`onSubmit`을 가진 `<button>`" 같은 **구조적 조건**을 못 건다
- `styled(Button)` 래퍼를 못 풀어낸다

인덱스는 AST에서 뽑은 구조라 이런 걸 **한 방의 구조적 질의**로 답한다.
그것도 grep급 속도로. (300파일·9천 요소 코퍼스 실측: 콜드 첫 질의 ~25ms,
워엄 캐시 ~1.3ms. 텍스트가 모든 파일에 있는 모호한 질의에서 grep은 300개
히트, 인덱스는 **정확히 1건**.)

비결은 "AST 파싱이 비싸다"는 통념을 우회한 것이다. **먼저 값싼 리터럴 스캔
(ripgrep)으로 후보 파일만 추리고, 그 생존자들만 AST 파싱**한다. 그래서 첫
질의도 grep과 비슷하고, 같은 세션 재질의는 캐시로 ~15배 빨라진다.

## MCP 서버는 이렇게 생겼다

MCP SDK로 도구 하나를 선언하는 건 놀랄 만큼 단순하다. `zod`로 입력 스키마를
정의하면 AI가 그 모양대로 호출한다.

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const index = new ProjectIndex(process.argv[2] ?? process.cwd());
const server = new McpServer({ name: "react-code-locator-mcp", version: "0.0.1" });

server.tool(
  "find_element",
  "JSX 요소를 개념으로 찾아 정확한 소스 위치(file:line:col)를 돌려준다.",
  {
    text: z.string().optional(),      // 요소 안의 리터럴 텍스트
    testid: z.string().optional(),    // data-testid
    tag: z.string().optional(),       // "button" | "Card"
    component: z.string().optional(), // 감싸는 컴포넌트 이름
    hasProp: z.string().optional(),   // 이 prop을 가진 것만
    dir: z.string().optional(),
    limit: z.number().optional(),
  },
  async (args) => {
    const results = index.find(args);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  },
);
```

이 밖에 인덱스가 몇 개의 파일을 커버하는지 알려주는 `index_stats` 도구도
같이 노출해 뒀다. AI가 "인덱스가 제대로 잡혔나"부터 확인할 수 있게.

돌려주는 결과엔 `file:line:col`뿐 아니라 **감싸는 컴포넌트 이름과 조상 태그
체인**까지 담는다. AI가 "이게 맞는 위치인지" 판단할 문맥을 함께 주는 것이다.

```json
{ "source": "src/CheckoutPage.tsx:42:7", "tag": "button",
  "component": "CheckoutPage", "text": "결제하기",
  "ancestors": ["form", "div", "CheckoutPage"] }
```

Claude Code 같은 클라이언트엔 이렇게 등록한다.

```json
{
  "mcpServers": {
    "react-locator": {
      "command": "node",
      "args": ["/abs/path/react-code-locator-mcp/dist/server.js",
               "/abs/path/your-react-app"]
    }
  }
}
```

이제 *"체크아웃 페이지에서 결제 버튼 찾아줘"* 라고 하면 AI가 `find_element`를
호출해 정확한 `file:line:col`을 받아 온다.

## 더 깊은 통찰: 가장 보편적인 지점은 어디인가

MCP를 붙이며 아키텍처를 다시 생각하게 됐다. "React 프로젝트 최대한 많이
지원하기"의 진짜 공통 지점은 Babel도, 특정 번들러도 아니었다. 바로
**React element 팩토리 호출**이다.

어떤 도구로 JSX를 변환하든, 결국 코드는

```js
jsx("div", { children: "Hello" })   // 또는 jsxs / jsxDEV / React.createElement
```

로 수렴한다. 그래서 장기적으로 이상적인 구조는 이렇다.

1. **공통 런타임 코어** — element 래핑·메타데이터 저장·런타임 조회
2. **얇은 변환 어댑터** — Babel/SWC/esbuild/Vite/Webpack별로 **소스 위치만**
   뽑아 코어에 넘김

단, 팩토리 래핑만으로는 부족하다. 개발 모드의 `jsxDEV`는 지금도 `source`
인자로 파일·줄·칸을 받지만, **프로덕션 빌드나 일반 `jsx` 런타임에서는 보통
그 정보가 없다.** 확실하게 위치를 아는 건 AST 노드를 들고 있는 **변환
단계**뿐이다.
그래서 "변환 어댑터(위치 주입) + 공통 런타임(조회) + MCP(AI 인터페이스)"의
3층 구조가 가장 현실적이라는 결론에 닿았다.

## MCP가 풀지 못하는 것

솔직한 한계도 적어둔다. MCP는 **"이 버튼이 뭔지"를 대신 정해주지 않는다.**
AI는 여전히 셀렉터·좌표·이전에 선택한 요소 같은 방법으로 대상을 먼저
식별해야 한다. 그러니 이 로케이터 MCP는 **요소 식별 이후**에 가장 쓸모가
있다 — 식별된 요소를 "올바른 편집 지점"으로 데려다주는 마지막 한 걸음.

## 시리즈를 마치며

사소한 불편("이 버튼 어느 파일이야?") 하나에서 시작해, AST 파싱 →
React Fiber → 유니버설 번들러 플러그인 → AI 에이전트용 MCP까지 왔다.
문제 하나를 끝까지 파면, 그 과정에서 만나는 곁가지들이 전부 각자의 배움이
된다는 걸 다시 느꼈다. 그게 내가 계속 뭔가를 만드는 이유다.

- 런타임 도구: [react-code-locator](https://www.npmjs.com/package/react-code-locator)
- MCP 인덱스: [react-code-locator-mcp](https://github.com/dbckdgjs369)
- 시리즈: [만든 이야기](/category/React/2026-07-02-react-code-locator/) ·
  [AST 파싱](/category/JavaScript/2026-07-02-how-ast-parsing-works/) ·
  [React Fiber](/category/React/2026-07-02-react-fiber-dom-to-component/) ·
  [unplugin](/category/Web/2026-07-02-unplugin-universal-bundler/)
