---
title: "Floating sidebar card must be height-capped by the shell grid, and collapsed nav buttons must not flex-grow"
author: Vuong
date: 2026-11-04
branch: codex/mui-system-refactor
cost: { minutes: 1, tokens: 1536 }
id: l-db3d4078
scope: repo
status: active
src: agent
touches:
  - src/components/portal/ErgPortalLayout.tsx
  - src/components/portal/portal-sidebar-compact-item.tsx
  - src/components/portal/portal-sidebar-branch-item.tsx
  - src/components/portal/portal-sidebar-nav-layer.tsx
---

## Decided
- The portal shell grid pins its single row with `gridTemplateRows: minmax(0, 1fr)`. Without it the implicit `auto` row grows to the sidebar's content height, so on a 800px-tall screen the card was 844px and the user card at the bottom fell off-screen instead of the menu scrolling inside the card.
- Collapsed icon buttons set `flexGrow: 0`. MUI ListItemButton grows by default, so inside the flex `li` the "44px" button became 54px, was off-centre, and its left accent bar landed outside the card (clipped).
- In collapsed mode a click on a group only opens its flyout, never toggles: hover (mouseenter) has already opened it, so a toggle closed it on the same click and the flyout seemed broken. Closing is by mouse-leave, Escape or click-away.
- An open branch's child list uses `overflow: visible` (hidden only while collapsed), otherwise the active child's accent bar (a ::before at a negative left offset) is clipped.
- Expanded nav reserves a thin scrollbar gutter (`scrollbarGutter: stable`, right padding 4px, scrollbar visible on hover) so long labels do not lose width when the menu scrolls; collapsed nav hides the scrollbar to keep icons centred.

## Watch out
- Accent bar positions are fixed px offsets from card padding (NAV_PADDING, NAV_BRANCH_INSET, compact centring). Change any padding and the bar drifts.
- Measuring in the browser pane: screenshots are scaled; trust getBoundingClientRect via JS, not screenshot pixels.

In the code: src/components/portal/ErgPortalLayout.tsx (shell grid), portal-sidebar-compact-item.tsx (flexGrow, open-only click), portal-sidebar-branch-item.tsx (overflow), portal-sidebar-nav-layer.tsx (scrollbar), portal-sidebar-styles.ts navRowSx (bar).
