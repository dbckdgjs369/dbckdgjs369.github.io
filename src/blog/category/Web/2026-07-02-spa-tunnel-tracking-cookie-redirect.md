---
layout: post
title: "SPA 새로고침에도 터널이 안 풀리게 — URL·쿠키·리다이렉트로 세션 추적하기"
category: [Web]
project: custom-tunnel
date: 2026-07-02
---

[터널](/category/Web/2026-07-02-custom-tunnel/)에서 은근히 골치 아팠던 문제.
공개 URL은 `https://server/abc12345/page` 처럼 앞에 **터널 ID(`abc12345`)** 가
붙는다. 서버는 이 ID로 "어느 로컬로 보낼지"를 안다. 그런데—

- 페이지 안의 리소스는 `/main.js`, `/logo.png`처럼 **절대 경로**로 요청된다.
  여기엔 터널 ID가 없다. 어느 로컬로 보내야 하지?
- React Router 같은 SPA에서 `/abc12345/about`을 보다가 **새로고침**하면
  브라우저는 `/about`으로 요청한다. 역시 ID가 없다.

즉 "터널 ID를 URL에 계속 붙이고 다닐 수 없다"는 게 문제였다.

## 해결: URL로 한 번 심고 → 쿠키로 기억 → 리다이렉트로 지운다

핵심 아이디어는 **터널 ID를 URL에서 쿠키로 옮기는 것**이다.

**1단계.** URL 맨 앞에 터널 ID가 있으면, 그걸 **쿠키에 저장**하고 ID를 뗀
경로로 **302 리다이렉트**한다.

```js
const pathMatch = req.path.match(/^\/([a-f0-9]{8})(\/.*)?$/);
if (pathMatch) {
  const tunnelId = pathMatch[1];
  const pathWithoutTunnelId = pathMatch[2] || "/";

  // 쿼리스트링은 버리지 않고 그대로 보존한다
  const queryString = req.url.includes("?")
    ? req.url.substring(req.url.indexOf("?"))
    : "";
  const fullPath = pathWithoutTunnelId + queryString;

  res.cookie("tunnelId", tunnelId, {
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,          // 프로덕션은 HTTPS에서만
    maxAge: 24 * 60 * 60 * 1000,   // 24시간
  });

  return res.redirect(302, fullPath); // /abc12345/about?tab=1 → /about?tab=1
}
```

이제 브라우저 주소창은 깔끔한 `/about`이 되고, 브라우저는 `tunnelId` 쿠키를
갖게 된다.

**2단계.** 이후 모든 요청(`/main.js`, `/api/data`, 새로고침한 `/about`)은
쿠키를 달고 온다. 서버는 **쿠키에서 터널 ID를 읽어** 해당 로컬로 보낸다.

```js
else if (req.cookies.tunnelId) {
  tunnelId = req.cookies.tunnelId;
  fullPath = req.url; // 경로 그대로 로컬로 전달
}
```

**3단계(폴백).** 쿠키가 안 실려 오는 경우도 있다(일부 리소스, 초기 로드
타이밍). 먼저 **query parameter**(`?tunnelId=...`)를 확인하고, 있으면 그걸
쓰면서 쿠키도 다시 심어 다음 요청부터는 쿠키로 처리한다.

```js
else if (req.query.tunnelId) {
  tunnelId = req.query.tunnelId;
  res.cookie("tunnelId", tunnelId, cookieOptions); // 다음부턴 쿠키로
}
```

**4단계(최후 폴백).** 그것도 없으면 **Referer 헤더**에서 ID를 긁어낸다.
manifest.json처럼 쿠키가 전달되지 않는 요청을 위해서다.

```js
else if (req.headers.referer) {
  const m = req.headers.referer.match(/\/([a-f0-9]{8})(\/|$)/);
  if (m) tunnelId = m[1];
}
```

URL → 쿠키 → query parameter → Referer, 네 단계 폴백으로 **어떤 요청이 와도
터널 ID를 복원**한다. SPA를 새로고침해도, 이미지가 절대경로로 요청돼도,
터널이 안 풀린다.

## SameSite, 정확히 따져보면

처음엔 "다른 도메인이니 크로스 사이트겠지" 하고 넘겼는데, 따져보면 아니다.
방문자는 터널 도메인에 **직접 접속**하고(퍼스트 파티), 주입 스크립트의
`fetch /log`도 같은 오리진으로 나간다. 즉 **same-site 상황**이라 원칙적으론
`SameSite=Lax`로도 충분히 동작한다.

- 실제 코드는 `sameSite: isProduction ? "none" : "lax"` — 로컬은 `Lax`,
  프로덕션은 방어적으로 `None + Secure`를 뒀다. 나중에 페이지가 iframe에
  임베드되는 등 진짜 크로스 사이트가 될 경우를 대비한 여유분이지, 지금
  구조에서 필수는 아니다. (`SameSite=None`은 `Secure`가 강제라 프로덕션은
  HTTPS 전제.)
- CORS 응답에 `Access-Control-Allow-Credentials: true` — 자격증명(쿠키)
  동반 요청을 허용.

"왜 쿠키가 안 심기지?"로 한참 헤매다가, 퍼스트 파티/서드 파티와 SameSite의
의미를 정확히 구분하게 된 부분이다.

## 배운 것

- **상태를 URL에 계속 들고 다닐 수 없을 때, 쿠키로 옮기고 URL은 깨끗하게**
  만드는 건 흔한 웹 패턴이다. (302 리다이렉트가 그 이사 트럭 역할.)
- 하나의 소스만 믿지 말고 **URL → 쿠키 → query parameter → Referer** 처럼
  폴백을 쌓으면 견고해진다.
- 쿠키의 `SameSite`는 도메인이 아니라 **퍼스트 파티/서드 파티 문맥**으로
  판단해야 한다. 브라우저 보안 모델을 대충 알면 여기서 막힌다.

- 관련 프로젝트: [Custom Tunnel](/category/Web/2026-07-02-custom-tunnel/)
