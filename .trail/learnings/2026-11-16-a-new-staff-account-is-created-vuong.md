---
title: A new staff account is created with roles only; schools and classes are assigned afterwards
author: Vuong
date: 2026-11-16
branch: feat/role-consolidation
cost: { minutes: 11, tokens: 81796 }
id: l-2688d376
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
  - KE_HOACH_TEST_STAGING.md
---

## Decided
The owner decided (16/11/2026) that the create-staff wizard does not ask for a scope at all. A new account gets roles only; which schools and classes the person works with is assigned after the account exists. The wizard sends an empty policy list and the backend accepts it.

## Tried and ruled out
Keeping the scope dropdown and only fixing its default. The default "Toàn tổ chức" sent the tenant id as an education unit id, the "Cơ sở / Trung tâm" option used a hard-coded list of fake ids, and only "Trường học liên kết" worked. The owner's view: the scope is already assigned elsewhere, so the picker is not needed.

## Watch out
The backend copies each policy's scopeId straight into user_access_scopes.education_unit_id without looking at scopeType, so any caller that sends a non-unit id still gets a foreign key failure, reported as a misleading 409 "conflicts with existing data". The frontend copy of the OpenAPI contract was not re-synced after the backend dropped minItems on policies.

In the code:
- FE: src/features/employee-management/components/create-employee-wizard.tsx (policies: []), create-employee/role-step.tsx
- BE: EmployeeDtos.CreateEmployeeRequest and UserRequests.AdminCreateUserRequest (policies is @NotNull, not @NotEmpty); UserProvisioningUseCase writes the scopes; GlobalExceptionHandler maps the FK error to 409
