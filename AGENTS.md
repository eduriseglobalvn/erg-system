<!-- intent-skills:start -->
# Skill mappings - load `use` with `bunx @tanstack/intent@latest load <use>`.
skills:
  - when: "Two-way event patterns between devtools panel and application. App-to-devtools observation, devtools-to-app commands, time-travel debugging with snapshots and revert. structuredClone for snapshot safety, distinct event suffixes for observation vs commands, serializable payloads only."
    use: "@tanstack/devtools-event-client#devtools-bidirectional"
  - when: "Create typed EventClient for a library. Define event maps with typed payloads, pluginId auto-prepend namespacing, emit()/on()/onAll()/onAllPluginEvents() API. Connection lifecycle (5 retries, 300ms), event queuing, enabled/disabled state, SSR fallbacks, singleton pattern. Unique pluginId requirement to avoid event collisions."
    use: "@tanstack/devtools-event-client#devtools-event-client"
  - when: "Analyze library codebase for critical architecture and debugging points, add strategic event emissions. Identify middleware boundaries, state transitions, lifecycle hooks. Consolidate events (1 not 15), debounce high-frequency updates, DRY shared payload fields, guard emit() for production. Transparent server/client event bridging."
    use: "@tanstack/devtools-event-client#devtools-instrumentation"
  - when: "Framework-agnostic core concepts for TanStack Router: route trees, createRouter, createRoute, createRootRoute, createRootRouteWithContext, addChildren, Register type declaration, route matching, route sorting, file naming conventions. Entry point for all router skills."
    use: "@tanstack/router-core#router-core"
  - when: "Route protection with beforeLoad, redirect()/throw redirect(), isRedirect helper, authenticated layout routes (_authenticated), non-redirect auth (inline login), RBAC with roles and permissions, auth provider integration (Auth0, Clerk, Supabase), router context for auth state."
    use: "@tanstack/router-core#router-core/auth-and-guards"
  - when: "Automatic code splitting (autoCodeSplitting), .lazy.tsx convention, createLazyFileRoute, createLazyRoute, lazyRouteComponent, getRouteApi for typed hooks in split files, codeSplitGroupings per-route override, splitBehavior programmatic config, critical vs non-critical properties."
    use: "@tanstack/router-core#router-core/code-splitting"
  - when: "Route loader option, loaderDeps for cache keys, staleTime/gcTime/ defaultPreloadStaleTime SWR caching, pendingComponent/pendingMs/ pendingMinMs, errorComponent/onError/onCatch, beforeLoad, router context and createRootRouteWithContext DI pattern, router.invalidate, Await component, deferred data loading with unawaited promises."
    use: "@tanstack/router-core#router-core/data-loading"
  - when: "Link component, useNavigate, Navigate component, router.navigate, ToOptions/NavigateOptions/LinkOptions, from/to relative navigation, activeOptions/activeProps, preloading (intent/viewport/render), preloadDelay, navigation blocking (useBlocker, Block), createLink, linkOptions helper, scroll restoration, MatchRoute."
    use: "@tanstack/router-core#router-core/navigation"
  - when: "notFound() function, notFoundComponent, defaultNotFoundComponent, notFoundMode (fuzzy/root), errorComponent, CatchBoundary, CatchNotFound, isNotFound, NotFoundRoute (deprecated), route masking (mask option, createRouteMask, unmaskOnReload)."
    use: "@tanstack/router-core#router-core/not-found-and-errors"
  - when: "Dynamic path segments ($paramName), splat routes ($ / _splat), optional params ({-$paramName}), prefix/suffix patterns ({$param}.ext), useParams, params.parse/stringify, pathParamsAllowedCharacters, i18n locale patterns."
    use: "@tanstack/router-core#router-core/path-params"
  - when: "validateSearch, search param validation with Zod/Valibot/ArkType adapters, fallback(), search middlewares (retainSearchParams, stripSearchParams), custom serialization (parseSearch, stringifySearch), search param inheritance, loaderDeps for cache keys, reading and writing search params."
    use: "@tanstack/router-core#router-core/search-params"
  - when: "Non-streaming and streaming SSR, RouterClient/RouterServer, renderRouterToString/renderRouterToStream, createRequestHandler, defaultRenderHandler/defaultStreamHandler, HeadContent/Scripts components, head route option (meta/links/styles/scripts), ScriptOnce, automatic loader dehydration/hydration, memory history on server, data serialization, document head management."
    use: "@tanstack/router-core#router-core/ssr"
  - when: "Full type inference philosophy (never cast, never annotate inferred values), Register module declaration, from narrowing on hooks and Link, strict:false for shared components, getRouteApi for code-split typed access, addChildren with object syntax for TS perf, LinkProps and ValidateLinkOptions type utilities, as const satisfies pattern."
    use: "@tanstack/router-core#router-core/type-safety"
  - when: "ERG MUI Design System for ERG System. MUI-first operational UI with MUI Material, MUI Icons, MUI System/sx, dense enterprise tables, dialogs, drawers, forms, badges, and cards. NOT for landing pages or marketing sites. ERP SaaS UI only."
    use: "@/agents/skills/erg-system-ui"
