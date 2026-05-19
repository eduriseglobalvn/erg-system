# Student Dashboard Mobile PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the student dashboard mobile experience into an app-like PWA shell with a floating bottom dock while preserving the current desktop layout.

**Architecture:** Keep state and routing decisions in `student-dashboard-workspace.tsx`, then split mobile-only presentation into focused feature components. Desktop continues using the existing shell, while mobile swaps to a compact app-like shell with a floating bottom dock and bottom-safe scrolling content.

**Tech Stack:** React, TypeScript, Tailwind utility classes, existing dashboard-kit primitives, existing student dashboard feature state

---

## File Map

- Modify: `src/features/student-dashboard/components/student-dashboard-workspace.tsx`
  - Keep dashboard state, view switching, and data shaping
  - Choose between desktop shell and new mobile shell
- Create: `src/features/student-dashboard/components/student-dashboard-bottom-dock.tsx`
  - Render the floating bottom navigation for mobile
- Create: `src/features/student-dashboard/components/student-dashboard-mobile-shell.tsx`
  - Render the compact top bar, dock, and bottom-safe scroll container
- Create: `src/features/student-dashboard/components/student-dashboard-mobile-overview.tsx`
  - Render the overview screen in a mobile/PWA card/feed layout

### Task 1: Extract Mobile Navigation Dock

**Files:**
- Create: `src/features/student-dashboard/components/student-dashboard-bottom-dock.tsx`
- Modify: `src/features/student-dashboard/components/student-dashboard-workspace.tsx`

- [ ] **Step 1: Add the mobile bottom dock component**

Create `src/features/student-dashboard/components/student-dashboard-bottom-dock.tsx` with props for active page, items, and page-change handling:

```tsx
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StudentPageKey = "overview" | "assignments" | "scores" | "discussion" | "announcements" | "account";

export function StudentDashboardBottomDock({
  activePage,
  items,
  onPageChange,
}: {
  activePage: StudentPageKey;
  items: Array<{ key: StudentPageKey; label: string; icon: ReactNode }>;
  onPageChange: (page: StudentPageKey) => void;
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
      <div className="mx-auto grid max-w-md grid-cols-5 rounded-[28px] border border-slate-200/80 bg-white/96 px-2 py-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur">
        {items.map((item) => {
          const active = item.key === activePage;
          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "grid min-h-16 place-items-center rounded-2xl px-2 py-2 text-center transition",
                active ? "bg-[#eef2ff] text-[#060b7a]" : "text-slate-500",
              )}
              onClick={() => onPageChange(item.key)}
            >
              <span className="grid h-5 place-items-center">{item.icon}</span>
              <span className="mt-1 text-[11px] font-semibold leading-4">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Run typecheck for the new dock component**

Run: `bun run typecheck`
Expected: either PASS or only pre-existing unrelated failures

- [ ] **Step 3: Filter nav items for the mobile dock**

Modify `student-dashboard-workspace.tsx` to derive a mobile dock set that excludes `announcements`:

```tsx
const mobileDockItems = useMemo(
  () => copy.navItems.filter((item) => item.key !== "announcements"),
  [copy.navItems],
);
```

- [ ] **Step 4: Re-run typecheck**

Run: `bun run typecheck`
Expected: same result as Step 2

### Task 2: Add a Mobile App Shell

**Files:**
- Create: `src/features/student-dashboard/components/student-dashboard-mobile-shell.tsx`
- Modify: `src/features/student-dashboard/components/student-dashboard-workspace.tsx`

- [ ] **Step 1: Add the mobile shell container**

Create `student-dashboard-mobile-shell.tsx`:

```tsx
import type { ReactNode } from "react";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";

import { StudentDashboardBottomDock } from "@/features/student-dashboard/components/student-dashboard-bottom-dock";

