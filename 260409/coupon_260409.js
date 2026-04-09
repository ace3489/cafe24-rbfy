// ==============================
// 랜덤쿠폰 발급 시스템 - coupon_260409.js
// DB 기반 설정 (하드코딩 없음)
// ==============================

var CouponSystem = (function () {

  // API 설정
  var API_BASE = 'https://uplusuniform.bytechtree.com/api/coupon';
  var API_TOKEN = '951227f7f2ac0672f09c0b0a398e5499fdd489877d193a75cb0f6941116322e6';

  // DB에서 가져온 설정 (init 시 채워짐)
  var CONFIG = {
    startDate: null,
    endDate: null,
    resetTime: '14:00:00',
    couponData: {}
  };
  var configLoaded = false;

  // ==============================
  // 설정 로드
  // ==============================

  function loadConfig(callback) {
    if (configLoaded) return callback(CONFIG);

    console.log('[쿠폰] config 로드 요청');
    fetch(API_BASE + '/config', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-External-Token': API_TOKEN
      }
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      console.log('[쿠폰] config 로드 완료:', JSON.stringify(data).substring(0, 200));
      CONFIG.startDate = data.startDate;
      CONFIG.endDate = data.endDate;
      CONFIG.resetTime = data.resetTime || data.resetHour || '14:00:00';
      CONFIG.couponData = data.couponData || {};
      configLoaded = true;
      callback(CONFIG);
    })
    .catch(function (err) {
      console.error('[쿠폰] config 로드 실패:', err);
      callback(CONFIG);
    });
  }

  // ==============================
  // 유틸 함수
  // ==============================

  // resetTime을 파싱하여 [시, 분, 초] 반환
  function parseResetTime() {
    var parts = String(CONFIG.resetTime || '14:00:00').split(':');
    return {
      h: parseInt(parts[0], 10) || 14,
      m: parseInt(parts[1], 10) || 0,
      s: parseInt(parts[2], 10) || 0
    };
  }

  function getActiveDateKey() {
    var now = new Date();
    var rt = parseResetTime();
    var resetToday = new Date(now);
    resetToday.setHours(rt.h, rt.m, rt.s, 0);

    if (now < resetToday) {
      now.setDate(now.getDate() - 1);
    }
    var y = now.getFullYear();
    var m = ('0' + (now.getMonth() + 1)).slice(-2);
    var d = ('0' + now.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }

  function getTodayData() {
    return CONFIG.couponData[getActiveDateKey()] || null;
  }

  function getStartDate() {
    return CONFIG.startDate;
  }

  function getEndDate() {
    return CONFIG.endDate;
  }

  function getResetTime() {
    return CONFIG.resetTime;
  }

  function isEventActive() {
    if (!CONFIG.startDate || !CONFIG.endDate) return false;
    var now = new Date();
    return now >= new Date(CONFIG.startDate) && now <= new Date(CONFIG.endDate);
  }

  function isBeforeEvent() {
    if (!CONFIG.startDate) return false;
    return new Date() < new Date(CONFIG.startDate);
  }

  // 관리자 여부
  function isAdmin() {
    try {
      var info = CAPP_ASYNC_METHODS.AppCommon.getCustomerInfo();
      return info && info.group_name === '관리자';
    } catch (e) {
      return false;
    }
  }

  // 회원 ID 추출
  function getMemberId() {
    try {
      if (typeof CAPP_ASYNC_METHODS !== 'undefined' && CAPP_ASYNC_METHODS.AppCommon) {
        var id = CAPP_ASYNC_METHODS.AppCommon.getMemberID();
        if (id) return id;
      }
    } catch (e) {}
    var el = document.querySelector('.xans-member-var-id');
    if (el && el.innerText.trim().length > 0) {
      return el.innerText.trim();
    }
    return '';
  }

  // 로그인 여부
  function isLoggedIn() {
    try {
      if (typeof CAPP_ASYNC_METHODS !== 'undefined') {
        return !!CAPP_ASYNC_METHODS.IS_LOGIN;
      }
    } catch (e) {}
    var el = document.querySelector('.xans-member-var-id');
    if (el && el.innerText.trim().length > 0) return true;
    return false;
  }

  // 확률 기반 랜덤 추첨
  function pickRandom(coupons) {
    var rand = Math.random() * 100;
    var cumulative = 0;
    for (var i = 0; i < coupons.length; i++) {
      cumulative += coupons[i].rate;
      if (rand < cumulative) return coupons[i];
    }
    return coupons[0];
  }

  // ==============================
  // API 호출
  // ==============================

  function apiCheck(memberId, date, callback) {
    console.log('[쿠폰] API 체크 요청:', memberId, date);
    fetch(API_BASE + '/check?member_id=' + encodeURIComponent(memberId) + '&date=' + date, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-External-Token': API_TOKEN
      }
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      console.log('[쿠폰] API 체크 응답:', JSON.stringify(data));
      callback(data);
    })
    .catch(function (err) {
      console.error('[쿠폰] API 체크 실패:', err);
      callback({ received: false });
    });
  }

  function apiRecord(memberId, date, couponType, couponNo, callback) {
    console.log('[쿠폰] API 발급 요청:', memberId, date, couponType, couponNo);
    fetch(API_BASE + '/issue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-External-Token': API_TOKEN
      },
      body: JSON.stringify({
        member_id: memberId,
        date: date,
        coupon_type: couponType,
        coupon_no: couponNo
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      console.log('[쿠폰] API 발급 응답:', JSON.stringify(data));
      callback(data);
    })
    .catch(function (err) {
      console.error('[쿠폰] API 발급 실패:', err);
      callback({ success: false });
    });
  }

  // ==============================
  // 쿠폰 발급 + 중복 체크
  // ==============================

  function handleCouponClick(callbacks) {
    if (!isLoggedIn()) {
      callbacks.onLoginRequired();
      return;
    }

    var memberId = getMemberId();
    var dateKey = getActiveDateKey();
    var todayData = getTodayData();

    if (!todayData) return;

    console.log('[쿠폰] 클릭 처리 시작 - memberId:', memberId, 'date:', dateKey);

    // 소진 체크 → 중복 체크 → 추첨
    loadProgress(function (progressData) {
      if (progressData && progressData.coupons) {
        var allSoldout = true;
        for (var i = 0; i < progressData.coupons.length; i++) {
          if (!progressData.coupons[i].soldout) {
            allSoldout = false;
            break;
          }
        }
        if (allSoldout) {
          console.log('[쿠폰] 전체 소진 → 차단');
          callbacks.onSoldout();
          return;
        }
      }

      apiCheck(memberId, dateKey, function (checkResult) {
        if (checkResult.received) {
          console.log('[쿠폰] 이미 발급됨 → 차단');
          callbacks.onAlready();
          return;
        }

        // 소진되지 않은 쿠폰만 추첨
        var available = todayData.coupons;
        if (progressData && progressData.coupons) {
          var soldoutTypes = {};
          for (var j = 0; j < progressData.coupons.length; j++) {
            if (progressData.coupons[j].soldout) {
              soldoutTypes[progressData.coupons[j].coupon_type] = true;
            }
          }
          available = todayData.coupons.filter(function (c) {
            return !soldoutTypes[c.name];
          });
          if (available.length === 0) {
            callbacks.onSoldout();
            return;
          }
        }

        var won = pickRandom(available);
        console.log('[쿠폰] 당첨:', won.name, won.couponNo);

        apiRecord(memberId, dateKey, won.name, won.couponNo, function (recordResult) {
          if (!recordResult.success) {
            callbacks.onAlready();
            return;
          }

          // Cafe24 쿠폰 실제 발급
          var iframe = document.getElementById('couponIframe');
          if (iframe) {
            var origAlert = window.alert;
            window.alert = function () {};
            iframe.src = '/exec/front/newcoupon/IssueDownload?coupon_no=' + won.couponNo;
            setTimeout(function () { window.alert = origAlert; }, 3000);
          }

          callbacks.onSuccess(won);
        });
      });
    });
  }

  // ==============================
  // 프로그래스바
  // ==============================

  function loadProgress(callback) {
    var dateKey = getActiveDateKey();
    console.log('[쿠폰] 프로그래스 요청:', dateKey);

    fetch(API_BASE + '/progress?date=' + dateKey, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-External-Token': API_TOKEN
      }
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      console.log('[쿠폰] 프로그래스 응답:', JSON.stringify(data));
      if (callback) callback(data);
    })
    .catch(function (err) {
      console.error('[쿠폰] 프로그래스 실패:', err);
      if (callback) callback(null);
    });
  }

  function updateProgressBar(data) {
    if (!data || !data.coupons) return;

    var adminMode = isAdmin();
    var boxes = $('.progress .box');
    var order = ['3%', '5%', '10%', '3000원', '5000원'];

    for (var i = 0; i < order.length; i++) {
      var coupon = null;
      for (var j = 0; j < data.coupons.length; j++) {
        if (data.coupons[j].coupon_type === order[i]) {
          coupon = data.coupons[j];
          break;
        }
      }

      var $box = boxes.eq(i);
      if (!coupon) continue;

      if (coupon.soldout) {
        $box.find('.bar span:not(.soldout-txt)').css('width', '0%');
        if (!$box.find('.soldout-txt').length) {
          $box.find('.bar').append('<span class="soldout-txt">수량 소진</span>');
        }
      } else {
        $box.find('.bar span:not(.soldout-txt)').css('width', coupon.percent + '%');
        $box.find('.soldout-txt').remove();
      }

      // 관리자: 발급 수량 표시
      if (adminMode) {
        var adminTxt = coupon.issued + ' / ' + coupon.limit;
        if ($box.find('.admin-info').length) {
          $box.find('.admin-info').text(adminTxt);
        } else {
          $box.append('<span class="admin-info">' + adminTxt + '</span>');
        }
      }
    }
  }

  // 초기 상태 확인
  function checkInitialState(callback) {
    var dateKey = getActiveDateKey();
    var todayData = getTodayData();
    if (!todayData) return callback('available');

    if (!isLoggedIn()) return callback('available');

    var memberId = getMemberId();

    apiCheck(memberId, dateKey, function (checkResult) {
      if (checkResult.received) return callback('already');

      loadProgress(function (progressData) {
        if (progressData && progressData.coupons) {
          var allSoldout = true;
          for (var i = 0; i < progressData.coupons.length; i++) {
            if (!progressData.coupons[i].soldout) {
              allSoldout = false;
              break;
            }
          }
          if (allSoldout) return callback('soldout');
        }
        callback('available');
      });
    });
  }

  // 공개 API
  return {
    loadConfig: loadConfig,
    isAdmin: isAdmin,
    getActiveDateKey: getActiveDateKey,
    getTodayData: getTodayData,
    getStartDate: getStartDate,
    getEndDate: getEndDate,
    getResetTime: getResetTime,
    isEventActive: isEventActive,
    isBeforeEvent: isBeforeEvent,
    getMemberId: getMemberId,
    isLoggedIn: isLoggedIn,
    handleCouponClick: handleCouponClick,
    checkInitialState: checkInitialState,
    loadProgress: loadProgress,
    updateProgressBar: updateProgressBar
  };

})();
