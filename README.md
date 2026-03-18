# 쌀먹.com

유튜버 구독자 이벤트를 YouTube Data API로 자동 수집해서 보여주는 웹 서비스

---

## 📁 프로젝트 구조

```
ssalmuk/
├── collector/          # Python 수집기 (2시간마다 자동 실행)
│   ├── collector.py
│   ├── requirements.txt
│   └── .env.example
├── backend/            # Express + Turso DB API 서버
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/           # React + Vite + Tailwind 웹
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── EventCard.jsx
    │   │   └── FilterBar.jsx
    │   ├── hooks/
    │   │   └── useEvents.js
    │   └── lib/
    │       └── api.js
    ├── package.json
    └── .env.example
```

---

## 🚀 시작하기

### 1. YouTube API 키 발급
1. Google Cloud Console → 새 프로젝트
2. YouTube Data API v3 활성화
3. API 키 발급

### 2. Turso DB 설정
```bash
npm install -g @turso/cli
turso auth login
turso db create ssalmuk
turso db tokens create ssalmuk
```

### 3. 백엔드 실행
```bash
cd backend
cp .env.example .env   # .env 파일 수정
npm install
npm run dev
```

### 4. 수집기 실행
```bash
cd collector
cp .env.example .env   # .env 파일 수정
pip install -r requirements.txt
python collector.py
```

### 5. 프론트엔드 실행
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## 🌐 배포 (Vercel)

### 백엔드
```bash
cd backend
vercel --prod
```
Vercel 환경변수에 TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, BACKEND_SECRET 설정

### 프론트엔드
```bash
cd frontend
vercel --prod
```
VITE_API_URL에 백엔드 URL 설정

### 수집기
Railway 또는 서버에서 `python collector.py` 상시 실행

---

## ⚙️ 환경변수 정리

| 파일 | 변수 | 설명 |
|------|------|------|
| collector/.env | YOUTUBE_API_KEY | YouTube Data API v3 키 |
| collector/.env | BACKEND_URL | 백엔드 주소 |
| collector/.env | BACKEND_SECRET | 수집기 인증 키 |
| backend/.env | TURSO_DATABASE_URL | Turso DB URL |
| backend/.env | TURSO_AUTH_TOKEN | Turso 인증 토큰 |
| backend/.env | BACKEND_SECRET | 수집기 인증 키 (동일하게) |
| frontend/.env | VITE_API_URL | 백엔드 API 주소 |

---

## 📡 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/events | 이벤트 목록 (필터, 페이지) |
| GET | /api/events/:id | 이벤트 상세 |
| POST | /api/events | 이벤트 저장 (수집기 전용) |
| GET | /api/stats | 통계 |

쿼리 파라미터: `status=live|soon`, `tag=gift|cash|sub`, `page=1`, `limit=20`
