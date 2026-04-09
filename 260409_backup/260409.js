$(function () {
  // 쿠폰 스크래치
  const startDate = '2026-04-09 14:00:00';
  const endDate = '2026-04-15 13:59:59';

  $('.coupon_area .txt.before').html(getRemainingMessage(startDate, endDate));

  const canvas = document.getElementById('scratchCanvas');
  const ctx = canvas.getContext('2d');

  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  // 덮개
  const coverImg = new Image();
  coverImg.src = '/custom/img/event/260409/scratch.jpg'; // 👉 원하는 이미지 경로

  coverImg.onload = function () {
    ctx.drawImage(coverImg, 0, 0, canvas.width, canvas.height);

    // 긁기 모드
    ctx.globalCompositeOperation = 'destination-out';
  };

  // 브러시
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 120;

  let isPlayed = false;

  // 👉 퍼센트 좌표 정의 (여기만 바꾸면 됨)
  const points = [
    { x: 0.1, y: 0.0 }, // top 0 left 10%
    { x: 0.0, y: 0.8 }, // top 80 left 0
    { x: 0.4, y: 0.0 }, // top 0 left 40%
    { x: 0.2, y: 1.0 },
    { x: 0.7, y: 0.2 },
    { x: 0.5, y: 1.0 },
    { x: 1.0, y: 0.3 }
  ];

  canvas.addEventListener('click', () => {
    if (isPlayed) return;
    isPlayed = true;
    animatePath();
  });

  function animatePath() {
    let i = 0;
    let t = 0;

    ctx.beginPath();

    // 시작점
    let start = getPoint(points[0]);
    ctx.moveTo(start.x, start.y);

    function draw() {
      const p1 = getPoint(points[i]);
      const p2 = getPoint(points[i + 1]);

      t += 0.065;

      // 👉 두 점 사이 보간 (lerp)
      const x = lerp(p1.x, p2.x, t);
      const y = lerp(p1.y, p2.y, t);

      ctx.lineTo(x, y);
      ctx.stroke();

      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
        // 다음 구간
        i++;
        t = 0;

        if (i < points.length - 1) {
          requestAnimationFrame(draw);
        } else {
          finish();

          $('.coupon_area .txt.before').hide();
          $('.coupon_area .txt.after').show();
        }
      }
    }

    draw();
  }

  // 퍼센트 → 실제 좌표 변환
  function getPoint(p) {
    return {
      x: p.x * canvas.width,
      y: p.y * canvas.height
    };
  }

  // 선형 보간
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // 마무리
  function finish() {
    canvas.style.transition = 'opacity 0.4s';
    canvas.style.opacity = 0;
  }

  // 영역 내 이미지 전환
  $('.sec02_tab').click(function () {
    const ON_CLASS = $(this).data('is-on');

    $('#sec02 img').each(function () {
      if ($(this).hasClass(ON_CLASS)) {
        $(this).addClass('on');
      } else {
        $(this).removeClass('on');
      }
    });
  });

  // 이미지 클릭 → 해당 탭 활성화 + 스크롤
  $('.scrollTo04').click(function (e) {
    e.preventDefault();
    let headerHeight = $('header').outerHeight();
    // header_top_bnr가 있을 경우 높이 추가
    if ($('.header_top_bnr').length) {
      headerHeight += $('.header_top_bnr').outerHeight();
    }
    let tabHeight = $('.tab').outerHeight();

    const tabNo = $(this).data('tab-no');

    // 해당 탭 버튼 찾기
    const $btn = $('#pdlistTab button[data-cate-no="' + tabNo + '"]');

    // 탭 활성화
    if ($btn.length) {
      $btn.trigger('click');
    }

    // 스크롤 이동
    $('html, body').animate(
      {
        scrollTop: $('#sec04').offset().top - headerHeight - tabHeight - 10
      },
      300
    );
  });

  // sec03
  $('.blank')
    .height($('.tab').outerHeight() + $('header').outerHeight())
    .css('margin-top', -$('.tab').outerHeight() - $('header').outerHeight());
  $(window).resize(function () {
    $('.blank')
      .height($('.tab').outerHeight() + $('header').outerHeight())
      .css('margin-top', -$('.tab').outerHeight() - $('header').outerHeight());
  });
  const ACTIVE_LINK = [
    '/product/detail.html?product_no=1562',
    '/product/detail.html?product_no=1563',
    '/product/detail.html?product_no=1564',
    '/product/detail.html?product_no=1565',
    '/product/detail.html?product_no=1566'
  ];

  $('.time_deal .swiper-slide').each(function () {
    const PRD_NO = $(this).data('prd-no');

    $(`.${PRD_NO} img`).appendTo(this);
  });
  let timeLine = new Swiper('.time_line', {
    slidesPerView: 'auto',
    spaceBetween: getSpaceBetween()
  });

  let timeDeal = new Swiper('.time_deal', {
    slidesPerView: '1',
    spaceBetween: 0,
    navigation: {
      nextEl: '.deal_wrap .swiper-button-next',
      prevEl: '.deal_wrap .swiper-button-prev'
    },
    on: {
      slideNextTransitionStart: function () {
        let activeTab = $('.time_deal .swiper-slide-active').index();
        $('.time_line .swiper-slide').eq(activeTab).addClass('on').siblings().removeClass('on');
        timeLine.slideTo(activeTab);
        $('#imgmap202643165332 area').attr('href', ACTIVE_LINK[activeTab]);
      },
      slidePrevTransitionStart: function () {
        let activeTab = $('.time_deal .swiper-slide-active').index();
        $('.time_line .swiper-slide').eq(activeTab).addClass('on').siblings().removeClass('on');
        timeLine.slideTo(activeTab);
        $('#imgmap202643165332 area').attr('href', ACTIVE_LINK[activeTab]);
      }
    }
  });
  $('.time_line .swiper-slide').click(function () {
    const index = $(this).index();

    // active 클래스
    $('.time_line .swiper-slide').removeClass('on');
    $(this).addClass('on');

    // 해당 슬라이드로 이동
    timeLine.slideTo(index);
    timeDeal.slideTo(index);
  });
  $(window).resize(function () {
    timeLine.params.spaceBetween = getSpaceBetween();
    timeLine.update();
  });

  // sec04
  const url = window.location.href;
  const cateNo = new URL(url).searchParams.get('cate_no');

  let prdTab = new Swiper('#pdlistTab', {
    slidesPerView: 'auto',
    spaceBetween: 10
  });
  prdTab.slideTo($(`#pdlistTab .swiper-slide[data-cate-no=${cateNo}]`).index());

  $('#pdlistTab .swiper-slide').click(function () {
    const index = $(this).index();

    // active 클래스
    $('#pdlistTab .swiper-slide').removeClass('active');
    $(this).addClass('active');

    // 해당 슬라이드로 이동
    prdTab.slideTo(index);
  });
});

function getRemainingMessage(startDate, endDate) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    $('.scratch-container .defend').attr('data-popup', 'popupBefore');
    return '4월 9일 오후 2시 발행 예정';
  }
  if (now <= end) {
    if (!!$('.scratch-container .defend').attr('data-popup')) {
      $('.scratch-container .defend').hide();
    }
    return '쿠폰을 뽑아보세요.';
  }
  $('.scratch-container .defend').attr('data-popup', 'popupAfter');
  return '이벤트가 종료되었습니다.'; // endDate 지난 경우 문구
}

function getSpaceBetween() {
  const vw = window.innerWidth;

  const min = 18; // 1.125rem
  const max = 43; // 2.6875rem
  const preferred = 1.333 + vw * 0.046296;

  return Math.max(min, Math.min(max, preferred));
}
