# Quiz Editor — Audit & Assessment Report

> **Target URL:** `https://lcms.erg.edu.local:3001/quiz-editor`  
> **Audited:** 2026-06-16  
> **Auditor:** Senior Engineer review  
> **Scope:** Full UI/UX scan, source-code inventory, functional coverage, and enterprise readiness for a multi-student quiz authoring tool.

---

## 1. Executive Summary

The current quiz editor is a **feature-rich but UX-fractured “classic editor”** built on a custom CSS class system (`classic-editor.css`) with mixed shadcn/ui primitives and legacy MUI shells. It already supports **14 question types**, groups, intro slides, result slides, player templates, question bank integration, and a runtime player. However, the UI suffers from:

- Inconsistent layout language (PowerPoint-like slide editor + table manager + ribbon + sidebar all fighting for space).
- Non-standard enterprise patterns (custom “classic” CSS instead of a mature design system).
- Accessibility and mobile gaps.
- Tight coupling between authoring canvas and question data entry.
- Limited bulk operations, versioning, publishing workflow, and analytics for multi-student deployments.

**Verdict:** The *business logic and data model are sound* and should be preserved; the *presentation layer and interaction model need a ground-up rebuild* using MUI v9 as the single, enterprise-grade design system.

---

## 2. Screenshot Evidence

All screenshots are stored in `docs/1606/`:

| # | File | What it shows |
|---|------|---------------|
| 1 | `quiz-editor-01-main.png` | Full page landing state |
| 2 | `quiz-editor-02-overview.png` | Viewport overview |
| 3 | `quiz-editor-03-question-groups.png` | Manager table with all 15 rows |
| 5 | `quiz-editor-05-quiz-properties.png` | Quiz properties tab active |
| 6 | `quiz-editor-06-introduction-dialog.png` | Introduction slide picker dialog |
| 7 | `quiz-editor-07-quiz-properties-panel.png` | Quiz properties panel — Information tab |
| 8 | `quiz-editor-08-quiz-settings.png` | Quiz settings panel |
| 9 | `quiz-editor-09-quiz-results.png` | Quiz results / feedback panel + live preview |
| 10 | `quiz-editor-10-question-setup.png` | Default question settings panel |
| 11 | `quiz-editor-11-other-settings.png` | Password, domain, meta panel |
| 12 | `quiz-editor-12-preview.png` | Student preview mode (drag-drop question) |
| 13 | `quiz-editor-13-question-edit-dialog.png` | Question editor — intro slide form |
| 14 | `quiz-editor-14-question-edit-multiple-choice.png` | Question editor — multiple-response form |

---

## 3. Source-Code Inventory

