---
layout: post
title: "한 번 짜서 번들러 5개 지원하기 — unplugin으로 만든 유니버설 플러그인"
category: [Web]
project: react-code-locator
date: 2026-07-02
---

[react-code-locator](/category/React/2026-07-02-react-code-locator/)를
만들 때 현실적인 고민이 하나 있었다. 요즘 React 프로젝트의 번들러는
제각각이다. Vite, Next.js(Webpack), Rollup, esbuild, Rspack…. 소스에 위치
메타데이터를 심으려면 **번들러의 빌드 파이프라인에 끼어들어야** 하는데,
번들러마다 플러그인 API가 다르다.

이걸 다섯 벌로 각각 구현하면? 지옥이다. 그래서 **[unplugin](https://github.com/unjs/unplugin)**
을 썼다. 이 글은 "변환 로직 하나로 번들러 다섯 개를 커버한" 이야기와,
그 과정에서 만난 함정들을 정리한다.

## 번들러 플러그인의 공통점

이름과 형태는 달라도, 모든 번들러 플러그인이 공통으로 제공하는 훅이 있다.

> **"파일 하나의 소스 코드를 받아, 변환해서 돌려준다"** (`transform`)

Vite/Rollup은 `transform(code, id)`, Webpack/Rspack은 loader, esbuild는
`onLoad`… 이름만 다를 뿐 본질은 같다. unplugin은 이 공통점을 하나의 통일된
훅으로 추상화하고, 각 번들러용 어댑터를 자동으로 만들어 준다.

## 핵심: transform 코어는 딱 하나

내가 짠 건 "소스 코드를 받아 위치 메타데이터를 삽입해 돌려주는"
`transformSource` 함수 하나뿐이다. unplugin으로 감싸면 끝이다.

```ts
import { createUnplugin } from "unplugin";
import { transformSource } from "./core/transform";

const _unplugin = createUnplugin((options = {}) => ({
  name: "react-code-locator",
  enforce: "pre",

  // 어떤 파일을 변환할지 필터 (.js/.jsx/.tsx, node_modules 제외)
  transformInclude(id) {
    return shouldTransform(id, include, exclude);
  },

  // 실제 변환: 번들러가 뭐든 이 함수 하나로 처리된다
  transform(code, id) {
    const isEnabled = enabled ?? process.env.NODE_ENV === "development";
    if (!isEnabled) return null;
    return transformSource(code, { filename: id, projectRoot });
  },
}));
```

그리고 각 번들러용 플러그인은 unplugin이 만들어 준 걸 그대로 내보내면 된다.

```ts
export const webpackPlugin = _unplugin.webpack;
export const rollupPlugin  = _unplugin.rollup;
export const esbuildPlugin = _unplugin.esbuild;
export const rspackPlugin  = _unplugin.rspack;
```

`transformInclude`로 대상 파일을 먼저 거르는 것도 포인트다. 변환 대상이
아니면 아예 `transform`을 부르지 않아서, `node_modules`나 `.css` 같은 파일에
쓸데없는 파싱 비용을 안 쓴다.

## 함정 1: Vite만 어댑터를 안 쓰고 직접 짰다

여기서 첫 번째 벽. **Vite만큼은 unplugin 어댑터 대신 네이티브 Vite 플러그인으로
따로 구현**했다. 이유는 실행 순서 때문이다.

내 플러그인은 가능하면 `@vitejs/plugin-react`보다 **먼저** 돌아야 한다.
플러그인 리액트가 코드를 건드리기 전에 원본 기준으로 위치를 심어야 하니까.
그래서 `enforce: "pre"`로 앞 순서를 **요청**하는데, 이게 순서를 완전히
보장해 주지는 않는다. `@vitejs/plugin-react`도 같은 `pre` 그룹이라, 상황에
따라 그쪽이 먼저 돌 수 있다. unplugin 어댑터를 거치면 이런 순서 제어가 더
애매해져서, Vite는 순서와 우회 로직을 직접 쥘 수 있는 네이티브 플러그인으로
따로 짰다.

```ts
export function vitePlugin(options): Plugin[] {
  const transformPlugin: Plugin = {
    name: "react-code-locator",
    enforce: "pre",              // react()보다 앞 순서를 요청 (보장은 아님)
    configResolved(config) {
      resolvedEnabled = enabled ?? config.command === "serve";
    },
    transform(code, id) { /* ... transformSource ... */ },
  };
  return [transformPlugin, ...clientInjector];
}
```

그런데 순서를 요청해 두더라도 `@vitejs/plugin-react`가 먼저 돌아 파일 앞에
fast-refresh preamble을 붙이는 경우가 실제로 생긴다. 그러면 모든 줄 번호가
밀린다. 그래서 네이티브 플러그인에서는 받은 코드가 디스크의 원본과 다르면
**원본 파일을 직접 읽어** preamble을 떼어내고 변환한 뒤 다시 붙이는 우회를
넣었다. 이 줄 번호 버그의 자세한 이야기는 워낙 길어서 따로 다룬다.

## 함정 2: Webpack/Rspack loader와 ESM/CJS

unplugin의 Webpack·Rspack 어댑터는 내부적으로 **loader 파일**을 따로 참조한다.
이 loader들이 배포 패키지 안에 제대로 들어가고, CommonJS로도 로드되게 하려면
빌드 후처리가 필요했다.

- 빌드 시 unplugin의 loader들을 `dist`로 복사하고,
- `.js`를 `.cjs`로도 복사한 뒤,
- 번들 안의 loader 경로 문자열을 `.cjs`로 치환하는 패치 스크립트를 돌린다.

```js
// scripts/patch-loaders.cjs — 번들 안 loader 경로를 .cjs로 교체
const patterns = [
  ["webpack/loaders/transform", "webpack/loaders/transform.cjs"],
  ["rspack/loaders/transform", "rspack/loaders/transform.cjs"],
  // ...
];
for (const [from, to] of patterns) {
  content = content.replaceAll(JSON.stringify(from), JSON.stringify(to));
}
```

`package.json`의 `exports` 맵으로 `import`/`require`/`browser`/`types`
진입점을 나눠주는 것까지 해야 "어떤 번들러에서 어떻게 불러도 깨지지 않는"
패키지가 됐다.

```json
"exports": {
  ".": {
    "browser": "./dist/runtime.js",
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  }
}
```

## 배운 것

- 번들러마다 API는 달라도 **"파일을 받아 변환한다"는 공통점**이 있고,
  unplugin은 그 공통점을 추상화해 준다. 핵심 로직 하나만 잘 만들면 된다.
- 다만 추상화가 **모든 걸 감춰주진 않는다.** 실행 순서(`enforce`)나
  loader 경로, ESM/CJS 같은 번들러별 현실은 결국 마주해야 했다.
- 추상화는 90%를 없애주고, 나머지 10%(까다로운 것)를 남긴다. 그 10%를
  이해하는 게 라이브러리 저자의 몫이라는 걸 배웠다.

- 실제 구현: [react-code-locator](https://www.npmjs.com/package/react-code-locator)
  ([GitHub](https://github.com/dbckdgjs369/web-element-code-locator))
- 관련 글: [코드는 어떻게 트리가 되는가 — AST와 파싱](/category/JavaScript/2026-07-02-how-ast-parsing-works/)
