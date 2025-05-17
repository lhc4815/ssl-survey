import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// 정적 파일 디렉토리 설정
app.use(express.static(path.join(__dirname, 'docs')));
app.use(express.static(path.join(__dirname, 'data')));

// 데이터 디렉토리 생성 (없는 경우)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 루트 경로에 대한 핸들러
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// JSON 바디 파싱
app.use(express.json({ limit: '50mb' }));

// 설문 결과 이메일 전송 API
app.post('/api/send-email', (req, res) => {
  console.log('이메일 전송 요청 받음:', req.body.studentName);
  
  // 요청 데이터 로깅 (디버깅용)
  console.log('요청 본문 데이터:', JSON.stringify(req.body, null, 2));
  
  // 샘플 응답 (실제 이메일 전송은 아직 구현되지 않음)
  res.json({ 
    success: true, 
    messageId: 'dummy-id-' + Date.now(),
    message: `이메일 전송이 요청되었습니다 (테스트 모드)`
  });
});

app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log(`정적 파일 제공 디렉토리: docs/, data/`);
});
