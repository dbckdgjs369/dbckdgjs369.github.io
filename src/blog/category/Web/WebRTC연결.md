# 화상, 음성 채팅 연결

## 서버

- mqtt

[https://github.com/mqttjs/MQTT.js](https://github.com/mqttjs/MQTT.js)

[https://github.com/mqttjs/MQTT.js#react:~:text=</html>-,React,-npm install -g](https://github.com/mqttjs/MQTT.js#react:~:text=%3C/html%3E-,React,-npm%20install%20%2Dg)

### QoS

- QoS 0 : received **at most once** : The packet is sent, and that's it. There is no validation about whether it has been received.
- QoS 1 : received **at least once** : The packet is sent and stored as long as the client has not received a confirmation from the server. MQTT ensures that it *will* be received, but there can be duplicates.
- QoS 2 : received **exactly once** : Same as QoS 1 but there is no duplicates.

### 버그

- url 문제
  ⇒ 해결 방법
  [Unable to resolve module `url` from `node_modules/mqtt/lib/connect/index.js · Issue #1020 · mqttjs/MQTT.js](https://github.com/mqttjs/MQTT.js/issues/1020#issuecomment-565948999)
- User2.js:134 Error adding received ice candidate DOMException: Failed to execute 'addIceCandidate' on 'RTCPeerConnection': The remote description was null 에러
  ⇒ 해결방법
  [WebRTC 간헐적 연결 실패 문제 해결 (Failed to execute 'addIceCandidate')](https://velog.io/@njw1204/WebRTC-간헐적-연결-실패-문제-해결)

### 사용방법

1. 연결(connect)

   ```jsx
   const client = mqtt.connect(DEFAULT_CONNECT_OPTIONS)
   ```

2. 구독(subscribe)

   ```jsx
   client.subscribe(topic/topic array/topic object, [options], [callback])
   ```

3. 발행(publish)

   ```jsx
   mqtt.Client#publish(topic, message, [options], [callback])
   ```

같은 topic으로 구독을 하고 발행을 하면 topic을 구독하고 있는 곳에서 메시지를 받을 수 있음

## 클라이언트

- WebRTC

## 작동 순서

1. 로컬 스트림을 생성하고 사용자의 화면에 띄운다.

   ```jsx
   const myVideoRef= useRef();
   const localStream = navigator.mediaDevices.getUserMedia({video:true, audio:true})})
   myVideoRef.current.srcObject = stream;
   ```

2. `const peerConnection= new RTCPeerConnection(Option)` 생성
3. mqtt 서버를 열고 같은 topic을 구독한다.
4. 로컬의 localStream을 peerConnection 객체에 추가한다.

   ```jsx
   localStream.getTracks().forEach(track => {
     peerConnection.addTrack(track, localStream)
   })
   ```

5. offer를 만든다.

   1. ⇒ 만든 offer는 peerConnection의 localDescription에 저장한다.
   2. offer를 mqtt 서버를 통해 보낸다.
   3. 전송할 때 보낸 사람이 누구인지 함께 보내서 자신이 보낸 offer를 저장하지 않게 한다.

   ```jsx
   const offer = peerConnection.createOffer(offerOptions) // 전송자
   client.publish(
     "signal",
     JSON.stringify({ offer: offer, username: USER_NAME })
   )
   ```

   ```jsx
   client.on("message", async (topic, message) => {
     // 수신자
     const receivedMsg = JSON.parse(message.toString())
     if (receivedMsg.answer && receivedMsg.username !== USER_NAME) {
       peerConnection.setRemoteDescription(
         new RTCSessionDescription(receivedMsg.answer)
       )
     }
   })
   ```

   1. 수신자는 offer를 받으면 자신의 peerConnection의 remoteDescription에 저장을 한다.
      1. 받

![image](https://user-images.githubusercontent.com/49175629/222094266-26113963-e942-4444-b2fe-10d8201aca57.png)

## 간단하게

### 사전단계

1. mqtt 서버 열고 같은 topic 구독하기
2. localStream, peerConnection 객체 생성
3. peerConnection에 localStream 객체 추가

### 통신

- user1
  1. peerConnection에서 offer를 만듬 ⇒ 만드는 순간 연결가능한 icecandidate들이 생성됨
  2. offer를 로컬 peerConnection의 setLocalDescription을 사용하여 localDescription으로 지정
  3. mqtt 서버를 통해 offer를 publish함 ⇒ 보낸사람 이름도 같이 전송(자신이 보낸 offer인것을 구분)
- user2
  1. 같은 topic을 구독하고 있던 user2는 message가 offer이고, offer를 보낸 것이 자신이 아니면 setRemoteDescription을 통해 자신의 peerConnection 객체의 remoteDescription으로 추가한다.
  2. peerConnection.createAnswer를 통해서 answer를 만든다.
  3. answer를 peerConnection의 localDescription으로 지정
  4. mqtt 서버로 answer를 publish
- user1
  1. user2가 보낸 answer를 받은 user1은 자신의 remoteDescription에 추가한다.

⇒ 연결 완료

### 이후 작업

로컬에서 icecandidate가 발생할 때 감지하는 이벤트 .onicecandidate로 icecandidate를 서버로 전송

서버에서 듣고 있던 user2는 peerConnection.addIceCandidate로 추가

상대가 track을 추가하는 것을 감지하는 이벤트 peerConnection.addEventListener("track") 로 추가되면 내 화면의 상대 비디오 부분에 추가