<!-- intent-skills:end -->

# Working Rules

## Mandatory Planning & Task Workbook

Before any actionable work, load the global skill at `C:/Users/VuongTran/.codex/skills/erg-task-planning/SKILL.md`, create a concrete plan, and synchronize the matching task in `Tất cả Task` of `D:/ERG/TASK/ERG_Task_Management_.xlsx`.

- Only minimal reads needed to locate instructions, the workbook, or the spreadsheet runtime may happen before the workbook entry.
- Do not edit source, run substantive audits, execute tests, or change external state until the plan is persisted.
- Keep the plan tool and workbook synchronized when steps start, complete, become blocked, or change scope.
- Before the final response, update progress, final status, evidence, and unfinished work in the workbook.
- If the workbook is locked or cannot be updated, stop substantive work and report the blocker instead of silently using another file.

## Autonomous Senior Execution

- For the current open backlog, follow `docs/superpowers/plans/2026-07-23-senior-backlog-master-handoff.md` as the execution order and handoff contract.
- Do not ask routine implementation questions. Make the safest evidence-backed assumption, record it in the task plan/workbook, implement, and verify.
- The only hard stops are: unavailable canonical workbook, missing external credential/production authority, irreversible data loss, an unsolved FE/BE business-contract contradiction, or the same blocker recurring for three consecutive turns.
- Resolve dependencies from `Tất cả Task` before coding. Only one code-changing task may be active per repository checkout.
- Preserve user changes in dirty worktrees; never reset, discard, overwrite, or commit unrelated work.
- When metadata is stale, source/tests/contracts win. Correct the workbook scope and preserve the previous evidence history.

## Frontend Architecture

Follow this structure for all frontend work:

```text
src/
├── app/              # Route tree + page components (type-safe TanStack Router)
│   ├── route-tree.ts
│   ├── root-route.tsx
│   └── pages/
│       ├── lms/
│       ├── lcms/
│       ├── crm/
│       └── elearning/
├── components/
│   ├── erg-mui/      # ERG MUI wrappers and adapters for new operational UI
│   ├── ui/           # Legacy shadcn/Radix compatibility only
│   ├── portal/       # Sidebar, Header, SidebarLayout
│   └── shared/       # Shared business components
├── features/         # Feature modules (business logic)
│   └── <feature>/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       └── types/
├── platform/         # Auth, i18n
├── styles/           # globals.css, theme.css
├── lib/              # Utility wrappers
├── stores/           # TanStack stores
├── hooks/            # Shared hooks
└── types/            # Global types
```

## Non-Negotiable Rules

1. Use TanStack Router (type-safe), no if/else chain routing.
2. Use the ERG MUI Design System: MUI Material + ERG wrappers, no dashboard-kit for new surfaces.
3. Use MUI Icons with path imports, and do not add lucide-react to new code.
4. Style new operational UI through MUI System/sx and MUI theme tokens.
5. Shell components stay under 200 lines; split sub-components.
6. Pages stay thin and only compose feature components.
7. Business logic belongs in `features/`, not pages.
8. Use skeleton screens, not blocking spinners, for loading.
9. Keep TanStack Query persist for offline-ready core features.
10. Code-split each route for performance.
11. Plan first and synchronize every actionable task to `D:/ERG/TASK/ERG_Task_Management_.xlsx` using the mandatory planning workflow.

12. Treat Google Sheets native as the primary task-management editing surface. Keep the XLSX as backup/exchange; use direct row-link formulas, date-only dropdowns, and static liquid fills instead of Excel-only dynamic arrays or conditional formatting.
13. `Tất cả Task` is the only editable task-data source. Do not add or rely on `Kế hoạch`, `Hoàn thành theo ngày`, `FE Tasks`, or `BE Tasks` as duplicate task tables.
14. Every task must have a clear platform and detailed timeline: Ngày tạo, Bắt đầu, Hạn, Ngày hoàn thành, Cập nhật cuối, derived duration, remaining/overdue days, and time status.

## Legacy UI Rule

- shadcn/ui, Radix, lucide-react, and Tailwind utility classes are legacy-only for old code paths.
- New operational/admin UI must use `src/components/erg-mui`, MUI Material path imports, MUI Icons path imports, and MUI System/sx.
- TanStack Router, TanStack Query, route code splitting, skeleton loading, and offline query persistence remain required.

## Locked UI: Matching Question

The current matching question UI is approved and locked. Do not edit the matching question card layout, puzzle connectors, drag/drop visual effects, active drag color, source placeholder color, or practice/editor matching layout unless the user explicitly asks for matching changes or confirms permission.

Protected areas include:

- `src/components/quiz/questions/matching-question.tsx`
- Matching puzzle styles in `src/styles/globals.css`
- Matching/practice overrides in `src/features/lcms/quiz/quiz-editor/styles/classic-editor.css`

