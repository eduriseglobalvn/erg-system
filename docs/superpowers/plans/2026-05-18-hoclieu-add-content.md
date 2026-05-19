# Hoclieu Add Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the LMS add-content modal so it supports separate lecture and exercise flows, with mock attachments rendered beside real resources.

**Architecture:** Keep backend taxonomy/resource APIs unchanged, add pure helper utilities plus mock exercise data, and move the modal UX to a two-step chooser so each content type gets its own form. Lecture and exercise submissions are stored locally in authoring state until real APIs are introduced.

**Tech Stack:** React 19, TypeScript, Bun test runner, existing dashboard/dialog primitives

---

### Task 1: Pure Content Helpers

**Files:**
- Create: `src/features/admin-operations/utils/hoclieu-content-dialog.ts`
- Create: `src/features/admin-operations/utils/hoclieu-content-dialog.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Write minimal implementation**
- [ ] **Step 4: Run test to verify it passes**

### Task 2: Mock Exercise Source

**Files:**
- Create: `src/features/admin-operations/api/mock-exercise-library.ts`

- [ ] **Step 1: Add mock exercise records with subject/topic/section metadata**
- [ ] **Step 2: Export lightweight helpers for current dialog filtering**

### Task 3: Add-Content Dialog Refactor

**Files:**
- Modify: `src/features/admin-operations/components/hoclieu-authoring-workspace.tsx`

- [ ] **Step 1: Introduce local attachment state for lecture and exercise mock content**
- [ ] **Step 2: Replace the single-form taxonomy dialog with a two-step dialog**
- [ ] **Step 3: Keep taxonomy submission behavior intact**
- [ ] **Step 4: Add lecture Google Slides link flow**
- [ ] **Step 5: Add exercise multi-select flow**

### Task 4: Workspace Integration and Verification

**Files:**
- Modify: `src/features/admin-operations/components/hoclieu-authoring-workspace.tsx`

- [ ] **Step 1: Merge local lecture/exercise attachments into the right-side attached-content panel**
- [ ] **Step 2: Run `bun test src/features/admin-operations/utils/hoclieu-content-dialog.test.ts`**
- [ ] **Step 3: Run `npm run typecheck`**
- [ ] **Step 4: Run `npm run build`**
