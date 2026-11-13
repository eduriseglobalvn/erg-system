---
title: A student who opens a wrong-portal page is sent to the student home from one shared rule
author: Vuong
date: 2026-11-13
branch: fix/student-wrong-portal-redirect
id: l-3e2b888f
scope: repo
status: active
src: agent
touches:
  - src/platform/auth/permissions/student-only.ts
  - src/app/router/route-guards.ts
  - src/platform/auth/components/portal-route-gates.tsx
  - src/routes/portals/legacy-routes.tsx
  - src/routes/portals/auth-routes.tsx
---

## Decided
"Student account" means the verified workspaces (projectVerifiedWorkspaces / AuthRouteState.workspaces) are exactly [STUDENT]. That rule lives in isStudentOnlySession, and misroutedStudentHome in src/platform/auth/permissions/student-only.ts picks the target. The target is "/" on the student host and /student elsewhere. The rule does not apply to INACTIVE/BLOCKED accounts, to a page inside the student portal (so a student route that denies its own page stays on /access-denied and cannot loop), or to staff who can also preview the student portal. route-guards (throwAuthRedirect, via redirectMisroutedStudent), the /onboarding route, the root catch-all and PortalAuthGate all call that one rule. This replaces the earlier check that used the elearning.assignment.read_self permission, which a teacher could also hold.

## Tried and ruled out
Fixing only throwAuthRedirect was not enough. An unknown page under /teacher/... or /admin/... never reaches the _authed guard: the root "$" catch-all (catchAllBeforeLoad) matches it and renders the 404 page. The catch-all now applies the student rule to workspace-prefixed paths first.

## Watch out
A student is pushed to /onboarding by PortalAuthGate.needsOnboarding and by the /onboarding route's default redirect, not by the route guard's "onboarding" decision. Exempting students from onboarding has to cover those two places.
