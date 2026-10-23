# Single API Registry and Cache Optimization Implementation Plan

> Status: completed — canonical implementation evidence is tracked in `D:/ERG/TASK/ERG_Task_Management_.xlsx` and the paired plan when present.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Centralize every FE→BE REST endpoint in one `API_ENDPOINTS` registry and optimize TanStack Query caching/persistence without leaking stale or sensitive data.

**Architecture:** `src/lib/api/api-endpoints.ts` is the only REST path source. Domain API modules keep payload mapping and query construction but receive paths from the registry. TanStack Query remains the only response cache; a shared policy classifies query volatility, an IndexedDB persister allowlists offline-core queries, and auth/tenant/account scope is part of every persisted cache boundary.

**Tech Stack:** TypeScript, TanStack Query 5, IndexedDB async persister, Vitest, Node test runner, OpenAPI-generated `ContractPath`, Bun.

---

### Task 1: Endpoint registry and literal guard

**Files:**
- Create: `D:/ERG/erg-system/src/lib/api/api-endpoints.ts`
- Create: `D:/ERG/erg-system/src/lib/api/api-endpoints.test.ts`
- Create: `D:/ERG/erg-system/scripts/check-api-endpoint-literals.mjs`
- Create: `D:/ERG/erg-system/scripts/check-api-endpoint-literals.test.mjs`
- Modify: `D:/ERG/erg-system/src/lib/api/contract-types.ts`
- Modify: `D:/ERG/erg-system/package.json`

- [ ] **Step 1: Write failing registry tests**

Assert static paths satisfy `ContractPath`, dynamic paths encode slash/space, and critical auth/admin/LMS/LCMS/quiz paths have expected values.

```ts
import { expect, test } from "vitest";
import { API_ENDPOINTS } from "@/lib/api/api-endpoints";

test("encodes dynamic endpoint segments", () => {
  expect(API_ENDPOINTS.adminUsers.detail("user/1")).toBe("/api/v1/admin/users/user%2F1");
  expect(API_ENDPOINTS.lms.attemptAnswer("attempt 1", "question/1")).toBe(
    "/api/v1/lms/attempts/attempt%201/answers/question%2F1",
  );
});
```

- [ ] **Step 2: Run RED**

Run `bun run test -- src/lib/api/api-endpoints.test.ts`. Expected failure: `Cannot find module api-endpoints`.

- [ ] **Step 3: Implement one registry**

Create grouped immutable `API_ENDPOINTS` entries for every path discovered by the source scan. Static paths use `satisfies ContractPath`; dynamic entries call `encodeApiPathSegment`. Merge the existing employee/access route entries into this file.

- [ ] **Step 4: Add literal guard tests first**

The Node scanner must fail on production source containing `/api/` string literals outside `src/lib/api/api-endpoints.ts`, generated OpenAPI files, tests, and documentation. It must report file and line. Run it against a temporary fixture in the test and assert the fixture fails.

- [ ] **Step 5: Add scripts and verify GREEN**

Add `endpoint:check` and include it in `contract:check` and `verify:api-contract`. Run registry tests, scanner tests, typecheck and the existing contract suite.

- [ ] **Step 6: Commit**

```powershell
git add -- src/lib/api/api-endpoints.ts src/lib/api/api-endpoints.test.ts src/lib/api/contract-types.ts scripts/check-api-endpoint-literals.mjs scripts/check-api-endpoint-literals.test.mjs package.json
git commit -m "feat: add single REST endpoint registry"
```

### Task 2: Migrate transport, auth and account APIs

**Files:**
- Modify: `src/lib/api-client.ts`, `src/lib/graphql-client.ts`, `src/lib/api.ts`
- Modify: `src/platform/auth/api/auth-api.ts`, `src/platform/auth/api/account-api.ts`, `src/platform/auth/api/account-security-api.ts`
- Modify: `src/platform/auth/api/student-auth-storage.ts`
- Delete: `src/features/employee-management/api/employee-management-routes.ts`, `src/features/access-management/api/access-management-routes.ts`

- [ ] **Step 1: Extend endpoint tests for transport/auth paths**

Assert CSRF, login, refresh, logout, account profile and GraphQL paths resolve from `API_ENDPOINTS`; keep existing fetch behavior assertions unchanged.

- [ ] **Step 2: Run RED with literal guard**

Run `bun run endpoint:check`. Expected failure lists the transport/auth files still containing literals.

- [ ] **Step 3: Replace literals without behavior changes**

Use `API_ENDPOINTS` for every path, preserve request method/body/headers/auth policy, and delete the two old route files after all imports are migrated.

- [ ] **Step 4: Verify GREEN**

