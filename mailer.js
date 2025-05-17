// mailer.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// .env 파일 불러오기
dotenv.config();

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

  const attachments = [{
    filename: `survey_result_${studentName}.${fileType}`,
    content: fileBuffer
  }];

  return sendEmail({ to, subject, text, html, attachments });
}
