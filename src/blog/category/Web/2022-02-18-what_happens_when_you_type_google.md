---
layout: post
title: "What Happens When You Type Google?"

tags: [Web]
date: 2022-02-18 16:38:07 +0900
category: [Web]
---

## 브라우저에 www.google.com을 검색했을 때 일어나는 일

[본문](https://medium.com/@maneesha.wijesinghe1/what-happens-when-you-type-an-url-in-the-browser-and-press-enter-bb0aa2449c1a)

## 번역 및 정리

<br/>

1. 구글맵을 검색바에 입력한다.

2. 브라우져가 cache에서 maps.google.com에 해당하는 DNS(Domain Name Space) 기록을 찾아본다.

   ### 4가지 cache

   - 먼저 브라우저 cache를 찾아본다.
   - 두번째로 OS cache를 찾아본다.
     브라우저 캐시에 없었다면 OS는 시스템 콜을 날려서 확인해 볼 것이다.
   - 세번째로 라우터 cache를 확인한다. 내 컴퓨터에 없다면 브라우져는 라우터와 통신하여 DNS 기록을 찾는다.
   - 네번째로 ISP cache를 확인한다. 내 ISP는 자기만의 DNS 서버를 가진다. 여기에 DNS 기록들이 있다. 이곳을 확인하는것.
     <br/><br/><br/>

3. 만약 요청받은 URL이 캐시에 없다면 ISP의 DNS 서버가 maps.google.com에 해당하는 서버의 IP주소를 찾는 DNS 쿼리를 만들어 날린다.

   DNS쿼리는 여러 DNS 서버 중 올바른 IP주소를 찾는 것이다.=> recursive search(DNS서버에서 DNS서버로 IP주소를 찾을 때까지 계속 반복하기 때문)
   만약 발견하지 못하면 에러발생시킴.
   오늘날 우리가 사용하는 대부분의 URL은 third-level domain, second-level domain, top-level domain이다.

4. 브라우저가 서버와 TCP 연결을 시작한다.

   브라우저가 IP주소를 받으면 일치하는 서버와 연결을 시작한다. 여러 프로토콜이 있지만 TCP가 HTTP request에서 가장 많이 사용되는 프로토콜이다.
   TCP/IP three-way-handshake로 연결이 성사된다. (syn와 ack를 주고 받는거==> 클라이언트가 syn패킷을 서버에게 날림, 새로운 연결요청=> 서버가 열린 포트가 있으면 SYN/ACK패킷 날림=> 클라이언트가 이걸 받고 ACK을 다시 날려 받았다고 알려줌)

5. 브라우저가 HTTP request를 웹서버에 전송함.

   TCP 연결이 완료되었으면 데이터를 전송할 차례이다. 브라우져가 maps.google.com 웹페이지에 대한 GET request를 보낸다.(만약 form을 제출한다면 POST) 여기에는 브라우저 정보, request 타입, TCP연결을 계속 유지하기 위한 connection header등이 있다. + 브라우저가 도메인으로 부터 저장한 쿠키에서 정보를 전달한다.

6. 서버가 request를 처리하고, response를 보내준다.

   웹서버를 포함하고 있는 서버는 request를 받아서 request handler에게 넘겨 읽히고, response를 생성한다. request handler는(ASP.NET,PHP,Ruby...) 필요한 경우 서버의 정보를 업데이트하기 위해 요청을 확인하고 헤더 및 쿠키를 읽는 프로그램이다. 이후 특정 포맷으로 response를 변경시킨다.(JSON, XML, HTML)

7. 서버가 HTTP response를 보낸다.

   서버 응답에는 요청한 웹페이지와 상태코드, 압축 유형, 페이지 캐시 방법, 설정할 쿠키, 개인 정보등이 포함된다.

   ### HTTP response

   - 1xx: 정보만 담긴 메세지라는 것을 의미
   - 2xx: response가 성공적이라는 것을 의미
   - 3xx: 클라이언트를 다른 URL로 리다이렉트함을 의미
   - 4xx: 클라이언트 측에서 에러가 발생을 의미
   - 5xx: 서버 측에서 에러가 발생했음을 의미
     <br/><br/><br/>

8. 브라우저가 HTML 콘텐츠를 보여준다.

   처음에는 HTML의 스켈레톤을 렌더링=> HTML tag들을 체크=> 추가적으로 필요한 웹페이지 요소들을(이미지, css, js파일 등) GET으로 요청=> 이 정적이 파일들은 브라우저에 의해 키싱이 되서 나중에 해당 페이지를 방문할 대 다시 서버로 부터 불러와지지 않도록 한다.=> 드디어 www.google.com의 모습이 보인다.

<br/><br/><br/>
&ensp;학과 전공시간에 배운 데이터 통신, 컴퓨터네트워크와 분산시스템 부분이 나와 좀 더 쉽게 이해 할 수 있었다.
