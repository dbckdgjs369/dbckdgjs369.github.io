---
layout: post
title: Restful Api

tags: [Web]
category: [Web]
---

## Restful Api

Restful API란 REST 아키텍처의 제약 조건을 준수하는 애플리케이션 프로그래밍 인터페이스를 뜻 한다. REST는 <b>Re</b>presentational <b>S</b>tate <b>T</b>ransfer의 줄임말이다.

### API (Application Programming Interface)

API란 애플리케이션 소프트웨어를 구축하고 통합하는 정의 및 프로토콜 세트이다. 즉, 컴퓨터나 시스템과 상호작용하여 정보를 검색하거나 기능을 수행하고자 할 때 사용자가 원하는 것을 시스템에 전달할 수 있게 지원한다.

API의 또 다른 이점은 리소스 검색방법 또는 리소스의 출처에 대한 지식 없이도 사용이 가능하다.

간단하게 URI와 HTTP 메소드를 이용해 객체화된 서비스에 접근하는 것.

- 리소스
- 메소드
- 메시지

메소드는 4가지 메소드 GET,POST,PUT,DELETE를 사용

==> Restful하게 API를 디자인 한다는 것은 URI를 규칙에 맞게 잘 설계했는지의 여부.

1. 동일한 URI의 행위에 맞게 POST, GET, DELETE, PATCH 등의 메소드를 사용
2. 명사를 사용, 리스트를 표현할 때는 복수형
3. URI Path에 불필요한 파라미터를 넣지 않는다.
