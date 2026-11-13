---
title: "Đã nộp comes from the server handedIn flag"
author: Vuong
date: 2026-11-13
branch: fix/handed-in-flag
id: l-9997e719
scope: repo
status: active
src: agent
touches:
  - src/features/elearning/student-dashboard/api/student-dashboard-api.ts
---

## Decided
- An assignment card is filed under Đã nộp only when the backend card says handedIn: true (erg-spring StudentDashboardCards, from LmsStatePolicy.completedAttemptStates()). The FE no longer keeps a HANDED_IN_STATES list; that list had 'done', which no attempt ever has. This takes over the status list in the 2026-11-10 handed-in learning.
- handedIn wins over the due date: a handed-in card is never shown as Quá hạn.
