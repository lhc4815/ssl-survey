// clearQuestionTimer 함수 정의
function clearQuestionTimer() {
  if (typeof qInt !== 'undefined') clearInterval(qInt);
  if (typeof qTO !== 'undefined') clearTimeout(qTO);
}

// 결과 처리 및 화면 전환 함수
function finishSurveyLocal() {
  console.log('설문 완료 함수 실행 시작');
  clearQuestionTimer();
  if (typeof totalInt !== 'undefined') clearInterval(totalInt);
  if (typeof surveyDiv !== 'undefined' && surveyDiv) surveyDiv.classList.add('hidden');
  if (typeof resultDiv !== 'undefined' && resultDiv) resultDiv.classList.remove('hidden');

  // 파라미터로 전달할 객체 생성 (방어적 코딩)
  const params = {};
  
  // DOM 요소 및 변수 존재 여부 확인 후 파라미터에 추가
  if (typeof nameIn !== 'undefined') params.nameIn = nameIn;
  if (typeof currentCode !== 'undefined') params.currentCode = currentCode;
  if (typeof usedCodes !== 'undefined') params.usedCodes = usedCodes;
  if (typeof emailStatus !== 'undefined') params.emailStatus = emailStatus;
  if (typeof sendEmailBtn !== 'undefined') params.sendEmailBtn = sendEmailBtn;
  if (typeof downloadLink !== 'undefined') params.downloadLink = downloadLink;
  if (typeof usedDL !== 'undefined') params.usedDL = usedDL;
  if (typeof respA !== 'undefined') params.respA = respA;
  if (typeof respB !== 'undefined') params.respB = respB;
  if (typeof respC !== 'undefined') params.respC = respC;
  if (typeof questionsA !== 'undefined') params.questionsA = questionsA;
  if (typeof questionsB !== 'undefined') params.questionsB = questionsB;
  if (typeof questionsC !== 'undefined') params.questionsC = questionsC;
  if (typeof bPills !== 'undefined') params.bPills = bPills;
  if (typeof tPills !== 'undefined') params.tPills = tPills;
  if (typeof regionIn !== 'undefined') params.regionIn = regionIn;
  
  // 함수 참조
  params.clearQuestionTimer = clearQuestionTimer;
  if (typeof totalInt !== 'undefined') params.totalInt = totalInt;
  if (typeof surveyDiv !== 'undefined') params.surveyDiv = surveyDiv;
  if (typeof resultDiv !== 'undefined') params.resultDiv = resultDiv;
  
  try {
    // 외부 모듈의 finishSurvey 함수 호출
    if (typeof finishSurvey === 'function') {
      console.log('finishSurvey 함수 호출 시도');
      const result = finishSurvey(params);
      console.log('설문 완료 처리 결과:', result);
    } else {
      console.error('finishSurvey 함수를 찾을 수 없습니다');
      // 기본 처리: localStorage에 저장만 진행
      const STORAGE_KEY = 'surveyDB';
      let surveyDB = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      
      const nextId = 'STU' + String(surveyDB.length + 1).padStart(4, '0');
      const now = new Date();
      const completeAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ` +
                         `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      
      // 학생 데이터 생성 (방어적 코딩)
      const row = {
        학생ID: nextId,
        학생성명: (nameIn && nameIn.value) ? nameIn.value : 'N/A',
        설문완료일시: completeAt,
        사용한코드: currentCode || 'UNKNOWN'
      };
      
      surveyDB.push(row);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyDB));
      
      if (emailStatus) {
        emailStatus.textContent = '서버 연결 시도 중...';
        
        // 간단한 이메일 전송 시도
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: (nameIn && nameIn.value) ? nameIn.value : 'N/A',
            content: btoa(JSON.stringify(row)),
            fileType: 'json'
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            emailStatus.textContent = '결과가 이메일로 전송되었습니다.';
            emailStatus.style.color = '#2E7D32';
          } else {
            throw new Error(data.error || '이메일 전송 실패');
          }
        })
        .catch(error => {
          console.error('이메일 전송 오류:', error);
          emailStatus.textContent = '이메일 전송 실패: ' + error.message;
          emailStatus.style.color = '#D32F2F';
        });
      }
    }
  } catch (err) {
    console.error("설문 완료 처리 중 오류:", err);
    alert("설문 결과 저장 중 오류가 발생했습니다: " + err.message);
  }
}

// 시간 포맷 헬퍼
function fmt(s) { 
  return pad(Math.floor(s/60)) + ':' + pad(s%60); 
}

function pad(n) { 
  return n.toString().padStart(2, '0'); 
}
