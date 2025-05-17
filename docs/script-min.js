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

  // TEST 모드 체크 (모든 코드에서 가장 먼저 확인)
  const isTestMode = document.getElementById('test-mode') && document.getElementById('test-mode').checked;
  console.log('TEST 모드 상태:', isTestMode ? '활성화 ✓' : '비활성화 ✗');
  
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
  // 코드 관련 정보 처리 - currentCode 직접 참조 방지
  let localCurrentCode = '';
  
  // 코드 값 직접 가져오기
  try {
    // 1. 전역 변수 존재 체크
    if (typeof currentCode !== 'undefined') {
      localCurrentCode = currentCode;
      console.log('전역 currentCode 사용');
    } 
    // 2. 코드 입력 필드에서 가져오기
    else {
      const codeInput = document.getElementById('stu-code');
      if (codeInput && codeInput.value) {
        localCurrentCode = codeInput.value.trim();
        console.log('코드 입력 필드에서 값 가져옴:', localCurrentCode);
      } 
      // 3. TEST 모드면 임시값 생성
      else if (isTestMode) {
        localCurrentCode = 'TEST' + new Date().getTime().toString().slice(-4);
        console.log('TEST 모드용 임시 코드 생성:', localCurrentCode);
      }
    }
  } catch (e) {
    console.error('코드 값 가져오기 오류:', e);
  }
  
  params.currentCode = localCurrentCode;
  
  // usedCodes가 이 시점에 undefined면 localStorage에서 직접 로드
  if (typeof usedCodes === 'undefined' || !Array.isArray(usedCodes)) {
    try {
      const storedUsedCodes = localStorage.getItem('usedCodes');
      if (storedUsedCodes) {
        params.usedCodes = JSON.parse(storedUsedCodes);
        console.log('localStorage에서 usedCodes 로드 성공:', params.usedCodes.length + '개');
      } else {
        params.usedCodes = [];
        console.log('localStorage에 usedCodes가 없음, 빈 배열 사용');
      }
    } catch (e) {
      console.error('usedCodes 로드 오류:', e);
      params.usedCodes = [];
    }
  } else {
    params.usedCodes = usedCodes;
    console.log('전역 usedCodes 사용:', usedCodes.length + '개');
  }
  if (typeof emailStatus !== 'undefined') params.emailStatus = emailStatus;
  if (typeof sendEmailBtn !== 'undefined') params.sendEmailBtn = sendEmailBtn;
  if (typeof downloadLink !== 'undefined') params.downloadLink = downloadLink;
  if (typeof usedDL !== 'undefined') params.usedDL = usedDL;
  // 설문 응답 및 문항 데이터 - 로컬 변수로 직접 정의
  const localRespA = typeof respA !== 'undefined' ? respA : [];
  const localRespB = typeof respB !== 'undefined' ? respB : [];
  const localRespC = typeof respC !== 'undefined' ? respC : [];
  const localQuestionsA = typeof questionsA !== 'undefined' ? questionsA : [];
  const localQuestionsB = typeof questionsB !== 'undefined' ? questionsB : [];
  const localQuestionsC = typeof questionsC !== 'undefined' ? questionsC : [];
  
  console.log('설문 데이터 생성 (로컬 변수):', {
    'respA 길이': Array.isArray(localRespA) ? localRespA.length : 0,
    'respB 길이': Array.isArray(localRespB) ? localRespB.length : 0,
    'respC 길이': Array.isArray(localRespC) ? localRespC.length : 0,
    'questionsA 길이': Array.isArray(localQuestionsA) ? localQuestionsA.length : 0,
    'questionsB 길이': Array.isArray(localQuestionsB) ? localQuestionsB.length : 0,
    'questionsC 길이': Array.isArray(localQuestionsC) ? localQuestionsC.length : 0
  });
  
  // 파라미터에 안전하게 할당
  params.respA = Array.isArray(localRespA) ? localRespA : [];
  params.respB = Array.isArray(localRespB) ? localRespB : [];
  params.respC = Array.isArray(localRespC) ? localRespC : [];
  params.questionsA = Array.isArray(localQuestionsA) ? localQuestionsA : [];
  params.questionsB = Array.isArray(localQuestionsB) ? localQuestionsB : [];
  params.questionsC = Array.isArray(localQuestionsC) ? localQuestionsC : [];
  
  // 디버깅을 위한 추가 로깅
  console.log('TEST 모드 상태(할당 전):', isTestMode);
  if (typeof bPills !== 'undefined') params.bPills = bPills;
  if (typeof tPills !== 'undefined') params.tPills = tPills;
  if (typeof regionIn !== 'undefined') params.regionIn = regionIn;
  
  // TEST 모드에서 폼 데이터 직접 복사
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
      
      // TEST 모드에서 임의의 설문 응답 데이터 생성 (없을 경우)
      if ((!Array.isArray(localRespA) || localRespA.length === 0) && Array.isArray(localQuestionsA)) {
        console.log('TEST 모드: Type A 응답 자동 생성');
        params.respA = Array(localQuestionsA.length).fill(0).map(() => Math.floor(Math.random() * 5) + 1);
        console.log('자동 생성된 respA:', params.respA);
      }
      
      if ((!Array.isArray(localRespB) || localRespB.length === 0) && Array.isArray(localQuestionsB)) {
        console.log('TEST 모드: Type B 응답 자동 생성');
        params.respB = Array(localQuestionsB.length).fill(0).map(() => 
          ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]);
        console.log('자동 생성된 respB:', params.respB);
      }
      
      if ((!Array.isArray(localRespC) || localRespC.length === 0) && Array.isArray(localQuestionsC)) {
        console.log('TEST 모드: Type C 응답 자동 생성');
        params.respC = Array(localQuestionsC.length).fill(0).map(() => 
          ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]);
        console.log('자동 생성된 respC:', params.respC);
      }
      
      // 선택된 B등급 과목수와 진학희망고교 인덱스 검색
      let bIndex = -1, tIndex = -1;
      
      try {
        // document.querySelectorAll로 DOM에서 pill 요소들 직접 가져오기
        const bPillsElements = Array.from(document.querySelectorAll('#bcount-group .pill'));
        if (bPillsElements.length > 0) {
          bIndex = bPillsElements.findIndex(p => p.classList.contains('selected'));
          console.log('B등급 과목수 인덱스 (DOM에서 직접 검색):', bIndex);
        }
        
        const tPillsElements = Array.from(document.querySelectorAll('#schooltype-group .pill'));
        if (tPillsElements.length > 0) {
          tIndex = tPillsElements.findIndex(p => p.classList.contains('selected'));
          console.log('진학희망고교 인덱스 (DOM에서 직접 검색):', tIndex);
        }
      } catch (err) {
        console.error('DOM에서 pills 요소 검색 중 오류:', err);
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
        사용한코드: params.currentCode || 'UNKNOWN'
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
