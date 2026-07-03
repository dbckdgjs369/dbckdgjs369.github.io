---
layout: post
title: "'이 버튼 대체 어느 파일이야?' — 우클릭으로 컴포넌트 소스로 점프하는 도구를 만들었다"
category: [React]
project: react-code-locator
date: 2026-07-02
---

## 시작은 사소한 불편이었다

화면에 보이는 버튼 하나를 고치려고 그 버튼이 **어느 파일, 몇 번째 줄**에서
그려지는지 찾는 일. 별것 아닌 것 같지만, 코드베이스가 커질수록 이게 은근히
시간을 잡아먹는다. 컴포넌트 이름으로 검색해도 같은 이름이 여러 개고, 여러 번
감싸진(HOC로 래핑된) 컴포넌트는 정의 위치와 실제 렌더 위치가 다르다.

React DevTools가 이 문제를 어느 정도 풀어줬다. 예전엔 Fiber에
`_debugSource`가 있어서 "이 요소가 어디서 왔는지"를 알 수 있었으니까.
(애초에 개발 빌드 + `jsxDEV` 변환에서만 채워지던 개발용 정보였다.)
그런데 **React 19에서 `_debugSource`가 제거됐다.** 내가 기대던 방법이
사라진 것이다.

그래서 직접 만들기로 했다. 목표는 하나였다.

> 화면에서 요소를 **우클릭하면 그 소스 코드 위치로 바로 점프**한다.

만들고 보니 `react-code-locator`라는 이름으로 npm에 올릴 만큼 쓸모가
있었고, 만드는 과정에서 배운 게 훨씬 많았다. 그 이야기를 정리한다.

## 큰 그림: 빌드 타임 + 런타임 두 단계

핵심 아이디어는 두 단계로 나뉜다.

1. **빌드 타임** — 번들러 플러그인이 소스 코드를 훑으면서, 각 JSX 요소와
   컴포넌트 선언에 "이건 `파일:줄:칸`에서 왔다"는 **위치 메타데이터를 주입**한다.
2. **런타임** — 브라우저에서 요소를 클릭하면, React Fiber 트리를 거슬러
   올라가며 주입해둔 메타데이터를 찾아 소스 위치를 알아내고, 하이라이트하거나
   에디터를 연다.

`_debugSource`처럼 React 내부 구현에 기대지 않고 **내가 직접 메타데이터를
심기** 때문에, React 버전이 바뀌어도 동작한다. 이게 이 접근의 가장 큰 장점이다.

## 1단계 — 소스 위치를 코드에 심기

빌드 타임 변환의 원칙은 딱 하나였다.

> **원본 코드를 절대 재생성하지 않는다.**

AST를 파싱해서 다시 코드로 뽑아내면(코드 제너레이션), 원본의 포매팅이나
TypeScript/JSX 문법이 미묘하게 틀어질 위험이 있다. 그래서 파싱은 **위치를
찾는 용도로만** 쓰고, 실제 삽입은 원본 문자열을 그대로 둔 채 필요한 지점에
문자열만 끼워 넣는 방식으로 갔다.

```ts
import * as acorn from "acorn";
import acornJsx from "acorn-jsx";
import acornTs from "acorn-typescript";
import MagicString from "magic-string";

// .js/.jsx/.tsx: TypeScript 플러그인이 JSX 플러그인보다 먼저 와야 한다
const ParserTSX = acorn.Parser.extend(acornTs(), acornJsx());
// .ts 전용: JSX 플러그인 없음
const ParserTS = acorn.Parser.extend(acornTs());
```

찾은 위치마다 삽입할 텍스트를 모아뒀다가, 마지막에 `MagicString`으로 한 번에
꽂는다.

```ts
const s = new MagicString(code);
for (const { at, text } of insertions) {
  s.appendLeft(at, text);
}
return { code: s.toString(), map: s.generateMap({ hires: true }) };
```

무엇을 심느냐면:

- **JSX 요소**에는 소스 위치를 담은 prop을 붙인다. → `<div ... >`가
  "이 `div`는 `src/App.tsx:12:5`에서 왔다"를 들고 다니게 된다.
- **컴포넌트 선언**(함수/클래스/화살표 함수)에는 선언 직후에
  `Comp.__componentSourceLoc = "src/App.tsx:8:1"` 같은 할당문을 붙인다.

### 삽질 1: `<T,>` 제네릭 화살표 함수의 함정

`.tsx`에서 JSX와 TypeScript 제네릭은 문법이 충돌한다. 예를 들어
`const f = <T,>(x: T) => x` 의 `<T,>`를 JSX 파서가 JSX 태그로 오해한다.
이걸 무리하게 파싱하려다 파일 전체가 깨지느니, **`.ts` 파일은 아예 JSX
파서를 태우지 않도록** 파서를 분리했다. (`.ts`엔 JSX가 올 수 없으니 안전하다.)

### 삽질 2: HOC로 감싼 컴포넌트는 "조심스럽게" 심어야 한다

`export default memo(MyComp)`, `styled.div\`...\`` 처럼 함수 호출이나 태그드
템플릿으로 감싼 경우, 반환값이 컴포넌트가 **아닐 수도** 있다. 그래서 이런
"wrapped" 케이스는 타입 가드를 씌워서, 값이 객체/함수일 때만 프로퍼티를
할당하도록 했다.

