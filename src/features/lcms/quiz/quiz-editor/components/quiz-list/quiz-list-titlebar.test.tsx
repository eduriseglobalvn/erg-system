import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createMockPlayerTemplate } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-project-defaults";
import { viCopy } from "@/features/lcms/quiz/quiz-theme/quiz-theme-copy";
import { applyQuizThemePreset, quizThemePresets } from "@/features/lcms/quiz/quiz-theme/quiz-theme-presets";
import { I18nProvider } from "@/platform/i18n";
import { QuizListTitlebar } from "./quiz-list-titlebar";

const playerTemplate = createMockPlayerTemplate();
const notReady = [{ slideId: "s2", number: 2, title: "", label: "Chưa có đề bài" }];

function renderBar(props: Partial<Parameters<typeof QuizListTitlebar>[0]> = {}) {
  const handlers = { onPublish: vi.fn(), onOpenQuestion: vi.fn(), onDismissPublishFailure: vi.fn(), onApplyTheme: vi.fn() };
  render(
    <I18nProvider>
    <QuizListTitlebar
      courseOptions={[]}
      levelOptions={[]}
      notReady={[]}
      onChangeCourse={vi.fn()}
      onChangeLevel={vi.fn()}
      publishBlockedReason={null}
      publishFailure={null}
      publishReadinessOnly={false}
      isPublishing={false}
      selectedCourseId=""
      selectedLevelId={null}
      syncChip={null}
      {...handlers}
      playerTemplate={playerTemplate}
      questionCount={0}
      themeDisabled={false}
      {...props}
    />
    </I18nProvider>,
  );
  return handlers;
}

describe("QuizListTitlebar publish", () => {
  it("publishes when nothing blocks it", () => {
    const { onPublish } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Xuất bản" }));
    expect(onPublish).toHaveBeenCalledTimes(1);
  });

  it("keeps the button clickable when only readiness blocks it: the popover lists the questions and opens one", async () => {
    const { onPublish, onOpenQuestion } = renderBar({ notReady, publishBlockedReason: "Còn 1 câu chưa sẵn sàng", publishReadinessOnly: true });
    const button = screen.getByRole("button", { name: "Xuất bản" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);
    expect(onPublish).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Còn 1 câu chưa sẵn sàng" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Câu 2: (Chưa có đề bài) — Chưa có đề bài" }));

    expect(onOpenQuestion).toHaveBeenCalledWith("s2");
    await waitFor(() => expect(screen.queryByText("Còn 1 câu chưa sẵn sàng")).toBeNull());
  });

  it("disables the button for offline, with the reason as its tooltip", async () => {
    renderBar({ publishBlockedReason: "Cần có mạng để xuất bản." });
    const button = screen.getByRole("button", { name: "Xuất bản" });
    expect(button).toBeDisabled();
    fireEvent.mouseOver(button.parentElement!);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Cần có mạng để xuất bản.");
  });

  it("shows the server's reason and its detail lines under the bar, until dismissed", () => {
    const { onDismissPublishFailure } = renderBar({ publishFailure: { kind: "server", message: "Không xuất bản được", items: ["Câu 2 thiếu đáp án", "Câu 3 thiếu đề bài"] } });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Máy chủ chưa cho xuất bản.");
    expect(alert).toHaveTextContent("Không xuất bản được");
    expect(alert).toHaveTextContent("Câu 2 thiếu đáp án");
    expect(alert).toHaveTextContent("Câu 3 thiếu đề bài");
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onDismissPublishFailure).toHaveBeenCalledTimes(1);
  });

  it("a lost connection is not a server refusal: no red, and a retry that publishes again", () => {
    const { onPublish } = renderBar({ publishFailure: { kind: "network", message: "Failed to fetch", items: [] } });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Mất kết nối, chưa xuất bản.");
    expect(alert).not.toHaveTextContent("Máy chủ chưa cho xuất bản.");
    expect(alert).not.toHaveTextContent("Failed to fetch");
    expect(alert).not.toHaveClass("MuiAlert-standardError");
    const retry = screen.getByRole("button", { name: "Thử lại" });
    expect(retry).toHaveClass("MuiButton-text");
    fireEvent.click(retry);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });
});

describe("QuizListTitlebar theme", () => {
  it("opens the shared theme dialog and hands the applied template to onApplyTheme", async () => {
    const { onApplyTheme } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "Giao diện bài" }));
    const preset = quizThemePresets.find((item) => JSON.stringify(applyQuizThemePreset(playerTemplate, item)) !== JSON.stringify(playerTemplate))!;
    // The library card comes first; a "customize from" row may repeat the name.
    fireEvent.click((await screen.findAllByRole("button", { name: new RegExp(`^${viCopy.presets[preset.id]}`) }))[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(onApplyTheme).toHaveBeenCalledTimes(1);
    expect(onApplyTheme).toHaveBeenCalledWith(applyQuizThemePreset(playerTemplate, preset));
    expect(onApplyTheme).not.toHaveBeenCalledWith(playerTemplate);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("cannot be opened while the draft is not ready, so no dialog pops up later", () => {
    renderBar({ themeDisabled: true });
    expect(screen.getByRole("button", { name: "Giao diện bài" })).toBeDisabled();
  });
});
