---
layout: post
title: 리액트 컴포넌트 라이프 사이클

tags: [React]
category: [React]
---

## 컴포넌트 라이프 사이클 & 주요 메소드 호출 순서

### 컴포넌트 라이프 사이클이란?

컴포넌트 라이프 사이클은 컴포넌트의 생성부터 소멸에 이르는 일련의 이벤트로 생각할 수 있다. 모든 리액트 컴포넌트는 Lifecycle을 갖는다. Lifecycle은 세가지 로 나뉨

- Mounting: 컴포넌트가 화면에 나타남
- Updating: 컴포넌트가 업데이트됨
- Unmounting: 컴포넌트가 화면에서 사라짐

![image](https://user-images.githubusercontent.com/49175629/155884206-66139c56-0f5d-402b-bda4-9b5054c6ea9a.png)

Lifecycle마다 메소드를 가지고 있어 이를 이용해 특정 시점에 원하는 동작을 하도록 만들 수 있다.

### Mounting

컴포넌트의 인스턴스가 생성되어 DOM 상에 삽입되는 단계. 이는 Lifecycle이 종료된 때까지 한번만 일어난다.

1. constructor: 컴포넌트의 인스턴스를 새로 만들 때 마다 생성자 메소드가 호출됨
2. static getDerivedStateFromProps(nextProps, prevState)
3. render: 화면에 표현될 JSX를 반환하고 화면에 그림
4. componentDidMount: 컴포넌트가 화면에 모두 그려진 이후 호출됨(첫 렌더링 이후 실행, API 호출을 하기 좋은 위치, 데이터를 받아 올 때 setState메서드를 이용하여 컴포넌트를 업데이트 할 수 있다.)

### Updating

props 또는 state가 변경되어 컴포넌트가 업데이트 되는 단계

1.  static getDerivedStateFromProps
2.  shouldComponentUpdate
3.  render: 데이터가 변경되면 자동으로 호출, 화면을 다시 그림
4.  getSnapshotBeforeUpdate
5.  componentDidUpdate: 화면이 다시 그려진 이후 호출됨

### Unmounting

컴포넌트가 DOM 상에서 제거되는 단계.

- componentWillUnmount: 컴포넌트가 화면에서 제거되기 전에 호출됨.

### 라이프 사이클 메소드 호출 순서

마운팅과 업데이팅 단계에서 메소드 호출 순서
![image](https://user-images.githubusercontent.com/49175629/155884474-32161395-b5b8-4035-96d8-6d307b0e4642.png)
