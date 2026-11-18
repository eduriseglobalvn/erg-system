---
title: "The training office manages every school of its organisation, and in the teacher portal it must behave like any teacher"
author: Vuong
date: 2026-11-16
branch: feat/role-consolidation
cost: { minutes: 9, tokens: 62855 }
id: l-142fc729
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
---

## Decided
Owner decision, 16/11/2026: an account with the Phòng đào tạo role manages every school of its own organisation, with no per-school assignment. The same person also teaches, can schedule lessons for themselves, and in the teacher portal must see only what a teacher sees: the schools and classes where they have a published lesson. Teachers get a school from the published teaching schedule and lose it once no published lesson there ends on or after Monday 00:00 of the week before last.

## Tried and ruled out
Adding a school picker for the training office in the staff detail drawer: the owner had just removed the scope picker from the create-staff wizard and does not want per-school assignment back. Returning an explicit list of all school ids instead of the wildcard: the principal is cached per token, so a school created during the session would be missing until the cache turns over.

## Watch out
The backend computes the unit scope once per login session and does not know which portal a request comes from. Several read paths shared by the admin and teacher portals treat the wildcard as "see everything", so the teacher portal of a training-office account may show every school until those paths use teaching assignments instead. Director and Operations ("view everything" roles) still have no unit scope at all. The notification audience guard computes its own scope.

In the code (backend repo erg-spring):
- ErgPrincipalService.managedEducationUnitIds returns "*" for role pdt_operator
- CalendarScopeService.requireManagedSchools accepts "*"
- ClassroomRepository.findTeacherManagedSchoolIds and ScheduleAccessWindow hold the teacher rule
- shared read paths to check: LmsStudentReadModelUseCase, LmsStudentGroupReadUseCase, LmsHomeworkWorkspaceGraphQlController