Run auth/account tests, `src/lib/api-client.test.ts`, `src/lib/graphql-client.test.ts`, endpoint guard and typecheck.

- [ ] **Step 5: Commit**

```powershell
git add -- src/lib/api-client.ts src/lib/graphql-client.ts src/lib/api.ts src/platform/auth/api src/features/employee-management/api src/features/access-management/api
git commit -m "refactor: migrate auth and transport to endpoint registry"
```

### Task 3: Migrate LCMS administration, school and content APIs

**Files:**
- Modify: `src/features/lcms/admin-operations/api/access-management-api.ts`
- Modify: `src/features/lcms/admin-operations/api/centers-api.ts`
- Modify: `src/features/lcms/admin-operations/api/learning-resource-authoring-api.ts`
- Modify: `src/features/lcms/admin-operations/api/student-account-import-api.ts`
- Modify: `src/features/lcms/admin-operations/api/teacher-account-api.ts`
- Modify: `src/features/lcms/admin-operations/api/user-admin-api.ts`
- Modify: `src/features/lcms/school-management/api/school-management-api.ts`
- Modify: `src/features/lcms/quiz/question-bank/api/question-bank-api.ts`

- [ ] **Step 1: Add route assertions for each domain**

Add tests covering static path values, encoded IDs, HTTP methods, query serialization and explicit `portal/auth` policy. Do not change existing exported function signatures.

- [ ] **Step 2: Run RED**

Run the affected API tests plus `bun run endpoint:check`; confirm failures are endpoint literals, not unrelated test setup.

- [ ] **Step 3: Migrate to `API_ENDPOINTS`**

Replace only path construction. Keep mappers, payloads, query keys and error behavior unchanged. Use `createApiClient({ portal, auth })` for each domain call.

- [ ] **Step 4: Verify GREEN and commit**

Run all affected API tests, typecheck and endpoint guard, then commit:

```powershell
git add -- src/features/lcms/admin-operations/api src/features/lcms/school-management/api src/features/lcms/quiz/question-bank/api
git commit -m "refactor: migrate LCMS APIs to endpoint registry"
```

### Task 4: Migrate quiz editor/runtime, LMS and calendar APIs

**Files:**
- Modify: `src/features/lcms/quiz/quiz-editor/api/quiz-editor-api.ts`
- Modify: `src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-api.ts`
- Modify: `src/features/lms/api/lms-assignment-command-api.ts`
- Modify: `src/features/lms/infrastructure/lms-dashboard-api.ts`
- Modify: `src/features/teaching-calendar/api/teaching-calendar-api.ts`
- Modify: `src/features/notifications/api/admin-notification-api.ts`, `src/features/notifications/api/notification-api.ts`

- [ ] **Step 1: Add/extend endpoint tests**

Assert all quiz, assignment, calendar and notification operations use registry paths and preserve query/body contracts.

- [ ] **Step 2: Run RED and migrate**

Run affected tests and endpoint guard, then replace every literal with registry entry/function. Encode every dynamic segment centrally.

- [ ] **Step 3: Verify GREEN**

Run quiz runtime/editor, LMS assignment, calendar, notification tests, typecheck and endpoint guard.

- [ ] **Step 4: Commit**

```powershell
git add -- src/features/lcms/quiz src/features/lms src/features/teaching-calendar src/features/notifications
git commit -m "refactor: migrate LMS and quiz APIs to endpoint registry"
```

### Task 5: Shared query policy and retry behavior

**Files:**
- Create: `src/lib/query-policy.ts`
- Create: `src/lib/query-policy.test.ts`
- Modify: `src/lib/query-client.ts`
- Modify: `src/lib/api-client.ts`

- [ ] **Step 1: Write failing policy tests**

Test `realtime`, `transactional`, `reference`, `offlineCore`, and `sensitive` values; test retry returns false for 4xx/auth/abort and bounded retry for network/5xx.

- [ ] **Step 2: Run RED**

Run `bun run test -- src/lib/query-policy.test.ts`; expected missing-module failure.

- [ ] **Step 3: Implement policy**

Export policy constants and a retry predicate with capped exponential delay metadata. Configure QueryClient defaults to `refetchOnReconnect: true`, no focus storm, bounded retry, and conservative default stale/gc values. Keep per-feature overrides only where policy is explicitly selected.

- [ ] **Step 4: Verify GREEN**

Run policy tests, API client tests, typecheck and existing query option tests.

- [ ] **Step 5: Commit**

```powershell
git add -- src/lib/query-policy.ts src/lib/query-policy.test.ts src/lib/query-client.ts src/lib/api-client.ts
git commit -m "feat: centralize query cache policy"
```

