# YSEO

YSEO is an operator-first search ops hub for agencies managing many NAVER SearchAd and Google Search Console clients.
It does not try to replace NAVER Ads or Google tools. Instead, it focuses on:

- customer-level channel mapping
- scheduled monitoring
- strategy pack bootstrapping
- alerting and email delivery
- recommendation generation
- approval-based safe actions
- monthly report draft batching

## Current product boundary

YSEO should stay focused on:

- triaging clients
- strategy-guided monitoring
- approval-based recommendations
- limited, approval-based actions
- monthly report preparation

YSEO should not become:

- a full NAVER Ads clone
- a Search Console clone
- a CRM or billing hub
- a customer portal
- a real-time streaming console

## Implemented scope

### Dashboard

- attention-first client list
- current channel health summary
- operator-first compact surfaces

### Customer detail

- NAVER connection editing
- Search Console OAuth connect flow
- strategy pack bootstrap and review
- recent alert events
- recent recommendation summaries
- recommendation evaluations
- approval-ready execution requests

### Automation and ops APIs

- unified sync runner
- alert rule evaluation
- recommendation generation
- approval-based execution flow
- monthly report batch generation

## Integrations

### NAVER SearchAd

- real API credential validation is wired
- managed account discovery is wired
- adgroup/stat sync is wired
- issue and suggestion generation is wired
- safe retry execution is wired

### Google Search Console

- OAuth start and callback are wired
- customer-specific property selection is wired
- first validation query on connect is wired
- auto-sync entrypoint is wired

### Email alerts

- Resend delivery is wired
- Gmail inbox delivery is supported through `ALERT_EMAIL_TO`

### Google Business Profile

- readiness only for now
- live monitoring remains future scope

## Strategy-driven flow

1. Map a client to NAVER and Search Console
2. Bootstrap a strategy pack with:
   - goal profile
   - strategy profile
   - GPT Pro deep-research summary inputs
3. Run scheduled sync
4. Evaluate alert rules
5. Deliver immediate or daily-summary emails
6. Generate recommendation runs
7. Approve and execute safe actions
8. Compare before/after results

## API routes

### Core

- `GET /api/health`
- `GET /api/customers/[customerId]`
- `POST /api/customers`
- `PATCH /api/customers/[customerId]/naver-connection`

### Google OAuth

- `GET /api/oauth/google/search-console/start`
- `GET /api/oauth/google/search-console/callback`

### Sync and monitoring

- `GET /api/sync/naver`
- `POST /api/sync/naver`
- `GET /api/sync/google`
- `POST /api/sync/run`
- `POST /api/alerts/evaluate`
- `POST /api/recommendations/generate`
- `POST /api/recommendations/[id]/approve`
- `POST /api/executions/run`
- `GET /api/evaluations/[customerId]`

### Strategy

- `POST /api/strategy/bootstrap`
- `GET /api/strategy/[customerId]`

### Reporting

- `GET /api/reports/monthly`
- `POST /api/reports/monthly`

### Cron endpoints

- `GET /api/cron/naver-hourly`
- `GET /api/cron/search-console-daily`
- `GET /api/cron/daily-alerts`
- `GET /api/cron/month-end-reports`

## Automation defaults

- deployed fallback on Vercel Hobby
  - NAVER sync: daily
  - Search Console sync: daily
  - alert summary email: daily
  - month-end report batch: last day of month only
- planned target on a paid plan
  - NAVER sync: hourly
  - Search Console sync: twice daily

## Stack

- Next.js 16 App Router
- Tailwind CSS v4
- Drizzle ORM
- Neon Postgres
- Vercel
- Resend for alert delivery

## Local development

```bash
npm install
npm run dev
npm run strategy:seed-demo
```

`strategy:seed-demo` seeds sample strategy packs, alert rules, and recommendation records for the bundled demo customers.

## Environment variables

Create `.env.local` from `.env.example`.

### Shared

- `DATABASE_URL`
- `NEON_DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_OPERATOR_ALLOWLIST`
- `SYNC_API_TOKEN`
- `CRON_SECRET`

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

### Optional legacy Google envs

- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`
- `GOOGLE_SEARCH_CONSOLE_SITE_URL`
- `GOOGLE_BUSINESS_PROFILE_APPROVED`
- `GOOGLE_BUSINESS_PROFILE_REFRESH_TOKEN`
- `GOOGLE_BUSINESS_PROFILE_ACCOUNT_ID`
- `GOOGLE_BUSINESS_PROFILE_LOCATION_ID`

### Email alerts

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `ALERT_EMAIL_TO`

If Resend is not configured, alert events are still stored in the database with `skipped-not-configured` delivery status.

## Database tables

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
- `yseo_strategy_packs`
- `yseo_alert_rules`
- `yseo_alert_events`
- `yseo_recommendation_runs`
- `yseo_recommendation_evaluations`
- `yseo_execution_requests`

Apply schema updates with:

```bash
npm run db:push
```
