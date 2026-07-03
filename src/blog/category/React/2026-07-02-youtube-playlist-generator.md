---
layout: post
title: "유튜브 댓글의 타임라인을 내 재생목록으로 — 손으로 하던 걸 자동화했다"
category: [React]
project: youtube-playlist-generator
date: 2026-07-02
---

## 노래는 좋은데, 몇 곡이 걸린다

유튜브에서 "Lo-fi 1시간 모음", "재즈 플레이리스트" 같은 긴 영상을 자주 듣는다.
이런 영상은 댓글에 꼭 **타임라인**이 달려 있다.

```
00:00 곡A - 가수1
03:24 곡B - 가수2
07:11 곡C - 가수3
...
```

문제는, 한 시간짜리 안에 내가 별로인 곡도 섞여 있다는 것. **마음에 드는
곡만 골라 내 재생목록으로** 만들고 싶은데, 그러려면 곡을 하나하나 검색해서
재생목록에 추가해야 한다. 20곡이면 20번. 이게 은근히 귀찮았다.

그래서 만들었다. **타임라인 텍스트를 붙여넣으면, 원하는 곡만 골라 YouTube
재생목록으로 자동 생성**해주는 웹앱. 이름은 YPG(YouTube Playlist Generator).

> 붙여넣기 → 원하는 곡 체크 → 생성 버튼. 끝.

## 전체 흐름

만들고 보니 큰 흐름은 네 단계였다.

1. **로그인** — Google OAuth로 YouTube 계정 권한을 받는다
2. **파싱** — 붙여넣은 타임라인에서 "곡명 - 가수"만 뽑아낸다
3. **검색 & 선택** — 각 곡을 YouTube에서 검색하고, 원하는 영상을 고른다
4. **생성** — 새 재생목록을 만들고 고른 곡들을 담는다

하나씩 풀어본다.

## 1. 지저분한 텍스트에서 곡명만 뽑기

사용자가 붙여넣는 타임라인은 형식이 제각각이다. `00:00`, `[1:02:03]`,
`1) 곡명`, `01. 곡명 - 가수`… 여기서 **타임스탬프와 트랙 번호를 걷어내고
곡명만** 남겨야 검색이 된다. 정규식으로 처리했다.

```ts
const makeList = (songList: string[]) =>
  songList.map((value) =>
    value
      // [00:00], (1:02:03), 00:00, 1:02:03 형태의 타임스탬프 제거
      .replace(/[[(]?\s*\d{1,2}:\d{2}(?::\d{2})?\s*[)\]]?/g, " ")
      // 앞머리의 "1.", "01)", "1)" 같은 트랙 번호 제거
      .replace(/^\s*\d{1,3}[.)]\s+/, " ")
      // 연속 공백 정리
      .replace(/\s+/g, " ")
      .trim()
  );
```

붙여넣은 문자열을 줄 단위로 쪼개고, 위 함수로 정리한 뒤 **`Set`으로 중복을
제거**한다. (같은 곡이 두 번 적힌 타임라인도 흔하다.)

```ts
setSongList([...new Set(makeList(raw.split("\n")))]);
```

여기서 배운 것 하나: 처음엔 공백을 `join(" ")`으로 대충 이어붙였는데, 그러면
"곡명가수"처럼 붙어버려서 **검색 정확도가 떨어졌다.** 공백을 살리는 정규식
치환으로 바꾸니 검색이 훨씬 잘 됐다. 사소해 보이는 전처리가 결과 품질을
좌우했다.

## 2. Google OAuth로 YouTube 권한 받기

재생목록을 만들려면 사용자의 YouTube 계정 권한이 필요하다. Google OAuth 2.0
**Authorization Code** 방식을 썼다.

먼저 동의 화면으로 보낸다. `access_type=offline`을 주면 **refresh token**을
받을 수 있어서, 매번 다시 로그인하지 않아도 된다.

```ts
const REDIRECT_URI = `${window.location.origin}/create`;
const SCOPE = "https://www.googleapis.com/auth/youtube";
const url =
  `https://accounts.google.com/o/oauth2/auth` +
  `?prompt=consent&access_type=offline` +
  `&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}` +
  `&response_type=code&scope=${SCOPE}`;
