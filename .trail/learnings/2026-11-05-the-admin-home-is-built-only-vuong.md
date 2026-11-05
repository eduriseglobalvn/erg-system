---
title: "The admin home is built only from live school, learner and staff records"
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 21, tokens: 527164 }
id: l-75bbad87
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/admin-home/admin-home-model.ts
  - src/features/lcms/admin-home/use-admin-home-data.ts
  - src/features/lcms/admin-home/admin-home-model.test.ts
  - src/features/lcms/admin-home/admin-home-schools.tsx
  - src/features/lcms/admin-home/admin-home-workspace.tsx
  - src/routes/portals/admin-routes.tsx
---

## Decided
"Trang chủ" (/admin) is a real page again. An earlier router refactor sent /admin to Tài nguyên because the old home (AdminOverview) only had sample data. The new home reads the school directory, each school's operations (classes, learners and their subjects), and the staff list. Its "Cần xử lý" queue lists only gaps those records show: schools with no learners, learners with no subject, classes with no homeroom teacher, and active staff who never signed in.

## Tried and ruled out
- Reusing the legacy AdminOverview (variant "admin-overview"). It is Tailwind, gets no data in the admin shell, and showed "Chưa có dữ liệu".
- Tiles for the question bank, quiz bank and calendar. The live data has 0 questions and 0 quiz packages. The calendar API also rejects a 42-day range until the backend change is deployed.

## Watch out
The page asks for operations once per school, using the same cache as Quản lý trường học, for up to 20 schools. Past that it needs a backend summary endpoint.

In the code: src/features/lcms/admin-home/ (the model has the tests), the route is adminIndexRoute in src/routes/portals/admin-routes.tsx, and the route snapshot was updated.
