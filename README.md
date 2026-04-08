# YSEO

YSEO is an operator-first web app for agencies managing many search clients.
It is not a clone of NAVER Ads or Google tools. The goal is to surface which clients need attention now, keep connection health visible, and reduce repetitive monthly reporting work.

## Current MVP scope

- Dashboard
  - clients needing attention
  - critical issues
  - connection problems
  - pending suggestions
  - latest report drafts
- Customers
  - customer onboarding
  - NAVER connection editing
  - Search Console OAuth start from customer detail
- Issues
  - action queue
  - operator playbooks/checklists
- Reports
  - monthly batch draft generation

## Integrations

### NAVER SearchAd

- Real API credential validation is wired.
- Manual sync endpoint is available.
- Current production flow:
  - discover managed accounts
  - sync adgroup lists
  - aggregate 7d / previous 7d / 30d stats
  - write snapshots, issues, suggestions, sync runs, report drafts

### Google Search Console

- Real OAuth start/callback flow is wired.
- Customer-specific property selection is wired.
- First 7-day Search Analytics validation query is executed when a property is connected.
- Current production flow:
  1. open a customer
  2. click `Search Console 연결`
  3. complete Google consent
  4. choose a property
  5. YSEO stores the refresh token securely and validates the connection

### Google Business Profile

- Readiness only for now.
- OAuth app and project approval state can be surfaced, but live sync is still stage 3.

## API routes

- `GET /api/health`
- `GET /api/customers/[customerId]`
- `POST /api/customers`
- `PATCH /api/customers/[customerId]/naver-connection`
- `POST /api/customers/[customerId]/search-console-connection`
- `GET /api/sync/naver`
- `POST /api/sync/naver`
- `GET /api/sync/google`
- `GET /api/reports/monthly`
- `POST /api/reports/monthly`
- `GET /api/oauth/google/search-console/start`
- `GET /api/oauth/google/search-console/callback`

## Stack

- Next.js 16 App Router
- Tailwind CSS v4
- Drizzle ORM
- Neon Postgres
- Vercel

## Local development

```bash
npm install
npm run dev
```

## Environment variables

Create `.env.local` from `.env.example`.

### Shared

- `DATABASE_URL`
- `NEON_DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_OPERATOR_ALLOWLIST`
- `SYNC_API_TOKEN`

### NAVER SearchAd

- `NAVER_SEARCHAD_API_KEY`
- `NAVER_SEARCHAD_SECRET_KEY`
- `NAVER_SEARCHAD_CUSTOMER_ID`

### Google OAuth app

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

Recommended production callback:

- `https://yseo.vercel.app/api/oauth/google/search-console/callback`

### Legacy or optional Google envs

These are no longer required for customer-by-customer Search Console OAuth, but can remain for future fallback tooling:

- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL`
- `GOOGLE_BUSINESS_PROFILE_APPROVED`
- `GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN`
- `GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID`
- `GOOGLE_BUSINESS_PROFILE_LOCATION_ID`

## DB notes

Current app tables include:

- `yseo_customers`
- `yseo_channel_connections`
- `yseo_channel_credentials`
- `yseo_oauth_sessions`
- `yseo_performance_snapshots`
- `yseo_channel_insights`
- `yseo_issues`
- `yseo_suggestions`
- `yseo_report_drafts`
- `yseo_internal_memos`
- `yseo_task_executions`
- `yseo_sync_runs`

Apply schema updates with:

```bash
npm run db:push
```

## Search Console OAuth setup checklist

Before the OAuth flow works in production:

1. Create a Google OAuth Web application in Google Cloud.
2. Add the production callback URI:
   - `https://yseo.vercel.app/api/oauth/google/search-console/callback`
3. Put the Google OAuth env vars into Vercel:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_OAUTH_REDIRECT_URI`
4. Redeploy.
5. Open a customer detail page and start `Search Console 연결`.

## Product boundary

YSEO should stay focused on:

- triaging clients
- operator checklists
- connection health
- report draft batching
- limited, approval-based actions

YSEO should not become:

- a full NAVER Ads clone
- a full BI dashboard
- a customer portal
- a real-time streaming console
