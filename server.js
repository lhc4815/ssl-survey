// server.js

import { uploadFile } from './githubApi.js';
import { sendSurveyResult } from './mailer.js';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// .env 파일 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 바디 파싱: Base64 전송용으로 최대 50MB 허용
app.use(express.json({
  limit: '50mb'
}));

// 데이터 저장 디렉터리 설정
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'docs')));

// 루트 경로에 대한 명시적 핸들러 추가 (simple-server.js에서 가져옴)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// GitHub 업로드 API
app.post('/api/upload', async (req, res) => {
  const { path, content, commitMessage } = req.body;
  try {
    const result = await uploadFile(path, content, commitMessage);
    res.json({ rawUrl: result.content.download_url });
  } catch (err) {
    console.error('upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 엑셀 자동 저장 API
app.post('/api/save-excel', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({
      success: false,
      error: 'filename과 content(베이스64 문자열)가 필요합니다.'
    });
  }

  // 1) 저장할 전체 경로
  const filePath = path.join(DATA_DIR, filename);

  try {
    // 2) Base64 → Buffer
    const fileBuffer = Buffer.from(content, 'base64');

    // 3) 파일 쓰기
    fs.writeFileSync(filePath, fileBuffer);

    // 4) 성공 응답
    res.json({ success: true, file: filePath });
  } catch (err) {
    console.error('[/api/save-excel] 파일 저장 중 오류:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 설문 결과 이메일 전송 API
app.post('/api/send-email', async (req, res) => {
  const { email, studentName, content, fileType = 'xlsx' } = req.body;
  
  // 고정된 이메일 주소 사용
  const targetEmail = 'lhc4815@gmail.com';
  
  if (!studentName || !content) {
    return res.status(400).json({
      success: false,
      error: '학생 이름과 파일 내용이 필요합니다.'
    });
  }

  try {
    // Base64 → Buffer
    const fileBuffer = Buffer.from(content, 'base64');
    
    // 이메일 전송
    const result = await sendSurveyResult(targetEmail, studentName, fileBuffer, fileType);
    
    res.json({ 
      success: true, 
      messageId: result.messageId,
      message: `${targetEmail}로 이메일이 성공적으로 전송되었습니다.` 
    });
  } catch (err) {
    console.error('[/api/send-email] 이메일 전송 중 오류:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 404 처리 - 모든 경로를 index.html로 라우팅 (SPA 지원)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) {
    return res.sendFile(path.join(__dirname, 'docs', 'index.html'));
  }
  next();
});

// 로컬 개발 환경에서만 서버 시작
// Vercel에서는 이 부분이 실행되지 않음
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`▶ Server running at http://localhost:${PORT}`);
  });
}

// Vercel 서버리스 함수로 내보내기
export default app;
