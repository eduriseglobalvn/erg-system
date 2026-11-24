---
title: "The game's class list comes from the same place as the class switcher at the top, not from the homework class list"
author: Vuong
date: 2026-11-24
branch: fix/game-picker
id: l-d7018719
scope: repo
status: active
src: agent
touches:
  - src/features/games/teacher/create-room-page.tsx
  - src/features/games/teacher/use-teacher-classes.ts
---

## Decided
The create-room page reads classes from the teacher shell's bootstrap (what the class switcher shows) and starts on the class picked there. It also loads the playable quizzes even before a class is known.

## Tried and ruled out
Reading classes from the homework workspace's classOptions. On production an account that saw class 9A1 in the switcher got an empty list there, so the page had no class, never asked the server for quizzes, and showed "Chưa chọn bài" with the next button disabled. The server side was fine: the quiz had an active published version with 4 playable questions and /sources answered 200.

## Watch out
Not confirmed on production yet whether the server accepts every switcher class for this account (canAccessClass); if it answers 403, the quiz list for that class stays empty.

In the code: src/features/games/teacher/use-teacher-classes.ts, create-room-page.tsx (sources query no longer waits for a class), storage key erg:lms-teacher-scope:v1.
