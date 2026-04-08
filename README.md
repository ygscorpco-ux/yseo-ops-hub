# YSEO

YSEO는 광고 플랫폼 복제 앱이 아니라, `지금 손대야 할 고객과 작업만 보여주는 운영 액션 허브`를 목표로 하는 Next.js MVP입니다.

## 현재 구현 범위

- 대시보드
  - 처리 필요 고객, 긴급 이슈, 연결 이상, 승인 대기 제안, 최근 리포트 초안
- 고객 리스트
  - 상태 태그, 채널 상태, 최근 7일 요약, 미해결 이슈, 승인 대기 제안
- 고객 상세
  - 채널 연결 상태, 최근 스냅샷, 열린 이슈, 제안, 작업 이력, 내부 메모
- 작업 큐
  - 고객 기준이 아니라 `이슈/조치` 기준으로 우선순위 처리
- 리포트
  - 자동 초안 검토와 다음 액션 정리

## API 연동 상태

- NAVER SearchAd
  - 실연동 코드가 이미 들어가 있습니다.
  - 서명 생성, 관리 고객 조회, adgroup 조회, stats 집계, sync run 기록이 준비돼 있습니다.
  - 남은 것은 실제 자격증명 입력과 실계정 검증입니다.
- Google Search Console
  - 이번 배포에서 `OAuth 준비 상태`, `운영자 계정 연결 필요`, `대표 property 선택 필요`를 앱에서 바로 확인할 수 있게 했습니다.
  - 실제 Search Analytics / URL Inspection 수집은 다음 단계에서 붙습니다.
- Google Business Profile
  - 이번 배포에서 `프로젝트 승인 필요`, `OAuth 연결 필요`, `account/location 선택 필요` 여부를 앱에서 바로 확인할 수 있게 했습니다.
  - 실제 리뷰 / 성과 수집은 3단계 로드맵에서 붙습니다.

## 주요 API

- `GET /api/health`
- `GET /api/customers/[customerId]`
- `POST /api/customers`
- `PATCH /api/customers/[customerId]/naver-connection`
- `GET /api/sync/naver`
- `POST /api/sync/naver`
- `GET /api/sync/google`

## 기술 스택

- Next.js 16 App Router
- Tailwind CSS v4
- shadcn/ui
- TypeScript
- Drizzle ORM
- Neon Postgres
- Vercel

## 실행 방법

```bash
npm install
npm run dev
```

## 환경변수

`.env.example`를 참고해 `.env.local`을 만듭니다.

### 공통

- `DATABASE_URL`
- `NEON_DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_OPERATOR_ALLOWLIST`
- `SYNC_API_TOKEN`

### NAVER SearchAd

- `NAVER_SEARCHAD_API_KEY`
- `NAVER_SEARCHAD_SECRET_KEY`
- `NAVER_SEARCHAD_CUSTOMER_ID`

### Google OAuth / Search Console

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL`

### Google Business Profile

- `GBP_ORGANIZATION_ID`
- `GOOGLE_BUSINESS_PROFILE_APPROVED`
- `GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN`
- `GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID`
- `GOOGLE_BUSINESS_PROFILE_LOCATION_ID`

## NAVER sync 메모

- `GET /api/sync/naver`는 준비 상태를 확인합니다.
- `POST /api/sync/naver`는 수동 sync를 실행합니다.
- 수동 실행에는 `Authorization: Bearer <SYNC_API_TOKEN>` 또는 `AUTH_SECRET`가 필요합니다.
- sync는 아래를 수행합니다.
  - 관리 고객 집계
  - adgroup 목록 수집
  - 7일 / 이전 7일 / 30일 stats 집계
  - `performance_snapshots`, `channel_insights`, `issues`, `suggestions`, `report_drafts`, `sync_runs` 반영

## 다음 단계

1. NAVER 실계정 sync 검증
2. Search Console OAuth 완료
3. Search Analytics / URL Inspection 실데이터 수집 연결
4. Business Profile 승인 후 account/location 연결

## 의도적으로 아직 하지 않은 것

- 광고센터 복제 UI
- 실시간 스트리밍 대시보드
- 자동 승인 없는 대량 실행
- 고객용 포털
- 복잡한 BI 차트 중심 화면
