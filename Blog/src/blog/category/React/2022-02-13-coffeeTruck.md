---
layout: post
title: I Love Coffee 커피트럭 만들기
author: Yoo Chang Heon
tags: [React, JavaScript]
category: [React]
---

## 결과물 링크

[React App](https://i-love-coffee-coffeetruck.vercel.app/)

# 주요 코드에 대한 설명

## MiniGamePage.jsx

&ensp;컴포넌트들이 모여있는 페이지로 타이머와 시간, 점수, 콤보등이 표시된다. 시간이 다 되었을 때 시간, 점수, 콤보를 모두 초기화 시키는데 이를 BlockBox 컴포넌트가 알 수 없어서 time을 props로 전달해줬다.
<br/>&ensp;점수계산 방식은 없앤 블록 수 * (100-남은시간*콤보의 세제곱근)을 하여 시간이 적게 남고, 콤보가 많을 수록 많은 점수를 얻을 수 있게 하였다. ( number _ Math.floor(100 - time / 60) _ Math.floor(Math.sqrt(combo, 3)))
&ensp;상위의 컴포넌트에서 하위의 컴포넌트로는 props전달을 많이 해봤지만 반대의 경우는 처음 해봤는데 함수로 어떻게 사용할 것인지 미리 정의하고, 함수 자체를 하위로 넘겨줘서 하위에서 이 함수를 사용함으로써 구현했다.

## BlockBox.jsx

&ensp; 과일 블록들이 들어가는 6*6 크기의 컴포넌트이다. 크기는 6*6으로 js에는 이차원 배열이 딱히 없어서 크기 6의 배열을 선언하고 각 배열에 또 크기 6의 배열을 넣어주었다. 과일의 종류는 크게 4가지로 이 또한, 배열로 선언되어있고, 랜덤함수를 사용해서 4개의 과일 중 하나를 6\*6배열에 넣어준다.
<br/>
&ensp; 누른 블록이 3개 이상일 때 터지게 하기 위해 dfs를 사용하여 현재 클릭한 블록과 연결되어있는 같은 모양의 블록을 판별하게 하였다.
countdfs() 함수로 연결되어있는 블록 개수가 몇개인지 세어주고, 3개 보다 작다면 터뜨리지 않고, 3보다 같거나 크다면 dfs()함수로 none으로 만들어준다. 다음 fillEmptyBlock()함수를 사용해서 none으로 되어있는 블록이 있다면 그 위의 값을 아래로 내려서 블록이 터지고, 그 위에 있는 블록이 내려온 것 처럼 보이게 해주었다. 이를 맨 위의 값까지 해주면 결과적으로 맨 위의 블록만이 none값을 가지고 있을 것이다. 그럼 이 값들에 다시 랜덤한 과일을 넣어준다.
<br/>
&ensp;만약 모든 블록들이 3개미만으로 연결되어있을 경우 매번 block들이 바뀔 때마다 nothingToChoose()라는 함수가 돌면서 모든 36개의 블록에 countdfs()를 실행하며 3개 이상인지 찾고, 모두 3개 미만이라면 true를, 이상이라면 false를 반환하게 해주었다.
<br/>
&ensp;이 함수는 useEffect에서 사용되며 useEffect는 상위 컴포넌트에서 props로 받아온 time의 변화에 따라 실행되며 만약 time이 500(맨 처음 시작 값)이라면 새롭게 블록들을 넣어주고, 콤보값을 1로 해준다. 만약 nothingToChoose()가 true라면 nothing!이라는 alert창을 띄워주고, 새롭게 과일 블록들을 만들어 준다.

## Block.jsx

&ensp; blockBox컴포넌트에 들어가는 하나의 블록 컴포넌트이다.

## ProgressBar

&ensp; 시간을 재주는 타이머 역할로 우리가 흔히 사용하는 프로그래스 바와는 반대방향으로 움직인다. 총 500px의 너비를 가지고, MiniGamePage에서 time이 1초씩 증가할때 마다 증가하는 percent를 props로 받아와서 파란색 부분의 너비를 감소시킨다.

# 프로젝트를 진행할 때 어려웠던 점/ 고민했던 부분과 해결방법

크게 3가지가 어려웠다. 먼저 MiniGamePage와 컴포넌트간의 상태로 MiniGamePage에서 타이머가 가고있었기 때문에 시간이 끝났을 경우 컴포넌트단에서는 이 게임이 끝났는지 알 수 있는 방법이 없었다. 또, blockBox 컴포넌트에서 클릭했을 때 다음에 아무것도 누를것이 없을 경우 아무것도 없는 블록들을 보여주고, 리랜더 시키고 싶었는데 자꾸 클릭을 하자마자 이번 클릭에 대한 실행이 적용되지 않을 채로 리랜더를 시키는 부분이 매우 어려웠다. 이때 useEffect를 사용하고 싶었는데, 당연히 6\*6 array에 대해 실행하려고 dependency array에 넣어주니 too many rerender로 자꾸 에러가 나서 어려웠다.<br/>
=> MiniGamePage에서 시간을 props로 전달해서 이 시간이 바뀔 때마다로 useEffect를 사용했다.

### 부족한 부분

&ensp; 원작인 아이러브커피의 커피트럭 미니게임을 많이 구현하긴 했지만 애니메이션 부분은 적용하지 못했다. 또한, 별블록과 십자 블록도 있는데 원작 게임을 수만판을 했지만 어떤 조건에서 나오는지 알지 못하고, 별 블록 같은 경우 어디 범위까지 터지는지 알지 못했다. 또한 두 블록의 경우 애니메이션이 중요부분을 차지할 것 같아서 이 둘은 구현하지 않았다.

<br/>
<br/>

## 원작 게임

![image](https://user-images.githubusercontent.com/49175629/153847125-d1cff289-9f45-495a-a7d8-38611df5fe85.png)

## 만든 게임

![image](https://user-images.githubusercontent.com/49175629/153749710-2aa7e343-ae3d-493e-a654-29b7bb5303cd.png)
