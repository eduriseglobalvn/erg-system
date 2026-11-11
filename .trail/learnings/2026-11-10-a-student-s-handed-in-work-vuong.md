---
title: "A student's handed-in work is graded or needs_review, not only submitted; practice must be handed in too"
author: Vuong
date: 2026-11-10
branch: fix/student-history-session
cost: { minutes: 68, tokens: 783510 }
id: l-c2d87be8
scope: repo
status: active
src: agent
touches:
  - src/features/elearning/student-dashboard/hooks/use-single-student-tab.ts
  - src/features/elearning/student-dashboard/components/student-tab-replaced.tsx
  - src/features/elearning/student-dashboard/hooks/use-single-student-tab.test.ts
  - src/features/elearning/student-dashboard/api/student-dashboard-api.ts
  - src/components/quiz/player-shell-runtime/player-desktop-footer.tsx
---

## Decided
- Đã nộp, the "x/y done" count and the average treat submitted, completed, done, graded, needs_review and review_required as handed in. The backend moves an attempt to graded (auto) or needs_review (manual) on hand-in, so checking only "submitted" left Đã nộp empty and the average at "–".
- The average is built from one score per assignment: its latest handed-in attempt. Each assignment card carries that score (scorePercent) and submittedAt from the backend.
- Practice quizzes are handed in too: on desktop the last question shows "Nộp bài" once checked. Before this, desktop practice had no submit at all, so practice attempts stayed in_progress forever.
- Answers in progress are saved on the server (PATCH .../attempts/{id}/draft stores them on the attempt); start/resume returns them, and local IndexedDB answers win when both exist. The quiz view lives in the URL (?assignment=<id>) so a reload reopens it.
- One tab per student account in a browser via BroadcastChannel "erg:student-tab".

## Tried and ruled out
- Relying on the encrypted IndexedDB attempt store alone: it is lost on another device, a cleared browser or private mode.

## Watch out
- The student dashboard slice was capped at 8 assignments ordered by due date, so newer ones vanished; it is 50 now.
- While erg-spring sits on feat/timekeeping, do not sync the GraphQL contract from it (it pulls timekeeping types main lacks): hand-patch contracts/backend/schema.graphqls, regenerate the lock with createContractLock, then run codegen.
- On feat/timekeeping, learner lms.* grants map to the student workspace; the /api/v1/lms gate must still let learners through (AuthorizationCapabilityPolicy.hasWorkspace), or every quiz load and attempt start returns 403 "Portal session does not match requested API".
- The single-tab lock is same-browser only; another device needs a server-side session limit.

In the code: src/features/elearning/student-dashboard/api/student-dashboard-api.ts (HANDED_IN_STATES, mapAssignment), src/components/quiz/player-shell-runtime/player-desktop-footer.tsx, src/features/elearning/student-dashboard/hooks/use-student-view-state.ts, use-single-student-tab.ts; erg-spring AssignmentRepository/AttemptRepository (latest handed-in attempt per assignment), LmsAttemptUseCase.saveDraft, StudentDashboardReadService.FIRST_SLICE_LIMIT.
