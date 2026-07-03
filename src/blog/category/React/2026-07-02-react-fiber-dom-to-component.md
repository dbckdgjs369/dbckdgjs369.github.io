---
layout: post
title: "React Fiber 파헤치기 — DOM 요소에서 컴포넌트 트리로 거슬러 올라가기"
category: [React]
project: react-code-locator
date: 2026-07-02
---

[우클릭으로 컴포넌트 소스로 점프하는 도구](/category/React/2026-07-02-react-code-locator/)를
만들 때, 런타임의 핵심 질문은 이거였다.

> 사용자가 클릭한 이 **DOM 요소**가, 대체 어느 **React 컴포넌트**에서 나온 걸까?

브라우저에 실제로 존재하는 건 `<div>`, `<button>` 같은 DOM 노드뿐이다.
React 컴포넌트는 렌더링이 끝나면 사라진 것처럼 보인다. 하지만 React는
그 연결고리를 DOM에 몰래 매달아 둔다. 그게 **Fiber**다. 이 글은 Fiber를
파고들어 "DOM → 컴포넌트"를 되짚는 방법을 정리한다.

## Fiber가 뭔가 (아주 짧게)

React 16부터 내부 렌더링 단위는 **Fiber**라는 객체다. 컴포넌트 하나, JSX
요소 하나가 각각 Fiber 노드가 되고, 이들이 트리를 이룬다. 우리가 트리를
거슬러 올라갈 때 쓸 필드는 이 정도다.

- `return` — **부모** Fiber (트리를 위로 올라갈 때 쓴다)
- `type` / `elementType` — 이 Fiber가 무엇인가. 호스트 요소면 `"div"` 같은
  문자열, 컴포넌트면 그 **함수/클래스 자체**
- `pendingProps` / `memoizedProps` — 이 요소의 props
- `_debugSource` — (React 18까지) 원본 소스 위치. **React 19에서 제거됨**

## 1. DOM 요소에서 Fiber 꺼내기

React는 DOM 노드에 `__reactFiber$…`(또는 옛 버전은
`__reactInternalInstance$…`)라는 **랜덤 접미사가 붙은 키**로 Fiber를 매달아
둔다. 접미사가 매번 바뀌니, 키 이름을 직접 하드코딩할 수 없고 찾아야 한다.

```ts
const fiberKeyCache = new WeakMap<Element, string | undefined>();

function getReactFiberKey(element: Element) {
  if (fiberKeyCache.has(element)) return fiberKeyCache.get(element);
  const key = Object.keys(element).find(
    (k) => k.startsWith("__reactFiber$") ||
           k.startsWith("__reactInternalInstance$"),
  );
  fiberKeyCache.set(element, key); // 접미사는 세션 내 고정 → 캐시
  return key;
}
```

`Object.keys(element)`로 키를 뒤지는 건 공짜가 아니라서 `WeakMap`에 캐시했다.
`WeakMap`이라 요소가 사라지면 캐시도 자동으로 정리된다.

클릭한 요소에 Fiber가 없을 수도 있다(텍스트 노드나 순수 DOM). 그럴 땐 부모로
한 칸씩 올라가며 Fiber를 가진 가장 가까운 요소를 찾는다.

```ts
function getClosestReactFiber(target: Element | null) {
  let current = target;
  while (current) {
    const fiberKey = getReactFiberKey(current);
    if (fiberKey) {
      return (current as any)[fiberKey] as ReactFiber;
    }
    current = current.parentElement;
  }
  return null;
}
```

## 2. Fiber 트리를 거슬러 올라가며 소스 찾기

Fiber 하나를 잡았으면, 이제 `return`(부모)을 따라 **위로** 올라가면서
빌드 타임에 심어둔 소스 정보를 모은다. 정보는 두 군데에 있다.

- **컴포넌트 쪽**: `fiber.type`/`elementType`(= 컴포넌트 함수)에 붙여둔
  `__componentSourceLoc`
- **JSX 요소 쪽**: `props` 안에 넣어둔 `$componentSourceLoc`

