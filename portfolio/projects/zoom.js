/* 스크린샷 확대 — 프로젝트 상세 페이지 공용
   ------------------------------------------------------------------
   스크린샷은 본문 글줄 폭(약 700px, 좁은 컷은 380px)에 눌러 넣는다.
   차트 축 숫자·팝업 라벨·콘솔 로그는 그 폭에서 읽히지 않으므로 원본을 볼 길을 준다.

   <dialog> 를 쓰는 이유: 포커스 가둠·Esc 닫기·backdrop 을 브라우저가 처리한다.
   직접 만들면 그 셋을 손으로 해야 하고 대개 포커스 처리를 빼먹는다. */
(function () {
  var shots = document.querySelectorAll('figure.shot img');
  if (!shots.length || !window.HTMLDialogElement) return;

  var dlg = document.createElement('dialog');
  dlg.className = 'zoom';
  dlg.innerHTML =
    '<button class="close" type="button" aria-label="닫기">닫기 ESC</button>' +
    '<div class="stage"><img alt=""></div>' +
    '<div class="hint"></div>';
  document.body.appendChild(dlg);

  var img = dlg.querySelector('img');
  var hint = dlg.querySelector('.hint');

  /* 1:1 = 이미지 픽셀 하나가 물리 픽셀 하나에 대응하는 폭.
     2x 로 찍은 2880px 컷을 2x 화면에서 2880 CSS px 로 띄우면 5760 물리 픽셀로
     늘어나 흐려질 뿐 정보가 늘지 않는다. 촬영 배율을 알 필요 없이
     보는 쪽 배율로 나누면 「더 볼 게 남은 최대 크기」가 나온다. */
  function actualWidth() {
    return Math.round(img.naturalWidth / (window.devicePixelRatio || 1));
  }

  /* 화면에 맞춘 폭이 이미 그만큼 크면 토글은 아무것도 하지 않는다.
     좁은 컷은 1:1 이 오히려 작아지기도 한다 — 그 경우 확대를 제공하지 않는다.
     할 일이 없는데 「클릭하면 원본 크기」를 띄우면 없는 기능을 광고하는 것이다. */
  var zoomable = false;
  function measure() {
    dlg.classList.remove('actual');
    zoomable = actualWidth() > img.getBoundingClientRect().width * 1.15;
    hint.textContent = zoomable ? '클릭하면 원본 크기(1:1)' : '';
    img.style.cursor = zoomable ? '' : 'default';
  }

  function setMode(actual) {
    if (actual && !zoomable) return;
    dlg.classList.toggle('actual', actual);
    if (actual) dlg.style.setProperty('--zw', actualWidth() + 'px');
    hint.textContent = actual ? '1:1 · 클릭하면 전체 보기' : '클릭하면 원본 크기(1:1)';
  }

  function open(src, alt) {
    img.src = src;
    img.alt = alt || '';
    dlg.classList.remove('actual');
    hint.textContent = '';
    document.documentElement.classList.add('zoom-open');
    dlg.showModal();
    /* 캐시에 없으면 이 시점에 크기를 알 수 없어 측정이 어긋난다 */
    if (img.complete) measure();
    else img.addEventListener('load', measure, { once: true });
  }

  Array.prototype.forEach.call(shots, function (el) {
    el.addEventListener('click', function () { open(el.currentSrc || el.src, el.alt); });
  });

  img.addEventListener('click', function () {
    setMode(!dlg.classList.contains('actual'));
    /* 1:1 로 넘어갈 때 가로 중앙을 잡아준다 — 왼쪽 끝에서 시작하면 대개 빈 여백이다 */
    if (dlg.classList.contains('actual')) dlg.scrollLeft = (dlg.scrollWidth - dlg.clientWidth) / 2;
  });

  dlg.querySelector('.close').addEventListener('click', function () { dlg.close(); });
  /* 사진 밖(매트)을 누르면 닫는다 — stage 가 화면 전체를 덮으므로 대상으로 판정 */
  dlg.querySelector('.stage').addEventListener('click', function (e) {
    if (e.target !== img) dlg.close();
  });
  dlg.addEventListener('close', function () {
    document.documentElement.classList.remove('zoom-open');
    /* 스크롤을 되돌리지 않으면 다음에 열 때 이전 위치가 남는다 */
    dlg.scrollTop = 0; dlg.scrollLeft = 0;
  });

  /* 창 크기가 바뀌면 맞춤 폭이 달라져 토글 가능 여부도 달라진다 */
  window.addEventListener('resize', function () {
    if (dlg.open && !dlg.classList.contains('actual')) measure();
  });
})();
