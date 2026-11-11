---
title: "Tests must store the auth session where the app reads it now, and test times run in Vietnam's time zone"
author: Vuong
date: 2026-11-11
branch: fix/ci-main-green
id: l-fe6c667a
scope: repo
status: active
src: agent
touches:
  - ".github/workflows/portal-smoke.yml"
  - scripts/sync-api-contract.mjs
  - src/features/lms/learning-resources/api/learning-resource-authoring-api.test.ts
  - src/features/lms/learning-resources/api/learning-resource-authoring-library-query-api.ts
  - src/features/notification-campaigns/api/campaign-api.test.ts
  - src/features/notifications/api/notification-api.test.ts
  - src/features/question-bank/api/question-bank-api.test.ts
  - src/features/question-bank/api/question-bank-api.ts
  - src/features/quiz-reports/api/quiz-report-api.test.ts
  - src/features/quiz-reports/api/quiz-report-api.ts
---

## Decided
Tests seed a back-office session under the single shared remember-me key, the same way the auth tests do since the per-portal slots were removed on 2026-11-08. The vitest run pins TZ to Asia/Ho_Chi_Minh so a UTC CI runner renders the same clock times as dev machines.

## Tried and ruled out
Setting TZ through vitest's test.env: the threads pool keeps the process time zone it started with, so the value must be set on process.env in vite.config before workers spawn.

## Watch out
"Authentication session is missing or expired" in a unit test usually means the test wrote the session to a key the storage module no longer reads, not a product bug. A test that passes locally but shows a time 7 hours off in CI is a time-zone dependency.

In the code: vite.config.ts (mode === "test" sets process.env.TZ); auth-token-storage.ts TEACHER_LOCAL_SESSION_KEY; src/lib/api-client.test.ts, graphql-client.test.ts, notification-api.test.ts, campaign-api.test.ts. Supersedes the 2026-11-10 note saying to leave these failures alone.
