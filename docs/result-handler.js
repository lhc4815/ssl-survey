// JSON 저장 & 이메일 관련 함수를 분리한 모듈

// 설문 결과를 JSON으로 변환
function generateSurveyResultJSON(row) {
  // 1. 설문 결과를 JSON 데이터로 준비
  const jsonResult = {
    personalInfo: {
      학생ID: row.학생ID,
      학생성명: row.학생성명 || 'N/A',
      출신학교: row.출신학교 || 'N/A',
      성별: row.성별 !== undefined ? 
        (row.성별 === 0 ? '남자' : (row.성별 === 1 ? '여자' : '기타')) : 'N/A',
      거주지역: row.거주지역 || 'N/A',
      B등급과목수: typeof row.B등급과목수 === 'number' ? row.B등급과목수 : 0,
      진학희망고교: typeof row.진학희망고교 === 'number' ? 
        (row.진학희망고교 === 0 ? '일반고' : 
         row.진학희망고교 === 1 ? '자사고' : 
         row.진학희망고교 === 2 ? '특목고' : 
         row.진학희망고교 === 3 ? '특성화고' : '일반고') : '일반고'
    },
    성향검사: {
      자기조절능력평균: typeof row.자기조절능력평균 === 'number' ? parseFloat(row.자기조절능력평균.toFixed(2)) : 0,
      비교과수행능력평균: typeof row.비교과수행능력평균 === 'number' ? parseFloat(row.비교과수행능력평균.toFixed(2)) : 0,
      내면학업수행능력평균: typeof row.내면학업수행능력평균 === 'number' ? parseFloat(row.내면학업수행능력평균.toFixed(2)) : 0,
      언어정보처리능력평균: typeof row.언어정보처리능력평균 === 'number' ? parseFloat(row.언어정보처리능력평균.toFixed(2)) : 0,
      공학적사고력평균: typeof row.공학적사고력평균 === 'number' ? parseFloat(row.공학적사고력평균.toFixed(2)) : 0,
      의약학적성평균: typeof row.의약학적성평균 === 'number' ? parseFloat(row.의약학적성평균.toFixed(2)) : 0
    },
    영어평가: {
      총점: row.TypeB총점 || 0
    },
    수학평가: {
      총점: row.TypeC총점 || 0
    },
    종합정보: {
      설문완료일시: row.설문완료일시 || new Date().toISOString(),
      사용한코드: row.사용한코드 || 'N/A'
    }
  };

  return jsonResult;
}

// 사용된 코드 목록을 JSON으로 변환
function generateUsedCodesJSON(usedCodes, surveyDB) {
  // 방어적 코딩: usedCodes가 undefined거나 배열이 아닌 경우 빈 배열 반환
  if (!Array.isArray(usedCodes)) {
    console.error('generateUsedCodesJSON: usedCodes가 배열이 아닙니다', usedCodes);
    return [];
  }
  
  // surveyDB가 배열이 아닌 경우 빈 배열로 처리
  if (!Array.isArray(surveyDB)) {
    console.error('generateUsedCodesJSON: surveyDB가 배열이 아닙니다', surveyDB);
    surveyDB = [];
  }
  
  try {
    return usedCodes.map(code => {
      const record = surveyDB.find(r => r && r['사용한코드'] === code) || {};
      return {
        code,
        학생성명: record.학생성명 || 'N/A',
        출신학교: record.출신학교 || 'N/A', 
        성별: record.성별 !== undefined ? 
          (record.성별 === 0 ? '남자' : (record.성별 === 1 ? '여자' : '기타')) : 'N/A',
        설문완료일시: record.설문완료일시 || 'N/A'
      };
    });
  } catch (error) {
    console.error('코드 목록 JSON 변환 중 오류:', error);
    return [];
  }
}

