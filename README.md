# YSEO

YSEO는 광고 플랫폼 복제 앱이 아니라 `지금 손대야 할 고객과 작업만 보여주는 검색 운영 액션 허브`를 목표로 하는 Next.js MVP입니다.

## 현재 구현 범위

- 대시보드
  - 처리 필요 고객, 긴급 이슈, 연결 이상, 승인 대기 제안, 리포트 초안 요약
- 고객 리스트
  - 상태 태그, 채널 상태, 최근 7일 요약, 열린 이슈, 승인 대기 제안 기준 빠른 필터링
- 고객 상세
  - 채널 연결 상태, 이슈, 채널 신호, 작업 이력, 내부 메모
- 작업 큐
  - 고객 기준이 아니라 `이슈/조치` 기준 우선순위 처리
- 리포트
  - 자동 초안 검수와 내보내기 준비

## 현재 상태

- Neon Postgres 기반 `yseo_*` 테이블을 사용합니다.
- 앱 화면과 API는 실제 DB를 읽습니다.
- NAVER SearchAd 실연동 골격도 추가되어 있습니다.
  - 서명 기반 요청
  - 관리 고객 조회
  - adgroup 조회
  - stats 집계
  - 이슈/제안/리포트 초안 생성
- 실제 NAVER 동기화 실행에는 별도 자격 증명이 필요합니다.

## 주요 API

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/customers/[customerId]`
- `GET /api/sync/naver`
  - NAVER sync 준비 상태와 자격 증명 구성 여부를 반환합니다.
- `POST /api/sync/naver`
  - NAVER SearchAd 동기화를 실행합니다.
  - `Authorization: Bearer <SYNC_API_TOKEN>` 또는 `AUTH_SECRET`가 필요합니다.

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

## 환경 변수

`.env.example`를 참고해 `.env.local`을 만드세요.

- `DATABASE_URL`
- `NEON_DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_OPERATOR_ALLOWLIST`
- `SYNC_API_TOKEN`
- `NAVER_SEARCHAD_API_KEY`
- `NAVER_SEARCHAD_SECRET_KEY`
- `NAVER_SEARCHAD_CUSTOMER_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GBP_ORGANIZATION_ID`

## NAVER Sync 운영 메모

- `GET /api/sync/naver`는 상태 확인용입니다.
- `POST /api/sync/naver`는 수동 실행용입니다.
- 동기화는 아래를 수행합니다.
  - 관리 고객 식별
  - NAVER adgroup 목록 수집
  - 7일 / 이전 7일 / 30일 stats 집계
  - `performance_snapshots`, `channel_insights`, `issues`, `suggestions`, `report_drafts`, `sync_runs` 반영
- 실제 NAVER API 자격 증명이 없으면 실행은 막히고 상태만 반환합니다.

## 다음 단계

1. Vercel 환경 변수에 NAVER SearchAd 자격 증명 설정
2. 수동 sync 검증
3. 안전한 주기 실행 방식 추가
4. Search Console 모듈 결합

## 의도적으로 아직 넣지 않은 것

- 네이버 광고센터 복제 UI
- 실시간 스트리밍 대시보드
- 자동 승인 없는 대량 실행
- 고객용 포털
- 복잡한 BI 차트 중심 화면
