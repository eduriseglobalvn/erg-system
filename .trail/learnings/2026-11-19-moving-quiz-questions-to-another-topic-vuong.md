---
title: Moving quiz questions to another topic saves the target first and only then removes them here
author: Vuong
date: 2026-11-19
branch: fix/student-import-codes
cost: { minutes: 11, tokens: 160087 }
id: l-36868025
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/school-management/components/student-import-utils.test.ts
  - src/features/lcms/school-management/components/student-import-utils.ts
  - src/features/lcms/quiz/quiz-editor/hooks/use-move-questions.tsx
  - src/features/lcms/quiz/quiz-editor/components/quiz-list/question-table.tsx
---

## Decided
- "Chuyển sang…" in the quiz editor first saves the questions into the target topic's quiz (and creates that quiz if the topic has none). Only after that save succeeds does it remove them from the open quiz, and autosave then persists the removal. If the save fails, the questions stay where they were, so nothing is lost.
- Slide ids are unique only within one quiz. Moved slides whose id collides with one in the target are given a new id, and the selection is reset whenever the topic changes.

## Watch out
- The workspace test mocks `useQuizEditorScope` with a hand-written object. A new field the workspace reads from scope has to be added to that mock, or every workspace test fails with "reading 'find' of undefined".
- It is not yet confirmed that erg-spring accepts a draft tree containing slides that came from another quiz.

In the code: hooks/use-move-questions.tsx, hooks/move-questions-to-topic.ts, model/move-slides.ts (appendMovedSlides), components/quiz-editor-workspace.picker.test.tsx (scope mock), all under src/features/lcms/quiz/quiz-editor.
