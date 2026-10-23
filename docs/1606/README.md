# docs/1606 — Quiz Editor Audit & Redesign

This folder contains the full assessment of the current LCMS quiz editor, the MUI v9 rebuild plan, and a detailed redesign proposal.

## Status: Phase 2 In Progress ✅

**Completed:**
- ✅ Phase 0: MUI v9 shell scaffold (header, mode tabs, outline, status bar)
- ✅ Phase 1: Data grid slide manager, settings mode (7 tabs), design mode, preview mode, publish mode, results mode
- ✅ Phase 2 START: **Question Inspector** — real editing form replacing placeholder
- ✅ Phase 2 START: **Question Type Palette** — 14 question type cards with click-to-add
- ✅ Build/Settings/Design/Preview/Publish/Results modes all functional

**In Progress:**
- 🔄 Phase 2: Card Canvas view (replacing Data Grid as default)
- 🔄 Phase 2: Drag-and-drop reordering in outline
- 🔄 Phase 2: Choice editor for MC/MA/TF in inspector (DONE ✓)
- 🔄 Phase 2: Student preview toggle inside inspector

## Files

| File | Purpose |
|------|---------|
| `quiz-editor-audit.md` | Detailed audit of original quiz-editor UI, source code, functional coverage, gaps, and risks. |
| `quiz-editor-rebuild-plan.md` | Step-by-step rebuild plan using MUI v9 — architecture, phases, file structure, acceptance criteria. |
| `quiz-editor-ui-inventory.md` | Complete inventory of every visible control, panel, dialog, and flow in the original UI. |
| **`quiz-editor-redesign-proposal.md`** | **🔴 KEY DOC — Redesign proposal based on live scan. Identifies 3 critical UX problems and proposes card-canvas + inspector-editor + drag-and-drop type palette.** |

## Screenshots — Original UI

| File | Description |
|------|-------------|
| `quiz-editor-01-main.png` through `quiz-editor-14-question-edit-multiple-choice.png` | Original classic-editor UI screenshots |

## Screenshots — Current Phase 0/1 → Phase 2 Scaffold

| File | Description |
|------|-------------|
| `current-ui-01-full-page.png` | Full page screenshot of Phase 0/1 scaffold |
| `current-ui-v2-build-mode.png` | Build mode — 3-column layout |
| `current-ui-v2-edit-question.png` | After clicking edit on a question |
| `current-ui-v2-settings-tab.png` | Settings tab with 7 sub-tabs |
| **`v2-inspector-phase2-01.png`** | **NEW — Inspector showing "scaffold" placeholder (BEFORE)** |
| **`current-ui-v2-build-mode.png`** | **Build mode with Data Grid** |
| **`v2-inspector-mc-question.png`** | **NEW — Inspector with real Choice Editor (Multiple Response question)** |
| **`v2-inspector-feedback-tab.png`** | **NEW — Inspector Feedback tab (correct/incorrect feedback)** |
| **`v2-inspector-options-tab.png`** | **NEW — Inspector Options tab (score, shuffle, attempts)** |

## Key Implementation Files

| File | Description |
|------|-------------|
| `quiz-editor-v2/components/build/question-inspector.tsx` | **NEW — Inspector panel with 3 tabs (Content/Feedback/Options), Choice editor for MC/MA/TF** |
| `quiz-editor-v2/components/build/question-type-palette.tsx` | **NEW — Question type palette with 14 types, quick-grid + popover** |
| `quiz-editor-v2/components/build/slide-manager.tsx` | Data Grid with type/status/action columns (existing) |
| `quiz-editor-v2/components/build/slide-outline.tsx` | Slide outline tree with groups, filters, search (existing) |
| `quiz-editor-v2/components/build/add-slide-menu.tsx` | Dropdown menu for adding slides (existing) |
| `quiz-editor-v2/components/quiz-editor-v2-workspace.tsx` | **UPDATED — Inspector now uses real QuestionInspector component** |

## Quick Links

- Target page: `https://lcms.erg.edu.local:3001/quiz-editor`
- Redesign proposal: `quiz-editor-redesign-proposal.md`