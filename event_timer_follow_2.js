$(function () {
  // 타이머 데이터
  timerDataFollow = [
    {
      timerOn: 'true',
      openTime: '2026.04.09.14.00',
      endTime: '2026.04.15.14.00'
    }
  ];

  if ($('#timerDealFollow').length > 0) {
    setTimeout(function () {
      const data = timerDataFollow;

      if (data) {
        const timerOn = data[0].timerOn;
        let opening = true;

        if (timerOn == 'true') {
          // 날짜 파싱
          const openTime = data[0].openTime.split('.');
          const endTime = data[0].endTime.split('.');

          const openTargetDate = new Date(
            `${openTime[0]}/${openTime[1]}/${openTime[2]} ${openTime[3]}:${openTime[4]}:00`
          ).getTime();
          const endTargetDate = new Date(
            `${endTime[0]}/${endTime[1]}/${endTime[2]} ${endTime[3]}:${endTime[4]}:00`
          ).getTime();
          let timeData = openTargetDate;
          let openObj = dayCounter(timeData);

          if (openObj.days == '00' && openObj.hours == '00' && openObj.minutes == '00' && openObj.seconds == '00') {
            timeData = endTargetDate;
            opening = false;
          }

          const now = new Date();
          if (now < openTargetDate) {
            $('.bubble_area_follow .txt').text('🫧이벤트 오픈까지');
            $('.bubble_area_follow .end_txt').text('남음🫧');
          } else {
            $('.bubble_area_follow .txt').text('🫧이벤트 마감까지');
            $('.bubble_area_follow .end_txt').text('남음🫧');
          }

          // --------------------------------------------------------------
          // ★ 초/밀리초 자리 기본 구조 강제 세팅
          //    (혹시 HTML에서 구조가 다르게 들어와도 여기서 통일)
          // --------------------------------------------------------------
          $('#timerSec .timer_item').html(`
                          <span class="sec_1">0</span><span class="sec_2">0</span>
                          <span class="dot">.</span>
                          <span class="ms_1">0</span><span class="ms_2">0</span>
                      `); // ★
          // --------------------------------------------------------------

          // --------------------------------------------------------------
          // ★ 밀리초 업데이트 interval (10ms마다 00~99 회전)
          // --------------------------------------------------------------
          let msInterval = null; // ★

          function startMsInterval() {
            // ★
            if (msInterval) return; // 중복 실행 방지

            msInterval = setInterval(function () {
              const now = new Date();
              const ms = now.getMilliseconds(); // 0~999
              const hundredths = Math.floor(ms / 10); // 0~99

              const msStr = String(hundredths).padStart(2, '0').split('');

              $('#timerSec .ms_1').text(msStr[0]); // ★
              $('#timerSec .ms_2').text(msStr[1]); // ★
            }, 10);
          }

          // ★ 밀리초 효과 즉시 시작
          startMsInterval(); // ★
          // --------------------------------------------------------------

          // --------------------------------------------------------------
          // ★ 초/일/시/분 업데이트 interval (1초 단위)
          // --------------------------------------------------------------
          const mainInterval = setInterval(function () {
            let count = dayCounter(timeData);

            const pad = (v) => String(v).padStart(2, '0').split('');

            const days = pad(count.days);
            const hours = pad(count.hours);
            const minutes = pad(count.minutes);
            const seconds = pad(count.seconds);

            $('#timerDay .timer_item').html(`<span>${days[0]}</span><span>${days[1]}</span>`);
            $('#timerHour .timer_item').html(`<span>${hours[0]}</span><span>${hours[1]}</span>`);
            $('#timerMin .timer_item').html(`<span>${minutes[0]}</span><span>${minutes[1]}</span>`);

            // ----------------------------------------------------------
            // ★ 핵심: 초가 바뀔 때마다 구조 전체를 다시 세팅하지만
            //         sec_1 / sec_2 / ms_1 / ms_2 를 모두 포함해서 만들기
            //         → ms span이 절대 사라지지 않음
            // ----------------------------------------------------------
            $('#timerSec .timer_item').html(`
                              <span class="sec_1">${seconds[0]}</span><span class="sec_2">${seconds[1]}</span>
                              <span class="dot">.</span>
                              <span class="ms_1">0</span><span class="ms_2">0</span>
                          `); // ★
            // 이 시점에서 ms는 일단 00으로 리셋되지만,
            // 10ms 안에 msInterval이 다시 실제 값으로 덮어씀
            // ----------------------------------------------------------

            // 타이머 종료 처리
            if (count.days === '00' && count.hours === '00' && count.minutes === '00' && count.seconds === '00') {
              clearInterval(mainInterval);

              if (msInterval) {
                clearInterval(msInterval); // ★ 밀리초도 함께 종료
                msInterval = null;
              }
            }
          }, 1000);
          // --------------------------------------------------------------

          if (!opening) {
            $('#timerDealFollow .timer').append(`<div class="timer_box day_box">
                              <div class="timer_txt"></div>
                          </div>`);
          }
        }
      }
    }, 1000);
  }

  // 날짜 계산 함수
  function dayCounter(time) {
    function getFormattedKoreaTime() {
      const now = new Date();
      const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

      const year = koreaTime.getFullYear();
      const month = String(koreaTime.getMonth() + 1).padStart(2, '0');
      const day = String(koreaTime.getDate()).padStart(2, '0');
      const hours = String(koreaTime.getHours()).padStart(2, '0');
      const minutes = String(koreaTime.getMinutes()).padStart(2, '0');
      const seconds = String(koreaTime.getSeconds()).padStart(2, '0');

      return {
        dateString: `${year}-${month}-${day}`,
        timeString: `${hours}:${minutes}:${seconds}`,
        full: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
        timestamp: koreaTime.getTime()
      };
    }

    const formattedTime = getFormattedKoreaTime();
    const timeDifference = time - formattedTime.timestamp;

    let days = '00';
    let hours = '00';
    let minutes = '00';
    let seconds = '00';

    if (timeDifference > 0) {
      days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
      hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      hours = hours < 10 ? '0' + hours : String(hours);

      minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
      minutes = minutes < 10 ? '0' + minutes : String(minutes);

      seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);
      seconds = seconds < 10 ? '0' + seconds : String(seconds);
    }

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds
    };
  }
});
