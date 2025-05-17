# SSL-Survey 프로젝트

웹 기반 설문조사 시스템으로, 사용자가 코드를 입력한 후 설문조사를 진행하고 데이터를 저장하는 애플리케이션입니다.

## 프로젝트 구조

- `docs/`: 프론트엔드 파일 (HTML, CSS, JS)
- `server.js`: 메인 서버
- `simple-server.js`: 간단한 테스트용 서버
- `data/`: 설문 데이터와 이미지 파일
- `mailer.js`: 이메일 전송 기능
- `githubApi.js`: GitHub API 연동 기능

## 로컬 실행 방법

1. 의존성 설치
```
npm install
```

2. 서버 실행
```
npm start
```

3. 브라우저에서 접속
```
http://localhost:3000
```

## Vercel 배포 가이드

### 방법 1: Vercel 웹 대시보드 사용

1. [Vercel 웹사이트](https://vercel.com)에 가입 후 로그인

2. "New Project" 버튼 클릭

3. GitHub 저장소 연결 (GitHub 계정 인증 필요)

4. 'ssl-survey' 저장소 찾아 선택

5. 설정 구성:
   - Framework Preset: `Other`
   - Root Directory: 기본값 유지
   - Build Command: 비워두기 (필요하지 않음)
   - Output Directory: `docs` 
   - Install Command: `npm install`

6. 환경 변수 설정 (.env 파일의 모든 변수 추가):
   - GITHUB_TOKEN
   - OWNER
   - REPO
   - BRANCH
   - EMAIL_USER
   - EMAIL_PASS

7. "Deploy" 버튼 클릭

### 방법 2: Vercel CLI 사용

1. Vercel CLI 설치 (이미 완료됨)
```
npm install -g vercel
```

2. Vercel 계정에 로그인
```
vercel login
```

3. 프로젝트 배포 시작
```
vercel
```

4. 화면에 표시되는 설정 질문에 응답:
   - Set up and deploy: `Y`
   - Which scope: 본인 계정 선택
   - Link to existing project: `N`
   - Project name: 기본값 또는 원하는 이름
   - Root directory: 기본값 (현재 디렉토리)
   - Build Command: 건너뛰기 (엔터)
   - Output Directory: `docs`
   - Development Command: `npm start`
   - Override settings: `N`

5. 환경 변수 설정
```
vercel env add GITHUB_TOKEN
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
vercel env add OWNER
vercel env add REPO
vercel env add BRANCH
```

6. 환경 변수 설정 후 프로덕션에 배포
```
vercel --prod
```

## 주의사항

1. **파일 시스템 제한**: Vercel의 서버리스 환경에서는 로컬 파일 시스템 변경이 유지되지 않습니다. 데이터베이스 연결이 필요할 수 있습니다.

2. **이메일 전송 기능**: 현재 설정은 Gmail SMTP를 사용합니다. Vercel 환경에서 이메일 전송 문제가 발생할 경우 SendGrid와 같은 서비스로 전환을 고려하세요.

3. **환경 변수**: 민감한 정보는 반드시 환경 변수로 설정해야 합니다.
