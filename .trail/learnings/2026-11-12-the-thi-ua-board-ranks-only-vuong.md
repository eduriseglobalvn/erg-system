---
title: "The Thi đua board ranks only by XP, never by scores, and its XP rules are fixed in the backend"
author: Vuong
date: 2026-11-12
branch: fix/student-portal-n12
cost: { minutes: 11, tokens: 142727 }
id: l-72b22e35
scope: repo
status: active
src: agent
touches:
  - contracts/backend/schema.graphqls
  - contracts/backend/schema.graphqls.lock.json
  - src/features/elearning/class-leaderboard/api/class-leaderboard-api.ts
  - src/features/elearning/class-leaderboard/api/class-leaderboard.graphql
  - src/features/elearning/class-leaderboard/components/class-leaderboard-page.tsx
  - src/features/elearning/class-leaderboard/components/class-leaderboard-table.tsx
  - src/features/elearning/class-leaderboard/components/leaderboard-podium.tsx
  - src/features/elearning/class-leaderboard/leaderboard-period.test.ts
  - src/features/elearning/class-leaderboard/leaderboard-period.ts
  - src/features/elearning/student-dashboard/components/student-dashboard-ranking-view.tsx
---

## Decided
- The class leaderboard was switched from average score to XP (design H03, Nov 2026) so no student's marks show to classmates.
- XP: an assignment counts once, on its first hand-in: min(40, 10 + round(1.5 x questions)), +10 if handed in on time. A streak of 7+ Vietnam-time days multiplies the period's XP by 1.2.
- Periods are week (Monday), month, and term (I: 1 Sep - 15 Jan, II: 16 Jan - 31 Aug), all in Asia/Ho_Chi_Minh. Scope is class or whole grade (same school, grade and year).
- A student can hide themselves; they still see their own row, and teachers see everyone.

## Tried and ruled out
- Not built yet: daily missions, levels, badges, class challenge, the +50 daily goal.

## Watch out
- The term boundaries are duplicated in the FE label helper; change both together.
- With grade scope, the backend checks the student belongs to the requested class itself, so a student cannot open another class's board.

In the code: erg-spring LeaderboardXp.java and ClassLeaderboardService.java; FE src/features/elearning/class-leaderboard/leaderboard-period.ts.
