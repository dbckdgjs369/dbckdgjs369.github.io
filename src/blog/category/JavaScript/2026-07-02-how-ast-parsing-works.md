---
layout: post
title: "코드는 어떻게 트리가 되는가 — AST와 파싱, 그리고 JSX·TS 파싱하기"
category: [JavaScript]
project: react-code-locator
date: 2026-07-02
---

앞선 글에서 [우클릭으로 컴포넌트 소스로 점프하는 도구](/category/React/2026-07-02-react-code-locator/)를
만든 이야기를 했다. 그 도구의 심장은 **"코드를 읽어서 원하는 위치를 찾아내는"**
부분, 즉 **AST 파싱**이다. 만들면서 AST를 제대로 파게 됐는데, 알고 나니
ESLint·Babel·Prettier·코드모드가 전부 같은 원리 위에 서 있다는 걸 깨달았다.
그 내용을 정리한다.

## AST가 뭔가

우리가 쓰는 소스 코드는 컴퓨터 입장에선 그냥 **글자의 나열(문자열)** 이다.
`function`이라는 다섯 글자가 함수 선언의 시작이라는 걸 컴퓨터는 처음부터
아는 게 아니다. 이 문자열을 **의미 단위로 구조화한 트리**가 바로
**AST(Abstract Syntax Tree, 추상 구문 트리)** 다.

```js
const x = 1 + 2;
```

이 한 줄은 대충 이런 트리가 된다.

```
VariableDeclaration (const)
└─ VariableDeclarator
   ├─ Identifier         name: x
   └─ BinaryExpression   operator: +
      ├─ Literal         value: 1
      └─ Literal         value: 2
```

`1 + 2`가 "덧셈이고, 왼쪽은 1, 오른쪽은 2"라는 관계가 트리로 표현된다.
이렇게 구조가 잡히면 코드를 **프로그램으로 다룰 수 있다.** 린터는 이 트리를
보고 규칙을 검사하고, 번들러는 import를 찾고, 포매터는 트리를 다시 예쁘게
출력한다.

## 파싱은 두 단계다: 토큰화 → 트리 만들기

문자열이 트리가 되기까지는 보통 두 단계를 거친다.

**1. 렉싱(Lexing / 토큰화)** — 문자열을 의미 있는 최소 단위인 **토큰**으로
쪼갠다.

```
const x = 1 + 2;
→ [const] [x] [=] [1] [+] [2] [;]
```

**2. 파싱(Parsing)** — 토큰들을 문법 규칙에 따라 트리로 조립한다.
`[1] [+] [2]`를 보면 "이건 BinaryExpression이구나" 하고 노드를 만든다.