```ts
// 원시값이면 조용히 건너뛴다 (throw 없음)
Name && (typeof Name === "object" || typeof Name === "function")
  && (Name.__componentSourceLoc = "src/App.tsx:8:1");
```

반대로 화살표/함수/클래스 표현식처럼 값이 확실한 "direct" 케이스는 가드 없이
바로 할당한다. 이런 세밀한 분기가 실제 프로젝트의 온갖 컴포넌트 패턴을 견디게
해줬다.

## 2단계 — 런타임에서 Fiber를 거슬러 올라가기

브라우저에서 요소를 클릭하면, 그 DOM에 붙은 React Fiber를 찾는다. React는
DOM 노드에 `__reactFiber$...` 같은 키로 Fiber를 매달아 둔다.

```ts
function getReactFiberKey(element: Element) {
  return Object.keys(element).find(
    (k) => k.startsWith("__reactFiber$") ||
           k.startsWith("__reactInternalInstance$"),
  );
}
```

여기서부터 Fiber의 `return`(부모)을 타고 위로 올라가며, 빌드 타임에 심어둔
소스 정보를 모은다. 재미있는 건 **"화면에서 보이는 위치"와 "실제 구현
위치"가 다를 수 있다**는 점이다. 그래서 두 가지 모드를 뒀다.

- **Screen 모드(`Alt+1`)** — 내 프로젝트에서 이 요소를 실제로 쓴 위치.
  디자인 고칠 때 원하는 그 위치.
- **Implementation 모드(`Alt+2`)** — 컴포넌트가 정의된 구현 위치.
  (라이브러리 컴포넌트 내부까지)

정보를 찾으면 DevTools 인스펙터처럼 파란 오버레이로 요소를 하이라이트하고,
파일명과 줄 번호를 라벨로 띄운다. 우클릭하면 컨텍스트 메뉴가 떠서 기본으로는
**경로 복사**를 할 수 있고, `openInEditor` 옵션(기본값 `false`)을 켜면
**에디터에서 열기** 항목이 추가된다.

"에디터에서 열기"는 개발 서버에 `/__open-in-editor` 엔드포인트를 하나 두고,
클릭 시 그 주소로 요청을 보내 로컬 에디터를 실행하는 방식이다.

```ts
const onOpen = () =>
  fetch(`/__open-in-editor?file=${encodeURIComponent(result.source)}`);
```

VS Code, Cursor, WebStorm, Vim 등 웬만한 에디터의 CLI 명령을 매핑해뒀다.

## 한 번 만들고 다섯 개 번들러 지원하기

처음엔 Vite만 생각했는데, Webpack(Next.js), Rollup, esbuild, Rspack까지
쓰고 싶어졌다. 이걸 각각 구현하면 지옥이다. 그래서 **[unplugin](https://github.com/unjs/unplugin)**
으로 통합했다. 변환 로직 하나만 잘 만들어두면 여러 번들러용 플러그인이
한 번에 나온다. 다만 Vite만큼은 플러그인 실행 순서 문제 때문에 unplugin
어댑터 대신 네이티브 Vite 플러그인으로 따로 구현했다.

```ts
export { vitePlugin, webpackPlugin, rollupPlugin, esbuildPlugin, rspackPlugin }
  from "./unplugin";
```

## 되돌아보며 — 만들면서 배운 것들

이 프로젝트에서 크게 세 번 갈아엎었다.

- **파서 교체 (oxc-parser → acorn):** 처음엔 빠른 oxc-parser를 썼는데,
  네이티브 바인딩 때문에 번들링·배포가 까다로웠다. `acorn` 계열(+ TS/JSX
  플러그인)로 바꾸니 **순수 JS로 완전히 번들 가능**해졌고, 설치가 훨씬
  가벼워졌다.
- **Babel 의존성 제거:** 초기엔 Babel에 기댔지만, 결국 "빌드 플러그인 하나"
  로 끝나게 만드는 게 목표였다. Babel도 React DevTools도 브라우저 확장도
  필요 없이, **플러그인 한 줄**이면 되도록 정리했다.
- **문자열 조작 최적화 (slice → MagicString):** 매 삽입마다
  `slice + 연결`을 하니 파일이 크고 삽입이 많을수록 O(n·m)로 느려졌다.
  MagicString으로 바꿔 삽입은 정렬된 위치에 기록만 해두는 사실상 상수
  비용이 됐고(최종 문자열 생성은 마지막 1회), 소스맵 생성까지 덤으로 얻었다.

가장 크게 남은 교훈은, **"React 내부 구현에 기대지 말고 내가 필요한 데이터를
직접 만들자"** 였다. `_debugSource`가 사라졌을 때 막막했지만, 오히려 버전에
독립적인 더 튼튼한 방법으로 이어졌다.

## 써보기

```bash
npm i -D react-code-locator
```

```ts
// vite.config.ts
import react from "@vitejs/plugin-react";
import { vitePlugin } from "react-code-locator";

export default defineConfig({
  plugins: [react(), vitePlugin()],
});
```

이제 개발 중에 `Shift`를 누른 채 요소에 마우스를 올리면 하이라이트되고,
우클릭하면 경로를 복사할 수 있다(`openInEditor` 옵션을 켜면 에디터로 바로
점프). 사소한 불편 하나가, 매일 쓰는 도구가 됐다.

- npm: [react-code-locator](https://www.npmjs.com/package/react-code-locator)
- GitHub: [web-element-code-locator](https://github.com/dbckdgjs369/web-element-code-locator)
