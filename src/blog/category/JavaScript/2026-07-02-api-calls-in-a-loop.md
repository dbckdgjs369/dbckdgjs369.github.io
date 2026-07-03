---
layout: post
title: "반복문에서 API 호출하기 — forEach가 안 되던 이유, 그리고 Promise.all의 오해"
category: [JavaScript]
project: youtube-playlist-generator
date: 2026-07-02
---

[YouTube Playlist Generator](/category/React/2026-07-02-youtube-playlist-generator/)를
만들 때, 곡 목록을 순회하며 각 곡을 검색하고 재생목록에 넣는 코드를 짰다.
그런데 **`forEach`로 짰더니 이상하게 동작하던 코드가, `for...of`로 바꾸니
멀쩡히 돌아갔다.** 그때는 "되니까 넘어가자" 했지만, 뭐가 다른지 제대로
파봤다. 예전에 이 주제로 글을 한 번 썼는데, 다시 검증해보니 **내가 틀렸던
부분도 있었다.** 이번엔 실제로 코드를 돌려 확인한 결과로 정리한다.

## 검증용 코드

아래처럼 "API 호출"을 흉내 낸다. id가 클수록 **빨리** 끝나게 만들어서,
호출한 순서와 완료되는 순서가 뒤섞이도록 했다.

```js
const ids = [1, 2, 3, 4, 5];
const fakeApi = (id) =>
  new Promise((res) => setTimeout(() => res(id), (6 - id) * 60));
```

## 1. forEach — async를 기다려주지 않는다

내가 처음 짠 코드가 이거였다. (git 기록을 보니 진짜로 이랬다 😅)

```js
console.time("forEach");
const results = [];
ids.forEach(async (id) => {
  const r = await fakeApi(id);
  results.push(r);
});
console.timeEnd("forEach");
console.log("forEach 직후:", results);
```

실제 출력:

```
forEach: 0.21ms
forEach 직후: []
(500ms 뒤): [ 5, 4, 3, 2, 1 ]
```

**`console.timeEnd`가 0.21ms 만에 찍힌다.** `forEach`는 콜백이 돌려준
Promise를 **거들떠보지도 않기** 때문이다. 콜백을 죽 실행만 하고 바로
다음 줄로 넘어간다. 그래서 `forEach` 직후엔 `results`가 텅 비어 있고,
한참 뒤에야 완료된 순서(`5,4,3,2,1`)대로 채워진다.

내 프로젝트에서 무슨 일이 벌어졌냐면 — 검색이 끝나기도 전에 "다음 단계"가
실행돼서, 아직 안 만들어진 재생목록에 곡을 넣으려다 깨졌다. `forEach`가
`await`를 기다린다고 착각한 게 원인이었다.

> [MDN도 명시한다](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach):
> forEach는 promise를 기다리지 않는다("it does not wait for promises").

## 2. for...of — 순차적이고, 확실하고, 느리다

`for...of`는 루프 안의 `await`에서 **진짜로 멈춘다.** 하나 끝나야 다음으로
간다.

```js
console.time("for...of");
const seq = [];
for (const id of ids) {
  seq.push(await fakeApi(id));
}
console.timeEnd("for...of");
```

```
for...of: 904.705ms
결과: [ 1, 2, 3, 4, 5 ]
```

순서도 완벽하고 동작도 확실하다. 대신 **느리다.** 각 호출 시간이 그대로
합산된다(60+120+…+300 ≈ 900ms). 곡이 많으면 답답할 만큼 느려진다.

## 3. map + Promise.all — 동시에 쏘기

`map`은 `forEach`와 달리 **콜백의 반환값으로 새 배열을 만든다.** async 콜백을
넣으면 **Promise들의 배열**이 나온다. 이걸 `Promise.all`로 한 번에 기다린다.

```js
console.time("Promise.all");
const done = [];
const promises = ids.map(async (id) => {
  const r = await fakeApi(id);
  done.push(r);        // 완료되는 순서대로 쌓인다
  return r;
});
const all = await Promise.all(promises);
console.timeEnd("Promise.all");
console.log("완료된 순서:", done);
console.log("결과 배열:", all);
```

```
Promise.all: 301.521ms
완료된 순서: [ 5, 4, 3, 2, 1 ]
결과 배열:  [ 1, 2, 3, 4, 5 ]
```

`for...of`가 904ms인데 이건 **301ms**. 기다리지 않고 다 쏴버린 뒤 한꺼번에
모으니, 전체 시간이 "가장 오래 걸리는 하나(300ms)"에 수렴한다.

