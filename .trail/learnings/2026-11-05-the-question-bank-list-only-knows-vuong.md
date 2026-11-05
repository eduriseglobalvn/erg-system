---
title: "The question bank list only knows the current page, so topic counts and random pick cannot be trusted beyond it"
author: Vuong
date: 2026-11-05
branch: codex/mui-system-refactor
cost: { minutes: 29, tokens: 408775 }
id: l-56989fa0
scope: repo
status: active
src: agent
touches:
  - scripts/design-token-baseline.json
  - src/features/question-bank/components/question-bank-copy.ts
  - src/features/question-bank/components/question-bank-page-header.tsx
  - src/features/question-bank/components/question-bank-primitives.tsx
  - src/features/question-bank/components/question-bank-questions-view.tsx
  - src/features/question-bank/components/question-bank-topic-list.tsx
  - src/features/question-bank/components/question-bank-workspace-shell.tsx
---

## Decided
The question bank screen shows a question count only on the topic that is selected (the API total for the current filter). Random pick still chooses from the questions already loaded. Both stay this way until the backend can return per-topic counts and pick at random on the server.

## Tried and ruled out
Counting the questions of each topic in the browser. The list request already filters by topic and asks only for ready questions, at most 50 per page. Every topic other than the selected one would count 0, and the selected topic would stop at 50.

## Watch out
- Random pick only sees the loaded page, which is at most 50 questions of the current topic. With a topic selected, picking from other topics finds nothing.
- A visually hidden label inside a sticky table header cell must have left: 0 and top: 0. If not, it sits at its right-aligned position, outside the cell, and adds a horizontal scrollbar to the table.

In the code: src/features/question-bank/components/use-question-bank-workspace.ts (questionBankFilters: status "ready", topicId, size 50; autoPickCandidates, marked with a `shortcut:` comment); question-bank-topic-list.tsx (count on the active topic only); question-library.tsx (visuallyHidden).
