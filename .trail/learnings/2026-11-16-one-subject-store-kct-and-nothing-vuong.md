---
title: One subject store (KCT) and nothing about a student may embed the class name
author: Vuong
date: 2026-11-16
branch: feat/role-consolidation
cost: { minutes: 30, tokens: 326106 }
id: l-aa3afdc7
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
  - test-logs/2026-11-staging/bugs/BUG-B-008.md
---

## Decided
- Owner decision 17/11/2026: subjects and levels live only in the curriculum (KCT). No second copy, no sync job, no leftover columns. A school's subjects are the KCT subjects allocated to its classes, each with the level the class studies it at.
- Owner note 17/11/2026: terms and school years are not modelled yet. Class 6A1 becomes 7A1 next year and its students may move class or school. So a student code or login must never contain the class name, and class membership has to be per school year.
- Grade 9 studies the same programme as grade 8.

## Tried and ruled out
- Copying KCT subjects into the timetable's own tables: rejected by the owner as duplicate data.

## Watch out
- The school setup screen used to create a private "Subject - Level" copy and discard the KCT ids the user picked; rows like that are mapped back by the level code that prefixes their code.
- Monthly teaching-hour lines are unique per subject, so two old subjects that map to one KCT subject cannot be merged automatically.

In the code: backend migration `V163__single_subject_store.sql`, `CurriculumClassSubjectAllocation.levelId`, `SchoolOperationsReadService`; frontend `school-curriculum-step.tsx`.