```ts
function getSourceFromType(type: unknown) {
  if (typeof type === "function") {
    // 컴포넌트 함수에 붙여둔 소스 위치
    const source = (type as any).__componentSourceLoc;
    return typeof source === "string" ? source : null;
  }
  // memo/forwardRef 로 감싸지면 type이 객체라, 한 겹 더 들어가 본다
  if (type && typeof type === "object") {
    const t = type as any;
    return t.__componentSourceLoc
        ?? t.type?.__componentSourceLoc      // memo(...)
        ?? t.render?.__componentSourceLoc    // forwardRef(...)
        ?? null;
  }
  return null;
}
```

여기서 재미있는 지점: **`memo(Comp)`나 `forwardRef(Comp)`는 `type`이 함수가
아니라 객체**다. `memo`는 `.type`에, `forwardRef`는 `.render`에 실제 컴포넌트가
들어 있다. 그래서 한 겹씩 더 들여다봐야 소스를 놓치지 않는다. 이런 래핑
케이스를 처리하는 게 실전에서 제일 손이 많이 갔다.

## 3. "화면 위치"와 "구현 위치"는 다르다

트리를 올라가다 보면 소스 후보가 **여러 개** 나온다. 예를 들어 디자인
시스템의 `<Button>`을 클릭하면:

- 내가 `<Button>`을 **쓴 자리** (예: `CheckoutPage.tsx:42`) — 화면(screen)
- `Button`이 **정의된 자리** (예: `node_modules/ui/Button.tsx`) — 구현(implementation)

디자인을 고치려는 사람은 보통 **내가 쓴 자리**를 원한다. 그래서 후보들을
모은 뒤, "프로젝트 로컬(내 코드)인지"를 기준으로 화면용/구현용을 나눴다.

```ts
// 내 프로젝트 안의 소스인가? (node_modules·상위 경로면 제외)
const isLocal = (source) => isProjectLocalSource(source, projectRoot);

// screen: 가장 가까운 프로젝트 로컬 위치
// implementation: 프로젝트 외부(공유 컴포넌트) 위치
```

`Alt+1`(screen) / `Alt+2`(implementation)로 모드를 토글하게 만든 이유가
이거다. 같은 픽셀을 클릭해도 "정답 소스"가 하나가 아니기 때문이다.

## `_debugSource`에 기대지 않기로 한 이유

예전엔 이 모든 걸 `fiber._debugSource` 하나로 대충 해결할 수 있었다. React가
개발 모드에서 원본 위치를 붙여줬으니까. 그런데 **React 19에서 이게 빠졌다.**

그래서 방향을 바꿨다. React가 주는 걸 쓰는 대신, **내가 빌드 타임에 직접
`__componentSourceLoc`/`$componentSourceLoc`를 심고, 런타임에 Fiber를 뒤져
그걸 읽는다.** 코드는 이 legacy 필드도 폴백으로 함께 지원한다.

```ts
const raw =
  getSourceFromProps(fiber.pendingProps) ??
  getSourceFromProps(fiber.memoizedProps) ??
  getDirectDebugSource(fiber);   // _debugSource 폴백 (React ≤18)
```

결과적으로 **React 버전에 독립적인** 더 튼튼한 구조가 됐다. 프레임워크
내부 구현에 의존할 때의 위험(어느 날 조용히 사라진다)을 정면으로 배운
사례였다.

## 정리

- React는 DOM 노드에 `__reactFiber$…` 키로 Fiber를 매달아 둔다.
- `getClosestReactFiber` → `fiber.return`으로 트리를 위로 순회하면
  DOM에서 컴포넌트 계보를 되짚을 수 있다.
- `type`/`elementType`에서 컴포넌트를, `props`에서 JSX 요소 소스를 읽는다.
  `memo`/`forwardRef`는 한 겹 더 들어가야 한다.
- 같은 UI라도 화면 위치 ≠ 구현 위치. 둘 다 필요하다.

Fiber는 "React가 렌더링을 어떻게 기억하는가"의 실체다. 한 번 열어보면
DevTools가 어떻게 동작하는지, 왜 그런 제약이 있는지가 전부 보인다.

- 실제 구현: [react-code-locator](https://www.npmjs.com/package/react-code-locator)
  ([GitHub](https://github.com/dbckdgjs369/web-element-code-locator))
- 이어지는 글: [코드는 어떻게 트리가 되는가 — AST와 파싱](/category/JavaScript/2026-07-02-how-ast-parsing-works/)