```

동의하면 `?code=...`를 달고 `/create`로 돌아온다. 이 code를 access token으로
교환하고, refresh token은 쿠키에 저장해둔다.

```ts
const token = await getAccessToken({ code: auth });
setCookie("refresh_token", token.data.refresh_token, { /* ... */ });
```

다음부터는 쿠키의 refresh token으로 access token을 새로 발급받는다.

```ts
const refresh_token = getCookie("refresh_token");
const accessToken = await getAccessTokenByRefreshToken({ refresh_token });
```

리다이렉트 URI를 `window.location.origin` 기준으로 동적으로 만든 게 포인트다.
로컬(`localhost:3000`)과 배포(vercel) 양쪽에서 코드 수정 없이 동작한다.
(대신 Google Console의 "승인된 리디렉션 URI"에 두 도메인을 다 등록해야 한다 —
여기서 한참 헤맸다.)

> **솔직한 한계:** 이 프로젝트는 프론트엔드에서 직접 토큰 교환을 하느라
> `client_secret`이 클라이언트에 노출된다. 그리고 refresh token도 문제다 —
> 코드에서 쿠키에 `httpOnly: true` 옵션을 줬지만, **HttpOnly는 서버가
> `Set-Cookie` 헤더로만 설정할 수 있어서 JS의 `setCookie`에서는 조용히
> 무시된다.** 결국 refresh token이 JS로 접근 가능한 쿠키에 평문으로 저장되는
> 셈이라 XSS에 그대로 노출된다. 개인용 토이 프로젝트라 넘어갔지만, 제대로
> 하려면 토큰 교환과 토큰 보관 모두 **서버(또는 서버리스 함수)**에서 해야
> 한다. 이건 다음에 고칠 숙제로 남겨뒀다.

## 3. 검색하고, 고르고, 담기

체크한 곡들을 YouTube Data API로 검색한다. 곡마다 검색 결과가 여러 개라,
**모달을 띄워 사용자가 정확한 영상을 고르게** 했다. (라이브 버전, 커버,
다른 가수의 동명 곡 등을 걸러내기 위해.)

```ts
const promises = checkValue.map(async (song) => {
  const res = await searchVideo({
    key: API_KEY, part: "snippet", q: song, maxResults: 5, type: "video",
  });
  // 결과에서 videoId/제목/썸네일을 모아 모달에 보여준다
});
```

고른 곡이 정해지면 재생목록을 만들고 하나씩 담는다.

```ts
// 새 재생목록 생성 (기본 비공개)
await createNewPlayList(title, accessToken, "private");
// 각 영상을 재생목록에 추가
await addToPlayList(accessToken, playlistId, videoId);
```

곡이 많으면 시간이 걸리므로 `progress`(done/total) 상태로 진행률을 보여줘서,
"멈춘 거 아냐?" 하는 불안을 없앴다.

## 가장 크게 부딪힌 벽: API 할당량(quota)

만들면서 제일 크게 데인 부분. YouTube Data API는 **하루 할당량**이 있는데,
그냥 요청 수가 아니라 **작업별 비용(unit)** 으로 계산된다. 특히
**검색(`search.list`)이 요청당 100 units**로 유독 비싸다. 기본 할당량이
하루 10,000 units이니, **검색만 하면 하루 100번이면 끝**이다.

곡 20개짜리 타임라인 하나만 돌려도 검색 2,000 units가 순식간에 나간다.
"왜 갑자기 안 되지?" 하고 보면 quota 초과였다. 이걸 겪고 나서

- 불필요한 재검색을 막고(같은 곡 중복 제거가 여기서도 도움이 됐다),
- 개발 중엔 실제 API를 계속 때리지 않도록 **MSW(Mock Service Worker)로
  응답을 목킹**해서 할당량을 아꼈다.

"외부 API에는 눈에 안 보이는 비용과 한계가 있다"는 걸 몸으로 배운 프로젝트였다.

## 마치며

`곡 20개 × 검색 + 추가`를 손으로 하면 10분 넘게 걸리던 일이, 붙여넣기 →
체크 → 버튼 한 번으로 줄었다. 내가 매주 겪던 사소한 귀찮음 하나가, 실제로
쓰는 도구가 된 순간이었다.

- 배포: [youtube-playlist-generator.vercel.app](https://youtube-playlist-generator.vercel.app)
- GitHub: [Youtube_Playlist_Generator](https://github.com/dbckdgjs369/Youtube_Playlist_Generator)
