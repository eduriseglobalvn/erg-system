import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QuizThemeDialog } from "@/features/lcms/quiz/quiz-theme/quiz-theme-dialog";
import { applyQuizThemePreset, defaultQuizThemePreset } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { I18nProvider } from "@/platform/i18n";
import { ErgMuiProvider } from "@/themes/ErgMuiProvider";

const saved: QuizPlayerTemplate = {
  layout: "classic",
  showToolbar: false,
  showPanel: true,
  roundedCorners: true,
  rolledPaper: true,
  backgroundTone: "soft-blue",
  playerSize: "standard",
  accentColor: "#0071e3",
  highlightColor: "#ebf4fe",
  soundEffect: "subtle",
  textLabels: true,
};

const pickPreset = (name: string) =>
  fireEvent.click(within(screen.getByRole("region", { name: "Thư viện theme" })).getByRole("button", { name: new RegExp(name) }));

function renderDialog(value: QuizPlayerTemplate) {
  return render(
    <I18nProvider>
      <ErgMuiProvider>
        <QuizThemeDialog open value={value} onClose={vi.fn()} onApply={vi.fn()} />
      </ErgMuiProvider>
    </I18nProvider>,
  );
}

describe("QuizThemeDialog contrast", () => {
  it("shows the AA chip and a three-row contrast list for the default theme", () => {
    renderDialog(applyQuizThemePreset(saved, defaultQuizThemePreset));
    expect(screen.getByText("Đạt WCAG AA")).toBeInTheDocument();
    const rows = within(screen.getByRole("list", { name: "Độ tương phản" })).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row).toHaveTextContent(/\d,\d:1/);
      expect(row).toHaveTextContent("Đạt");
    }
  });

  it("counts failing pairs and recovers when a preset is picked", () => {
    // #808080 gets white text from MUI's getContrastText (3.9:1), below the 4.5:1 minimum.
    renderDialog({ ...saved, accentColor: "#808080" });
    expect(screen.getByText("1 cặp màu chưa đạt AA")).toBeInTheDocument();
    expect(screen.getByText("Chưa đạt")).toBeInTheDocument();
    pickPreset("ERG Xanh");
    expect(screen.getByText("Đạt WCAG AA")).toBeInTheDocument();
  });

  it("keeps the chalkboard preset passing because the preview picks dark text on its amber accent", () => {
    renderDialog(saved);
    pickPreset("Bảng đen");
    expect(screen.getByText("Đạt WCAG AA")).toBeInTheDocument();
  });

  it("collapses layout, option and sound sections by default", () => {
    renderDialog(saved);
    for (const name of ["Bố cục", "Phương án và nút", "Âm thanh"]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toHaveAttribute("aria-expanded", "false");
    }
  });
});
