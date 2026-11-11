---
title: "Student accounts skip onboarding and forced password change, and only ever see the student portal"
author: Vuong
date: 2026-11-10
branch: fix/student-history-session
cost: { minutes: 1, tokens: 5168 }
id: l-a703c8bc
scope: repo
status: active
src: agent
touches:
  - fable/06-trien-khai-aws.md
  - fable/07-trien-khai-salesforce.md
  - fable/README.md
  - src/app/router/route-guards.ts
  - src/platform/auth/components/portal-route-gates.tsx
---

## Decided
- A student account is never sent to onboarding and is never forced to change its password (owner's rule, 11 Nov 2026). Students are young and the school creates their accounts, so any blocking step keeps them out of their homework.
- A student account may only use the student portal. Landing on a teacher or admin route sends them back to the student portal instead of showing "access denied".

## Watch out
- The owner's sentence also said "phải gửi xác thực qua Mail". We read it as "students are not forced to verify by email either". The owner has not confirmed this reading; ask before coding the lifecycle exemption.
- The student role has no profile permission, so onboarding is a dead end for a student: the onboarding screen calls APIs the student is not allowed to use. Any code path that sets must-change-password or recomputes "profile completed" has to leave student accounts alone.

In the code:
- Plan and evidence: fable/01-phat-hien.md section 0 (STU-01..STU-04), fable/02-ke-hoach-thuc-thi.md tasks G1-07..G1-10.
- FE: src/app/router/route-guards.ts, src/platform/auth/components/portal-route-gates.tsx.
- BE (erg-spring): ErgPrincipalService.isLifecycleRestricted, UserProvisioningUseCase, StudentAccountProvisioner, LoginResponseMapper.
