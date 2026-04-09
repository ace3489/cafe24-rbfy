// ==============================
// 260409 이벤트 페이지 UI
// DB 기반 설정 (하드코딩 없음)
// ==============================

function getRemainingMessage(startDate, endDate) {
  var now = new Date();
  var start = new Date(startDate);
  var end = new Date(endDate);

  if (now < start) {
    return '4월 9일 오후 2시 발행 예정';
  }
  if (now <= end) {
    return '쿠폰을 뽑아보세요.';
  }
  return '이벤트가 종료되었습니다.';
}

function getSpaceBetween() {
  var vw = window.innerWidth;
  var min = 18;
  var max = 43;
  var preferred = 1.333 + vw * 0.046296;
  return Math.max(min, Math.min(max, preferred));
}

$(function () {

  // ==============================
  // DB에서 설정 로드 후 초기화
  // ==============================
  CouponSystem.loadConfig(function (config) {
    var startDate = config.startDate || '2026-04-09 14:00:00';
    var endDate = config.endDate || '2026-04-15 13:59:59';
    var resetTime = String(config.resetTime || '14:00:00').split(':');
    var resetH = parseInt(resetTime[0], 10) || 14;
    var resetM = parseInt(resetTime[1], 10) || 0;
    var resetS = parseInt(resetTime[2], 10) || 0;

    var now = new Date();
    var start = new Date(startDate);
    var end = new Date(endDate);
    var isEventActive = now >= start && now <= end;

    // 안내 문구
    $('.coupon_area .txt.before').html(getRemainingMessage(startDate, endDate));

    // 프로그래스바 + 자동 전환
    if (isEventActive) {
      // 리셋 시간 정각 자동 새로고침
      var now2 = new Date();
      var nextReset = new Date(now2);
      nextReset.setHours(resetH, resetM, resetS, 0);
      if (now2 >= nextReset) {
        nextReset.setDate(nextReset.getDate() + 1);
      }
      setTimeout(function () {
        window.location.reload();
      }, nextReset - now2);

      // 30초마다 프로그래스바 갱신
      function refreshProgress() {
        CouponSystem.loadProgress(function (data) {
          CouponSystem.updateProgressBar(data);
        });
      }
      refreshProgress();
      setInterval(refreshProgress, 30000);
    }

    // ==============================
    // 스크래치 영역 클릭 → 쿠폰 체크 + 발급
    // ==============================
    var $defend = $('.scratch-container .defend');

    if (isEventActive) {
      // 초기 상태 세팅
      CouponSystem.checkInitialState(function (state) {
        if (state === 'already') {
          $defend.attr('data-popup', 'popupLimits').show();
        } else if (state === 'soldout') {
          $defend.attr('data-popup', 'popupSoldout').show();
        } else {
          $defend.attr('data-popup', '').show();
        }
      });

      var isProcessing = false;

      $defend.click(function (e) {
        var popup = $(this).attr('data-popup');
        if (popup) return;

        if (isProcessing) return;
        isProcessing = true;

        e.preventDefault();
        e.stopPropagation();

        if (!CouponSystem.isLoggedIn()) {
          isProcessing = false;
          alert('로그인 후 이벤트 참여가 가능합니다.');
          window.location.href = '/member/login.html?step=1';
          return;
        }

        CouponSystem.handleCouponClick({
          onAlready: function () {
            isProcessing = false;
            $defend.attr('data-popup', 'popupLimits');
            $('#popupLimits').addClass('show');
            $('.popup_bg').addClass('show');
          },
          onSoldout: function () {
            isProcessing = false;
            $defend.attr('data-popup', 'popupSoldout');
            $('#popupSoldout').addClass('show');
            $('.popup_bg').addClass('show');
          },
          onSuccess: function (won) {
            $('#couponResultImg').attr('src', '/custom/img/event/260409/' + won.img);
            $defend.hide();
            if (!isPlayed) {
              isPlayed = true;
              animatePath();
            }
          }
        });
      });
    } else {
      // 이벤트 기간 외
      if (now < start) {
        $defend.attr('data-popup', 'popupBefore').show();
      } else {
        $defend.attr('data-popup', 'popupAfter').show();
      }
    }
  });

  // ==============================
  // 스크래치 카드
  // ==============================
  var canvas = document.getElementById('scratchCanvas');
  var ctx = canvas.getContext('2d');

  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;

  var coverImg = new Image();
  coverImg.src = '/custom/img/event/260409/scratch.jpg';

  coverImg.onload = function () {
    ctx.drawImage(coverImg, 0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
  };

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 120;

  var isPlayed = false;

  var points = [
    { x: 0.1, y: 0.0 },
    { x: 0.0, y: 0.8 },
    { x: 0.4, y: 0.0 },
    { x: 0.2, y: 1.0 },
    { x: 0.7, y: 0.2 },
    { x: 0.5, y: 1.0 },
    { x: 1.0, y: 0.3 }
  ];

  function animatePath() {
    var i = 0;
    var t = 0;

    ctx.beginPath();

    var startPt = getPoint(points[0]);
    ctx.moveTo(startPt.x, startPt.y);

    function draw() {
      var p1 = getPoint(points[i]);
      var p2 = getPoint(points[i + 1]);

      t += 0.065;

      var x = lerp(p1.x, p2.x, t);
      var y = lerp(p1.y, p2.y, t);

      ctx.lineTo(x, y);
      ctx.stroke();

      if (t < 1) {
        requestAnimationFrame(draw);
      } else {
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

  function getPoint(p) {
    return {
      x: p.x * canvas.width,
      y: p.y * canvas.height
    };
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function finish() {
    canvas.style.transition = 'opacity 0.4s';
    canvas.style.opacity = 0;
  }

  // ==============================
  // sec02: 영역 내 이미지 전환
  // ==============================
  $('.sec02_tab').click(function () {
    var ON_CLASS = $(this).data('is-on');

    $('#sec02 img').each(function () {
      if ($(this).hasClass(ON_CLASS)) {
        $(this).addClass('on');
      } else {
        $(this).removeClass('on');
      }
    });
  });

  $('.scrollTo04').click(function (e) {
    e.preventDefault();
    var headerHeight = $('header').outerHeight();
    if ($('.header_top_bnr').length) {
      headerHeight += $('.header_top_bnr').outerHeight();
    }
    var tabHeight = $('.tab').outerHeight();

    var tabNo = $(this).data('tab-no');
    var $btn = $('#pdlistTab button[data-cate-no="' + tabNo + '"]');

    if ($btn.length) {
      $btn.trigger('click');
    }

    $('html, body').animate(
      {
        scrollTop: $('#sec04').offset().top - headerHeight - tabHeight - 10
      },
      300
    );
  });

  // ==============================
  // sec03: 타임딜 스와이퍼
  // ==============================
  $('#sec02_2')
    .height($('.tab').outerHeight() + $('header').outerHeight())
    .css('margin-top', -$('.tab').outerHeight() - $('header').outerHeight());
  $(window).resize(function () {
    $('#sec02_2')
      .height($('.tab').outerHeight() + $('header').outerHeight())
      .css('margin-top', -$('.tab').outerHeight() - $('header').outerHeight());
  });

  var ACTIVE_LINK = [
    '/product/detail.html?product_no=1562',
    '/product/detail.html?product_no=1563',
    '/product/detail.html?product_no=1564',
    '/product/detail.html?product_no=1565',
    '/product/detail.html?product_no=1566'
  ];

  $('.time_deal .swiper-slide').each(function () {
    var PRD_NO = $(this).data('prd-no');
    $('.' + PRD_NO + ' img').appendTo(this);
  });

  var timeLine = new Swiper('.time_line', {
    slidesPerView: 'auto',
    spaceBetween: getSpaceBetween()
  });

  var timeDeal = new Swiper('.time_deal', {
    slidesPerView: '1',
    spaceBetween: 0,
    navigation: {
      nextEl: '.deal_wrap .swiper-button-next',
      prevEl: '.deal_wrap .swiper-button-prev'
    },
    on: {
      slideNextTransitionStart: function () {
        var activeTab = $('.time_deal .swiper-slide-active').index();
        $('.time_line .swiper-slide').eq(activeTab).addClass('on').siblings().removeClass('on');
        timeLine.slideTo(activeTab);
        $('#imgmap202643165332 area').attr('href', ACTIVE_LINK[activeTab]);
      },
      slidePrevTransitionStart: function () {
        var activeTab = $('.time_deal .swiper-slide-active').index();
        $('.time_line .swiper-slide').eq(activeTab).addClass('on').siblings().removeClass('on');
        timeLine.slideTo(activeTab);
        $('#imgmap202643165332 area').attr('href', ACTIVE_LINK[activeTab]);
      }
    }
  });

  $('.time_line .swiper-slide').click(function () {
    var index = $(this).index();
    $('.time_line .swiper-slide').removeClass('on');
    $(this).addClass('on');
    timeLine.slideTo(index);
    timeDeal.slideTo(index);
  });

  $(window).resize(function () {
    timeLine.params.spaceBetween = getSpaceBetween();
    timeLine.update();
  });

  // ==============================
  // sec04: 제품 탭
  // ==============================
  var url = window.location.href;
  var cateNo = new URL(url).searchParams.get('cate_no');

  var prdTab = new Swiper('#pdlistTab', {
    slidesPerView: 'auto',
    spaceBetween: 10
  });
  prdTab.slideTo($('#pdlistTab .swiper-slide[data-cate-no=' + cateNo + ']').index());

  $('#pdlistTab .swiper-slide').click(function () {
    var index = $(this).index();
    $('#pdlistTab .swiper-slide').removeClass('active');
    $(this).addClass('active');
    prdTab.slideTo(index);
  });
});
