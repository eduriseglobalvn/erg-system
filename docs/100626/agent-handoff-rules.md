# ERG Agent Handoff Rules

Updated: 2026-06-10

## Purpose

Use this file as the first read for future agents working on LMS, LCMS, Elearning, or notification integration in `D:\ERG\erg-system`.

## Architecture Rules

- Keep business logic inside `src/features/<feature>`.
- Keep pages thin. Pages only compose feature exports.
- Shared API clients go in `src/lib`.
- Do not move write/command flows to GraphQL unless the contract explicitly says so.
- Read-heavy workspaces may use GraphQL. Mutations/commands stay REST.

## Current API Boundary

### GraphQL read APIs

Use `src/lib/graphql-client.ts` and feature adapters only.

- LMS:
  - `lms.learningResourceLibrary`
  - `lms.classWorkspace`
  - `lms.teacherHomeworkWorkspace`
  - `lms.assignmentProgressWorkspace`
- LCMS:
  - `lcms.questionBankWorkspace`
  - `lcms.accessManagementWorkspace`
- Elearning:
  - `elearning.studentDashboard`

### REST-only flows

Keep REST for:

- auth / sessions / refresh
- create/update/delete/submit/import/export/upload
- quiz runtime attempt sync/submit
- viewer launch/detail when already REST-backed
- notification read/write/device/admin commands
- LCMS access scope list/detail/save/preview endpoints; `lcms.accessManagementWorkspace` is only for read workspace users and bootstrap options.

## Existing Foundation

- `src/lib/api-client.ts`
  - auto auth / tenant / portal / request id
  - refresh retry already handled
  - `unwrapEnvelope: false` allows raw GraphQL envelopes
- `src/lib/graphql-client.ts`
  - use for all GraphQL reads
  - validates operation name
  - blocks sensitive variable keys
- `src/features/lms/api/lms-graphql-api.ts`
  - central LMS GraphQL document + mappers

## Safe Edit Targets

### LMS

- `src/features/lms/learning-resources/api/learning-resource-api.ts`
- `src/features/lms/learning-resources/api/teacher-resource-dashboard-api.ts`
- `src/features/lms/components/lms-teacher-shell.tsx`
- `src/features/lms/components/homework-progress-page.tsx`
- `src/features/lms/classroom/components/class-management-page.tsx`
- `src/features/lms/classroom/components/class-students-workspace.tsx`

### LCMS

- `src/features/lcms/quiz/question-bank/api/question-bank-api.ts`
- `src/features/lcms/admin-operations/api/access-management-api.ts`
- `src/features/lcms/quiz/question-bank/components/question-bank-workspace.tsx`
- `src/features/lcms/admin-operations/components/user-access-control-workspace.tsx`
- `src/features/lcms/admin-operations/components/user-access-control-sections.tsx`

### Elearning

- `src/features/elearning/student-dashboard/api/student-dashboard-api.ts`
- `src/features/elearning/student-dashboard/components/student-dashboard-workspace.tsx`

### Notifications / Push

- `src/features/lms/mobile/hooks/use-pwa-notifications.ts`
- `src/features/lms/components/lms-notification-center.tsx`
- `src/features/lms/components/lms-notification-detail-page.tsx`
- `src/features/notifications/api/notification-api.ts`
- `src/features/notifications/api/admin-notification-api.ts`
- `public/pwa-push.js`

## Integrated API Map

- `src/features/lms/api/lms-graphql-api.ts` owns LMS GraphQL documents and shared mappers.
- `src/features/lms/learning-resources/api/learning-resource-api.ts` uses `lms.learningResourceLibrary` for list/bootstrap reads; REST remains source for viewer/detail/launch operations.
- `src/features/lms/components/lms-teacher-shell.tsx`, `homework-progress-page.tsx`, and classroom workspaces use LMS GraphQL read workspaces with mock/REST fallbacks.
- `src/features/lcms/quiz/question-bank/api/question-bank-api.ts` uses `lcms.questionBankWorkspace`; local templates fill fields not exposed by GraphQL yet.
- `src/features/lcms/admin-operations/api/access-management-api.ts` uses `lcms.accessManagementWorkspace` for user list reads; write/detail/preview/scope list remain REST.
- `src/features/elearning/student-dashboard/api/student-dashboard-api.ts` uses `elearning.studentDashboard`; quiz runtime remains REST.
- `src/features/notifications/api/notification-api.ts` owns self inbox, unread count, preferences, mark-read/archive, and device registry APIs.
- `src/features/notifications/api/admin-notification-api.ts` owns admin send/broadcast/stats/outbox commands and must send `X-Portal: admin`.
- `src/features/lms/mobile/hooks/use-pwa-notifications.ts` registers, heartbeats, unregisters, and revokes devices through `/api/v1/notification-devices`.
- `public/pwa-push.js` treats push payloads as hints only and routes click-through to `/notifications/{id}` or a same-origin deeplink; app detail fetch remains source of truth.

## Do Not

- Do not put GraphQL fetches directly in components.
- Do not replace REST write flows with GraphQL just for convenience.
- Do not assume GraphQL responses are complete. Nulls and partial `data + errors` are valid.
- Do not remove the mock teacher account from dashboard sidebars.
- Do not change shell/navigation layout unless required by the integration.

## Query / Cache Rules

- Query keys must include the scope that changes data.
- Include tenant, portal, user/scope, and filter values where relevant.
- Search/filter inputs should be debounced before refetching.
- Use optimistic updates only when rollback is clear.

## UI Rules

- Keep dashboard/LCMS surfaces dense and operational.
- Keep text from overlapping on desktop and mobile.
- Use icons for commands where appropriate.
- Preserve bottom-left teacher account visibility in dashboard/sidebar shells.

## Verification

- Prefer targeted tests around adapters and mappers.
- Run `bun run typecheck` after GraphQL or API surface changes.
- Run focused vitest files for touched adapters before broad build/test runs.

## Notes For Future Agents

- If a GraphQL contract is missing fields needed by an existing UI, add a local adapter fallback instead of breaking the UI.
- If a screen is still mock-driven, migrate the API adapter first, then wire the component.
- If a contract is read-heavy but uncertain, keep the current REST flow until the mapping is stable.