export function StudentDashboardMobileShell({
  activePage,
  announcementUnreadCount,
  children,
  dockItems,
  onPageChange,
  rightSlot,
  titleSlot,
}: {
  activePage: "overview" | "assignments" | "scores" | "discussion" | "announcements" | "account";
  announcementUnreadCount: number;
  children: ReactNode;
  dockItems: Array<{ key: "overview" | "assignments" | "scores" | "discussion" | "account"; label: string; icon: ReactNode }>;
  onPageChange: (page: "overview" | "assignments" | "scores" | "discussion" | "announcements" | "account") => void;
  rightSlot: ReactNode;
  titleSlot: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f4f7fb] pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div className="min-w-0">{titleSlot}</div>
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-600">
              <NotificationsNoneOutlinedIcon fontSize="small" />
              {announcementUnreadCount > 0 ? (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--erg-red)] px-1 text-[10px] font-bold text-white">
                  {announcementUnreadCount}
                </span>
              ) : null}
            </div>
            {rightSlot}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">{children}</main>

      <StudentDashboardBottomDock activePage={activePage} items={dockItems} onPageChange={onPageChange} />
    </div>
  );
}
```

- [ ] **Step 2: Use `useIsMobile()` in the workspace**

Add:

```tsx
import { useIsMobile } from "@/hooks/use-mobile";
```

and:

```tsx
const isMobile = useIsMobile();
```

- [ ] **Step 3: Render the mobile shell only on mobile dashboard view**

Wrap the dashboard pages with a conditional mobile shell path while preserving the existing desktop render path:

```tsx
if (isMobile) {
  return (
    <StudentDashboardMobileShell
      activePage={activePage}
      announcementUnreadCount={unreadAnnouncementCount}
      dockItems={mobileDockItems}
      onPageChange={setActivePage}
      rightSlot={<MobileAccountTrigger ... />}
      titleSlot={<MobileBrandTitle ... />}
    >
      {renderCurrentDashboardPage()}
    </StudentDashboardMobileShell>
  );
}
```

- [ ] **Step 4: Run typecheck**

Run: `bun run typecheck`
Expected: no new errors from the shell integration

### Task 3: Rebuild the Overview Page for Mobile

**Files:**
- Create: `src/features/student-dashboard/components/student-dashboard-mobile-overview.tsx`
- Modify: `src/features/student-dashboard/components/student-dashboard-workspace.tsx`

- [ ] **Step 1: Add a mobile overview component**

Create a focused mobile overview renderer that accepts the same data the current overview uses:

```tsx
import { Button, Card } from "@/components/ui/dashboard-kit";

export function StudentDashboardMobileOverview(props: {
  copy: DashboardCopy;
  announcement: StudentTeacherAnnouncement | undefined;
  onOpenAssignment: (assignmentId: string) => void;
  onPageChange: (page: StudentPageKey) => void;
  openAssignments: StudentDashboardAssignment[];
  priorityAssignment: StudentDashboardAssignment;
  profile: StudentDashboardProfile;
}) {
  return (
    <div className="space-y-4">
      <Card className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{props.copy.heroEyebrow}</div>
        <h1 className="mt-3 text-[32px] font-black leading-[1.1] text-[#060b7a]">
          {props.copy.heroTitle(props.profile.name)}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {props.copy.heroDescription(props.priorityAssignment.title)}
        </p>
        <div className="mt-5 flex gap-3">
          <Button className="min-h-11 rounded-2xl bg-[#060b7a] px-4 text-white" onClick={() => props.onOpenAssignment(props.priorityAssignment.id)}>
            {props.copy.primaryAction}
          </Button>
          <Button variant="outline" className="min-h-11 rounded-2xl border-slate-200 bg-white px-4" onClick={() => props.onPageChange("assignments")}>
            {props.copy.secondaryAction}
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Move the mobile overview render behind `activePage === "overview"`**

In `student-dashboard-workspace.tsx`, use:

```tsx
const overviewContent = isMobile ? (
  <StudentDashboardMobileOverview
    copy={copy}
    announcement={pinnedAnnouncement}
    onOpenAssignment={openAssignment}
    onPageChange={setActivePage}
    openAssignments={openAssignments}
    priorityAssignment={priorityAssignment}
    profile={dashboardProfile}
  />
) : (
  <OverviewView ... />
);
```

- [ ] **Step 3: Add the priority/teacher notice cards in mobile form**

Extend the component with stacked cards for the priority schedule and today's tasks, reusing existing data:

```tsx
<Card className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm">
  <div className="flex gap-2">
    <CompactBadge>{props.copy.announcementPinnedLabel}</CompactBadge>
    <CompactBadge>{props.profile.className}</CompactBadge>
  </div>
  <h2 className="mt-4 text-2xl font-black text-[#060b7a]">{props.announcement?.title}</h2>
</Card>
```

- [ ] **Step 4: Run build**

Run: `bunx vite build`
Expected: PASS

### Task 4: Preserve Desktop and Final Verification

**Files:**
- Modify: `src/features/student-dashboard/components/student-dashboard-workspace.tsx`

- [ ] **Step 1: Keep the current desktop render path intact**

Ensure the existing desktop header and desktop views remain under the non-mobile branch:

```tsx
if (!isMobile) {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <StudentBrandHeader ... />
      {activePage === "overview" ? <OverviewView ... /> : null}
      ...
    </main>
  );
}
```

- [ ] **Step 2: Verify the mobile content does not hide behind the dock**

Use bottom padding on the mobile shell container:

```tsx
<div className="min-h-screen bg-[#f4f7fb] pb-28">
```

- [ ] **Step 3: Run typecheck**

Run: `bun run typecheck`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `bunx vite build`
Expected: PASS

- [ ] **Step 5: Manual mobile verification**

Open the mobile viewport and verify:

```text
1. Overview opens in a compact app-like layout
2. Bottom dock stays visible and reachable
3. Switching dock items updates the page
4. Content is not hidden behind the dock
5. Desktop layout still matches the previous experience
```
