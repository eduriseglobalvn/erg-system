---
title: Archived schools are their own status; pickers and work lists show only schools still working with ERG
author: Vuong
date: 2026-11-19
branch: fix/school-archive-status
cost: { minutes: 12, tokens: 217095 }
id: l-dd91e741
scope: repo
status: active
src: agent
touches:
  - src/features/employee-management/hooks/use-employee-management.ts
  - src/features/lcms/admin-home/admin-home-model.test.ts
  - src/features/lcms/admin-home/admin-home-model.ts
  - src/features/lcms/admin-home/admin-home-schools.tsx
  - src/features/lcms/admin-home/use-admin-home-data.ts
  - src/features/lcms/school-management/api/school-api/mappers.test.ts
  - src/features/lcms/school-management/api/school-api/mappers.ts
  - src/features/lcms/school-management/components/school-archive-action.test.tsx
  - src/features/lcms/school-management/components/school-archive-action.tsx
  - src/features/lcms/school-management/components/school-directory-mobile-card.tsx
---

## Decided
- Backend ARCHIVED maps to its own frontend status "archived", no longer folded into "paused".
- "Working" school = active or onboarding. School pickers, audience options, employee school options and the admin home skip paused and archived schools. The school switcher still keeps the currently selected school even when it is archived.
- Timekeeping hides archived only: paused schools still have attendance history to review.
- Archive is soft only (DELETE = archive, POST restore); the backend has no hard delete, so the UI offers none.

## Watch out
- Test fixtures for the school directory must set `status`: a school without one is not "working" and gets filtered out, so lists come back empty (this broke the audience directory tests until the fixture got status "active").

In the code: `isWorkingSchool` in school-management-types.ts; directory filter in components/school-status-filter.tsx (default "working"); archive/restore button in components/school-archive-action.tsx.
