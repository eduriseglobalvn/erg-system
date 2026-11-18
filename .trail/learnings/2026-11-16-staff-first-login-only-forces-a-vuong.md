---
title: Staff first login only forces a password change; every assignment belongs to a class
author: Vuong
date: 2026-11-16
branch: feat/role-consolidation
cost: { minutes: 19, tokens: 161588 }
id: l-4a3b2fbc
scope: repo
status: active
src: agent
---

## Decided
- Owner decision 16-17/11/2026: a staff account's first login only forces a password change. Phone and recovery email are optional reminders, never a gate. Student accounts still get no onboarding at all.
- Owner decision 17/11/2026: every assignment a teacher gives must belong to a class. A student without a class cannot receive one.
- Creating staff is one dialog (name, email, role required), not a wizard.

## Tried and ruled out
- Returning every school of the tenant for Phòng đào tạo in the session bootstrap (BUG-B-003): the bootstrap does not know which portal is open, so the teacher portal would list every school, against the rule that Phòng đào tạo is an ordinary teacher there. Left open for the owner.

## Watch out
- The lifecycle next-step list is built in nine separate backend places; change them together.

In the code: backend `ErgPrincipalService.isLifecycleRestricted`, `AccessScopeAssembler.managesWholeTenant`, `LmsAssignmentCommandService.ensureRecipientScope`; frontend `requiresTeacherOnboarding`, `create-employee-dialog.tsx`.
