---
layout: post
title: "코드 수정 없이 원격 브라우저의 콘솔 로그 가져오기 — HTML 주입 + console 오버라이드"
category: [Web]
project: custom-tunnel
date: 2026-07-02
---

[터널](/category/Web/2026-07-02-custom-tunnel/)로 로컬 서버를 폰에 띄웠을 때,
정작 답답한 건 **"폰에서 뭐가 잘못됐는지 콘솔을 볼 수 없다"** 는 것이었다.
폰 브라우저의 개발자 도구를 여는 건 번거롭다. 그래서 넣은 기능이
**원격 콘솔 로그 모니터링** — 터널을 통해 접속한 브라우저의 `console.log`가
VSCode 사이드바에 실시간으로 뜬다.

여기서 지킨 원칙 하나: **사용자(개발자)의 코드는 한 줄도 건드리지 않는다.**

## 아이디어: 응답 HTML에 스크립트를 몰래 끼워넣기

터널은 어차피 모든 응답이 로컬 클라이언트를 거쳐 나간다. 그러니 **HTML 응답일
때, `</head>` 앞에 작은 스크립트를 주입**하면 된다. 개발자 코드가 아니라
**터널이** 넣는 것이라, 사용자는 아무것도 안 해도 된다.

```js
if (response.status === 200 && ct.includes("text/html")) {
  const script = `
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<script data-tunnel-script="${Date.now()}">
  /* ...아래 내용... */
</script>`;
  responseBody = responseBody.replace("</head>", script + "</head>");
}
```

HTML 파서를 돌리지 않고 `</head>` 문자열만 찾아 바꾼다. 빠르고 충분했다.
`data-tunnel-script`에 타임스탬프를 박고 캐시 방지 메타를 함께 넣어, 브라우저가
옛 스크립트를 캐싱하는 것도 막았다.

## 핵심: console을 감싸되, 원본은 보존한다

주입된 스크립트는 `console.log` 같은 메서드를 **가로채서**, 원래 동작은
그대로 하고 **추가로 서버에 전송**한다. IIFE(즉시 실행 함수)로 감싸 원본
참조를 클로저에 안전하게 보관했다.

```js
(function () {
  var tunnelId = getCookie("tunnelId"); // 쿠키에서 터널 ID
  if (!tunnelId) return;

  var original = { log: console.log, warn: console.warn,
                   error: console.error, info: console.info };

  function sendLog(level, args) {
    var message = Array.from(args).map(function (a) {
      try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
      catch { return String(a); }
    }).join(" ");

    fetch(tunnelServerUrl + "/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tunnelId: tunnelId, level: level, message: message }),
    }).catch(function () {}); // 실패해도 앱에 영향 없게 조용히 무시
  }

  console.log = function () { original.log.apply(console, arguments); sendLog("log", arguments); };
  console.warn = function () { original.warn.apply(console, arguments); sendLog("warn", arguments); };
  console.error = function () { original.error.apply(console, arguments); sendLog("error", arguments); };
  console.info = function () { original.info.apply(console, arguments); sendLog("info", arguments); };
})();
```

포인트가 몇 개 있다.

- **원본을 먼저 호출**한다. 그래야 실제 콘솔에도 정상적으로 찍힌다.
- 객체 인자는 `JSON.stringify`로 문자열화하되, 순환 참조 등으로 실패하면
  `String()`으로 폴백.
- 로그 전송(`fetch`)이 실패해도 `.catch(()=>{})`로 **삼킨다.** 로깅 기능이
  앱 동작을 방해하면 안 되니까.

## 로그가 VSCode까지 가는 길

전송된 로그는 이렇게 흘러 사이드바에 뜬다.

```
브라우저 console.log
  → fetch POST /log (터널 ID·레벨·메시지)
  → 공개 서버: 해당 터널의 WebSocket으로 push
  → 로컬 클라이언트 → VSCode 확장
  → Webview 콘솔 패널에 실시간 렌더
```

Webview 쪽은 레벨(LOG/WARN/ERROR) 필터와 검색, 그리고 **사용자가 위로
스크롤하면 자동 스크롤을 끄고, 맨 아래로 오면 다시 켜는** 지능형 오토스크롤도
넣었다. 로그 뷰어에서 "새 로그 때문에 보던 위치가 튀는" 흔한 짜증을 없앤
디테일이다.

## 배운 것

- **몽키 패칭(원본 함수 감싸기)** 은 강력하다. 단, "원본을 반드시 먼저
  호출"하고 "부가 기능 실패가 원본을 망치지 않게" 하는 두 원칙을 지켜야
  안전하다.
- 사용자 코드를 안 건드리고 기능을 얹는 방법으로 **응답 HTML 주입**은 아주
  실용적이다. (개발 도구들이 흔히 쓰는 수법이기도 하다.)
- 로깅·계측 같은 부가 기능은 **절대 본체를 방해하면 안 된다.** 실패는 조용히
  삼키는 게 옳다.

- 관련 프로젝트: [Custom Tunnel](/category/Web/2026-07-02-custom-tunnel/)