JavaScript 진영에서 이 일을 하는 대표적인 파서가 **[acorn](https://github.com/acornjs/acorn)**
이다. 작고 빠르고, 결과 AST가 [ESTree](https://github.com/estree/estree)라는
표준 스펙을 따른다. ESLint의 파서(espree)도 acorn 기반이라 ESTree 호환이다.
다만 Babel은 자체 AST 포맷을 쓰는데, ESTree와 비슷하지만 호환되진 않는다
(예: 문자열이 `Literal`이 아니라 `StringLiteral` 노드다).

## 실제로 파싱해보기

간단한 컴포넌트를 파서에 넣어보자.

```jsx
function Hello({ name }) {
  return <h1 className="t">Hi {name}</h1>;
}
```

acorn(+ JSX·TS 플러그인)으로 파싱하면 이런 트리가 나온다. 괄호 안은
`(줄:칸)` 위치다.

```
Program
└─ FunctionDeclaration          (1:0)
   ├─ Identifier   name=Hello
   ├─ ObjectPattern             ({ name } 구조분해)
   └─ BlockStatement
      └─ ReturnStatement        (2:2)
         └─ JSXElement          (2:9)
            ├─ JSXOpeningElement
            │  ├─ JSXIdentifier   name=h1
            │  └─ JSXAttribute    className="t"
            ├─ JSXText            "Hi "
            ├─ JSXExpressionContainer
            │  └─ Identifier      name=name
            └─ JSXClosingElement  name=h1
```

여기서 주목할 것:

- 모든 노드에 **`type`** 이 있다. (`FunctionDeclaration`, `JSXElement`…)
- `locations: true` 옵션을 주면 각 노드가 **`loc`(줄/칸)** 과 **`start`/`end`
  (문자 오프셋)** 위치를 들고 있다. → "이 요소가 소스의 어디인지"를 아는
  근거가 바로 이것이다.
- `<h1>`은 `JSXElement`, 그 여는 태그는 `JSXOpeningElement`, 안의 `{name}`은
  `JSXExpressionContainer`로 표현된다.

내가 만든 도구는 이 트리를 훑다가 `JSXElement`를 만나면 "너는 `2:9`에서
왔구나"를 기억해뒀다가 그 위치 정보를 코드에 심는다.

## 문제: 순수 JS 파서는 JSX도 TS도 모른다

여기서 첫 번째 벽을 만난다. `<h1>` 같은 JSX나 `: string` 같은 TypeScript
문법은 **표준 JavaScript 문법이 아니다.** acorn만으로는 파싱하다 에러가 난다.

acorn은 이 문제를 **플러그인으로 파서를 확장**하는 방식으로 푼다.

```ts
import * as acorn from "acorn";
import acornJsx from "acorn-jsx";
import acornTs from "acorn-typescript";

// TypeScript 플러그인이 JSX 플러그인보다 먼저 와야 한다
const ParserTSX = acorn.Parser.extend(acornTs(), acornJsx());
```

`Parser.extend(...)`로 기존 파서에 JSX·TS 문법을 이해하는 능력을 얹은
새 파서를 만든다. 순서도 중요하다. TS 플러그인을 먼저 얹어야 타입 문법을
제대로 처리한다.

### 함정: `.tsx`의 `<T,>` 제네릭

JSX와 TS 제네릭은 문법이 충돌한다. `.tsx`에서

```tsx
const identity = <T,>(x: T) => x;
```

의 `<T,>`를 JSX 파서는 **JSX 태그의 시작**으로 오해한다. 그래서 나는
`.ts` 파일은 아예 JSX 플러그인을 빼고 파싱하도록 파서를 두 벌로 나눴다.
(`.ts`엔 JSX가 올 수 없으니 안전하고, `.tsx`만 JSX를 허용한다.)

```ts
const ParserTS = acorn.Parser.extend(acornTs());          // .ts 전용
const JSX_FILE_RE = /\.(jsx?|tsx)$/;
const getParser = (file: string) =>
  JSX_FILE_RE.test(file) ? ParserTSX : ParserTS;
```

## 트리 순회 — 원하는 노드 찾기

트리를 만들었으면, 이제 원하는 노드(JSX 요소, 컴포넌트 선언)를 찾아 돌아다녀야
한다. 이걸 **트리 순회(traversal)** 라고 하고, `estree-walker` 같은 도구를
쓰면 편하다.

```ts
import { walk } from "estree-walker";

const parentStack: any[] = [];

walk(ast, {
  enter(node) {
    const parent = parentStack[parentStack.length - 1] ?? null;

    if (node.type === "JSXElement") {
      // 이 JSX 요소의 위치(node.loc.start)를 기록
    }
    if (node.type === "FunctionDeclaration" && /^[A-Z]/.test(node.id?.name)) {
      // 대문자로 시작 → 컴포넌트로 간주
    }

    parentStack.push(node);
  },
  leave() {
    parentStack.pop();
  },
});
```

`enter`는 노드에 들어갈 때, `leave`는 나올 때 호출된다. 이때 **부모 스택**을
직접 관리하면 "지금 이 노드가 어떤 문맥 안에 있는지"를 알 수 있다. 예를 들어
`const Button = () => ...`가 최상위인지, 다른 블록 안에 있는지, `export`로
감싸졌는지를 부모/조부모 노드로 판단한다. 컴포넌트인지 아닌지를 정확히
가리려면 이 문맥 판단이 꼭 필요했다.

## 위치는 알았고 — 코드는 어떻게 고치나

여기서 중요한 결정을 했다. **AST를 다시 코드로 뽑지 않는다.**

파싱한 AST를 수정한 뒤 코드 제너레이터로 다시 출력하면, 원본의 공백·따옴표
스타일·주석 같은 게 미묘하게 달라질 수 있다. 나는 위치만 알면 됐으므로,
파싱은 **좌표를 얻는 용도로만** 쓰고 실제 수정은 원본 문자열에 직접 했다.

이때 쓴 게 **[MagicString](https://github.com/Rich-Harris/magic-string)** 이다.
문자열의 특정 오프셋에 삽입할 텍스트를 기록만 해두는 방식이라 삽입은
사실상 상수 비용이고, 최종 문자열 생성은 마지막에 한 번만 한다. 소스맵도
만들어준다.

```ts
import MagicString from "magic-string";

const s = new MagicString(code);
// node.end: 그 노드가 끝나는 문자 오프셋
s.appendLeft(node.end, `\n${name}.__componentSourceLoc = "App.tsx:8:1";`);
return { code: s.toString(), map: s.generateMap({ hires: true }) };
```

여기서 `loc`(줄/칸)과 `start`/`end`(문자 오프셋)의 차이가 중요하다. 사람에게
보여줄 위치는 `loc`(줄:칸), 문자열을 자르고 붙일 때 쓰는 좌표는
`start`/`end`(오프셋)다. 둘 다 파서가 준다.

## 알고 나니 세상이 달라 보인다

AST를 이해하고 나니, 그동안 마법처럼 보이던 도구들이 전부 같은 뼈대 위에
있다는 게 보였다.

- **ESLint 규칙** = AST를 순회하며 특정 패턴을 검사
- **Babel 플러그인 / 코드모드** = AST를 순회·수정하고 다시 코드로 출력
- **Prettier** = AST를 표준 스타일로 재출력
- **번들러** = AST에서 import/export를 분석해 그래프를 만듦

"코드를 다루는 코드"를 쓰고 싶을 때, 정규식으로 씨름하는 대신 **파서에게
구조를 물어보면 된다**는 것. 이게 이번에 얻은 가장 큰 무기였다.

- 이 원리를 실제로 쓴 프로젝트: [react-code-locator](https://www.npmjs.com/package/react-code-locator)
- 파서/도구: [acorn](https://github.com/acornjs/acorn) ·
  [estree-walker](https://github.com/Rich-Harris/estree-walker) ·
  [MagicString](https://github.com/Rich-Harris/magic-string)
