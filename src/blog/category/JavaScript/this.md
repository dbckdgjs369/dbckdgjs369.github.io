---
layout: post
title: "this"
date: 2022-12-25
category: [JavaScript]
---

this의 값은 함수를 호출한 방법에 의해 결정된다.(**함수가 호출될 때 결정된다.**)

```js
const car = {
  name: "KIA",
  getName: function () {
    console.log("car getName", this)
  },
}
car.getName() // car getName {name: 'KIA', getName: ƒ}
```

```js
const car2 = {
  name: "hyundai",
  getName: car.getName,
}
car2.getName() // car getName {name: 'hyundai', getName: ƒ}
```

## this 값을 고정시키는 방법

### .bind()

```js
const bindGetname = car2.getName.bind(car)
bindGetname() //car getName {name: 'KIA', getName: ƒ}
```

## 화살표 함수

```js
const testCar = {
  name: "benz",
  getName: function () {
    console.log("getName", this) // getName {name: 'benz', getName: ƒ}
    const innerFunc = function () {
      console.log("innerFunc", this) // innerFunc Window {0: Window, window: Window, self: Window, document: document, name: '', location: Location, …}
    }
    innerFunc()
  },
}

testCar.getName()
```
