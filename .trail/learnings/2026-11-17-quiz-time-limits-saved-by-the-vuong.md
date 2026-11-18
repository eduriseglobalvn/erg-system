---
title: "Quiz time limits saved by the editor are MM:SS behind a switch, but the player only reads whole minutes"
author: Vuong
date: 2026-11-17
branch: feat/role-consolidation
cost: { minutes: 66, tokens: 634244 }
id: l-843dc3a9
scope: repo
status: active
src: agent
touches:
  - src-tauri/tauri.player.conf.json
  - test-logs/2026-11-staging/runs/portable-exe.md
  - src/features/elearning/portable-exam/components/portable-artifact-app.tsx
  - src/features/elearning/portable-exam/api/portable-exam-runtime.ts
  - src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-normalizer.ts
  - src/features/lcms/quiz/quiz-editor/api/quiz-editor-normalizers.ts
  - src/features/elearning/portable-exam/types/portable-exam-types.ts
  - src/features/portable-package-export/api/portable-package-download.ts
  - src/features/elearning/portable-exam/components/portable-exam-error-message.ts
---

## Decided
The exam Player (offline .ergquiz) converts the editor's time limit itself, so tests count down there. The online web player still has no countdown for editor-made quizzes; the fix belongs in the shared runtime normalizer and was handed to the FE lead.

## Watch out
The editor stores settings as enableTimeLimit: true + timeLimit "30:00" (minutes:seconds). The runtime normalizer only reads timeLimitMinutes / maxDurationMinutes, and the backend does not convert either, so the timer silently disappears. Once the normalizer reads timeLimit, remove the Player's own conversion.

In the code:
- src/features/lcms/quiz/quiz-runtime/api/quiz-runtime-package-normalizer.ts (timeLimitMinutes line)
- src/features/elearning/portable-exam/api/portable-exam-runtime.ts editorTimeLimitMinutes
- src/features/lcms/quiz/quiz-editor/api/quiz-editor-normalizers.ts timeLimitValue (writes "MM:00")