## ERG MUI Design Tokens

- Primary: use `primary` in `src/themes/erg-enterprise-tokens.ts`.
- Sidebar: 280px.
- Font: Manrope Variable for body, JetBrains Mono for code.
- Border, surface, status, radius, and shadow come from ERG MUI theme tokens.
- Border radius: 8px base, controlled through MUI theme/wrappers.
- Table cell: dense enterprise rhythm, font 14px.
- Header: 64px, border-bottom.
- Status badges: use MUI palette success/warning/error/info.

## Performance Budget

- FCP < 1.5s (3G)
- Bundle (initial) < 100KB gzip
- Lighthouse > 90
- TTI < 3s

## PWA Strategy

- vite-plugin-pwa with IndexedDB + TanStack Query persist
- Offline-first for core features: attendance, scores, homework
- Connection quality detection: 3G/4G/WiFi
- Adaptive loading: reduce images on 3G

## Backend Contract & Release Protocol

The FE repo vendors (copies + sha256-locks) the backend contracts so builds are
reproducible and drift is caught in CI. The sibling BE repo lives at
`../erg-spring`. Two contracts are tracked, both under `contracts/backend/`:

| Contract | Vendored file | Lock | BE source (default) | Generated types |
|----------|---------------|------|---------------------|-----------------|
| REST (OpenAPI) | `erg-openapi.json` | `erg-openapi.lock.json` | `../erg-spring/contracts/openapi/erg-openapi.json` | `src/lib/api/generated/erg-openapi.ts` |
| GraphQL | `schema.graphqls` | `schema.graphqls.lock.json` | `../erg-spring/src/main/resources/graphql/schema.graphqls` | `src/lib/api/generated/graphql.ts` |

Locks are `{ source, sha256 }` produced by `scripts/api-contract-lib.mjs`.

### Sync + lock (when BE contracts change)

Run after the BE repo publishes a new contract. Each sync copies the BE source
into `contracts/backend/`, rewrites the `.lock.json` with the new sha256, then
regenerates the corresponding types:

```bash
bun run contract:rest:sync       # copies OpenAPI, relocks, runs openapi-typescript
bun run contract:graphql:sync    # copies schema, relocks, runs graphql-codegen (codegen.ts)
```

Override the source with `--source <path>` if the BE repo is elsewhere, e.g.
`node scripts/sync-api-contract.mjs --source /path/to/erg-openapi.json`.

Commit the changed vendored contract, its `.lock.json`, and the regenerated
types together in one changeset — they must stay consistent.

### When to regenerate types

Types are derived, never hand-edited. Regenerate whenever the vendored contract
changes. The sync scripts do this automatically; to regenerate REST types alone
without re-vendoring use `bun run contract:rest:generate`. GraphQL operation
types are also regenerated whenever `src/**/*.graphql` documents change (see
`codegen.ts`).

### The drift gate (`contract:check`)

```bash
bun run contract:check
```

Runs three checks and fails (non-zero exit) if any fails:

1. `node --test scripts/api-contract-lib.test.mjs` — the lock lib self-test.
2. `contract:rest:check` — verifies `erg-openapi.json` still matches its lock
   sha256, and runs `openapi-typescript --check` so committed REST types cannot
   drift from the contract.
3. `contract:graphql:check` — verifies `schema.graphqls` matches its lock
   sha256, then reruns graphql-codegen.

A checksum mismatch means someone edited a vendored contract by hand or forgot
to relock after a sync — rerun the matching `:sync` instead of editing files.
Wire `contract:check` into CI as a required gate.

`bun run verify:api-contract` is the fuller pre-merge gate: `contract:check`
plus `typecheck` plus the api-client / feature-api vitest suites.

### Release steps

1. Ensure `bun run contract:check` exits 0 (contracts locked, types in sync).
2. `bun run verify:api-contract` (contract gate + typecheck + api tests).
3. `bun run test` and `bun run lint`.
4. `bun run build` (`tsc -b && vite build`).
5. Merge; CI reruns `contract:check` as the drift gate.

Rule: never edit `contracts/backend/*` or `src/lib/api/generated/*` by hand.
Change the contract in the BE repo, then re-sync here.

## Cross-Repository Governance

### Canonical ownership

- `erg-spring` publishes backend behavior and REST/GraphQL contracts.
- `erg-system` owns operational LMS, LCMS, CRM and ELEARNING portals and consumes pinned contracts.
- `elearning` is a frozen secondary/legacy frontend; `ERG-066` established `erg-system` as the operational canonical owner.
- `erg` owns public CMS, forum, editorial and marketing surfaces.

### Contract change protocol

Follow `docs/architecture/cross-repo-contract-release-protocol.md` and `docs/architecture/frontend-repository-ownership.md`. Run `bun run governance:check` and `bun run repository-drift:check` before declaring cross-repository governance or contract handoff complete. Do not copy feature implementations between repositories and do not manually edit vendored contracts or generated transport types.
