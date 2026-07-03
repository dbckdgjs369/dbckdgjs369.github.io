---
layout: post
title: "ngrok을 직접 만들었다 — 로컬 서버를 공개 URL로 여는 VSCode 확장"
category: [Web]
project: custom-tunnel
date: 2026-07-02
---

## "지금 로컬에서 도는 거, 폰으로 좀 볼 수 있을까?"

개발하다 보면 자주 겪는다. 로컬(`localhost:3000`)에서 돌고 있는 걸 **폰으로
확인**하고 싶거나, **다른 사람에게 잠깐 보여주고** 싶을 때. ngrok 같은
터널링 도구를 쓰면 되지만, 매번 터미널을 켜고 명령어를 치고 URL을 복사하는
흐름이 번거로웠다. 나는 VSCode 안에서 버튼 하나로 끝내고 싶었다.

그래서 만들었다. **Custom Tunnel** — 로컬 개발 서버를 공개 URL로 열어주는
VSCode 확장. 사이드바에서 포트만 넣고 시작하면 공개 URL과 QR 코드가 나오고,
심지어 **원격 브라우저의 콘솔 로그까지** VSCode 안에서 실시간으로 본다.

그런데 "터널"이 실제로 어떻게 동작하는지는, 만들기 전엔 나도 막연했다.
직접 만들어보니 그 안에 재미있는 문제가 잔뜩 있었다.

## 터널은 어떻게 뚫리나

핵심 구조는 이렇다.

```
외부 방문자 ──HTTP──▶ 공개 서버(Render 배포)
                         │  ▲
              WebSocket  │  │  (양방향 터널)
                         ▼  │
                     로컬 클라이언트 ──HTTP──▶ localhost:3000
```

포인트는 **로컬에서 바깥으로 WebSocket을 하나 연다**는 것이다. 방화벽·NAT
안에 있는 로컬 머신은 외부에서 직접 접근할 수 없다. 대신 로컬이 **먼저**
공개 서버로 WebSocket 연결을 열어두면, 그 연결을 통로 삼아 바깥의 요청을
안으로 끌어올 수 있다.

흐름을 따라가면:

1. 외부 방문자가 공개 URL(`https://…/abc12345/page`)에 접속
2. 공개 서버가 그 HTTP 요청을 **WebSocket으로 로컬 클라이언트에 전달**
3. 로컬 클라이언트가 `localhost:3000`에 실제로 요청
4. 응답을 다시 WebSocket으로 서버에 돌려줌
5. 서버가 원래 방문자에게 응답

이 단순해 보이는 왕복에, 생각보다 까다로운 문제들이 숨어 있었다.

## 이 프로젝트에서 판 것들

- **[단방향 WebSocket을 양방향 요청/응답으로](/category/Web/2026-07-02-websocket-request-response-matching/)** — UUID와 Map으로 동시 요청 매칭하기
- **[이미지·폰트를 텍스트 채널로 나르기](/category/Web/2026-07-02-tunneling-binary-over-websocket/)** — Base64와 Content-Type 자동 교정
- **[SPA 새로고침에도 터널이 안 풀리게](/category/Web/2026-07-02-spa-tunnel-tracking-cookie-redirect/)** — URL → 쿠키 → 리다이렉트 추적
- **[코드 수정 없이 원격 콘솔 로그 가져오기](/category/Web/2026-07-02-remote-console-injection/)** — HTML 주입 + console 오버라이드

## 덤: "사용자 PC에 Node가 없어도" 돌게 하기

VSCode 확장에서 로컬 클라이언트(Node 스크립트)를 자식 프로세스로 띄워야 하는데,
사용자 PC에 Node가 설치돼 있으리란 보장이 없다. PATH가 꼬여 있을 수도 있다.
여기서 영리한 트릭 하나. **VSCode(=Electron) 안에는 이미 Node가 들어 있다.**
그 Node를 그대로 빌려 쓴다.

```ts
const tunnelProcess = spawn(process.execPath, args, {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
});
```

`process.execPath`는 실행 중인 VSCode(Electron) 바이너리 경로이고,
`ELECTRON_RUN_AS_NODE=1`을 주면 그게 **순수 Node처럼** 동작한다. 사용자
환경의 Node 설치 여부와 완전히 무관해진다. 단 두 줄로 "환경 의존성"이라는
골칫거리를 지웠다.

- GitHub: [debug_tool (Custom Tunnel)](https://github.com/dbckdgjs369/debug_tool)
