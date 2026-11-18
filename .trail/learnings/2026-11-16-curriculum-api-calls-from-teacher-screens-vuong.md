---
title: "Curriculum API calls from teacher screens must name the lms portal, or the client blocks them with 401"
author: Vuong
date: 2026-11-16
branch: feat/role-consolidation
cost: { minutes: 245, tokens: 4221611 }
id: l-a6481feb
scope: repo
status: active
src: agent
touches:
  - scripts/design-token-baseline.json
  - src/features/employee-management/components/create-employee-wizard.test.tsx
  - src/features/employee-management/components/create-employee-wizard.tsx
  - src/features/employee-management/components/create-employee/constants.ts
  - src/features/employee-management/components/create-employee/review-step.tsx
  - src/features/employee-management/components/create-employee/role-step.tsx
  - src/features/employee-management/components/employee-detail-drawer.tsx
  - src/features/employee-management/components/employee-detail/roles-tab.tsx
  - test-logs/2026-11-staging/runs/BANG-PHOI-HOP.md
---

## Decided
- Path-based portal detection sends every curriculum path to the lcms portal. A teacher has no lcms token, so the API client throws 401 on the client side and the request never leaves the browser. Teacher-facing curriculum calls (e.g. the class subject list in the gradebook) must pass portal "lms" explicitly.

## Watch out
- The symptom looks like a backend permission bug (empty subject box, 401), but the BE log shows no request at all. Check the network tab before blaming the BE: calling the same endpoint with the lms portal returns 200 with the right classes.

In the code:
- portalFromPath in src/lib/api-client/portal.ts maps curriculum paths to "lcms".
- performApiRequest in src/lib/api-client.ts calls getRequestAccessToken(portal).
- useClassSubjectOptions in src/features/lms/api/class-subject-options.ts calls API_ENDPOINTS.curriculum.classSubjects without portal: "lms" (BUG-A-043, staging 17/11).
