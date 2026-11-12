---
title: Students landed on the teacher portal because login listed lms as their portal and a stale redirect was followed
author: Vuong
date: 2026-11-12
branch: fix/student-portal-n12
cost: { minutes: 1739, tokens: 7836879 }
id: l-81cdc7cd
scope: repo
status: active
src: agent
touches:
  - contracts/backend/schema.graphqls
  - contracts/backend/schema.graphqls.lock.json
  - src/features/elearning/class-leaderboard/api/class-leaderboard-api.ts
  - src/features/elearning/class-leaderboard/api/class-leaderboard.graphql
  - src/features/elearning/class-leaderboard/components/class-leaderboard-page.tsx
  - src/features/elearning/class-leaderboard/components/class-leaderboard-table.tsx
  - src/features/elearning/student-dashboard/api/student-dashboard-api.ts
  - src/features/elearning/student-dashboard/api/student-dashboard.graphql
  - src/features/elearning/student-dashboard/components/student-dashboard-bottom-dock.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-ranking-view.tsx
---

## Decided
A post-login redirect is only followed when the session holds the route-matrix permission for it; otherwise the account's own landing is used (admin, then teacher, then student). A signed-out visit to / goes to plain /login. A student who opens a teacher/admin page is redirected to /student instead of access denied.

## Tried and ruled out
Only changing the landing order: the student still reached /teacher because the explicit redirect=/teacher/home (made by the site root for every signed-out visitor) skipped the landing logic entirely, and canAccessPortal passed because the projection had given the student TEACHER.

## Watch out
Backend login used to list one portal per permission namespace, so a learner's lms.assignment.read_self added "lms" and the frontend projection turned that into the TEACHER workspace. Login now uses the same WorkspaceCapabilityMapper projection as the session bootstrap; any new place that builds a portal list must use that mapper too.

In the code:
- src/platform/auth/components/portal-login-controller.ts redirectAfterAuth / sessionCanOpen
- src/routes/portals/public-routes.tsx (signed-out "/" → /login)
- src/app/router/route-guards.ts enforceWorkspaceRoute (student → /student)
- erg-spring auth/internal/login/SessionIssuer.java (legacyPortalsFor)