### Task 6: IndexedDB persistence for offline-core only

**Files:**
- Modify: `package.json`, `bun.lock`
- Create: `src/lib/query-persistence.ts`
- Create: `src/lib/query-persistence.test.ts`
- Modify: `src/App.tsx`, `src/main.tsx`
- Modify: offline-core query modules selected by the existing attendance/scores/homework query keys

- [ ] **Step 1: Add persister dependencies**

Install the TanStack Query persistence and IndexedDB async-storage packages already compatible with the repository's TanStack Query major version.

- [ ] **Step 2: Write failing persistence tests**

Test allowlist accepts only offline-core query metadata, rejects sensitive/auth/security keys, includes schema version and portal/tenant/account scope, and purges on logout/scope change.

- [ ] **Step 3: Implement persister**

Use IndexedDB async storage with max age, buster and safe fallback to memory when IndexedDB is unavailable. Hydrate only allowlisted queries; never store tokens or arbitrary query data.

- [ ] **Step 4: Integrate provider**

Use the persisted QueryClient provider without blocking first render. Clear persisted scope from auth logout/account-switch events. Preserve dev/test behavior when storage is unavailable.

- [ ] **Step 5: Verify GREEN**

Run persistence tests, auth logout tests, query tests, typecheck and build.

- [ ] **Step 6: Commit**

```powershell
git add -- package.json bun.lock src/lib/query-persistence.ts src/lib/query-persistence.test.ts src/App.tsx src/main.tsx
git commit -m "feat: persist offline core queries safely"
```

### Task 7: Replace broad invalidation with policy-aware updates

**Files:**
- Modify: `src/features/employee-management/hooks/use-employee-management.ts`
- Modify: `src/features/access-management/hooks/use-access-management.ts`
- Modify: `src/features/lcms/school-management/hooks/use-school-management.ts`
- Modify: `src/features/lcms/quiz/question-bank/api/question-bank-query.ts`
- Modify: `src/features/lms/api/lms-assignment-command-query.ts`
- Modify: `src/features/teaching-calendar/components/*`
- Add/modify corresponding tests.

- [ ] **Step 1: Write failing invalidation tests**

Assert a mutation updates the detail cache when response contains the entity, invalidates only the affected list/detail roots otherwise, and never invalidates unrelated portal/tenant keys.

- [ ] **Step 2: Run RED**

Run each affected query test and confirm current broad invalidation violates the expected key assertions.

- [ ] **Step 3: Implement targeted updates**

Use `setQueryData` for complete mutation responses, targeted `invalidateQueries` for dependent lists, and rollback-capable optimistic updates only for simple status toggles.

- [ ] **Step 4: Verify GREEN**

Run all affected query tests, `bun run verify:api-contract`, typecheck and build.

- [ ] **Step 5: Commit**

```powershell
git add -- src/features/employee-management src/features/access-management src/features/lcms src/features/lms src/features/teaching-calendar
git commit -m "perf: narrow query invalidation and cache updates"
```

### Task 8: Final verification, docs and CI gate

**Files:**
- Modify: `package.json`
- Modify: `docs/api-contract-workflow.md`
- Modify: `docs/superpowers/specs/2026-07-20-single-api-endpoint-registry-design.md`
- Create/modify: repository CI workflow when a supported `.github` workflow exists

- [ ] **Step 1: Add final scripts**

Ensure `endpoint:check`, `contract:check`, `verify:api-contract`, `typecheck`, `lint`, and `build` are callable from a clean checkout.

- [ ] **Step 2: Update runbook**

Document one-file endpoint changes, generated contract sync, cache policy selection, offline-core allowlist, logout purge and mutation invalidation rules.

- [ ] **Step 3: Run full verification**

```powershell
bun run verify:api-contract
bun run lint
bun run build
git diff --check
```

Backend:

```powershell
node --test scripts/openapi-contract-lib.test.cjs scripts/check-openapi-breaking.test.cjs
.\mvnw.cmd -DskipTests compile
```

- [ ] **Step 4: Audit endpoint literals**

Run the scanner and manually inspect any excluded literal. The only production path source allowed is `src/lib/api/api-endpoints.ts`.

- [ ] **Step 5: Commit docs and final gate**

```powershell
git add -- package.json docs/api-contract-workflow.md
git commit -m "docs: finalize endpoint and cache governance"
```

## Self-review checklist

- Every endpoint domain has a registry entry task.
- The cache plan does not persist auth/security data.
- All production API modules retain function signatures and payloads.
- Query scope includes portal/tenant/account where required.
- Tests are specified before implementation for new behavior.
- The final gate fails if a new endpoint literal is introduced.
