---
title: Quiz editor drafts saved only on this device can be lost silently
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 18, tokens: 302653 }
id: l-745d64fb
scope: repo
status: active
src: agent
touches:
  - src/features/lcms/quiz/quiz-editor/api/quiz-editor-local-draft.ts
  - src/styles/globals.css
---

## Decided
Nothing is decided yet. The quiz editor redesign proposal (version 7, waiting for the owner's approval) suggests: save every change on the device first, then send it to the server on its own about 2 seconds after the last edit; show an offline state; keep a queue of changes to resend; and ask which copy to keep when the server rejects a save with 409. Publishing stays online only.

## Tried and ruled out
Moving more image or draft data into the current device store. It is localStorage, which holds only about 5 MB, so images fill it fast.

## Watch out
- Drafts saved on the device are deleted after 7 days, even if they were never sent to the server.
- Saving to localStorage does not catch the error when storage is full. Once images are added, autosave stops without telling anyone.
- The draft only reaches the server when someone clicks "Lưu nháp". There is no offline detection.
- When two tabs or machines edit the same quiz, the server rejects the stale save with 409 STALE_DRAFT, but the UI only shows an error toast.
- The "Chủ đề" (topic) column shows the toolbar filter label on every row. Questions have no topic of their own; the topic belongs to the whole quiz.

In the code:
- Device save: src/features/lcms/quiz/quiz-editor/api/quiz-editor-local-draft.ts (LOCAL_DRAFT_MAX_AGE_MS; saveLocalQuizDraft has no try/catch).
- Autosave and recovery: hooks/use-quiz-editor-draft-recovery.ts.
- Save and publish to the server: hooks/use-quiz-editor-save-publish.ts.
- Server check: erg-spring QuizDraftService throws StaleDraftException.
- Topic label: components/question-manager-table.tsx (topicLabel).