// 이메일 전송 처리
async function handleEmailSend(row, emailStatus) {
  // 방어적 코딩: emailStatus 확인 함수
  const updateStatus = (text, color) => {
    try {
      // DOM 요소가 존재하는지 더 엄격하게 확인
      if (emailStatus && typeof emailStatus === 'object' && 'textContent' in emailStatus) {
        emailStatus.textContent = text;
        if (color && typeof emailStatus.style === 'object') {
          emailStatus.style.color = color;
        }
        console.log('상태 메시지 업데이트:', text);
      } else {
        // DOM 요소 대신 콘솔에 출력
        console.log('이메일 상태:', text);
      }
    } catch (e) {
      console.error('상태 업데이트 오류:', e);
    }
  };
  
  // 고정된 이메일 주소
  const email = 'lhc4815@gmail.com';
  const nameVal = row && row.학생성명 ? row.학생성명 : 'N/A';
  
  // 초기 상태 설정
  updateStatus('이메일 전송 준비 중...', '#1A237E');
  
  try {
    // 결과 JSON 생성
    const jsonResult = generateSurveyResultJSON(row);
    const jsonStr = JSON.stringify(jsonResult, null, 2);
    console.log('이메일 전송 데이터 준비 완료');
    
    // Base64로 변환
    let content;
    try {
      content = btoa(unescape(encodeURIComponent(jsonStr)));
    } catch (e) {
      console.error('Base64 인코딩 오류:', e);
      content = btoa(JSON.stringify({error: '인코딩 오류', data: nameVal}));
    }
    
    updateStatus('서버에 이메일 전송 요청 중...', '#1A237E');
    
    // 서버에 이메일 전송 요청
    console.log('이메일 전송 API 호출 시작');
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        studentName: nameVal,
        content,
        fileType: 'json'
      })
    });
    
    console.log('이메일 API 응답 받음:', response.status);
    
    if (!response.ok) {
      throw new Error(`서버 응답 오류 (${response.status})`);
    }
    
    const result = await response.json();
    console.log('이메일 전송 결과:', result);
    
    if (result.success) {
      updateStatus(`${email}로 이메일이 성공적으로 전송되었습니다.`, '#2E7D32');
      return true;
    } else {
      throw new Error(result.error || '이메일 전송 실패');
    }
  } catch (err) {
    console.error('이메일 전송 중 오류:', err);
    updateStatus(`오류: ${err.message || '이메일 전송에 실패했습니다.'}`, '#D32F2F');
    return false;
  }
}

