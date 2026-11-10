---
title: "Some API client and notification tests already fail on main; don't chase them when your change is unrelated"
author: Vuong
date: 2026-11-10
branch: fix/question-bank-assign-flow
cost: { minutes: 30, tokens: 148065 }
id: l-a56e751f
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/admin-operations/utils/learning-resource-content-dialog.test.ts
  - src/features/lcms/admin-operations/utils/learning-resource-curriculum-view-model.test.ts
  - src/features/lcms/create-quiz-from-bank.ts
  - src/features/lcms/teacher-question-bank-page.tsx
  - src/features/lms/components/assign-homework-controller/use-assign-homework-submit.ts
  - src/features/lms/components/assign-homework-desktop-view/resource-step.tsx
  - src/features/lms/components/assign-homework-desktop-view/setup-card.tsx
  - src/features/lms/components/assign-homework-flow.test.tsx
  - src/features/lms/components/assign-homework-mobile.test.tsx
  - src/features/lms/components/assign-homework-mobile/resource-section.tsx
---

## Decided
- On 2026-11-10 the auth/API test files below failed identically on a clean checkout of the branch base, so they are pre-existing failures, not caused by the question-bank work.

## Watch out
- The failures say "Authentication session is missing or expired": the stored test session is not picked up. Confirm on a clean worktree before blaming your diff.

In the code: src/lib/api-client.test.ts, src/lib/graphql-client.test.ts, src/features/notification-campaigns/api/campaign-api.test.ts, src/features/notifications/api/notification-api.test.ts (17 + 17 failing tests). Check with a detached `git worktree add` of HEAD, a junction to node_modules, then `bunx vitest run <files>`.
