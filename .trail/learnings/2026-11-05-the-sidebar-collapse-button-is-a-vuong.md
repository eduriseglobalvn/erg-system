---
title: "The sidebar collapse button is a small circle centred on the menu card's right edge"
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 33, tokens: 96825 }
id: l-c00c843b
scope: repo
status: active
src: agent
touches:
  - vite.config.ts
  - src/themes/erg-enterprise-tokens.ts
  - src/components/portal/ErgPortalSidebar.tsx
---

## Decided
The owner picked this design: the collapse/expand control is a 24px round button sitting on the floating menu card's right edge, half on the card and half in the gutter, vertically centred. It has a thin border and a light shadow, and turns solid primary on hover.

## Tried and ruled out
- A 28px square handle near the top edge. It sat next to the portal switcher's up/down chevron, and the two arrows looked cluttered.
- A button beside the search box at the bottom of the menu. The owner did not want the control there.
- A half-round tab sticking out of the edge. The owner found it ugly.

## Watch out
Keep the button inside the 12px gutter (right = -SIDEBAR_GUTTER) so it never covers page content. The theme's IconButton radius no longer gives a circle, so the button sets its own borderRadius 50%.

In the code: src/components/portal/ErgPortalSidebar.tsx (ButtonBase "Thu gọn menu" / "Mở rộng menu").
