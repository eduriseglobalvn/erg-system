# Frontend Architecture Rules

This file captures the requested project architecture so future changes stay consistent.

## Target Structure

```text
src/
├── assets/       # Images, fonts, global static assets
├── components/   # Shared reusable UI across the app
├── config/       # App config, constants, env helpers
├── context/      # Global React context when needed
├── features/     # Main application features
│   ├── auth/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── index.ts
│   └── dashboard/
│       ├── api/
│       ├── components/
│       ├── config/
│       ├── hooks/
│       ├── types/
│       └── index.ts
├── hooks/        # Shared hooks
├── layouts/      # Layout shells
├── lib/          # Third-party wrappers or temporary compatibility adapters
├── pages/        # Route-facing pages only
├── routes/       # Route definitions
├── stores/       # Global stores
├── types/        # Shared system types
└── utils/        # Pure helpers
```

## Implementation Rules

- Split UI into clear, reusable components.
- Keep business logic, feature state, and feature services inside `src/features`.
- Keep pages thin; they should mostly import and render feature entry exports.
- Prefer compatibility adapters over large unstable moves if a full migration is not practical in one step.
- When creating new code, follow this architecture first instead of expanding legacy folders.
- New operational/admin UI is MUI-first: use MUI Material, MUI Icons path imports, MUI System/sx, and ERG wrappers from `src/components/erg-mui`.
- TanStack Router and TanStack Query remain the routing/data standards.
- shadcn/ui, Radix, lucide-react, and Tailwind utility classes are legacy-only for old code paths; do not use them as the standard for new UI.
- Theme changes belong in `src/themes/erg-enterprise-theme.tsx` and `src/themes/erg-enterprise-tokens.ts`.

## Active Notes

- The dashboard sidebar must keep a mock teacher account anchored at the bottom-left area.
- The current refactor prioritizes `auth` and `dashboard` as the first fully structured features.
