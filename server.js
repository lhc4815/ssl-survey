// server.js

import { uploadFile } from './githubApi.js';

const express = require('express');
const app     = express();

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

const fs      = require('fs');
const path    = require('path');
const PORT    = process.env.PORT || 3000;

// JSON 바디 파싱: Base64 전송용으로 최대 50MB 허용
app.use(express.json({
  limit: '50mb'
}));


// 데이터 저장 디렉터리 설정
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.static(path.join(__dirname, 'docs')));  // 실제 경로로 조정


// ─── 설문 결과 저장 API ─────────────────────────────
// JSON 바디 최대 50MB 허용
app.use(express.json({ limit: '50mb' }));

// data 폴더가 없으면 생성
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// docs 폴더에도 직접 저장할 수 있도록 설정
const DOCS_DIR = path.join(__dirname, 'docs');
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true });

// ─── 엑셀 자동 저장 API ─────────────────────────────────────
app.post('/api/save-excel', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
    return res.status(400).json({
      success: false,
      error: 'filename과 content(베이스64 문자열)가 필요합니다.'
    });
  }

  try {
    // Base64 → Buffer
    const fileBuffer = Buffer.from(content, 'base64');

    // 파일 저장 - DATA_DIR에 저장
    const dataFilePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(dataFilePath, fileBuffer);
    
    // docs 폴더에도 복사본 저장 (클라이언트에서 접근 가능하도록)
    if (filename === 'used_data.xlsx') {
      const docsFilePath = path.join(DOCS_DIR, filename);
      fs.writeFileSync(docsFilePath, fileBuffer);
      console.log(`✓ 파일이 두 위치에 저장됨: ${dataFilePath}, ${docsFilePath}`);
    }

    // 성공 응답
    res.json({ 
      success: true, 
      file: dataFilePath,
      accessUrl: filename // 클라이언트에서 접근 가능한 상대 URL
    });
  } catch (err) {
    console.error('[/api/save-excel] 파일 저장 중 오류:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// 설문 데이터 저장 API (memoryDB 용)
app.post('/api/save-survey', (req, res) => {
  try {
    // 로그만 출력하고 성공 응답
    console.log('설문 데이터 저장 요청 받음');
    res.json({ success: true });
  } catch (err) {
    console.error('[/api/save-survey] 오류:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 사용된 코드 저장 API
app.post('/api/save-codes', (req, res) => {
  try {
    // 로그만 출력하고 성공 응답
    console.log('사용된 코드 저장 요청 받음');
    res.json({ success: true });
  } catch (err) {
    console.error('[/api/save-codes] 오류:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 정적 파일 제공 (docs 폴더의 파일들)
app.use(express.static(path.join(__dirname, 'docs')));

app.listen(PORT, () => {
  console.log(`▶ Server running at http://localhost:${PORT}`);
});
