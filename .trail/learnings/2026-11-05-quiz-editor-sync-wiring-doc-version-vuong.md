---
title: "Quiz editor sync wiring: doc version and publish"
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 2, tokens: 73000 }
id: l-4382707d
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/quiz/quiz-editor/hooks/use-quiz-editor-save-publish.ts
---

## Decided
- The document passed to useQuizDraftSync keeps quizId/draftId/docVersion from the last hydrated document (use-quiz-editor-sync.ts `base`), not the hook's live `docVersion`. The live value changes after every save; a changed document counts as an edit, so every save would schedule another save forever. The engine sends `baseDocVersion` from its own record, so the document's docVersion only matters before a record exists.
- After publish the frontend does NOT bump the engine's base doc version. erg-spring QuizPublishService.publish never saves the draft, so the draft docVersion stays the same; bumping it by 1 would make the next autosave fail with 409 STALE_DRAFT and open the conflict dialog after every publish.
- The draft query used to start the engine runs with staleTime 0 and waits for isFetchedAfterMount. A cached server copy can be older than this tab's own autosaves; the engine prefers the server copy when the device record is clean, so a stale cache would show old content and later 409.

## Watch out
- useQuizEditorPublish reads status/docVersion after `await flushNow()` from a ref set in useLayoutEffect. It relies on React flushing the store update (SyncLane microtask) before the awaiting code runs; the test runs without act() to cover that.
