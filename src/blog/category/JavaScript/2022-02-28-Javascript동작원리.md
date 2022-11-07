---
layout: post
title: "Javascript 동작 원리"
author: Yoo Chang Heon
tags: [Javascript]
category: [JavaScript]
---

## 자바스크립트 엔진

대표적으로 Googlee V8 엔진이 있다. V8은 Chrome 과 Node.js에서 사용.

엔진의 주요 두 구성요소

- Memory Heap: 메모리 할당이 일어나는 곳
- Call Stack: 코드 실행에 따라 호출 스택이 쌓이는 곳

## 호출 스택(Call Stack)

자바스크립트는 기본적으로 싱글쓰레드 기반 언어. 호출스택이 하나 => 한 번에 한 작업만 처리

호출 스택은 기본적으로 우리가 프로그램 상에서 어디에 있는지를 기록하는 자료구조

호출 스택의 각 단계를 스택 프레임

싱글 스레드 기반 코딩은 멀티 스레드 환경에서 제기되는 복잡한 문제나 시나리오를 고민하지 않아도 되기 때문에 상당히 쉽다.(데드락) But 제약이 많음 => 한개의 호출 스택을 갖고 있는 자바스크립트의 실행이 느려지면 어떻게 될까?

## 동시성(Concurrency)&이벤트 루프(Event Loop)

호출 스택에 처리 시간이 오래 걸리는 함수가 있을 때 => 호출 스택에서 해당 함수가 실행되는 동안 브라우저는 아무 작업도 못하고 대기 상태가 된다. ==> 브라우저는 페이지를 그리지도 못하고, 어느 코드도 실행을 못한다.

브라우저가 호출 스택의 정말 많은 작업들을 처리하다 보면 화면이 아마 오랫동안 응답하지 않을 것 => 이 경우 대부분의 브라우저가 에러를 띄우면서 페이지를 종료할 건지 물어봄.

### 해결방안

페이지 렌더링 동작을 방해하지 않고, 브라우저의 응답도 끊지 않으면서 연산량이 많은 코드 실행하는 방법 ==> <b>비동기 콜백</b>

![image](https://user-images.githubusercontent.com/49175629/155934946-176aa5e7-6c06-4f16-8551-95b8b9821c7c.png)

자바스크립트를 웹 브라우저에서 작동하기 위해서는 JS 엔진, Web APIs, Callback Queue, EventLoop영역 필요

JS 엔진에서는 단일 호출 스택(Call Stack)을 이용하여 동기적으로 요청을 처리하고 나머지 영역에서 웹 브라우저 환경 속에서의 자바스크립트가 비동기적으로 처리할 수 있게 지원해주는 역할을 한다.(비동기적으로 동작하는 동시성은 JS 엔진을 구동하는 환경인 웹 브라우저나 Node.js에서 지원)

## Web APIs

Web APIs는 브라우저에서 자체 제공하는 API로, 비동기 작업등을 실행할 수 있는 DOM, Ajax, setTimeout 등이 있다.
WebApIs는 JS 엔진 밖에 존재. JS 엔진까지가 자바스크립트를 동기적으로 작동, WebAPIs 부터 자바스크립트를 비동기적으로 작동

Call Stack에서 실행된 비동기 함수는 Web API를 통해 호출하고, Web API는 콜백 함수를 Callback Queue에 push합니다.

### 비동기적으로 자바스크립트가 수행되는 구조

1. 코드가 Call Stack에 쌓인 후, 비동기 함수는 Web API에게 위임합니다.

2. Web API는 비동기 작업을 수행하고, 콜백 함수를 Callback Queue에 push합니다.

3. 이벤트 루프는 Call Stack에 비어있을 때, Callback Queue에 대기하고 있던 콜백 함수를 콜스택으로 push합니다.

4. 콜스택에 쌓인 콜백 함수가 실행되고, 콜스택에서 pop 됩니다.

## Callback Queue

비동기적으로 실행된 콜백함수가 보관되는 영역으로 FIFO로 출력

## Event Loop

이벤트 루프는 단일 호출 스택을 사용하는 자바 스크립트 엔진과 상호 연동하기 위해 사용하는 장치

이벤트 루프를 통해서 동시성을 지원받을 수 있다. 이벤트 루프는 Call Stack과 Callback Queue를 감시하며 Call Stack이 비어있을 경우 Callback Queue 에서 함수를 꺼내 Call Stack에 추가하는 기능을 한다. 이와 같은 반복적인 행동을 틱(tick)이라 부른다.이벤트 루프가 Callback Queue에서 Call Stack으로 콜백 함수를 넘겨주는 작업은 콜스택에 쌓여있는 함수가 없을 때만 수행합니다.
