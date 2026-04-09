$(function () {
  $('map').imageMapResize();

  let headerHeight = $('header').outerHeight();

  // header_top_bnr가 있을 경우 높이 추가
  if ($('.header_top_bnr').length) {
    headerHeight += $('.header_top_bnr').outerHeight();
  }

  let tabHeight = $('.tab').outerHeight();
  $('.tab').css('top', headerHeight);

  // 제품 유의사항
  $('.notice_title').click(function () {
    $('.notice_title').stop().toggle();
    $('.prd_notice').stop().toggle();
  });

  // 탭 클릭 시
  $('.tab map area').click(function (e) {
    e.preventDefault();

    const targetId = $(this).data('target');
    const $target = $('#' + targetId);

    if (!$target.length) return;

    $('html, body').animate(
      {
        scrollTop: $target.offset().top - headerHeight - tabHeight + 10
      },
      300
    );
  });

  // 스크롤 시 탭 전환
  $(window).scroll(function () {
    headerHeight = $('header').outerHeight();
    // header_top_bnr가 있을 경우 높이 추가
    if ($('.header_top_bnr').length) {
      headerHeight += $('.header_top_bnr').outerHeight();
    }
    tabHeight = $('.tab').outerHeight();
    $('.tab').css('top', headerHeight);

    $('.e_content').each(function () {
      const scrollTop = $(this).offset().top - headerHeight - tabHeight;

      $(window).scrollTop() >= scrollTop ? $(this).addClass('on') : $(this).removeClass('on');
    });

    let activeContent = $('.e_content.on').last().index();
    if (activeContent === -1) activeContent = 0;
    $('.tab img').eq(activeContent).css('opacity', '1').siblings().css('opacity', '0');
  });

  // 리사이즈 시 탭 위치 조정
  $(window).resize(function () {
    headerHeight = $('header').outerHeight();
    // header_top_bnr가 있을 경우 높이 추가
    if ($('.header_top_bnr').length) {
      headerHeight += $('.header_top_bnr').outerHeight();
    }
    tabHeight = $('.tab').outerHeight();
    $('.tab').css('top', headerHeight);
  });

  // 팝업 열기
  $('.jsBtnOpenPopup').click(function (e) {
    e.preventDefault();
    var popupId = $(this).attr('data-popup');

    if (!!popupId) {
      $('#' + popupId).addClass('show');
      $('.popup_bg').addClass('show');
    }
  });

  // 팝업 닫기
  $('.jsBtnClosePopup').click(function (e) {
    e.preventDefault();
    var popupId = $(this).attr('data-popup');
    $('#' + popupId).removeClass('show');
    $('.popup_bg').removeClass('show');
  });

  // 팝업배경 클릭 시
  $('.popup_bg').click(function (e) {
    e.preventDefault();
    // 현재 열려있는 팝업을 모두 닫기
    $('.popup.show').removeClass('show');
    // 배경 제거
    $(this).removeClass('show');
  });

  // 장바구니
  $('.cart_wr').click(function (e) {
    $(this).parents('li').find('.basket img').trigger('click');
  });
  // ========== 제품 공통 (시작) ========== //
  $('.jsProducItem').each(function () {
    const summary = $(this).find('.summary').text().split('|');
    let html = ``;
    summary.map(function (val, idx) {
      html += `<span class="badge">${$.trim(val)}</span>`;
    });
    $(this).find('.badges').append(html);
  });

  // 타임딜 제품에는 상품요약설명 제거
  $('.jsProducItem .name').each(function () {
    const txt = $(this).text().trim();
    if (txt.indexOf('타임딜') > -1) {
      $(this).closest('.jsProducItem').addClass('td_displaynone');
    }
  });

  // jQuery 1.4.4용 위임 바인딩
  $(document).delegate('.jsLinkScroll', 'click', function (e) {
    // href 파싱 (구버전 호환: <a> 엘리먼트 활용)
    var rawHref = this.getAttribute('href') || '';
    var link = document.createElement('a');
    link.href = rawHref;

    var hash = link.hash; // 예) "#pdlistArea"
    var search = link.search || ''; // 예) "?cate_no=344"
    var cateNo = (function (qs) {
      var m = qs.match(/(?:\?|&)cate_no=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    })(search);

    // 현재 페이지와 같은지 비교 (경로 끝 슬래시 제거)
    function normPath(p) {
      return (p || '').replace(/\/+$/, '');
    }
    var samePage = normPath(link.pathname) === normPath(location.pathname);

    // 해시가 없으면 스크롤 대상 없음 → 기본 이동
    if (!hash) return;

    if (samePage) {
      // 같은 페이지면 리로드 막고, 탭 활성화 + 스무스 스크롤
      e.preventDefault();

      // 1) cate_no가 있으면 해당 탭 클릭(리로드 없이 상태 전환)
      if (cateNo) {
        var $btn = $('#pdlistTab button[data-cate-no=' + cateNo + ']');
        if ($btn.length) $btn.trigger('click');
      }

      // 2) 주소창에 cate_no와 해시만 반영 (리로드 없음)
      //    (구형 브라우저에서 history API 미지원 시 예외 무시)
      try {
        history.replaceState(null, '', normPath(location.pathname) + search + hash);
      } catch (_) {}

      // 3) 콘텐츠 반영 직후 스크롤 (약간의 딜레이로 레이아웃 안정화)
      setTimeout(function () {
        var $target = $(hash);
        if (!$target.length) return;

        var y = $target.offset().top - getOffset();
        if (window.gsap && gsap.to) {
          gsap.to(window, { duration: 0.6, scrollTo: y, ease: 'power2.out' });
        } else {
          $('html, body').animate({ scrollTop: y }, 600);
        }
        if (window.ScrollTrigger && ScrollTrigger.refresh) ScrollTrigger.refresh();
      }, 80);
    } else {
      // 다른 페이지면 기본 이동 (목적지 페이지의 onload 로직이 cate_no/해시 처리)
      // e.preventDefault() 하지 않음
    }
  });
  // ========== //제품 공통 (끝) ========== //

  // ========== content_3 (시작) ========== //
  // 제품 클릭 노출 v2 (탭별 카테고리 링크 생성 O)
  const $pdlistTab = $('#pdlistTab button');
  $pdlistTab.click(function () {
    let no = $(this).attr('data-cate-no');

    $(this).addClass('on');
    $(this).siblings().removeClass('on');
    $('#pdlistPanel .panel').removeClass('on');
    $('#pdlistPanel .panel[data-cate-no="' + no + '"]').addClass('on');

    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
    }

    // ✅ URL에 cate_no 반영 (페이지 리로드 없이)

    if (typeof no !== 'undefined' && no !== '') {
      const currentUrl = new URL(window.location.href);
      const currentHash = currentUrl.hash || ''; // 해시가 없으면 빈 값
      const newUrl = `${window.location.pathname}?cate_no=${no}${currentHash}`;
      window.history.replaceState(null, '', newUrl);
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const cateNo = urlParams.get('cate_no');

  if (cateNo && cateNo !== 'undefined') {
    const $target = $(`#pdlistTab button[data-cate-no=${cateNo}]`);
    if ($target.length) {
      $target.trigger('click');

      // ✅ 해시가 #pdlistArea일 경우 해당 위치로 부드럽게 스크롤
      if (window.location.hash === '#pdlistArea') {
        setTimeout(() => {
          const offset = window.innerWidth <= 1024 ? 170 : 292;
          const scrollY = $('#pdlistArea').offset().top - offset;

          gsap.to(window, {
            duration: 0.6,
            scrollTo: scrollY
          });
        }, 100); // 트리거 동작 후 약간의 딜레이 필요
      }
    }
  }

  function getOffset() {
    return window.innerWidth <= 1024 ? 170 + liveClamp(35, vw_65, 70) : 292 + liveClamp(35, vw_65, 70);
  }

  // ✅✅ [추가] 해시 진입 시 스무스 스크롤 (content_1/2/3 & pdlistArea 지원)
  (function handleHashScrollOnLoad() {
    // ✅ 추가
    var hash = window.location.hash; // ✅ 추가
    if (!hash) return; // ✅ 추가

    // 허용 해시만 처리
    var ALLOW = { '#content_1': 1, '#content_2': 1, '#content_3': 1, '#pdlistArea': 1 }; // ✅ 추가
    if (!ALLOW[hash]) return; // ✅ 추가

    // 해시별 보정값 계산
    function getTopOffsetByHash(h) {
      // ✅ 추가
      var isMobile = window.innerWidth <= 1024;
      if (h === '#content_1' || h === '#content_2' || h === '#content_3') {
        return isMobile ? mo_h + 80 : pc_h + 160; // ✅ 추가
      }
      if (h === '#pdlistArea') {
        return isMobile ? 170 : 292; // ✅ 추가
      }
      return isMobile ? 170 : 292; // ✅ 추가 (fallback)
    }

    // 레이아웃/패널 상태가 안정된 뒤 스크롤
    setTimeout(function () {
      // ✅ 추가
      var offsetY = getTopOffsetByHash(hash); // ✅ 추가

      // GSAP 있으면 GSAP로, 없으면 jQuery animate로
      if (window.gsap && gsap.to) {
        // ✅ 추가
        gsap.to(window, {
          // ✅ 추가
          duration: 0.6,
          scrollTo: { y: hash, offsetY: offsetY },
          ease: 'power2.out'
        });
      } else {
        // ✅ 추가
        var $t = $(hash);
        if ($t.length) {
          $('html, body').animate({ scrollTop: $t.offset().top - offsetY }, 600);
        }
      }

      // ScrollTrigger 재계산
      if (window.ScrollTrigger && ScrollTrigger.refresh) {
        // ✅ 추가
        setTimeout(function () {
          ScrollTrigger.refresh();
        }, 50); // ✅ 추가
      }
    }, 120); // ✅ 추가 (살짝 딜레이로 레이아웃 안정)
  })();
  // ========== //content_3 (끝) ========== //
});