// 설문 완료 처리 함수
function finishSurvey(params) {
  console.log('finishSurvey 함수 시작, 파라미터:', Object.keys(params));
  
  // 파라미터 안전 추출 (방어적 코딩)
  const {
    nameIn, currentCode, usedCodes, emailStatus, sendEmailBtn,
    downloadLink, usedDL, respA, respB, respC, questionsA, questionsB, questionsC,
    bPills, tPills, regionIn, clearQuestionTimer, totalInt, surveyDiv, resultDiv
  } = params || {};
  
  // A) UI 전환 & 타이머 정리
  if (typeof clearQuestionTimer === 'function') clearQuestionTimer();
  if (totalInt) clearInterval(totalInt);
  if (surveyDiv) surveyDiv.classList.add('hidden');
  if (resultDiv) resultDiv.classList.remove('hidden');

  // ── 코드 사용 등록 확실하게 처리 ───────────────────
  if (currentCode && currentCode.length >= 4 && Array.isArray(usedCodes)) {
    if (!usedCodes.includes(currentCode)) {
      usedCodes.push(currentCode);
      // 로컬스토리지에 반영
      try {
        localStorage.setItem('usedCodes', JSON.stringify(usedCodes));
        console.log('✔ 코드 사용 등록:', currentCode);
      } catch (e) {
        console.error('코드 저장 오류:', e);
      }
    }
  }

  // B) 개인 정보 수집 (방어적 코딩)
  
  // TEST 모드에서 직접 복사된 폼 데이터가 있는지 확인
  const hasFormData = params.formData && typeof params.formData === 'object';
  if (hasFormData) {
    console.log('TEST 모드: 직접 복사된 폼 데이터 사용:', params.formData);
  }
  
  const nameVal = hasFormData ? params.formData.name : 
                  (nameIn && nameIn.value) ? nameIn.value : 'N/A';
  
  const genderMap = { '남': 0, '여': 1, '기타': 2 };
  const schoolTypeMap = { '일반고': 0, '자사고': 1, '특목고': 2, '특성화고': 3 };
  
  // genderIn 안전 참조
  let genderCode = 0; // 기본값을 '남'(0)으로 변경
  try {
    if (hasFormData) {
      // formData에서 직접 값 사용 - TEST 모드에서는 '남'으로 기본 설정
      genderCode = params.formData.gender ? genderMap[params.formData.gender] || 0 : 0;
      console.log('formData에서 성별 정보 추출:', params.formData.gender, '->', genderCode);
    } else if (params.genderIn && params.genderIn.value) {
      genderCode = genderMap[params.genderIn.value] || 0;
      console.log('genderIn에서 성별 정보 추출:', params.genderIn.value, '->', genderCode);
    } else {
      console.log('성별 정보 없음, 기본값(남) 사용');
    }
  } catch (e) {
    console.error('성별 정보 처리 오류:', e);
  }
  
  // regionIn 안전 참조
  let regionCode = 0; // 기본값을 0(서울)으로 설정
  try {
    if (hasFormData) {
      // formData에서 직접 지역 정보 사용
      const regionName = params.formData.region;
      console.log('직접 복사된 지역 정보:', regionName);
      
      // 지역명 → 코드 변환 맵
      const regionCodeMap = {
        '서울 특별시': 0,
        '경기도': 1,
        '인천 광역시': 2,
        '강원도': 3,
        '충청북도': 4,
        '충청남도': 5,
        '대전 광역시': 6,
        '세종 특별자치시': 7,
        '경상북도': 8,
        '경상남도': 9,
        '대구 광역시': 10,
        '울산 광역시': 11,
        '부산 광역시': 12,
        '전라북도': 13,
        '전라남도': 14,
        '광주 광역시': 15,
        '제주 특별자치도': 16
      };
      
      // 지역명이 맵에 있으면 해당 코드를, 없으면 기본값(서울) 사용
      regionCode = regionCodeMap[regionName] !== undefined ? regionCodeMap[regionName] : 0;
      console.log('지역명 → 코드 변환:', regionName, '->', regionCode);
      
    } else if (regionIn && regionIn.options && regionIn.selectedOptions) {
      const regionOpts = Array.from(regionIn.options).filter(o => o.value);
      const sortedRegions = regionOpts.map(o => o.text).sort((a,b) => a.localeCompare(b,'ko'));
      regionCode = sortedRegions.indexOf(regionIn.selectedOptions[0].text);
      console.log('regionIn에서 지역 정보 추출:', regionIn.selectedOptions[0].text, '->', regionCode);
    } else {
      console.log('지역 정보 없음, 기본값(서울) 사용');
    }
  } catch (e) {
    console.error('지역 정보 처리 오류:', e);
  }

  // C) Type A 처리: 데이터+평균 (방어적 코딩)
  let dataA = [];
  let categories = [];
  let averages = [];
  
  try {
    if (Array.isArray(questionsA) && Array.isArray(respA)) {
      dataA = questionsA.map((q, i) => ({
        연번: q.no,
        '척도(대분류)': q.category,
        응답: respA[i]
      }));
      
      categories = [...new Set(questionsA.filter(q => q && q.category).map(q => q.category))];
      
      averages = categories.map(cat => {
        const vals = questionsA
          .map((q, i) => (q && q.category === cat && i < respA.length) ? respA[i] : null)
          .filter(v => v != null);
        return {
          '척도(대분류)': cat,
          평균: vals.length ? vals.reduce((s, x) => s + x, 0) / vals.length : 0
        };
      });
    } else {
      console.error('Type A 처리 실패: questionsA 또는 respA가 배열이 아님');
    }
  } catch (e) {
    console.error('Type A 처리 중 오류:', e);
  }

  // D) Type B 처리: 정답비교+총점 (방어적 코딩)
  let dataB = [];
  let totalB = 0;
  
  try {
    if (Array.isArray(questionsB) && Array.isArray(respB)) {
      dataB = questionsB.map((q, i) => ({
        연번: q.no,
        응답: respB[i],
        정답: q.correct,
        정오: respB[i] === q.correct ? 'O' : 'X'
      }));
      
      totalB = dataB.reduce((s, row) => s + (row.정오 === 'O' ? 5 : 0), 0);
    } else {
      console.error('Type B 처리 실패: questionsB 또는 respB가 배열이 아님');
    }
  } catch (e) {
    console.error('Type B 처리 중 오류:', e);
  }

  // E) Type C 처리: 정답비교+총점 (방어적 코딩)
  let dataC = [];
  let totalC = 0;
  
  try {
    if (Array.isArray(questionsC) && Array.isArray(respC)) {
      dataC = questionsC.map((q, i) => ({
        연번: q.no,
        응답: respC[i],
        정답: q.correct,
        정오: respC[i] === q.correct ? 'O' : 'X'
      }));
      
      totalC = dataC.reduce((s, row) => s + (row.정오 === 'O' ? 5 : 0), 0);
    } else {
      console.error('Type C 처리 실패: questionsC 또는 respC가 배열이 아님');
    }
  } catch (e) {
    console.error('Type C 처리 중 오류:', e);
  }

  // F) DB 누적
  const STORAGE_KEY = 'surveyDB';
  let surveyDB = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  
  const nextId = 'STU' + String(surveyDB.length + 1).padStart(4, '0');
  const now = new Date();
  const completeAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ` +
                     `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  
  // 학생 정보 생성 (방어적 코딩)
  let schoolValue = 'N/A';
  try {
    // TEST 모드에서는 formData의 school 값 사용, 아니면 schoolIn.value 사용
    if (hasFormData && params.formData.school) {
      schoolValue = params.formData.school;
      console.log('formData에서 학교 정보 추출:', schoolValue);
    } else if (params.schoolIn && params.schoolIn.value) {
      schoolValue = params.schoolIn.value.trim();
      console.log('schoolIn에서 학교 정보 추출:', schoolValue);
    } else {
      console.warn('학교 정보를 찾을 수 없음, N/A 사용');
    }
  } catch (e) {
    console.error('학교 정보 처리 오류:', e);
  }
  
  // bPills 및 tPills 안전 참조
  let bValue = -1, tValue = -1;
  try {
    if (hasFormData && typeof params.formData.bIndex === 'number') {
      // TEST 모드에서는 formData에서 값 사용
      bValue = params.formData.bIndex;
      console.log('formData에서 B등급 인덱스 추출:', bValue);
    } else if (Array.isArray(bPills)) {
      bValue = bPills.findIndex(p => p && p.classList && p.classList.contains('selected'));
      console.log('bPills에서 B등급 인덱스 추출:', bValue);
    }
  } catch (e) {
    console.error('B등급 정보 처리 오류:', e);
  }
  
  try {
    if (hasFormData && typeof params.formData.tIndex === 'number') {
      // TEST 모드에서는 formData에서 값 사용
      tValue = params.formData.tIndex;
      console.log('formData에서 진학희망 인덱스 추출:', tValue);
    } else if (Array.isArray(tPills)) {
      tValue = tPills.findIndex(p => p && p.classList && p.classList.contains('selected'));
      console.log('tPills에서 진학희망 인덱스 추출:', tValue, '선택된 요소:', 
                 tPills.find(p => p && p.classList && p.classList.contains('selected'))?.dataset?.value);
      
      // 인덱스 값이 없으면 데이터셋에서 직접 매핑 시도
      if (tValue === -1) {
        const selectedPill = tPills.find(p => p && p.classList && p.classList.contains('selected'));
        if (selectedPill && selectedPill.dataset && selectedPill.dataset.value) {
          const mappedValue = schoolTypeMap[selectedPill.dataset.value];
          if (typeof mappedValue === 'number') {
            tValue = mappedValue;
            console.log('데이터셋에서 진학희망 값 매핑:', selectedPill.dataset.value, '->', tValue);
          }
        }
      }
    }
    
    // 강제 할당 (테스트)
    if (isTestMode && tValue === -1) {
      // 테스트 모드에서는 랜덤값 할당 (0-3)
      tValue = Math.floor(Math.random() * 4);
      console.log('TEST 모드: 진학희망고교 임의 할당:', tValue);
    }
  } catch (e) {
    console.error('진학희망 정보 처리 오류:', e);
  }
  
  const row = {
    학생ID: currentCode || nextId, // 학생ID를 사용한 코드로 변경
    학생성명: nameVal,
    출신학교: schoolValue,
    성별: genderCode,
    거주지역: regionCode,
    B등급과목수: bValue === -1 ? 0 : bValue, // 기본값을 0으로 설정
    진학희망고교: tValue === -1 ? 0 : tValue, // 기본값을 0으로 설정
    자기조절능력평균: averages.find(a => a['척도(대분류)'] === '자기조절능력')?.평균 || 0,
    비교과수행능력평균: averages.find(a => a['척도(대분류)'] === '비교과활동수행력')?.평균 || 0,
    내면학업수행능력평균: averages.find(a => a['척도(대분류)'] === '내면학업수행능력')?.평균 || 0,
    언어정보처리능력평균: averages.find(a => a['척도(대분류)'] === '언어정보처리능력')?.평균 || 0,
    공학적사고력평균: averages.find(a => a['척도(대분류)'] === '공학적 사고력')?.평균 || 0,
    의약학적성평균: averages.find(a => a['척도(대분류)'] === '의약학적성')?.평균 || 0,
    TypeB총점: totalB,
    TypeC총점: totalC,
    설문완료일시: completeAt,
    사용한코드: currentCode
  };
  
  try {
    surveyDB.push(row);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(surveyDB));
    console.log('설문 결과 저장 완료:', nextId);
  } catch (e) {
    console.error('결과 저장 오류:', e);
  }

  // JSON 생성 - 설문 결과
  const jsonResult = generateSurveyResultJSON(row);
  const jsonStr = JSON.stringify(jsonResult, null, 2);
  const surveyBlob = new Blob([jsonStr], { type: 'application/json' });
  
  // 다운로드 링크 설정
  if (downloadLink) {
    downloadLink.href = URL.createObjectURL(surveyBlob);
  }
  
  // 사용된 코드 JSON 생성
  const usedCodesData = generateUsedCodesJSON(usedCodes, surveyDB);
  const usedCodesJson = JSON.stringify(usedCodesData, null, 2);
  const usedCodesBlob = new Blob([usedCodesJson], { type: 'application/json' });
  
  if (usedDL) {
    usedDL.href = URL.createObjectURL(usedCodesBlob);
  }
  
  // 자동 이메일 전송
  handleEmailSend(row, emailStatus);
  
  return row;
}

// fmt 헬퍼 함수
function fmt(s) { 
  return pad(Math.floor(s/60)) + ':' + pad(s%60); 
}

function pad(n) { 
  return n.toString().padStart(2, '0'); 
}
