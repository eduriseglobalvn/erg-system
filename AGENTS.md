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
