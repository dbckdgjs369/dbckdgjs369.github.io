---
layout: post
title: "클릭은 통과시키고, 글씨색은 배경에 맞추기 — 오버레이 위젯의 두 가지 트릭"
category: [Web]
project: stock-price-widget
date: 2026-07-02
---

[시세 위젯 확장](/category/Web/2026-07-02-stock-price-widget/)은 "아무 웹페이지
위에" 떠 있어야 한다. 그런데 남의 페이지 위에 뭘 덮으면 두 가지 문제가 생긴다.
**(1) 위젯이 아래 페이지의 클릭을 가로막고, (2) 위젯 글씨가 배경에 묻힌다.**
이 둘을 어떻게 풀었는지 정리한다.

## 트릭 1: 클릭은 아래로 통과시키기 (`pointer-events`)

위젯은 화면 전체를 덮는 오버레이 안에 그린다. 이걸 그냥 두면 오버레이가
페이지의 모든 클릭을 삼킨다. 핵심은 CSS `pointer-events`다.

```css
#stock-widget-root {
  position: fixed;
  inset: 0;
  z-index: 2147483646;
  pointer-events: none; /* 기본: 클릭이 아래 페이지로 통과 */
}

#stock-widget-root .stock-widget {
  pointer-events: none; /* 위젯도 평소엔 클릭 안 받음 */
}

/* 편집 모드일 때만 위젯이 클릭·드래그를 받는다 */
#stock-widget-root[data-edit-mode="true"] .stock-widget {
  pointer-events: auto;
  cursor: grab;
}
```

`pointer-events: none`이면 그 요소는 **마우스 이벤트에 투명**해진다. 클릭이
위젯을 그냥 통과해 아래 페이지로 간다. 시세는 눈으로 보되, 페이지는 평소처럼
쓸 수 있다.

그럼 위젯을 옮기고 싶을 땐? **Shift를 누르거나 드래그 중일 때만** 편집 모드로
전환한다. 상태를 데이터 속성 하나로 관리했다.

```js
function syncRootState() {
  root.dataset.editMode =
    shiftPressed || cmdPressed || selectionState || dragState || resizeState
      ? "true"
      : "false";
}
```

`data-edit-mode`가 `true`가 되는 순간 위젯이 `pointer-events: auto`로 바뀌어
드래그·리사이즈를 받고, 놓으면 다시 투명해진다. 상태는 JS로, 실제 반응은
CSS로 나눈 게 깔끔했다.

> 여기엔 숨은 함정이 많았다. 예를 들어 위젯 안의 입력창에 포커스하면 아래
> 페이지(네이버 등)의 자동완성과 충돌해서, capture 단계에서
> `stopImmediatePropagation()`으로 먼저 가로채야 했다. "남의 집에 세들어
> 사는" 오버레이라 이런 경계 처리가 계속 필요했다.

## 트릭 2: 글씨색을 배경에 맞추기 (명암비 계산)

위젯은 반투명이라 뒤 배경이 비친다. 흰 배경이면 검은 글씨, 어두운 배경이면
흰 글씨여야 읽힌다. 그래서 **위젯 뒤의 실제 배경색을 샘플링**하고, 그에 맞는
글씨색을 골랐다.

배경색을 알아내는 건 `elementsFromPoint`로 그 지점에 쌓인 요소들의 배경색을
훑는다. (이게 성능 병목이 돼서 따로 크게 최적화한 이야기는
[여기](/category/Web/2026-07-02-widget-perf-idle-sampling/)에 있다.)

그다음이 핵심인데, "검정이 나을까 흰색이 나을까"를 감이 아니라 **WCAG의 명암비
공식**으로 계산했다.

```js
// 상대 휘도 (WCAG 정의)
function getRelativeLuminance(color) {
  const { r, g, b } = parseColor(color);
  const toLinear = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// 두 색의 명암비 (1:1 ~ 21:1)
function getContrastRatio(fg, bg) {
  const L1 = getRelativeLuminance(fg);
  const L2 = getRelativeLuminance(bg);
  const [lighter, darker] = [Math.max(L1, L2), Math.min(L1, L2)];
  return (lighter + 0.05) / (darker + 0.05);
}
```

배경색이 정해지면 글씨색을 이렇게 고른다. 우선순위가 있다.

1. **페이지가 원래 쓰던 텍스트색을 최대한 존중한다.** 샘플 지점의 텍스트색,
   주변 컨텍스트 요소의 색, body 색 순으로 후보를 훑으면서 배경과의 명암비가
   3.5 이상인 첫 후보를 "선호 색"으로 잡는다. 위젯이 페이지에 자연스럽게
   녹아들게 하려는 의도다.
2. 그 선호 색이 최종 검사(명암비 4.5, WCAG AA 기준)를 통과하면 그대로 쓴다.
3. 통과 못 하면 그때서야 **밝은색·어두운색 두 후보 중 배경과의 명암비가
   더 높은 쪽**으로 폴백한다.

```js
function pickReadableTextColor(preferredColor, backgroundColor) {
  const light = "rgb(248, 250, 252)";
  const dark = "rgb(15, 23, 42)";
  if (getContrastRatio(preferredColor, backgroundColor) >= 4.5) return preferredColor;
  return getContrastRatio(light, backgroundColor) > getContrastRatio(dark, backgroundColor)
    ? light
    : dark;
}
```

사람이 "이 정도면 읽히겠지" 하고 찍는 대신, 접근성 표준이 정의한 수식으로
정하니 어떤 사이트 위에 올려도 일관되게 읽혔다.

## 배운 것

- `pointer-events`는 오버레이 UI의 핵심 도구다. **상태는 JS, 반응은 CSS**로
  나누면 깔끔하다.
- "글씨가 잘 보인다"는 주관 같지만, WCAG **상대 휘도·명암비**라는 정량
  기준이 있다. 감으로 색을 고르지 않아도 된다.
- 남의 페이지 위에 얹는 확장은 결국 "남의 환경을 침범하지 않기"가 절반이다.
  클릭 통과, 이벤트 충돌, 배경 적응 전부 그 연장선이었다.

- 관련 프로젝트: [Stock Price Widget](/category/Web/2026-07-02-stock-price-widget/)