## 그때 내가 틀렸던 것: "Promise.all이 순서를 보장한다"

예전 글에서 나는 "Promise.all이 순서를 보장한다"고 뭉뚱그려 썼다. 절반만
맞는 말이었다. 위 출력이 정확히 보여준다.

- **완료되는 순서**는 보장되지 않는다 → `done = [5, 4, 3, 2, 1]`
  (빨리 끝난 게 먼저 쌓인다)
- **`Promise.all`이 돌려주는 결과 배열의 순서**는 입력 순서 그대로다
  → `all = [1, 2, 3, 4, 5]`

즉 `Promise.all`은 **실행을 순서대로 하는 게 아니라, 결과를 입력 순서에
맞춰 정렬해서 돌려줄 뿐**이다. 실행 자체는 동시에 흩어진다. 예전의 나는
이 둘을 헷갈렸다.

그리고 하나 더. 흔히 "병렬(parallel)"이라고 하지만, JavaScript는 싱글
스레드다. CPU가 여러 개로 도는 게 아니라, **네트워크 I/O를 기다리는 시간이
겹치는** 것뿐이라 정확히는 "동시(concurrent)"에 가깝다.

## 진짜 교훈: 빠른 게 항상 정답은 아니다

여기까지만 보면 "그럼 무조건 map + Promise.all이 최고네?" 싶다. 그런데
내 프로젝트의 **최종 코드**는 이렇게 나뉘어 있다.

- **곡 검색(읽기)** → `map + Promise.all` (동시, 빠름)
- **재생목록에 곡 추가(쓰기)** → `for` 루프 + `await` (순차)

```js
// 검색: 동시에
const result = await Promise.all(checkValue.map((song) => searchVideo(...)));

// 추가: 하나씩 순차적으로
for (let i = 0; i < songArr.length; i++) {
  await addToPlayList(accessToken, playlistId, songArr[i].videoId);
  setProgress({ done: i + 1, total: songArr.length });
}
```

왜 추가는 순차로 했냐면 — 재생목록 추가는 **같은 재생목록을 여러 요청이
동시에 수정하는 쓰기 작업**이기 때문이다. YouTube의 `playlistItems.insert`를
동시에 여러 개 쏘면 같은 리소스를 동시에 고치려다 **409 CONFLICT**로 실패하기
쉽다. 그리고 무엇보다 재생목록은 **넣는 순서**가 결과물이다 — 동시에 쏘면
완료 순서가 뒤섞여서 곡 순서를 보장할 수 없다. 그래서 실제 코드도 `for` 루프
안에서 하나씩 `await`하며, 한 곡 끝날 때마다 진행률을 갱신하는 구조다.

그래서 결론은 이렇게 정리됐다.

| 상황 | 선택 | 이유 |
|------|------|------|
| 순서·성공이 중요, 소량 | `for...of` + await | 확실함 |
| 다수의 **읽기**, 속도 중요 | `map` + `Promise.all` | 동시 처리로 빠름 |
| **쓰기**를 대량으로 | 순차 or 동시성 제한 | 동시 수정 충돌·순서 보장 |
| async를 순회 | **`forEach`는 쓰지 말 것** | await를 안 기다림 |

덤으로 알아둘 것: `Promise.all`은 **하나만 실패해도 전체가 즉시 실패**한다
(fail-fast). "일부 실패는 넘어가고 싶다"면 `Promise.allSettled`, "동시에
너무 많이 쏘는 게 문제"라면 한 번에 N개씩만 처리하는 **동시성 제한**을
쓰면 된다.

## 정리

- `forEach` + async는 **await를 기다리지 않는다.** 순회 비동기엔 쓰지 말자.
- `for...of` + await는 순차적·확실하지만 느리다.
- `map` + `Promise.all`은 동시에 처리해 빠르고, **결과 배열의 순서는**
  입력순으로 보장한다. (단, 실행/완료 순서는 아니다.)
- 그리고 제일 중요한 것 — **읽기는 동시에, 쓰기는 조심스럽게.** 빠른 게
  늘 옳은 건 아니었다.

예전의 나는 "map이 제일 빠르니 최고"라고 결론 냈지만, 실제로 서비스를
굴려보니 답은 상황마다 달랐다. 틀렸던 걸 다시 짚어보는 것도 성장이라
믿는다.

- 관련 프로젝트: [YouTube Playlist Generator](/category/React/2026-07-02-youtube-playlist-generator/)
