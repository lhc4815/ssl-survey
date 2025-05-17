// JSON 결과 생성 함수
function generateSurveyResultJSON(surveyData) {
  // 1. 설문 결과를 JSON 데이터로 준비
  const jsonResult = {
    personalInfo: {
      학생ID: surveyData.학생ID,
      학생성명: surveyData.학생성명,
      출신학교: surveyData.출신학교,
      성별: surveyData.성별 === 0 ? '남자' : (surveyData.성별 === 1 ? '여자' : '기타'),
      거주지역: surveyData.거주지역,
      B등급과목수: surveyData.B등급과목수,
      진학희망고교: surveyData.진학희망고교
    },
    성향검사: {
      자기조절능력평균: surveyData.자기조절능력평균,
      비교과수행능력평균: surveyData.비교과수행능력평균,
      내면학업수행능력평균: surveyData.내면학업수행능력평균,
      언어정보처리능력평균: surveyData.언어정보처리능력평균,
      공학적사고력평균: surveyData.공학적사고력평균,
      의약학적성평균: surveyData.의약학적성평균
    },
    영어평가: {
      총점: surveyData.TypeB총점
    },
    수학평가: {
      총점: surveyData.TypeC총점
    },
    종합정보: {
      설문완료일시: surveyData.설문완료일시,
      사용한코드: surveyData.사용한코드
    }
  };

  return jsonResult;
}

// 사용된 코드 JSON 생성 함수
function generateUsedCodesJSON(usedCodes, surveyDB) {
  return usedCodes.map(code => {
    const record = surveyDB.find(r => r['사용한코드'] === code) || {};
    return {
      code,
      학생성명: record.학생성명 || '',
      출신학교: record.출신학교 || '',
      성별: record.성별 !== undefined ? 
        (record.성별 === 0 ? '남자' : (record.성별 === 1 ? '여자' : '기타')) : '',
      설문완료일시: record.설문완료일시 || ''
    };
  });
}
