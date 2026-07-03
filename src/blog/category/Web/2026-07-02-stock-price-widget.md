---
layout: post
title: "어느 웹페이지 위에든 실시간 시세를 띄우기 — 크롬 확장을 만든 이야기"
category: [Web]
project: stock-price-widget
date: 2026-07-02
---

## 탭 전환이 귀찮았다

주식이랑 코인 시세를 하루에도 수십 번 본다. 그때마다 증권 앱을 켜거나
탭을 전환하는 게 은근히 흐름을 끊었다. **지금 보고 있는 페이지 위에, 조그맣게
시세가 떠 있으면 안 되나?** 그런데 클릭은 아래 페이지로 그대로 통과했으면
좋겠고.

그래서 만들었다. **어떤 웹페이지 위에든 실시간 주식·코인 시세 위젯을 띄우는
크롬 확장**, Stock Price Widget. 드래그로 옮기고, 크기 조절하고, 화면에 핀으로
고정할 수 있다. 그리고 위젯 위의 클릭은 아래 페이지로 통과한다.

만들다 보니 "간단한 위젯 하나"가 아니라, 실서비스 크롬 확장이 마주치는
문제를 거의 다 만나게 됐다. 이 글은 전체 그림이고, 뒤에 이어질 글들에서
어려웠던 지점을 하나씩 판다.

## 3계층 아키텍처

핵심 구조는 세 겹이다.

```
┌ 크롬 확장 (Manifest v3) ──────────────────────┐
│  background (service worker): WebSocket·캐시   │
│  content scripts: 아무 페이지 위에 위젯 렌더    │
│  popup: 종목 검색·위젯 관리                    │
└───────────────┬───────────────────────────────┘
                │ REST + WebSocket
                ▼
┌ Node 프록시 서버 ─────────────────────────────┐
│  /quotes  (시세 배치 조회)                     │
│  /search  (종목 검색)                          │
│  /ws      (실시간 구독 push)                    │
│   └ 한국투자증권 KIS / Gate.io / Binance       │
└────────────────────────────────────────────────┘
```

### 왜 프록시 서버를 따로 뒀나

처음엔 확장에서 시세 API를 직접 부르려 했다. 사실 기술적으로는 된다.
MV3의 background는 `host_permissions`만 선언하면 CORS 제약 없이 외부 API를
호출할 수 있다. 그런데 직접 부르면 안 되는 이유가 하나씩 쌓였다.

- **키·서명 숨김**: 한국투자증권 KIS 키나 거래소 서명 같은 민감정보를
  확장 코드에 박아 배포할 순 없다. 확장은 소스가 그대로 노출된다. 서버에 숨긴다.
- **구독 통합(fan-out)**: 여러 사용자가 같은 종목(BTC 등)을 구독해도,
  서버는 업스트림에 **하나의 연결**만 유지하고 결과를 나눠준다.
- **Rate limit 중앙화**: 여러 탭·여러 사용자의 요청을 서버가 모아서
  관리한다. 사용자가 늘어도 업스트림 호출량이 비례해서 늘지 않는다.

즉 프록시는 단순 중계가 아니라 **보안·성능·안정성의 경계선**이었다.

## 실시간은 한 겹으로 안 된다 — 3층 갱신

시세는 "실시간"이 생명인데, 브라우저 확장 환경은 실시간에 적대적이다.
(뒤 글에서 자세히) 그래서 갱신을 세 겹으로 쌓았다.

| 계층 | 방식 | 역할 |
|------|------|------|
| 1 | WebSocket 구독 | 진짜 실시간 |
| 2 | 15초 REST 폴링 | WS 끊겼을 때 메움 |
| 3 | `chrome.alarms` 1분 | 죽은 Service Worker 복구 |

## 이 프로젝트에서 판 것들

한 줄로 "위젯 앱"이라 부르기엔, 아래 주제들이 각각 꽤 깊었다. 이어지는
글에서 다룬다.

- **[Manifest v3 Service Worker의 좀비 WebSocket](/category/Web/2026-07-02-mv3-service-worker-zombie-websocket/)** — 열려있지만 죽은 연결을 감지하고 되살리기
- **[위젯 10개에서 INP가 무너졌다 — 95% 성능 개선](/category/Web/2026-07-02-widget-perf-idle-sampling/)** — 강제 reflow를 유휴 시간으로 밀어내기
- **[클릭은 통과시키고, 색은 배경에 맞추기](/category/Web/2026-07-02-click-through-overlay-theme/)** — pointer-events와 명암비 자동 조정

- 크롬 스토어: [Stock Price Widget](https://chromewebstore.google.com/detail/stock-price-widget/niofpnhhdeaneajeemfpnclammllkhfg)
- GitHub: [stock-price-extension-support](https://github.com/dbckdgjs369/stock-price-extension-support)
