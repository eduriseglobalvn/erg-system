---
title: "Assistant teachers get their own period timesheet, counted 1 per period, HR converts to pay"
author: Vuong
date: 2026-11-14
branch: feat/student-assignment-correct-count
cost: { minutes: 202, tokens: 2876846 }
id: l-76d0217e
scope: repo
status: active
src: agent
touches:
  - src/features/lms/api/lms-assignment-command-api.ts
  - src/features/lms/components/assign-homework-controller/use-assign-homework-submit.ts
  - src/features/lms/components/assign-homework-desktop-view/setup-card.tsx
  - src/features/lms/components/assign-homework-mobile/schedule-options-sections.tsx
  - src/features/lms/components/assign-homework-recipient.test.ts
  - src/features/lms/components/assign-homework-recipient.ts
  - src/features/lms/components/exercise-bank/quick-assign-dialog.tsx
  - src/features/lms/components/use-assign-homework-controller.ts
  - KE_HOACH_CONG_BAO_GIANG.md
  - src/platform/auth/permissions/role-display-catalog.ts
---

## Decided
Periods taught as ASSISTANT go on a separate timesheet, not the main teacher's. Each period counts as 1, with no weighting factor; HR does the pay conversion itself. One person can have numbers on both sheets. The teacher confirms both totals in one go, and closing a month closes both sheets. The owner decided this on 14/11/2026.

## Tried and ruled out
- Counting an assistant period as 0.5 on the main timesheet. Ruled out because it bakes a pay rule into the attendance data; HR wants raw period counts.
- Not counting assistant periods at all (the plan's original default). Ruled out because the assistants' work would go unrecorded.

## Watch out
- The month-line key must include role. Otherwise one person who is both main teacher and assistant in the same school and subject collapses into a single row.
- Sổ đầu bài (class log), attendance and lesson reports are still done only by the main teacher.

In the code (planned, not built yet): KE_HOACH_CONG_BAO_GIANG.md §2.3, §2.8-5, §4 (V155 tk_teaching_month_lines.role, confirmed_assistant_total, ?role=MAIN|ASSISTANT), B6, F7 (sheets "Total TG", "TG Tháng MM"); KE_HOACH_MASTER.md §6.3.
