# Student Dashboard Mobile PWA Design

**Goal**

Refactor the Elearning student dashboard mobile experience so it feels like an installable learning app instead of a squeezed desktop page, while preserving the current desktop experience.

**Scope**

- Mobile-only dashboard shell and navigation
- Mobile overview page layout
- Mobile-safe spacing, sticky surfaces, and bottom dock behavior
- Keep current desktop/tablet layout intact
- Keep existing business data and page content

**Out of Scope**

- Backend/API changes
- Desktop redesign
- Quiz-player redesign beyond existing mobile work
- Full offline/PWA service worker implementation

## Approved Direction

The mobile dashboard should follow an "app học tập" pattern with:

- a compact top bar
- a scrollable content feed
- a floating bottom dock as the primary navigation
- cleaner cards, tighter spacing, and better thumb reach

The user explicitly approved replacing the current mobile top-tab navigation with a bottom dock.

## UX Structure

### 1. Mobile Shell

On small screens, the dashboard should render as a mobile app shell:

- top safe-area padding
- compact top bar with brand, notifications, and account entry
- main content feed with enough bottom padding to avoid collision with the dock
- floating bottom dock fixed above the safe-area inset

Desktop and tablet should continue using the current header/navigation pattern.

### 2. Bottom Dock

The primary mobile navigation becomes a rounded floating dock inspired by native app tabs:

- fixed near the bottom
- large corner radius
- icon above label
- 5 evenly spaced items
- active item visually highlighted
- easy thumb tap targets

The dock should replace the current horizontal tab navigation on mobile only.

Recommended mobile dock items:

- Tổng quan
- Bài tập
- Điểm
- Thảo luận
- Tài khoản

Notifications may stay as a badge in the top bar instead of becoming a dock item, to avoid overcrowding.

### 3. Overview Page

The overview page should become a mobile-first feed:

- greeting hero card near the top
- primary CTA emphasized
- secondary CTA simplified
- priority schedule card beneath hero
- task list card below that
- reduced padding and visual weight compared with the desktop cards

The page should feel fast to scan on a phone. Content hierarchy matters more than decorative surface area.

### 4. Mobile Visual Style

The mobile/PWA style should lean toward native-app polish:

- tighter vertical spacing
- simpler card shadows
- reduced border weight
- less horizontal chrome
- safe-area aware bottom spacing
- fewer simultaneous controls at the top

### 5. Behavioral Rules

- Mobile only: use the floating bottom dock
- Mobile only: hide the current top nav row
- Mobile only: add enough bottom padding so content never hides behind the dock
- Desktop/tablet: preserve current navigation and section layout
- Existing page state (`activePage`, notifications, account state) must continue working

## Architecture

The current `student-dashboard-workspace.tsx` already owns the page state, copy, and view switching. The refactor should preserve that state model and extract mobile shell/presentation concerns into smaller feature-local components where practical.

Preferred decomposition:

- keep the dashboard state in `student-dashboard-workspace.tsx`
- add focused mobile UI components under `src/features/student-dashboard/components/`
- compute whether the viewport is mobile and switch only the shell/navigation/presentation layer

## Likely Files

- Modify: `src/features/student-dashboard/components/student-dashboard-workspace.tsx`
- Create: `src/features/student-dashboard/components/student-dashboard-mobile-shell.tsx`
- Create: `src/features/student-dashboard/components/student-dashboard-bottom-dock.tsx`
- Possibly create: `src/features/student-dashboard/components/student-dashboard-mobile-overview.tsx`

## Testing Expectations

- Mobile rendering keeps all existing dashboard states functional
- Active page switching still works from the new dock
- Mobile content is not hidden behind the floating dock
- Desktop layout remains unchanged
- Build and typecheck continue to pass

## Success Criteria

- On mobile, the dashboard reads as a learning app rather than a compressed website
- The primary navigation lives in a bottom floating dock
- The overview page feels lighter, cleaner, and easier to use one-handed
- Desktop behavior remains stable
