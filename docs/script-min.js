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

  // DOM 요소 가져오기 (오류 방지를 위해 직접 DOM에서 참조)
  const localNameIn = document.getElementById('name');
  const localSchoolIn = document.getElementById('school');
  const localGenderIn = document.getElementById('gender');
  const localRegionIn = document.getElementById('region');
  const localEmailStatus = document.getElementById('email-status');

  console.log('DOM 요소 참조 상태:', {
    nameIn: localNameIn ? '찾음 ✓' : '없음 ✗',
    schoolIn: localSchoolIn ? '찾음 ✓' : '없음 ✗',
    genderIn: localGenderIn ? '찾음 ✓' : '없음 ✗',
    regionIn: localRegionIn ? '찾음 ✓' : '없음 ✗',
    emailStatus: localEmailStatus ? '찾음 ✓' : '없음 ✗'
  });

  // 파라미터로 전달할 객체 생성 (방어적 코딩)
  const params = {};
  
  // DOM 요소 및 변수 존재 여부 확인 후 파라미터에 추가
  params.nameIn = localNameIn;
  params.schoolIn = localSchoolIn;
  params.genderIn = localGenderIn;
  params.regionIn = localRegionIn;
  params.emailStatus = localEmailStatus;
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
  
  // TEST 모드에서 폼 데이터 직접 복사
  const isTestMode = document.getElementById('test-mode') && document.getElementById('test-mode').checked;
  if (isTestMode) {
    console.log('TEST 모드: 폼 데이터를 명시적으로 복사합니다.');
    try {
      // TEST 모드에서는 직접 값을 설정하여 N/A 방지
      if (localNameIn && localNameIn.value) {
        console.log('이름 설정:', localNameIn.value);
      }
      if (localSchoolIn && localSchoolIn.value) {
        console.log('학교 설정:', localSchoolIn.value);
      }
      if (localGenderIn && localGenderIn.value) {
        console.log('성별 설정:', localGenderIn.value);
      }
      if (localRegionIn && localRegionIn.value) {
        console.log('지역 설정:', localRegionIn.value);
      }
      
      // 선택된 B등급 과목수와 진학희망고교 인덱스 검색
      let bIndex = -1, tIndex = -1;
      
      if (Array.isArray(bPills)) {
        bIndex = bPills.findIndex(p => p && p.classList && p.classList.contains('selected'));
        console.log('B등급 과목수 인덱스:', bIndex);
      }
      
      if (Array.isArray(tPills)) {
        tIndex = tPills.findIndex(p => p && p.classList && p.classList.contains('selected'));
        console.log('진학희망고교 인덱스:', tIndex);
      }
      
      // 추가 메타데이터 저장
      params.formData = {
        name: localNameIn?.value || '테스트 사용자',
        school: localSchoolIn?.value || '테스트 학교',
        gender: localGenderIn?.value || '남',
        region: localRegionIn?.value || '서울 특별시',
        bIndex: bIndex,
        tIndex: tIndex
      };
      
      console.log('폼 데이터 복사 완료:', params.formData);
    } catch (e) {
      console.error('폼 데이터 복사 중 오류:', e);
    }
  }
  
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
        학생성명: (localNameIn && localNameIn.value) ? localNameIn.value : 'N/A',
        출신학교: (localSchoolIn && localSchoolIn.value) ? localSchoolIn.value : 'N/A',
        설문완료일시: completeAt,
        사용한코드: currentCode || 'UNKNOWN'
      };
      
      surveyDB.push(row);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyDB));
      
      if (localEmailStatus) {
        localEmailStatus.textContent = '서버 연결 시도 중...';
        
        // 간단한 이메일 전송 시도
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentName: (localNameIn && localNameIn.value) ? localNameIn.value : 'N/A',
            content: btoa(JSON.stringify(row)),
            fileType: 'json'
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            localEmailStatus.textContent = '결과가 이메일로 전송되었습니다.';
            localEmailStatus.style.color = '#2E7D32';
          } else {
            throw new Error(data.error || '이메일 전송 실패');
          }
        })
        .catch(error => {
          console.error('이메일 전송 오류:', error);
          localEmailStatus.textContent = '이메일 전송 실패: ' + error.message;
          localEmailStatus.style.color = '#D32F2F';
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
