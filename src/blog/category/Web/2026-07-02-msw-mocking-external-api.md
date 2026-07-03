---
layout: post
title: "진짜 API를 그만 때리자 — MSW로 네트워크를 가로채 개발하기"
category: [Web]
project: youtube-playlist-generator
date: 2026-07-02
---

[YouTube Playlist Generator](/category/React/2026-07-02-youtube-playlist-generator/)를
만들며 제일 크게 데인 건 **API 할당량(quota)** 이었다. YouTube Data API는
검색 한 번이 100 units이고 하루 한도가 10,000이라, 개발하며 새로고침 몇 번
하면 **하루치 할당량이 순식간에 증발**했다. "코드 한 줄 고치고 확인"을
반복해야 하는 개발 단계에서 이건 치명적이다.

그래서 개발 단계에서 도입했던 게 **MSW(Mock Service Worker)** 다. 기능이
안정화된 뒤에는 비활성화해서 지금 코드에는 주석으로만 흔적이 남아 있지만,
이 글은 "왜 MSW였고, 어떻게 동작하는가", 그리고 당시 내 설정이 어디까지
됐고 어디서 어설펐는지를 정리한다.

## 흔한 목킹의 한계

가짜 데이터를 쓰는 방법은 원래도 있었다.

- `axios`를 감싼 함수를 통째로 갈아끼우기
- 컴포넌트에 `if (mock) return dummy` 같은 분기 심기

문제는 **앱 코드를 건드려야 한다**는 것. 목킹용 코드가 실제 로직에 섞이고,
목을 끄고 켤 때마다 코드를 고쳐야 한다. 실수로 목킹 코드를 배포할 위험도
있다.

## MSW의 아이디어: 네트워크 계층에서 가로채기

MSW는 접근이 다르다. **Service Worker로 브라우저의 네트워크 요청 자체를
가로챈다.** 앱은 평소처럼 `fetch`/`axios`로 진짜 URL에 요청을 보내고, 그
요청이 네트워크로 나가기 직전에 MSW가 낚아채 가짜 응답을 돌려준다.

```
앱 코드          MSW(Service Worker)         진짜 서버
  │  axios.get('/search')  │                     │
  ├───────────────────────▶│  (핸들러에 매칭됨)   │
  │◀───────────────────────┤  가짜 JSON 응답      │
  │                        │  (여기서 끝, 서버엔 안 감)
```

핵심은 **앱 코드가 목킹의 존재를 전혀 모른다**는 점이다. `axios.get('/search')`
그대로 두면 된다. 목을 끄면 그 요청이 진짜 서버로 나간다. 앱 로직과 목킹이
완전히 분리된다.

## 당시의 실제 설정

git 기록(커밋 `90a3079` "msw 설치", `0d31d81` "mock 데이터 연결")을 보면,
요청별로 가짜 응답을 정의하는 **핸들러**를 이렇게 만들었다.

```js
// mocks/handlers.js
import { rest } from "msw";

const videoId = ["1EgiO-RyMGQ", "grG41kS4MUA", "HmKgFJGn46Q"];

export const handlers = [
  // 검색 요청 → 가짜 videoId 목록
  rest.get("/search", (_, res, ctx) => {
    return res(ctx.status(200), ctx.json(videoId));
  }),
  // 재생목록 생성 요청 → 가짜 playlist 객체
  rest.post("/make", (_, res, ctx) => {
    return res(ctx.status(200), ctx.json(DUMMYPLAYLIST));
  }),
];
```

그리고 이 핸들러들로 워커를 만들어 브라우저에서 띄운다.

```js
// mocks/server.js
import { setupWorker } from "msw";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

앱 진입점에서는 개발 모드일 때만 `worker.start()`를 호출했다. 당시
커밋의 코드 그대로다.

```js
// App.js (당시 커밋 기준)
import { worker } from "./mocks/server";
if (process.env.NODE_ENV === "development") {
  worker.start();
}
```

이렇게 하면 핸들러에 매칭되는 요청은 진짜 서버로 나가지 않고 가짜 응답을
받는다. **할당량은 1도 안 쓴다.** 지금 코드에서는 이 부분이 통째로 주석
처리돼 있다 — 기능이 안정화된 뒤 목킹을 끈 것이다.

## 고백: 내 설정은 이상과 거리가 있었다

위에서 "앱 코드가 목킹의 존재를 전혀 모른다"고 했는데, 솔직히 당시 내
설정은 그 이상에 못 미쳤다. 코드를 다시 열어보니 이랬다.

- 앱은 `axios.defaults.baseURL`을 `https://www.googleapis.com/youtube/v3`로
  두고 절대 URL로 요청하는데, 핸들러는 `rest.get("/search")` 같은
  **상대경로**였다. 상대경로 핸들러는 앱 도메인 기준이라 googleapis로 나가는
  요청과는 매칭되지 않는다. 그래서 당시엔 목킹용으로 `fetch("/search")`를
  **따로 호출**해서 가짜 응답을 받았다 — 즉 "앱 코드 무변경"이 아니라, 목에
  맞춰 앱 코드를 고친 셈이다.
- 목 데이터도 videoId **문자열 배열**이라, 실제 API 응답 구조
  (`items[].id.videoId`)와 달랐다.
- `rest.post("/make")` 핸들러는 만들어놓고 정작 대응하는 요청이 없었다.

제대로 하려면 핸들러 URL을 실제 요청과 같은 절대 URL로 맞추고, 목 데이터도
실제 응답 스키마 그대로 만들어야 했다. MSW의 장점("경계에서 가로채기")을
온전히 누리려면 이게 전제 조건인데, 당시엔 거기까지 가지 못했다.

## 그래도 MSW가 좋았던 점

- **할당량 절약**: 개발 중 무한 새로고침해도 진짜 API를 안 때린다.
  이게 도입한 첫 번째 이유였고, 어설픈 설정으로도 이 목적은 달성했다.
- **오프라인/독립 개발**: 서버(또는 외부 API)가 준비 안 됐어도 프론트를
  먼저 만든다. 응답 형태만 합의하면 병렬로 진행 가능.
- **엣지 케이스 재현**: 500 에러, 빈 결과, 느린 응답 같은 걸 핸들러에서
  `ctx.status(500)`, `ctx.delay()`로 마음대로 만들 수 있다. 진짜 서버로는
  일부러 만들기 힘든 상황이다.

## 되돌아보며

당시 내 MSW 설정은 사실 단순했다 — 핸들러 두어 개가 전부였고, 위에서
고백했듯 "앱 코드 무변경"이라는 MSW의 진짜 장점은 살리지 못했다. 하지만
"목킹은 앱 코드가 아니라 **네트워크 계층**에서 하는 것"이라는 발상 자체가
그 뒤로 개발 방식을 바꿨다. 외부 API에 의존하는 앱을 만들 때, 진짜 API를
계속 때리는 대신 경계에서 가로채면 개발이 훨씬 자유로워진다.

개발 단계에서 할당량 걱정 없이 마음껏 새로고침할 수 있었다는 것 —
지금은 꺼둔 도구지만, 그때의 개발 경험을 크게 바꿔줬다.

- 관련 프로젝트: [YouTube Playlist Generator](/category/React/2026-07-02-youtube-playlist-generator/)
- 같이 보면 좋은 글: [반복문에서 API 호출하기](/category/JavaScript/2026-07-02-api-calls-in-a-loop/)
