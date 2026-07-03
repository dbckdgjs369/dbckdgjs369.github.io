---
layout: post
title: "위젯 10개에서 페이지가 버벅였다 — 강제 reflow를 유휴 시간으로 밀어내 95% 개선한 이야기"
category: [Web]
project: stock-price-widget
date: 2026-07-02
---

[시세 위젯 확장](/category/Web/2026-07-02-stock-price-widget/)에는 작지만
욕심낸 기능이 있다. **위젯 텍스트 색을 배경에 맞춰 자동으로 조정**하는 것.
흰 페이지 위에선 검은 글씨, 어두운 페이지 위에선 흰 글씨. 그런데 이 예쁜
기능이 성능을 무너뜨렸다.

## 증상: 위젯을 여러 개 띄우면 페이지가 느려진다

위젯을 10개쯤 띄우니, **내가 보고 있던 페이지 자체의 반응성**이 급격히
나빠졌다. 스크롤도, 클릭도 굼떴다. 지표로는 INP(Interaction to Next Paint)가
크게 튀었다.

Chrome DevTools Performance 탭을 열어보니 범인이 명확했다.
`getBackgroundColorAtPoint`라는 함수가 **전체 실행 시간의 65~71%**를 먹고
있었다.

## 원인: `elementsFromPoint`는 공짜가 아니다

배경색을 알아내려고 `document.elementsFromPoint(x, y)`를 썼다. "이 좌표에
어떤 요소들이 쌓여 있나"를 알려주는 API다. 이런 레이아웃을 읽는 API는
**레이아웃이 dirty 상태일 때 호출하면 강제 재계산(reflow)** 을 유발한다.
호출 자체가 항상 비싼 건 아니고, "그 사이에 뭔가 스타일을 건드렸다면"
비싸진다.

그런데 내 코드가 정확히 그 짓을 하고 있었다. 샘플링할 때 위젯 자신이
찍히지 않도록, **샘플 사이사이에 오버레이 루트의 `pointer-events`를
껐다 켰다** 했던 것.

```js
const previousPointerEvents = root.style.pointerEvents;
root.style.pointerEvents = "none";        // ← 스타일 변경 = 레이아웃 invalidate
const sampled = samplePoints.map(({ point }) =>
  getBackgroundColorAtPoint(point.x, point.y) // ← 다시 레이아웃을 읽음 = 강제 reflow
);
root.style.pointerEvents = previousPointerEvents; // ← 또 invalidate
```

"스타일 쓰기 → 레이아웃 읽기"를 반복하니, `elementsFromPoint`가 캐시된
레이아웃을 재사용하지 못하고 **매번 재계산**하게 됐다.

호출 구조가 이랬다.

```
renderWidgets()  [RAF — 페인트 직전에 실행]
  └ getCachedTheme() × 위젯 N개
      └ sampleTheme()
          └ getBackgroundColorAtPoint() × 9 샘플포인트
              └ document.elementsFromPoint() × 7 프로브
```

위젯 하나당 `9 × 7 = 63`번. 위젯 10개면 **한 번 렌더에 630번**의 강제 reflow.
그것도 하필 **`requestAnimationFrame` 콜백 안에서 동기적으로** 돌았다. RAF는
"페인트 바로 직전"이라, 여기서 630번 reflow를 하면 **페인트가 수 초간
블로킹**된다. 측정하니 이 경로가 약 **6,993ms**를 차지했다.

## 해결 1: 무거운 일을 RAF 밖으로 — `requestIdleCallback`

첫 번째 원칙: **페인트 경로에서 무거운 계산을 걷어낸다.** 테마 샘플링을 RAF
안에서 즉시 하지 않고, 브라우저가 한가할 때(`requestIdleCallback`) 처리하도록
큐로 뺐다.

```js
function getCachedTheme(widget) {
  const cached = themeCache.get(widget.id);
  if (cached?.theme) return cached.theme; // 캐시 있으면 즉시 반환

  // 캐시 미스: 지금 계산하지 말고 큐에 넣고, 일단 기본 테마 반환
  themeSampleQueue.add(widget.id);
  scheduleIdleThemeSampling();
  return DEFAULT_THEME; // ← RAF를 블로킹하지 않는다
}

function scheduleIdleThemeSampling() {
  if (themeSampleIdleHandle) return;
  themeSampleIdleHandle = requestIdleCallback((deadline) => {
    themeSampleIdleHandle = null;
    // 브라우저가 준 여유 시간(deadline) 안에서만 조금씩 처리
    while (themeSampleQueue.size > 0 && deadline.timeRemaining() > 1) {
      const id = themeSampleQueue.values().next().value;
      themeSampleQueue.delete(id);
      const widget = widgets.find((w) => w.id === id);
      if (widget) themeCache.set(id, { key: id, theme: sampleTheme(widget) });
    }
    requestRender(); // 다 끝나면 그때 한 번 렌더
  });
}
```

렌더링은 "일단 기본값으로 그리고", 무거운 샘플링은 **유휴 시간에 나눠서**
한다. 페인트가 더는 막히지 않는다.

## 해결 2: 애초에 계산량을 줄인다

`requestIdleCallback`으로 옮겨도, 근본적으로 호출 수가 많으면 좋을 게 없다.
그래서 샘플 포인트를 **9개 → 3개**, 프로브를 **7개 → 1개**로 줄였다. 위젯당
`63번 → 3번`. 실측해보니 3개 포인트만으로도 배경색 판정 정확도가 충분했다.

## 해결 3: 깜빡임 없애기 — stale 캐시 유지

다시 샘플링하는 동안 캐시를 **비워버리면**, 그 찰나에 위젯이 기본색으로
번쩍인다. 그래서 "재샘플링 중"이어도 **이전 테마를 그대로 반환**하고, 새 값이
나오면 조용히 교체했다. cache invalidation의 고전적 함정을, "지우지 말고
갱신될 때까지 들고 있기"로 피했다.

## 결과

| 단계 | 조치 | 소요 |
|------|------|------|
| 전 | RAF 안 동기 샘플링 (630 calls) | ~6,993ms |
| 1 | `requestIdleCallback`로 분리 | ~1,593ms |
| 2 | 샘플 포인트 9→3, 프로브 7→1 (630→30) | **~133ms** |

**약 95% 개선.** 위젯을 잔뜩 띄워도 페이지가 더는 버벅이지 않는다.

## 배운 것

- **추측하지 말고 측정한다.** DevTools가 `getBackgroundColorAtPoint`를
  콕 집어주지 않았다면 엉뚱한 데를 고쳤을 거다.
- `elementsFromPoint` / `getBoundingClientRect` 같은 레이아웃을 읽는 API는
  그 자체로 항상 비싼 게 아니라, **스타일 쓰기와 번갈아 부르면 매번 강제
  reflow가 된다** (layout thrashing). 특히 RAF·스크롤 핸들러 안에서 반복하면
  치명적.
- 무거운 작업은 **페인트 경로 밖(idle)** 으로, 그리고 **애초에 양을 줄이는 것**
  둘 다 필요했다. 사용자 눈엔 안 보이는 이 최적화가 실제 체감을 가장 크게
  바꿨다.

- 관련 프로젝트: [Stock Price Widget](/category/Web/2026-07-02-stock-price-widget/)
