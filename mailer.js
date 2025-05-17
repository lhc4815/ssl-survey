// mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import * as XLSX from 'xlsx';

// .env 파일 불러오기
dotenv.config();

// 파일 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SMTP 설정 객체
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail 앱 비밀번호
  },
});

/**
 * 이메일 전송 함수
 * @param {string} to - 받는 사람 이메일 주소
 * @param {string} subject - 이메일 제목
 * @param {string} text - 이메일 본문 (일반 텍스트)
 * @param {string} html - 이메일 본문 (HTML)
 * @param {Array<{filename: string, content: Buffer}>} attachments - 첨부 파일 배열
 * @returns {Promise<Object>} 전송 결과
 */
export async function sendEmail({ to, subject, text, html, attachments = [] }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('이메일 전송 성공:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('이메일 전송 오류:', error);
    throw error;
  }
}

/**
 * 설문 결과를 이메일로 전송
 * @param {string} to - 받는 사람 이메일 주소
 * @param {string} studentName - 학생 이름
 * @param {Buffer} fileBuffer - 첨부 파일 버퍼
 * @param {string} fileType - 파일 타입(확장자)
 * @returns {Promise<Object>} 전송 결과
 */
export async function sendSurveyResult(to, studentName, fileBuffer, fileType = 'xlsx') {
  const subject = `[SSL 설문조사] ${studentName} 학생의 설문 결과`;
  const text = `안녕하세요,\n\n${studentName} 학생의 SSL 설문 결과를 첨부합니다.\n감사합니다.`;
  const html = `
    <h2>SSL 설문조사 결과</h2>
    <p>안녕하세요,</p>
    <p><strong>${studentName}</strong> 학생의 SSL 설문 결과를 첨부합니다.</p>
    <p>감사합니다.</p>
  `;

  const attachments = [];
  
  // JSON 파일 첨부
  attachments.push({
    filename: `survey_result_${studentName}.${fileType}`,
    content: fileBuffer
  });
  
  try {
    // 먼저 JSON을 파싱하여 내용 확인
    const jsonData = JSON.parse(fileBuffer.toString());
    console.log('JSON 데이터 내용 확인:', Object.keys(jsonData));
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    
    // 개인정보 워크시트 생성
    if (jsonData.personalInfo) {
      // 2차원 배열로 변환
      const personalData = [
        ['항목', '값'],
        ['학생ID', jsonData.personalInfo.학생ID || ''],
        ['학생성명', jsonData.personalInfo.학생성명 || ''],
        ['출신학교', jsonData.personalInfo.출신학교 || ''],
        ['성별', jsonData.personalInfo.성별 || ''],
        ['거주지역', jsonData.personalInfo.거주지역 || ''],
        ['B등급과목수', jsonData.personalInfo.B등급과목수 || ''],
        ['진학희망고교', jsonData.personalInfo.진학희망고교 || '']
      ];
      
      const personalWs = XLSX.utils.aoa_to_sheet(personalData);
      XLSX.utils.book_append_sheet(wb, personalWs, '개인정보');
    }
    
    // 성향검사 워크시트 생성
    if (jsonData.성향검사) {
      const aptitudeData = [
        ['항목', '값'],
        ['자기조절능력평균', jsonData.성향검사.자기조절능력평균 || 0],
        ['비교과수행능력평균', jsonData.성향검사.비교과수행능력평균 || 0],
        ['내면학업수행능력평균', jsonData.성향검사.내면학업수행능력평균 || 0],
        ['언어정보처리능력평균', jsonData.성향검사.언어정보처리능력평균 || 0],
        ['공학적사고력평균', jsonData.성향검사.공학적사고력평균 || 0],
        ['의약학적성평균', jsonData.성향검사.의약학적성평균 || 0]
      ];
      
      const aptitudeWs = XLSX.utils.aoa_to_sheet(aptitudeData);
      XLSX.utils.book_append_sheet(wb, aptitudeWs, '성향검사');
    }
    
    // 영어평가 워크시트 생성
    if (jsonData.영어평가) {
      const englishData = [
        ['항목', '값'],
        ['총점', jsonData.영어평가.총점 || 0]
      ];
      
      const englishWs = XLSX.utils.aoa_to_sheet(englishData);
      XLSX.utils.book_append_sheet(wb, englishWs, '영어평가');
    }
    
    // 수학평가 워크시트 생성
    if (jsonData.수학평가) {
      const mathData = [
        ['항목', '값'],
        ['총점', jsonData.수학평가.총점 || 0]
      ];
      
      const mathWs = XLSX.utils.aoa_to_sheet(mathData);
      XLSX.utils.book_append_sheet(wb, mathWs, '수학평가');
    }
    
    // 종합정보 워크시트 생성
    if (jsonData.종합정보) {
      const summaryData = [
        ['항목', '값'],
        ['설문완료일시', jsonData.종합정보.설문완료일시 || ''],
        ['사용한코드', jsonData.종합정보.사용한코드 || '']
      ];
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, '종합정보');
    }
    
    // 엑셀 파일을 버퍼로 변환
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // 엑셀 파일 첨부
    attachments.push({
      filename: `survey_result_${studentName}.xlsx`,
      content: excelBuffer
    });
    
    console.log('엑셀 파일 생성 및 첨부 성공');
  } catch (err) {
    console.error('엑셀 파일 생성 및 첨부 오류:', err);
  }

  return sendEmail({ to, subject, text, html, attachments });
}
