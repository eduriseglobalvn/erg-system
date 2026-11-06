import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { QuizPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { applyLabel, enCopy, viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
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

function renderDialog(value: QuizPlayerTemplate, extra: { questionCount?: number; onApply?: (next: QuizPlayerTemplate) => void } = {}) {
  const onApply = extra.onApply ?? vi.fn();
  const tree = (open: boolean) => (
    <I18nProvider>
      <ErgMuiProvider>
        <QuizThemeDialog open={open} value={value} questionCount={extra.questionCount} onClose={vi.fn()} onApply={onApply} />
      </ErgMuiProvider>
    </I18nProvider>
  );
  const view = render(tree(true));
  return { ...view, setOpen: (open: boolean) => view.rerender(tree(open)) };
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

  it("does not warn about the selected-option text on ERG Xanh with the contrast tone", () => {
    // The preview draws dark getContrastText on the pale fill; measuring the tone's white text gave a phantom 1.1:1 fail.
    renderDialog({ ...applyQuizThemePreset(saved, defaultQuizThemePreset), backgroundTone: "contrast" });
    expect(screen.getByText("Đạt WCAG AA")).toBeInTheDocument();
  });

  it("collapses layout, option and sound sections by default", () => {
    renderDialog(saved);
    for (const name of ["Bố cục", "Phương án và nút", "Âm thanh"]) {
      expect(screen.getByRole("button", { name: new RegExp(name) })).toHaveAttribute("aria-expanded", "false");
    }
  });
});

const preview = () => screen.getByRole("region", { name: "Xem trước" });
const accentGroup = () => within(screen.getByRole("group", { name: "Màu nhấn" }));

describe("applyLabel", () => {
  it("names the question count and falls back to a bare verb", () => {
    expect(applyLabel(20)).toBe("Áp dụng cho 20 câu");
    expect(applyLabel(0)).toBe("Áp dụng");
    expect(applyLabel(undefined)).toBe("Áp dụng");
    expect(applyLabel(1, enCopy)).toBe("Apply to 1 question");
    expect(applyLabel(2, enCopy)).toBe("Apply to 2 questions");
    expect(viCopy.apply).toBe("Áp dụng");
  });
});

describe("QuizThemeDialog preview toggles", () => {
  it("tags nothing in the default playing state", () => {
    renderDialog(saved);
    expect(within(preview()).queryByText("Bạn chọn")).toBeNull();
    expect(within(preview()).queryByText("Đáp án đúng")).toBeNull();
  });

  it("shows the wrong pick and the right answer in the Sai state", () => {
    renderDialog(saved);
    fireEvent.click(screen.getByRole("button", { name: "Sai" }));
    expect(within(preview()).getByText("Bạn chọn")).toBeInTheDocument();
    expect(within(preview()).getByText("Đáp án đúng")).toBeInTheDocument();
  });

  it("tags only the right answer in the Đúng state", () => {
    renderDialog(saved);
    fireEvent.click(screen.getByRole("button", { name: "Đúng" }));
    expect(within(preview()).getByText("Đáp án đúng")).toBeInTheDocument();
    expect(within(preview()).queryByText("Bạn chọn")).toBeNull();
  });

  it("switches the preview frame between phone and desktop", () => {
    renderDialog(saved);
    const frame = () => preview().querySelector("[data-device]");
    expect(frame()).toHaveAttribute("data-device", "desktop");
    fireEvent.click(screen.getByRole("button", { name: "Điện thoại" }));
    expect(frame()).toHaveAttribute("data-device", "phone");
    fireEvent.click(screen.getByRole("button", { name: "Máy tính" }));
    expect(frame()).toHaveAttribute("data-device", "desktop");
  });
});

describe("QuizThemeDialog footer", () => {
  it("labels the apply button with the question count", () => {
    renderDialog(saved, { questionCount: 20 });
    expect(screen.getByRole("button", { name: "Áp dụng cho 20 câu" })).toBeInTheDocument();
  });

  it("has exactly one contained button", () => {
    renderDialog(saved, { questionCount: 20 });
    expect(screen.getByRole("dialog").querySelectorAll(".MuiButton-contained")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Áp dụng cho 20 câu" }).className).toContain("MuiButton-contained");
    expect(screen.getByRole("button", { name: "Hủy" }).className).toContain("MuiButton-outlined");
    expect(screen.getByRole("button", { name: "Về mặc định" }).className).toContain("MuiButton-text");
  });

  it("discards draft edits on Hủy: onApply stays unused and reopening shows the saved color", () => {
    const onApply = vi.fn();
    const { setOpen } = renderDialog(saved, { onApply });
    fireEvent.click(accentGroup().getByRole("button", { name: "Rừng xanh" }));
    expect(accentGroup().getByRole("button", { name: "Rừng xanh" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    expect(onApply).not.toHaveBeenCalled();
    setOpen(false);
    setOpen(true);
    expect(accentGroup().getByRole("button", { name: "Rừng xanh" })).toHaveAttribute("aria-pressed", "false");
  });

  it("resets the draft to the default preset and applies it", () => {
    const onApply = vi.fn();
    const custom = { ...saved, accentColor: "#16a34a", layout: "split" as const };
    renderDialog(custom, { onApply, questionCount: 20 });
    fireEvent.click(screen.getByRole("button", { name: "Về mặc định" }));
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng cho 20 câu" }));
    expect(onApply).toHaveBeenCalledWith(applyQuizThemePreset(custom, defaultQuizThemePreset));
  });
});

describe("QuizThemeDialog right/wrong options on the dark contrast tone", () => {
  const dark = { ...saved, backgroundTone: "contrast" as const };
  const colorOf = (text: string) => getComputedStyle(within(preview()).getByText(text).parentElement!).color;

  it.each([
    ["Đúng", ["SUM"]],
    ["Sai", ["SUM", "COUNT"]],
  ])("keeps the %s option text dark, not the white tone text", (stateName, options) => {
    renderDialog(dark);
    const whiteText = colorOf("AVERAGE");
    fireEvent.click(screen.getByRole("button", { name: stateName }));
    for (const option of options) {
      expect(colorOf(option)).not.toBe(whiteText);
      expect(colorOf(option)).not.toBe("");
    }
  });
});
