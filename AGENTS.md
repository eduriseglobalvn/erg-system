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
  - when: "CenterUp-inspired UI design for ERG System. shadcn/ui + Radix + Tailwind v4. Data tables, sidebar, forms, badges, cards. NOT for landing pages or marketing sites. ERP SaaS UI only."
    use: "@/agents/skills/centerup-ui-design"
<!-- intent-skills:end -->

# Working Rules

## Frontend Architecture

Follow this structure for all frontend work:

```
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
│   ├── ui/           # shadcn/ui components (CenterUp-styled)
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

1. ✅ Dùng TanStack Router (type-safe), KHÔNG if/else chain routing
2. ✅ Dùng shadcn/ui, KHÔNG dùng MUI, KHÔNG dashboard-kit
3. ✅ Dùng lucide-react icons, KHÔNG @mui/icons-material
4. ✅ Theme qua CSS variables, KHÔNG next-themes
5. ✅ Shell components < 200 dòng, tách sub-components
6. ✅ Pages mỏng - chỉ compose feature components
7. ✅ Business logic trong features/, KHÔNG trong pages
8. ✅ Skeleton screens (không spinner) cho loading
9. ✅ TanStack Query persist cho offline
10. ✅ Code-split mỗi route cho performance

## CenterUp Design Tokens (EXACT — extracted via Playwright)

- Primary: #696CFF (PURPLE) — KHÔNG phải blue
- Sidebar: #1C252E (dark), 280px
- Font: Manrope Variable (body), JetBrains Mono (code)
- Border: rgba(145, 158, 171, 0.2) dashed
- Border radius: 8px (base)
- Table cell: 6px 16px, font 14px
- Header: 64px, border-bottom
- Status badges: success=green(#22C55E), warning=gold(#FFAB00), danger=red(#FF5630), info=cyan(#00B8D9)

## Performance Budget

- FCP < 1.5s (3G)
- Bundle (initial) < 100KB gzip
- Lighthouse > 90
- TTI < 3s

## PWA Strategy

- vite-plugin-pwa with IndexedDB + TanStack Query persist
- Offline-first cho core features (attendance, scores, homework)
- Connection quality detection (3G/4G/WiFi)
- Adaptive loading (giảm ảnh trên 3G)
