import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migratedSources = [
  "assign-homework-footer.tsx",
  "assign-homework-student-utils.tsx",
  "student-attendance-context-menu.tsx",
  "assign-date-time-picker.tsx",
  "assign-homework-desktop-view.tsx",
  "assign-homework-desktop-view/class-target-card.tsx",
  "assign-homework-desktop-view/grade-target-card.tsx",
  "assign-homework-desktop-view/group-target-card.tsx",
  "assign-homework-desktop-view/resource-step.tsx",
  "assign-homework-desktop-view/target-card-layout.tsx",
  "assign-homework-mobile-view.tsx",
  "assign-homework-parts.tsx",
  "attendance/mobile-attendance-sheet-panel.tsx",
  "exercise-bank/create-exercise-dialog.tsx",
  "exercise-bank/create-exercise/create-exercise-footer.tsx",
  "exercise-bank/create-exercise/create-exercise-header.tsx",
  "exercise-bank/create-exercise/filter-dropdown.tsx",
  "exercise-bank/create-exercise/pick-filter-bar.tsx",
  "exercise-bank/create-exercise/pick-question-list.tsx",
  "exercise-bank/create-exercise/setup-form.tsx",
  "exercise-bank/create-exercise/setup-preview.tsx",
  "exercise-bank/desktop-exercise-bank-view.tsx",
  "exercise-bank/desktop-view/exercise-badges.tsx",
  "exercise-bank/desktop-view/exercise-bank-header.tsx",
  "exercise-bank/desktop-view/exercise-inspector.tsx",
  "exercise-bank/desktop-view/exercise-list-toolbar.tsx",
  "exercise-bank/desktop-view/exercise-table.tsx",
  "exercise-bank/exercise-question-detail-dialog.tsx",
  "exercise-bank/mobile-exercise-bank-view.tsx",
  "homework-progress-page.tsx",
  "lms-notification-detail-page.tsx",
  "lms-teacher-shell.tsx",
  "lms-ui.tsx",
  "score/mobile-score-sheet-panel.tsx",
  "student-groups-page.tsx",
  "student-groups-parts.tsx",
  "../learning-resources/components/learning-resource-library-page.tsx",
  "../learning-resources/components/learning-resource-login-page.tsx",
  "../learning-resources/components/learning-resource-slide-viewer-modal.tsx",
  "../learning-resources/components/learning-resource-viewer-modal.tsx",
  "../learning-resources/components/library-page/category-tree.tsx",
  "../learning-resources/components/library-page/empty-state.tsx",
  "../learning-resources/components/library-page/explorer.tsx",
  "../learning-resources/components/library-page/mobile-explorer.tsx",
  "../learning-resources/components/library-page/resource-explorer-icon.tsx",
  "../learning-resources/components/pdf-resource-viewer.tsx",
];

describe("LMS ERG MUI migration policy", () => {
  it.each(migratedSources)("keeps %s free of legacy UI and Tailwind", (fileName) => {
    const source = readFileSync(resolve(process.cwd(), "src/features/lms/components", fileName), "utf8");

    expect(source).not.toContain("lucide-react");
    expect(source).not.toContain("@/components/ui/");
    expect(source).not.toMatch(/className\s*=/);
  });
});
