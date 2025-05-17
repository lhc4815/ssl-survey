// script.js - SSL 설문조사 시스템 (JSON 기반)

window.addEventListener('DOMContentLoaded', () => {
  /* ── 상수 ───────────────────────────────────────── */
  const TOTAL_LIMIT = 90 * 60;   // 전체 제한 시간 90분
  const A_Q_SEC     = 10;        // Type A: 10초/문항
  const B_Q_SEC     = 60;        // Type B: 60초/문항
  const C_Q_SEC     = 240;       // Type C: 240초(4분)/문항

  /* ── 상태 변수 ───────────────────────────────────── */
  let startTime, totalInt, segmentInt;
  let qLeft, qInt, qTO;
  let stage = 'A', idxA = 0, idxB = 0, idxC = 0;
  let questionsA = [], questionsB = [], questionsC = [];
  let respA = [], respB = [], respC = [];
  
  // Type C 페이지 인덱스 (0–5: Q1–Q6, 6: Q7–Q10 묶음)
  let typeCPage = 0;

  /* ── DOM 참조 ─────────────────────────────────────── */
  const userForm        = document.getElementById('user-form');
  const surveyDiv       = document.getElementById('survey');
  const resultDiv       = document.getElementById('result');

  const startBtn        = document.getElementById('start');
  const nameIn          = document.getElementById('name');
  const schoolIn        = document.getElementById('school');
  const genderIn        = document.getElementById('gender');
  const regionIn        = document.getElementById('region');
  const subRgGrp        = document.getElementById('subregion-group');
  const subPills        = Array.from(document.querySelectorAll('#subregion-group .pill'));
  const msGrp           = document.getElementById('middleschool-group');
  const msSelect        = document.getElementById('middleschool');
  const bPills          = Array.from(document.querySelectorAll('#bcount-group .pill'));
  const tPills          = Array.from(document.querySelectorAll('#schooltype-group .pill'));

  const personalInfoDiv = document.getElementById('personal-info');
  const surveyTitle     = document.querySelector('#survey h2');
  const questionText    = document.getElementById('question-text');
  const totalTimerDiv   = document.getElementById('total-timer');
  const segmentTimerDiv = document.getElementById('segment-timer');
  const timerDiv        = document.getElementById('timer');
  const progressDiv     = document.getElementById('progress');
  const answersDiv      = document.getElementById('answers');
  const prevBtn         = document.getElementById('prev');
  const nextBtn         = document.getElementById('next');
  const downloadLink    = document.getElementById('download-link');

  // 코드 입력 관련
  const codeForm        = document.getElementById('code-form');
  const codeInput       = document.getElementById('stu-code');
  const codeSubmit      = document.getElementById('code-submit');
  const codeMessage     = document.getElementById('code-message'); 
  const usedDL          = document.getElementById('used-download-link');
  
  // 이메일 전송 관련
  const sendEmailBtn    = document.getElementById('send-email-btn');
  const emailStatus     = document.getElementById('email-status');
  
  // DB 및 코드 관련 상태
  const STORAGE_KEY = 'surveyDB';
  let surveyDB = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  let validCodes = [];
  let usedCodes = [];
  let currentCode = '';

  // ⇨ ➊ 코드 목록 로드
  loadCodeLists();

  // ⇨ ➋ 코드 목록 로드 함수 정의
  function loadCodeLists() {
    codeSubmit.disabled = true;
    codeMessage.textContent = '코드 목록 불러오는 중…';

    // (A) surveyDB에서 실제 사용된 코드 목록 추출
    const localUsed = surveyDB.map(r => r['사용한코드'] || '');
    console.log('▶ surveyDB 기반 usedCodes:', localUsed);

    // 유효 코드 로드 - 오류 시 무시
    console.log('유효 코드 파일 로드 시도...');
    fetch('MRT_stu_codes_0515.xlsx')
      .then(r => {
        if (!r.ok) {
          console.warn(`MRT_stu_codes_0515.xlsx 파일을 찾을 수 없습니다 (${r.status}), 검증 생략`);
          validCodes = []; // 빈 배열로 설정 - 모든 코드가 유효함
          codeMessage.textContent = '';
          codeSubmit.disabled = false;
          return null;
        }
        return r.arrayBuffer();
      })
      .then(stuBuf => {
        if (stuBuf === null) return; // 오류 발생했을 경우 처리 중단
        
        try {
          // 1) 바이너리 → 워크북
          const wb = XLSX.read(new Uint8Array(stuBuf), { type: 'array' });
          // 2) 첫 번째 시트 선택
          const sheet = wb.Sheets[wb.SheetNames[0]];
          // 3) 시트를 2차원 배열로 변환 (header 포함)
          const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          // 4) 헤더 제외 후, 첫 열(code)만 뽑아서 대문자·trim
          validCodes = rows
            .slice(1)
            .map(r => String(r[0]).trim())
            .filter(c => c.length === 7);
          console.log('🔍 validCodes 로드됨:', validCodes);
        } catch (e) {
          console.error('XLSX 파싱 오류:', e);
          validCodes = []; // 오류 발생 시 빈 배열로 설정
        }
        
        // ── (C) usedCodes 는 로컬스토리지 기준으로만 세팅
        usedCodes = localUsed;
        console.log('🔄 usedCodes set from surveyDB:', usedCodes);

        codeMessage.textContent = '';
        codeSubmit.disabled = false;
      })
      .catch(e => {
        console.error('❌ loadCodeLists error:', e);
        codeMessage.textContent = '코드 목록 로딩 실패: ' + e.message;
        codeSubmit.disabled = true;
      });
  }

  // TEST 모드 전역 변수
  let isTestMode = false;
  const testModeCheckbox = document.getElementById('test-mode');
  
  // 테스트 모드 토글
  if (testModeCheckbox) {
    testModeCheckbox.addEventListener('change', function() {
      isTestMode = this.checked;
      console.log('TEST 모드:', isTestMode ? '활성화' : '비활성화');
    });
  }

  // ⇨ ➌ 코드 입력 검증 처리
  codeSubmit.addEventListener('click', e => {
    e.preventDefault();
    const code = codeInput.value.trim();
    
    // TEST 모드 확인
    isTestMode = testModeCheckbox && testModeCheckbox.checked;
    
    // 길이 검사 (TEST 모드에서는 건너뜀)
    if (!isTestMode && code.length < 4) {
      codeMessage.textContent = '코드는 최소 4자 이상이어야 합니다.';
      return;
    }
    
    // 중복 입력 검사 (TEST 모드에서는 건너뜀)
    if (!isTestMode && usedCodes.includes(code)) {
      codeMessage.textContent = '이미 사용된 코드입니다. 설문을 진행할 수 없습니다.';
      return;
    }
    
    // 검증 통과
    currentCode = code || 'TEST';
    codeForm.classList.add('hidden');
    userForm.classList.remove('hidden');
    codeMessage.textContent = '';
  });

  // 1~6번 입력 완료 시에만 시작 버튼 활성화
  function validatePersonalInfo() {
    const nameOK   = !!nameIn.value.trim();
    const genderOK = !!genderIn.value;
    const regionOK = !!regionIn.value;

    // schoolOK: 서울/기타 지역 구분
    let schoolOK = !!schoolIn.value.trim();
    if (regionIn.value === '서울 특별시') {
      const sel = subPills.find(p => p.classList.contains('selected'));
      if (sel && sel.dataset.value !== '기타 지역') {
        schoolOK = !!msSelect.value;
      }
    }

    // B등급, 고교분류 pill 체크
    const bOK = bPills.some(p => p.classList.contains('selected'));
    const tOK = tPills.some(p => p.classList.contains('selected'));

    startBtn.disabled = !(nameOK && genderOK && regionOK && schoolOK && bOK && tOK);
  }

  // 검증 이벤트 리스너
  [nameIn, schoolIn, genderIn, regionIn, msSelect].forEach(el =>
    el.addEventListener('input', validatePersonalInfo)
  );
  subPills.forEach(p => p.addEventListener('click', validatePersonalInfo));
  bPills.forEach(p => p.addEventListener('click', validatePersonalInfo));
  tPills.forEach(p => p.addEventListener('click', validatePersonalInfo));


  // 학교 맵 데이터
  const schoolMap = {
    '강남': ['단대부중', '역삼중', '도곡중', '대명중', '대청중', '숙명여중', '휘문중'],
    '서초': ['원촌중','서초중','반포중', '세화여중'],
    '송파': ['잠실중','송례중','풍납중'],
    '목동': ['목동중','목일중','신목중', '월촌중', '양정중', '목운중'],
    '중계': ['중계중','상명중','불암중', '을지중']
  };

  /* ── 1) 서울→중학교 토글, Pill 설정 ───────────────── */
  regionIn.addEventListener('change', () => {
    if (regionIn.value === '서울 특별시') {
      subRgGrp.classList.remove('hidden');
      msGrp.classList.add('hidden');
      schoolIn.classList.remove('hidden');
      msSelect.innerHTML = '<option value="" disabled selected>중학교 선택</option>';
    } else {
      subRgGrp.classList.add('hidden');
      msGrp.classList.add('hidden');
      msSelect.innerHTML = '<option value="" disabled selected>중학교 선택</option>';
      schoolIn.classList.remove('hidden');
    }
    validatePersonalInfo();
  });

  // 서울 내 구역 선택 리스너
  subPills.forEach(p => p.addEventListener('click', () => {
    subPills.forEach(x => x.classList.remove('selected'));
    p.classList.add('selected');

    const v = p.dataset.value;
    msSelect.innerHTML = '<option value="" disabled selected>중학교 선택</option>';

    if (v === '기타 지역') {
      msGrp.classList.add('hidden');
    } else {
      msGrp.classList.remove('hidden');
      msSelect.innerHTML = '<option value="" disabled selected>중학교 선택</option>';
      schoolMap[v].forEach(sch => {
        const opt = document.createElement('option');
        opt.value = sch; opt.text = sch;
        msSelect.append(opt);
      });
    }
    validatePersonalInfo();
  }));

  // 선택 버튼 설정 헬퍼
  function setupPills(pills){
    pills.forEach(p => p.addEventListener('click', () => {
      pills.forEach(x => x.classList.remove('selected'));
      p.classList.add('selected');
      validatePersonalInfo();
    }));
  }
  setupPills(bPills);
  setupPills(tPills);

  /* ── 2) '설문 시작' 클릭 핸들러 ───────────────────── */
  startBtn.addEventListener('click', () => {
    // 유효성 재검증
    const nameOK   = !!nameIn.value.trim();
    const genderOK = !!genderIn.value;
    const regionOK = !!regionIn.value;

    let schoolOK = false;
    if (regionIn.value === '서울 특별시') {
      const sel = subPills.find(p => p.classList.contains('selected'));
      if (sel) {
        if (sel.dataset.value === '기타 지역') {
          schoolOK = !!schoolIn.value.trim();
        } else {
          schoolOK = !!msSelect.value;
        }
      }
    } else {
      schoolOK = !!schoolIn.value.trim();
    }

    const bOK = bPills.some(p => p.classList.contains('selected'));
    const tOK = tPills.some(p => p.classList.contains('selected'));

    if (!(nameOK && genderOK && regionOK && schoolOK && bOK && tOK)) {
      return alert('1~6번 정보를 모두 입력/선택해주세요.');
    }

    // 학생 정보 표시
    const selPill = subPills.find(x => x.classList.contains('selected'));
    const district = selPill?.dataset.value || '';
    
    // 중학교 필드 결정
    let middleSchoolValue = '';
    if (regionIn.value === '서울 특별시' && district && district !== '기타 지역') {
      middleSchoolValue = msSelect.value || '';
    } else {
      middleSchoolValue = schoolIn.value.trim();
    }
    
    // 요약문 갱신
    personalInfoDiv.textContent =
      `이름: ${nameIn.value.trim()} | 출신학교: ${schoolIn.value.trim()} | 성별: ${genderIn.value} | 거주: ${regionIn.value}${district?'/'+district:''} | 중학교: ${middleSchoolValue} | B등급: ${bPills.find(x=>x.classList.contains('selected')).dataset.value} | 희망고교: ${tPills.find(x=>x.classList.contains('selected')).dataset.value}`;

    // 엑셀 로드
    fetch('Questions.xlsx')
      .then(r => r.arrayBuffer())
      .then(stuBuf => {
        // 워크북으로 변환
        const wb = XLSX.read(new Uint8Array(stuBuf), { type: 'array' });
        
        // 문항 데이터 로드
        questionsA = XLSX.utils.sheet_to_json(wb.Sheets['Type A'], {defval:''})
          .map(r=>({
            no: r['연번'],
            category: r['척도(대분류)'],
            q: r['문항'],
            p: r['지문'],
            A: r['(A)'],
            B: r['(B)'],
            C: r['(C)'],
            D: r['(D)'],
          }));
          
        questionsB = XLSX.utils.sheet_to_json(wb.Sheets['Type B'])
          .map(r=>({no:r['연번'],q:r['문항'],p:r['지문'],A:r['(A)'],B:r['(B)'],C:r['(C)'],D:r['(D)'], correct: r['답'],}));
          
        questionsC = XLSX.utils.sheet_to_json(wb.Sheets['Type C'])
          .map(r=>({no:r['연번'],q:r['문항'],p:r['지문'],A:r['(A)'],B:r['(B)'],C:r['(C)'],D:r['(D)'], correct: r['답'],}));
        
        // 응답 배열 초기화
        respA = Array(questionsA.length).fill(null);
        respB = Array(questionsB.length).fill(null);
        respC = Array(questionsC.length).fill(null);
        
        // UI 전환 및 타이머 시작
        userForm.classList.add('hidden');
        surveyDiv.classList.remove('hidden');
        startTime = Date.now();
        
        // TEST 모드일 경우 마지막 문항으로 바로 이동
        if (isTestMode) {
          console.log('TEST 모드: 마지막 문항으로 이동');
          respA = Array(questionsA.length).fill(3); // 기본값 3으로 설정
          respB = Array(questionsB.length).fill('A'); // 기본값 A로 설정
          
          idxA = questionsA.length - 1;
          idxB = questionsB.length - 1;
          idxC = 0;
          typeCPage = 6; // 마지막 Type C 섹션 (문항 7-10)
          
          stage = 'C';
          startTotalTimer();
          startSegmentCTimer();
          renderQuestionC();
        } else {
          // 일반 모드: 처음부터 시작
          idxA = idxB = idxC = 0;
          stage = 'A';
          startTotalTimer();
          startSegmentATimer();
          renderQuestionA();
        }
      })
      .catch(e => {
        console.error(e);
        alert('문항 로딩 실패');
      });
  });

  /* ── 타이머 관련 함수들 ─────────────────────────── */
  function startTotalTimer(){
    clearInterval(totalInt);
    updateTotalTimer();
    totalInt = setInterval(updateTotalTimer, 1000);
  }
  
  function updateTotalTimer(){
    const elapsed = Math.floor((Date.now()-startTime)/1000);
    const remain  = TOTAL_LIMIT - elapsed;
    totalTimerDiv.textContent = `⏱ 전체 경과 시간: ${fmt(elapsed)} | ⏱ 남은 시간: ${fmt(remain)}`;
    if (remain <= 0) finishSurveyLocal();
  }

  function startSegmentATimer(){
    clearInterval(segmentInt);
    updateSegmentATimer();
    segmentInt = setInterval(updateSegmentATimer,1000);
  }
  
  function updateSegmentATimer(){
    const usedA = idxA*A_Q_SEC + (A_Q_SEC - (qLeft||0));
    const remainA = questionsA.length*A_Q_SEC - usedA;
    segmentTimerDiv.textContent = `⏱ Type A 남은시간: ${fmt(remainA)}`;
    if (remainA <= 0) switchToTypeB();
  }
  
  function startSegmentCTimer() {
    clearInterval(segmentInt);
    updateSegmentCTimer();
    segmentInt = setInterval(updateSegmentCTimer, 1000);
  }
  
  function updateSegmentCTimer() {
    const used = typeCPage * C_Q_SEC + ((C_Q_SEC) - (qLeft || 0));
    const total = questionsC.length * C_Q_SEC;
    const remain = total - used;
    segmentTimerDiv.textContent = `⏱ Type C 남은시간: ${fmt(remain)}`;
    if (remain <= 0) finishSurveyLocal();
  }

  function startQuestionTimer(sec, onEnd){
    clearQuestionTimer();
    qLeft = sec; timerDiv.textContent = `⏱ 남은 문항 시간: ${qLeft}초`;
    qInt = setInterval(()=>{
      qLeft--; timerDiv.textContent = `⏱ 남은 문항 시간: ${qLeft}초`;
      if (qLeft<=0) clearInterval(qInt);
    },1000);
    qTO = setTimeout(onEnd, sec*1000);
  }
  
  function clearQuestionTimer(){
    clearInterval(qInt);
    clearTimeout(qTO);
  }

  /* ── Type A 렌더링 & 이동 ─────────────────────── */
  const A_LABELS = {
    5: '매우 그렇다',
    4: '약간 그렇다',
    3: '보통',
    2: '약간 아니다',
    1: '전혀 아니다'
  };

  function renderQuestionA() {
    clearQuestionTimer();
    const cur = questionsA[idxA];
    surveyTitle.textContent = `Type A (${idxA+1}/${questionsA.length})`;
    questionText.innerHTML = `
      <strong>${cur.no}. ${cur.q}</strong>
      <div style="margin-top:8px;">${cur.p||''}</div>
    `;

    // 버튼 생성 부분
    answersDiv.innerHTML = '';
    [5,4,3,2,1].forEach(score => {
      const btn = document.createElement('button');
      btn.textContent = `${score} (${A_LABELS[score]})`;
      // 선택된 값 유지
      if (respA[idxA] === score) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        respA[idxA] = score;
        answersDiv.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
        nextBtn.disabled = false;
      });
      answersDiv.appendChild(btn);
    });

    nextBtn.disabled = (respA[idxA] == null);
    nextBtn.onclick = () => moveA();

    startQuestionTimer(A_Q_SEC, () => {
      if (!respA[idxA]) respA[idxA] = 3;  // 기본값
      moveA();
    });
    progressDiv.textContent = `${idxA+1}/${questionsA.length}`;
  }

  function moveA(){
    clearQuestionTimer();
    if(idxA<questionsA.length-1){idxA++; renderQuestionA();}
    else switchToTypeB();
  }

  /* ── Type B 전환 및 렌더링 ─────────────────────── */
  function switchToTypeB(){
    stage='B'; idxB=0;
    clearInterval(segmentInt);
    segmentTimerDiv.textContent = 'Type B 진행 중';
    renderQuestionB();
  }

  function renderQuestionB(){
    clearQuestionTimer();
    const cur = questionsB[idxB];
    surveyTitle.textContent = `Type B (${idxB+1}/${questionsB.length})`;
    
    let html = '';
    // 4~7번: 지문 → 문항
    if (cur.no >= 4 && cur.no <= 7) {
      const p4_7 = 'Q4~Q7. 다음 글을 읽고, 각 빈칸에 들어갈 표현을 고르세요.'
      html += `<div style="margin-top:8px;">${p4_7}</div>`;
      html += `<div style="margin-top:8px;">${cur.p}</div>`;
      html += `<div style="margin-top:8px;"><strong>${cur.no}. ${cur.q}</strong></div>`;
    }
    // 8·9번: 지문8 + Table_I.jpg + 지문9 → 문항
    else if (cur.no === 8 || cur.no === 9) {
      const p8 = questionsB.find(q => q.no === 8).p;
      const p8_1 = 'Martial Arts Club of Fort Dodge';
      const p9 = questionsB.find(q => q.no === 9).p;
      
      html += `<div style="margin-top:8px;">${p8}</div>`;
      html += `<div style="margin-top:8px; text-align: center;"><strong>${p8_1}</strong></div>`;
      html += `<img src="Table_I.jpg" style="max-width:100%; display:block; margin:8px 0;">`;
      html += `<div style="margin-top:8px;">${p9}</div>`;
      html += `<div style="margin-top:8px;"><strong>${cur.no}. ${cur.q}</strong></div>`;
    }
    // 그 외(1~3, 10번 등): 원래대로
    else {
      html += `<strong>${cur.no}. ${cur.q}</strong>`;
      html += `<div style="margin-top:8px;">${cur.p}</div>`;
    }

    questionText.innerHTML = html;
    answersDiv.innerHTML = '';
      
    ['A','B','C','D'].forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = `(${opt}) ${cur[opt]}`;

      if (respB[idxB] === opt) btn.classList.add('selected');
      btn.addEventListener('click', () => {
        respB[idxB] = opt;
        answersDiv.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
        btn.classList.add('selected');
        nextBtn.disabled = false;
      });
      answersDiv.appendChild(btn);
    });

    nextBtn.disabled = !respB[idxB];
    nextBtn.onclick = () => moveB();
    
    startQuestionTimer(B_Q_SEC, () => {
      if(!respB[idxB]) respB[idxB] = 'X';
      moveB();
    });
    
    progressDiv.textContent = `${idxB+1}/${questionsB.length}`;
  }
  
  function moveB(){
    clearQuestionTimer();
    if(idxB < questionsB.length-1){ 
      idxB++; 
      renderQuestionB(); 
    } else {
      switchToTypeC();
    }
  }

  /* ── Type C 전환 및 렌더링 ─────────────────────── */
  function switchToTypeC() {
    typeCPage = 0;
    startSegmentCTimer();
    renderQuestionC();
  }

  function renderQuestionC() {
    clearQuestionTimer();
    answersDiv.innerHTML = '';

    // 1~6번: 각각 한 페이지
    if (typeCPage < 6) {
      const q = questionsC[typeCPage];
      surveyTitle.textContent = `Type C (문항 ${q.no}/10)`;
      progressDiv.textContent = `${typeCPage+1}/${questionsC.length}`;

      questionText.innerHTML = `
        <div>
          <img src="Q${q.no}.jpg" style="max-width:100%; margin-bottom:16px;">
        </div>`;

      // 보기 버튼
      ['A', 'B', 'C', 'D'].forEach(opt => {
        const btn = document.createElement('button');
        btn.textContent = `(${opt})`;
        btn.classList.add('c-option');
        
        if (respC[q.no - 1] === opt) btn.classList.add('selected');

        btn.addEventListener('click', () => {
          respC[q.no - 1] = opt;
          document.querySelectorAll('.c-option').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          nextBtn.disabled = false;
        });

        answersDiv.appendChild(btn);
      });

      nextBtn.style.display = 'inline-block';
      nextBtn.textContent = '다음 ▶';
      prevBtn.style.display = 'none';
      nextBtn.disabled = !respC[q.no - 1];

      nextBtn.onclick = () => {
        if (!respC[q.no - 1]) respC[q.no - 1] = 'X';
        typeCPage++;
        renderQuestionC();
      };

      startQuestionTimer(C_Q_SEC, () => {
        if (!respC[q.no - 1]) respC[q.no - 1] = 'X';
        typeCPage++;
        renderQuestionC();
      });
    }
    // 7~10번: 묶음 페이지
    else {
      surveyTitle.textContent = 'Type C (문항 7–10)';
      let html = `
        <div style="margin-bottom:16px;">
          <img src="P1.jpg" style="max-width:100%; margin-bottom:8px;">
          <img src="P2.jpg" style="max-width:100%;">
        </div>
      `;

      // Q7~Q10
      for (let qNo = 7; qNo <= 10; qNo++) {
        html += `
          <div style="margin-top:16px;">
            <img src="Q${qNo}.jpg" style="max-width:100%; margin-bottom:8px;">
            <div class="answers" style="margin-top:8px;">
              ${['A', 'B', 'C', 'D'].map(opt => `
                <button class="c-opt" data-no="${qNo}" data-value="${opt}">${opt}</button>
              `).join('')}
            </div>
          </div>
        `;
      }

      html += `<div style="text-align: center; margin-top: 20px;">
        <button id="finishSurveyBtn" style="padding: 15px 40px; background: #3F51B5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1.1em;">
          <strong>설문 완료</strong>
        </button>
      </div>`;
      
      questionText.innerHTML = html;
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';

      // 보기 선택 처리
      document.querySelectorAll('.c-opt').forEach(btn => {
        const no = parseInt(btn.dataset.no);
        const val = btn.dataset.value;
        
        // 기존 선택 표시
        if (respC[no - 1] === val) {
          btn.classList.add('selected');
        }
        
        btn.addEventListener('click', () => {
          respC[no - 1] = val;
          document.querySelectorAll(`.c-opt[data-no="${no}"]`)
            .forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });

      // 설문 완료 버튼 이벤트 리스너 설정 - 직접 함수 정의
      const finishBtn = document.getElementById('finishSurveyBtn');
      
      if (finishBtn) {
        // 클릭 가시성 개선
        finishBtn.style.background = '#ff5722';
        finishBtn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        finishBtn.style.transition = 'all 0.3s ease';
        
        // 호버 효과
        finishBtn.onmouseover = () => {
          finishBtn.style.background = '#e64a19';
          finishBtn.style.transform = 'translateY(-2px)';
        };
        
        finishBtn.onmouseout = () => {
          finishBtn.style.background = '#ff5722';
          finishBtn.style.transform = 'translateY(0)';
        };
        
        // 클릭 이벤트
        finishBtn.onclick = (event) => {
          event.preventDefault();
          console.log('설문 완료 버튼 클릭됨!');
          
          // 응답 값 채우기
          for (let i = 6; i <= 9; i++) {
            if (!respC[i]) respC[i] = 'X';
          }
          
          // 직접 화면 전환
          try {
            console.log('finishSurveyLocal 호출 시도...');
            
            // 화면 전환 먼저 수행 (오류가 나도 넘어가도록)
            clearQuestionTimer();
            if (typeof totalInt !== 'undefined') clearInterval(totalInt);
            if (surveyDiv && resultDiv) {
              surveyDiv.classList.add('hidden');
              resultDiv.classList.remove('hidden');
              
              // 상태 메시지 표시
              const statusEl = document.getElementById('email-status');
              if (statusEl) {
                statusEl.textContent = '이메일 전송 준비 중...';
                statusEl.style.color = '#1A237E';
              }
            }
            
            // 결과 처리 함수 호출
            if (typeof finishSurveyLocal === 'function') {
              console.log('finishSurveyLocal 함수 호출');
              finishSurveyLocal();
            } else {
              console.error('finishSurveyLocal 함수를 찾을 수 없습니다');
              alert('설문 완료 함수를 찾을 수 없습니다. 관리자에게 문의하세요.');
            }
          } catch (error) {
            console.error('설문 완료 처리 중 오류 발생:', error);
            alert('설문 완료 처리 중 오류가 발생했습니다: ' + error.message);
            
            if (emailStatus) {
              emailStatus.textContent = '오류가 발생했습니다. 결과가 저장되지 않았을 수 있습니다.';
              emailStatus.style.color = '#D32F2F';
            }
          }
        };
      } else {
        console.error('설문 완료 버튼 요소를 찾을 수 없습니다');
      }

      startQuestionTimer(C_Q_SEC * 4, () => {
        for (let i = 6; i <= 9; i++) {
          if (!respC[i]) respC[i] = 'X';
        }
        finishSurveyLocal();
      });
    }
  }

}); // end of DOMContentLoaded