> Generated from agent scan of `D:\ERG\erg-system\src\`.

### 3.1 File count & locations

- **94 files** touch the quiz editor feature.
- Core editor: `src/features/lcms/quiz/quiz-editor/` (~40 files).
- Shared player/renderers: `src/components/quiz/` (~13 files).
- Question bank: `src/features/lcms/quiz/question-bank/`.
- Runtime player: `src/features/lcms/quiz/quiz-runtime/`.
- Theme system: `src/features/lcms/quiz/quiz-theme/`.
- Routes: `src/routes/app-routes.tsx` (`/quiz-editor`).
- Navigation: `src/layouts/dashboard/config/dashboard-navigation.ts` ("Tạo Quiz" leaf).

### 3.2 Main workspace assembly

| File | Responsibility |
|------|----------------|
| `quiz-editor-workspace.tsx` | Page shell. Wires ribbon, outline, table, dialogs, preview, state hook. |
| `quiz-editor-ribbon.tsx` / `form-view-ribbon.tsx` | Top toolbar: add question/intro, properties, player template, preview, publish. |
| `quiz-editor-outline.tsx` | Left sidebar: title, grouping/filter, search, group tree. |
| `question-manager-table.tsx` | Main table: list of all slides with type, title, feedback, group, score, media, edit. |
| `question-editor-dialog.tsx` | Full-screen modal for editing a single question. |
| `quiz-properties-dialog.tsx` | Quiz-wide settings modal with 5 tabs. |
| `player-template-dialog.tsx` | Player appearance & theme settings. |
| `slide-preview-dialog.tsx` | Preview/publish dialog. |
| `learner-question-authoring-preview.tsx` | Inline learner preview inside the editor. |

### 3.3 Data model (highlights from `types/quiz-editor-types.ts`)

- `QuestionType` union = 14 types:
  - `multiple-choice`, `multiple-response`, `true-false`, `short-answer`, `numeric`, `sequence`, `matching`, `fill-in-the-blanks`, `select-from-lists`, `drag-the-words`, `hotspot`, `drag-and-drop`, `likert-scale`, `essay`.
- `QuizEditorSlide` = core slide/question entity.
- `QuizEditorGroup` = slide grouping with optional randomization.
- `QuizProjectSettings` = info, settings, result, questionDefaults, others.
- `QuizPlayerTemplate` = layout, colors, sound, toolbars, panels.

### 3.4 Runtime question components

| Component | File | Types handled |
|-----------|------|---------------|
| `SingleChoiceQuestion` | `single-choice-question.tsx` | single_choice, true_false |
| `MultipleResponseQuestion` | `multiple-response-question.tsx` | multiple_response |
| `ShortAnswerQuestion` | `text-response-question.tsx` | short_answer |
| `NumericQuestion` | `text-response-question.tsx` | numeric |
| `FillBlankQuestion` | `text-response-question.tsx` | fill_blank |
| `EssayQuestion` | `text-response-question.tsx` | essay |
| `MatchingQuestion` | `matching-question.tsx` | matching |
| `SequenceQuestion` | `sequence-question.tsx` | sequence |
| `InlineChoiceQuestion` | `inline-choice-question.tsx` | inline_choice, select_from_lists |
| `DragWordsQuestion` | `drag-words-question.tsx` | drag_words |
| `HotspotQuestion` | `hotspot-question.tsx` | hotspot |
| `DragDropQuestion` | `drag-drop-question.tsx` | drag_drop |
| `LikertQuestion` | `likert-question.tsx` | likert_scale |
| `QuestionRenderer` | `question-renderer.tsx` | dispatcher |

---

## 4. Functional Coverage Assessment

### 4.1 What already exists

| Capability | Status | Notes |
|------------|--------|-------|
| 14 question types | ✅ Strong | All major K-12/higher-ed question types present. |
| Slide intro/user-info/instruction | ✅ Present | 3 intro slide kinds. |
| Groups / sections | ✅ Present | With random-count rules. |
| Score & feedback per question | ✅ Present | Positive/negative points, per-result feedback. |
| Branching | ✅ Basic | Next question / finish quiz / none. |
| Quiz settings | ✅ Present | Passing rate, time limit, shuffle, submission. |
| Result page settings | ✅ Present | Pass/fail messages, statistics, links. |
| Password / domain protection | ✅ Present | In “Others” tab. |
| Player templates / themes | ✅ Present | Layout presets + color themes. |
| Live preview | ✅ Present | Student-view preview with correct/incorrect tabs. |
| Question bank import | ✅ Present | Converts bank questions to editor slides. |
| Runtime player | ✅ Present | IndexedDB attempt persistence, local grading. |
| Drag-and-drop authoring | ✅ Present | For items and media positioning. |

### 4.2 What is missing or weak for enterprise multi-student use

| Capability | Gap | Severity |
|------------|-----|----------|
| Bulk operations | No multi-select, bulk delete, bulk move, bulk scoring | High |
| Versioning / history | No revision history, undo is per-session only | High |
| Role-based permissions | No “reviewer”, “co-author”, “read-only” roles | High |
| Publishing workflow | “Xuất bản” is a single button; no draft/staging/live states | High |
| Assignment to classes/students | No direct assignment from editor | High |
| Scheduling / availability | No open/close dates per quiz | High |
| Attempt analytics | Result management is button-only; no rich analytics | Medium |
| Tagging / taxonomy | No question tags, difficulty, Bloom taxonomy | Medium |
| Item analysis | No discrimination index, p-value, distractor analysis | Medium |
| Collaborative editing | No real-time cursors / locks | Medium |
| Question pooling | Random draw from pool per attempt is not visible | Medium |
| Accessibility (a11y) | Custom CSS buttons lack focus rings, aria labels inconsistent | Medium |
| Mobile authoring | Layout breaks on small viewports | Medium |
| Import/export standards | No QTI, GIFT, CSV, Moodle XML import/export | Medium |
| Rich text editor | Title/feedback use plain textboxes, no WYSIWYG | Medium |
| Media library | “Add image” is local upload only; no asset manager | Medium |
| Comments / review | No in-context commenting for QA | Low |
| LaTeX / math | Formula button disabled | Low |
| Audio/video | Buttons disabled | Low |

---

## 5. UI/UX Detailed Findings

### 5.1 Layout architecture

The current layout is a **4-zone classic desktop app**:

```
+--------------------------------------------------+
| Sidebar | Ribbon Toolbar                         |
|         +----------------------------------------+
|         | Outline | Manager Table / Editor Dialog|
|         |         +--------------------------------
|         |         | Status Bar                    |
+--------------------------------------------------+
```

**Issues:**
- The ribbon + sidebar + table + dialogs create **visual overload**.
- The manager table is a **thin wrapper around slides**, not a true authoring canvas.
- The question editor dialog is **full-screen modal**, breaking the user’s spatial context.
- There is **no persistent preview pane**; preview is a separate dialog.

### 5.2 Top toolbar (ribbon)

Buttons observed:
- **Câu hỏi** — dropdown to add 14 question types.
- **Nhóm câu hỏi** — add/manage groups.
- **Giới thiệu** — add 3 intro slide types (with dialog).
- **Thuộc tính bài kiểm tra** — opens right property panel.
- **Giao diện player** — player template dialog.
- **Xem trước** — student preview dialog.
- **Xuất bản** — publish dialog.
- **Quản lý kết quả** — result management.

**Issues:**
- “Câu hỏi”, “Nhóm câu hỏi”, “Giới thiệu” are conceptually the same action (**Add slide**) but split across 3 buttons.
- “Xem trước” and “Xuất bản” are primary actions but visually grouped with secondary settings.
- No **global save / undo / redo** in the top bar.
- Icons are inconsistent (some disabled media buttons: Ghi chú, Công thức, Âm thanh, Video).

### 5.3 Left outline

Contains:
- Quiz title header.
- Sort by question type dropdown.
- Search box.
- Flat list of question type filters with counts.

**Issues:**
- The outline shows **question types**, not the actual slide tree.
- Groups are not visualized here; they only appear in the table.
- No drag-to-reorder at outline level.
- The “Sắp xếp câu hỏi theo” dropdown sorts but does not allow manual reordering.

### 5.4 Manager table

Columns: ID, Loại câu hỏi, Câu hỏi, Phản hỏi, Nhóm, Điểm, Media, Chỉnh sửa.

**Issues:**
- No row selection / multi-select.
- No inline editing.
- No drag-and-drop reorder in table.
- “Phản hồi” column always shows “Theo kết quả” or “Không” — not useful.
- “Media” shows file name or count, not thumbnail.
- Action buttons (Mở trình sửa, Nhân bản, Xóa) are only at the table header, not per row.

### 5.5 Question editor dialog

Structure:
- Header: title + breadcrumb (group / type) + close.
- Ribbon: Clipboard, Font, Score, Feedback, Insert, Preview.
- Canvas: live student preview + editable title/choices.
- Right sidebar: Media & settings, Answer content, Feedback & score, Question settings.
- Footer: Previous / Next, Save / Cancel.

**Issues:**
- The **canvas + form blend** is confusing: editable textboxes are overlaid on the preview, but sidebar also has form fields for the same data.
- “Phản hồi đúng / sai” tabs are easy to miss.
- Right sidebar is **overloaded**: 4 collapsible sections for a single question.
- No WYSIWYG for title/description.
- No bulk add for choices.

### 5.6 Quiz properties panel

5 tabs observed:
1. **Thông tin bài kiểm tra** — title, author, version, organization, intro layout.
2. **Cài đặt bài kiểm tra** — passing rate, time limit, shuffle, submission.
3. **Kết quả bài kiểm tra** — feedback mode, pass/fail messages, finish actions, live preview.
4. **Thiết lập câu hỏi** — default scores, shuffle, fonts, default feedback.
5. **Khác** — password, domain, meta.

**Issues:**
- Tabs are **nested inside a right panel** that competes with the outline.
- Settings are spread across tabs without clear mental model.
- Live preview is small and lacks device/responsive options.
- No “Save as draft / template” action.

### 5.7 Preview mode

- Opens as a dialog.
- Shows student player with navigation, question, correct/incorrect tabs.
- For drag-drop, shows 9 food items with drop zones.

**Issues:**
- Preview is **not side-by-side** with editor; context is lost.
- No way to preview a specific student persona (first attempt, retry, time-limited).
- No answer-key reveal for authors.

---

## 6. Design System Compliance

Per `CLAUDE.md`, the project targets:
- shadcn/ui + Radix, Tailwind v4, lucide-react, TanStack Router, sonner.
- **MUI is listed as REMOVED** (`❌ MUI`).

**However**, the current quiz editor still uses MUI-style class names (`MuiBox-root`, `css-*`) in some shells. The rebuild plan must decide whether to:
- (A) Keep MUI v9 as the single design system for the quiz editor only, or
- (B) Rebuild with shadcn/ui per global rules.

**User directive:** use MUI v9 for the rebuild. This must be reconciled with global `CLAUDE.md`; the plan proposes treating the quiz editor as a **self-contained module** where MUI v9 is explicitly adopted for its enterprise component density (Data Grid, Stepper, Rich Tree View, Date Pickers, etc.), with explicit project-memory update.

---

## 7. Performance & Technical Debt

| Concern | Evidence | Severity |
|---------|----------|----------|
| Large CSS file | `classic-editor.css` drives the whole UI | Medium |
| Mixed component libraries | shadcn + MUI class remnants + custom CSS | Medium |
| Snake_case vs kebab-case mapping | `QuestionType` vs runtime `kind` requires conversion | Low |
| Mock data only | `mock-quiz-editor-project.ts`, `mock-question-bank.ts` | Medium (backend readiness) |
| IndexedDB runtime | Attempt store exists but needs sync strategy | Medium |

---

## 8. Risk Summary

1. **Scope creep:** Rebuilding 14 question types + player is large; plan must be phased.
2. **Data migration:** Existing `QuizEditorSlide` schema should be preserved or versioned.
3. **User retraining:** Moving from table-centric to canvas/stepper-centric UX is significant.
4. **MUI license / bundle:** MUI v9 Pro/Premium components may add license cost if Data Grid Pro is used.
5. **Backend coupling:** Publishing/assignment features require backend endpoints not yet evident.

---

## 9. Conclusion

The current quiz editor is a **solid prototype with production ambitions** but is held back by custom CSS, fragmented UX, and missing enterprise workflow features. The recommended path is:

1. **Preserve** the data model, runtime player logic, and question-type renderers.
2. **Rebuild** the authoring shell using MUI v9 with a clear information architecture.
3. **Add** enterprise workflows: assignment, scheduling, versioning, analytics, roles.
4. **Iterate** in phases: shell → question manager → editor → preview/publish → analytics.

The detailed rebuild plan is in `quiz-editor-rebuild-plan.md`.
