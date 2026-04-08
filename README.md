# YSEO

YSEO는 광고 플랫폼 복제 앱이 아니라, `지금 손대야 할 고객과 작업만 보여주는 검색 운영 액션 허브`를 목표로 한 Next.js MVP입니다.

## 현재 구현 범위

- 대시보드
  - 처리 필요 고객, 긴급 이슈, 연결 이상, 승인 대기 제안, 리포트 초안을 한 화면에 요약
- 고객 리스트
  - 상태 태그, 채널 상태, 최근 7일 요약, 열린 이슈, 승인 대기 제안을 기준으로 빠른 필터링
- 고객 상세
  - 채널 연결 상태, 이슈, 채널 신호, 작업 이력, 내부 메모
- 작업 큐
  - 고객 기준이 아니라 `이슈/조치` 기준으로 우선순위 정렬
- 리포트
  - 자동 초안 검수와 내보내기 준비 흐름

## 구현 메모

- 현재 버전은 `모의 운영 데이터`로 구동됩니다.
- 그러나 구조는 실제 MVP를 바로 이어서 개발할 수 있도록 나눠 두었습니다.
  - `src/lib/yseo/types.ts`
  - `src/lib/yseo/selectors.ts`
  - `src/lib/yseo/adapters.ts`
  - `src/lib/db/schema.ts`
- 외부 API 연결과 DB 저장은 아직 실제 자격 증명이 없으므로 스텁/골격만 넣었습니다.

## API / 백엔드 골격

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/customers/[customerId]`

이 라우트들은 현재 모의 데이터를 반환하지만, 이후 `SyncOrchestrator`, `ChannelAdapter`, `Drizzle` 저장소로 교체하기 쉽게 설계했습니다.

## 기술 스택

- Next.js 16 App Router
- Tailwind CSS v4
- shadcn/ui base-nova
- TypeScript
- Drizzle ORM schema scaffold
- Neon 연결용 lazy client scaffold

## 실행 방법

```bash
npm install
npm run dev
```

## 환경 변수

실제 연동 전에는 `.env.example`을 참고해 `.env.local`을 만드세요.

주요 키:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_OPERATOR_ALLOWLIST`
- `NAVER_SEARCHAD_API_KEY`
- `NAVER_SEARCHAD_SECRET_KEY`
- `NAVER_SEARCHAD_CUSTOMER_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GBP_ORGANIZATION_ID`

## 지금 바로 붙일 다음 단계

1. Neon DB 생성 후 Drizzle 마이그레이션 준비
2. 네이버 검색광고 연결 테이블 저장 로직 연결
3. `sync_runs`, `performance_snapshots`, `issues`, `suggestions` 실제 적재
4. 승인 기반 단건 액션을 실제 네이버 API 호출로 교체
5. Search Console 읽기 모듈 추가

## 의도적으로 아직 안 넣은 것

- 광고 플랫폼 재현형 편집기
- 실시간 스트리밍 대시보드
- 자동 승인 없는 대량 실행
- 고객용 포털
- 복잡한 BI 차트 중심 화면
