---
title: The LMS school list has ids only; take school names from the organization list
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 59, tokens: 167180 }
id: l-be503982
scope: repo
status: active
src: agent
touches:
  - CLAUDE.md
  - scripts/design-token-baseline.json
  - src/components/portal/portal-sidebar-motion.test.ts
  - src/components/portal/portal-sidebar-motion.ts
  - src/components/portal/portal-sidebar-styles.ts
  - src/components/shared/erg-calendar-navigator.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-content-views.tsx
  - src/features/elearning/student-dashboard/components/student-dashboard-workspace.copy.tsx
  - src/features/elearning/student-dashboard/types/dashboard-view-types.ts
  - src/features/lcms/school-management/components/school-analytics-workspace.tsx
---

## Decided
The LMS education-units endpoint builds its list from classroom school ids, so every name equals the id (UUIDs, sch_*). The calendar keeps that list because it is scoped by permission, and looks up display names in the organization education-units list.

## Watch out
Some real schools in the organization list have a level type such as "SECONDARY". The school-type filter drops them, so take names from the raw organization list, not the filtered one. Two units can also share a name (sch_truong_cong_dinh and a UUID copy). That is duplicate data, not a UI bug.

In the code: src/features/teaching-calendar/api/teaching-calendar-reference-catalog-api.ts (loadTeachingCalendarReferenceCatalog, loadOrganizationEducationUnits); backend LmsClassroomQueryUseCase.listEducationUnits in erg-spring.
