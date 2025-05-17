// 결과 처리 및 화면 전환 함수
function finishSurveyLocal() {
  clearQuestionTimer();
  clearInterval(totalInt);
  surveyDiv.classList.add('hidden');
  resultDiv.classList.remove('hidden');

  // 외부 모듈의 finishSurvey 함수 호출
  const params = {
    nameIn, currentCode, usedCodes, emailStatus, sendEmailBtn,
    downloadLink, usedDL, respA, respB, respC, questionsA, questionsB, questionsC,
    bPills, tPills, regionIn, clearQuestionTimer, totalInt, surveyDiv, resultDiv
  };
  
  try {
    // 외부 모듈의 finishSurvey 함수 호출
    finishSurvey(params);
  } catch (err) {
    console.error("설문 완료 처리 중 오류:", err);
    alert("설문 결과 저장 중 오류가 발생했습니다.");
  }
}

// 시간 포맷 헬퍼
function fmt(s) { 
  return pad(Math.floor(s/60)) + ':' + pad(s%60); 
}

function pad(n) { 
  return n.toString().padStart(2, '0'); 
}
