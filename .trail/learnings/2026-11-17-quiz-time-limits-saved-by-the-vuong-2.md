---
title: "Quiz time limits saved by the editor are MM:SS behind a switch; the shared runtime normalizer converts them"
author: Vuong
date: 2026-11-17
branch: feat/role-consolidation
cost: { minutes: 2, tokens: 10754 }
id: l-b8663bbb
scope: repo
status: active
replaces: l-843dc3a9
src: agent
touches:
  - test-logs/2026-11-staging/runs/portable-exe.md
  - src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-normalizer.ts
  - src/features/lcms/quiz/quiz-editor/api/quiz-editor-normalizers.ts
---

## Decided
The editor saves the limit as enableTimeLimit: true + timeLimit "30:00" (minutes:seconds). The shared runtime normalizer converts it to whole minutes (rounded up), so the online player and the offline exam Player both count down. The Player has no conversion of its own any more.

## Tried and ruled out
A Player-only conversion: it left the online web player without a timer for the same quizzes.

## Watch out
Before this fix the timer disappeared silently: no error, just no countdown. The backend does not convert the value either.

In the code:
- src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-normalizer.ts editorTimeLimitMinutes
- src/features/lcms/quiz/quiz-editor/api/quiz-editor-normalizers.ts timeLimitValue (writes "MM:00")
