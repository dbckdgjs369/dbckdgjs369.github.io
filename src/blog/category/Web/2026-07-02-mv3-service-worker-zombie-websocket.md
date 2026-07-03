---
layout: post
title: "열려있는데 죽어있다 — Manifest V3 Service Worker의 좀비 WebSocket 다루기"
category: [Web]
project: stock-price-widget
date: 2026-07-02
---

[실시간 시세 크롬 확장](/category/Web/2026-07-02-stock-price-widget/)을
만들면서 가장 오래 씨름한 건 **"실시간 연결이 자꾸 조용히 죽는"** 문제였다.
Manifest V3(MV3)로 넘어오면서 브라우저 확장의 백그라운드가 근본적으로
바뀌었기 때문이다.

## 문제 1: Service Worker는 언제든 꺼진다

MV3에서 백그라운드는 **Service Worker**다. 예전 MV2의 background page와 달리
**유휴 상태가 되면 브라우저가 그냥 종료**해버린다. 그러면 그 안에서 돌던
`WebSocket`, `setInterval`, `setTimeout`이 전부 사라진다. 실시간 시세를
받아야 하는 확장 입장에선 치명적이다.

(정확히 하면, Chrome 116부터는 **활성 WebSocket으로 메시지가 오가면 SW의
idle 타이머가 리셋**되어 연결이 SW를 계속 살려둘 수 있다. 하지만 이건
"메시지가 실제로 흐를 때" 얘기다. 소켓이 조용해지거나 뒤에서 다룰 좀비
상태가 되면 SW는 여전히 종료된다. 결국 "언제든 꺼진다"는 전제는 유효하다.)

해결의 실마리는 `chrome.alarms`였다. 이건 SW가 꺼져 있어도 브라우저가
깨워준다. 그래서 1분마다 SW를 깨워서 **모든 걸 복구**하게 했다.

```js
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== REFRESH_ALARM) return;
  // SW가 죽었다가 알람으로 다시 뜨면 전역 상태(구독 키)가 초기화돼 있다.
  // 그래서 syncRealtimeTargets가 "구독이 없네" 하고 WebSocket을 새로 만든다.
  refreshQuotes();
  syncRealtimeTargets();       // ← SW 재기동 시 WebSocket 재구축
  scheduleForegroundRefresh(); // ← 폴링 타이머 복구
});
```

즉, 알람 콜백은 "시세 한 번 새로고침"이 아니라 **죽었을지 모를 시스템 전체를
되살리는 부활 지점**이다.

한 가지 짚고 갈 게 있는데, `syncRealtimeTargets`는 구독할 심볼 목록이
**이전과 같으면 early-return** 한다. 그래서 SW가 살아있는 채로 소켓만 죽은
경우엔 알람이 못 살린다. 알람의 역할은 어디까지나 **SW 자체가 죽었다
되살아났을 때**의 재구축이다. 살아있는 SW 안의 죽은 소켓은 뒤에서 다룰
**15초 헬스체크 타이머**가 잡는다. 이 타이머는 매번 "최근에 데이터를
받았는가"를 확인하고, 아니면 재연결을 시도한다. 여기에 소켓이 닫힐 때
구독 키를 초기화해서, 다음 `syncRealtimeTargets`가 early-return으로 죽은
연결을 방치하지 않게 했다.

## 문제 2: 연결이 "열려있는데 죽어있다" (좀비)

더 까다로운 건 이거였다. `socket.readyState`가 `OPEN`인데도 데이터가 안 온다.
네트워크가 끊겼는데 `onclose`가 안 불리는 **half-open** 상태. TCP 특성상
흔히 생긴다. `readyState`만 믿으면 "연결돼 있네" 하고 방치하게 된다.

그래서 **"마지막 수신 시각"** 을 기준으로 좀비를 판정했다.

```js
const REALTIME_STALE_MS = 40 * 1000; // 40초 동안 아무것도 안 오면 좀비

async function ensureRealtimeConnection() {
  if (realtimeSocket?.readyState === WebSocket.OPEN) {
    const stale =
      lastRealtimeEventAt && Date.now() - lastRealtimeEventAt > REALTIME_STALE_MS;
    if (!stale) {
      sendRealtimeSubscription("replace");
      return;
    }
    closeRealtimeSocket(); // OPEN이어도 죽었다 판단 → 강제 재연결
  }
  // ... 새 소켓 생성
}
```

메시지를 받을 때마다 `lastRealtimeEventAt = Date.now()`를 찍고, 40초 넘게
소식이 없으면 `readyState`가 뭐라 하든 끊고 다시 연결한다.

## 문제 3: 재연결 폭풍 (thundering herd)

서버가 잠깐 재시작되면, 모든 클라이언트가 **동시에** 재연결을 시도한다.
가뜩이나 힘든 서버에 순간 폭탄이 떨어진다. 그래서 **지수 백오프 + 지터**를
넣었다.

```js
const RECONNECT_BASE_MS = 1000;      // 1초에서 시작
const RECONNECT_MAX_MS = 60 * 1000;  // 최대 60초

function scheduleRealtimeReconnect() {
  const backoff = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** attempt);
  const jitter = Math.floor(Math.random() * (backoff * 0.3)); // ← 무작위 지터
  const delay = backoff + jitter;
  attempt++;
  setTimeout(() => ensureRealtimeConnection(), delay);
}
```

- **지수 백오프**: 1초 → 2초 → 4초 … 실패할수록 간격을 벌린다.
- **지터**: 여기에 무작위 시간을 더해, 클라이언트들의 재연결 시점을 흩뿌린다.
  모두가 정확히 같은 순간에 몰리는 걸 막는다.

## 종합: 세 겹으로 살아남기

결국 실시간을 이렇게 세 겹으로 쌓았다.

1. **WebSocket** — 정상일 땐 이게 실시간을 담당
2. **15초 헬스체크 폴링** — WS가 끊기거나 좀비면 재연결을 시도하고, 그동안 REST로 메운다
3. **1분 알람** — SW 자체가 죽었다 되살아났을 때 전부 재구축한다

각 계층이 서로의 실패를 덮어준다. "연결은 언젠가 반드시 끊긴다"를 전제로
설계하니, 오히려 안정적으로 굴러갔다.

## 배운 것

MV3 확장 개발은 "백그라운드가 항상 살아있다"는 가정을 버리는 데서 시작한다.
그리고 `readyState === OPEN`은 "연결이 살아있다"는 보장이 **아니다.** 진짜
살아있는지는 **실제로 최근에 데이터를 받았는가**로 판단해야 한다. 네트워크를
다루는 코드는 전부 "죽었을 때 어떻게 되살릴까"를 먼저 설계해야 한다는 걸
몸으로 배웠다.

- 관련 프로젝트: [Stock Price Widget](/category/Web/2026-07-02-stock-price-widget/)
