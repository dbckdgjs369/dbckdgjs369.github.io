---
layout: post
title: "단방향 WebSocket을 양방향 요청/응답으로 — UUID와 Map으로 동시 요청 매칭하기"
category: [Web]
project: custom-tunnel
date: 2026-07-02
---

[로컬 서버를 공개 URL로 여는 터널](/category/Web/2026-07-02-custom-tunnel/)의
심장은 **"바깥에서 온 HTTP 요청을, WebSocket 하나로 로컬까지 나르고 다시
돌려받는"** 부분이다. 여기엔 근본적인 미스매치가 있다.

- **HTTP**는 요청 하나에 응답 하나가 딱 짝지어진다. (request ↔ response)
- **WebSocket**은 그냥 메시지가 양방향으로 흐르는 스트림이다. 짝 개념이 없다.

게다가 방문자가 여러 명이면, 혹은 브라우저가 페이지 하나 그리려고 CSS·JS·
이미지를 **동시에 수십 개** 요청하면, 그 요청들이 전부 같은 WebSocket 하나로
섞여 흐른다. 돌아온 응답이 **어느 요청의 것인지** 어떻게 알까?

## 해결: 요청마다 UUID를 붙이고, Map으로 대기시킨다

답은 단순하고 강력했다. **요청마다 고유 ID(UUID)를 발급**하고, 응답이 그 ID를
달고 돌아오게 하는 것. 서버는 "아직 응답을 기다리는 요청들"을 `Map`에 담아둔다.

```js
// 공개 서버: 외부 HTTP 요청이 들어오면
const requestId = uuidv4();

// 응답 객체(res)를 ID로 대기 목록에 저장
pendingRequests.set(requestId, { req, res });

// WebSocket으로 로컬 클라이언트에 요청을 넘긴다 (ID를 함께)
ws.send(JSON.stringify({
  type: "request",
  requestId,           // ← 이 ID가 짝을 맞추는 열쇠
  method: req.method,
  url: fullPath,
  headers: req.headers,
  body,
}));
```

로컬 클라이언트는 `localhost`에 요청을 실제로 던지고, 응답을 **같은 ID를 달아**
돌려보낸다. 서버는 ID로 대기 중이던 `res`를 찾아 응답을 흘려보낸다.

```js
// 응답이 WebSocket으로 돌아오면
if (data.type === "response") {
  const { requestId, statusCode, headers, body, isBase64 } = data;
  const pending = pendingRequests.get(requestId); // ← ID로 짝 찾기
  if (pending) {
    pending.res.writeHead(statusCode, headers);
    pending.res.end(isBase64 ? Buffer.from(body, "base64") : body);
    pendingRequests.delete(requestId); // 완료됐으니 목록에서 제거
  }
}
```

`Map` 덕분에 **수십 개의 요청이 동시에 진행 중**이어도, 각자 제 응답을 정확히
찾아간다. 응답이 도착하는 순서가 뒤죽박죽이어도 상관없다. ID가 짝을
보장하니까. 이건 사실 ngrok 같은 프로덕션 터널링 도구도 쓰는 기본 패턴이다.
"상관 ID(correlation id)"로 비동기 스트림 위에 요청/응답 의미를 얹는 것.

## 잊으면 새는 것들: 타임아웃과 연결 종료

여기서 끝내면 위험하다. `pendingRequests`에 넣기만 하고 안 지우면 **메모리가
샌다.** 로컬 클라이언트가 영영 응답을 안 줄 수도 있으니까. 그래서 두 가지
정리 장치를 뒀다.

**1. 타임아웃** — 30초 안에 응답이 없으면 504로 끊고 목록에서 제거한다.

```js
const timeout = setTimeout(() => {
  if (pendingRequests.has(requestId)) {
    pendingRequests.delete(requestId);
    if (!res.headersSent) res.status(504).send("Gateway Timeout");
  }
}, 30000);
```

**2. 방문자가 먼저 떠난 경우** — 브라우저가 연결을 끊으면(`res`의 `close`),
그 대기 항목도 지운다.

```js
res.on("close", () => {
  if (pendingRequests.has(requestId)) pendingRequests.delete(requestId);
});
```

전송 실패(`ws.send` 예외)나 요청 스트림 에러도 각각 502로 처리하고 목록에서
지운다. **"들어온 건 반드시 지운다"** 를 모든 경로에서 지키는 게 핵심이었다.

## 배운 것

- 프로토콜의 의미(요청↔응답)가 안 맞을 땐 **상관 ID로 얹으면** 된다. 이건
  메시지 큐, RPC, WebSocket 등 어디서나 반복되는 패턴이다.
- 비동기로 "대기 중인 것"을 담아두는 자료구조(`Map`)는, **모든 종료 경로에서
  반드시 비워야** 한다. 성공·타임아웃·연결끊김·에러 — 하나라도 빠지면
  메모리 누수다.
- 단방향 스트림 위에 양방향 의미를 세우는 건, 생각보다 적은 코드로 되지만
  **엣지 케이스 처리가 8할**이었다.

- 관련 프로젝트: [Custom Tunnel](/category/Web/2026-07-02-custom-tunnel/)
